<?php
/**
 * Tidy up content: finds what should never be on a live government website, and takes it off.
 *
 * It finds sample text (lorem ipsum), WordPress's own example post, page, comment and tagline, page builders'
 * example text, published pages with nothing on them, and pages that say they are unfinished ("coming soon"). The
 * phrases are in placeholders.json, the same list ggds-check uses (packages/check/placeholders.json), so the check
 * and this screen always agree.
 *
 * What it does is always reversible: unpublish (back to a draft, and out of the menus), move to the Bin, clear the
 * tagline. It never deletes anything for good: WordPress's Bin does that, after 30 days or when someone empties it.
 * Each change is logged, with who made it, and can be undone.
 *
 * Statuses are written straight to the database, never through wp_update_post(), which would save the post's
 * content again through WordPress's filters and could change it. So tidying and undoing change a post's status and
 * nothing else: its content, dates and author stay exactly as they were.
 *
 * @package GGDS_Switch
 */

defined( 'ABSPATH' ) || exit;

const GGDS_TIDY_LOG   = 'ggds_tidy_log';
const GGDS_TIDY_COUNT = 'ggds_tidy_count';

/** The statuses people can see (or will see, when the date comes). */
const GGDS_TIDY_PUBLIC = array( 'publish', 'future', 'private' );

/** Page builders' own copies of a page's words, searched as well as the content. */
const GGDS_TIDY_BUILDER_META = array( '_elementor_data', 'ct_builder_shortcodes', 'panels_data' );

/** The phrase list (placeholders.json), or null when the file is missing. */
function ggds_tidy_list(): ?array {
	static $list = false;
	if ( false === $list ) {
		$file = GGDS_SWITCH_DIR . 'placeholders.json';
		$data = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null;
		$list = is_array( $data ) && ! empty( $data['phrases'] ) ? $data : null;
	}
	return $list;
}

/** Text as the phrases are written: lower case, plain apostrophes, single spaces. */
function ggds_tidy_normalise( string $text ): string {
	$text = str_replace( array( "\u{2018}", "\u{2019}", "\u{2032}", "\u{00a0}" ), array( "'", "'", "'", ' ' ), $text );
	return trim( (string) preg_replace( '/\s+/u', ' ', mb_strtolower( $text ) ) );
}

