<?php
/**
 * GGDS > Switch to GGDS: what we found, the institution's details and menus (filled in from the website, for a
 * person to check), a preview, the switch, and afterwards what to check and an undo button.
 *
 * @package GGDS_Switch
 */

defined( 'ABSPATH' ) || exit;

const GGDS_SWITCH_DRAFT = 'ggds_switch_draft';

// After activation, a pointer to the screen on the dashboard, plugins and themes screens, until the switch is done.
add_action(
	'admin_notices',
	static function () {
		$screen = get_current_screen();
		if ( ggds_switch_done() || ! current_user_can( 'switch_themes' ) || ! $screen || ! in_array( $screen->id, array( 'dashboard', 'plugins', 'themes' ), true ) ) {
			return;
		}
		printf(
			'<div class="notice notice-info"><p><strong>GGDS Switch is ready.</strong> See what will change before anything does. <a href="%s">Start</a></p></div>',
			esc_url( ggds_switch_url( 'ggds-switch' ) )
		);
	}
);

/** The details and menus to show in the form: what was saved for the preview, or else the scan's proposal. */
function ggds_switch_form_values( array $scan ): array {
	$draft = get_option( GGDS_SWITCH_DRAFT );
	return is_array( $draft ) ? $draft : array( 'details' => $scan['details'], 'menus' => $scan['menus'] );
}

/** The details and menus as posted, sanitised. */
function ggds_switch_posted(): array {
	// phpcs:disable WordPress.Security.NonceVerification -- checked by the caller
	$in      = wp_unslash( $_POST['ggds'] ?? array() );
	$details = array();
	foreach ( array( 'short_name', 'official_host', 'theme', 'email', 'phone', 'address', 'contact_url', 'purpose' ) as $key ) {
		$value = (string) ( $in[ $key ] ?? '' );
		$details[ $key ] = match ( $key ) {
			'email'         => sanitize_email( $value ),
			'contact_url'   => esc_url_raw( $value ),
			'official_host' => strtolower( (string) preg_replace( '#^https?://|/.*$#', '', sanitize_text_field( $value ) ) ),
			default         => sanitize_text_field( $value ),
		};
	}
	$details['initials'] = $details['short_name'];
	$menus               = array();
	foreach ( array( 'primary', 'tasks', 'footer', 'legal' ) as $loc ) {
		$menus[ $loc ] = absint( $in['menus'][ $loc ] ?? 0 );
	}
	// phpcs:enable
	return array( 'details' => $details, 'menus' => $menus );
}

add_action(
	'admin_post_ggds_switch',
	static function () {
		if ( ! current_user_can( 'switch_themes' ) ) {
			wp_die( 'You need to be allowed to change the theme to switch to GGDS.' );
		}
		check_admin_referer( 'ggds_switch' );
		$do   = sanitize_key( wp_unslash( $_POST['do'] ?? '' ) );
		$back = ggds_switch_url( 'ggds-switch' );
		if ( 'undo' === $do ) {
			$result = ggds_switch_undo();
			ggds_switch_flash( is_wp_error( $result ) ? $result->get_error_message() : 'The switch is undone: your old theme and every page are back as they were.' );
			wp_safe_redirect( $back );
			exit;
		}
		$posted = ggds_switch_posted();
		update_option( GGDS_SWITCH_DRAFT, $posted, false );
		if ( 'preview' === $do ) {
			$installed = ggds_switch_install_theme();
			if ( is_wp_error( $installed ) ) {
				ggds_switch_flash( $installed->get_error_message() );
				wp_safe_redirect( $back );
				exit;
			}
			ggds_switch_preview_mods( $posted['details'], $posted['menus'] );
			wp_safe_redirect( admin_url( 'customize.php?theme=ggds&return=' . rawurlencode( $back ) ) );
			exit;
		}
		$result = ggds_switch_run( $posted['details'], $posted['menus'] );
		if ( is_wp_error( $result ) ) {
			ggds_switch_flash( $result->get_error_message() );
		} else {
			delete_option( GGDS_SWITCH_DRAFT );
		}
		wp_safe_redirect( $back );
		exit;
	}
);

