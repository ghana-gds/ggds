<!doctype html><html><head><?php wp_head(); ?></head><body style="background:#eee">
<?php wp_nav_menu( array( 'theme_location' => 'main-menu' ) ); ?>
<?php while ( have_posts() ) : the_post(); ?><div style="color:#999"><h1><?php the_title(); ?></h1><?php the_content(); ?></div><?php endwhile; ?>
<?php wp_footer(); ?></body></html>
