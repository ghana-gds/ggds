<?php
/**
 * The institution's details: Appearance > Customise > GGDS. The site title is the institution's name and the
 * tagline its purpose, shown in the hero.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;

function ggds_defaults(): array {
	return array(
		'short_name'         => '',
		'initials'           => '',
		'country'            => 'Republic of Ghana',
		'theme'              => '',
		'official_host'      => '',
		'register_url'       => '',
		'hero_title'         => 'What do you need help with?',
		'search_placeholder' => '',
		'purpose'            => '',
		'address'            => '',
		'email'              => '',
		'phone'              => '',
		'contact_url'        => '',
	);
}

/** The ready-made institution themes shipped with GGDS: slug => name. */
function ggds_themes(): array {
	$file = get_template_directory() . '/assets/themes/themes.json';
	$data = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : array();
	$out  = array( '' => 'Default (government blue)' );
	foreach ( $data['themes'] ?? array() as $t ) {
		$out[ $t['slug'] ] = $t['name'];
	}
	return $out;
}

add_action(
	'customize_register',
	static function ( WP_Customize_Manager $wp_customize ) {
		$wp_customize->add_section( 'ggds', array( 'title' => 'GGDS', 'priority' => 30, 'description' => 'Your institution\'s details. The site title is its name, and the tagline says what it does.' ) );
		$fields = array(
			'short_name'         => array( 'Short name', 'text', 'Such as NCA. Used in the banner.' ),
			'initials'           => array( 'Initials for the badge', 'text', 'Shown until you add a logo (Site identity).' ),
			'country'            => array( 'Line under the name', 'text', '' ),
			'theme'              => array( 'Institution theme', 'select', 'Your institution\'s colour, in the header line, hero and footer.' ),
			'official_host'      => array( 'Official address', 'text', 'Such as nca.gov.gh. The banner says the site is official only when it is served from this address.' ),
			'register_url'       => array( 'Register of official websites', 'url', 'Where the banner tells people to check the address.' ),
			'hero_title'         => array( 'Homepage question', 'text', '' ),
			'search_placeholder' => array( 'Homepage search example', 'text', 'Such as: Search, for example: SIM registration' ),
			'purpose'            => array( 'Footer: what you do', 'text', '' ),
			'address'            => array( 'Footer: address', 'text', '' ),
			'email'              => array( 'Footer: email', 'email', '' ),
			'phone'              => array( 'Footer: phone', 'text', '' ),
			'contact_url'        => array( 'Footer: contact page', 'url', '' ),
		);
		foreach ( $fields as $key => [ $label, $type, $help ] ) {
			$sanitize = 'url' === $type ? 'esc_url_raw' : ( 'email' === $type ? 'sanitize_email' : 'sanitize_text_field' );
			if ( 'theme' === $key ) {
				$sanitize = static fn( $v ) => array_key_exists( $v, ggds_themes() ) ? $v : '';
			}
			$wp_customize->add_setting( 'ggds_' . $key, array( 'default' => ggds_defaults()[ $key ], 'sanitize_callback' => $sanitize ) );
			$control = array( 'label' => $label, 'section' => 'ggds', 'type' => $type, 'description' => $help );
			if ( 'select' === $type ) {
				$control['choices'] = ggds_themes();
			}
			$wp_customize->add_control( 'ggds_' . $key, $control );
		}
	}
);
