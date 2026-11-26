# Comparison pages (/comparar)

Decision: `docs/decisions/2026-11-25-competitor-comparison-pages.md`. Modelled on MiCita's `/comparar`.

## Files
- `scripts/compare/competitors.mjs`: every fact, its source URL, the date and the `quotes` that must appear on the source page. It also holds MontaWeb's cells (`mustAppear` strings are checked against `servicios.html` + `terminos.html`) and all Spanish copy.
- `scripts/build-compare.mjs`: writes `comparar.html` and `comparar/<slug>.html`. The header and footer are copied from `blog.html`. Never edit the generated HTML by hand.
- `css/compare.css`, `test/compare.test.mjs`, `scripts/compare-evidence.mjs`.

## Rules (D. Leg. 1044 arts. 8, 11, 12; Indecopi Lineamientos 2019)
1. Only what the competitor's own page says on the checked date, quoted. Not on the page → `unlisted` ("No figura en su página"), never "No".
2. Prices exactly as written, with their tax basis. Never add IGV and never convert currency. No foreign-currency amounts.
3. No logos, star ratings, superlatives, "más barato", "ahorras" or insinuations. The test bans the usual words.
4. Like-for-like: show what each plan includes, not just the headline price.
5. Every page carries the trademark note and a correction email.

## Monthly re-check (first working day) and on any complaint
1. `node scripts/compare-evidence.mjs` from a Lima connection. It saves HTML, PDF, PNG and text plus SHA-256 to `docs/evidence/comparar/<date>/`, and exits 1 if any quote is missing.
2. Fix the data for any missing quote, set `VERIFIED_ON` and each source's `checked`, run `node scripts/build-compare.mjs` and `npm test`.
3. Nubix animates its prices from 0: also save a screenshot from a normal browser after scrolling to "Planes".
4. Copy the evidence folder to Washington `/var/backups/montaweb/comparar-evidence-<date>/` (only with Jan's yes) and keep it 5 years.
5. If a competitor writes: correct or remove the claim within 2 working days, keep a copy of what was online, and answer in writing. If Indecopi opens a case: stop, get a colegiado lawyer, and don't touch the evidence.

## Adding a competitor
It must be a Lima provider that publishes soles prices on its own site. Add it to `COMPETITORS` with a cell for every row (the test fails otherwise) and quotes for every non-`unlisted` cell. Then run the evidence script, rebuild, add it to `sitemap.xml` and `llms.txt`, and update the decision.
