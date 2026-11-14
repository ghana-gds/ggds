<?php
/**
 * Plugin Name:       GGDS Switch
 * Plugin URI:        https://ghana-gds.github.io/ggds/
 * Description:       Turns an existing WordPress website into a GGDS government website: installs the GGDS theme, carries your logo, menus and details over, and cleans page-builder layouts into plain, accessible pages. Preview first; undo at any time. GGDS > Switch to GGDS, and GGDS > Tidy up content for placeholder pages such as "Hello world!".
 * Version:           0.5.0
 * Requires at least: 6.5
 * Requires PHP:      8.1
 * Author:            Ghana Government Design System (GGDS) contributors
 * Author URI:        https://github.com/ghana-gds/ggds
 * License:           Apache-2.0
 * License URI:       https://www.apache.org/licenses/LICENSE-2.0
 * Text Domain:       ggds-switch
 *
 * @package GGDS_Switch
 */

defined( 'ABSPATH' ) || exit;

define( 'GGDS_SWITCH_DIR', plugin_dir_path( __FILE__ ) );

require GGDS_SWITCH_DIR . 'inc/clean.php';
require GGDS_SWITCH_DIR . 'inc/scan.php';
require GGDS_SWITCH_DIR . 'inc/switch.php';
require GGDS_SWITCH_DIR . 'inc/tidy.php';
if ( is_admin() ) {
	require GGDS_SWITCH_DIR . 'inc/menu.php';
	require GGDS_SWITCH_DIR . 'inc/admin.php';
	require GGDS_SWITCH_DIR . 'inc/tidy-admin.php';
}
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require GGDS_SWITCH_DIR . 'inc/cli.php';
	require GGDS_SWITCH_DIR . 'inc/tidy-cli.php';
}

// The preview (Appearance > Customise with GGDS, before the switch): every page as the switch would clean it, so
// what people see is what they will get. It runs last, after any page builder has drawn the page.
add_filter(
	'the_content',
	static function ( $content ) {
		global $wp_customize;
		// Only while previewing GGDS before switching to it: never on a website that already uses GGDS.
		if ( is_customize_preview() && $wp_customize instanceof WP_Customize_Manager && ! $wp_customize->is_theme_active() && 'ggds' === get_template() ) {
			// GGDS has its own homepage: the old layout is kept as a draft by the switch, so it is not shown here.
			if ( is_front_page() && in_the_loop() ) {
				return '';
			}
			$notes = array();
			return ggds_switch_clean_html( ggds_switch_expand_builder_shortcodes( (string) $content, $notes ), $notes );
		}
		return $content;
	},
	PHP_INT_MAX
);

// Activating the plugin opens the Switch screen (inc/menu.php).
register_activation_hook( __FILE__, static fn() => set_transient( 'ggds_switch_activated', 1, 60 ) );
