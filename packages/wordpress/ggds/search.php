<?php
/**
 * Search: the form, how many results, the results, and help when there are none.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;
get_header();
global $wp_query;
$ggds_query = get_search_query();
?>
<div class="ggds-main ggds-container">
<h1>Search</h1>
<?php get_search_form(); ?>
<?php if ( '' !== $ggds_query ) : ?>
	<?php if ( have_posts() ) : ?>
		<p><strong><?php echo esc_html( sprintf( _n( '%s result', '%s results', (int) $wp_query->found_posts, 'ggds' ), number_format_i18n( (int) $wp_query->found_posts ) ) ); ?></strong> for <strong><?php echo esc_html( $ggds_query ); ?></strong></p>
		<?php
		get_template_part( 'parts/list' );
		echo ggds_pagination( 'Pages of results' ); // phpcs:ignore WordPress.Security.EscapeOutput
	else :
		?>
		<p>There are no results for <strong><?php echo esc_html( $ggds_query ); ?></strong>.</p>
		<h2>Try:</h2>
		<ul>
			<li>checking the spelling;</li>
			<li>fewer words, or other words that mean the same thing;</li>
			<li>the main sections in the menu at the top of the page.</li>
		</ul>
	<?php endif; ?>
<?php endif; ?>
</div>
<?php
get_footer();
