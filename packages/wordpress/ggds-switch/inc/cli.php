<?php
/**
 * WP-CLI: switch many websites the same way, from a script.
 *
 *   wp ggds-switch scan [--format=json]      what is on the website, and what the switch proposes
 *   wp ggds-switch show <id>                 one page's content as the switch would clean it
 *   wp ggds-switch run [--dry-run] [--from=ggds-site.json] [--short_name=NCA] [--official_host=nca.gov.gh] [--theme=nca] [--email=…]
 *                      [--phone=…] [--address=…] [--purpose=…] [--contact_url=…]
 *                      [--primary=<menu>] [--tasks=<menu>] [--footer=<menu>] [--legal=<menu>]
 *   wp ggds-switch undo
 *
 * Details and menus not given are the scan's proposal. --from fills the details from the GGDS website builder's
 * ggds-site.json first; a detail given as an option wins over the file. A menu is its ID, slug or name; 0 for none.
 *
 * @package GGDS_Switch
 */

defined( 'ABSPATH' ) || exit;

WP_CLI::add_command(
	'ggds-switch',
	new class() {
		/**
		 * What is on the website, and what the switch proposes.
		 *
		 * [--format=<format>]
		 * : table or json. Default: table.
		 */
		public function scan( array $args, array $assoc ): void {
			$scan = ggds_switch_scan();
			if ( 'json' === ( $assoc['format'] ?? '' ) ) {
				WP_CLI::line( (string) wp_json_encode( $scan, JSON_PRETTY_PRINT ) );
				return;
			}
			$rows = array();
			foreach ( array( 'theme', 'posts', 'builders', 'styled', 'logo', 'front', 'widgets', 'comments', 'plugins', 'menus', 'details' ) as $key ) {
				$value  = $scan[ $key ];
				$rows[] = array( 'what' => $key, 'found' => is_array( $value ) ? (string) wp_json_encode( $value ) : (string) $value );
			}
			WP_CLI\Utils\format_items( 'table', $rows, array( 'what', 'found' ) );
		}

		/**
		 * One page's content as the switch would clean it.
		 *
		 * <id>
		 * : The page or post ID.
		 */
		public function show( array $args ): void {
			$id    = (int) $args[0];
			$notes = array();
			WP_CLI::line( ggds_switch_clean( ggds_switch_source( $id, ggds_switch_builder_of( $id ) ), $notes ) );
			foreach ( $notes as $note ) {
				WP_CLI::warning( $note );
			}
		}

		/**
		 * Switch to GGDS.
		 *
		 * [--dry-run]
		 * : Say what would change, and change nothing.
		 *
		 * [--from=<file>]
		 * : The institution's details from the GGDS website builder's ggds-site.json.
		 *
		 * [--<field>=<value>]
		 * : An institution detail or a menu (see the top of this file).
		 */
		public function run( array $args, array $assoc ): void {
			$scan    = ggds_switch_scan();
			$details = $scan['details'];
			if ( isset( $assoc['from'] ) ) {
				$site = is_readable( (string) $assoc['from'] ) ? json_decode( (string) file_get_contents( (string) $assoc['from'] ), true ) : null;
				$from = is_array( $site ) ? ggds_switch_details_from_site( $site ) : array();
				if ( ! $from ) {
					WP_CLI::error( sprintf( '%s is not a ggds-site.json from the GGDS website builder.', $assoc['from'] ) );
				}
				$details = array_merge( $details, $from );
			}
			foreach ( ggds_defaults_for_switch() as $key ) {
				if ( isset( $assoc[ $key ] ) ) {
					$details[ $key ] = sanitize_text_field( (string) $assoc[ $key ] );
				}
			}
			if ( isset( $assoc['short_name'] ) && ! isset( $assoc['initials'] ) ) {
				$details['initials'] = $details['short_name'];
			}
			$menus = $scan['menus'];
			foreach ( array_keys( $menus ) as $loc ) {
				if ( isset( $assoc[ $loc ] ) ) {
					$menu          = '0' === (string) $assoc[ $loc ] ? null : wp_get_nav_menu_object( is_numeric( $assoc[ $loc ] ) ? (int) $assoc[ $loc ] : (string) $assoc[ $loc ] );
					$menus[ $loc ] = $menu ? (int) $menu->term_id : 0;
				}
			}
			$dry    = isset( $assoc['dry-run'] );
			$result = ggds_switch_run( $details, $menus, $dry );
			if ( is_wp_error( $result ) ) {
				WP_CLI::error( $result->get_error_message() );
			}
			WP_CLI::line( sprintf( '%s %d pages and posts.', $dry ? 'Would clean' : 'Cleaned', count( $result['cleaned'] ) ) );
			foreach ( array( 'skipped', 'cleaned' ) as $kind ) {
				foreach ( $result[ $kind ] as $id => $notes ) {
					foreach ( $notes as $note ) {
						WP_CLI::line( sprintf( '  %d %s: %s', $id, get_the_title( (int) $id ), $note ) );
					}
				}
			}
			foreach ( $result['todo'] as $line ) {
				WP_CLI::line( '- ' . $line );
			}
			WP_CLI::success( $dry ? 'Nothing was changed (dry run).' : 'The website now uses GGDS. Undo with: wp ggds-switch undo' );
		}

		/** Undo the switch. */
		public function undo(): void {
			$result = ggds_switch_undo();
			if ( is_wp_error( $result ) ) {
				WP_CLI::error( $result->get_error_message() );
			}
			WP_CLI::success( 'The old theme and every page are back as they were.' );
		}
	}
);
