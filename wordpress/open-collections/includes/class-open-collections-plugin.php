<?php

if (!defined('ABSPATH')) {
	exit;
}

require_once OPEN_COLLECTIONS_PLUGIN_DIR . 'includes/class-open-collections-settings.php';
require_once OPEN_COLLECTIONS_PLUGIN_DIR . 'includes/class-open-collections-embed.php';
require_once OPEN_COLLECTIONS_PLUGIN_DIR . 'includes/class-open-collections-output.php';

class Open_Collections_Plugin {
	/**
	 * @var Open_Collections_Plugin|null
	 */
	private static $instance = null;

	/**
	 * @var Open_Collections_Settings
	 */
	private $settings;

	/**
	 * @var Open_Collections_Embed
	 */
	private $embed;

	/**
	 * @var Open_Collections_Output
	 */
	private $output;

	/**
	 * @return Open_Collections_Plugin
	 */
	public static function instance() {
		if (null === self::$instance) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	private function __construct() {
		$this->settings = new Open_Collections_Settings();
		$this->embed = new Open_Collections_Embed($this->settings);
		$this->output = new Open_Collections_Output($this->settings);

		add_action('plugins_loaded', array($this, 'init'));
		register_activation_hook(OPEN_COLLECTIONS_PLUGIN_FILE, array($this, 'activate'));
		register_deactivation_hook(OPEN_COLLECTIONS_PLUGIN_FILE, array($this, 'deactivate'));
	}

	public function init() {
		$this->settings->register();
		$this->embed->register();
		$this->output->register();
	}

	public function activate() {
		$this->settings->register_defaults();
		$this->output->register_rewrite_rules();
		flush_rewrite_rules();
	}

	public function deactivate() {
		flush_rewrite_rules();
	}
}
