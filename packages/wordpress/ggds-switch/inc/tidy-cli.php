<?php
/**
 * WP-CLI: tidy up many websites the same way, from a script.
 *
 *   wp ggds-switch tidy scan [--format=table|json]       what GGDS > Tidy up content lists
 *   wp ggds-switch tidy apply [--dry-run] [--only=<keys>] [--action=unpublish|bin] [--include-check]
 *   wp ggds-switch tidy undo [<id>]                      the latest change, or the one given
 *   wp ggds-switch tidy log                              recent changes
 *
 * `apply` does what the screen chooses for people: WordPress's own examples go to the Bin, other sample text is
 * unpublished, and anything a person should judge ("To check", drafts, the homepage) is left. --action uses one
 * choice for everything it applies to (where that choice is open to the item); --only takes keys from `scan`, such
 * as post:12, or post IDs.
 *
 * @package GGDS_Switch
 */

defined( 'ABSPATH' ) || exit;

WP_CLI::add_command(
	'ggds-switch tidy',
	new class() {
		/**
		 * What GGDS > Tidy up content lists.
		 *
		 * [--format=<format>]
		 * : table or json. Default: table.
		 */
		public function scan( array $args, array $assoc ): void {
			$scan = ggds_tidy_scan();
			if ( ! $scan['ok'] ) {
				WP_CLI::error( 'placeholders.json is missing: install GGDS Switch again.' );
			}
			if ( 'json' === ( $assoc['format'] ?? '' ) ) {
				WP_CLI::line( (string) wp_json_encode( $scan, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
				return;
			}
			if ( ! $scan['items'] ) {
				WP_CLI::success( 'Nothing to tidy up.' );
				return;
			}
			$rows = array_map(
				static fn( $i ) => array(
					'key'       => $i['key'],
					'title'     => $i['title'],
					'status'    => $i['status'],
					'group'     => $i['group'],
					'why'       => implode( '; ', array_map( static fn( $r ) => $r['label'], $i['reasons'] ) ),
					'suggested' => $i['suggested'],
				),
				$scan['items']
			);
			WP_CLI\Utils\format_items( 'table', $rows, array( 'key', 'title', 'status', 'group', 'why', 'suggested' ) );
			WP_CLI::line( sprintf( '%d to fix, %d to check, %d drafts. Apply the suggestions with: wp ggds-switch tidy apply --dry-run', $scan['counts']['fix'], $scan['counts']['check'], $scan['counts']['hidden'] ) );
		}

		/**
		 * Do what is suggested (or --action) for each item to fix.
		 *
		 * [--dry-run]
		 * : Say what would change, and change nothing.
		 *
		 * [--only=<keys>]
		 * : Comma-separated keys from `scan` (post:12, option:blogdescription) or post IDs.
		 *
		 * [--action=<action>]
		 * : unpublish or bin, for everything applied to, instead of the suggestion.
		 *
		 * [--include-check]
		 * : Also apply --action to the items "to check". Needs --action.
		 */
		public function apply( array $args, array $assoc ): void {
			$action = isset( $assoc['action'] ) ? (string) $assoc['action'] : '';
			if ( '' !== $action && ! in_array( $action, array( 'unpublish', 'bin' ), true ) ) {
				WP_CLI::error( '--action is unpublish or bin.' );
			}
			if ( isset( $assoc['include-check'] ) && '' === $action ) {
				WP_CLI::error( '--include-check needs --action, because nothing is suggested for items to check.' );
			}
			$only = array();
			foreach ( array_filter( array_map( 'trim', explode( ',', (string) ( $assoc['only'] ?? '' ) ) ) ) as $k ) {
				$only[] = ctype_digit( $k ) ? 'post:' . $k : $k;
			}
			$choices = array();
			$plan    = array();
			foreach ( ggds_tidy_scan()['items'] as $item ) {
				if ( $only && ! in_array( $item['key'], $only, true ) ) {
					continue;
				}
				$open = 'fix' === $item['group'] || ( 'check' === $item['group'] && isset( $assoc['include-check'] ) ) || $only;
				$do   = '' !== $action && in_array( $action, $item['actions'], true ) ? $action : $item['suggested'];
				if ( ! $open || 'leave' === $do ) {
					continue;
				}
				$choices[ $item['key'] ] = $do;
				$plan[]                  = array( 'key' => $item['key'], 'title' => $item['title'], 'do' => ggds_tidy_action_words( $do ) );
			}
			if ( ! $plan ) {
				WP_CLI::success( 'Nothing to do.' );
				return;
			}
			WP_CLI\Utils\format_items( 'table', $plan, array( 'key', 'title', 'do' ) );
			if ( isset( $assoc['dry-run'] ) ) {
				WP_CLI::success( 'Nothing was changed (dry run).' );
				return;
			}
			$batch = ggds_tidy_apply( $choices );
			if ( is_wp_error( $batch ) ) {
				WP_CLI::error( $batch->get_error_message() );
			}
			WP_CLI::success( ggds_tidy_summary( $batch ) . '. Undo with: wp ggds-switch tidy undo ' . $batch['id'] );
		}

		/**
		 * Undo a change.
		 *
		 * [<id>]
		 * : The change, from `log`. Default: the latest one not undone.
		 */
		public function undo( array $args ): void {
			$id = (string) ( $args[0] ?? '' );
			if ( '' === $id ) {
				foreach ( ggds_tidy_log() as $batch ) {
					if ( ! $batch['undone'] ) {
						$id = $batch['id'];
						break;
					}
				}
			}
			if ( '' === $id ) {
				WP_CLI::error( 'There is no change to undo.' );
			}
			$result = ggds_tidy_undo( $id );
			if ( is_wp_error( $result ) ) {
				WP_CLI::error( $result->get_error_message() );
			}
			foreach ( $result['notes'] as $note ) {
				WP_CLI::warning( $note );
			}
			WP_CLI::success( sprintf( 'Undone: %d put back.', $result['done'] ) );
		}

		/** Recent changes. */
		public function log(): void {
			$rows = array_map(
				static fn( $b ) => array(
					'id'     => $b['id'],
					'when'   => wp_date( 'Y-m-d H:i', (int) $b['when'] ),
					'who'    => $b['who'],
					'what'   => ggds_tidy_summary( $b ),
					'undone' => $b['undone'] ? wp_date( 'Y-m-d H:i', (int) $b['undone']['when'] ) : '',
				),
				ggds_tidy_log()
			);
			WP_CLI\Utils\format_items( 'table', $rows, array( 'id', 'when', 'who', 'what', 'undone' ) );
		}
	}
);

/** A choice in a few words, for the command line. */
function ggds_tidy_action_words( string $action ): string {
	return array( 'unpublish' => 'unpublish', 'bin' => 'move to the Bin', 'clear' => 'clear' )[ $action ] ?? $action;
}
