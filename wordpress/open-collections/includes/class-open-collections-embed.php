<?php

if (!defined('ABSPATH')) {
	exit;
}

class Open_Collections_Embed {
	/**
	 * @var Open_Collections_Settings
	 */
	private $settings;

	/**
	 * @var bool
	 */
	private $needs_component = false;

	public function __construct(Open_Collections_Settings $settings) {
		$this->settings = $settings;
	}

	public function register() {
		add_shortcode('open_collections_manager', array($this, 'render_shortcode'));
		add_action('wp_enqueue_scripts', array($this, 'register_assets'));
		add_action('admin_enqueue_scripts', array($this, 'register_assets'));
		add_action('wp_footer', array($this, 'enqueue_component_if_needed'));
		add_action('admin_footer', array($this, 'enqueue_component_if_needed'));
		add_action('admin_menu', array($this, 'register_admin_mount_page'));
	}

	public function register_assets() {
		wp_register_script(
			'open-collections-embed',
			OPEN_COLLECTIONS_PLUGIN_URL . 'assets/js/open-collections-embed.js',
			array(),
			OPEN_COLLECTIONS_VERSION,
			true
		);
	}

	public function register_admin_mount_page() {
		$settings = $this->settings->get_settings();
		if (!in_array($settings['component_mount_mode'], array('admin', 'both'), true)) {
			return;
		}

		add_management_page(
			__('Open Collections Manager', 'open-collections'),
			__('Open Collections Manager', 'open-collections'),
			'manage_options',
			'open-collections-manager',
			array($this, 'render_admin_mount_page')
		);
	}

	public function render_admin_mount_page() {
		if (!current_user_can('manage_options')) {
			return;
		}

		echo '<div class="wrap">';
		echo '<h1>' . esc_html__('Open Collections Manager', 'open-collections') . '</h1>';
		echo '<p>' . esc_html__('This screen hosts the existing Collection Manager component. WordPress provides settings and context only.', 'open-collections') . '</p>';
		echo $this->render_mount_html(array(), true); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</div>';
	}

	public function render_shortcode($atts = array()) {
		$settings = $this->settings->get_settings();
		if (!in_array($settings['component_mount_mode'], array('shortcode', 'both'), true)) {
			return '<p>' . esc_html__('Open Collections shortcode embedding is disabled by plugin settings.', 'open-collections') . '</p>';
		}

		$atts = shortcode_atts(
			array(
				'collection_root' => '',
				'publish_mode' => '',
				'dcd_enabled' => '',
				'provider_mode' => '',
				'default_title' => '',
				'default_slug' => '',
			),
			$atts,
			'open_collections_manager'
		);

		return $this->render_mount_html($atts, false);
	}

	/**
	 * Config handoff pattern:
	 * - plugin-level defaults are passed via wp_localize_script
	 * - per-mount overrides are passed via data attributes
	 * - frontend script merges both and attaches final JSON to the component element
	 */
	private function render_mount_html($atts, $is_admin_context) {
		$this->needs_component = true;

		$settings = $this->settings->get_settings();
		$mount_id = 'open-collections-manager-' . wp_generate_password(8, false, false);
		$config = $this->build_mount_config($settings, $atts, $is_admin_context);

		$attributes = array(
			'id' => $mount_id,
			'class' => 'open-collections-manager-mount',
			'data-ocp-config' => wp_json_encode($config),
			'data-collection-root' => $config['collectionRoot'],
			'data-publish-mode' => $config['publishMode'],
			'data-dcd-enabled' => $config['dcdEnabled'] ? '1' : '0',
			'data-provider-mode' => $config['providerMode'],
		);

		$html = '<div';
		foreach ($attributes as $key => $value) {
			$html .= ' ' . esc_attr($key) . '="' . esc_attr((string) $value) . '"';
		}
		$html .= '></div>';

		return $html;
	}

	private function build_mount_config($settings, $atts, $is_admin_context) {
		return array(
			'collectionRoot' => $this->resolve_value($atts, 'collection_root', $settings['collection_root']),
			'publishMode' => $this->resolve_value($atts, 'publish_mode', $settings['publish_mode']),
			'dcdEnabled' => $this->resolve_bool_value($atts, 'dcd_enabled', (bool) $settings['dcd_enabled']),
			'providerMode' => $this->resolve_value($atts, 'provider_mode', $settings['provider_mode']),
			'defaultCollectionTitle' => $this->resolve_value($atts, 'default_title', $settings['default_collection_title']),
			'defaultCollectionSlug' => $this->resolve_value($atts, 'default_slug', $settings['default_collection_slug']),
			'mountMode' => $settings['component_mount_mode'],
			'inAdmin' => $is_admin_context,
		);
	}

	private function resolve_value($atts, $key, $fallback) {
		if (isset($atts[$key]) && '' !== $atts[$key]) {
			return sanitize_text_field((string) $atts[$key]);
		}
		return $fallback;
	}

	private function resolve_bool_value($atts, $key, $fallback) {
		if (!isset($atts[$key]) || '' === $atts[$key]) {
			return (bool) $fallback;
		}
		return in_array((string) $atts[$key], array('1', 'true', 'yes', 'on'), true);
	}

	public function enqueue_component_if_needed() {
		if (!$this->needs_component) {
			return;
		}

		$settings = $this->settings->get_settings();
		$script_url = !empty($settings['component_script_url'])
			? $settings['component_script_url']
			: OPEN_COLLECTIONS_PLUGIN_URL . 'assets/js/collection-manager-placeholder.js';

		wp_enqueue_script('open-collections-embed');
		wp_localize_script(
			'open-collections-embed',
			'OpenCollectionsPluginConfig',
			array(
				'componentScriptUrl' => esc_url_raw($script_url),
				'defaults' => array(
					'collectionRoot' => $settings['collection_root'],
					'publishMode' => $settings['publish_mode'],
					'dcdEnabled' => (bool) $settings['dcd_enabled'],
					'providerMode' => $settings['provider_mode'],
					'defaultCollectionTitle' => $settings['default_collection_title'],
					'defaultCollectionSlug' => $settings['default_collection_slug'],
				),
			)
		);
	}
}
