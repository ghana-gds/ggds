<?php
/**
 * The switch, and its undo.
 *
 * The switch installs the GGDS theme (the copy inside this plugin), carries the logo, menus and the institution's
 * details over, cleans every page and post (see clean.php), keeps the old homepage layout as a draft, and
 * activates GGDS. Every page it changes keeps its original content and page-builder settings, so undo puts the
 * website back exactly as it was, old theme included.
 *
 * @package GGDS_Switch
 */

defined( 'ABSPATH' ) || exit;

const GGDS_SWITCH_BACKUP = 'ggds_switch_backup';
const GGDS_SWITCH_REPORT = 'ggds_switch_report';

/** Whether this website has been switched (and can be undone). */
function ggds_switch_done(): bool {
	return (bool) get_option( GGDS_SWITCH_BACKUP );
}

/** Install the GGDS theme from the copy inside this plugin, unless the same or a newer version is installed. */
function ggds_switch_install_theme() {
	$source    = GGDS_SWITCH_DIR . 'theme/ggds';
	$installed = wp_get_theme( 'ggds' );
	$bundled   = is_readable( $source . '/style.css' ) ? get_file_data( $source . '/style.css', array( 'Version' => 'Version' ) )['Version'] : '';
	if ( $installed->exists() && ( '' === $bundled || version_compare( (string) $installed->get( 'Version' ), $bundled, '>=' ) ) ) {
		return true;
	}
	if ( '' === $bundled ) {
		return new WP_Error( 'ggds_switch_no_theme', 'The GGDS theme is not installed, and this copy of GGDS Switch does not include it. Upload ggds-wordpress.zip in Appearance > Themes, then try again.' );
	}
	require_once ABSPATH . 'wp-admin/includes/file.php';
	if ( ! WP_Filesystem() ) {
		return new WP_Error( 'ggds_switch_files', 'WordPress cannot write to the themes folder. Upload ggds-wordpress.zip in Appearance > Themes, then try again.' );
	}
	$dest = get_theme_root() . '/ggds';
	wp_mkdir_p( $dest );
	$copied = copy_dir( $source, $dest );
	wp_clean_themes_cache();
	return is_wp_error( $copied ) ? $copied : true;
}

/** What visitors see in a post now: the page builder's own output while it is installed, or the stored content. */
function ggds_switch_source( int $id, string $builder ): string {
	$content = (string) get_post_field( 'post_content', $id );
	if ( 'elementor' === $builder && class_exists( '\Elementor\Plugin' ) ) {
		$html = (string) \Elementor\Plugin::instance()->frontend->get_builder_content( $id, false );
		return '' !== trim( $html ) ? $html : $content;
	}
	if ( 'beaver' === $builder && class_exists( 'FLBuilder' ) && method_exists( 'FLBuilder', 'render_content_by_id' ) ) {
		ob_start();
		FLBuilder::render_content_by_id( $id );
		$html = (string) ob_get_clean();
		return '' !== trim( $html ) ? $html : $content;
	}
	if ( 'siteorigin' === $builder && function_exists( 'siteorigin_panels_render' ) ) {
		return (string) siteorigin_panels_render( $id );
	}
	if ( 'oxygen' === $builder && '' === trim( $content ) ) {
		return do_shortcode( (string) get_post_meta( $id, 'ct_builder_shortcodes', true ) );
	}
	return $content;
}

