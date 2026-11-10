<?php
/**
 * Lists of posts: news, a category, an archive.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;
get_header();
?>
<div class="ggds-main ggds-container">
<?php echo ggds_breadcrumbs(); // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts ?>
<h1><?php echo esc_html( ggds_page_title() ); ?></h1>
<?php
if ( have_posts() ) :
	get_template_part( 'parts/list' );
	echo ggds_pagination(); // phpcs:ignore WordPress.Security.EscapeOutput
else :
	?>
	<p>There is nothing here yet.</p>
	<?php
endif;
?>
</div>
<?php
get_footer();
