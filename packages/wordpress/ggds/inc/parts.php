<?php
/**
 * GGDS page parts: the same markup as the GGDS documentation (docs/parts.mjs), @ggds/astro and ggds-django.
 * A test renders them in WordPress and compares them with the documentation's.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;

/** A GGDS line icon (the @ggds/icons set, copied into assets/icons.json), hidden from screen readers. */
function ggds_icon( string $name, string $cls = 'ggds-icon' ): string {
	static $icons = null;
	if ( null === $icons ) {
		$file  = get_template_directory() . '/assets/icons.json';
		$icons = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : array();
	}
	$path = $icons[ $name ] ?? ( $icons['services'] ?? '' );
	return '<svg class="' . esc_attr( $cls ) . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $path . '</svg>';
}

/** A theme setting (Appearance > Customise > GGDS), with its default. */
function ggds_mod( string $key ) {
	$defaults = ggds_defaults();
	return get_theme_mod( 'ggds_' . $key, $defaults[ $key ] ?? '' );
}

/** The institution's short name: the setting, or the initials of the site title. */
function ggds_short_name(): string {
	$short = trim( (string) ggds_mod( 'short_name' ) );
	return '' !== $short ? $short : ggds_initials( get_bloginfo( 'name' ) );
}

function ggds_initials( string $name ): string {
	$words = preg_split( '/\s+/', preg_replace( '/[^\p{L}\s]/u', ' ', $name ) );
	$skip  = array( 'of', 'and', 'for', 'the', 'in', 'on' );
	$out   = '';
	foreach ( $words as $w ) {
		if ( '' !== $w && ! in_array( strtolower( $w ), $skip, true ) ) {
			$out .= mb_strtoupper( mb_substr( $w, 0, 1 ) );
		}
	}
	return mb_substr( $out, 0, 4 );
}

/** The government website banner. Official when the site is served from the official address in the settings. */
function ggds_banner(): string {
	$host       = trim( (string) ggds_mod( 'official_host' ) );
	$short      = ggds_short_name();
	$here       = (string) wp_parse_url( home_url(), PHP_URL_HOST );
	$unofficial = '' === $host || strtolower( $host ) !== strtolower( $here );
	$register   = (string) ggds_mod( 'register_url' );
	$text       = $unofficial ? sprintf( 'This copy is not the official %s website', esc_html( $short ) ) : 'An official website of the Government of Ghana';
	if ( '' === $host ) {
		$address = sprintf( 'The %s has not confirmed its official address yet.', esc_html( $short ) );
	} elseif ( $unofficial ) {
		$address = sprintf( 'The official %s website is <strong>%s</strong>.', esc_html( $short ), esc_html( $host ) );
	} else {
		$address = sprintf( 'The official address of this website is <strong>%s</strong>.', esc_html( $host ) );
	}
	$flag = '<svg class="ggds-banner__flag" viewBox="0 0 30 20" aria-hidden="true" focusable="false"><rect class="ggds-banner__flag-red" width="30" height="6.67"/><rect class="ggds-banner__flag-gold" y="6.67" width="30" height="6.67"/><rect class="ggds-banner__flag-green" y="13.33" width="30" height="6.67"/><polygon class="ggds-banner__flag-star" points="15,6.8 15.73,8.99 18.04,9.01 16.19,10.39 16.88,12.59 15,11.25 13.12,12.59 13.81,10.39 11.96,9.01 14.27,8.99"/></svg>';
	return '<section class="ggds-banner' . ( $unofficial ? ' ggds-banner--unofficial' : '' ) . '" aria-label="Official government website">
  <details class="ggds-banner__details ggds-container">
    <summary class="ggds-banner__summary">' . $flag . '<span class="ggds-banner__text">' . $text . '</span> <span class="ggds-banner__toggle">How to tell</span></summary>
    <div class="ggds-banner__content">
      <div class="ggds-banner__item"><p class="ggds-banner__heading">Check the address</p><p>' . $address . ' Most government websites end in <strong>.gov.gh</strong>, but some official websites do not. You can check it in the <a href="' . esc_url( $register ) . '">register of official government websites</a>.</p></div>
      <div class="ggds-banner__item"><p class="ggds-banner__heading">A padlock is not proof</p><p>A padlock or <strong>https://</strong> before the address means your connection to the website is private. It does not show who runs the website.</p></div>
      <div class="ggds-banner__item"><p class="ggds-banner__heading">We will never ask for your PIN</p><p>Government officials will never ask for your PIN, password or mobile money code, by phone, by SMS or on a website.</p></div>
    </div>
  </details>
</section>';
}

