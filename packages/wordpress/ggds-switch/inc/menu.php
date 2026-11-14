<?php
/**
 * Where GGDS Switch is in WordPress: its own "GGDS" menu in the sidebar, with "Switch to GGDS" and "Tidy up content"
 * under it, so nobody has to look for it. Activating the plugin opens the Switch screen; the Plugins list links to
 * both screens; their old addresses under Tools still work.
 *
 * @package GGDS_Switch
 */

defined( 'ABSPATH' ) || exit;

/** A GGDS Switch screen's address: ggds-switch or ggds-tidy. */
function ggds_switch_url( string $page ): string {
	return admin_url( 'admin.php?page=' . $page );
}

add_action(
	'admin_menu',
	static function () {
		// The GGDS mark, for the sidebar: WordPress colours it to match the admin colour scheme.
		$icon = 'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="black" d="M10 1.5 12.6 7l5.9.6-4.4 4 1.3 5.9L10 14.4l-5.4 3.1 1.3-5.9-4.4-4L7.4 7z"/></svg>' );
		// People who may switch themes see the menu at "Switch to GGDS"; editors, who may only tidy up, at "Tidy up
		// content" (WordPress opens a menu at the first screen under it that the person may use).
		add_menu_page( 'Switch to GGDS', 'GGDS', 'switch_themes', 'ggds-switch', 'ggds_switch_screen', $icon, 59 );
		add_submenu_page( 'ggds-switch', 'Switch to GGDS', 'Switch to GGDS', 'switch_themes', 'ggds-switch', 'ggds_switch_screen' );
		add_submenu_page( 'ggds-switch', 'Tidy up content', 'Tidy up content', GGDS_TIDY_CAP, 'ggds-tidy', 'ggds_tidy_screen' );
	}
);

// Their styles and script, on these two screens only.
add_action(
	'admin_enqueue_scripts',
	static function () {
		$page = sanitize_key( wp_unslash( $_GET['page'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification -- which screen, nothing more
		if ( ! in_array( $page, array( 'ggds-switch', 'ggds-tidy' ), true ) ) {
			return;
		}
		$main    = GGDS_SWITCH_DIR . 'ggds-switch.php';
		$version = (string) get_file_data( $main, array( 'Version' => 'Version' ) )['Version'];
		wp_enqueue_style( 'ggds-switch-admin', plugins_url( 'assets/admin.css', $main ), array(), $version );
		if ( 'ggds-tidy' === $page ) {
			wp_enqueue_script( 'ggds-tidy', plugins_url( 'assets/tidy.js', $main ), array(), $version, array( 'in_footer' => true ) );
		}
	}
);

// Old addresses (Tools > Switch to GGDS, Tools > Tidy up content) go to the new ones. WordPress refuses a page that
// is not under Tools before admin_init runs, so this is on the hook it runs just before refusing.
add_action(
	'admin_page_access_denied',
	static function () {
		global $pagenow;
		$page = sanitize_key( wp_unslash( $_GET['page'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification -- a redirect, nothing more
		if ( 'tools.php' === $pagenow && in_array( $page, array( 'ggds-switch', 'ggds-tidy' ), true ) ) {
			wp_safe_redirect( ggds_switch_url( $page ) );
			exit;
		}
	}
);

// Activating the plugin opens the Switch screen (not when several plugins are activated at once).
add_action(
	'admin_init',
	static function () {
		if ( ! get_transient( 'ggds_switch_activated' ) ) {
			return;
		}
		delete_transient( 'ggds_switch_activated' );
		// phpcs:ignore WordPress.Security.NonceVerification -- WordPress's own activation screen
		if ( wp_doing_ajax() || is_network_admin() || isset( $_GET['activate-multi'] ) || ! current_user_can( 'switch_themes' ) || ggds_switch_done() ) {
			return;
		}
		wp_safe_redirect( ggds_switch_url( 'ggds-switch' ) );
		exit;
	}
);

// The Plugins list: "Switch to GGDS" and "Tidy up content" under the plugin's name.
add_filter(
	'plugin_action_links_' . plugin_basename( GGDS_SWITCH_DIR . 'ggds-switch.php' ),
	static function ( array $links ): array {
		$ours = array();
		if ( current_user_can( 'switch_themes' ) ) {
			$ours[] = '<a href="' . esc_url( ggds_switch_url( 'ggds-switch' ) ) . '"><strong>' . esc_html( ggds_switch_done() ? 'Switched: see what to check' : 'Switch to GGDS' ) . '</strong></a>';
		}
		if ( current_user_can( GGDS_TIDY_CAP ) ) {
			$ours[] = '<a href="' . esc_url( ggds_switch_url( 'ggds-tidy' ) ) . '">' . esc_html( 'Tidy up content' ) . '</a>';
		}
		return array_merge( $ours, $links );
	}
);
