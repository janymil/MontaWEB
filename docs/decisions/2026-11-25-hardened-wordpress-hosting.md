# Every WordPress site on washington runs on the hardened, immutable image
Date: 2026-11-25 · Status: decided

## Context
Four demos were taken over through the Local app's default `admin` / `admin` login: the
attacker installed a file-manager plugin from wp-admin and wrote webshells into the writable
code folders (report: `docs/reports/2026-11-25-clinica-webshell-incident.md`).

## Decision
All WordPress sites (demos now, client sites later) use `deploy/wordpress/` and
`scripts/wp-site-build.sh`:
- Code (core, plugins, themes, mu-plugins, wp-config) baked into the image, owned by root;
  only `uploads/` is writable and PHP never runs there.
- `DISALLOW_FILE_MODS` and `DISALLOW_FILE_EDIT`: no installs or edits from wp-admin.
- Caddy `wp_hardening` snippet: xmlrpc blocked, wp-login/wp-admin behind basic auth.
- No default logins: admin user `mw-<site>-adm`, random 24+ character password, rotated DB
  passwords and salts on every build; credentials only in root-only files on the server.
- Containers: read-only root fs, no-new-privileges, capabilities dropped, DB on an internal
  network, no Docker socket.
- Rebuilds take code only from a trusted copy (Local app), never from the live tree.

## Why
The attack needed only one of these to fail: a real password, basic auth, or a code folder
that www-data cannot write. Each layer alone would have stopped it. Static snapshots were
the alternative, but the demos need working booking forms and WooCommerce.

## Consequences / next steps
- Updating a plugin = update it in Local, rebuild the image (monthly at least, `--pull`).
- Plugins that write PHP or config at runtime will fail visibly; test in Local first.
- Client sites follow the same template; client admins get their own named user, never `admin`.
