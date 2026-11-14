<?php
/**
 * The content cleaner: turns what a page builder or a heavy theme left in a page into plain, accessible content
 * that GGDS styles: headings, paragraphs, lists, links, images, tables, quotes and embedded videos.
 *
 * It works on what visitors see. Page-builder shortcodes and blocks are rendered first (with the builder's own
 * code, while it is still installed), then the result is cleaned: wrappers are taken away, inline styles, colours,
 * classes and scripts are removed, headings are put in order, and lazy-loaded images get their real address.
 * Nothing that carries meaning is thrown away silently: whatever needs a person to look at it is noted.
 *
 * @package GGDS_Switch
 */

defined( 'ABSPATH' ) || exit;

/** Shortcode prefixes that page builders and heavy themes use for layout and design. */
function ggds_switch_builder_prefixes(): array {
	return apply_filters(
		'ggds_switch_builder_prefixes',
		array( 'vc_', 'et_pb_', 'fusion_', 'av_', 'cs_', 'tatsu_', 'mk_', 'ux_', 'themify_', 'su_', 'tm_', 'cmsmasters_', 'kc_', 'rev_slider', 'layerslider', 'smartslider3' )
	);
}

/** Whether a shortcode tag belongs to a page builder or a heavy theme. */
function ggds_switch_is_builder_tag( string $tag ): bool {
	foreach ( ggds_switch_builder_prefixes() as $prefix ) {
		if ( str_starts_with( $tag, $prefix ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Clean a post's content. Returns the cleaned content; $notes collects what a person should look at.
 *
 * @param string $content The post content as stored, or as the page builder renders it.
 * @param array  $notes   Filled with short, plain notes, such as "A slider was removed".
 */
function ggds_switch_clean( string $content, array &$notes = array() ): string {
	if ( function_exists( 'has_blocks' ) && has_blocks( $content ) ) {
		return ggds_switch_clean_blocks( $content, $notes );
	}
	$html = ggds_switch_expand_builder_shortcodes( $content, $notes );
	return ggds_switch_clean_html( wpautop( $html ), $notes );
}

/**
 * Render only the page builder's shortcodes, leaving every other shortcode (a contact form, a gallery) in place so
 * it keeps working. A builder that is no longer installed has its shortcodes unwrapped, keeping the text, images
 * and buttons inside them.
 */
function ggds_switch_expand_builder_shortcodes( string $content, array &$notes ): string {
	global $shortcode_tags;
	if ( ! str_contains( $content, '[' ) ) {
		return $content;
	}
	// Render the registered builder shortcodes, and only those.
	$all     = $shortcode_tags;
	$builder = array_filter( $all, 'ggds_switch_is_builder_tag', ARRAY_FILTER_USE_KEY );
	if ( $builder ) {
		$shortcode_tags = $builder; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
		for ( $i = 0; $i < 4 && preg_match( '/\[(' . implode( '|', array_map( 'preg_quote', array_keys( $builder ) ) ) . ')[\s\]\/]/', $content ); $i++ ) {
			$content = do_shortcode( $content );
		}
		$shortcode_tags = $all; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
	}
	// Unwrap the rest of the builder's shortcodes: their content stays, and images, buttons and headings kept in
	// their attributes become ordinary HTML.
	$prefixes = implode( '|', array_map( static fn( $p ) => preg_quote( $p, '/' ), ggds_switch_builder_prefixes() ) );
	return (string) preg_replace_callback(
		'/\[(\/?)((?:' . $prefixes . ')[\w-]*)([^\]]*)\]/',
		static function ( array $m ) use ( &$notes ): string {
			if ( '/' === $m[1] ) {
				return "\n";
			}
			$tag  = $m[2];
			$atts = shortcode_parse_atts( trim( $m[3], ' /' ) );
			$atts = is_array( $atts ) ? $atts : array();
			if ( preg_match( '/slider|carousel|revolution|layerslider/', $tag ) ) {
				$notes['slider'] = 'A slider or carousel was taken apart: its slides are now ordinary text. Keep the most important message, and delete the rest.';
				return '';
			}
			$out = '';
			foreach ( array( 'image', 'src', 'image_url', 'img', 'image_id' ) as $key ) {
				if ( ! empty( $atts[ $key ] ) ) {
					$src = is_numeric( $atts[ $key ] ) ? (string) wp_get_attachment_image_url( (int) $atts[ $key ], 'large' ) : (string) $atts[ $key ];
					$alt = is_numeric( $atts[ $key ] ) ? (string) get_post_meta( (int) $atts[ $key ], '_wp_attachment_image_alt', true ) : (string) ( $atts['alt'] ?? '' );
					if ( '' !== $src ) {
						$out .= "\n<p><img src=\"" . esc_url( $src ) . '" alt="' . esc_attr( $alt ) . "\"></p>\n";
					}
					break;
				}
			}
			$text = '';
			foreach ( array( 'title', 'text', 'heading', 'button_text', 'label' ) as $key ) {
				if ( ! empty( $atts[ $key ] ) ) {
					$text = wp_strip_all_tags( rawurldecode( (string) $atts[ $key ] ) );
					break;
				}
			}
			$link = '';
			foreach ( array( 'link', 'url', 'button_url', 'href' ) as $key ) {
				if ( ! empty( $atts[ $key ] ) ) {
					// WPBakery writes links as "url:https%3A%2F%2F...|title:...".
					$link = preg_match( '/(?:^|\|)url:([^|]+)/', (string) $atts[ $key ], $u ) ? rawurldecode( $u[1] ) : (string) $atts[ $key ];
					break;
				}
			}
			if ( '' !== $text && '' !== $link ) {
				$out .= "\n<p><a href=\"" . esc_url( $link ) . '">' . esc_html( $text ) . "</a></p>\n";
			} elseif ( '' !== $text && preg_match( '/heading|title/', $tag ) ) {
				$out .= "\n<h2>" . esc_html( $text ) . "</h2>\n";
			}
			return $out . "\n";
		},
		$content
	);
}

/** Block content: core blocks keep their structure without colours and inline styles; other blocks become HTML. */
function ggds_switch_clean_blocks( string $content, array &$notes ): string {
	$walk = static function ( array $blocks ) use ( &$walk, &$notes ): array {
		$out = array();
		foreach ( $blocks as $block ) {
			$name = (string) ( $block['blockName'] ?? '' );
			if ( '' === $name ) {
				$html = ggds_switch_clean_html( (string) $block['innerHTML'], $notes );
				if ( '' !== trim( $html ) ) {
					$out[] = array( 'blockName' => null, 'attrs' => array(), 'innerBlocks' => array(), 'innerHTML' => "\n" . $html . "\n", 'innerContent' => array( "\n" . $html . "\n" ) );
				}
				continue;
			}
			$core_static = str_starts_with( $name, 'core/' ) && ! in_array( $name, array( 'core/html', 'core/shortcode', 'core/freeform', 'core/cover', 'core/media-text' ), true );
			if ( $core_static ) {
				foreach ( array( 'style', 'textColor', 'backgroundColor', 'gradient', 'fontSize', 'fontFamily', 'borderColor', 'className' ) as $key ) {
					unset( $block['attrs'][ $key ] );
				}
				if ( 'core/heading' === $name && 1 === (int) ( $block['attrs']['level'] ?? 2 ) ) {
					$block['attrs']['level'] = 2;
					$block['innerContent']   = array_map( static fn( $c ) => is_string( $c ) ? preg_replace( '/<(\/?)h1\b/', '<$1h2', $c ) : $c, $block['innerContent'] );
				}
				$block['innerContent'] = array_map( static fn( $c ) => is_string( $c ) ? ggds_switch_strip_presentation( $c ) : $c, $block['innerContent'] );
				$block['innerHTML']    = ggds_switch_strip_presentation( (string) $block['innerHTML'] );
				$block['innerBlocks']  = $walk( $block['innerBlocks'] );
				$out[]                 = $block;
				continue;
			}
			// Other blocks (a page builder's, a theme's, or a raw HTML or shortcode block): what visitors see, cleaned.
			if ( 'core/shortcode' === $name ) {
				$rendered = ggds_switch_expand_builder_shortcodes( (string) $block['innerHTML'], $notes );
				$html     = ggds_switch_clean_html( wpautop( $rendered ), $notes );
			} else {
				$rendered = render_block( $block );
				$html     = ggds_switch_clean_html( '' !== trim( $rendered ) ? $rendered : (string) $block['innerHTML'], $notes );
			}
			if ( '' !== trim( $html ) ) {
				$out[] = array( 'blockName' => null, 'attrs' => array(), 'innerBlocks' => array(), 'innerHTML' => "\n" . $html . "\n", 'innerContent' => array( "\n" . $html . "\n" ) );
			}
		}
		return $out;
	};
	return serialize_blocks( $walk( parse_blocks( $content ) ) );
}

/** Take inline styles and colour, size and font classes out of a fragment of block markup. */
function ggds_switch_strip_presentation( string $html ): string {
	$html = (string) preg_replace( '/\s+style="[^"]*"/i', '', $html );
	return (string) preg_replace_callback(
		'/\sclass="([^"]*)"/i',
		static function ( array $m ): string {
			$keep = array_filter( preg_split( '/\s+/', $m[1] ), static fn( $c ) => '' !== $c && ! preg_match( '/^(has-|is-style-|is-layout-|wp-container-|wp-elements-)/', $c ) );
			return $keep ? ' class="' . implode( ' ', $keep ) . '"' : '';
		},
		$html
	);
}

/** Elements kept, each with the attributes it may keep. Everything else is unwrapped (its content stays). */
function ggds_switch_allowed(): array {
	$cell = array( 'colspan', 'rowspan', 'scope', 'headers' );
	return array(
		'p' => array(), 'br' => array(), 'hr' => array(), 'strong' => array(), 'em' => array(), 'u' => array(), 'small' => array(),
		'sub' => array(), 'sup' => array(), 'mark' => array(), 'code' => array(), 'pre' => array(), 'kbd' => array(), 'cite' => array(),
		'q' => array( 'cite' ), 'abbr' => array( 'title' ), 'time' => array( 'datetime' ), 'blockquote' => array( 'cite' ),
		'h2' => array( 'id' ), 'h3' => array( 'id' ), 'h4' => array( 'id' ), 'h5' => array( 'id' ), 'h6' => array( 'id' ),
		'ul' => array(), 'ol' => array( 'start', 'reversed', 'type' ), 'li' => array(), 'dl' => array(), 'dt' => array(), 'dd' => array(),
		'a' => array( 'href', 'id', 'hreflang', 'download' ), 'img' => array( 'src', 'alt', 'width', 'height', 'srcset', 'sizes', 'class' ),
		'figure' => array(), 'figcaption' => array(), 'table' => array(), 'caption' => array(), 'thead' => array(), 'tbody' => array(),
		'tfoot' => array(), 'tr' => array(), 'th' => $cell, 'td' => $cell, 'colgroup' => array(), 'col' => array( 'span' ),
		'details' => array(), 'summary' => array(),
		'iframe' => array( 'src', 'title', 'width', 'height', 'allow', 'allowfullscreen', 'loading' ),
		'video' => array( 'src', 'controls', 'poster', 'width', 'height', 'preload' ), 'audio' => array( 'src', 'controls', 'preload' ),
		'source' => array( 'src', 'type' ), 'track' => array( 'src', 'kind', 'srclang', 'label', 'default' ),
	);
}

/** Elements removed with everything in them. */
function ggds_switch_removed(): array {
	return array( 'script', 'style', 'noscript', 'link', 'meta', 'template', 'object', 'embed', 'canvas', 'form', 'button', 'input', 'select', 'textarea', 'label', 'nav', 'svg', 'map' );
}

/** Block-level elements: a wrapper holding none of them becomes a paragraph. */
function ggds_switch_blocks(): array {
	return array( 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'dl', 'table', 'figure', 'blockquote', 'pre', 'hr', 'details', 'iframe', 'video', 'audio',
		'div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'center', 'address', 'li', 'tr', 'td', 'th', 'form', 'nav' );
}

/** Clean a piece of HTML (see the top of this file). */
function ggds_switch_clean_html( string $html, array &$notes = array() ): string {
	if ( '' === trim( $html ) ) {
		return '';
	}
	$doc      = new DOMDocument();
	$previous = libxml_use_internal_errors( true );
	$doc->loadHTML( '<?xml encoding="utf-8"?><div id="ggds-switch-root">' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NOERROR | LIBXML_NOWARNING );
	libxml_clear_errors();
	libxml_use_internal_errors( $previous );
	$root = $doc->getElementById( 'ggds-switch-root' );
	if ( ! $root ) {
		return wp_kses_post( $html );
	}
	$allowed = ggds_switch_allowed();
	$blocks  = ggds_switch_blocks();

	// Removed with their content. Forms and sliders are noted, because people may rely on them.
	foreach ( ggds_switch_removed() as $tag ) {
		foreach ( iterator_to_array( $root->getElementsByTagName( $tag ) ) as $el ) {
			if ( 'form' === $tag ) {
				$notes['form'] = 'A form made by the page builder was removed. Add it back with a form plugin that works under GGDS\'s security policy, or link to the form.';
			}
			if ( $el->parentNode ) {
				$el->parentNode->removeChild( $el );
			}
		}
	}

	// Children before their parents, so a wrapper is judged by what is left inside it.
	$elements = array_reverse( iterator_to_array( $root->getElementsByTagName( '*' ) ) );
	foreach ( $elements as $el ) {
		if ( ! $el->parentNode ) {
			continue;
		}
		$tag   = strtolower( $el->nodeName );
		$class = strtolower( (string) $el->getAttribute( 'class' ) );
		if ( preg_match( '/\b(slider|carousel|swiper|slick|owl-|rev_slider|flexslider)/', $class ) ) {
			$notes['slider'] = 'A slider or carousel was taken apart: its slides are now ordinary text. Keep the most important message, and delete the rest.';
		}
		// Lazy-loaded images: the real address is in a data attribute.
		if ( 'img' === $tag ) {
			foreach ( array( 'data-src', 'data-lazy-src', 'data-original', 'data-lazy' ) as $attr ) {
				if ( $el->getAttribute( $attr ) ) {
					$el->setAttribute( 'src', $el->getAttribute( $attr ) );
					break;
				}
			}
			foreach ( array( 'data-srcset', 'data-lazy-srcset' ) as $attr ) {
				if ( $el->getAttribute( $attr ) ) {
					$el->setAttribute( 'srcset', $el->getAttribute( $attr ) );
				}
			}
			$src = esc_url_raw( (string) $el->getAttribute( 'src' ), array( 'http', 'https' ) );
			if ( '' === $src ) {
				$el->parentNode->removeChild( $el );
				continue;
			}
			$el->setAttribute( 'src', $src );
			if ( ! $el->hasAttribute( 'alt' ) ) {
				$el->setAttribute( 'alt', '' );
				$notes['alt'] = 'Some images have no description (alt text). Add one to each image that carries information.';
			}
			// Keep only WordPress's own image class, which lets it pick the right size.
			preg_match( '/\bwp-image-\d+\b/', (string) $el->getAttribute( 'class' ), $wp_image );
			$el->removeAttribute( 'class' );
			if ( $wp_image ) {
				$el->setAttribute( 'class', $wp_image[0] );
			}
		}
		// Media addresses are web addresses only (never javascript: or data:), because the switch saves content
		// without WordPress's HTML filter.
		if ( in_array( $tag, array( 'iframe', 'video', 'audio', 'source', 'track' ), true ) ) {
			foreach ( array( 'src', 'poster' ) as $attr ) {
				if ( $el->hasAttribute( $attr ) ) {
					$safe = esc_url_raw( (string) $el->getAttribute( $attr ), array( 'http', 'https' ) );
					if ( '' === $safe ) {
						$el->removeAttribute( $attr );
					} else {
						$el->setAttribute( $attr, $safe );
					}
				}
			}
			if ( in_array( $tag, array( 'iframe', 'source', 'track' ), true ) && ! $el->hasAttribute( 'src' ) ) {
				$el->parentNode->removeChild( $el );
				continue;
			}
		}
		if ( 'iframe' === $tag ) {
			$host = (string) wp_parse_url( (string) $el->getAttribute( 'src' ), PHP_URL_HOST );
			$notes[ 'embed-' . $host ] = sprintf( 'An embedded %s frame is kept. Under GGDS\'s strict security policy it shows only if your policy allows that address (frame-src), so check it, or link to it instead.', '' !== $host ? $host : 'page' );
			if ( ! $el->getAttribute( 'title' ) ) {
				$el->setAttribute( 'title', 'Embedded content' );
			}
		}
		if ( 'b' === $tag ) {
			$el = ggds_switch_rename( $el, 'strong' );
			$tag = 'strong';
		} elseif ( 'i' === $tag && '' !== trim( $el->textContent ) ) {
			$el = ggds_switch_rename( $el, 'em' );
			$tag = 'em';
		} elseif ( 'h1' === $tag ) {
			// The page's title is its only top heading.
			$el = ggds_switch_rename( $el, 'h2' );
			$tag = 'h2';
		}
		if ( 'a' === $tag ) {
			$href = trim( (string) $el->getAttribute( 'href' ) );
			$safe = '' === $href || '#' === $href ? '' : esc_url_raw( $href, array( 'http', 'https', 'mailto', 'tel' ) );
			if ( '' === $safe && ! str_starts_with( $href, '#' ) && ! str_starts_with( $href, '/' ) ) {
				ggds_switch_unwrap( $el );
				continue;
			}
			$el->setAttribute( 'href', '' !== $safe ? $safe : $href );
		}
		if ( ! isset( $allowed[ $tag ] ) ) {
			// A wrapper: a paragraph if it holds only text and inline parts, otherwise its content takes its place.
			$has_block = false;
			foreach ( $el->childNodes as $child ) {
				if ( XML_ELEMENT_NODE === $child->nodeType && in_array( strtolower( $child->nodeName ), $blocks, true ) ) {
					$has_block = true;
					break;
				}
			}
			$text = trim( str_replace( "\xc2\xa0", ' ', $el->textContent ) );
			if ( in_array( $tag, $blocks, true ) && ! $has_block && ( '' !== $text || $el->getElementsByTagName( 'img' )->length ) ) {
				ggds_switch_strip_attributes( ggds_switch_rename( $el, 'p' ), array() );
			} elseif ( '' === $text && ! $el->getElementsByTagName( 'img' )->length && ! $el->getElementsByTagName( 'iframe' )->length ) {
				$el->parentNode->removeChild( $el );
			} else {
				ggds_switch_unwrap( $el );
			}
			continue;
		}
		ggds_switch_strip_attributes( $el, $allowed[ $tag ] );
	}

	ggds_switch_tidy( $root, $doc );
	ggds_switch_order_headings( $root, $doc );

	$out = '';
	foreach ( $root->childNodes as $child ) {
		$out .= $doc->saveHTML( $child );
	}
	$out = (string) preg_replace( '/(<\/(p|h[2-6]|ul|ol|dl|table|figure|blockquote|pre|details)>|<hr>)\s*/', "$1\n\n", $out );
	return trim( (string) preg_replace( "/\n{3,}/", "\n\n", $out ) );
}

/** Keep only the listed attributes. */
function ggds_switch_strip_attributes( DOMElement $el, array $keep ): void {
	foreach ( iterator_to_array( $el->attributes ) as $attr ) {
		if ( ! in_array( $attr->nodeName, $keep, true ) ) {
			$el->removeAttribute( $attr->nodeName );
		}
	}
}

/** Replace an element with one of another name, keeping its attributes and content. */
function ggds_switch_rename( DOMElement $el, string $name ): DOMElement {
	$new = $el->ownerDocument->createElement( $name );
	foreach ( iterator_to_array( $el->attributes ) as $attr ) {
		$new->setAttribute( $attr->nodeName, $attr->nodeValue );
	}
	while ( $el->firstChild ) {
		$new->appendChild( $el->firstChild );
	}
	$el->parentNode->replaceChild( $new, $el );
	return $new;
}

/** Put an element's content in its place. */
function ggds_switch_unwrap( DOMElement $el ): void {
	$parent = $el->parentNode;
	while ( $el->firstChild ) {
		$parent->insertBefore( $el->firstChild, $el );
	}
	$parent->removeChild( $el );
}

/** Empty paragraphs go; loose text and inline parts at the top become paragraphs; paragraphs never nest. */
function ggds_switch_tidy( DOMElement $root, DOMDocument $doc ): void {
	// A paragraph inside a paragraph (from a wrapper inside a wrapper) is unwrapped.
	foreach ( array_reverse( iterator_to_array( $root->getElementsByTagName( 'p' ) ) ) as $p ) {
		if ( $p->parentNode && 'p' === strtolower( $p->parentNode->nodeName ) ) {
			ggds_switch_unwrap( $p->parentNode );
		}
	}
	$blocks = array( 'p', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'dl', 'table', 'figure', 'blockquote', 'pre', 'hr', 'details', 'iframe', 'video', 'audio' );
	$run    = null;
	foreach ( iterator_to_array( $root->childNodes ) as $node ) {
		$is_block = XML_ELEMENT_NODE === $node->nodeType && in_array( strtolower( $node->nodeName ), $blocks, true );
		if ( $is_block ) {
			$run = null;
			continue;
		}
		if ( XML_TEXT_NODE === $node->nodeType && '' === trim( str_replace( "\xc2\xa0", ' ', $node->nodeValue ) ) ) {
			if ( $run ) {
				$run->appendChild( $node );
			}
			continue;
		}
		if ( ! $run ) {
			$run = $doc->createElement( 'p' );
			$root->insertBefore( $run, $node );
		}
		$run->appendChild( $node );
	}
	foreach ( array_reverse( iterator_to_array( $root->getElementsByTagName( '*' ) ) ) as $el ) {
		if ( ! in_array( strtolower( $el->nodeName ), array( 'p', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'strong', 'em', 'span', 'a', 'figcaption', 'blockquote' ), true ) ) {
			continue;
		}
		// Line breaks at the start or end of a paragraph do nothing.
		while ( $el->firstChild && ( ( XML_ELEMENT_NODE === $el->firstChild->nodeType && 'br' === $el->firstChild->nodeName ) || ( XML_TEXT_NODE === $el->firstChild->nodeType && '' === trim( str_replace( "\xc2\xa0", ' ', $el->firstChild->nodeValue ) ) ) ) ) {
			$el->removeChild( $el->firstChild );
		}
		while ( $el->lastChild && ( ( XML_ELEMENT_NODE === $el->lastChild->nodeType && 'br' === $el->lastChild->nodeName ) || ( XML_TEXT_NODE === $el->lastChild->nodeType && '' === trim( str_replace( "\xc2\xa0", ' ', $el->lastChild->nodeValue ) ) ) ) ) {
			$el->removeChild( $el->lastChild );
		}
		$empty = '' === trim( str_replace( "\xc2\xa0", ' ', $el->textContent ) ) && ! $el->getElementsByTagName( 'img' )->length && ! $el->getElementsByTagName( 'iframe' )->length;
		if ( $empty && $el->parentNode ) {
			$el->parentNode->removeChild( $el );
		}
	}
}

/** Headings in order, starting at level 2 under the page title: levels used are moved up, keeping their order. */
function ggds_switch_order_headings( DOMElement $root, DOMDocument $doc ): void {
	$xpath    = new DOMXPath( $doc );
	$headings = iterator_to_array( $xpath->query( './/h2|.//h3|.//h4|.//h5|.//h6', $root ) );
	$levels   = array_unique( array_map( static fn( $h ) => (int) substr( $h->nodeName, 1 ), $headings ) );
	sort( $levels );
	$map = array();
	foreach ( array_values( $levels ) as $i => $level ) {
		$map[ $level ] = min( 6, 2 + $i );
	}
	foreach ( $headings as $h ) {
		$to = $map[ (int) substr( $h->nodeName, 1 ) ];
		if ( 'h' . $to !== $h->nodeName ) {
			ggds_switch_rename( $h, 'h' . $to );
		}
	}
}
