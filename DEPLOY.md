# Deploying MontaWeb on a Linux VPS with Caddy

Static HTML/CSS/JS + **one PHP endpoint** (`/api/enviar-brief.php`) that receives the `/brief` form.
Caddy serves the files **and** proxies `.php` to PHP-FPM; TLS is automatic.

> ⚠️ **Caddy does not read `.htaccess`.** The project still ships `.htaccess` files (harmless, they are
> blocked from download), but the real work — clean URLs `/brief`, blocking `api/config.php` and
> `api/leads/`, security headers — is done by `deploy/Caddyfile`.

---

## 1. What the server must have

| Requirement | Why | Check |
|---|---|---|
| Linux VPS (Ubuntu 22.04/24.04, Debian 12) | Target OS | `lsb_release -a` |
| **Caddy ≥ 2.7** | HTTPS + static + FastCGI proxy | `caddy version` |
| **PHP ≥ 8.1 FPM** (`php8.3-fpm`) | runs `api/enviar-brief.php` | `php -v`, `ls /run/php/` |
| PHP extensions: `mbstring`, `openssl`, `curl`, `xml` | UTF-8 text, TLS to Zoho, composer deps | `php -m` |
| **Composer** | installs PHPMailer (SMTP sending) | `composer --version` |
| PHPMailer in `api/vendor/` | SMTP auth; without it the script falls back to `mail()` | `ls api/vendor/autoload.php` |
| Outbound **465/tcp** (or 587) open | connect to `smtp.zoho.com` | `nc -vz smtp.zoho.com 465` |
| Inbound **80 + 443** open | ACME challenge + site | `sudo ufw status` |
| DNS A/AAAA for `montaweb.pe` and `www` | certificate issuance | `dig +short montaweb.pe` |
| ~200 MB disk, 512 MB RAM | trivial static site | — |

Optional but recommended: `postfix` **only if** you want the `mail()` fallback (a bare VPS has no MTA).

---

## 2. DNS + ports

```
montaweb.pe        A      <VPS_IP>
www.montaweb.pe    A      <VPS_IP>
montaweb.pe        AAAA   <VPS_IPv6>   (optional)
```

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80,443/tcp
sudo ufw enable
```

Caddy obtains and renews the certificate by itself as soon as DNS points to the VPS and 80/443 are reachable.

---

## 3. Install the stack (Ubuntu/Debian)

```bash
sudo apt update && sudo apt install -y curl debian-keyring debian-archive-keyring apt-transport-https

# Official Caddy repository (newer than the distro package)
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list

sudo apt update && sudo apt install -y caddy

# PHP-FPM + extensions + composer
sudo apt install -y php8.3-fpm php8.3-cli php8.3-mbstring php8.3-curl php8.3-xml composer unzip
ls /run/php/          # → php8.3-fpm.sock  (use this name in the Caddyfile)
```

On Ubuntu 22.04 the default is PHP 8.1 (`php8.1-fpm.sock`) — either adjust the socket name in the
Caddyfile or install 8.3 from the `ondrej/php` PPA.

### The classic Caddy + PHP-FPM gotcha

Caddy runs as user `caddy`, PHP-FPM as `www-data`, and the socket is `www-data:www-data 0660`.
Without this, every PHP request returns **502**:

```bash
sudo usermod -aG www-data caddy
sudo systemctl restart caddy
```

---

## 4. Directory layout

```
/var/www/montaweb/
├── montaweb-mail-config.php     ← OPTION A: secrets outside the site (recommended)
└── public_html/                 ← document root (everything here is public)
    ├── index.html  brief.html  contacto.html  …
    ├── css/  js/  images/  downloads/
    └── api/
        ├── enviar-brief.php     ← code, no password
        ├── config.php           ← OPTION B: secrets here (already created, gitignored)
        ├── config.example.php
        ├── .htaccess            ← ignored by Caddy, harmless
        ├── leads/               ← JSON copies of each brief (must be writable by www-data)
        └── vendor/              ← PHPMailer (composer)