/** The words in a piece of stored content or builder data, as written: no tags or block markers, entities decoded. */
function ggds_tidy_plain( string $content ): string {
	$content = (string) preg_replace( '#<(script|style)\b[^>]*>.*?</\1>#is', ' ', $content );
	$content = str_replace( array( '\\n', '\\r', '\\t', '\\/' ), array( ' ', ' ', ' ', '/' ), $content ); // JSON from builders
	$content = (string) preg_replace( '/<[^>]*>/', ' ', $content );
	$content = html_entity_decode( $content, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	$content = str_replace( array( "\u{2018}", "\u{2019}", "\u{2032}", "\u{00a0}" ), array( "'", "'", "'", ' ' ), $content );
	return trim( (string) preg_replace( '/\s+/u', ' ', $content ) );
}

/** The same words as the phrases are written, for matching. */
function ggds_tidy_text( string $content ): string {
	return ggds_tidy_normalise( ggds_tidy_plain( $content ) );
}

/**
 * The phrases in a text (and the title, matched whole), as [ [ text, kind, label, fix, quote ] ]: one per phrase,
 * without a phrase that a longer one found already says ("coming soon" in "content coming soon").
 */
function ggds_tidy_find( string $plain, string $title = '' ): array {
	$list = ggds_tidy_list();
	if ( ! $list ) {
		return array();
	}
	$plain = trim( (string) preg_replace( '/\s+/u', ' ', $plain ) );
	$text  = ggds_tidy_normalise( $plain );
	// Quotes are from the words as written; matching is in lower case (the same length, except in rare scripts).
	$quote_from = strlen( $plain ) === strlen( $text ) ? $plain : $text;
	$found      = array();
	foreach ( $list['phrases'] as $p ) {
		$at = strpos( $text, $p['text'] );
		if ( false !== $at ) {
			$found[] = $p + array( 'quote' => ggds_tidy_quote( $quote_from, $at, strlen( $p['text'] ) ) );
		}
	}
	$written = trim( wp_strip_all_tags( $title ) );
	$title   = ggds_tidy_normalise( $written );
	foreach ( $list['titles'] as $p ) {
		if ( $title === $p['text'] ) {
			$found[] = $p + array( 'quote' => $written );
		}
	}
	foreach ( $list['titlePatterns'] ?? array() as $p ) {
		if ( '' !== $title && preg_match( '/' . str_replace( '/', '\\/', $p['pattern'] ) . '/iu', $title ) ) {
			$found[] = array( 'text' => $title, 'kind' => $p['kind'], 'quote' => $written );
		}
	}
	$kept = array();
	foreach ( $found as $f ) {
		foreach ( $found as $g ) {
			if ( $g['text'] !== $f['text'] && str_contains( $g['text'], $f['text'] ) ) {
				continue 2;
			}
		}
		$kind   = $list['kinds'][ $f['kind'] ] ?? array( 'label' => $f['kind'], 'fix' => true );
		$kept[] = array( 'text' => $f['text'], 'kind' => $f['kind'], 'label' => $kind['label'], 'fix' => (bool) $kind['fix'], 'quote' => $f['quote'] );
	}
	return $kept;
}

/** What ggds_tidy_find() found, as reasons: one per kind, quoting the first place it was found. */
function ggds_tidy_reasons( array $found ): array {
	$out = array();
	foreach ( $found as $f ) {
		$out[ $f['kind'] ] ??= array( 'label' => $f['label'], 'quote' => $f['quote'], 'fix' => $f['fix'], 'kind' => $f['kind'] );
	}
	return array_values( $out );
}

/** A few words either side of a phrase, as written, to show where it is: whole words, with … where it is cut. */
function ggds_tidy_quote( string $text, int $at, int $length ): string {
	$start = max( 0, $at - 30 );
	$end   = min( strlen( $text ), $at + $length + 40 );
	$quote = substr( $text, $start, $end - $start );
	if ( $start > 0 ) {
		$quote = (string) preg_replace( '/^\S*\s+/', '', $quote ); // the first word may be cut
	}
	if ( $end < strlen( $text ) ) {
		$quote = (string) preg_replace( '/\s+\S*$/', '', $quote ); // and the last
	}
	$quote = mb_convert_encoding( $quote, 'UTF-8', 'UTF-8' ); // never half a character
	return ( $start > 0 ? '…' : '' ) . trim( $quote ) . ( $end < strlen( $text ) ? '…' : '' );
}

/** Whether a post has nothing on it: no words, images, embeds, forms, tables or blocks that show something. */
function ggds_tidy_is_empty( WP_Post $post ): bool {
	if ( '' !== trim( $post->post_excerpt ) ) {
		return false;
	}
	$content = $post->post_content;
	// Blocks that hold others, or show nothing themselves, do not count; any other block shows something.
	$content = (string) preg_replace( '#<!--\s*/?wp:(paragraph|heading|group|columns|column|spacer|separator|buttons|freeform)\b[^>]*-->#', '', $content );
	if ( str_contains( $content, '<!-- wp:' ) || preg_match( '/<(img|iframe|video|audio|embed|object|form|input|table|svg)\b/i', $content ) || preg_match( '/\[[a-z]/i', $content ) ) {
		return false;
	}
	return '' === ggds_tidy_text( $content );
}

/** Whether a post has headings and nothing under them (a page that was started and never written). */
function ggds_tidy_is_headings_only( WP_Post $post ): bool {
	$content = $post->post_content;
	if ( ! preg_match( '/<h[1-6]\b/i', $content ) || ggds_tidy_is_empty( $post ) ) {
		return false;
	}
	$rest = (string) preg_replace( '#<h([1-6])\b[^>]*>.*?</h\1>#is', ' ', $content );
	$rest = (string) preg_replace( '#<!--\s*/?wp:heading\b[^>]*-->#', '', $rest );
	$copy = clone $post;
	$copy->post_content = $rest;
	return ggds_tidy_is_empty( $copy );
}

/** Whether this user may do something here. WP-CLI, run on the server itself, may do everything. */
function ggds_tidy_can( string $cap, int $id = 0 ): bool {
	if ( defined( 'WP_CLI' ) && WP_CLI && ! is_user_logged_in() ) {
		return true;
	}
	return $id ? current_user_can( $cap, $id ) : current_user_can( $cap );
}

/** IDs of posts that may have something to tidy: a phrase in their content, title or builder data, or short content. */
function ggds_tidy_candidates(): array {
	global $wpdb;
	$list = ggds_tidy_list();
	if ( ! $list ) {
		return array();
	}
	$types    = ggds_switch_post_types();
	$statuses = array_merge( GGDS_TIDY_PUBLIC, array( 'draft', 'pending' ) );
	$content  = array();
	$meta     = array();
	$args     = array();
	// Each phrase's words in order, with anything between them (such as "Suggested text: </strong>Our website"): a
	// wide net that the exact match on the text afterwards narrows.
	$likes = array_map( static fn( $p ) => '%' . implode( '%', array_map( array( $wpdb, 'esc_like' ), explode( ' ', $p['text'] ) ) ) . '%', $list['phrases'] );
	foreach ( $likes as $like ) {
		$content[] = 'p.post_content LIKE %s OR p.post_excerpt LIKE %s';
		array_push( $args, $like, $like );
	}
	$meta_args = array();
	foreach ( $likes as $like ) {
		$meta[]      = 'm.meta_value LIKE %s';
		$meta_args[] = $like;
	}
	$titles = array_map( static fn( $t ) => $t['text'], $list['titles'] );
	$in     = static fn( array $xs ) => implode( ', ', array_fill( 0, count( $xs ), '%s' ) );
	// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- every value is a placeholder
	$sql = "SELECT p.ID FROM {$wpdb->posts} p
		WHERE p.post_type IN (" . $in( $types ) . ') AND p.post_status IN (' . $in( $statuses ) . ')
		AND ( ' . implode( ' OR ', $content ) . '
			OR LOWER(p.post_title) IN (' . $in( $titles ) . ")
			OR EXISTS ( SELECT 1 FROM {$wpdb->postmeta} m WHERE m.post_id = p.ID AND m.meta_key IN (" . $in( GGDS_TIDY_BUILDER_META ) . ') AND ( ' . implode( ' OR ', $meta ) . ' ) )
			OR ( p.post_status IN (' . $in( GGDS_TIDY_PUBLIC ) . ") AND ( p.post_title = '' OR ( CHAR_LENGTH(p.post_content) < 1500 AND p.post_excerpt = '' ) ) ) )
		ORDER BY p.post_type = 'page' DESC, p.menu_order, p.post_title
		LIMIT 500";
	$ids = $wpdb->get_col( $wpdb->prepare( $sql, array_merge( $types, $statuses, $args, $titles, GGDS_TIDY_BUILDER_META, $meta_args, GGDS_TIDY_PUBLIC ) ) );
	// phpcs:enable
	return array_map( 'intval', $ids );
}

/** Where a post is used: the homepage or news page, menus, pages under it, and other pages that link to it. */
function ggds_tidy_usage( WP_Post $post ): array {
	global $wpdb;
	$used = array(
		'front'    => 'page' === get_option( 'show_on_front' ) && (int) get_option( 'page_on_front' ) === $post->ID,
		'news'     => 'page' === get_option( 'show_on_front' ) && (int) get_option( 'page_for_posts' ) === $post->ID,
		'privacy'  => (int) get_option( 'wp_page_for_privacy_policy' ) === $post->ID,
		'menus'    => array(),
		'children' => 0,
		'links'    => array(),
	);
	foreach ( wp_get_associated_nav_menu_items( $post->ID, 'post_type', $post->post_type ) as $item_id ) {
		if ( 'publish' !== get_post_status( (int) $item_id ) ) {
			continue;
		}
		$menu  = wp_get_object_terms( (int) $item_id, 'nav_menu' );
		$under = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->postmeta} m JOIN {$wpdb->posts} p ON p.ID = m.post_id WHERE m.meta_key = '_menu_item_menu_item_parent' AND m.meta_value = %s AND p.post_status = 'publish'", (string) $item_id ) );
		$used['menus'][] = array( 'item' => (int) $item_id, 'menu' => is_array( $menu ) && $menu ? $menu[0]->name : 'a menu', 'under' => $under );
	}
	if ( is_post_type_hierarchical( $post->post_type ) ) {
		$used['children'] = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_parent = %d AND post_type = %s AND post_status IN ('publish', 'future', 'private')", $post->ID, $post->post_type ) );
	}
	if ( in_array( $post->post_status, GGDS_TIDY_PUBLIC, true ) ) {
		$path = (string) wp_make_link_relative( (string) get_permalink( $post ) );
		$like = array( '%?page_id=' . $post->ID . '"%', '%?p=' . $post->ID . '"%' );
		if ( strlen( trim( $path, '/' ) ) > 1 ) {
			$like[] = '%' . $wpdb->esc_like( $path ) . '%';
		}
		$where = implode( ' OR ', array_fill( 0, count( $like ), 'post_content LIKE %s' ) );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- placeholders only
		$used['links'] = array_map( 'intval', $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_status = 'publish' AND post_type NOT IN ('revision', 'nav_menu_item', 'attachment') AND ID <> %d AND ( {$where} ) LIMIT 5", array_merge( array( $post->ID ), $like ) ) ) );
	}
	return $used;
}

/**
 * Everything to tidy, for the screen and `wp ggds-switch tidy`. Each item:
 *   key        "post:12", "comment:1" or "option:blogdescription"
 *   group      fix (on the website now), check (may be real: a person decides) or hidden (drafts: nobody sees them)
 *   reasons    [ [ label, quote, fix ] ]: why it is here
 *   notes      where it is used, and what each choice would do to it, in plain words
 *   actions    the choices this user has: unpublish, bin, clear, leave
 *   suggested  the choice made for them: leave, unless it is clearly safe
 *   locked     why it cannot be changed here (the homepage), or ''
 */
function ggds_tidy_scan(): array {
	$items = array();
	if ( ! ggds_tidy_list() ) {
		return array( 'ok' => false, 'items' => array(), 'counts' => array( 'fix' => 0, 'check' => 0, 'hidden' => 0 ) );
	}
	$flagged = array();
	foreach ( ggds_tidy_candidates() as $id ) {
		$post = get_post( $id );
		if ( ! $post ) {
			continue;
		}
		$text = ggds_tidy_plain( $post->post_content . ' ' . $post->post_excerpt );
		foreach ( GGDS_TIDY_BUILDER_META as $key ) {
			$value = get_post_meta( $id, $key, true );
			if ( is_string( $value ) && '' !== $value ) {
				$text .= ' ' . ggds_tidy_plain( $value );
			}
		}
		$reasons = ggds_tidy_reasons( ggds_tidy_find( $text, $post->post_title ) );
		$public  = in_array( $post->post_status, GGDS_TIDY_PUBLIC, true );
		$used    = ggds_tidy_usage( $post );
		$plain = $public && ! $used['front'] && ! $used['news'] && ! $used['children'] && '' === ggds_switch_builder_of( $id );
		if ( ! $reasons && $plain && ggds_tidy_is_empty( $post ) ) {
			$reasons[] = array( 'label' => 'Published, but has nothing on it', 'quote' => '', 'fix' => true, 'kind' => 'empty' );
		} elseif ( ! $reasons && $plain && ggds_tidy_is_headings_only( $post ) ) {
			$reasons[] = array( 'label' => 'Has headings, but nothing under them', 'quote' => ggds_tidy_quote( ggds_tidy_plain( $post->post_content ), 0, 0 ), 'fix' => true, 'kind' => 'empty' );
		}
		if ( $public && '' === trim( $post->post_title ) && ! $used['front'] ) {
			$reasons[] = array( 'label' => 'Has no title', 'quote' => '', 'fix' => false, 'kind' => 'untitled' );
		}
		if ( ! $reasons ) {
			continue;
		}
		$flagged[ $id ] = true;
		$items[]        = ggds_tidy_post_item( $post, $reasons, $used, $public );
	}

	// WordPress's example comment, unless the post it is on is listed already (it goes to the Bin with that post).
	$comments = array_merge(
		get_comments( array( 'author_email' => 'wapuu@wordpress.example', 'status' => 'all', 'number' => 20 ) ),
		get_comments( array( 'author__in' => array(), 'search' => 'Hi, this is a comment.', 'status' => 'all', 'number' => 20 ) )
	);
	$seen = array();
	foreach ( $comments as $c ) {
		if ( isset( $seen[ $c->comment_ID ] ) || isset( $flagged[ (int) $c->comment_post_ID ] ) || ! str_contains( ggds_tidy_normalise( $c->comment_content ), 'hi, this is a comment.' ) ) {
			continue;
		}
		$seen[ $c->comment_ID ] = true;
		$can                    = ggds_tidy_can( 'edit_comment', (int) $c->comment_ID );
		$items[]                = array(
			'key'       => 'comment:' . $c->comment_ID,
			'type'      => 'comment',
			'id'        => (int) $c->comment_ID,
			'title'     => 'WordPress\'s example comment',
			'thing'     => 'Comment',
			'status'    => '1' === (string) $c->comment_approved ? 'publish' : 'pending',
			'edit'      => (string) admin_url( 'comment.php?action=editcomment&c=' . $c->comment_ID ),
			'view'      => '',
			'group'     => 'fix',
			'reasons'   => array( array( 'label' => 'WordPress\'s example content', 'quote' => 'Hi, this is a comment.', 'fix' => true, 'kind' => 'wordpress' ) ),
			'notes'     => array( sprintf( 'On “%s”.', get_the_title( (int) $c->comment_post_ID ) ?: '(no title)' ) ),
			'actions'   => $can ? array( 'bin', 'leave' ) : array( 'leave' ),
			'suggested' => $can ? 'bin' : 'leave',
			'locked'    => $can ? '' : 'You are not allowed to change comments.',
		);
	}

	// The tagline: GGDS shows it at the top of the homepage.
	$list    = ggds_tidy_list();
	$tagline = (string) get_option( 'blogdescription' );
	if ( in_array( ggds_tidy_normalise( $tagline ), $list['taglines'] ?? array(), true ) ) {
		$can     = ggds_tidy_can( 'manage_options' );
		$items[] = array(
			'key'       => 'option:blogdescription',
			'type'      => 'option',
			'id'        => 'blogdescription',
			'title'     => 'Your tagline',
			'thing'     => 'Setting',
			'status'    => 'publish',
			'edit'      => (string) admin_url( 'options-general.php' ),
			'view'      => '',
			'group'     => 'fix',
			'reasons'   => array( array( 'label' => 'WordPress\'s example content', 'quote' => $tagline, 'fix' => true, 'kind' => 'wordpress' ) ),
			'notes'     => array( 'Shown at the top of your homepage and in search results. After clearing it, write one sentence about what you do in Settings > General.' ),
			'actions'   => $can ? array( 'clear', 'leave' ) : array( 'leave' ),
			'suggested' => $can ? 'clear' : 'leave',
			'locked'    => $can ? '' : 'Only an administrator can change the tagline.',
		);
	}

	// Sidebar and footer widgets: themes put demonstration text there too (a "Have any questions?" box over a
	// made-up phone number, a lorem ipsum news box). Shown with a link to Appearance > Widgets: GGDS has no sidebars,
	// so they stop showing when the website switches, but they are on the website until then.
	$can_widgets = ggds_tidy_can( 'edit_theme_options' );
	foreach ( ggds_tidy_widgets() as $w ) {
		$items[] = array(
			'key'       => 'widget:' . $w['id'],
			'type'      => 'widget',
			'id'        => $w['id'],
			'title'     => $w['title'],
			'thing'     => 'Widget',
			'status'    => 'publish',
			'edit'      => $can_widgets ? (string) admin_url( 'widgets.php' ) : '',
			'view'      => '',
			'group'     => (bool) array_filter( $w['reasons'], static fn( $r ) => $r['fix'] ) ? 'fix' : 'check',
			'reasons'   => $w['reasons'],
			'notes'     => array( sprintf( 'In the “%s” area of your theme, on every page that shows it. Remove or rewrite it in Appearance > Widgets. GGDS has no sidebars, so it stops showing when you switch.', $w['area'] ) ),
			'actions'   => array( 'leave' ),
			'suggested' => 'leave',
			'locked'    => 'Change it in Appearance > Widgets.',
		);
	}

	$counts = array( 'fix' => 0, 'check' => 0, 'hidden' => 0 );
	foreach ( $items as $item ) {
		++$counts[ $item['group'] ];
	}
	return array( 'ok' => true, 'items' => $items, 'counts' => $counts );
}

/** One post's item (see ggds_tidy_scan()). */
function ggds_tidy_post_item( WP_Post $post, array $reasons, array $used, bool $public ): array {
	$fix   = $public && (bool) array_filter( $reasons, static fn( $r ) => $r['fix'] );
	$group = ! $public ? 'hidden' : ( $fix ? 'fix' : 'check' );
	$type  = get_post_type_object( $post->post_type );
	$thing = $type ? (string) $type->labels->singular_name : 'Page';
	$notes = array();

	$locked = '';
	if ( $used['front'] ) {
		$locked = 'This is your homepage, so it stays. Rewrite it instead.';
	} elseif ( $used['news'] ) {
		$locked = 'This is your news page, so it stays. Rewrite it instead.';
	} elseif ( ! ggds_tidy_can( 'edit_post', $post->ID ) ) {
		$locked = 'You are not allowed to change this.';
	}

	$hidden_menu = false;
	foreach ( $used['menus'] as $m ) {
		if ( $m['under'] ) {
			$hidden_menu = true;
			$notes[]     = sprintf( 'In the “%s” menu, with %d %s under it. Unpublishing or binning it would hide those too: move them in Appearance > Menus first.', $m['menu'], $m['under'], 1 === $m['under'] ? 'item' : 'items' );
		} else {
			$notes[] = sprintf( 'In the “%s” menu. Unpublishing or binning it takes it out of the menu too.', $m['menu'] );
		}
	}
	if ( $used['children'] ) {
		$notes[] = sprintf( 'Has %d %s under it. It cannot go to the Bin while they are there, because their addresses would change.', $used['children'], 1 === $used['children'] ? 'page' : 'pages' );
	}
	if ( $used['links'] ) {
		$titles  = array_map( static fn( $id ) => '“' . ( get_the_title( $id ) ?: '(no title)' ) . '”', $used['links'] );
		$notes[] = sprintf( 'Linked from %s. Those links will stop working.', implode( ', ', $titles ) );
	}
	if ( $used['privacy'] ) {
		$notes[] = 'This is your privacy page. GGDS\'s footer links to it: you need one, with your own words.';
	}
	if ( ! $notes && $public ) {
		$notes[] = 'Not in a menu, and no other page links to it.';
	}
	if ( 'hidden' === $group ) {
		$notes[] = 'Nobody else can see it. Rewrite it before you publish it.';
	}

	$actions = array();
	if ( ! $locked ) {
		if ( $public ) {
			$actions[] = 'unpublish';
		}
		if ( ! $used['children'] && ggds_tidy_can( 'delete_post', $post->ID ) ) {
			$actions[] = 'bin';
		}
	}
	$actions[] = 'leave';

	// The choice made for people: only when it is clearly safe. WordPress's own examples and a theme's demonstration
	// pages were never the institution's, so they go to the Bin; a page of the institution's with sample text in it
	// is unpublished, so it can be rewritten. Anything a person should judge is left.
	$suggested = 'leave';
	if ( 'fix' === $group && ! $locked && ! $hidden_menu && ! $used['privacy'] ) {
		$example   = (bool) array_filter( $reasons, static fn( $r ) => in_array( $r['kind'], array( 'wordpress', 'demo' ), true ) );
		$suggested = $example && in_array( 'bin', $actions, true ) ? 'bin' : 'unpublish';
	}

	return array(
		'key'       => 'post:' . $post->ID,
		'type'      => 'post',
		'id'        => $post->ID,
		'title'     => get_the_title( $post ) ?: '(no title)',
		'thing'     => $thing,
		'status'    => $post->post_status,
		'edit'      => (string) get_edit_post_link( $post->ID, 'raw' ),
		'view'      => $public ? (string) get_permalink( $post ) : '',
		'group'     => $group,
		'reasons'   => $reasons,
		'notes'     => $notes,
		'actions'   => $actions,
		'suggested' => $suggested,
		'locked'    => $locked,
		'menus'     => array_map( static fn( $m ) => $m['item'], array_filter( $used['menus'], static fn( $m ) => ! $m['under'] ) ),
	);
}

/** Active widgets with placeholder text: [ [ id, title, area, reasons ] ]. */
function ggds_tidy_widgets(): array {
	global $wp_registered_sidebars;
	$out = array();
	foreach ( wp_get_sidebars_widgets() as $area => $ids ) {
		if ( 'wp_inactive_widgets' === $area || ! is_array( $ids ) ) {
			continue;
		}
		foreach ( $ids as $widget_id ) {
			if ( ! preg_match( '/^(.+)-(\d+)$/', (string) $widget_id, $m ) ) {
				continue;
			}
			$all      = get_option( 'widget_' . $m[1] );
			$instance = is_array( $all ) ? ( $all[ (int) $m[2] ] ?? null ) : null;
			if ( ! is_array( $instance ) ) {
				continue;
			}
			$text  = ggds_tidy_plain( implode( ' ', array_filter( array_map( static fn( $v ) => is_string( $v ) ? $v : '', $instance ) ) ) );
			$found = ggds_tidy_find( $text );
			if ( ! $found ) {
				continue;
			}
			$title = trim( (string) ( $instance['title'] ?? '' ) );
			$out[] = array(
				'id'      => (string) $widget_id,
				'title'   => '' !== $title ? $title : 'A “' . $m[1] . '” widget',
				'area'    => (string) ( $wp_registered_sidebars[ $area ]['name'] ?? $area ),
				'reasons' => ggds_tidy_reasons( $found ),
			);
		}
	}
	return $out;
}

/** How many things there are to fix, for the dashboard notice. Kept for 12 hours, or until content changes. */
function ggds_tidy_count(): int {
	$count = get_transient( GGDS_TIDY_COUNT );
	if ( false === $count ) {
		$count = ggds_tidy_scan()['counts']['fix'];
		set_transient( GGDS_TIDY_COUNT, $count, 12 * HOUR_IN_SECONDS );
	}
	return (int) $count;
}

foreach ( array( 'save_post', 'deleted_post', 'trashed_post', 'untrashed_post', 'trashed_comment', 'untrashed_comment', 'update_option_blogdescription' ) as $ggds_tidy_hook ) {
	add_action( $ggds_tidy_hook, static fn() => delete_transient( GGDS_TIDY_COUNT ) );
}

/**
 * A post's status, written straight to the database: its content, dates and author are not saved again. WordPress's
 * status hooks still run, so caches, sitemaps and scheduled posts keep up.
 */
function ggds_tidy_set_status( int $id, string $to ): void {
	global $wpdb;
	$post = get_post( $id );
	if ( ! $post || $post->post_status === $to ) {
		return;
	}
	$from = $post->post_status;
	if ( 'future' === $to && strtotime( $post->post_date_gmt . ' GMT' ) <= time() ) {
		$to = 'publish'; // its date passed while it was off the website
	}
	$wpdb->update( $wpdb->posts, array( 'post_status' => $to ), array( 'ID' => $id ) );
	clean_post_cache( $id );
	wp_transition_post_status( $to, $from, get_post( $id ) );
}

/** Move a post to the Bin, the way WordPress does, so its Bin can restore it, empty it, or delete it after 30 days. */
function ggds_tidy_trash( WP_Post $post ): bool {
	$from = $post->post_status;
	if ( null !== apply_filters( 'pre_trash_post', null, $post, $from ) ) {
		return false;
	}
	do_action( 'wp_trash_post', $post->ID, $from );
	update_post_meta( $post->ID, '_wp_trash_meta_status', $from );
	update_post_meta( $post->ID, '_wp_trash_meta_time', time() );
	ggds_tidy_set_status( $post->ID, 'trash' );
	wp_trash_post_comments( $post->ID );
	do_action( 'trashed_post', $post->ID, $from );
	return true;
}

/** Take a post out of the Bin, back to the status it had. */
function ggds_tidy_untrash( WP_Post $post, string $to ): void {
	do_action( 'untrash_post', $post->ID, $to );
	delete_post_meta( $post->ID, '_wp_trash_meta_status' );
	delete_post_meta( $post->ID, '_wp_trash_meta_time' );
	ggds_tidy_set_status( $post->ID, $to );
	wp_untrash_post_comments( $post->ID );
	do_action( 'untrashed_post', $post->ID, $to );
}

/**
 * Do what was chosen: [ key => action ]. Only items the scan finds now, and actions this user has, are done.
 * Returns the logged batch, or an error when nothing was chosen.
 */
function ggds_tidy_apply( array $choices ) {
	$items = array();
	foreach ( ggds_tidy_scan()['items'] as $item ) {
		$items[ $item['key'] ] = $item;
	}
	$changes = array();
	foreach ( $choices as $key => $action ) {
		$item = $items[ (string) $key ] ?? null;
		if ( ! $item || 'leave' === $action || ! in_array( $action, $item['actions'], true ) ) {
			continue;
		}
		$change = array( 'key' => $item['key'], 'type' => $item['type'], 'id' => $item['id'], 'title' => $item['title'], 'action' => $action );
		if ( 'post' === $item['type'] ) {
			$post = get_post( (int) $item['id'] );
			if ( ! $post ) {
				continue;
			}
			$change['from'] = $post->post_status;
			$change['path'] = in_array( $post->post_status, GGDS_TIDY_PUBLIC, true ) ? (string) wp_make_link_relative( (string) get_permalink( $post ) ) : '';
			if ( 'unpublish' === $action ) {
				ggds_tidy_set_status( $post->ID, 'draft' );
				// Its menu items go too (the theme shows only published ones), and come back with undo.
				$change['menu_items'] = array();
				foreach ( $item['menus'] as $menu_item ) {
					ggds_tidy_set_status( (int) $menu_item, 'draft' );
					$change['menu_items'][] = (int) $menu_item;
				}
			} elseif ( ! ggds_tidy_trash( $post ) ) {
				continue; // another plugin stopped it
			}
		} elseif ( 'comment' === $item['type'] ) {
			if ( ! wp_trash_comment( (int) $item['id'] ) ) {
				continue;
			}
		} elseif ( 'option' === $item['type'] ) {
			$change['from'] = (string) get_option( 'blogdescription' );
			update_option( 'blogdescription', '' );
		}
		$changes[] = $change;
	}
	if ( ! $changes ) {
		return new WP_Error( 'ggds_tidy_nothing', 'Nothing was changed: everything was set to “Leave it”.' );
	}
	$user  = wp_get_current_user();
	$batch = array(
		'id'      => gmdate( 'YmdHis' ) . '-' . wp_generate_password( 4, false, false ),
		'when'    => time(),
		'who'     => $user->exists() ? $user->display_name : 'WP-CLI',
		'changes' => $changes,
		'undone'  => null,
	);
	$log = (array) get_option( GGDS_TIDY_LOG, array() );
	array_unshift( $log, $batch );
	update_option( GGDS_TIDY_LOG, array_slice( $log, 0, 30 ), false );
	delete_transient( GGDS_TIDY_COUNT );
	return $batch;
}

/** The log of changes, newest first. */
function ggds_tidy_log(): array {
	return array_values( array_filter( (array) get_option( GGDS_TIDY_LOG, array() ), 'is_array' ) );
}

/**
 * Undo one batch: each item goes back to how it was, unless it has changed since (then it is left, and a note says
 * so). Returns [ done => number put back, notes => [ ... ] ], or an error.
 */
function ggds_tidy_undo( string $id ) {
	$log = ggds_tidy_log();
	$at  = null;
	foreach ( $log as $i => $batch ) {
		if ( $batch['id'] === $id ) {
			$at = $i;
		}
	}
	if ( null === $at ) {
		return new WP_Error( 'ggds_tidy_no_batch', 'That change is no longer in the list, so it cannot be undone here.' );
	}
	if ( $log[ $at ]['undone'] ) {
		return new WP_Error( 'ggds_tidy_undone', 'That change has been undone already.' );
	}
	$done  = 0;
	$notes = array();
	foreach ( array_reverse( $log[ $at ]['changes'] ) as $c ) {
		$name = '“' . $c['title'] . '”';
		if ( 'post' === $c['type'] ) {
			$post = get_post( (int) $c['id'] );
			$now  = 'unpublish' === $c['action'] ? 'draft' : 'trash';
			if ( ! $post ) {
				$notes[] = sprintf( '%s has been deleted for good since, so it cannot come back.', $name );
			} elseif ( $post->post_status !== $now ) {
				$notes[] = sprintf( '%s has changed since, so it was left as it is.', $name );
			} elseif ( ! ggds_tidy_can( 'edit_post', $post->ID ) ) {
				$notes[] = sprintf( 'You are not allowed to change %s.', $name );
			} else {
				if ( 'trash' === $now ) {
					ggds_tidy_untrash( $post, (string) $c['from'] );
				} else {
					ggds_tidy_set_status( $post->ID, (string) $c['from'] );
				}
				foreach ( (array) ( $c['menu_items'] ?? array() ) as $menu_item ) {
					if ( 'draft' === get_post_status( (int) $menu_item ) ) {
						ggds_tidy_set_status( (int) $menu_item, 'publish' );
					}
				}
				++$done;
			}
		} elseif ( 'comment' === $c['type'] ) {
			$comment = get_comment( (int) $c['id'] );
			if ( ! $comment ) {
				$notes[] = 'WordPress\'s example comment has been deleted for good since, so it cannot come back.';
			} elseif ( 'trash' !== wp_get_comment_status( $comment ) ) {
				$notes[] = 'WordPress\'s example comment has changed since, so it was left as it is.';
			} else {
				wp_untrash_comment( $comment );
				++$done;
			}
		} elseif ( 'option' === $c['type'] ) {
			if ( '' !== (string) get_option( 'blogdescription' ) ) {
				$notes[] = 'Your tagline has been written since, so it was left as it is.';
			} else {
				update_option( 'blogdescription', (string) $c['from'] );
				++$done;
			}
		}
	}
	$user               = wp_get_current_user();
	$log[ $at ]['undone'] = array( 'when' => time(), 'who' => $user->exists() ? $user->display_name : 'WP-CLI' );
	update_option( GGDS_TIDY_LOG, $log, false );
	delete_transient( GGDS_TIDY_COUNT );
	return array( 'done' => $done, 'notes' => $notes );
}

/** A batch in a sentence: "Unpublished “About us” and moved “Sample Page” and 2 more to the Bin". */
function ggds_tidy_summary( array $batch ): string {
	$by = array();
	foreach ( $batch['changes'] as $c ) {
		$by[ $c['action'] ][] = 'option' === $c['type'] ? 'your tagline' : '“' . $c['title'] . '”';
	}
	$names = static function ( array $xs ): string {
		$shown = array_slice( $xs, 0, 3 );
		$more  = count( $xs ) - count( $shown );
		if ( $more ) {
			return implode( ', ', $shown ) . sprintf( ' and %d more', $more );
		}
		return count( $shown ) > 1 ? implode( ', ', array_slice( $shown, 0, -1 ) ) . ' and ' . end( $shown ) : $shown[0];
	};
	$parts = array();
	if ( ! empty( $by['unpublish'] ) ) {
		$parts[] = 'unpublished ' . $names( $by['unpublish'] );
	}
	if ( ! empty( $by['bin'] ) ) {
		$parts[] = 'moved ' . $names( $by['bin'] ) . ' to the Bin';
	}
	if ( ! empty( $by['clear'] ) ) {
		$parts[] = 'cleared ' . $names( $by['clear'] );
	}
	return ucfirst( implode( '; ', $parts ) );
}

/**
 * A page that was tidied away answers 410 Gone, not 404 Not Found, so search engines drop it from their results
 * rather than trying it again. Its address comes back when the change is undone, or when a page uses it again.
 */
add_action(
	'template_redirect',
	static function () {
		if ( ! is_404() ) {
			return;
		}
		$path = (string) wp_make_link_relative( home_url( (string) wp_parse_url( (string) ( $_SERVER['REQUEST_URI'] ?? '/' ), PHP_URL_PATH ) ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- compared, never printed
		$path = '/' . trim( $path, '/' ) . '/';
		foreach ( ggds_tidy_log() as $batch ) {
			if ( $batch['undone'] ) {
				continue;
			}
			foreach ( $batch['changes'] as $c ) {
				if ( ! empty( $c['path'] ) && '/' . trim( (string) $c['path'], '/' ) . '/' === $path ) {
					status_header( 410 );
					return;
				}
			}
		}
	}
);