// The institution's details from the website builder's ggds-site.json, into the form, for a person to check.
add_action(
	'admin_post_ggds_switch_import',
	static function () {
		if ( ! current_user_can( 'switch_themes' ) ) {
			wp_die( 'You need to be allowed to change the theme to switch to GGDS.' );
		}
		check_admin_referer( 'ggds_switch_import' );
		$file = $_FILES['ggds_site'] ?? null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- read as JSON, each value sanitised
		$site = null;
		if ( is_array( $file ) && UPLOAD_ERR_OK === (int) $file['error'] && is_uploaded_file( (string) $file['tmp_name'] ) && (int) $file['size'] < 512 * 1024 ) {
			$site = json_decode( (string) file_get_contents( (string) $file['tmp_name'] ), true );
		}
		$details = is_array( $site ) ? ggds_switch_details_from_site( $site ) : array();
		if ( ! $details ) {
			ggds_switch_flash( 'That file is not a ggds-site.json from the GGDS website builder, so nothing was filled in.' );
		} else {
			$values            = ggds_switch_form_values( ggds_switch_scan() );
			$values['details'] = array_merge( (array) $values['details'], $details );
			update_option( GGDS_SWITCH_DRAFT, $values, false );
			ggds_switch_flash( sprintf( 'Filled in %d details from ggds-site.json. Check each one, then preview.', count( array_diff_key( $details, array( 'initials' => 1 ) ) ) ) );
		}
		wp_safe_redirect( ggds_switch_url( 'ggds-switch' ) . '#ggds-short_name' );
		exit;
	}
);

/** GGDS's settings for the live preview (Appearance > Customise with the GGDS theme), before anything is switched. */
function ggds_switch_preview_mods( array $details, array $menus ): void {
	if ( false === get_option( 'ggds_switch_premods' ) ) {
		update_option( 'ggds_switch_premods', array( 'mods' => get_option( 'theme_mods_ggds', null ) ), false );
	}
	$mods = (array) get_option( 'theme_mods_ggds', array() );
	foreach ( $details as $key => $value ) {
		if ( '' !== $value ) {
			$mods[ 'ggds_' . $key ] = $value;
		}
	}
	$old = (array) get_option( 'theme_mods_' . get_stylesheet(), array() );
	if ( ! empty( $old['custom_logo'] ) ) {
		$mods['custom_logo'] = (int) $old['custom_logo'];
	}
	$mods['nav_menu_locations'] = array_filter( $menus );
	update_option( 'theme_mods_ggds', $mods );
}

/** A message for the next screen. */
function ggds_switch_flash( string $message ): void {
	set_transient( 'ggds_switch_flash_' . get_current_user_id(), $message, 60 );
}

/** The screen. */
function ggds_switch_screen(): void {
	$flash = get_transient( 'ggds_switch_flash_' . get_current_user_id() );
	delete_transient( 'ggds_switch_flash_' . get_current_user_id() );
	echo '<div class="wrap ggds-switch">';
	echo '<h1>Switch to GGDS</h1>';
	if ( $flash ) {
		echo '<div class="notice notice-info"><p>' . esc_html( $flash ) . '</p></div>';
	}
	if ( ggds_switch_done() ) {
		ggds_switch_screen_done();
	} else {
		ggds_switch_screen_before();
	}
	echo '</div>';
}