```

`enviar-brief.php` looks for the config in this order:

1. `api/config.php`
2. `/var/www/montaweb/montaweb-mail-config.php` (one level **above** `public_html`)
3. `public_html/montaweb-mail-config.php`

So you can keep `api/config.php` (already prepared) or move the same array above the web root.

---

## 5. Upload the site

**Option A — git (clean updates):**

```bash
sudo mkdir -p /var/www/montaweb
sudo chown $USER:www-data /var/www/montaweb
git clone https://github.com/janymil/TuWebAtractiva.git /var/www/montaweb/public_html
```

> Commit and push your local changes first (`brief.html`, `css/brief.css`, `js/brief.js`, `api/`).
> `api/config.php` is in `.gitignore`, so it will **not** be cloned — create it on the server (§6).

**Option B — rsync from your machine** (WSL / Git Bash on Windows):

```bash
rsync -avz --progress \
  --exclude '.git' --exclude 'api/vendor' --exclude 'api/leads' \
  ./ user@YOUR_VPS_IP:/var/www/montaweb/public_html/
```

Then on the server:

```bash
mkdir -p /var/www/montaweb/public_html/api/leads
```

---

## 6. The secrets file (2 minutes)

`api/config.php` is already written with the right structure — **you only change the password**:

```bash
sudo nano /var/www/montaweb/public_html/api/config.php
```

```php
'pass' => 'PON_AQUI_TU_CONTRASENA_DE_APLICACION',   // ← replace this
```

Save (`Ctrl+O`, `Enter`, `Ctrl+X`) and lock it down:

```bash
sudo chown www-data:www-data /var/www/montaweb/public_html/api/config.php
sudo chmod 640 /var/www/montaweb/public_html/api/config.php
```

That is the *only* value the code needs. It must be a **Zoho App Password**
(Zoho → Settings → Security → App Passwords), not your login password.
Never put it in `brief.html`, `js/`, a README or a git commit.

Prefer the file **outside** the website (slightly safer)? Move it and the endpoint still finds it:

```bash
sudo mv /var/www/montaweb/public_html/api/config.php /var/www/montaweb/montaweb-mail-config.php
sudo chown www-data:www-data /var/www/montaweb/montaweb-mail-config.php
sudo chmod 640 /var/www/montaweb/montaweb-mail-config.php
```

| Setting | Zoho Mail | Notes |
|---|---|---|
| `host` | `smtp.zoho.com` | use your provider's SMTP if not Zoho |
| `port` | `465` | `587` with `'secure' => 'tls'` |
| `user` | `hola@montaweb.pe` | full address |
| `pass` | app password | revocable independently |
| `from` | `hola@montaweb.pe` | must match the authenticated mailbox |

Want `mail()` instead of SMTP? Set `'host' => ''` and install a local MTA
(`sudo apt install postfix`). On a bare VPS without MTA, `mail()` fails and the form shows the
WhatsApp fallback — the brief is still saved in `api/leads/`.

---

## 7. Install PHPMailer (needed for SMTP)

```bash
cd /var/www/montaweb/public_html/api
composer require phpmailer/phpmailer --no-dev --optimize-autoloader
sudo chown -R www-data:www-data vendor
```

Without `api/vendor/autoload.php` the endpoint silently falls back to `mail()`.

---

## 8. Permissions (after every clone/rsync)

```bash
sudo chown -R www-data:www-data /var/www/montaweb/public_html
sudo find /var/www/montaweb/public_html -type d -exec chmod 755 {} \;
sudo find /var/www/montaweb/public_html -type f -exec chmod 644 {} \;
sudo chmod 750 /var/www/montaweb/public_html/api/leads
sudo chmod 640 /var/www/montaweb/public_html/api/config.php   # if it lives inside public_html
```

Caddy only needs world-readable files; PHP needs write access to `api/leads/` only.


---

## 9. Caddy configuration

The ready file is `deploy/Caddyfile`. Copy it and adjust domain / path / PHP socket:

```bash
sudo cp /var/www/montaweb/public_html/deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile        # domain, root, php socket, email
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager
```

### What each block does (and why it is here, not in `.htaccess`)

| Block | Replaces | Effect |
|---|---|---|
| `@private … respond 404` | `api/.htaccess` | `api/config.php`, `api/leads/*`, `*.log` unreachable |
| `@docs path *.md` | new | `README.md`, `DEPLOY.md`, `BRIEF_SETUP.md` unreachable |
| `@dotfiles` | partial `.htaccess` | `.git`, `.env`, `.htaccess` unreachable |
| `@htmlFile … redir 301` | root `.htaccess` | `/brief.html` → `/brief` (SEO consistency) |
| `@cleanUrl … rewrite` | root `.htaccess` | `/brief` → serves `brief.html` |
| `php_fastcgi` | `test.php` support | only `*.php` goes to PHP-FPM |
| `file_server` | Apache static | serves HTML/CSS/JS/images |
| `header` | `.htaccess` headers | nosniff, frame options, referrer, HSTS |
| `encode zstd gzip` | `mod_deflate` | compression |

⚠️ If you skip the `@private`/`@docs` blocks, **`https://montaweb.pe/api/config.php` would be served as
plain text** — PHP only executes `.php`, but a request to `config.php` *is* executed and returns nothing;
still, blocking the path is the correct, explicit protection, and it also protects the JSON leads.

⚠️ **Never run this Caddyfile without the `php_fastcgi` line.** Without it Caddy has no PHP handler and
serves `.php` files as plain text (source code visible). Check with
`curl -s https://montaweb.pe/api/enviar-brief.php | head -3` → it must return JSON, never `<?php`.

✅ Verified with **Caddy 2.11.7** (`caddy validate` + local run): `/brief` 200, `/brief.html` → 301 `/brief`,
`/api/config.php`, `/api/leads/`, `*.md`, `.env`, `.htaccess` → 404, unknown URL → custom `404.html`.
`GET /404.html` answers `301 → /404` (same rule as every `.html` file) — that is expected.

### Minimal Caddyfile (if you don't want the extra blocks)

```caddyfile
montaweb.pe, www.montaweb.pe {
	root * /var/www/montaweb/public_html
	encode zstd gzip
	@cleanUrl {
		not path /api/* /downloads/*
		not file {path}
		file {path}.html
	}
	rewrite @cleanUrl {path}.html
	php_fastcgi unix//run/php/php8.3-fpm.sock
	file_server
}
```

---

## 10. Go-live checklist

```bash
# 1. Static page + clean URL
curl -I https://montaweb.pe/brief             # 200, text/html
curl -I https://montaweb.pe/brief.html        # 301 → /brief

# 2. Secrets and internal docs must be blocked
curl -s -o /dev/null -w '%{http_code}\n' https://montaweb.pe/api/config.php      # 404
curl -s -o /dev/null -w '%{http_code}\n' https://montaweb.pe/api/leads/          # 404
curl -s -o /dev/null -w '%{http_code}\n' https://montaweb.pe/DEPLOY.md           # 404

# 3. PHP runs and validates
curl -s -X POST https://montaweb.pe/api/enviar-brief.php \
  -H 'Content-Type: application/json' -d '{}' | head -c 200
# → {"ok":false,"error":"Faltan datos obligatorios: …"}

# 4. End-to-end: real email (see note about _ts)
TS=$(( $(date +%s) - 60 ))
curl -s -X POST https://montaweb.pe/api/enviar-brief.php \
  -H 'Content-Type: application/json' \
  -d "{\"_ts\":\"$TS\",\"nombre_contacto\":\"Prueba VPS\",\"email\":\"tu-correo@gmail.com\",\"whatsapp\":\"999888777\",\"negocio\":\"Prueba\",\"rubro\":\"Otro rubro\",\"ciudad\":\"Lima\",\"acepto\":\"on\",\"plan\":\"Web Simple Profesional (S/ 99)\"}"
# → {"ok":true,"id":"2026…","via":"smtp"}
```

Then open `/brief` in a browser, complete it and confirm the email arrives at `hola@montaweb.pe`
with `Reply-To` = the client's address.

`_ts` must be at least 4 seconds in the past (anti-bot). The browser does this automatically.

### Automatic lead retention

Install the daily cleanup job once on the VPS:

```bash
sudo install -o root -g root -m 0644 deploy/montaweb-lead-retention.cron /etc/cron.d/montaweb-lead-retention
```

The job removes uncontracted brief files 12 months after submission and stale rate-limit files after one day. When a project is contracted, mark its JSON record with `"contratado": true`; after project closure, set `"fecha_cierre"` to an ISO date so the brief is removed 12 months later. Old records without a contract status are deliberately retained for review. The job does not remove email copies from Zoho or server access logs; apply the same 12-month rule to briefs in Zoho and set a separate retention policy for server access logs.

---

## 11. Mail deliverability (do this once)

In the `montaweb.pe` DNS zone (Zoho shows the exact values):

| Record | Example |
|---|---|
| SPF (TXT) | `v=spf1 include:zoho.com ~all` |
| DKIM | `TXT` selector from Zoho (e.g. `zoho._domainkey`) |
| DMARC | `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:hola@montaweb.pe` |

Without DKIM/SPF, Gmail very often files the brief as spam. Many VPS providers also block **port 25**
outbound — that is why we use SMTP submission on **465**, not SMTP relay on 25.


---

## 12. Logs & troubleshooting

```bash
sudo journalctl -u caddy -f                 # requests, TLS, errors
sudo journalctl -u php8.3-fpm -f            # PHP errors (error_log from the endpoint)
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl status caddy php8.3-fpm --no-pager
ls -la /var/www/montaweb/public_html/api/leads
```

| Symptom | Likely cause | Fix |
|---|---|---|
| **502** on `/api/…` | socket path wrong, FPM down, or `caddy` not in `www-data` group | `ls /run/php/`, `usermod -aG www-data caddy`, `systemctl restart caddy` |
| **404** on `/brief` | `@cleanUrl` block missing, or `brief.html` not uploaded | check Caddyfile + `ls public_html/brief.html` |
| `/brief.html` returns 200 instead of 301 | `@htmlFile` redir missing | add the `path_regexp` + `redir` block |
| `{"ok":false,"error":"No pudimos enviar…"}` (HTTP 502) | SMTP auth failed, PHPMailer missing, port blocked | §6/§7, then `nc -vz smtp.zoho.com 465` |
| Lead JSON not created | `api/leads` not writable | `chown www-data:www-data api/leads && chmod 750 api/leads` |
| Email lands in spam | SPF/DKIM/DMARC missing, or `from` ≠ authenticated mailbox | §11, and keep `from` = `user` |
| `Class "PHPMailer\PHPMailer\PHPMailer" not found` | composer not run / `vendor` unreadable | `composer require phpmailer/phpmailer`, `chown -R www-data:www-data vendor` |
| Certificate not issued | DNS not pointing to the VPS, or 80/443 closed | `dig +short montaweb.pe`, `ufw status` |
| 403 when saving the form | `api/leads` owned by root / `config.php` unreadable by www-data | §8 |

The endpoint always stores the lead **before** trying to send mail, so a mail failure never loses a client.

---

## 13. Updating the site

```bash
# Git workflow
sudo -u www-data git -C /var/www/montaweb/public_html pull
# (if git complains about dubious ownership: git config --global --add safe.directory /var/www/montaweb/public_html)
sudo chown -R www-data:www-data /var/www/montaweb/public_html

# or rsync again (keep api/config.php and api/leads untouched)
rsync -avz --exclude '.git' --exclude 'api/vendor' --exclude 'api/leads' --exclude 'api/config.php' \
  ./ user@YOUR_VPS_IP:/var/www/montaweb/public_html/

sudo systemctl reload caddy     # only needed if the Caddyfile changed
```

PHP changes take effect immediately (no restart; opcache revalidates by default).
Rollback: `sudo -u www-data git -C … checkout <previous-commit>`.

**Back up** `api/leads/`, `api/config.php` (or `montaweb-mail-config.php`) and `/etc/caddy/Caddyfile`.

---

## 14. Local development (no Caddy needed)

```bash
python serve.py                 # static site + clean URLs, no PHP  → UI, autosave, review
php -S 127.0.0.1:8000           # with PHP → /api/enviar-brief.php works
```

With `php -S` open `http://127.0.0.1:8000/brief.html` directly (the built-in server has no clean-URL rewriting).
`api/config.php` works locally too — the same file you edit on the server.

---

## 15. Optional hardening

```bash
sudo apt install -y unattended-upgrades fail2ban
sudo ufw default deny incoming && sudo ufw default allow outgoing
sudo ufw allow 22/tcp && sudo ufw allow 80,443/tcp
```

- SSH keys only (`PasswordAuthentication no` in `/etc/ssh/sshd_config`).
- Keep `api/config.php` at `640`, never `644`.
- Rotate the Zoho app password every few months.
- The repository previously contained a plaintext SMTP password (`EMAIL_SYSTEM_README.md`, commit
  `16d466f`) — **rotate that mailbox password if you haven't already**; it is still in git history.

