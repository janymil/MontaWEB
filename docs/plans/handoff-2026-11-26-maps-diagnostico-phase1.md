# Handoff: Google Maps diagnóstico — start Phase 1 (30 hot-lead reports)
Date 2026-11-26 · MontaWeb, branch main (Phase 0 merged in e4a1b90, decision d193fbc) · Uncommitted changes: no (from this work)

## Goal (what done looks like)
30 reports (HTML + PNG + PDF) for hot census leads, each with a WhatsApp message draft and a public link, plus a tracking sheet; Jan sends them 1:1 himself. Kill criteria after 2–3 weeks: ≥ 20% replies and ≥ 3 paid sales, otherwise stop (see plan).

## Done so far
- Decision: `docs/decisions/2026-11-25-google-maps-diagnostico.md` (decided; add-on S/ 59 or inside Soporte S/ 99; broken website = own fix, new site from S/ 99).
- Plan: `docs/plans/2026-11-25-google-maps-diagnostico.md` (phases, kill criteria).
- Generator: `scripts/maps-diagnostico/` (grid, score, fetch, probe, render, snapshot, run). Tests `test/maps-diagnostico.test.mjs`; `npm test` 223/223, `./verify.sh` OK.
- Spanish copy `scripts/maps-diagnostico/copy-es.json` (Opus + Humanizer scan, 0 hits). Not yet read by Jan.
- 3 Phase 0 reports in `docs/research/maps-diagnostico/private/reports/` (git-ignored): La Alameda (client, score 7), Plenident (21), Fido's Vet (18, broken site). Cost US$0.05/report; balance ≈ US$53.75.

## Next steps (ordered)
1. Get Jan's answers to the open questions below before generating anything.
2. Pick 30 leads from `docs/research/lima-web-census/private/hot-leads-2026-11-24.csv` (score ≥ 9, all categories, batch order as in the file). Skip chains and any business contacted in the last 90 days.
3. Run `node scripts/maps-diagnostico/run.mjs --from-census <cid>` per lead (cid is in the `maps` column URL). Budget cap ≈ US$2 for Phase 1; spend is logged in `private/raw/_spend.json`.
4. Public link `montaweb.pe/d/<token>`: decide how to publish (noindex, not in sitemap, delete after 90 days). Deploy only with Jan's explicit yes (`scripts/deploy.sh`, `docs/plans/2026-11-25-safe-deploy.md`).
5. WhatsApp opener per lead: Spanish written by an Opus subagent from purpose + facts (global CLAUDE.md "Text in other languages"), Humanizer scan, Jan reads a sample. Combine with the demo-preview outreach from `docs/decisions/2026-11-24-lead-targeting-from-census.md`. No broadcasts; Jan sends.
6. Tracking sheet (git-ignored, phones): lead, report id, sent date, reply, sale, amount.

## Key files
- `scripts/maps-diagnostico/run.mjs` — CLI; `--from-census` reads census raw from the main checkout.
- `scripts/maps-diagnostico/score.mjs` — score weights, bands 35/70, fix rules, PRICES.
- `scripts/maps-diagnostico/probe.mjs` — live website check (ok/broken/social), mirrors census probe.
- `scripts/maps-diagnostico/render.mjs` — report HTML; all text from copy-es.json.

## Gotchas
- Census website state is 1 day old and can be wrong (Plenident "broken" opens now); the live probe decides.
- A Facebook/Instagram URL in the listing is not a website. `is_claimed` ≠ verified, but the column says "Ficha verificada" (Jan to judge).
- Cache key = cid + spacing + keyword: re-renders are free. Headless Edge minimum width ~500 px; page is pinned to 430 px.
- Windows console garbles accents in output; files are fine.
- Leftover worktree `.claude/worktrees/agent-a79fb449877d92af7` (branch merged) can be removed.
- Devkit reviewer pass (`.devkit/DONE.md`) not done for Phase 0.

## Open questions for Jan
1. Spanish lines to read: "Qué tan fácil te encuentran", "Con unos ajustes puedes ganar terreno", "Cualquier persona puede sugerir cambios en tu ficha", "Ficha verificada", "pon un QR en la caja", and the broken-website fix text.
2. Report is ~4–5 phone screens (4 comparison cards). Shorten (e.g. a compact table) before Phase 1?
3. Rebuild offer for broken sites: keep S/ 99 or a different price?
