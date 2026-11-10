<?php
/**
 * "Last updated", when a page or post has changed since it was published.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;
if ( get_the_modified_date( 'Y-m-d' ) !== get_the_date( 'Y-m-d' ) ) :
	?>
	<p class="ggds-hint">Last updated <time datetime="<?php echo esc_attr( get_the_modified_date( 'c' ) ); ?>"><?php echo esc_html( get_the_modified_date( 'j F Y' ) ); ?></time></p>
	<?php
endif;
