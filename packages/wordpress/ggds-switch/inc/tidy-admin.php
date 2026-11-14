<?php
/**
 * GGDS > Tidy up content: what we found, why, where it is used, and what to do with each, already chosen where
 * that is clearly safe. One button does it all; the message afterwards has an undo button, and every change stays
 * in "Recent changes" with its own undo.
 *
 * @package GGDS_Switch
 */

defined( 'ABSPATH' ) || exit;

const GGDS_TIDY_CAP = 'edit_others_pages';

// On the dashboard and the lists of pages and posts: a short notice when there is something to fix.
add_action(
	'admin_notices',
	static function () {
		$screen = get_current_screen();
		if ( ! $screen || ! current_user_can( GGDS_TIDY_CAP ) || ! in_array( $screen->id, array( 'dashboard', 'edit-page', 'edit-post' ), true ) ) {
			return;
		}
		$count = ggds_tidy_count();
		if ( ! $count ) {
			return;
		}
		printf(
			'<div class="notice notice-warning"><p><strong>%s</strong> %s <a href="%s">%s</a></p></div>',
			esc_html( 1 === $count ? 'Something on your website looks like sample or example content.' : sprintf( '%d things on your website look like sample or example content.', $count ) ),
			esc_html( 'Take them off before people see them.' ),
			esc_url( ggds_switch_url( 'ggds-tidy' ) ),
			esc_html( 1 === $count ? 'Review it' : 'Review them' )
		);
	}
);

/** A message for the next screen: [ type, text, batch (for its undo button), notes ]. */
function ggds_tidy_flash( array $message ): void {
	set_transient( 'ggds_tidy_flash_' . get_current_user_id(), $message, 120 );
}

add_action(
	'admin_post_ggds_tidy',
	static function () {
		if ( ! current_user_can( GGDS_TIDY_CAP ) ) {
			wp_die( 'You need to be allowed to edit other people\'s pages to tidy up content.' );
		}
		check_admin_referer( 'ggds_tidy' );
		$do = sanitize_key( wp_unslash( $_POST['do'] ?? '' ) );
		if ( 'undo' === $do ) {
			$result = ggds_tidy_undo( sanitize_text_field( wp_unslash( $_POST['batch'] ?? '' ) ) );
			if ( is_wp_error( $result ) ) {
				ggds_tidy_flash( array( 'type' => 'error', 'text' => $result->get_error_message() ) );
			} else {
				$text = $result['done'] ? 'Undone: everything is back as it was.' : 'Nothing could be put back.';
				if ( $result['done'] && $result['notes'] ) {
					$text = 'Undone, except for what is listed below.';
				}
				ggds_tidy_flash( array( 'type' => $result['notes'] ? 'warning' : 'success', 'text' => $text, 'notes' => $result['notes'] ) );
			}
		} else {
			$choices = array();
			foreach ( (array) wp_unslash( $_POST['tidy'] ?? array() ) as $key => $action ) {
				if ( preg_match( '/^(post|comment|option|widget):[\w-]+$/', (string) $key ) ) {
					$choices[ (string) $key ] = sanitize_key( (string) $action );
				}
			}
			$batch = ggds_tidy_apply( $choices );
			if ( is_wp_error( $batch ) ) {
				ggds_tidy_flash( array( 'type' => 'info', 'text' => $batch->get_error_message() ) );
			} else {
				ggds_tidy_flash( array( 'type' => 'success', 'text' => ggds_tidy_summary( $batch ) . '.', 'batch' => $batch['id'] ) );
			}
		}
		wp_safe_redirect( ggds_switch_url( 'ggds-tidy' ) );
		exit;
	}
);

/** The words for each choice, in the "What to do" list. */
function ggds_tidy_action_label( string $action ): string {
	return array(
		'unpublish' => 'Unpublish (keep as a draft)',
		'bin'       => 'Move to the Bin',
		'clear'     => 'Clear it',
		'leave'     => 'Leave it',
	)[ $action ] ?? $action;
}

/** "Draft", "Scheduled": a status in words, for anything but published. */
function ggds_tidy_status_label( string $status ): string {
	return array(
		'future'  => 'Scheduled',
		'private' => 'Private',
		'draft'   => 'Draft',
		'pending' => 'Waiting for review',
	)[ $status ] ?? '';
}

/** An undo button for a batch. */
function ggds_tidy_undo_button( string $batch, string $label = 'Undo' ): string {
	return '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="ggds-tidy__inline">'
		. '<input type="hidden" name="action" value="ggds_tidy"><input type="hidden" name="do" value="undo">'
		. '<input type="hidden" name="batch" value="' . esc_attr( $batch ) . '">'
		. wp_nonce_field( 'ggds_tidy', '_wpnonce', true, false )
		. '<button type="submit" class="button">' . esc_html( $label ) . '</button></form>';
}

