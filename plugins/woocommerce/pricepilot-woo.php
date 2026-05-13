<?php
/**
 * Plugin Name: PricePilot for WooCommerce
 * Plugin URI: https://pricepilot.site
 * Description: Lightweight pricing optimization for WooCommerce. Automatically adjust prices based on country, tax, and demand.
 * Version: 1.0.0
 * Author: PricePilot Team
 * License: MIT
 */

if (!defined('ABSPATH')) exit;

class PricePilot_WooCommerce {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('wp_footer', array($this, 'inject_script'));
        add_action('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_action_links'));
    }

    public function add_settings_page() {
        add_options_page(
            'PricePilot Settings',
            'PricePilot',
            'manage_options',
            'pricepilot-settings',
            array($this, 'render_settings_page')
        );
    }

    public function register_settings() {
        register_setting('pricepilot_options', 'pricepilot_api_key');
        register_setting('pricepilot_options', 'pricepilot_api_url');
    }

    public function add_action_links($links) {
        $settings_link = '<a href="options-general.php?page=pricepilot-settings">Settings</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    public function render_settings_page() {
        $apiKey = get_option('pricepilot_api_key', '');
        $apiUrl = get_option('pricepilot_api_url', 'https://api.pricepilot.site');
        ?>
        <div class="wrap">
            <h1>PricePilot Configuration</h1>
            <p>Connect your WooCommerce store to the PricePilot optimization engine.</p>
            
            <form method="post" action="options.php">
                <?php settings_fields('pricepilot_options'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">API Key</th>
                        <td>
                            <input type="password" name="pricepilot_api_key" value="<?php echo esc_attr($apiKey); ?>" class="regular-text" placeholder="pp_live_...">
                            <p class="description">Get your key from the <a href="https://pricepilot.site/dashboard" target="_blank">PricePilot Dashboard</a>.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">API Base URL</th>
                        <td>
                            <input type="text" name="pricepilot_api_url" value="<?php echo esc_attr($apiUrl); ?>" class="regular-text">
                        </td>
                    </tr>
                </table>
                <?php submit_button('Save Connection'); ?>
            </form>

            <hr>
            <h2>Installation Status</h2>
            <?php if ($apiKey): ?>
                <div style="color: #22d3a5; font-weight: bold;">✅ PricePilot is active on your storefront.</div>
            <?php else: ?>
                <div style="color: #ff7b87;">❌ PricePilot is not connected. Enter your API key above.</div>
            <?php endif; ?>
        </div>
        <?php
    }

    public function inject_script() {
        $apiKey = get_option('pricepilot_api_key');
        $apiUrl = get_option('pricepilot_api_url', 'https://api.pricepilot.site');

        if (!$apiKey) return;

        ?>
        <!-- PricePilot Connector -->
        <script>
            window.PricePilotKey = "<?php echo esc_js($apiKey); ?>";
            window.PricePilotBaseUrl = "<?php echo esc_url($apiUrl); ?>";
        </script>
        <script src="<?php echo esc_url($apiUrl); ?>/js/pricepilot.js" async></script>
        <!-- End PricePilot Connector -->
        <?php
    }
}

new PricePilot_WooCommerce();