/** The institution's mark: its logo (Appearance > Customise > Site identity), or its initials until there is one. */
function ggds_mark( string $cls = 'ggds-header__logo' ): string {
	$logo_id = (int) get_theme_mod( 'custom_logo' );
	if ( $logo_id ) {
		$src = wp_get_attachment_image_url( $logo_id, 'medium' );
		if ( $src ) {
			return '<img class="' . esc_attr( $cls ) . '" src="' . esc_url( $src ) . '" alt="" width="44" height="44">';
		}
	}
	$initials = trim( (string) ggds_mod( 'initials' ) );
	return '<span class="ggds-header__monogram" aria-hidden="true">' . esc_html( '' !== $initials ? $initials : ggds_short_name() ) . '</span>';
}

/** Top-level items of a menu location, each with its children: [ [ 'label', 'href', 'description', 'children' ] ]. */
function ggds_menu( string $location ): array {
	$locations = get_nav_menu_locations();
	if ( empty( $locations[ $location ] ) ) {
		return array();
	}
	$items = wp_get_nav_menu_items( $locations[ $location ] ) ?: array();
	$top   = array();
	foreach ( $items as $item ) {
		if ( ! (int) $item->menu_item_parent ) {
			$top[ $item->ID ] = array( 'label' => $item->title, 'href' => $item->url, 'description' => $item->description, 'children' => array() );
		}
	}
	foreach ( $items as $item ) {
		$parent = (int) $item->menu_item_parent;
		if ( $parent && isset( $top[ $parent ] ) ) {
			$top[ $parent ]['children'][] = array( 'label' => $item->title, 'href' => $item->url );
		}
	}
	return array_values( $top );
}

