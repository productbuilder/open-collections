<?php

if (! defined('ABSPATH')) {
    exit;
}

class Open_Collections_Embed
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

    public function register_frontend_assets()
    {
        wp_register_style(
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
                    'mountSelector' => '.open-collections-shortcode-root',
                    'context'       => 'wordpress-shortcode',
                    'manager'       => array('mountMode' => 'shortcode'),
                )
            )
        );
    }

    /**
     * Shortcode: [open_collections_manager]
     *
     * First-pass embed path for Collection Manager in front-end or restricted pages.
     */
    public function render_shortcode($atts)
    {
        $atts = shortcode_atts(
            array(
                'context' => 'wordpress-shortcode',
            ),
            $atts,
            'open_collections_manager'
        );

        wp_enqueue_style('open-collections-admin');
        wp_enqueue_script('open-collections-manager-embed');

        return sprintf(
            '<div class="open-collections-shortcode-root" data-ocp-context="%s"></div>',
            esc_attr($atts['context'])
        );
    }
}
