<?php
/**
 * The posts or results of the current query, as a list: title link, type and date, and summary.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;
?>
<ol class="ggds-measure ggds-wp-list">
<?php
while ( have_posts() ) :
	the_post();
	?>
	<li>
		<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
		<p><?php echo esc_html( get_the_excerpt() ); ?></p>
		<?php if ( 'post' === get_post_type() ) : ?>
			<p class="ggds-hint">Published <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date( 'j F Y' ) ); ?></time></p>
		<?php endif; ?>
	</li>
	<?php
endwhile;
?>
</ol>
