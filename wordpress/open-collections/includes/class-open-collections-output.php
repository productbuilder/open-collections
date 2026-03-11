<?php

if (!defined('ABSPATH')) {
	exit;
}

class Open_Collections_Output {
	/**
	 * @var Open_Collections_Settings
	 */
	private $settings;

	public function __construct(Open_Collections_Settings $settings) {
		$this->settings = $settings;
	}

	public function register() {
		add_action('init', array($this, 'register_rewrite_rules'));
		add_filter('query_vars', array($this, 'register_query_vars'));
		add_action('template_redirect', array($this, 'handle_protocol_routes'));
		add_action('update_option_' . Open_Collections_Settings::OPTION_KEY, array($this, 'on_settings_updated'), 10, 2);
	}

	public function register_rewrite_rules() {
		$settings = $this->settings->get_settings();
		$prefix = $this->get_collection_prefix($settings);
		$manifest = preg_quote($settings['manifest_filename'], '#');
		$item_segment = preg_quote($settings['item_route_segment'], '#');
		$media_segment = preg_quote($settings['media_route_segment'], '#');

		add_rewrite_tag('%ocp_collection%', '([^&]+)');
		add_rewrite_tag('%ocp_item%', '([^&]+)');
		add_rewrite_tag('%ocp_media%', '([^&]+)');
		add_rewrite_tag('%ocp_route%', '([^&]+)');

		add_rewrite_rule(
			'^' . $prefix . '/([^/]+)/' . $manifest . '$',
			'index.php?ocp_route=manifest&ocp_collection=$matches[1]',
			'top'
		);

		add_rewrite_rule(
			'^' . $prefix . '/([^/]+)/' . $item_segment . '/([^/]+)\.json$',
			'index.php?ocp_route=item&ocp_collection=$matches[1]&ocp_item=$matches[2]',
			'top'
		);

		add_rewrite_rule(
			'^' . $prefix . '/([^/]+)/' . $media_segment . '/(.+)$',
			'index.php?ocp_route=media&ocp_collection=$matches[1]&ocp_media=$matches[2]',
			'top'
		);

		if ('well-known' === $settings['dcd_route_mode']) {
			add_rewrite_rule(
				'^\.well-known/collections\.json$',
				'index.php?ocp_route=dcd',
				'top'
			);
		} else {
			$custom_path = trim((string) $settings['dcd_custom_path'], '/');
			if ('' !== $custom_path) {
				add_rewrite_rule(
					'^' . preg_quote($custom_path, '#') . '$',
					'index.php?ocp_route=dcd',
					'top'
				);
			}
		}
	}

	public function register_query_vars($vars) {
		$vars[] = 'ocp_collection';
		$vars[] = 'ocp_item';
		$vars[] = 'ocp_media';
		$vars[] = 'ocp_route';
		return $vars;
	}

	public function handle_protocol_routes() {
		$route = get_query_var('ocp_route');
		if (empty($route)) {
			return;
		}

		$settings = $this->settings->get_settings();
		$collection = sanitize_title((string) get_query_var('ocp_collection'));
		$item = sanitize_title((string) get_query_var('ocp_item'));
		$media = sanitize_text_field((string) get_query_var('ocp_media'));

		if ('manifest' === $route) {
			wp_send_json($this->build_manifest_stub($collection, $settings));
		}

		if ('item' === $route) {
			wp_send_json($this->build_item_stub($collection, $item, $settings));
		}

		if ('media' === $route) {
			$status = array(
				'error' => 'not_implemented',
				'message' => 'Media output scaffold only. Wire this route to a stable asset store in a later phase.',
				'requestedPath' => $media,
				'stableBaseUrl' => $this->build_media_base_url($collection, $settings),
			);
			wp_send_json($status, 501);
		}

		if ('dcd' === $route) {
			if (empty($settings['dcd_enabled'])) {
				status_header(404);
				exit;
			}

			wp_send_json($this->build_dcd_stub($settings));
		}
	}

	public function on_settings_updated($old_value, $new_value) {
		$this->register_rewrite_rules();
		flush_rewrite_rules();
	}

	private function get_collection_prefix($settings) {
		$path = trim((string) $settings['collection_root']);
		$path = trim($path, '/');
		return '' === $path ? 'collections' : preg_quote($path, '#');
	}

	private function build_manifest_stub($collection, $settings) {
		$collection_slug = '' !== $collection ? $collection : sanitize_title((string) $settings['default_collection_slug']);
		$manifest_url = $this->build_manifest_url($collection_slug, $settings);
		$item_base = $this->build_item_base_url($collection_slug, $settings);

		return array(
			'protocolVersion' => '1.0',
			'id' => $collection_slug,
			'title' => $settings['default_collection_title'] ?: 'Collection scaffold',
			'canonicalUrl' => $manifest_url,
			'status' => 'placeholder',
			'note' => 'Protocol-facing manifest scaffold. Back this with stored Collection Manager publish state in later phases.',
			'items' => array(),
			'_links' => array(
				'self' => $manifest_url,
				'itemTemplate' => trailingslashit($item_base) . '{item-id}.json',
				'mediaBase' => $this->build_media_base_url($collection_slug, $settings),
			),
		);
	}

	private function build_item_stub($collection, $item, $settings) {
		$item_url = trailingslashit($this->build_item_base_url($collection, $settings)) . $item . '.json';
		$media_base = $this->build_media_base_url($collection, $settings);

		return array(
			'id' => $item,
			'collection' => $collection,
			'canonicalUrl' => $item_url,
			'status' => 'placeholder',
			'note' => 'Item output scaffold only. Persist real item payloads in later phases.',
			'media' => array(
				'baseUrl' => $media_base,
				'todo' => 'Resolve item media references from published collection data.',
			),
		);
	}

	private function build_dcd_stub($settings) {
		$host = wp_parse_url(home_url(), PHP_URL_HOST);
		return array(
			'domain' => $host,
			'collections' => array(),
			'status' => 'placeholder',
			'note' => 'DCD scaffold output. Enable persistence and collection registration in later phases.',
			'_links' => array(
				'self' => $this->build_dcd_url($settings),
			),
		);
	}

	private function build_manifest_url($collection, $settings) {
		$base = $this->build_collection_base_url($settings);
		return trailingslashit($base . '/' . $collection) . $settings['manifest_filename'];
	}

	private function build_item_base_url($collection, $settings) {
		$base = $this->build_collection_base_url($settings);
		return $base . '/' . $collection . '/' . $settings['item_route_segment'];
	}

	private function build_media_base_url($collection, $settings) {
		$base = $this->build_collection_base_url($settings);
		return trailingslashit($base . '/' . $collection . '/' . $settings['media_route_segment']);
	}

	private function build_collection_base_url($settings) {
		return home_url($settings['collection_root']);
	}

	private function build_dcd_url($settings) {
		if ('custom' === $settings['dcd_route_mode']) {
			return home_url($settings['dcd_custom_path']);
		}

		return home_url('/.well-known/collections.json');
	}
}
