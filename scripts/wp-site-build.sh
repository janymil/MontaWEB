#!/usr/bin/env bash
# Build (or rebuild) a hardened WordPress site on washington from CLEAN sources.
# Runs ON THE SERVER as root. See deploy/wordpress/README.md.
#
#   wp-site-build.sh <site> <port> <clean-code.tgz> [uploads-source-dir]
#
#   clean-code.tgz      tar of wp-content/{plugins,themes,mu-plugins,languages} from a
#                       trusted copy (the Local app site), NOT from a live server.
#   uploads-source-dir  where media come from (default: the site's current uploads).
#                       Only media/fonts/css are copied (allowlist); PHP never is.
#
# Rotates on every run: DB passwords (app user + root) and the WordPress salts.
# Credentials go to /root/montaweb-demo-credentials.txt (root-only), never to stdout.
set -euo pipefail

SITE="${1:?site}"; PORT="${2:?port}"; CODE_TGZ="${3:?clean code tgz}"
DIR="/opt/montaweb-demos/$SITE"
TEMPLATE="${TEMPLATE:-/var/www/montaweb/deploy/wordpress}"
UPLOADS_SRC="${4:-$DIR/wp-content/uploads}"
CREDS=/root/montaweb-demo-credentials.txt
umask 077

[ -d "$DIR" ] || { echo "no $DIR"; exit 1; }
[ -f "$DIR/.env" ] || { echo "no $DIR/.env"; exit 1; }
rnd() { openssl rand -base64 48 | tr -d '/+=\n' | cut -c1-"${1:-32}"; }

# 1. Build context: template + clean code. Nothing from the old live tree.
rm -rf "$DIR/build"; mkdir -p "$DIR/build/wp-content"
cp "$TEMPLATE"/{Dockerfile,apache-hardening.conf,php-hardening.ini,htaccess,montaweb-hardening.php} "$DIR/build/"
tar -xzf "$CODE_TGZ" -C "$DIR/build/wp-content"
for d in plugins themes; do [ -d "$DIR/build/wp-content/$d" ] || { echo "clean code has no $d/"; exit 1; }; done
rm -rf "$DIR/build/wp-content/uploads" "$DIR/build/wp-content/upgrade"
if grep -rlE "Nullsec|WAF BYPASS|eval\(base64_decode|gzinflate\(base64_decode" "$DIR/build/wp-content" --include='*.php' | grep -q .; then
  echo "clean code contains webshell markers, stopping"; exit 1
fi
umask 022; chmod -R a+rX "$DIR/build"; umask 077

# 2. Uploads: allowlisted file types only, fresh directory.
NEW_UP="$DIR/uploads.new"; rm -rf "$NEW_UP"; mkdir -p "$NEW_UP"
( cd "$UPLOADS_SRC" && find . -path './.well-known' -prune -o -path '*/.tmb' -prune -o -type f \
    -regextype posix-extended -iregex '.*\.(jpe?g|png|gif|webp|avif|svg|ico|pdf|mp4|webm|mp3|woff2?|ttf|otf|eot|css|json|txt)$' -print0 \
  | tar --null -T - -cf - ) | tar -xf - -C "$NEW_UP"
chown -R 33:33 "$NEW_UP"; find "$NEW_UP" -type d -exec chmod 755 {} +; find "$NEW_UP" -type f -exec chmod 644 {} +
[ -d "$DIR/uploads" ] && mv "$DIR/uploads" "$DIR/uploads.prev-$(date -u +%Y%m%d%H%M%S)"
mv "$NEW_UP" "$DIR/uploads"

# 3. Secrets: new DB passwords + salts.
set -a; . "$DIR/.env"; set +a
OLD_ROOT="$MYSQL_ROOT_PASSWORD"
NEW_APP=$(rnd 32); NEW_ROOT=$(rnd 32)
docker exec -e MYSQL_PWD="$OLD_ROOT" "montaweb-demo-$SITE-db" mysql -uroot -e \
  "ALTER USER '$MYSQL_USER'@'%' IDENTIFIED BY '$NEW_APP'; ALTER USER 'root'@'%' IDENTIFIED BY '$NEW_ROOT'; ALTER USER 'root'@'localhost' IDENTIFIED BY '$NEW_ROOT'; FLUSH PRIVILEGES;" 2>/dev/null \
  || docker exec -e MYSQL_PWD="$OLD_ROOT" "montaweb-demo-$SITE-db" mysql -uroot -e \
  "ALTER USER '$MYSQL_USER'@'%' IDENTIFIED BY '$NEW_APP'; ALTER USER 'root'@'localhost' IDENTIFIED BY '$NEW_ROOT'; FLUSH PRIVILEGES;"
cp -p "$DIR/.env" "$DIR/.env.prev-$(date -u +%Y%m%d%H%M%S)"
{
  echo "SITE=$SITE"; echo "PORT=$PORT"
  echo "MYSQL_DATABASE=$MYSQL_DATABASE"; echo "MYSQL_USER=$MYSQL_USER"
  echo "MYSQL_PASSWORD=$NEW_APP"; echo "MYSQL_ROOT_PASSWORD=$NEW_ROOT"
  for k in AUTH_KEY SECURE_AUTH_KEY LOGGED_IN_KEY NONCE_KEY AUTH_SALT SECURE_AUTH_SALT LOGGED_IN_SALT NONCE_SALT; do
    echo "WORDPRESS_$k=$(rnd 64)"
  done
} > "$DIR/.env"; chmod 600 "$DIR/.env"
echo "$(date -u +%FT%TZ) $SITE mysql app+root passwords and WP salts rotated (see $DIR/.env)" >> "$CREDS"

# 4. Compose file from the template; remove the old wp container and its code volume.
[ -f "$DIR/docker-compose.yml" ] && cp -p "$DIR/docker-compose.yml" "$DIR/docker-compose.yml.prev-$(date -u +%Y%m%d%H%M%S)"
cp "$TEMPLATE/docker-compose.yml" "$DIR/docker-compose.yml"
OLD_VOL=$(docker inspect "montaweb-demo-$SITE-wp" --format '{{range .Mounts}}{{if eq .Destination "/var/www/html"}}{{.Name}}{{end}}{{end}}' 2>/dev/null || true)
docker rm -f "montaweb-demo-$SITE-wp" >/dev/null 2>&1 || true
docker rm -f "montaweb-demo-$SITE-db" >/dev/null 2>&1 || true   # recreated on the new internal network, same data dir
[ -n "$OLD_VOL" ] && echo "old code volume kept for evidence: $OLD_VOL"
# Clean environment: the old .env values sourced above would otherwise override the new .env.
cd "$DIR" && env -i PATH="$PATH" HOME="$HOME" docker compose build --pull -q \
  && env -i PATH="$PATH" HOME="$HOME" docker compose up -d --force-recreate
echo "built $SITE on 127.0.0.1:$PORT"
