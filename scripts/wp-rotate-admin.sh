#!/usr/bin/env bash
# Replace default / weak WordPress admin logins on washington. Runs ON THE SERVER as root.
# See deploy/wordpress/README.md and docs/decisions/2026-11-25-hardened-wordpress-hosting.md.
#
#   wp-rotate-admin.sh <site>           new random password for mw-<site>-adm (created if
#                                       missing), user "admin" deleted (its posts go to the
#                                       new user), every session ended
#   wp-rotate-admin.sh --all            the same for every running montaweb-demo-*-wp container
#   wp-rotate-admin.sh <site|--all> --check
#                                       change nothing; exit 1 if a user "admin" exists or an
#                                       administrator's password is a known default
#
# Options:  --reset-other-admins   also give every other administrator a new random password
#                                  (off by default: client sites have their own named admins)
#           --email <addr>         email for the new admin (default admin@montaweb.pe)
#
# Passwords are generated inside WordPress and written only to
# /root/montaweb-demo-credentials.txt (mode 600). Nothing secret is printed.
set -euo pipefail

TEMPLATE="${TEMPLATE:-/var/www/montaweb/deploy/wordpress}"
PHP="$TEMPLATE/wp-admin-rotate.php"
CREDS=/root/montaweb-demo-credentials.txt
umask 077

MODE=rotate; RESET_OTHERS=0; EMAIL=admin@montaweb.pe; TARGET=""
while [ $# -gt 0 ]; do
  case "$1" in
    --check) MODE=check ;;
    --reset-other-admins) RESET_OTHERS=1 ;;
    --email) EMAIL="${2:?--email needs a value}"; shift ;;
    --all) TARGET=--all ;;
    -*) echo "unknown option $1"; exit 2 ;;
    *) TARGET="$1" ;;
  esac
  shift
done
[ -n "$TARGET" ] || { sed -n '2,20p' "$0"; exit 2; }
[ "$(id -u)" = 0 ] || { echo "run as root"; exit 2; }
[ -f "$PHP" ] || { echo "missing $PHP"; exit 2; }

if [ "$TARGET" = --all ]; then
  mapfile -t SITES < <(docker ps --format '{{.Names}}' | sed -n 's/^montaweb-demo-\(.*\)-wp$/\1/p' | sort)
  [ ${#SITES[@]} -gt 0 ] || { echo "no running montaweb-demo-*-wp containers"; exit 1; }
else
  [[ "$TARGET" =~ ^[a-z0-9][a-z0-9-]{1,40}$ ]] || { echo "bad site name: $TARGET"; exit 2; }
  SITES=("$TARGET")
fi

field() { sed -n "s/^MWRES $1 //p" <<<"$2"; }

FAILED=0
for SITE in "${SITES[@]}"; do
  C="montaweb-demo-$SITE-wp"
  if ! docker ps --format '{{.Names}}' | grep -qx "$C"; then
    echo "$SITE: container $C is not running"; FAILED=1; continue
  fi
  LOGIN="mw-$SITE-adm"
  OUT=$(docker exec -i -e MW_MODE="$MODE" -e MW_LOGIN="$LOGIN" -e MW_EMAIL="$EMAIL" \
          -e MW_RESET_OTHERS="$RESET_OTHERS" -e MW_HOST="$SITE.montaweb.pe" "$C" php < "$PHP" 2>/dev/null) || true

  if [ -n "$(field error "$OUT")" ] || [ -z "$(field done "$OUT")" ]; then
    echo "$SITE: FAILED ($(field error "$OUT" | head -1))"; FAILED=1; continue
  fi

  if [ "$MODE" = check ]; then
    ADM=$(field admin_user_exists "$OUT"); WEAK=$(field weak_admin "$OUT" | paste -sd, -)
    ADMINS=$(field administrator "$OUT" | paste -sd, -)
    if [ "$ADM" = yes ] || [ -n "$WEAK" ]; then
      echo "$SITE: UNSAFE  user admin exists: $ADM  weak passwords: ${WEAK:-none}  administrators: $ADMINS"; FAILED=1
    else
      echo "$SITE: ok  administrators: $ADMINS"
    fi
    continue
  fi

  # rotate: store first, report after. The password never reaches the terminal.
  TS=$(date -u +%FT%TZ)
  {
    echo "$TS $SITE wordpress admin user=$(field login "$OUT") password=$(field password "$OUT") url=https://$SITE.montaweb.pe/wp-login.php"
    field other_admin "$OUT" | while read -r u p; do echo "$TS $SITE wordpress admin user=$u password=$p"; done
  } >> "$CREDS"
  chmod 600 "$CREDS"

  V1=$(field verify_new_login "$OUT"); V2=$(field verify_admin_gone "$OUT")
  WEAK=$(field weak_admin "$OUT" | paste -sd, -)
  KEPT=$(field kept_admin "$OUT" | paste -sd, -)
  echo "$SITE: admin=$LOGIN  new login works: $V1  user admin gone: $V2  sessions ended" \
       "${KEPT:+ other admins kept: $KEPT}" "$(field warning "$OUT")"
  if [ "$V1" != ok ] || [ "$V2" != ok ] || [ -n "$WEAK" ]; then
    echo "$SITE: STILL UNSAFE ${WEAK:+(weak passwords: $WEAK; rerun with --reset-other-admins)}"; FAILED=1
  fi
done

[ "$MODE" = rotate ] && echo "credentials appended to $CREDS (read with: cat $CREDS)"
exit $FAILED
