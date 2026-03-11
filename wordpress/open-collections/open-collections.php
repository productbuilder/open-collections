<?php
/**
 * Plugin Name: Open Collections
 * Plugin URI: https://open-collections.org
 * Description: WordPress integration scaffold for Open Collections Protocol. Hosts and configures Collection Manager without reimplementing it.
 * Version: 0.1.0
 * Author: Open Collections
 * License: MIT
 * Text Domain: open-collections
 */

if (!defined('ABSPATH')) {
	exit;
}

define('OPEN_COLLECTIONS_VERSION', '0.1.0');
define('OPEN_COLLECTIONS_PLUGIN_FILE', __FILE__);
define('OPEN_COLLECTIONS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('OPEN_COLLECTIONS_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once OPEN_COLLECTIONS_PLUGIN_DIR . 'includes/class-open-collections-plugin.php';

Open_Collections_Plugin::instance();
