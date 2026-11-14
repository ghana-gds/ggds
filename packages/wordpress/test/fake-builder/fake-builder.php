<?php
/**
 * Plugin Name: Fake builder (test)
 * Description: A stand-in for a page builder's shortcodes (WPBakery-style), for the GGDS Switch tests. Not for real websites.
 */
add_action( 'init', static function () {
	add_shortcode( 'vc_row', static fn( $a, $c = '' ) => '<div class="vc_row wpb_row" style="padding:40px;background:#f5f5f5"><div class="vc_row-inner">' . do_shortcode( $c ) . '</div></div>' );
	add_shortcode( 'vc_column', static fn( $a, $c = '' ) => '<div class="vc_column_container vc_col-sm-12"><div class="vc_column-inner"><div class="wpb_wrapper">' . do_shortcode( $c ) . '</div></div></div>' );
	add_shortcode( 'vc_column_text', static fn( $a, $c = '' ) => '<div class="wpb_text_column wpb_content_element"><div class="wpb_wrapper">' . $c . '</div></div>' );
	add_shortcode( 'vc_slider', static fn() => '<div class="owl-carousel"><div class="slide"><h1 style="color:#fff">Slide one</h1><p>Welcome to our new website</p></div><button class="owl-next">Next</button></div><script>jQuery(".owl-carousel").owlCarousel();</script>' );
	add_shortcode( 'vc_icon', static fn() => '<span class="vc_icon_element"><i class="fa fa-star"></i></span>' );
} );
