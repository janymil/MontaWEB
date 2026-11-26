<?php
/**
 * Runs INSIDE a hardened WordPress container, fed on stdin by scripts/wp-rotate-admin.sh:
 *   docker exec -i -e MW_MODE=rotate -e MW_LOGIN=mw-<site>-adm ... <site>-wp php < this file
 *
 * Uses WordPress's own user API (no wp-cli in the image). Prints only "MWRES <key> <value>"
 * lines that the shell script parses; passwords are generated here and never passed in.
 *
 * MW_MODE=check   report weak administrator logins, change nothing
 * MW_MODE=rotate  ensure MW_LOGIN is an administrator with a new random password,
 *                 delete the user "admin" (content goes to MW_LOGIN), optionally reset
 *                 every other administrator (MW_RESET_OTHERS=1), end every session.
 */

$mode   = getenv('MW_MODE') ?: 'check';
$login  = getenv('MW_LOGIN') ?: '';
$email  = getenv('MW_EMAIL') ?: 'admin@montaweb.pe';
$others = getenv('MW_RESET_OTHERS') === '1';

$_SERVER['HTTP_HOST']   = getenv('MW_HOST') ?: 'localhost';
$_SERVER['REQUEST_URI'] = '/';
define('WP_USE_THEMES', false);

ob_start();                                   // plugins may print on load; keep it out of our output
require '/var/www/html/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/user.php';
ob_end_clean();

function mw_out($k, $v) { echo 'MWRES ' . $k . ' ' . str_replace(["\n", "\r"], ' ', (string) $v) . "\n"; }

/** Administrators whose password is a well-known default or equals their login. */
function mw_weak_admins() {
    $weak = [];
    foreach (get_users(['role' => 'administrator']) as $u) {
        $guesses = ['admin', 'password', 'Password', '123456', '12345678', 'admin123', 'demo', 'root', 'wordpress', $u->user_login];
        foreach ($guesses as $g) {
            if (wp_check_password($g, $u->user_pass, $u->ID)) { $weak[] = $u->user_login; break; }
        }
    }
    return $weak;
}

if ($mode === 'check') {
    mw_out('admin_user_exists', username_exists('admin') ? 'yes' : 'no');
    foreach (get_users(['role' => 'administrator']) as $u) mw_out('administrator', $u->user_login);
    foreach (mw_weak_admins() as $w) mw_out('weak_admin', $w);
    mw_out('done', 'check');
    exit(0);
}

if ($mode !== 'rotate' || !preg_match('/^[a-z0-9][a-z0-9_.-]{3,59}$/', $login) || $login === 'admin') {
    mw_out('error', 'bad mode or login');
    exit(2);
}

$pass = wp_generate_password(28, false);      // letters + digits, ~165 bits
$user = get_user_by('login', $login);

if ($user) {
    wp_set_password($pass, $user->ID);
    $user = new WP_User($user->ID);
    if (!in_array('administrator', $user->roles, true)) $user->set_role('administrator');
    $uid = $user->ID;
} else {
    // The email may still belong to the old "admin" user; use a placeholder until it is gone.
    $taken = email_exists($email);
    $uid = wp_insert_user([
        'user_login' => $login,
        'user_pass'  => $pass,
        'user_email' => $taken ? $login . '@placeholder.invalid' : $email,
        'role'       => 'administrator',
    ]);
    if (is_wp_error($uid)) { mw_out('error', 'create user: ' . $uid->get_error_message()); exit(3); }
}
mw_out('login', $login);
mw_out('password', $pass);

$old = get_user_by('login', 'admin');
if ($old && (int) $old->ID !== (int) $uid) {
    if (!wp_delete_user($old->ID, $uid)) { mw_out('error', 'could not delete user admin'); exit(4); }
    mw_out('deleted', 'admin');
}

$cur = get_userdata($uid);
if (substr($cur->user_email, -strlen('@placeholder.invalid')) === '@placeholder.invalid') {
    if (email_exists($email)) mw_out('warning', "email $email belongs to another user; $login keeps a placeholder email");
    else wp_update_user(['ID' => $uid, 'user_email' => $email]);
}

foreach (get_users(['role' => 'administrator']) as $u) {
    if ((int) $u->ID === (int) $uid) continue;
    if ($others) {
        $p = wp_generate_password(28, false);
        wp_set_password($p, $u->ID);
        mw_out('other_admin', $u->user_login . ' ' . $p);
    } else {
        mw_out('kept_admin', $u->user_login);
    }
}

foreach (get_users(['fields' => 'ID']) as $id) WP_Session_Tokens::get_instance((int) $id)->destroy_all();
mw_out('sessions', 'ended');

// Verify from the database, not from what we think we did.
clean_user_cache($uid);
$fresh = get_user_by('login', $login);
mw_out('verify_new_login', ($fresh && wp_check_password($pass, $fresh->user_pass, $fresh->ID)) ? 'ok' : 'FAIL');
mw_out('verify_admin_gone', username_exists('admin') ? 'FAIL' : 'ok');
foreach (mw_weak_admins() as $w) mw_out('weak_admin', $w);
mw_out('done', 'rotate');
