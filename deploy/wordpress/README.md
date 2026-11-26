# Hardened WordPress hosting (demos and client sites)

Written after the 2026-11-25 incident (`docs/reports/2026-11-25-clinica-webshell-incident.md`):
four demos were taken over because they kept the `admin` / `admin` login from the Local app,
and an attacker used wp-admin to install a file-manager plugin and upload webshells.
Decision: `docs/decisions/2026-11-25-hardened-wordpress-hosting.md`.

## The rules (every WordPress site on washington)

1. **Code is in the image, not on a writable disk.** Core, plugins, themes, mu-plugins and
   `wp-config.php` are baked into `montaweb-wp-<site>:current` and owned by root. The web
   server user can only write to `wp-content/uploads`, where PHP is switched off (Apache) and
   blocked (Caddy).
2. **wp-admin cannot change code.** `DISALLOW_FILE_MODS` + `DISALLOW_FILE_EDIT`: no plugin or
   theme installs, updates or edits from the browser. To update: change the clean source, rebuild.
3. **Admin is behind two locks.** Caddy basic auth on `/wp-login.php` and `/wp-admin/*`
   (except `admin-ajax.php`), then the WordPress login. `xmlrpc.php` is 403 in Caddy, Apache and PHP.
4. **No default logins, ever.** Sites built in the Local app keep `admin` / `admin`. Before a
   site goes on the server: new admin user name (not `admin`), random password of 24+
   characters, real email. The build script rotates DB passwords and salts on every run.
5. **Container limits.** Read-only root file system, `no-new-privileges`, all Linux
   capabilities dropped except the four Apache needs, PID and memory limits, database on an
   internal Docker network with no internet access. No Docker socket, no host mounts except
   `uploads/` and `db_data/`.
6. **Clean sources only.** A rebuild takes code from the Local app copy (or another trusted
   copy), never from the live server tree. Media are copied by an allowlist of file types.

## Add a NEW site from the Local app (e.g. dentista)

1. **In Local** (right-click the site → Open site shell), export the database with the real URL.
   This writes a file and leaves the Local database unchanged:
   ```bash
   wp search-replace 'http://dentista.local' 'https://dentista.montaweb.pe' --all-tables --export=dentista.sql
   ```
2. **On Windows**, pack the code and the media from `Local Sites\dentista\app\public\wp-content`
   (leave out any folder that does not exist):
   ```powershell
   tar -czf dentista-code.tgz -C "$HOME\Local Sites\dentista\app\public\wp-content" plugins themes mu-plugins languages
   tar -czf dentista-uploads.tgz -C "$HOME\Local Sites\dentista\app\public\wp-content" uploads
   scp dentista.sql dentista-code.tgz dentista-uploads.tgz washington:/root/clean-src/
   ```
3. **On washington, as root** (pick a free port; the other demos' ports are in `/opt/montaweb-demos/*/.env`):
   ```bash
   cd /root/clean-src && mkdir -p dentista-uploads && tar -xzf dentista-uploads.tgz -C dentista-uploads
   TEMPLATE=/var/www/montaweb/deploy/wordpress bash /var/www/montaweb/scripts/wp-site-new.sh \
     dentista <port> /root/clean-src/dentista-code.tgz /root/clean-src/dentista.sql /root/clean-src/dentista-uploads/uploads
   ```
   It refuses to run if the folder or port exists or the dump still has `.local` URLs. It
   imports the database, builds the hardened image, replaces `admin` / `admin` with
   `mw-dentista-adm` and a random password, resets every other administrator, and exits
   with an error unless `wp-rotate-admin.sh --check` passes. Until then the site is on
   `127.0.0.1` only.
4. Caddy block, Cloudflare DNS and the three curl checks: the script prints them at the end.
   Each needs Jan's yes.

## Replace admin logins on existing sites

```bash
bash /var/www/montaweb/scripts/wp-rotate-admin.sh --all --check   # report only; exit 1 if any site is unsafe
bash /var/www/montaweb/scripts/wp-rotate-admin.sh <site>          # new password for mw-<site>-adm, delete "admin"
bash /var/www/montaweb/scripts/wp-rotate-admin.sh <site> --reset-other-admins
```

Passwords are generated inside WordPress and only appended to
`/root/montaweb-demo-credentials.txt`; the terminal never shows them. Every session is ended.

## Build or rebuild a site (on washington, as root)

```bash
# code tarball from the trusted copy: wp-content/{plugins,themes,mu-plugins,languages}
TEMPLATE=/var/www/montaweb/deploy/wordpress \
  /var/www/montaweb/scripts/wp-site-build.sh <site> <port> /root/clean-src/<site>-code.tgz [uploads-dir]
```

Then add the site to Caddy with `import wp_hardening` (snippet in `/etc/caddy/Caddyfile`), run
`caddy validate`, `systemctl reload caddy`, and check from the server:

```bash
curl -sk -o /dev/null -w "%{http_code}\n" --resolve <site>.montaweb.pe:443:127.0.0.1 https://<site>.montaweb.pe/              # 200
curl -sk -o /dev/null -w "%{http_code}\n" --resolve <site>.montaweb.pe:443:127.0.0.1 https://<site>.montaweb.pe/wp-login.php  # 401
curl -sk -o /dev/null -w "%{http_code}\n" --resolve <site>.montaweb.pe:443:127.0.0.1 https://<site>.montaweb.pe/xmlrpc.php    # 403
```

Credentials (basic auth, WordPress admin, DB) live only in `/root/montaweb-demo-credentials.txt`
and each site's `.env` (both mode 600).

## Updating WordPress or a plugin

Update it in the Local app copy, test there, export the code tarball, rerun the build script.
`docker compose build --pull` also picks up the newest official `wordpress:php8.2-apache`
image (security fixes for PHP/Apache). Do this at least monthly.
