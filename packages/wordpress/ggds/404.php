<?php
/**
 * Page not found: plain words, what to do next, and search.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;
get_header();
?>
<div class="ggds-main ggds-container">
<h1>Page not found</h1>
<div class="ggds-measure">
	<p>If you typed the web address, check it is correct.</p>
	<p>If you pasted the web address, check you copied the entire address.</p>
	<p>The page may have moved. Search for it, or go to the <a href="<?php echo esc_url( home_url( '/' ) ); ?>">homepage</a>.</p>
</div>
<?php get_search_form(); ?>
</div>
<?php
get_footer();
