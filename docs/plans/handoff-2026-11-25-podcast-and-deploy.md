# Handoff: article podcast is live; harden the deploy script
2026-11-25 · MontaWeb main checkout, branch main · Uncommitted changes: yes (1 lesson line in `.devkit/lessons.md` is ours; everything else uncommitted belongs to other sessions, e.g. compare pages)

## Goal
`scripts/deploy.sh` handles the case that stopped the first real deploy, and is tested end to end.

## Done so far
- 093349c (deployed, live): ElevenLabs two-host podcast for the Lima study (`images/audio/estudio-web-lima-2026.mp3`, 5:50), player (`css/podcast.css`, `js/podcast.js`, card + sticky mini player + transcript + AudioObject), generator `scripts/podcast/generate.mjs`, script `docs/plans/2026-11-25-podcast-estudio-lima-guion.md`, decision `docs/decisions/2026-11-25-article-audio-podcast.md`.
- Same commit: `scripts/deploy.sh` (status / deploy [--yes] / rollback / help), `docs/plans/2026-11-25-safe-deploy.md`, `test/deploy-script.test.mjs`, npm scripts `deploy:status`, `deploy`.
- Deploy shipped 7 earlier unpushed commits too (Jan approved). Server now at 093349c, clean. Backup of 12 server files: `/var/www/montaweb-backup-20261126-001713`.
- ELEVENLABS_API_KEY is in `.env` (gitignored).

## Next steps
1. Commit the lesson line in `.devkit/lessons.md` only (`git add -p`; never `git add -A`, other sessions have WIP).
2. In `scripts/deploy.sh` deploy step, before the server pull: list the server files that the incoming commits would overwrite (tracked dirty + untracked in the diff). For each, compare `git hash-object <f>` with `git rev-parse origin/main:<f>`. If all are identical, back them up to `/var/www/montaweb-backup-<ts>/`, remove or checkout them, then pull. If any differ, stop and list them.
3. Make sure verify + log still run after that path. Add a test for the parsing helper if feasible.
4. Run `npm run deploy:status` (read-only). Do not deploy without Jan's yes.

## Key files
- `scripts/deploy.sh:245-250` — push and server pull; where the identical-file check goes.
- `scripts/deploy.sh:186` — remote verify loop.
- `.devkit/lessons.md` top — deploy lessons.

## Gotchas
- Server = `ssh washington`, `/var/www/montaweb`, non-bare checkout; never reset/stash/clean there. Origin checks run on the server with `curl --resolve montaweb.pe:443:127.0.0.1`.
- Demo pages (/abogados etc.) 301 to subdomains — that is expected.
- The article file also carries another session's unstaged edits (footer `/comparar` link, `site.css?v=20261125c`); do not commit them.
- In-app Browser: use launch config `montaweb-static-8781`; python server can't do range requests (audio seek fails locally only).

## Open questions for Jan
- Has he listened to the podcast? Any phrasing to change (re-render costs ~6k credits; cached parts are reused).
