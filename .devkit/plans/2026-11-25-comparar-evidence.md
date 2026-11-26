# /comparar evidence: parity with MiCita (2026-11-25)

Source read in full on Washington: `/var/www/micita/scripts/{compare-evidence.ts, micita-claims-evidence.ts,
upload-evidence.ts, compare-evidence-peru.sh, compare-recheck.ts}` and `/var/www/micita/docs/COMPARATIVA.md`.

## Parity checklist

| # | MiCita has | MontaWeb before | MontaWeb target |
|---|---|---|---|
| 1 | Every competitor source captured | yes | keep |
| 2 | Extra selector states a claim relies on | no (Nubix counters at 0) | counters finished + checked before screenshot |
| 3 | Full-page PNG with stamped header (URL, Lima date/time, method) | no (4000 px, no stamp) | `scripts/lib/capture.mjs` |
| 4 | HTML + PDF (+ text) | yes | keep |
| 5 | es-PE locale, America/Lima zone, normal-Chrome user agent | partly (lang) | same |
| 6 | `--proxy` | no | same flag |
| 7 | Traffic from Peru, exit country recorded | no record | Cloudflare trace in log |
| 8 | HTTP status + time per capture | no | same |
| 9 | SHA-256 per file in log.json / LOG.md | yes | keep |
| 10 | Recheck: every claimed text found (`RECHECK.md`) | quote check, not saved | write RECHECK.md |
| 11 | `--archive` archive.org Save Page Now | no | same + ARCHIVES.md |
| 12 | archive.today links (by hand, stop on CAPTCHA) | no | by hand, ARCHIVES.md |
| 13 | Own claims: stamped PNG + HTML of live pages, "proves" column | no | `scripts/montaweb-claims-evidence.mjs` |
| 14 | Own live /comparar pages + sitemap.xml after deploy | no | in the claims script |
| 15 | Copy of data files at the git commit | no | competitors.mjs (+ servicios/terminos) at deployed commit |
| 16 | Feature screens of the app (dashboard) | n/a: MontaWeb sells a service, its claims are the published terms | n/a |
| 17 | SHA256SUMS over the folder | no | `scripts/evidence-seal.mjs` |
| 18 | Off-server R2, never overwrite, read-back hash | no | `scripts/upload-evidence.mjs` (MiCita bucket, `montaweb/comparar/<date>`) |
| 19 | Second copy on Washington `/var/backups/…` (root, 700), `sha256sum -c` | no | `/var/backups/montaweb/comparar-evidence-<date>/` |
| 20 | Docs: monthly + deploy-day checklist, evidence log, 5 years, complaint/Indecopi steps | partly | docs/COMPARATIVA.md |
| + | (Jan, beyond MiCita) RFC 3161 timestamps, 2 TSAs, verified | no | `evidence-seal.mjs` |

## Slices
1. `scripts/lib/evidence.mjs` (pure helpers) + `test/evidence.test.mjs`.
2. `scripts/lib/capture.mjs` (CDP) + rewrite `compare-evidence.mjs` + claims script.
3. `evidence-seal.mjs` (manifest, TSAs, verify) + `upload-evidence.mjs`.
4. Run 2026-11-25, archive, seal, upload, verify. Keep this morning's unstamped capture under `prelaunch-unstamped/`.
5. Docs, decision next steps, lessons, `./verify.sh`, reviewer pass, commit own files only. No push, no deploy.
