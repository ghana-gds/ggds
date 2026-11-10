<?php
/**
 * The top of every page: skip link, banner and header. <main> opens here and closes in footer.php.
 *
 * @package GGDS
 */

defined( 'ABSPATH' ) || exit;
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="ggds-skip-link" href="#main">Skip to main content</a>
<?php
echo ggds_banner(); // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts
echo ggds_header(); // phpcs:ignore WordPress.Security.EscapeOutput
?>
<main id="main" tabindex="-1">
