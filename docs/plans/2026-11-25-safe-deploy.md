# Safe deploy (`scripts/deploy.sh`)

Several Claude sessions edit this repo at once and the server carries its own uncommitted demo-site work. Deploy only through this script.

## Commands
- `npm run deploy:status` (or `scripts/deploy.sh status`): read-only report. Local uncommitted files by folder (possibly other sessions'), unpushed and unfetched commits, server HEAD vs origin/main (pushed but not deployed), server dirty tracked files, unmerged branches/worktrees, stashes, last 5 deploys.
- `DEPLOY_NOTE="session: compare pages" npm run deploy` (or `scripts/deploy.sh deploy [--yes]`):
  1. Must be on `main`; fetches origin; refuses if behind or diverged.
  2. Takes a local lock (`.git/montaweb-deploy.lock`, refused if younger than 30 min) and a server lock (`mkdir /tmp/montaweb-deploy.lock`); both released on exit.
  3. Warns about uncommitted files (never committed for you), lists the exact commits and files going live, warns if css/js changed without a `?v=` bump in the referencing HTML.
  4. Checks server copies (dirty, untracked or ignored) of every incoming file. Any copy that differs from the incoming one stops the deploy before the push and is listed as `DIFF`; resolve it by hand.
     Then asks `Deploy these N commits? [y/N]` (identical copies are listed first), runs `git push origin main` (never forced) and updates the server with `fetch` + `merge --ff-only`. Identical copies are first saved to `/var/www/montaweb-backup-<ts>/`; they are put back if the update fails. Nothing else is fixed automatically.
  5. Verifies each changed page/asset on the server with `curl --resolve` (200/301/308) and prints a table.
  6. Logs time, from/to sha, count, git user, note, result to `/var/www/montaweb-deploy.log` and `.git/montaweb-deploys.log`.
- `scripts/deploy.sh rollback <sha>`: prints instructions only (`git revert`, test, deploy).

## Settings
`DEPLOY_HOST` (default `washington`), `DEPLOY_PATH` (default `/var/www/montaweb`), `DEPLOY_NOTE`.

## Rules
- Never `reset`, `checkout`, `stash` or `clean` on the server by hand. The one exception is the script restoring a single backed-up file that is identical to the incoming one.
- A server lock left by a crashed run must be removed by hand: `ssh washington rmdir /tmp/montaweb-deploy.lock`.
- The `live` git remote is ignored.
