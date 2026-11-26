# Incident: webshells on four WordPress demos (clinica, barberia, abogados, inmobiliaria)

Date found: 2026-11-25 (Lima evening) · Contained: 2026-11-26 01:13 UTC · Status: resolved, follow-ups below

## Summary
Four of the six WordPress demos on washington were taken over by an Indonesian group
("Lei - Nullsec PH" webshell). Cause: every demo was built in the Local app and kept its
default login **`admin` / `admin`**. The attacker simply logged in to wp-admin, installed the
plugin *WP File Manager* from the official directory and used it to upload webshells into
every folder. No server, Docker or other app was reached. No real customer data existed.
clinica.montaweb.pe showed the attacker's page instead of the homepage for about 25 hours.

## Timeline (UTC)
| When | What |
|---|---|
| 11-24 00:24 | First probes of clinica (xmlrpc, wp-login) |
| 11-24 22:14 | Attacker logs in to clinica with admin/admin on the first try, uploads a decoy "plugin" |
| 11-24 22:25 | Installs and activates wp-file-manager 8.0.7, creates shell folders, uploads loaders |
| 11-24 23:39 | Shell placed in clinica mu-plugins: homepage replaced for all visitors (347 requests from 193 IPs, incl. 16 from Googlebot, got the shell page) |
| 11-25 ~16:00 | A separate botnet starts validating admin:admin on the demos |
| 11-25 22:03–22:48 | Same attack on abogados, inmobiliaria, barberia; shells used until 00:53 on 11-26 |
| 11-26 01:08 | Shell still active in clinica (mu-plugins rewritten 01:08:00) |
| 11-26 01:08–01:10 | Evidence copied; clinica, barberia, abogados, inmobiliaria containers stopped; subdomains 302 to /ejemplos |
| 11-26 01:12 | veterinaria (also admin/admin, not yet attacked) and restaurante get new admin passwords; Caddy basic auth on their wp-admin |
| 11-26 01:30–01:45 | All six demos rebuilt from clean sources on a hardened image, all secrets rotated, sites back online |

Attacker sources: Indonesian IPv6 (2402:5680:*, 2001:448a:*), Google Cloud 34.72.130.138,
34.61.186.21, 34.133.121.71, 35.190.180.241, 136.87.1.238. The shells are loaders that fetch
code on each request from gitlab.com (`kenaterusakju/logosaja`, `workrepo645-ctrl/logosaja`)
and snippet.host, so their exact commands cannot be known from local files.

## Damage
- **clinica homepage defaced** for ~25 h (visitors and Google saw the shell page). Other three homepages were unchanged.
- **Database**: no new users, roles, options, posts, triggers or MySQL users; siteurl/home intact. (Full option scan finished for clinica; the other three were checked for users/options/posts.)
- **Personal data**: none real. Demo seed content only (no customers, bookings or orders).
- **Server**: no sign of escape. Containers were unprivileged, had no Docker socket, and the host shows no new users, SSH keys, cron jobs, services, binaries, listeners or containers. The attacker could read each container's DB password (now rotated) and could make outbound connections from the container while the shells were live.
- **Main site montaweb.pe**: not touched (checkout matches git, PHP only runs for `/api/*.php`).

## What was changed
1. Four infected containers stopped and replaced; infected trees moved to `/root/incident-20261126T010856Z/` (mode 000) with logs, `docker inspect` and tarballs. Off-server copy: `C:\Users\USER\Documents\MontaWeb-incident-evidence-2026-11-25\`.
2. All six demos rebuilt with `scripts/wp-site-build.sh` + `deploy/wordpress/` (hardened, immutable image). Code came from the Local app copies (verified identical to the server apart from the malware); restaurante, which has no Local copy, from its own clean server code.
3. Rotated on all six: WordPress admin (new user name `mw-<site>-adm`, random password, all sessions ended), DB app and root passwords, WordPress salts. Stored only in `/root/montaweb-demo-credentials.txt` and each `.env` (mode 600).
4. Caddy: shared `wp_hardening` snippet on all six demos (xmlrpc 403, PHP in uploads 403, wp-login/wp-admin behind basic auth). Main site: repo internals (`/deploy`, `/.devkit`, `/.claude`, `/test`, `/graft`, `verify.sh`, `test.php`) now 404; `/deploy/Caddyfile` and `/.devkit/*` were public before.
5. Caddyfile backups: `/etc/caddy/Caddyfile.bak-incident-*`, `.bak-internal-*`, `.bak-reopen-*`.

## What Jan still has to do
- **Google Search Console** for clinica.montaweb.pe: request reindexing of `/` (Googlebot saw the shell page).
- **Local app**: change the admin password of every site in "Local Sites" (still admin/admin there), and never export a site with it.
- Read the new logins from the server when you need wp-admin: `ssh washington "cat /root/montaweb-demo-credentials.txt"` (first the basic-auth user `demoadmin`, then the site login). The admin email is set to admin@montaweb.pe; change it if that mailbox does not exist.
- Optional (Cloudflare, Jan's account): a WAF rule that blocks `/xmlrpc.php` and challenges `/wp-login.php` on `*.montaweb.pe`, so the botnet traffic stops at the edge.
- After 30 days, delete the evidence folder on the server if nothing else comes up.

Full log analysis: shared session notes `damage-analysis.md` (not in the repo).
