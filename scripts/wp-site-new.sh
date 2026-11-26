#!/usr/bin/env bash
# First-time setup of a NEW hardened WordPress site on washington. Runs ON THE SERVER as root.
# Rebuilds of an existing site use scripts/wp-site-build.sh instead. See deploy/wordpress/README.md.
#
#   wp-site-new.sh <site> <port> <clean-code.tgz> <db.sql> <uploads-dir>
#
#   clean-code.tgz  tar of wp-content/{plugins,themes,mu-plugins,languages} from the Local app
#   db.sql          database export from Local, ALREADY search-replaced to
#                   https://<site>.montaweb.pe (wp search-replace ... --export, see README)
#   uploads-dir     unpacked wp-content/uploads from Local (only media types are copied)
#
# Order matters: the site is reachable only on 127.0.0.1:<port> until the admin login is
# replaced and the --check passes. Caddy and DNS come after, by hand, with Jan's yes.
set -euo pipefail

SITE="${1:?site}"; PORT="${2:?port}"; CODE_TGZ="${3:?clean code tgz}"; SQL="${4:?db.sql}"; UPLOADS="${5:?uploads dir}"
ROOT_DIR=/opt/montaweb-demos
DIR="$ROOT_DIR/$SITE"
HOST="$SITE.montaweb.pe"
TEMPLATE="${TEMPLATE:-/var/www/montaweb/deploy/wordpress}"
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"
CREDS=/root/montaweb-demo-credentials.txt
umask 077

die() { echo "stop: $*" >&2; exit 1; }
rnd() { openssl rand -base64 48 | tr -d '/+=\n' | cut -c1-"${1:-32}"; }

# 0. Preconditions: nothing is created until all of these pass.
[ "$(id -u)" = 0 ] || die "run as root"
[[ "$SITE" =~ ^[a-z0-9][a-z0-9-]{1,40}$ ]] || die "bad site name: $SITE"
[[ "$PORT" =~ ^[0-9]{4,5}$ ]] && [ "$PORT" -ge 1024 ] && [ "$PORT" -le 65535 ] || die "bad port: $PORT"
[ ! -e "$DIR" ] || die "$DIR already exists; for a rebuild use wp-site-build.sh"
ss -ltnH "( sport = :$PORT )" | grep -q . && die "port $PORT is already listening"
grep -qsx "PORT=$PORT" "$ROOT_DIR"/*/.env && die "port $PORT is already assigned to another site"
for f in "$CODE_TGZ" "$SQL"; do [ -s "$f" ] || die "missing or empty: $f"; done
[ -d "$UPLOADS" ] || die "uploads dir not found: $UPLOADS"
for f in Dockerfile docker-compose.yml wp-admin-rotate.php; do [ -f "$TEMPLATE/$f" ] || die "template missing $f"; done
[ -f "$SCRIPTS/wp-site-build.sh" ] && [ -f "$SCRIPTS/wp-rotate-admin.sh" ] || die "wp-site-build.sh / wp-rotate-admin.sh missing in $SCRIPTS"

# The compose template uses table prefix wp_ and the dump must already point at the real host.
grep -q 'CREATE TABLE `wp_options`' "$SQL" || die "dump has no wp_options table (table prefix must be wp_)"
grep -q "https://$HOST" "$SQL" || die "dump does not contain https://$HOST; run wp search-replace in Local first"
if grep -qiE '[a-z0-9-][.]local([^a-z0-9.-]|$)' "$SQL"; then
  die "dump still contains *.local URLs; run wp search-replace in Local first"
fi
tar -tzf "$CODE_TGZ" >/dev/null || die "code tarball is not a valid .tgz"

# 1. Site folder and fresh secrets (.env is root-only).
mkdir -p "$DIR"; chmod 700 "$DIR"
DBNAME="wp_$(tr - _ <<<"$SITE")"
{
  echo "SITE=$SITE"; echo "PORT=$PORT"
  echo "MYSQL_DATABASE=$DBNAME"; echo "MYSQL_USER=$DBNAME"
  echo "MYSQL_PASSWORD=$(rnd 32)"; echo "MYSQL_ROOT_PASSWORD=$(rnd 32)"
  for k in AUTH_KEY SECURE_AUTH_KEY LOGGED_IN_KEY NONCE_KEY AUTH_SALT SECURE_AUTH_SALT LOGGED_IN_SALT NONCE_SALT; do
    echo "WORDPRESS_$k=$(rnd 64)"
  done
} > "$DIR/.env"; chmod 600 "$DIR/.env"
cp "$TEMPLATE/docker-compose.yml" "$DIR/docker-compose.yml"
mkdir -p "$DIR/db_data" "$DIR/uploads"
echo "$(date -u +%FT%TZ) $SITE created by wp-site-new.sh on 127.0.0.1:$PORT (db secrets in $DIR/.env)" >> "$CREDS"; chmod 600 "$CREDS"

# 2. Database only, then import the dump.
cd "$DIR"
env -i PATH="$PATH" HOME="$HOME" docker compose up -d db
for _ in $(seq 1 60); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' "montaweb-demo-$SITE-db" 2>/dev/null)" = healthy ] && break
  sleep 2
done
[ "$(docker inspect -f '{{.State.Health.Status}}' "montaweb-demo-$SITE-db")" = healthy ] || die "database did not become healthy"
ROOTPW=$(sed -n 's/^MYSQL_ROOT_PASSWORD=//p' "$DIR/.env")
docker exec -i -e MYSQL_PWD="$ROOTPW" "montaweb-demo-$SITE-db" mysql -uroot "$DBNAME" < "$SQL"
echo "database imported"

# 3. Image from clean code + allowlisted uploads; rotates DB passwords and salts again.
TEMPLATE="$TEMPLATE" bash "$SCRIPTS/wp-site-build.sh" "$SITE" "$PORT" "$CODE_TGZ" "$UPLOADS"

# 4. Wait for WordPress on the loopback port only.
for _ in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $HOST" -H 'X-Forwarded-Proto: https' "http://127.0.0.1:$PORT/" || true)
  case "$code" in 200|301|302) break ;; esac
  sleep 2
done
case "${code:-}" in 200|301|302) ;; *) die "WordPress on 127.0.0.1:$PORT answers ${code:-nothing}" ;; esac

# 5. Replace the Local admin/admin login, then prove no default login is left.
TEMPLATE="$TEMPLATE" bash "$SCRIPTS/wp-rotate-admin.sh" "$SITE" --reset-other-admins
TEMPLATE="$TEMPLATE" bash "$SCRIPTS/wp-rotate-admin.sh" "$SITE" --check || die "admin check failed; do NOT add $HOST to Caddy"

cat <<EOF

$SITE is running on 127.0.0.1:$PORT with no default login. It is NOT public yet.
Next (each needs Jan's yes):
  1. /etc/caddy/Caddyfile, copy an existing demo block:
       $HOST {
           import wp_hardening
           reverse_proxy 127.0.0.1:$PORT
       }
     then: caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
  2. Cloudflare DNS: proxied record for $HOST -> washington
  3. Checks (expect 200 / 401 / 403):
       curl -sk -o /dev/null -w "%{http_code}\n" --resolve $HOST:443:127.0.0.1 https://$HOST/
       curl -sk -o /dev/null -w "%{http_code}\n" --resolve $HOST:443:127.0.0.1 https://$HOST/wp-login.php
       curl -sk -o /dev/null -w "%{http_code}\n" --resolve $HOST:443:127.0.0.1 https://$HOST/xmlrpc.php
Logins: cat $CREDS
EOF