/** The href of the main section the current page is in: the longest menu address the current address starts with. */
function ggds_current_section( array $items ): string {
	$path = (string) wp_parse_url( $_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	$best = '';
	foreach ( $items as $item ) {
		$item_path = (string) wp_parse_url( $item['href'], PHP_URL_PATH );
		if ( '' !== $item_path && '/' !== $item_path && str_starts_with( trailingslashit( $path ), trailingslashit( $item_path ) ) && strlen( $item_path ) > strlen( (string) wp_parse_url( $best, PHP_URL_PATH ) ) ) {
			$best = $item['href'];
		}
	}
	return $best;
}

/** The header: flag line, logo or initials, name and country, the main sections (menu "Main"), and Search. */
function ggds_header(): string {
	$name    = get_bloginfo( 'name' );
	$country = (string) ggds_mod( 'country' );
	$nav     = ggds_menu( 'primary' );
	$current = ggds_current_section( $nav );
	$items   = array();
	foreach ( $nav as $n ) {
		$items[] = '<li><a class="ggds-header__link" href="' . esc_url( $n['href'] ) . '"' . ( $n['href'] === $current ? ' aria-current="page"' : '' ) . '>' . esc_html( $n['label'] ) . '</a></li>';
	}
	return '<header class="ggds-header">
  <div class="ggds-container ggds-header__inner">
    <a class="ggds-header__identity" href="' . esc_url( home_url( '/' ) ) . '">
      ' . ggds_mark() . '
      <span class="ggds-header__text">
        <span class="ggds-header__name' . ( mb_strlen( $name ) > 45 ? ' ggds-header__name--long' : '' ) . '">' . esc_html( $name ) . '</span>
        ' . ( '' !== $country ? '<span class="ggds-header__country">' . esc_html( $country ) . '</span>' : '' ) . '
        <span class="ggds-visually-hidden"> – home</span>
      </span>
    </a>
    <nav class="ggds-header__nav" id="ggds-header-nav" aria-label="Main">
      <ul class="ggds-header__list">
        ' . implode( "\n        ", $items ) . '
      </ul>
    </nav>
    <a class="ggds-header__search" href="' . esc_url( home_url( '/?s=' ) ) . '">' . ggds_icon( 'search', 'ggds-header__icon' ) . '<span class="ggds-header__search-label">Search</span></a>
    <button type="button" class="ggds-header__menu-button" aria-controls="ggds-header-nav" aria-expanded="false" hidden>' . ggds_icon( 'menu', 'ggds-header__icon ggds-header__icon--menu' ) . ggds_icon( 'close', 'ggds-header__icon ggds-header__icon--close' ) . '<span class="ggds-visually-hidden">Menu</span></button>
  </div>
</header>';
}

/** The homepage hero: purpose (the site's tagline), question, search, and common tasks (menu "Common tasks"). */
function ggds_hero(): string {
	$purpose = get_bloginfo( 'description' );
	$tasks   = ggds_menu( 'tasks' );
	$list    = '';
	if ( $tasks ) {
		$links = array();
		foreach ( array_slice( $tasks, 0, 6 ) as $t ) {
			$links[] = '<li><a class="ggds-hero__task" href="' . esc_url( $t['href'] ) . '">' . esc_html( $t['label'] ) . '</a></li>';
		}
		$list = '
      <p class="ggds-hero__tasks-label" id="hero-tasks">Common tasks:</p>
      <ul class="ggds-hero__tasks" aria-labelledby="hero-tasks">
        ' . implode( "\n        ", $links ) . '
      </ul>';
	}
	$placeholder = (string) ggds_mod( 'search_placeholder' );
	return '<section class="ggds-hero" aria-labelledby="hero-title">
  <div class="ggds-hero__inner">
    <div class="ggds-hero__body">
      ' . ( '' !== $purpose ? '<p class="ggds-hero__purpose">' . esc_html( $purpose ) . '</p>' : '' ) . '
      <h1 class="ggds-hero__title" id="hero-title">' . esc_html( (string) ggds_mod( 'hero_title' ) ) . '</h1>
      <form class="ggds-hero__search" action="' . esc_url( home_url( '/' ) ) . '" method="get" role="search">
        <label class="ggds-visually-hidden" for="hero-q">Search this website</label>
        <input class="ggds-hero__input" id="hero-q" name="s" type="search" required minlength="2" enterkeyhint="search" autocomplete="off"' . ( '' !== $placeholder ? ' placeholder="' . esc_attr( $placeholder ) . '"' : '' ) . '>
        <button class="ggds-hero__button" type="submit">' . ggds_icon( 'search', 'ggds-hero__button-icon' ) . '<span class="ggds-hero__button-label">Search</span></button>
      </form>' . $list . '
    </div>
  </div>
</section>';
}

/** The footer: flag band, the institution and its contact details, its sections (menu "Footer") and the bottom bar (menu "Footer links"). */
function ggds_footer(): string {
	$name     = get_bloginfo( 'name' );
	$purpose  = (string) ggds_mod( 'purpose' );
	$address  = (string) ggds_mod( 'address' );
	$email    = (string) ggds_mod( 'email' );
	$phone    = (string) ggds_mod( 'phone' );
	$more     = (string) ggds_mod( 'contact_url' );
	$contact  = '';
	if ( $address || $email || $phone ) {
		$contact = '
      <address class="ggds-footer__contact">
        ' . ( $address ? '<span>' . esc_html( $address ) . '</span>' : '' ) . '
        ' . ( $email ? '<a href="mailto:' . esc_attr( $email ) . '">' . esc_html( $email ) . '</a>' : '' ) . '
        ' . ( $phone ? '<span>General enquiries: ' . esc_html( $phone ) . '</span>' : '' ) . '
      </address>
      ' . ( $more ? '<p class="ggds-footer__more"><a href="' . esc_url( $more ) . '">All contact details and offices</a></p>' : '' );
	}
	$sections = '';
	foreach ( ggds_menu( 'footer' ) as $s ) {
		$links = array();
		foreach ( array_slice( $s['children'], 0, 5 ) as $l ) {
			$links[] = '<li><a href="' . esc_url( $l['href'] ) . '">' . esc_html( $l['label'] ) . '</a></li>';
		}
		$sections .= '
      <nav class="ggds-footer__section" aria-label="' . esc_attr( $s['label'] ) . '">
        <p class="ggds-footer__heading"><a href="' . esc_url( $s['href'] ) . '">' . esc_html( $s['label'] ) . '</a></p>
        <ul class="ggds-footer__list">
          ' . implode( "\n          ", $links ) . '
        </ul>
      </nav>';
	}
	$bar = array();
	foreach ( ggds_menu( 'legal' ) as $l ) {
		$bar[] = '<li><a href="' . esc_url( $l['href'] ) . '">' . esc_html( $l['label'] ) . '</a></li>';
	}
	return '<footer class="ggds-footer">
  <div class="ggds-container ggds-footer__main">
    <div>
      <p class="ggds-footer__identity">' . ggds_mark( 'ggds-footer__logo' ) . '<span>' . esc_html( $name ) . '</span></p>
      ' . ( $purpose ? '<p class="ggds-footer__purpose">' . esc_html( $purpose ) . '</p>' : '' ) . $contact . '
    </div>
    <div class="ggds-footer__sections">' . $sections . '
    </div>
  </div>
  <div class="ggds-footer__bottom">
    <ul class="ggds-container ggds-footer__bar">
      <li>© ' . esc_html( wp_date( 'Y' ) ) . ' ' . esc_html( $name ) . '</li>
      ' . implode( "\n      ", $bar ) . '
    </ul>
  </div>
</footer>';
}

/** The tab bar on phones: Home, the first three main sections, and Search. */
function ggds_tab_bar(): string {
	$nav     = ggds_menu( 'primary' );
	$current = is_front_page() ? home_url( '/' ) : ( is_search() ? home_url( '/?s=' ) : ggds_current_section( $nav ) );
	$icons   = array( 'services', 'building', 'help' );
	$tabs    = array( array( 'Home', home_url( '/' ), 'home' ) );
	foreach ( array_slice( $nav, 0, 3 ) as $i => $n ) {
		$tabs[] = array( $n['label'], $n['href'], $icons[ $i ] );
	}
	$tabs[] = array( 'Search', home_url( '/?s=' ), 'search' );
	$out    = array();
	foreach ( $tabs as $t ) {
		$out[] = '<li><a class="ggds-tab-bar__link" href="' . esc_url( $t[1] ) . '"' . ( $t[1] === $current ? ' aria-current="page"' : '' ) . '>' . ggds_icon( $t[2], 'ggds-tab-bar__icon' ) . '<span>' . esc_html( $t[0] ) . '</span></a></li>';
	}
	return '<nav class="ggds-tab-bar" aria-label="Quick links">
  <ul class="ggds-tab-bar__list">
    ' . implode( "\n    ", $out ) . '
  </ul>
</nav>';
}

/** Breadcrumbs: Home, then the page's parents (pages) or the posts page (posts), then the current page. */
function ggds_breadcrumbs(): string {
	if ( is_front_page() ) {
		return '';
	}
	$crumbs = array( array( 'Home', home_url( '/' ) ) );
	if ( is_page() ) {
		foreach ( array_reverse( get_post_ancestors( get_the_ID() ) ) as $id ) {
			$crumbs[] = array( get_the_title( $id ), get_permalink( $id ) );
		}
	} elseif ( is_singular( 'post' ) && get_option( 'page_for_posts' ) ) {
		$posts    = (int) get_option( 'page_for_posts' );
		$crumbs[] = array( get_the_title( $posts ), get_permalink( $posts ) );
	}
	$items = array();
	foreach ( $crumbs as $c ) {
		$items[] = '<li class="ggds-breadcrumbs__item"><a class="ggds-breadcrumbs__link" href="' . esc_url( $c[1] ) . '">' . esc_html( $c[0] ) . '</a></li>';
	}
	$items[] = '<li class="ggds-breadcrumbs__item" aria-current="page">' . esc_html( ggds_page_title() ) . '</li>';
	return '<nav class="ggds-breadcrumbs" aria-label="Breadcrumb">
  <ol class="ggds-breadcrumbs__list">
    ' . implode( "\n    ", $items ) . '
  </ol>
</nav>';
}

/** The current page's title, as its <h1> says it. */
function ggds_page_title(): string {
	if ( is_search() ) {
		return 'Search';
	}
	if ( is_404() ) {
		return 'Page not found';
	}
	if ( is_home() ) {
		return single_post_title( '', false ) ?: 'News';
	}
	if ( is_singular() ) {
		return get_the_title();
	}
	return wp_strip_all_tags( get_the_archive_title() );
}

/** Pagination for archives and search: page numbers with the first, last and neighbours, keeping the search. */
function ggds_pagination( string $label = 'Pages' ): string {
	global $wp_query;
	$total = (int) $wp_query->max_num_pages;
	if ( $total < 2 ) {
		return '';
	}
	$page  = max( 1, (int) get_query_var( 'paged' ) );
	$link  = static fn( int $n ): string => esc_url( get_pagenum_link( $n ) );
	$items = array();
	if ( $page > 1 ) {
		$items[] = '<li><a class="ggds-pagination__link" href="' . $link( $page - 1 ) . '" rel="prev">Previous<span class="ggds-visually-hidden"> page</span></a></li>';
	}
	$last = 0;
	for ( $n = 1; $n <= $total; $n++ ) {
		if ( 1 === $n || $total === $n || abs( $n - $page ) <= 1 ) {
			if ( $last && $n - $last > 1 ) {
				$items[] = '<li class="ggds-pagination__ellipsis" aria-hidden="true">…</li>';
			}
			$items[] = '<li><a class="ggds-pagination__link" href="' . $link( $n ) . '" aria-label="Page ' . $n . '"' . ( $n === $page ? ' aria-current="page"' : '' ) . '>' . $n . '</a></li>';
			$last    = $n;
		}
	}
	if ( $page < $total ) {
		$items[] = '<li><a class="ggds-pagination__link" href="' . $link( $page + 1 ) . '" rel="next">Next<span class="ggds-visually-hidden"> page</span></a></li>';
	}
	return '<nav class="ggds-pagination" aria-label="' . esc_attr( $label ) . '">
  <ul class="ggds-pagination__list">
    ' . implode( "\n    ", $items ) . '
  </ul>
</nav>';
}
