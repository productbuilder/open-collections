<?php

if (! defined('ABSPATH')) {
    exit;
}

class Open_Collections_Admin
{
    /**
     * @var Open_Collections_Settings
     */
    private $settings;

    /**
     * @param Open_Collections_Settings $settings
     */
    public function __construct($settings)
    {
        $this->settings = $settings;
    }

    public function register_admin_menu()
    {
        add_menu_page(
            __('Open Collections', 'open-collections'),
            __('Open Collections', 'open-collections'),
            'manage_options',
            'open-collections',
            array($this, 'render_settings_page'),
            'dashicons-archive',
            56
        );

        add_submenu_page(
            'open-collections',
            __('Collection Manager', 'open-collections'),
            __('Collection Manager', 'open-collections'),
            'manage_options',
            'open-collections-manager',
            array($this, 'render_manager_mount_page')
        );
    }

    public function enqueue_admin_assets($hook)
    {
        if (strpos($hook, 'open-collections') === false) {
            return;
        }

        wp_enqueue_style(
            'open-collections-admin',
            OPEN_COLLECTIONS_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            OPEN_COLLECTIONS_VERSION
        );

        wp_register_script(
            'open-collections-manager-embed',
            OPEN_COLLECTIONS_PLUGIN_URL . 'assets/js/collection-manager-embed.js',
            array(),
            OPEN_COLLECTIONS_VERSION,
            true
        );

        wp_localize_script(
            'open-collections-manager-embed',
            'OpenCollectionsConfig',
            $this->settings->build_manager_config(
                array(
                    'mountSelector' => '#open-collections-manager-root',
                    'context'       => 'wordpress-admin',
                )
            )
        );
        wp_enqueue_script('open-collections-manager-embed');
    }

    public function render_settings_page()
    {
        if (! current_user_can('manage_options')) {
            return;
        }

        echo '<div class="wrap open-collections-settings">';
        echo '<h1>' . esc_html__('Open Collections for WordPress', 'open-collections') . '</h1>';
        echo '<p>' . esc_html__('Integration layer settings for Open Collections Protocol output and Collection Manager embedding.', 'open-collections') . '</p>';
        echo '<p><strong>' . esc_html__('Embedding quick start:', 'open-collections') . '</strong> ' . esc_html__('Use shortcode [open_collections_manager] on a page, or open the Collection Manager admin submenu.', 'open-collections') . '</p>';

        echo '<form method="post" action="options.php">';
        settings_fields('open_collections_settings_group');
        do_settings_sections('open-collections');
        submit_button(__('Save settings', 'open-collections'));
        echo '</form>';
        echo '</div>';
    }

    public function render_manager_mount_page()
    {
        if (! current_user_can('manage_options')) {
            return;
        }

        echo '<div class="wrap">';
        echo '<h1>' . esc_html__('Collection Manager (Scaffold)', 'open-collections') . '</h1>';
        echo '<p>' . esc_html__('This page mounts Collection Manager using your saved plugin settings and protocol route stubs.', 'open-collections') . '</p>';
        echo '<div id="open-collections-manager-root" class="open-collections-manager-root"></div>';
        echo '</div>';
    }
}
