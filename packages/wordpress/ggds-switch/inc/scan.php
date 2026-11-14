<?php
/**
 * The scan: what is on the website now (theme, page builders, menus, logo, content with inline styles, widgets,
 * comments, plugins that would break a strict security policy), and what the switch proposes for each.
 * It only reads: nothing changes until someone presses "Switch to GGDS".
 *
 * @package GGDS_Switch
 */

defined( 'ABSPATH' ) || exit;

/** The post types whose content is cleaned: pages, posts and any other public type with its own editor. */
function ggds_switch_post_types(): array {
	$types = array_values( array_diff( get_post_types( array( 'public' => true ) ), array( 'attachment' ) ) );
	return array_values( array_filter( $types, static fn( $t ) => post_type_supports( $t, 'editor' ) ) );
}

/** IDs of every post that will be looked at, newest first. */
function ggds_switch_post_ids(): array {
	return get_posts(
		array(
			'post_type'        => ggds_switch_post_types(),
			'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future' ),
			'numberposts'      => -1,
			'fields'           => 'ids',
			'suppress_filters' => true,
		)
	);
}

/**
 * Page builders: [ slug => [ name, meta key that marks a post as built with it, value, plugin file ] ].
 * Shortcode builders are found by their shortcodes (see clean.php).
 */
function ggds_switch_builders(): array {
	return array(
		'elementor' => array( 'Elementor', '_elementor_edit_mode', 'builder', 'elementor/elementor.php' ),
		'beaver'    => array( 'Beaver Builder', '_fl_builder_enabled', '1', 'beaver-builder-lite-version/fl-builder.php' ),
		'divi'      => array( 'Divi', '_et_pb_use_builder', 'on', 'divi-builder/divi-builder.php' ),
		'wpbakery'  => array( 'WPBakery', '_wpb_vc_js_status', 'true', 'js_composer/js_composer.php' ),
		'oxygen'    => array( 'Oxygen', 'ct_builder_shortcodes', '', 'oxygen/functions.php' ),
		'brizy'     => array( 'Brizy', 'brizy_post_uid', '', 'brizy/brizy.php' ),
		'siteorigin' => array( 'SiteOrigin Page Builder', 'panels_data', '', 'siteorigin-panels/siteorigin-panels.php' ),
	);
}

/** Which builder built a post, or '' for ordinary content. */
function ggds_switch_builder_of( int $id ): string {
	foreach ( ggds_switch_builders() as $slug => [ , $key, $value ] ) {
		$meta = get_post_meta( $id, $key, true );
		if ( '' !== $meta && ( '' === $value || (string) $meta === $value ) ) {
			return $slug;
		}
	}
	$content = (string) get_post_field( 'post_content', $id );
	if ( preg_match( '/\[(' . implode( '|', array_map( static fn( $p ) => preg_quote( $p, '/' ), ggds_switch_builder_prefixes() ) ) . ')/', $content ) ) {
		return 'shortcodes';
	}
	return '';
}

/** Plugins known to add inline scripts or styles, sliders or pop-ups: these break a strict security policy. */
function ggds_switch_heavy_plugins(): array {
	$known = '/elementor|js_composer|divi|fl-builder|beaver|fusion|avada|oxygen|brizy|siteorigin|revslider|smart-slider|layerslider|master-slider|ml-slider|slider-revolution|popup|optinmonster|essential-addons|ultimate-addons|happy-elementor|wpbakery|thrive|jetpack|wp-rocket|autoptimize|sassy-social|addtoany|monarch|bloom|google-site-kit|wpforms|contact-form-7|ninja-forms|gravityforms|forminator/i';
	$found = array();
	foreach ( (array) get_option( 'active_plugins', array() ) as $file ) {
		if ( preg_match( $known, (string) $file ) && ! str_starts_with( (string) $file, 'ggds-switch/' ) ) {
			$data             = function_exists( 'get_plugin_data' ) && is_readable( WP_PLUGIN_DIR . '/' . $file ) ? get_plugin_data( WP_PLUGIN_DIR . '/' . $file, false, false ) : array();
			$found[ $file ] = (string) ( $data['Name'] ?? '' ) ?: dirname( (string) $file );
		}
	}
	return $found;
}

/** The menu locations of the current theme: [ location => menu ID ]. */
function ggds_switch_old_locations(): array {
	$mods = get_option( 'theme_mods_' . get_option( 'stylesheet' ), array() );
	return array_filter( array_map( 'intval', (array) ( $mods['nav_menu_locations'] ?? array() ) ) );
}

