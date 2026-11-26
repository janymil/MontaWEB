# 2026-11-25 — A small business in Lima can compare MontaWeb's published prices with other web providers', side by side, with sources

## Goal

Add `/comparar` (hub) and `/comparar/<slug>` (one page per competitor), built like MiCita's `/comparar` (Washington: `/var/www/micita/docs/COMPARATIVA.md`): every competitor fact quoted from their own page with URL and date, and lawful under D. Leg. 1044 art. 12.

## Out of scope

- Logos, star ratings, Google reviews, "el más barato" / "el mejor" or any superlative.
- Providers that publish no price ("cotiza"), and amounts in foreign currency (described without amounts).
- A redesign of `/servicios`.

## Files that will change

- `scripts/compare/competitors.mjs` — every competitor fact + source URL + date; MontaWeb's own plans (checked against `servicios.html` by a test). Lives under `/scripts`, which Caddy already 404s.
- `scripts/build-compare.mjs` — writes `comparar.html` and `comparar/<slug>.html` from the data (same idea as `build-blog-data.mjs`).
- `comparar.html`, `comparar/*.html` — generated pages (es-PE), JSON-LD BreadcrumbList + FAQPage, OG image.
- `css/compare.css` — table, price cards, mobile layout, in the editorial design.
- `js/app.js` — homepage calculator: drop the unsourced "Otras agencias S/ 550–1 400" range and "¡Ahorras…!" line; link to `/comparar` instead. Bump `?v=`.
- `index.html`, `servicios.html`, footer of every page — link to `/comparar`. `sitemap.xml`, `llms.txt`.
- `scripts/compare-evidence.mjs` — full-page PNG + HTML + SHA-256 of each source page, run from Lima.
- `test/compare.test.mjs`.
- `docs/decisions/2026-11-25-competitor-comparison-pages.md`, `docs/COMPARATIVA.md`.

## The risk

A wrong or stale competitor price is misleading comparative advertising (Indecopi, D. Leg. 1044 arts. 8, 12), and MontaWeb carries the burden of proof. A competitor notices first. Mitigation: quotes only, dated evidence pack, 45-day stale check, monthly re-check.

## How it is proven

- `test/compare.test.mjs`: every fact has a source URL + ISO date; no foreign-currency amounts; banned words absent from generated pages ("más barato", "el mejor", "precio real", "ahorras"); MontaWeb prices in the data appear in `servicios.html`; generated HTML equals a fresh build; sitemap lists every page; `VERIFIED_ON` is ≤ 45 days old.
- Gate: `./verify.sh`.
- Rendered pages checked in Chrome at 127.0.0.1 (desktop + mobile), no duplicated or hidden text.

## Steps

1. Verify competitor facts (`docs/research/2026-11-25-competitor-facts.md`).
2. Data file + build script + tests (red → green).
3. Write es-PE copy (native-language rules, Humanizer), legal check against art. 12.
4. CSS, links, sitemap, OG image, calculator fix.
5. Evidence capture from Lima, `./verify.sh`, browser check.
6. Jan reads a sample and says yes before deploy.

## Review — filled in after building, by the reviewer pass

- [x] Q1 · plain sentence a non-developer can read: montaweb.pe/comparar shows MontaWeb next to 6 Lima web providers, and every number in it is quoted from their own page with a date.
- [x] Q2 · the test that fails without this change: test/compare.test.mjs (unsourced cell, MontaWeb figure not on /servicios, data older than 45 days, stale generated page, banned words, unsourced calculator range).
- [x] Q3 · `./verify.sh` — result: VERIFY OK (tests ok); compare-evidence.mjs: all quotes found on 2026-11-25.
- [x] Q4 · the risk, named: a competitor changes a price and the page goes out of date (D. Leg. 1044). Mitigation: monthly re-check, 45-day test, and the page hides prices on its own after 45 days.
- [x] Q5 · the reviewer read the diff (who, when): app-reviewer subagent, 2026-11-25. It found claims in the about text with no quote, an unsourced DIY claim, a narrow stale-hide rule and an unsanitised CSS label. All fixed. Known limit: the stale hide needs JS, and the meta description and JSON-LD keep the prices (the 45-day test is the backstop).
- [x] `lessons.md` updated — only if something surprised us
