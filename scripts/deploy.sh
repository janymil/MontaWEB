#!/usr/bin/env bash
# Safe deploy for MontaWeb. Usage: scripts/deploy.sh help
set -euo pipefail

HOST="${DEPLOY_HOST:-washington}"
SPATH="${DEPLOY_PATH:-/var/www/montaweb}"
SITE_HOST="${DEPLOY_SITE:-montaweb.pe}"
SLOG="${DEPLOY_LOG:-/var/www/montaweb-deploy.log}"
SLOCK="${DEPLOY_LOCK:-/tmp/montaweb-deploy.lock}"
NOTE="${DEPLOY_NOTE:-}"
LOCK_MAX_AGE=1800

cd "$(git rev-parse --show-toplevel)"
GCD="$(cd "$(git rev-parse --git-common-dir)" && pwd)"
LLOCK="$GCD/montaweb-deploy.lock"
LLOG="$GCD/montaweb-deploys.log"

if [ -t 1 ]; then
  R=$'\033[31m'; G=$'\033[32m'; Y=$'\033[33m'; B=$'\033[36m'; N=$'\033[0m'; BO=$'\033[1m'
else
  R=; G=; Y=; B=; N=; BO=
fi
h()    { printf '\n%s== %s ==%s\n' "$BO$B" "$*" "$N"; }
ok()   { printf '%s[ok]%s %s\n' "$G" "$N" "$*"; }
warn() { printf '%s[warn]%s %s\n' "$Y" "$N" "$*"; }
die()  { printf '%s[stop]%s %s\n' "$R" "$N" "$*" >&2; exit 1; }
gq()   { git -c core.quotepath=off "$@"; }
sshc() { ssh -o BatchMode=yes -o ConnectTimeout=10 "$HOST" "$@"; }
count_lines() { grep -c . || true; }

usage() {
  cat <<USAGE
Usage: scripts/deploy.sh [status|deploy [--yes]|rollback <sha>|help]
  status     read-only report of everything that could be forgotten (default)
  deploy     guarded deploy: lock, show commits, push origin main, ff-only update on server (backs up identical copies, stops on differing ones), verify, log
  rollback   print safe rollback instructions (does nothing)
Env: DEPLOY_HOST (default washington), DEPLOY_PATH (default /var/www/montaweb), DEPLOY_NOTE (session note)
USAGE
}

# reads porcelain lines on stdin, prints counts per top-level folder
group_changes() {
  sed -E 's/^.{3}//; s/^"//; s/"$//' | awk -F/ '{ if (NF>1) k=$1"/"; else k="(root files)"; c[k]++ } END { for (k in c) printf "   %-28s %d\n", k, c[k] }' | sort
}

server_head() { sshc "git -C '$SPATH' rev-parse HEAD" | tr -d '\r'; }

