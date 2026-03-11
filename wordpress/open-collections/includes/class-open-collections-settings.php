<?php

if (!defined('ABSPATH')) {
	exit;
}

class Open_Collections_Settings {
	const OPTION_KEY = 'open_collections_settings';

	/**
	 * Settings schema used for defaults and sanitization.
	 *
	 * @return array<string, mixed>
	 */
	public function defaults() {
		return array(
			'collection_root' => '/collections',
			'manifest_filename' => 'collection.json',
			'item_route_segment' => 'items',
			'media_route_segment' => 'media',
			'dcd_enabled' => 0,
			'dcd_route_mode' => 'well-known',
			'dcd_custom_path' => '/collections-discovery.json',
			'provider_mode' => 'manual',
			'component_mount_mode' => 'shortcode',
			'component_script_url' => '',
			'publish_mode' => 'draft',
			'default_collection_title' => '',
			'default_collection_slug' => '',
		);
	}

	public function register() {
		add_action('admin_menu', array($this, 'register_settings_page'));
		add_action('admin_init', array($this, 'register_settings'));
	}

	public function register_defaults() {
		if (false === get_option(self::OPTION_KEY, false)) {
			add_option(self::OPTION_KEY, $this->defaults());
		}
	}

	public function register_settings_page() {
		add_options_page(
			__('Open Collections', 'open-collections'),
			__('Open Collections', 'open-collections'),
			'manage_options',
			'open-collections-settings',
			array($this, 'render_settings_page')
		);
	}

	public function register_settings() {
		register_setting(
			'open_collections_settings_group',
			self::OPTION_KEY,
			array($this, 'sanitize_settings')
		);

		add_settings_section(
			'open_collections_main_section',
			__('Open Collections plugin settings', 'open-collections'),
			'__return_empty_string',
			'open-collections-settings'
		);

		$this->add_field('collection_root', 'Collection root/output base path');
		$this->add_field('manifest_filename', 'Manifest filename');
		$this->add_field('item_route_segment', 'Item route segment');
		$this->add_field('media_route_segment', 'Media route segment');
		$this->add_field('dcd_enabled', 'DCD enabled', 'checkbox');
		$this->add_field('dcd_route_mode', 'DCD route mode', 'select', array(
			'well-known' => 'Well-known: /.well-known/collections.json',
			'custom' => 'Custom path',
		));
		$this->add_field('dcd_custom_path', 'DCD custom path');
		$this->add_field('provider_mode', 'Provider mode placeholder', 'select', array(
			'manual' => 'Manual',
			'wordpress-media' => 'WordPress media (placeholder)',
			'external' => 'External provider (placeholder)',
		));
		$this->add_field('component_mount_mode', 'Component mount mode', 'select', array(
			'shortcode' => 'Shortcode',
			'admin' => 'Admin page',
			'both' => 'Both',
		));
		$this->add_field('component_script_url', 'Collection Manager script URL (optional)');
		$this->add_field('publish_mode', 'Publish mode', 'select', array(
			'draft' => 'Draft',
			'publish' => 'Publish',
		));
		$this->add_field('default_collection_title', 'Default collection title');
		$this->add_field('default_collection_slug', 'Default collection slug');
	}

	private function add_field($key, $label, $type = 'text', $choices = array()) {
		add_settings_field(
			'open_collections_' . $key,
			esc_html__($label, 'open-collections'),
			array($this, 'render_field'),
			'open-collections-settings',
			'open_collections_main_section',
			array(
				'key' => $key,
				'type' => $type,
				'choices' => $choices,
			)
		);
	}

	public function render_field($args) {
		$settings = $this->get_settings();
		$key = $args['key'];
		$type = isset($args['type']) ? $args['type'] : 'text';
		$value = isset($settings[$key]) ? $settings[$key] : '';
		$field_name = self::OPTION_KEY . '[' . $key . ']';

		if ('checkbox' === $type) {
			printf(
				'<label><input type="checkbox" name="%1$s" value="1" %2$s /> %3$s</label>',
				esc_attr($field_name),
				checked(1, (int) $value, false),
				esc_html__('Enable', 'open-collections')
			);
			return;
		}

		if ('select' === $type) {
			echo '<select name="' . esc_attr($field_name) . '">';
			foreach ($args['choices'] as $option_value => $label) {
				printf(
					'<option value="%1$s" %2$s>%3$s</option>',
					esc_attr($option_value),
					selected($value, $option_value, false),
					esc_html($label)
				);
			}
			echo '</select>';
			return;
		}

		printf(
			'<input type="text" class="regular-text" name="%1$s" value="%2$s" />',
			esc_attr($field_name),
			esc_attr($value)
		);
	}

