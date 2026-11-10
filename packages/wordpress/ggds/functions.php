<?php
/**
 * GGDS for WordPress: the Ghana Government Design System as a classic theme. It outputs GGDS's own markup, so
 * pages look and work like every other GGDS website, and its front end runs under a strict Content Security
 * Policy (no inline scripts or styles: see inc/csp.php).
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;

require get_template_directory() . '/inc/settings.php';
require get_template_directory() . '/inc/parts.php';
require get_template_directory() . '/inc/csp.php';

add_action(
	'after_setup_theme',
	static function () {
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
		add_theme_support( 'custom-logo', array( 'height' => 88, 'width' => 88, 'flex-width' => true, 'flex-height' => true ) );
		add_theme_support( 'responsive-embeds' );
		// Editors write content; GGDS sets its look. No custom colours, sizes or gradients, which would need inline
		// styles and could break contrast.
		add_theme_support( 'editor-color-palette', array() );
		add_theme_support( 'disable-custom-colors' );
		add_theme_support( 'editor-gradient-presets', array() );
		add_theme_support( 'disable-custom-gradients' );
		add_theme_support( 'editor-font-sizes', array() );
		add_theme_support( 'disable-custom-font-sizes' );
		remove_theme_support( 'core-block-patterns' );
		add_theme_support( 'editor-styles' );
		add_editor_style( array( 'assets/ggds.min.css', 'assets/editor.css' ) );
		register_nav_menus(
			array(
				'primary' => 'Main sections (header, tab bar and homepage cards)',
				'tasks'   => 'Common tasks (homepage)',
				'footer'  => 'Footer sections (each with up to five pages under it)',
				'legal'   => 'Footer links (Accessibility, Privacy, Disclaimer)',
			)
		);
	}
);

/** GGDS's styles, the institution's theme, and the optional script, all served from this website. */
add_action(
	'wp_enqueue_scripts',
	static function () {
		$uri     = get_template_directory_uri() . '/assets';
		$version = wp_get_theme( get_template() )->get( 'Version' );
		wp_enqueue_style( 'ggds', $uri . '/ggds.min.css', array(), $version );
		$theme = (string) ggds_mod( 'theme' );
		if ( '' !== $theme && is_readable( get_template_directory() . '/assets/themes/' . $theme . '.css' ) ) {
			wp_enqueue_style( 'ggds-theme', $uri . '/themes/' . $theme . '.css', array( 'ggds' ), $version );
		}
		wp_enqueue_style( 'ggds-wordpress', $uri . '/wordpress.css', array( 'ggds' ), $version );
		wp_enqueue_script( 'ggds', $uri . '/js/auto.js', array(), $version, array( 'in_footer' => false ) );
	}
);

// The script is an ES module.
add_filter(
	'wp_script_attributes',
	static function ( array $attributes ): array {
		if ( 'ggds-js' === ( $attributes['id'] ?? '' ) ) {
			$attributes['type'] = 'module';
		}
		return $attributes;
	}
);

// Excerpts in lists: one sentence or two, without "[…]".
add_filter( 'excerpt_length', static fn() => 30 );
add_filter( 'excerpt_more', static fn() => '…' );
