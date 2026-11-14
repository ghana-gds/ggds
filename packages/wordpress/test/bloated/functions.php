<?php
// A stand-in for a heavy theme, for the GGDS Switch tests (scripts/test-wordpress.mjs).
add_action( 'after_setup_theme', static function () {
	add_theme_support( 'custom-logo' );
	add_theme_support( 'title-tag' );
	register_nav_menus( array( 'main-menu' => 'Main menu', 'footer-menu' => 'Footer menu' ) );
} );
add_action( 'widgets_init', static function () {
	register_sidebar( array( 'id' => 'sidebar-1', 'name' => 'Sidebar' ) );
} );
add_action( 'wp_head', static function () {
	echo '<style>body{font-family:Comic Sans MS}</style><script>var bloat = 1;</script>';
} );
