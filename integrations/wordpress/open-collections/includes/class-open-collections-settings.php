<?php

if (! defined('ABSPATH')) {
    exit;
}

class Open_Collections_Settings
{
    const OPTION_KEY = 'open_collections_options';

    /**
     * Register settings and sections for the phase-1 scaffold.
     */
    public function register_settings()
    {
        register_setting(
            'open_collections_settings_group',
            self::OPTION_KEY,
            array($this, 'sanitize_options')
        );

        add_settings_section(
            'open_collections_output',
            __('Collection Output', 'open-collections'),
            '__return_false',
            'open-collections'
        );

        add_settings_field(
            'collection_root',
            __('Collection root / output path', 'open-collections'),
            array($this, 'render_text_field'),
            'open-collections',
            'open_collections_output',
            array('key' => 'collection_root', 'placeholder' => '/collections/main')
        );

        add_settings_field(
            'output_base_url',
            __('Output base URL', 'open-collections'),
            array($this, 'render_text_field'),
            'open-collections',
            'open_collections_output',
            array('key' => 'output_base_url', 'placeholder' => 'https://example.org/collections/main')
        );

        add_settings_field(
            'enable_dcd',
            __('Enable DCD endpoint', 'open-collections'),
            array($this, 'render_checkbox_field'),
            'open-collections',
            'open_collections_output',
            array('key' => 'enable_dcd')
        );

        add_settings_section(
            'open_collections_manager_embed',
            __('Collection Manager Embed', 'open-collections'),
            '__return_false',
            'open-collections'
        );

        add_settings_field(
            'manager_bundle_url',
            __('Manager bundle URL', 'open-collections'),
            array($this, 'render_text_field'),
            'open-collections',
            'open_collections_manager_embed',
            array('key' => 'manager_bundle_url', 'placeholder' => 'https://cdn.example.org/collection-manager.js')
        );

        add_settings_field(
            'manager_mount_mode',
            __('Manager mount mode', 'open-collections'),
            array($this, 'render_select_field'),
            'open-collections',
            'open_collections_manager_embed',
            array(
                'key' => 'manager_mount_mode',
                'options' => array(
                    'shortcode' => __('Shortcode', 'open-collections'),
                    'admin' => __('Admin page', 'open-collections'),
                ),
            )
        );

        add_settings_section(
            'open_collections_provider',
            __('Provider / Storage (placeholder)', 'open-collections'),
            '__return_false',
            'open-collections'
        );

        add_settings_field(
            'provider',
            __('Publishing provider', 'open-collections'),
            array($this, 'render_text_field'),
            'open-collections',
            'open_collections_provider',
            array('key' => 'provider', 'placeholder' => 'filesystem | github | s3 | wordpress')
        );

        add_settings_field(
            'storage_adapter',
            __('Storage adapter', 'open-collections'),
            array($this, 'render_text_field'),
            'open-collections',
            'open_collections_provider',
            array('key' => 'storage_adapter', 'placeholder' => 'wp-media | local | remote')
        );

        add_settings_field(
            'site_domain',
            __('Protocol site domain', 'open-collections'),
            array($this, 'render_text_field'),
            'open-collections',
            'open_collections_provider',
            array('key' => 'site_domain', 'placeholder' => 'collections.example.org')
        );
    }

    /**
     * @param array $input
     * @return array
     */
    public function sanitize_options($input)
    {
        $input = is_array($input) ? $input : array();

        return array(
            'collection_root'    => isset($input['collection_root']) ? sanitize_text_field($input['collection_root']) : '',
            'output_base_url'    => isset($input['output_base_url']) ? esc_url_raw($input['output_base_url']) : '',
            'enable_dcd'         => ! empty($input['enable_dcd']) ? 1 : 0,
            'manager_bundle_url' => isset($input['manager_bundle_url']) ? esc_url_raw($input['manager_bundle_url']) : '',
            'manager_mount_mode' => isset($input['manager_mount_mode']) ? sanitize_key($input['manager_mount_mode']) : 'shortcode',
            'provider'           => isset($input['provider']) ? sanitize_text_field($input['provider']) : '',
            'storage_adapter'    => isset($input['storage_adapter']) ? sanitize_text_field($input['storage_adapter']) : '',
            'site_domain'        => isset($input['site_domain']) ? sanitize_text_field($input['site_domain']) : '',
        );
    }