/** Before: what we found, the details, the menus, preview and switch. */
function ggds_switch_screen_before(): void {
	$scan   = ggds_switch_scan();
	$values = ggds_switch_form_values( $scan );
	$d      = $values['details'];
	$menus  = wp_get_nav_menus();
	$themes = array( '' => 'Default (government blue)' );
	$file   = is_readable( get_theme_root() . '/ggds/assets/themes/themes.json' ) ? get_theme_root() . '/ggds/assets/themes/themes.json' : GGDS_SWITCH_DIR . 'theme/ggds/assets/themes/themes.json';
	foreach ( ( is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : array() )['themes'] ?? array() as $t ) {
		$themes[ $t['slug'] ] = $t['name'];
	}
	$built = array();
	foreach ( $scan['builders'] as $slug => $n ) {
		$built[] = sprintf( '%d with %s', $n, 'shortcodes' === $slug ? 'page-builder shortcodes' : ( ggds_switch_builders()[ $slug ][0] ?? $slug ) );
	}
	$menu_name = static function ( int $id ) use ( $menus ): string {
		foreach ( $menus as $m ) {
			if ( (int) $m->term_id === $id ) {
				return $m->name;
			}
		}
		return 'none';
	};
	?>
	<p class="ggds-switch__lead">Turn this website into a GGDS government website: the official banner, a clear header and footer, a homepage built around what people come to do, and pages that are easy to read on any phone. Your pages, posts, menus and logo come with you.</p>
	<p><strong>Nothing changes until you press "Switch to GGDS".</strong> Every page keeps its original, and you can undo the switch at any time.</p>

	<h2>1. What we found</h2>
	<table class="widefat striped ggds-switch__found">
		<tbody>
			<tr><th scope="row">Theme now</th><td><?php echo esc_html( $scan['theme']['name'] ); ?></td></tr>
			<tr><th scope="row">Pages and posts</th><td><?php echo esc_html( sprintf( '%d. %s', $scan['posts'], $built ? 'Built with a page builder: ' . implode( ', ', $built ) . '. Each one is turned into plain, readable content.' : 'None use a page builder.' ) ); ?><?php echo $scan['styled'] ? esc_html( sprintf( ' %d have their own colours or styles, which are taken out so every page keeps its contrast.', $scan['styled'] ) ) : ''; ?></td></tr>
			<tr><th scope="row">Logo</th><td><?php echo $scan['logo'] ? wp_get_attachment_image( $scan['logo'], array( 44, 44 ) ) . ' ' . esc_html( 'Carried over.' ) : esc_html( 'None yet. A badge with your initials shows until you add one.' ); ?></td></tr>
			<tr><th scope="row">Homepage</th><td><?php echo esc_html( $scan['front'] ? sprintf( '"%s" becomes the GGDS homepage: your question, search, common tasks and main sections. Its old layout is kept as a draft.', get_the_title( $scan['front'] ) ) : 'Your latest posts. GGDS shows its homepage instead, and the posts stay on your news page.' ); ?></td></tr>
			<tr><th scope="row">Sidebars and comments</th><td><?php echo esc_html( sprintf( '%d widgets and %d comments. GGDS has no sidebars and no comments: both are kept, but not shown.', $scan['widgets'], $scan['comments'] ) ); ?></td></tr>
			<?php if ( function_exists( 'ggds_tidy_count' ) && ggds_tidy_count() > 0 ) : ?>
			<tr><th scope="row">Placeholder content</th><td><?php echo esc_html( ( 1 === ggds_tidy_count() ? '1 thing looks' : sprintf( '%d things look', ggds_tidy_count() ) ) . ' like sample or example content, such as lorem ipsum, "Hello world!" or "Sample Page". ' ); ?><a href="<?php echo esc_url( ggds_switch_url( 'ggds-tidy' ) ); ?>">Tidy them up first</a>, so they do not come with you.</td></tr>
			<?php endif; ?>
			<tr><th scope="row">Plugins to check</th><td><?php echo esc_html( $scan['plugins'] ? implode( ', ', $scan['plugins'] ) . '. They may add scripts or styles that a strict security policy blocks.' : 'None.' ); ?></td></tr>
		</tbody>
	</table>

	<form method="post" enctype="multipart/form-data" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" class="ggds-switch__import">
		<input type="hidden" name="action" value="ggds_switch_import">
		<?php wp_nonce_field( 'ggds_switch_import' ); ?>
		<h2>Made your website with the GGDS website builder?</h2>
		<p>Fill in your institution's details from its <code>ggds-site.json</code>, then check them below.</p>
		<p><label for="ggds-site-file">Your <code>ggds-site.json</code></label><br>
			<input type="file" id="ggds-site-file" name="ggds_site" accept=".json,application/json" required>
			<button type="submit" class="button">Fill in from the file</button></p>
	</form>

	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<input type="hidden" name="action" value="ggds_switch">
		<?php wp_nonce_field( 'ggds_switch' ); ?>

		<h2>2. Your institution</h2>
		<p>Filled in from your website. Check each one. The name is your site title, <strong><?php echo esc_html( get_bloginfo( 'name' ) ); ?></strong> (<a href="<?php echo esc_url( admin_url( 'options-general.php' ) ); ?>">change it</a>).</p>
		<table class="form-table" role="presentation">
			<?php
			$fields = array(
				'short_name'    => array( 'Short name', 'Such as NCA. Shown in the official banner.', 'text' ),
				'official_host' => array( 'Official address', 'Such as nca.gov.gh. The banner says the website is official only when it is served from this address.', 'text' ),
				'theme'         => array( 'Institution colour', 'Used in the header line, the homepage and the footer.', 'select' ),
				'purpose'       => array( 'What you do', 'One sentence, for the footer.', 'text' ),
				'address'       => array( 'Address', 'For the footer.', 'text' ),
				'email'         => array( 'Email', 'For the footer.', 'email' ),
				'phone'         => array( 'Phone', 'For the footer.', 'text' ),
				'contact_url'   => array( 'Contact page', 'For the footer.', 'url' ),
			);
			foreach ( $fields as $key => [ $label, $hint, $type ] ) {
				$id = 'ggds-' . $key;
				echo '<tr><th scope="row"><label for="' . esc_attr( $id ) . '">' . esc_html( $label ) . '</label></th><td>';
				if ( 'select' === $type ) {
					echo '<select id="' . esc_attr( $id ) . '" name="ggds[' . esc_attr( $key ) . ']" aria-describedby="' . esc_attr( $id ) . '-hint">';
					foreach ( $themes as $slug => $name ) {
						echo '<option value="' . esc_attr( $slug ) . '"' . selected( (string) ( $d[ $key ] ?? '' ), $slug, false ) . '>' . esc_html( $name ) . '</option>';
					}
					echo '</select>';
				} else {
					echo '<input class="regular-text" type="' . esc_attr( $type ) . '" id="' . esc_attr( $id ) . '" name="ggds[' . esc_attr( $key ) . ']" value="' . esc_attr( (string) ( $d[ $key ] ?? '' ) ) . '" aria-describedby="' . esc_attr( $id ) . '-hint">';
				}
				echo '<p class="description" id="' . esc_attr( $id ) . '-hint">' . esc_html( $hint ) . '</p></td></tr>';
			}
			?>
		</table>

		<h2>3. Menus</h2>
		<p>Your menus stay as they are. Choose which one goes in each place. You can change them later in Appearance > Menus.</p>
		<table class="form-table" role="presentation">
			<?php
			$places = array(
				'primary' => array( 'Main sections', '3 to 6 sections, in the header and as cards on the homepage.' ),
				'tasks'   => array( 'Common tasks', 'Up to 6 things people most often come to do, under the homepage search.' ),
				'footer'  => array( 'Footer sections', 'Each section with up to five of its pages under it. Your main menu works well here.' ),
				'legal'   => array( 'Footer links', 'Accessibility, Privacy and Contact.' ),
			);
			foreach ( $places as $loc => [ $label, $hint ] ) {
				$id = 'ggds-menu-' . $loc;
				echo '<tr><th scope="row"><label for="' . esc_attr( $id ) . '">' . esc_html( $label ) . '</label></th><td><select id="' . esc_attr( $id ) . '" name="ggds[menus][' . esc_attr( $loc ) . ']" aria-describedby="' . esc_attr( $id ) . '-hint"><option value="0">None</option>';
				foreach ( $menus as $m ) {
					echo '<option value="' . esc_attr( (string) $m->term_id ) . '"' . selected( (int) ( $values['menus'][ $loc ] ?? 0 ), (int) $m->term_id, false ) . '>' . esc_html( $m->name ) . '</option>';
				}
				echo '</select><p class="description" id="' . esc_attr( $id ) . '-hint">' . esc_html( $hint ) . ( ! empty( $scan['menus'][ $loc ] ) ? ' ' . esc_html( sprintf( 'Suggested: %s.', $menu_name( (int) $scan['menus'][ $loc ] ) ) ) : '' ) . '</p></td></tr>';
			}
			?>
		</table>

		<h2>4. Look, then switch</h2>
		<p><strong>Preview</strong> shows your website with GGDS, with every page cleaned, before anyone else sees it. <strong>Switch to GGDS</strong> makes it live. Afterwards this screen lists anything to check, and has an undo button.</p>
		<p class="submit">
			<button type="submit" class="button button-large" name="do" value="preview">Preview</button>
			<button type="submit" class="button button-primary button-large" name="do" value="switch">Switch to GGDS</button>
		</p>
	</form>
	<?php
}