/** The switch. $details and $menus are as ggds_switch_scan() proposes them; $dry only reports what would change. */
function ggds_switch_run( array $details, array $menus, bool $dry = false ) {
	if ( ggds_switch_done() ) {
		return new WP_Error( 'ggds_switch_done', 'This website has already been switched to GGDS. Undo the switch first to run it again.' );
	}
	$scan    = ggds_switch_scan();
	$cleaned = array();
	$skipped = array();
	$posts   = array();
	$keys    = array_unique( array_map( static fn( $b ) => $b[1], ggds_switch_builders() ) );

	if ( ! $dry ) {
		$installed = ggds_switch_install_theme();
		if ( is_wp_error( $installed ) ) {
			return $installed;
		}
		// Content is saved exactly as cleaned (and, on undo, exactly as it was): WordPress's HTML filter would
		// otherwise take embedded videos out for some users.
		kses_remove_filters();
	}

	foreach ( ggds_switch_post_ids() as $id ) {
		$id       = (int) $id;
		$builder  = ggds_switch_builder_of( $id );
		$original = (string) get_post_field( 'post_content', $id );
		$notes    = array();
		$new      = ggds_switch_clean( ggds_switch_source( $id, $builder ), $notes );
		if ( '' === trim( $new ) && '' !== trim( wp_strip_all_tags( $original ) ) ) {
			$skipped[ $id ] = array( 'Nothing readable was found in this page, so it was left as it was. Look at it and rewrite it.' );
			continue;
		}
		if ( $new === $original && '' === $builder ) {
			continue;
		}
		if ( $builder ) {
			$notes[] = sprintf( 'Built with %s: check the page reads well in its new, simpler layout.', ggds_switch_builders()[ $builder ][0] ?? 'a page builder' );
		}
		$cleaned[ $id ] = array_values( array_unique( $notes ) );
		if ( $dry ) {
			continue;
		}
		$meta = array();
		foreach ( $keys as $key ) {
			if ( metadata_exists( 'post', $id, $key ) ) {
				$meta[ $key ] = get_post_meta( $id, $key, true );
			}
		}
		update_post_meta( $id, '_ggds_switch_before', wp_slash( $original ) );
		update_post_meta( $id, '_ggds_switch_meta', wp_slash( $meta ) );
		// The page builder stops taking over the page, so WordPress shows the cleaned content. Its own data stays
		// (only the switch that turns it on is removed), so undo can put it back.
		foreach ( array( '_elementor_edit_mode', '_fl_builder_enabled', '_et_pb_use_builder', '_wpb_vc_js_status' ) as $key ) {
			delete_post_meta( $id, $key );
		}
		wp_update_post( wp_slash( array( 'ID' => $id, 'post_content' => $new ) ) );
		$posts[] = $id;
	}

	// The homepage: GGDS has its own (the question, search, common tasks and main sections). The old layout is
	// kept as a draft, so its words can be reused.
	$draft = 0;
	if ( $scan['front'] && '' !== trim( (string) get_post_field( 'post_content', $scan['front'] ) ) ) {
		$cleaned[ $scan['front'] ][] = 'This is the homepage. GGDS has its own homepage, so the old layout is kept as a draft page, "Old homepage", to reuse its words.';
		if ( ! $dry ) {
			$draft = (int) wp_insert_post( wp_slash( array( 'post_type' => 'page', 'post_status' => 'draft', 'post_title' => 'Old homepage (kept by GGDS Switch)', 'post_content' => (string) get_post_field( 'post_content', $scan['front'] ) ) ) );
			if ( ! in_array( $scan['front'], $posts, true ) ) {
				update_post_meta( $scan['front'], '_ggds_switch_before', wp_slash( (string) get_post_field( 'post_content', $scan['front'] ) ) );
				update_post_meta( $scan['front'], '_ggds_switch_meta', array() );
				$posts[] = $scan['front'];
			}
			wp_update_post( array( 'ID' => $scan['front'], 'post_content' => '' ) );
		}
	}

	$todo = ggds_switch_todo( $scan, $details, $menus );
	if ( $dry ) {
		return array( 'cleaned' => $cleaned, 'skipped' => $skipped, 'todo' => $todo );
	}

	// GGDS's settings: the institution's details, the logo and the menus. Kept apart from the old theme's, which
	// stay as they were.
	// GGDS's settings as they were before this switch, or before the first preview wrote to them.
	$pre         = get_option( 'ggds_switch_premods' );
	$before_mods = is_array( $pre ) ? $pre['mods'] : get_option( 'theme_mods_ggds', null );
	delete_option( 'ggds_switch_premods' );
	$old_mods    = (array) get_option( 'theme_mods_' . get_stylesheet(), array() );
	$mods        = is_array( $before_mods ) ? $before_mods : array();
	foreach ( ggds_defaults_for_switch() as $key ) {
		if ( isset( $details[ $key ] ) && '' !== (string) $details[ $key ] ) {
			$mods[ 'ggds_' . $key ] = (string) $details[ $key ];
		}
	}
	if ( ! empty( $old_mods['custom_logo'] ) ) {
		$mods['custom_logo'] = (int) $old_mods['custom_logo'];
	}
	$mods['nav_menu_locations'] = array_filter( array_map( 'intval', $menus ) );

	update_option(
		GGDS_SWITCH_BACKUP,
		array(
			'when'       => time(),
			'stylesheet' => get_stylesheet(),
			'template'   => get_template(),
			'ggds_mods'  => $before_mods,
			'posts'      => $posts,
			'draft'      => $draft,
		),
		false
	);
	update_option( 'theme_mods_ggds', $mods );
	switch_theme( 'ggds' );
	// WordPress would otherwise guess, on the next page load, which old menu goes where, and replace the menus
	// chosen here.
	delete_option( 'theme_switch_menu_locations' );
	update_option( GGDS_SWITCH_REPORT, array( 'when' => time(), 'cleaned' => $cleaned, 'skipped' => $skipped, 'todo' => $todo, 'draft' => $draft ), false );
	return array( 'cleaned' => $cleaned, 'skipped' => $skipped, 'todo' => $todo );
}

