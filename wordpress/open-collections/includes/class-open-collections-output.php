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
		add_action('template_redirect', array($this, 'handle_protocol_placeholder_routes'));
		add_action('update_option_' . Open_Collections_Settings::OPTION_KEY, array($this, 'on_settings_updated'), 10, 2);
	}

	public function register_rewrite_rules() {
		$prefix = $this->get_collection_prefix();

		add_rewrite_tag('%ocp_collection%', '([^&]+)');
		add_rewrite_tag('%ocp_item%', '([^&]+)');
		add_rewrite_tag('%ocp_media%', '([^&]+)');
		add_rewrite_tag('%ocp_route%', '([^&]+)');

		add_rewrite_rule(
			'^' . $prefix . '/([^/]+)/collection\.json$',
			'index.php?ocp_route=manifest&ocp_collection=$matches[1]',
			'top'
		);

		add_rewrite_rule(
			'^' . $prefix . '/([^/]+)/items/([^/]+)\.json$',
			'index.php?ocp_route=item&ocp_collection=$matches[1]&ocp_item=$matches[2]',
			'top'
		);

		add_rewrite_rule(
			'^' . $prefix . '/([^/]+)/media/(.+)$',
			'index.php?ocp_route=media&ocp_collection=$matches[1]&ocp_media=$matches[2]',
			'top'
		);

		add_rewrite_rule(
			'^\.well-known/collections\.json$',
			'index.php?ocp_route=dcd',
			'top'
		);
	}

	public function register_query_vars($vars) {
		$vars[] = 'ocp_collection';
		$vars[] = 'ocp_item';
		$vars[] = 'ocp_media';
		$vars[] = 'ocp_route';
		return $vars;
	}

	public function handle_protocol_placeholder_routes() {
		$route = get_query_var('ocp_route');
		if (empty($route)) {
			return;
		}

		$settings = $this->settings->get_settings();
		$collection = sanitize_title((string) get_query_var('ocp_collection'));
		$item = sanitize_title((string) get_query_var('ocp_item'));
		$media = sanitize_text_field((string) get_query_var('ocp_media'));
		$base_url = home_url($settings['collection_root']);

		if ('manifest' === $route) {
			wp_send_json(
				array(
					'id' => $collection,
					'title' => $settings['default_collection_title'] ?: 'Collection scaffold',
					'slug' => $collection,
					'status' => 'placeholder',
					'note' => 'Open Collections WordPress scaffold route. Replace with persisted manifest generation in a later phase.',
					'items' => array(),
					'_links' => array(
						'itemsBase' => trailingslashit($base_url . '/' . $collection . '/items'),
						'mediaBase' => trailingslashit($base_url . '/' . $collection . '/media'),
					),
				)
			);
		}

		if ('item' === $route) {
			wp_send_json(
				array(
					'id' => $item,
					'collection' => $collection,
					'status' => 'placeholder',
					'note' => 'Item output scaffold only. Persist real item payloads in later phases.',
				)
			);
		}

		if ('media' === $route) {
			status_header(501);
			header('Content-Type: text/plain; charset=utf-8');
			echo 'Media output scaffold only. Route matched: ' . esc_html($media);
			exit;
		}

		if ('dcd' === $route) {
			if (empty($settings['dcd_enabled'])) {
				status_header(404);
				exit;
			}

			wp_send_json(
				array(
					'domain' => wp_parse_url(home_url(), PHP_URL_HOST),
					'collections' => array(),
					'status' => 'placeholder',
					'note' => 'DCD scaffold output. Enable persistence and collection registration in later phases.',
				)
			);
		}
	}

	public function on_settings_updated($old_value, $new_value) {
		$old_root = isset($old_value['collection_root']) ? (string) $old_value['collection_root'] : '';
		$new_root = isset($new_value['collection_root']) ? (string) $new_value['collection_root'] : '';

		if ($old_root !== $new_root) {
			$this->register_rewrite_rules();
			flush_rewrite_rules();
		}
	}

	private function get_collection_prefix() {
		$settings = $this->settings->get_settings();
		$path = trim((string) $settings['collection_root']);
		$path = trim($path, '/');
		return '' === $path ? 'collections' : preg_quote($path, '#');
	}
}