/** The screen. */
function ggds_tidy_screen(): void {
	$flash = get_transient( 'ggds_tidy_flash_' . get_current_user_id() );
	delete_transient( 'ggds_tidy_flash_' . get_current_user_id() );
	$scan = ggds_tidy_scan();

	echo '<div class="wrap ggds-tidy">';
	echo '<h1>Tidy up content</h1>';
	echo '<p class="ggds-tidy__lead">Find sample text, test pages and the examples WordPress and your theme came with, and take them off your website before people see them.</p>';

	if ( is_array( $flash ) ) {
		$type = in_array( $flash['type'] ?? '', array( 'success', 'warning', 'error', 'info' ), true ) ? $flash['type'] : 'info';
		echo '<div class="notice notice-' . esc_attr( $type ) . ' ggds-tidy__flash" role="status"><p>' . esc_html( (string) $flash['text'] );
		if ( ! empty( $flash['batch'] ) ) {
			echo ' ' . ggds_tidy_undo_button( (string) $flash['batch'] ); // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts
		}
		echo '</p>';
		if ( ! empty( $flash['notes'] ) ) {
			echo '<ul class="ul-disc">';
			foreach ( $flash['notes'] as $note ) {
				echo '<li>' . esc_html( (string) $note ) . '</li>';
			}
			echo '</ul>';
		}
		echo '</div>';
	}

	if ( ! $scan['ok'] ) {
		echo '<div class="notice notice-error inline"><p>GGDS Switch is missing its list of phrases (placeholders.json). Install it again from the GGDS release.</p></div></div>';
		return;
	}

	$groups = array( 'fix' => array(), 'check' => array(), 'hidden' => array() );
	foreach ( $scan['items'] as $item ) {
		$groups[ $item['group'] ][] = $item;
	}
	$c = $scan['counts'];

	if ( ! $scan['items'] ) {
		echo '<div class="notice notice-success inline ggds-tidy__clear"><p><strong>Nothing to tidy up.</strong> We found no sample text, example content, demonstration pages or empty pages.</p>';
		echo '<p>We can only find what looks like an example. Before your website goes live, read each page and check its words are right, up to date and yours.</p></div>';
	} else {
		$parts = array();
		if ( $c['fix'] ) {
			$parts[] = sprintf( '<strong>%d to fix</strong>', $c['fix'] );
		}
		if ( $c['check'] ) {
			$parts[] = sprintf( '%d to check', $c['check'] );
		}
		if ( $c['hidden'] ) {
			$parts[] = sprintf( '%d %s nobody else can see yet', $c['hidden'], 1 === $c['hidden'] ? 'draft' : 'drafts' );
		}
		echo '<p class="ggds-tidy__summary">We found ' . wp_kses( implode( ', ', $parts ), array( 'strong' => array() ) ) . '.</p>';

		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" id="ggds-tidy-form">';
		echo '<input type="hidden" name="action" value="ggds_tidy"><input type="hidden" name="do" value="apply">';
		wp_nonce_field( 'ggds_tidy' );

		if ( $groups['fix'] ) {
			echo '<h2>To fix</h2>';
			echo '<p>These are on your website now, where anyone can see them. We have chosen what to do with each one. Change any you want to keep.</p>';
			ggds_tidy_table( $groups['fix'], 'To fix' );
		}
		if ( $groups['check'] ) {
			echo '<h2>To check</h2>';
			echo '<p>These may be real, so nothing happens to them unless you choose. Look at each one.</p>';
			ggds_tidy_table( $groups['check'], 'To check' );
		}
		if ( $groups['hidden'] ) {
			echo '<details class="ggds-tidy__hidden"><summary><h2>' . esc_html( sprintf( 'Not published yet (%d)', count( $groups['hidden'] ) ) ) . '</h2></summary>';
			echo '<p>Drafts and pages waiting for review that have sample text in them. Nobody else can see them. Rewrite them before you publish them, or move them to the Bin.</p>';
			ggds_tidy_table( $groups['hidden'], 'Not published yet' );
			echo '</details>';
		}

		$changeable = (bool) array_filter( $scan['items'], static fn( $i ) => count( $i['actions'] ) > 1 );
		if ( $changeable ) {
			echo '<div class="ggds-tidy__apply">';
			echo '<p><button type="submit" class="button button-primary button-large" id="ggds-tidy-apply">Make these changes</button></p>';
			echo '<p class="description" id="ggds-tidy-apply-hint" aria-live="polite">Nothing is deleted for good. You can undo this straight afterwards, or later from “Recent changes”.</p>';
			echo '</div>';
		}
		echo '</form>';
	}

	ggds_tidy_recent();

	if ( ! ggds_switch_done() && 'ggds' !== get_template() ) {
		echo '<h2>Moving to GGDS?</h2><p>Tidy up first, so no sample pages move with you. Then <a href="' . esc_url( ggds_switch_url( 'ggds-switch' ) ) . '">switch to GGDS</a>.</p>';
	}
	echo '</div>';
}