/** The GGDS theme's settings that the switch can fill in (inc/settings.php in the theme). */
function ggds_defaults_for_switch(): array {
	return array( 'short_name', 'initials', 'country', 'theme', 'official_host', 'register_url', 'hero_title', 'search_placeholder', 'purpose', 'address', 'email', 'phone', 'contact_url' );
}

/** What a person should do after the switch, in plain words. */
function ggds_switch_todo( array $scan, array $details, array $menus ): array {
	$todo = array();
	if ( empty( $details['official_host'] ) ) {
		$todo[] = 'Set your official address (such as example.gov.gh) in Appearance > Customise > GGDS. Until then the banner says this copy is not the official website.';
	}
	if ( ! $scan['logo'] ) {
		$todo[] = 'Add your approved logo in Appearance > Customise > Site identity. Until then a badge shows your initials.';
	}
	if ( empty( $menus['tasks'] ) ) {
		$todo[] = 'Add 3 to 6 common tasks, the things people most often come to do, to a menu in the "Common tasks" place (Appearance > Menus). They show under the homepage search.';
	}
	$top = 0;
	foreach ( ! empty( $menus['primary'] ) ? ( wp_get_nav_menu_items( (int) $menus['primary'] ) ?: array() ) : array() as $item ) {
		$top += (int) ! (int) $item->menu_item_parent;
	}
	if ( $top > 6 ) {
		$todo[] = sprintf( 'Your main menu has %d sections. GGDS shows 3 to 6 at the top: keep the ones people use most, and put the rest under them.', $top );
	}
	if ( empty( $menus['primary'] ) ) {
		$todo[] = 'Choose a main menu (3 to 6 sections) in Appearance > Menus, in the "Main sections" place.';
	}
	if ( empty( $menus['legal'] ) ) {
		$todo[] = 'Make a "Footer links" menu with your Accessibility, Privacy and Contact pages.';
	}
	if ( $scan['widgets'] ) {
		$todo[] = sprintf( 'The old theme\'s sidebars had %d widgets. GGDS has no sidebars: put anything people need into your pages.', $scan['widgets'] );
	}
	if ( $scan['comments'] ) {
		$todo[] = sprintf( 'Comments are off in GGDS. The %d existing comments are kept, but not shown.', $scan['comments'] );
	}
	if ( $scan['plugins'] ) {
		$todo[] = 'These plugins may add inline scripts or styles, which a strict security policy blocks: ' . implode( ', ', $scan['plugins'] ) . '. Check your pages with them, and deactivate the ones you no longer need. The page builder can go once you are happy with your pages.';
	}
	return $todo;
}

/** Undo the switch: the old theme, every page's original content and page-builder settings, and GGDS's settings. */
function ggds_switch_undo() {
	$backup = get_option( GGDS_SWITCH_BACKUP );
	if ( ! is_array( $backup ) ) {
		return new WP_Error( 'ggds_switch_not_done', 'There is no switch to undo.' );
	}
	foreach ( (array) $backup['posts'] as $id ) {
		$id = (int) $id;
		if ( ! metadata_exists( 'post', $id, '_ggds_switch_before' ) ) {
			continue;
		}
		// Written straight to the database, so no filter (WordPress's own or a plugin's) changes a single byte.
		global $wpdb;
		$wpdb->update( $wpdb->posts, array( 'post_content' => (string) get_post_meta( $id, '_ggds_switch_before', true ) ), array( 'ID' => $id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		clean_post_cache( $id );
		foreach ( (array) get_post_meta( $id, '_ggds_switch_meta', true ) as $key => $value ) {
			update_post_meta( $id, $key, wp_slash( $value ) );
		}
		delete_post_meta( $id, '_ggds_switch_before' );
		delete_post_meta( $id, '_ggds_switch_meta' );
	}
	if ( ! empty( $backup['draft'] ) && get_post( (int) $backup['draft'] ) ) {
		wp_delete_post( (int) $backup['draft'], true );
	}
	if ( null === $backup['ggds_mods'] ) {
		delete_option( 'theme_mods_ggds' );
	} else {
		update_option( 'theme_mods_ggds', $backup['ggds_mods'] );
	}
	if ( wp_get_theme( (string) $backup['stylesheet'] )->exists() ) {
		switch_theme( (string) $backup['stylesheet'] );
		delete_option( 'theme_switch_menu_locations' ); // the old theme's menus, as they were
	}
	delete_option( GGDS_SWITCH_BACKUP );
	delete_option( GGDS_SWITCH_REPORT );
	return true;
}
