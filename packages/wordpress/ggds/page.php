<?php
/**
 * A page: breadcrumbs, its title and its content.
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
	?>
	<h1><?php the_title(); ?></h1>
	<?php if ( has_excerpt() ) : ?>
		<p class="ggds-lead ggds-measure"><?php echo esc_html( get_the_excerpt() ); ?></p>
	<?php endif; ?>
	<div class="ggds-prose"><?php the_content(); ?></div>
	<?php
	$ggds_children = get_pages( array( 'parent' => get_the_ID(), 'sort_column' => 'menu_order,post_title' ) );
	if ( $ggds_children ) :
		?>
		<ul class="ggds-card-grid">
		<?php foreach ( $ggds_children as $ggds_child ) : ?>
			<li class="ggds-card"><h2 class="ggds-card__title"><a class="ggds-card__link" href="<?php echo esc_url( get_permalink( $ggds_child ) ); ?>"><?php echo esc_html( get_the_title( $ggds_child ) ); ?></a></h2><?php if ( has_excerpt( $ggds_child ) ) : ?><p class="ggds-card__body"><?php echo esc_html( get_the_excerpt( $ggds_child ) ); ?></p><?php endif; ?></li>
		<?php endforeach; ?>
		</ul>
		<?php
	endif;
	get_template_part( 'parts/updated' );
endwhile;
?>
</div>
<?php
get_footer();
