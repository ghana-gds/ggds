<?php
/**
 * Keep the front end free of inline scripts and styles, so it runs under a strict Content Security Policy
 * ("script-src 'self'; style-src 'self'"), like every GGDS website. WordPress adds several by default; these are
 * the ones a GGDS site does not need. A test checks every front-end page for inline scripts, styles and style
 * attributes. The admin area is not affected.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'init',
	static function () {
		// Emoji: modern devices draw emoji themselves.
		remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
		remove_action( 'wp_print_styles', 'print_emoji_styles' );
		remove_action( 'wp_enqueue_scripts', 'wp_enqueue_emoji_styles' );
		// Global styles and block supports: GGDS styles the content instead.
		remove_action( 'wp_enqueue_scripts', 'wp_enqueue_global_styles' );
		remove_action( 'wp_footer', 'wp_enqueue_global_styles', 1 );
		remove_action( 'wp_enqueue_scripts', 'wp_enqueue_classic_theme_styles' );
		remove_action( 'wp_enqueue_scripts', 'wp_enqueue_stored_styles' );
		remove_action( 'wp_footer', 'wp_enqueue_stored_styles', 1 );
		// A small inline style for images with sizes="auto".
		remove_action( 'wp_head', 'wp_print_auto_sizes_contain_css_fix', 1 );
		// Customiser "Additional CSS" is printed inline: put site CSS in a child theme's stylesheet instead.
		remove_action( 'wp_head', 'wp_custom_css_cb', 101 );
		// Do not advertise the WordPress version.
		remove_action( 'wp_head', 'wp_generator' );
	}
);

// Block styles as stylesheet links, never copied inline into the page.
add_filter( 'styles_inline_size_limit', '__return_zero' );
add_filter( 'should_load_separate_core_block_assets', '__return_false' );

// Speculative loading rules are an inline script.
add_filter( 'wp_speculation_rules_configuration', '__return_null' );

// Comments are off: government websites get feedback through contact forms that someone answers.
add_filter( 'comments_open', '__return_false', 20 );
add_filter( 'pings_open', '__return_false', 20 );
