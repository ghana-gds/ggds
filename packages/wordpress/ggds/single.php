<?php
/**
 * A post, such as news or a notice: breadcrumbs, title, its type and date, and its content.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;
get_header();
?>
<div class="ggds-main ggds-container">
<?php
echo ggds_breadcrumbs(); // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts
while ( have_posts() ) :
	the_post();
	$ggds_category = get_the_category();
	?>
	<article>
		<h1><?php the_title(); ?></h1>
		<p class="ggds-measure">
			<?php if ( $ggds_category ) : ?>
				<strong class="ggds-tag ggds-tag--info"><?php echo esc_html( $ggds_category[0]->name ); ?></strong>
			<?php endif; ?>
			Published <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date( 'j F Y' ) ); ?></time>
		</p>
		<?php if ( has_excerpt() ) : ?>
			<p class="ggds-lead ggds-measure"><?php echo esc_html( get_the_excerpt() ); ?></p>
		<?php endif; ?>
		<div class="ggds-prose"><?php the_content(); ?></div>
		<?php get_template_part( 'parts/updated' ); ?>
	</article>
	<?php
endwhile;
?>
</div>
<?php
get_footer();
