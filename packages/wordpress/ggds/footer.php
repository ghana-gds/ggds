<?php
/**
 * The bottom of every page: closes <main>, then the footer and the tab bar.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;
?>
</main>
<?php
echo ggds_footer(); // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts
echo ggds_tab_bar(); // phpcs:ignore WordPress.Security.EscapeOutput
wp_footer();
?>
</body>
</html>