/** After: what to do next, the pages to check, and undo. */
function ggds_switch_screen_done(): void {
	$report = (array) get_option( GGDS_SWITCH_REPORT, array() );
	echo '<div class="notice notice-success inline"><p><strong>Your website now uses GGDS.</strong> <a href="' . esc_url( home_url( '/' ) ) . '">Look at it</a>.</p></div>';
	if ( ! empty( $report['todo'] ) ) {
		echo '<h2>What to do next</h2><ol>';
		foreach ( $report['todo'] as $line ) {
			echo '<li>' . esc_html( $line ) . '</li>';
		}
		echo '</ol>';
	}
	$rows = array();
	foreach ( array( 'skipped', 'cleaned' ) as $kind ) {
		foreach ( (array) ( $report[ $kind ] ?? array() ) as $id => $notes ) {
			if ( $notes ) {
				$rows[ $id ] = $notes;
			}
		}
	}
	if ( $rows ) {
		echo '<h2>Pages to look at</h2><p>Everything else was cleaned with nothing to check.</p><table class="widefat striped"><thead><tr><th scope="col">Page</th><th scope="col">What to check</th></tr></thead><tbody>';
		foreach ( $rows as $id => $notes ) {
			echo '<tr><td><a href="' . esc_url( (string) get_edit_post_link( (int) $id ) ) . '">' . esc_html( get_the_title( (int) $id ) ?: '(no title)' ) . '</a> · <a href="' . esc_url( (string) get_permalink( (int) $id ) ) . '">View</a></td><td><ul>';
			foreach ( $notes as $note ) {
				echo '<li>' . esc_html( $note ) . '</li>';
			}
			echo '</ul></td></tr>';
		}
		echo '</tbody></table>';
	}
	?>
	<h2>Undo</h2>
	<p>Puts back your old theme, and every page and post exactly as it was before the switch. Anything you have changed in those pages since will be lost.</p>
	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<input type="hidden" name="action" value="ggds_switch">
		<?php wp_nonce_field( 'ggds_switch' ); ?>
		<p><button type="submit" class="button" name="do" value="undo">Undo the switch</button></p>
	</form>
	<?php
}