	public function sanitize_settings($input) {
		$defaults = $this->defaults();
		$output = $defaults;

		$output['collection_root'] = $this->sanitize_collection_root($input, $defaults);
		$output['manifest_filename'] = $this->sanitize_manifest_filename($input, $defaults);
		$output['item_route_segment'] = $this->sanitize_route_segment($input, 'item_route_segment', $defaults['item_route_segment']);
		$output['media_route_segment'] = $this->sanitize_route_segment($input, 'media_route_segment', $defaults['media_route_segment']);
		$output['dcd_enabled'] = isset($input['dcd_enabled']) ? 1 : 0;
		$output['dcd_route_mode'] = $this->sanitize_choice($input, 'dcd_route_mode', array('well-known', 'custom'), $defaults['dcd_route_mode']);
		$output['dcd_custom_path'] = $this->sanitize_path($input, 'dcd_custom_path', $defaults['dcd_custom_path']);
		$output['provider_mode'] = $this->sanitize_choice($input, 'provider_mode', array('manual', 'wordpress-media', 'external'), $defaults['provider_mode']);
		$output['component_mount_mode'] = $this->sanitize_choice($input, 'component_mount_mode', array('shortcode', 'admin', 'both'), $defaults['component_mount_mode']);
		$output['component_script_url'] = isset($input['component_script_url']) ? esc_url_raw(trim((string) $input['component_script_url'])) : '';
		$output['publish_mode'] = $this->sanitize_choice($input, 'publish_mode', array('draft', 'publish'), $defaults['publish_mode']);
		$output['default_collection_title'] = isset($input['default_collection_title']) ? sanitize_text_field($input['default_collection_title']) : '';
		$output['default_collection_slug'] = isset($input['default_collection_slug']) ? sanitize_title($input['default_collection_slug']) : '';

		return $output;
	}

	private function sanitize_collection_root($input, $defaults) {
		if (!isset($input['collection_root'])) {
			return $defaults['collection_root'];
		}

		$path = trim((string) $input['collection_root']);
		$path = '/' . ltrim($path, '/');
		$path = untrailingslashit($path);

		return '' === $path ? $defaults['collection_root'] : $path;
	}

	private function sanitize_choice($input, $key, $allowed, $fallback) {
		if (!isset($input[$key])) {
			return $fallback;
		}

		$value = (string) $input[$key];
		return in_array($value, $allowed, true) ? $value : $fallback;
	}

	private function sanitize_manifest_filename($input, $defaults) {
		if (!isset($input['manifest_filename'])) {
			return $defaults['manifest_filename'];
		}

		$name = sanitize_file_name((string) $input['manifest_filename']);
		if ('' === $name || '.' === $name || '..' === $name) {
			return $defaults['manifest_filename'];
		}

		if (!preg_match('/\.json$/i', $name)) {
			$name .= '.json';
		}

		return $name;
	}

	private function sanitize_route_segment($input, $key, $fallback) {
		if (!isset($input[$key])) {
			return $fallback;
		}

		$segment = sanitize_title((string) $input[$key]);
		return '' === $segment ? $fallback : $segment;
	}

	private function sanitize_path($input, $key, $fallback) {
		if (!isset($input[$key])) {
			return $fallback;
		}

		$path = trim((string) $input[$key]);
		$path = '/' . ltrim($path, '/');
		$path = preg_replace('#/+#', '/', $path);

		return '/' === $path ? $fallback : $path;
	}

	/**
	 * @return array<string, mixed>
	 */
	public function get_settings() {
		$current = get_option(self::OPTION_KEY, array());
		return wp_parse_args((array) $current, $this->defaults());
	}

	public function render_settings_page() {
		if (!current_user_can('manage_options')) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php esc_html_e('Open Collections Settings', 'open-collections'); ?></h1>
			<p>
				<?php esc_html_e('WordPress is the integration layer. Collection Manager remains the editing UI and protocol outputs remain portable Open Collections resources.', 'open-collections'); ?>
			</p>
			<form method="post" action="options.php">
				<?php
				settings_fields('open_collections_settings_group');
				do_settings_sections('open-collections-settings');
				submit_button();
				?>
			</form>
		</div>
		<?php
	}
}
