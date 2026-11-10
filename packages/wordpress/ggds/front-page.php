<?php
/**
 * The homepage: the hero (purpose, question, search, common tasks), the main sections as cards, then the
 * homepage's own content if a static page is set.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;
get_header();
echo ggds_hero(); // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts
?>
<div class="ggds-main ggds-container">
<?php
$ggds_sections = ggds_menu( 'primary' );
if ( $ggds_sections ) :
	?>
	<h2>Main sections</h2>
	<ul class="ggds-card-grid">
	<?php foreach ( $ggds_sections as $ggds_section ) : ?>
		<li class="ggds-card"><h3 class="ggds-card__title"><a class="ggds-card__link" href="<?php echo esc_url( $ggds_section['href'] ); ?>"><?php echo esc_html( $ggds_section['label'] ); ?></a></h3><?php if ( $ggds_section['description'] ) : ?><p class="ggds-card__body"><?php echo esc_html( $ggds_section['description'] ); ?></p><?php endif; ?></li>
	<?php endforeach; ?>
	</ul>
	<?php
endif;
if ( 'page' === get_option( 'show_on_front' ) ) :
	while ( have_posts() ) :
		the_post();
		if ( '' !== trim( (string) get_the_content() ) ) :
			?>
			<div class="ggds-prose"><?php the_content(); ?></div>
			<?php
		endif;
	endwhile;
endif;
?>
</div>
<?php
get_footer();