/** A table of items, each with its "What to do" choice. */
function ggds_tidy_table( array $items, string $caption ): void {
	echo '<table class="widefat striped ggds-tidy__table"><caption class="screen-reader-text">' . esc_html( $caption ) . '</caption>';
	echo '<thead><tr><th scope="col" class="ggds-tidy__what">What</th><th scope="col">Why it is here</th><th scope="col">Where it is used</th><th scope="col" class="ggds-tidy__do">What to do</th></tr></thead><tbody>';
	foreach ( $items as $item ) {
		$id     = 'ggds-tidy-' . sanitize_html_class( str_replace( ':', '-', $item['key'] ) );
		$status = ggds_tidy_status_label( (string) $item['status'] );
		echo '<tr>';

		// What: its title, linked to its editor, with what it is and how to see it.
		echo '<th scope="row" class="ggds-tidy__what"><strong>';
		echo $item['edit'] ? '<a href="' . esc_url( $item['edit'] ) . '">' . esc_html( $item['title'] ) . '</a>' : esc_html( $item['title'] );
		echo '</strong><span class="ggds-tidy__meta">' . esc_html( $item['thing'] ) . ( $status ? ' · ' . $status : '' ) . '</span>';
		if ( $item['view'] ) {
			echo '<a class="ggds-tidy__view" href="' . esc_url( $item['view'] ) . '">' . esc_html( 'View' ) . '<span class="screen-reader-text"> ' . esc_html( $item['title'] ) . '</span></a>';
		}
		echo '</th>';

		// Why.
		echo '<td><ul class="ggds-tidy__list">';
		foreach ( $item['reasons'] as $r ) {
			echo '<li><strong>' . esc_html( $r['label'] ) . '</strong>' . ( '' !== $r['quote'] ? '<q>' . esc_html( $r['quote'] ) . '</q>' : '' ) . '</li>';
		}
		echo '</ul></td>';

		// Where it is used, and what the choices would do to it.
		echo '<td><ul class="ggds-tidy__list">';
		foreach ( $item['notes'] as $note ) {
			echo '<li>' . esc_html( $note ) . '</li>';
		}
		echo '</ul></td>';

		// What to do.
		echo '<td class="ggds-tidy__do">';
		if ( count( $item['actions'] ) > 1 ) {
			echo '<label class="screen-reader-text" for="' . esc_attr( $id ) . '">' . esc_html( sprintf( 'What to do with “%s”', $item['title'] ) ) . '</label>';
			echo '<select id="' . esc_attr( $id ) . '" name="tidy[' . esc_attr( $item['key'] ) . ']" data-suggested="' . esc_attr( $item['suggested'] ) . '">';
			foreach ( $item['actions'] as $action ) {
				echo '<option value="' . esc_attr( $action ) . '"' . selected( $item['suggested'], $action, false ) . '>' . esc_html( ggds_tidy_action_label( $action ) ) . '</option>';
			}
			echo '</select>';
			if ( 'leave' !== $item['suggested'] ) {
				echo '<span class="ggds-tidy__chosen">' . esc_html( 'Chosen for you' ) . '</span>';
			}
		} else {
			echo '<p class="ggds-tidy__locked">' . esc_html( $item['locked'] ?: 'Nothing to do here.' );
			if ( $item['edit'] ) {
				echo ' <a href="' . esc_url( $item['edit'] ) . '">' . esc_html( 'widget' === $item['type'] ? 'Go to Widgets' : 'Edit it' ) . '<span class="screen-reader-text"> (' . esc_html( $item['title'] ) . ')</span></a>';
			}
			echo '</p>';
		}
		echo '</td></tr>';
	}
	echo '</tbody></table>';
}

/** Recent changes, each with its own undo. */
function ggds_tidy_recent(): void {
	$log = ggds_tidy_log();
	if ( ! $log ) {
		return;
	}
	echo '<h2>Recent changes</h2>';
	echo '<table class="widefat striped ggds-tidy__recent"><caption class="screen-reader-text">Recent changes</caption><thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">What changed</th><th scope="col"><span class="screen-reader-text">Undo</span></th></tr></thead><tbody>';
	$binned = false;
	foreach ( array_slice( $log, 0, 10 ) as $batch ) {
		$binned = $binned || (bool) array_filter( $batch['changes'], static fn( $c ) => 'bin' === $c['action'] && 'post' === $c['type'] );
		echo '<tr><td>' . esc_html( sprintf( '%s ago', human_time_diff( (int) $batch['when'] ) ) ) . '</td><td>' . esc_html( (string) $batch['who'] ) . '</td><td>' . esc_html( ggds_tidy_summary( $batch ) ) . '</td><td>';
		if ( $batch['undone'] ) {
			echo esc_html( sprintf( 'Undone by %s, %s ago', $batch['undone']['who'], human_time_diff( (int) $batch['undone']['when'] ) ) );
		} else {
			echo ggds_tidy_undo_button( (string) $batch['id'] ); // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts
		}
		echo '</td></tr>';
	}
	echo '</tbody></table>';
	if ( $binned ) {
		echo '<p class="description">Pages in the Bin stay there for 30 days, then WordPress deletes them for good. To delete them sooner, empty the Bin in <a href="' . esc_url( admin_url( 'edit.php?post_status=trash&post_type=page' ) ) . '">Pages</a> or <a href="' . esc_url( admin_url( 'edit.php?post_status=trash' ) ) . '">Posts</a>. Their addresses answer “gone” in the meantime, so search engines drop them.</p>';
	}
}
