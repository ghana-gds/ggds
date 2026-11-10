<?php
/**
 * The search form on the search page.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;
?>
<form action="<?php echo esc_url( home_url( '/' ) ); ?>" method="get" role="search">
	<div class="ggds-field">
		<label class="ggds-label" for="search-q">Search this website</label>
		<input class="ggds-input ggds-input--width-long" id="search-q" name="s" type="search" value="<?php echo esc_attr( get_search_query() ); ?>" enterkeyhint="search">
	</div>
	<button class="ggds-button" type="submit">Search</button>
</form>
