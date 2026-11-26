<?php
/**
 * Plugin Name: MontaWeb hardening
 * Description: Baked into the image. Turns off XML-RPC and stops user-name discovery.
 */

defined('ABSPATH') || exit;

add_filter('xmlrpc_enabled', '__return_false');
add_filter('xmlrpc_methods', '__return_empty_array');

// No user list over the REST API for visitors who are not logged in.
add_filter('rest_endpoints', function ($endpoints) {
    if (is_user_logged_in()) {
        return $endpoints;
    }
    unset($endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    return $endpoints;
});

// ?author=1 would otherwise redirect to /author/<login>/.
add_action('template_redirect', function () {
    if (!is_user_logged_in() && (isset($_GET['author']) || is_author())) {
        wp_safe_redirect(home_url('/'), 301);
        exit;
    }
});

// Do not reveal whether a user name exists on a failed login.
add_filter('login_errors', function () {
    return 'Datos de acceso incorrectos.';
});

remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');