cmd_status() {
  h "Local uncommitted / untracked"
  local por n
  por="$(gq status --porcelain --untracked-files=all)"
  n=$(printf '%s\n' "$por" | count_lines)
  if [ "$n" -gt 0 ]; then
    warn "$n files (may belong to OTHER sessions; not part of any deploy until committed)"
    printf '%s\n' "$por" | group_changes
  else
    ok "clean"
  fi

  h "Local main vs origin/main"
  git fetch -q origin
  local ahead behind
  ahead=$(git rev-list --count origin/main..main)
  behind=$(git rev-list --count main..origin/main)
  echo "current branch: $(git rev-parse --abbrev-ref HEAD)"
  if [ "$ahead" -gt 0 ]; then
    warn "$ahead local commits NOT pushed:"; gq log --oneline origin/main..main | sed 's/^/   /'
  else ok "no unpushed commits"; fi
  if [ "$behind" -gt 0 ]; then
    warn "$behind origin commits not in local main:"; gq log --oneline main..origin/main | sed 's/^/   /'
  else ok "local main has everything on origin"; fi

  h "Server ($HOST:$SPATH)"
  local sh="" undeployed=0 sdirty=0
  if sh="$(server_head 2>/dev/null)" && [ -n "$sh" ]; then
    echo "server HEAD: ${sh:0:9}   origin/main: $(git rev-parse --short=9 origin/main)"
    if git cat-file -e "$sh^{commit}" 2>/dev/null; then
      undeployed=$(git rev-list --count "$sh..origin/main")
      if [ "$undeployed" -gt 0 ]; then
        warn "$undeployed commits pushed but NOT deployed:"; gq log --oneline "$sh..origin/main" | sed 's/^/   /'
      else ok "server is up to date with origin/main"; fi
    else
      warn "server HEAD unknown locally (server has other commits?)"
    fi
    local sd
    sd="$(sshc "git -C '$SPATH' status --porcelain --untracked-files=no" | tr -d '\r')"
    sdirty=$(printf '%s\n' "$sd" | count_lines)
    if [ "$sdirty" -gt 0 ]; then
      warn "server has $sdirty uncommitted tracked files (never touch them):"; printf '%s\n' "$sd" | sed 's/^/   /'
    else ok "server tracked files clean"; fi
    if sshc "[ -d '$SLOCK' ] && echo locked" 2>/dev/null | grep -q locked; then warn "server deploy lock present ($SLOCK)"; fi
  else
    warn "cannot reach $HOST via ssh"
  fi

  h "Other branches / worktrees with unmerged work"
  local unm=0 b c
  while IFS= read -r b; do
    [ "$b" = main ] && continue
    c=$(git rev-list --count "main..$b")
    if [ "$c" -gt 0 ]; then warn "branch $b: $c commits not in main"; unm=$((unm+1)); fi
  done < <(git for-each-ref refs/heads --format='%(refname:short)')
  local line wpath="" d
  while IFS= read -r line; do
    case "$line" in
      "worktree "*) wpath="${line#worktree }";;
      "branch "*)
        d=$(git -C "$wpath" status --porcelain 2>/dev/null | count_lines)
        echo "   worktree $wpath [${line#branch refs/heads/}] uncommitted files: $d";;
    esac
  done < <(git worktree list --porcelain)
  [ "$unm" -eq 0 ] && ok "no local branch has commits missing from main"
  ls -d .claude/worktrees/* 2>/dev/null | sed 's/^/   dir /' || true

  h "Stashes"
  local st
  st=$(git stash list | count_lines)
  if [ "$st" -gt 0 ]; then warn "$st stashes"; git stash list | sed 's/^/   /'; else ok "none"; fi

  h "Last 5 deploys"
  if [ -f "$LLOG" ]; then tail -n 5 "$LLOG" | sed 's/^/   /'; else echo "   (no local log yet)"; fi
  sshc "tail -n 5 '$SLOG' 2>/dev/null" 2>/dev/null | sed 's/^/   [server] /' || true

  h "Summary"
  echo "uncommitted=$n unpushed=$ahead behind_origin=$behind undeployed=$undeployed server_dirty=$sdirty unmerged_branches=$unm stashes=$st"
}

LOCKED=0; SLOCKED=0
release() {
  if [ "$LOCKED" = 1 ]; then rm -f "$LLOCK"; fi
  if [ "$SLOCKED" = 1 ]; then sshc "rmdir '$SLOCK'" >/dev/null 2>&1 || true; fi
}

acquire_locks() {
  if [ -f "$LLOCK" ]; then
    local t age
    t=$(sed -n 2p "$LLOCK"); age=$(( $(date +%s) - ${t:-0} ))
    if [ "$age" -lt "$LOCK_MAX_AGE" ]; then
      die "another deploy lock is ${age}s old ($(tr '\n' ' ' < "$LLOCK")). Wait, or delete $LLOCK if you are sure it is dead."
    fi
    warn "stale local lock (${age}s) replaced"
  fi
  printf '%s\n%s\n%s\n' "$$" "$(date +%s)" "${NOTE:-no note} $(date -Is)" > "$LLOCK"
  LOCKED=1
  trap release EXIT
  if sshc "mkdir '$SLOCK'" 2>/dev/null; then
    SLOCKED=1
  else
    die "server lock $SLOCK exists (or ssh failed). Another deploy may be running; inspect it, then rmdir it yourself."
  fi
  ok "locks acquired"
}

check_cache_bust() {
  local base="$1" files f html pat o nw bad=0
  files=$(gq diff --name-only --diff-filter=ACMR "$base..main" -- css js)
  [ -z "$files" ] && return 0
  while IFS= read -r f; do
    pat="$(printf '%s' "$f" | sed 's/\./\\./g')\\?v=[^\"' ]*"
    while IFS= read -r html; do
      [ -z "$html" ] && continue
      o=$(git show "$base:$html" 2>/dev/null | grep -oE "$pat" | head -1 || true)
      nw=$(git show "main:$html" 2>/dev/null | grep -oE "$pat" | head -1 || true)
      if [ -n "$nw" ] && [ "$o" = "$nw" ]; then warn "$f changed but $html still has '$nw' (bump ?v=)"; bad=1; fi
    done < <(gq grep -l -F "$f" main -- '*.html' 2>/dev/null | sed 's/^main://')
  done <<< "$files"
  if [ "$bad" = 0 ]; then ok "?v= cache-busting looks bumped"; fi
}

# "blob<TAB>path" for every path the commits base..main change (all-zero blob = deleted)
incoming_files() {
  gq diff --raw --no-abbrev --no-renames "$1" main |
    awk -F'\t' '{ split($1, m, " "); print m[4] "\t" $2 }'
}

# Runs ON THE SERVER (sent over ssh). stdin: incoming_files output.
# A server copy the update would overwrite is harmless only if it already equals the incoming file.
# mode check: report only. mode apply: back up identical copies, clear them, ff-only to $target.
# Exit 3 = some copy differs (nothing touched).
server_pull() {
  local dir="$1" mode="$2" target="$3" bk="$4"
  local blob f st same=() diff=()
  cd "$dir" || return 1
  if [ "$mode" = apply ]; then
    git fetch -q origin main </dev/null || return 1
    [ "$(git rev-parse FETCH_HEAD)" = "$target" ] || { echo "origin/main moved during the deploy; run it again."; return 1; }
  fi
  while IFS=$'\t' read -r blob f; do
    [ -n "$f" ] || continue
    st="$(git status --porcelain --untracked-files=all --ignored --no-renames -- ":(literal)$f" </dev/null)" || return 1
    [ -n "$st" ] || continue
    if [ -f "$f" ] && [ ! -L "$f" ] && [ "$(git hash-object -- "$f" </dev/null)" = "$blob" ] && staged_matches "${st:0:1}" "$blob" "$f"; then
      same+=("$f")
    else
      diff+=("$f")
    fi
  done
  if [ "${#diff[@]}" -gt 0 ]; then
    printf 'DIFF %s\n' "${diff[@]}"
    return 3
  fi
  if [ "${#same[@]}" -gt 0 ]; then printf 'SAME %s\n' "${same[@]}"; fi
  [ "$mode" = apply ] || return 0

  if [ "${#same[@]}" -gt 0 ]; then
    mkdir "$bk" || return 1
    for f in "${same[@]}"; do
      mkdir -p "$bk/$(dirname "$f")" && cp -p -- "$f" "$bk/$f" || return 1
    done
    echo "backup: $bk"
    # if anything below fails or the connection drops, put the files back
    trap 'for f in "${same[@]}"; do mkdir -p "$(dirname "$f")"; cp -p -- "$bk/$f" "$f"; done; echo "restored server copies from $bk"' EXIT
    trap 'exit 1' HUP INT TERM
    for f in "${same[@]}"; do
      if git cat-file -e "HEAD:$f" 2>/dev/null; then
        git checkout -q HEAD -- ":(literal)$f" </dev/null || exit 1
      else
        git rm -q --cached --ignore-unmatch -- ":(literal)$f" </dev/null || exit 1
        rm -f -- "$f" || exit 1
      fi
    done
  fi
  git merge --ff-only "$target" </dev/null || exit 1
  trap - EXIT HUP INT TERM
}

# true unless something else than the incoming content is staged ($1 = index status letter)
staged_matches() {
  case "$1" in " "|"?"|"!") return 0;; esac
  [ "$(git ls-files -s -- ":(literal)$3" </dev/null | awk '{ print $2 }')" = "$2" ]
}

run_server_pull() {
  local mode="$1" base="$2" bk="$3"
  {
    declare -f staged_matches server_pull
    printf "server_pull %q %q %q %q <<'INCOMING'\n" "$SPATH" "$mode" "$(git rev-parse main)" "$bk"
    incoming_files "$base"
    echo INCOMING
  } | sshc "bash -s" 2>&1 | tr -d '\r'
}

differ_help() {
  printf '%s\n' "$1"
  case "$1" in
    *"DIFF "*) echo "DIFF = the server copy is not the same as the incoming file. Compare and resolve by hand; never stash or reset there.";;
  esac
}

VERIFY="?"
verify() {
  local base="$1" files paths="" f
  files=$(gq diff --name-only --diff-filter=ACMR "$base..main")
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in
      docs/*|scripts/*|test/*|.devkit/*|.claude/*|node_modules/*|*.md|package*.json|.gitignore|*.sh) continue;;
      index.html) paths+="/"$'\n';;
      */index.html) paths+="/${f%index.html}"$'\n';;
      *.html) paths+="/${f%.html}|/$f"$'\n';;
      css/*|js/*|images/*|*.xml|*.txt) paths+="/$f"$'\n';;
    esac
  done <<< "$files"
  if [ -z "$paths" ]; then ok "no web-served files changed; nothing to verify"; VERIFY="n/a"; return 0; fi
  local remote out
  remote="while IFS= read -r line; do ok=''; first=''; IFS='|' read -ra cands <<< \"\$line\"; for p in \"\${cands[@]}\"; do c=\$(curl -s -o /dev/null -w '%{http_code}' --resolve $SITE_HOST:443:127.0.0.1 \"https://$SITE_HOST\$p\"); [ -z \"\$first\" ] && first=\$c; case \$c in 200|301|308) ok=\$c; break;; esac; done; if [ -n \"\$ok\" ]; then echo \"OK|\$ok|\$line\"; else echo \"FAIL|\$first|\$line\"; fi; done"
  out=$(printf '%s' "$paths" | sshc "$remote" | tr -d '\r')
  local fail=0 st code rest
  h "Verification (origin, on server)"
  while IFS='|' read -r st code rest; do
    [ -z "$st" ] && continue
    if [ "$st" = FAIL ]; then
      printf '  %sFAIL%s %s  %s\n' "$R" "$N" "$code" "$rest"; fail=$((fail+1))
    else
      printf '  %sOK%s   %s  %s\n' "$G" "$N" "$code" "$rest"
    fi
  done <<< "$out"
  if [ "$fail" -gt 0 ]; then VERIFY="FAIL($fail)"; warn "$fail URLs failed"; else VERIFY="ok"; fi
}

cmd_deploy() {
  local yes=0
  [ "${1:-}" = "--yes" ] && yes=1
  local br
  br=$(git rev-parse --abbrev-ref HEAD)
  [ "$br" = main ] || die "on branch '$br'; deploy only from main."
  acquire_locks
  git fetch -q origin
  local ahead behind
  ahead=$(git rev-list --count origin/main..main)
  behind=$(git rev-list --count main..origin/main)
  if [ "$behind" -gt 0 ] && [ "$ahead" -gt 0 ]; then die "local main diverged from origin/main ($ahead ahead, $behind behind). Resolve first."; fi
  if [ "$behind" -gt 0 ]; then die "local main is $behind commits behind origin/main. Run: git pull --ff-only"; fi

  local por n
  por="$(gq status --porcelain --untracked-files=all)"
  n=$(printf '%s\n' "$por" | count_lines)
  if [ "$n" -gt 0 ]; then
    warn "$n uncommitted files NOT included in this deploy (other sessions' work?):"
    printf '%s\n' "$por" | group_changes
  fi

  local sh cnt
  sh="$(server_head)" || die "cannot read server HEAD"
  [ -n "$sh" ] || die "empty server HEAD"
  git cat-file -e "$sh^{commit}" 2>/dev/null || die "server HEAD ${sh:0:9} is not in the local repo; run git fetch origin and check the server."
  git merge-base --is-ancestor "$sh" main || die "server HEAD ${sh:0:9} is not an ancestor of local main (server diverged). Do not force; investigate."
  cnt=$(git rev-list --count "$sh..main")
  [ "$cnt" -gt 0 ] || die "nothing to deploy (server already at ${sh:0:9})."

  h "Commits going live ($cnt)"
  gq log --format='  %h %an  %s' "$sh..main"
  h "Changed files"
  gq diff --stat "$sh..main" | tail -n 60
  check_cache_bust "$sh"

  local pre
  if ! pre="$(run_server_pull check "$sh" -)"; then
    differ_help "$pre"
    die "server copies block this deploy (or the check failed). Nothing pushed, server unchanged."
  fi
  if [ -n "$pre" ]; then
    h "Server copies identical to incoming files (will be backed up, then replaced)"
    printf '%s\n' "$pre" | sed 's/^SAME /   /'
  fi

  if [ "$yes" = 0 ]; then
    [ -t 0 ] || die "no terminal for confirmation; use --yes."
    local ans
    read -r -p "Deploy these $cnt commits? [y/N] " ans
    if [ "$ans" != y ] && [ "$ans" != Y ]; then die "aborted."; fi
  fi

  h "Push origin main"
  git push origin main || die "push failed (never forced). Nothing deployed."
  h "Server update (ff-only)"
  local perr
  if ! perr="$(run_server_pull apply "$sh" "$SPATH-backup-$(date +%Y%m%d-%H%M%S)")"; then
    differ_help "$perr"
    die "server pull failed. Commits ARE on origin but NOT deployed. Not fixing automatically; inspect the server by hand."
  fi
  printf '%s\n' "$perr" | grep '^backup: ' || true
  printf '%s\n' "$perr" | tail -n 5
  local nh line
  nh="$(server_head)"
  verify "$sh"
  line="$(date -Is) ${sh:0:9}->${nh:0:9} commits=$cnt user=$(git config user.name) note=\"${NOTE}\" verify=$VERIFY"
  echo "$line" >> "$LLOG"
  printf '%s\n' "$line" | sshc "cat >> '$SLOG'" || warn "could not write server log"
  ok "logged: $line"
  if [ "$VERIFY" != ok ] && [ "$VERIFY" != "n/a" ]; then exit 2; fi
}

cmd_rollback() {
  local sha="${1:-}"
  [ -n "$sha" ] || die "usage: deploy.sh rollback <sha>"
  git cat-file -e "$sha^{commit}" 2>/dev/null || die "unknown commit $sha"
  cat <<ROLLBACK
Safe rollback of $(git log -1 --format='%h %s' "$sha") (nothing is executed):
  1. git revert $sha     (range: git revert <oldest>^..<newest>; merges need -m 1)
  2. npm test
  3. scripts/deploy.sh deploy
Never run reset --hard / checkout / stash / clean on the server: it holds uncommitted demo-site work.
ROLLBACK
}

case "${1:-status}" in
  status) cmd_status;;
  deploy) shift; cmd_deploy "${1:-}";;
  rollback) shift; cmd_rollback "${1:-}";;
  help|-h|--help) usage;;
  *) usage; exit 1;;
esac