/**
 * Which existing menu goes where in GGDS: [ primary, tasks, footer, legal ] => menu ID or 0.
 * Main: the menu in the old theme's main location. Footer links: a menu that is mostly privacy, accessibility and
 * terms. Footer sections: a footer menu with pages under its items, or else the main menu, whose sections and their
 * pages make a good footer. Common tasks: left for a person to choose.
 */
function ggds_switch_propose_menus(): array {
	$locations = ggds_switch_old_locations();
	$menus     = wp_get_nav_menus();
	$out       = array( 'primary' => 0, 'tasks' => 0, 'footer' => 0, 'legal' => 0 );
	$legal_re  = '/privacy|accessib|disclaim|terms|cookie|copyright|contact|sitemap|faq/i';
	$is_legal  = static function ( int $id ) use ( $legal_re ): bool {
		$items = wp_get_nav_menu_items( $id ) ?: array();
		$hits  = count( array_filter( $items, static fn( $i ) => preg_match( $legal_re, (string) $i->title ) ) );
		return $items && $hits * 2 >= count( $items );
	};
	$nested = static function ( int $id ): bool {
		foreach ( wp_get_nav_menu_items( $id ) ?: array() as $i ) {
			if ( (int) $i->menu_item_parent ) {
				return true;
			}
		}
		return false;
	};
	foreach ( $locations as $loc => $id ) {
		if ( ! $out['primary'] && preg_match( '/primary|main|header|menu-1|top|navigation/i', (string) $loc ) && ! $is_legal( $id ) ) {
			$out['primary'] = $id;
		}
	}
	foreach ( $locations as $loc => $id ) {
		if ( $id === $out['primary'] || ! preg_match( '/footer|bottom|menu-2|legal|secondary/i', (string) $loc ) ) {
			continue;
		}
		if ( ! $out['legal'] && $is_legal( $id ) ) {
			$out['legal'] = $id;
		} elseif ( ! $out['footer'] && $nested( $id ) ) {
			$out['footer'] = $id;
		}
	}
	// A menu not in any location can still be the main one: the first menu, if nothing else was found.
	if ( ! $out['primary'] && $menus ) {
		$out['primary'] = (int) $menus[0]->term_id;
	}
	if ( ! $out['legal'] ) {
		foreach ( $menus as $m ) {
			if ( (int) $m->term_id !== $out['primary'] && $is_legal( (int) $m->term_id ) ) {
				$out['legal'] = (int) $m->term_id;
				break;
			}
		}
	}
	if ( ! $out['footer'] && $out['primary'] && $nested( $out['primary'] ) ) {
		$out['footer'] = $out['primary'];
	}
	return $out;
}

/** The institution's details, guessed from the website, for a person to check. */
function ggds_switch_propose_details(): array {
	$name  = (string) get_bloginfo( 'name' );
	$host  = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
	$host  = (string) preg_replace( '/^www\./', '', $host );
	$short = preg_match( '/\(([A-Z][A-Za-z\-]{1,9})\)/', $name, $m ) ? $m[1] : '';
	// The institution theme: one whose short name or slug matches the address or the name.
	$theme = '';
	$file  = get_theme_root() . '/ggds/assets/themes/themes.json';
	$file  = is_readable( $file ) ? $file : GGDS_SWITCH_DIR . 'theme/ggds/assets/themes/themes.json';
	$data  = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : array();
	foreach ( $data['themes'] ?? array() as $t ) {
		$label = strtolower( (string) $t['shortName'] );
		if ( str_starts_with( $host, strtolower( (string) $t['slug'] ) . '.' ) || ( '' !== $short && strtolower( $short ) === $label ) || 0 === strcasecmp( $name, (string) $t['name'] ) ) {
			$theme = (string) $t['slug'];
			$short = '' !== $short ? $short : (string) $t['shortName'];
			break;
		}
	}
	// Contact details: from the contact page, if there is one.
	$email   = '';
	$phone   = '';
	$contact = '';
	foreach ( array( 'contact-us', 'contact', 'contacts', 'get-in-touch' ) as $slug ) {
		$page = get_page_by_path( $slug );
		if ( $page ) {
			$contact = (string) get_permalink( $page );
			$text    = wp_strip_all_tags( (string) $page->post_content . ' ' . (string) get_post_meta( $page->ID, '_elementor_data', true ) );
			if ( preg_match( '/[\w.+-]+@[\w-]+(\.[\w-]+)+/', $text, $e ) ) {
				$email = $e[0];
			}
			if ( preg_match( '/(\+233|\b0)[\s-]?\d{2,3}[\s-]?\d{3}[\s-]?\d{3,4}\b/', $text, $p ) ) {
				$phone = trim( $p[0] );
			}
			break;
		}
	}
	return array(
		'short_name'    => $short,
		'initials'      => $short,
		'theme'         => $theme,
		'official_host' => str_ends_with( $host, '.gov.gh' ) ? $host : '',
		'email'         => $email,
		'phone'         => $phone,
		'contact_url'   => $contact,
		'purpose'       => (string) get_bloginfo( 'description' ),
	);
}