    /**
     * @return array
     */
    public function get_options()
    {
        $defaults = array(
            'collection_root'    => '/collections/main',
            'output_base_url'    => home_url('/collections/main'),
            'enable_dcd'         => 0,
            'manager_bundle_url' => '',
            'manager_mount_mode' => 'shortcode',
            'provider'           => 'wordpress',
            'storage_adapter'    => 'wp-media',
            'site_domain'        => wp_parse_url(home_url(), PHP_URL_HOST),
        );

        return wp_parse_args(get_option(self::OPTION_KEY, array()), $defaults);
    }

    public function render_text_field($args)
    {
        $options = $this->get_options();
        $key = $args['key'];
        $placeholder = isset($args['placeholder']) ? $args['placeholder'] : '';

        printf(
            '<input class="regular-text" type="text" name="%1$s[%2$s]" value="%3$s" placeholder="%4$s" />',
            esc_attr(self::OPTION_KEY),
            esc_attr($key),
            esc_attr($options[$key]),
            esc_attr($placeholder)
        );
    }

    public function render_checkbox_field($args)
    {
        $options = $this->get_options();
        $key = $args['key'];

        printf(
            '<label><input type="checkbox" name="%1$s[%2$s]" value="1" %3$s /> %4$s</label>',
            esc_attr(self::OPTION_KEY),
            esc_attr($key),
            checked(! empty($options[$key]), true, false),
            esc_html__('Expose /.well-known/collections.json (future route scaffold).', 'open-collections')
        );
    }

    public function render_select_field($args)
    {
        $options = $this->get_options();
        $key = $args['key'];
        $field_options = $args['options'];

        printf('<select name="%1$s[%2$s]">', esc_attr(self::OPTION_KEY), esc_attr($key));

        foreach ($field_options as $value => $label) {
            printf(
                '<option value="%1$s" %2$s>%3$s</option>',
                esc_attr($value),
                selected($options[$key], $value, false),
                esc_html($label)
            );
        }

        echo '</select>';
    }

    /**
     * Build a stable config envelope that WordPress passes into Collection Manager.
     *
     * This method centralizes all plugin->manager settings mapping so shortcode and admin
     * mounts use the same config contract.
     *
     * @param array $overrides
     * @return array
     */
    public function build_manager_config($overrides = array())
    {
        $options = $this->get_options();

        $config = array(
            'pluginVersion' => OPEN_COLLECTIONS_VERSION,
            'apiBase'       => rest_url(),
            'output'        => array(
                'collectionRoot' => $options['collection_root'],
                'outputBaseUrl'  => $options['output_base_url'],
                'enableDcd'      => (bool) $options['enable_dcd'],
            ),
            'manager'       => array(
                'bundleUrl' => $options['manager_bundle_url'],
                'mountMode' => $options['manager_mount_mode'],
            ),
            'provider'      => array(
                'name'           => $options['provider'],
                'storageAdapter' => $options['storage_adapter'],
            ),
            'protocol'      => array(
                'siteDomain' => $options['site_domain'],
                'routes'     => array(
                    'collection' => rest_url('open-collections/v1/collection.json'),
                    'item'       => rest_url('open-collections/v1/items/{itemId}'),
                    'media'      => rest_url('open-collections/v1/media/{path}'),
                    'dcd'        => home_url('/.well-known/collections.json'),
                ),
            ),
        );

        return array_replace_recursive($config, $overrides);
    }
}
