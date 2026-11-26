# Handoff: /comparar legal evidence (done) and its open items
2026-11-25 · MontaWeb, branch main, main checkout (no worktree) · Own uncommitted changes: none

## Goal (done)
Evidence for /comparar matching MiCita's method, plus RFC 3161 timestamps.

## Done so far
- Commit `2e694bf` (not pushed): scripts, tests, docs, decision next steps, lessons. `./verify.sh` passed.
- Sealed set `docs/evidence/comparar/2026-11-25/` (gitignored). freetsa + DigiCert verified. Never add to or edit this folder.
- Copies: Washington `/var/backups/montaweb/comparar-evidence-2026-11-25/`; R2 `micita-legal-evidence/montaweb/comparar/2026-11-25/` (168 objects, read back).
- Not matched: archive.today (reCAPTCHA; only a person may solve it; new copies go in a new dated folder).
- Washington upload tool `/var/backups/montaweb/tools/` holds the pre-review `lib/evidence.mjs`; the documented commands copy the current one on each run.

## Next steps
1. Table fix `d2a6f57` is live; evidence taken after it: `docs/evidence/comparar/2026-11-25-2/` (sealed, Washington + R2). Never add to or edit it.
2. Push of main needs Jan's yes.
3. Monthly re-check, first working day of December (2026-12-01): `docs/COMPARATIVA.md`.
4. After any deploy that changes these claims: capture the same day.

## Key files
- `css/compare.css:17` and `:20` — sticky thead and sticky row labels (`:38` is the narrow layout).
- `scripts/build-compare.mjs` — generates the pages; never edit the HTML by hand.
- `docs/COMPARATIVA.md` — procedure, verify commands, evidence log.
- `.devkit/plans/2026-11-25-comparar-evidence.md` — parity checklist.

## Gotchas
- Other sessions have uncommitted files here: commit only your own paths, never stash or reset.
- Deploy only via `scripts/deploy.sh`, with Jan's yes.
- Bash needs `PATH="$PATH:/mingw64/bin"` only if openssl is missing; PowerShell needs `C:\Program Files\Git\mingw64\bin`.
- The in-app Browser pane refuses localhost here (see `.devkit/lessons.md`); bump `?v=` when touching shared CSS.

## Open questions for Jan
- Push main now?
- Do you want to save the archive.org / archive.today copies by hand?