/** Everything the switch would do, for the admin screen and `wp ggds-switch scan`. */
function ggds_switch_scan(): array {
	$theme    = wp_get_theme();
	$builders = array();
	$styled   = 0;
	$ids      = ggds_switch_post_ids();
	foreach ( $ids as $id ) {
		$b = ggds_switch_builder_of( (int) $id );
		if ( '' !== $b ) {
			$builders[ $b ] = ( $builders[ $b ] ?? 0 ) + 1;
		}
		if ( preg_match( '/\sstyle=|<font|<center/i', (string) get_post_field( 'post_content', $id ) ) ) {
			++$styled;
		}
	}
	$widgets = 0;
	foreach ( wp_get_sidebars_widgets() as $sidebar => $list ) {
		if ( 'wp_inactive_widgets' !== $sidebar && is_array( $list ) ) {
			$widgets += count( $list );
		}
	}
	$mods = get_option( 'theme_mods_' . get_option( 'stylesheet' ), array() );
	return array(
		'theme'     => array( 'name' => $theme->get( 'Name' ), 'stylesheet' => get_stylesheet(), 'block' => $theme->is_block_theme() ),
		'is_ggds'   => 'ggds' === get_template(),
		'posts'     => count( $ids ),
		'builders'  => $builders,
		'styled'    => $styled,
		'menus'     => ggds_switch_propose_menus(),
		'logo'      => (int) ( $mods['custom_logo'] ?? get_theme_mod( 'custom_logo' ) ),
		'front'     => 'page' === get_option( 'show_on_front' ) ? (int) get_option( 'page_on_front' ) : 0,
		'widgets'   => $widgets,
		'comments'  => (int) wp_count_comments()->approved,
		'plugins'   => ggds_switch_heavy_plugins(),
		'details'   => ggds_switch_propose_details(),
	);
}

/**
 * The institution's details from a ggds-site.json, the file the GGDS website builder (and `npm init @ggds`) makes:
 * the same keys as ggds_switch_propose_details(). Only what the file gives, and only valid values: an unknown theme
 * (or a colour of its own) is left out, so the form keeps its own choice. The name stays the site title.
 */
function ggds_switch_details_from_site( array $site ): array {
	$str = static fn( $v ) => is_scalar( $v ) ? trim( sanitize_text_field( (string) $v ) ) : '';
	$out = array();
	$short = strtoupper( $str( $site['short'] ?? '' ) );
	if ( '' !== $short ) {
		$out['short_name'] = $short;
		$out['initials']   = $short;
	}
	$host = strtolower( (string) preg_replace( '#^https?://|/.*$#', '', $str( $site['host'] ?? '' ) ) );
	if ( '' !== $host ) {
		$out['official_host'] = $host;
	}
	$theme = $str( $site['theme'] ?? '' );
	$file  = get_theme_root() . '/ggds/assets/themes/themes.json';
	$file  = is_readable( $file ) ? $file : GGDS_SWITCH_DIR . 'theme/ggds/assets/themes/themes.json';
	$known = array_column( ( is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : array() )['themes'] ?? array(), 'slug' );
	if ( in_array( $theme, $known, true ) ) {
		$out['theme'] = $theme;
	}
	$email = sanitize_email( (string) ( $site['email'] ?? '' ) );
	if ( '' !== $email ) {
		$out['email'] = $email;
	}
	foreach ( array( 'phone', 'purpose' ) as $key ) {
		if ( '' !== $str( $site[ $key ] ?? '' ) ) {
			$out[ $key ] = $str( $site[ $key ] );
		}
	}
	$lines = $site['offices'][0]['lines'] ?? array();
	$lines = is_array( $lines ) ? $lines : explode( "\n", (string) $lines );
	$lines = array_filter( array_map( $str, $lines ) );
	if ( $lines ) {
		$out['address'] = implode( ', ', $lines );
	}
	return $out;
}
