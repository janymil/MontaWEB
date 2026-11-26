# 2026-11-25 — A business owner searching "diseño de páginas web" (Peru) or "… en Lima" lands on a MontaWeb page written for that search

## Goal

Rework `/diseño-web-lima` for the Lima searches and add a Peru-wide `/diseño-de-paginas-web` page for the national ones, without the two competing for the same keywords.

## Keyword split (source: `docs/research/keywords/2026-11-25-industry-landing-keywords.md`, `2026-11-25-competitor-keywords-agg.json`)

| Page | Primary | Secondary | Who ranks now |
|---|---|---|---|
| `/diseño-web-lima` | diseño de paginas web en lima (480) | pagina web en lima 170 · paginas web lima 170 · diseño web lima 170 · diseñador web lima 170 | kom #3, bersoft #4; bersoft #12–17, hosting.com.pe #9–11, respiraweb #19 |
| `/diseño-de-paginas-web` | diseño de paginas web (1,900) | diseño web 1,000 · creacion de paginas web 320 · diseño web profesional 140 · paginas web peru 170 · diseño web peru 110 | kom #19, hosting.com.pe #6 (profesional), #39–70 |

Rule against cannibalisation: the word "Lima" never appears in the national page's title, H1 or meta; "Perú"/"todo el país" never in the Lima page's title or H1. Each page links to the other once, with the other page's keyword as anchor text.

## Out of scope

Online shop page (waits for Jan, see below) · chatbot WhatsApp · price guide page · industry pages and hub (session `industry-pages`) · rewriting `/servicios` beyond one link.

## Files that will change

- `diseño-web-lima.html` — new title/H1/H2s, local data from our Lima study, districts by zone, FAQ as `<details>`, Service + FAQPage + BreadcrumbList JSON-LD
- `diseño-de-paginas-web.html` — new national page, same shell
- `css/site.css` — small shared block for `.kw-faq` (details) and `.kw-table` (stacked on mobile); bump `?v=` on the two pages only
- `images/og/og-diseno-web-lima.png`, `images/og/og-diseno-de-paginas-web.png` + `scripts/make-og-keyword-pages.py`
- `index.html`, `servicios.html` — one link each to the national page
- footer "Servicios" column: "Diseño web" points to the national page instead of `/servicios#web-simple` (one-line change per page)
- `sitemap.xml`, `llms.txt` — one entry
- `test/keyword-pages.test.mjs` — new; `test/seo-and-tracking.test.mjs`, `test/site-wide-design.test.mjs` — add the new page

## The risk

A promise MontaWeb does not keep (online booking, S/ 50 "web", shipping integrations) → refund/trust; Jan notices on a call. The two pages cannibalise → both stuck on page 2; seen in Search Console in weeks. Footer line conflicts with `industry-pages` → seen at merge, trivial to resolve.

## How it is proven

- Test `test/keyword-pages.test.mjs`: per page, title/H1/meta contain the primary keyword; national page has no "Lima" in title/H1/meta; JSON-LD parses with Service + FAQPage + BreadcrumbList; FAQ JSON-LD questions equal the visible `<summary>` texts; "S/ 99" present; pages link to each other; in sitemap; linked from index, servicios and footer.
- Gate: `./verify.sh`; rendered check desktop + 375 px in Chrome at 127.0.0.1.

## Steps

1. Write es-PE copy (Opus), run humanize scanner.
2. Build both pages + CSS + OG images.
3. Wiring + tests (sonnet subagent, checked).
4. Render check, commit, Spanish sample to Jan, ask Jan about the shop page.

## Online shops

`/servicios` already sells Tienda Starter (S/ 299) and Tienda Pro (S/ 499), so the question for Jan is only whether to build a `/tiendas-virtuales` page for "tienda virtual" (1,900) and "diseño de tiendas virtuales" (480) with those prices.

## Review — filled in after building, by the reviewer pass

- [x] Q1 · A business owner who searches "diseño de páginas web", "… en Lima" or "tienda virtual" now lands on a page written for that search, with the published prices, and every page's footer leads to those pages.
- [x] Q2 · `test/keyword-pages.test.mjs` fails without this change (no /tiendas-virtuales, no sitemap/llms/footer links). It also caught the national meta description missing its own keyword, which was fixed.
- [x] Q3 · `./verify.sh` — VERIFY OK (npm test 132/132), 2026-11-25. The two CRLF failures are fixed (compare and aeo tests normalise `
`).
- [x] Q4 · The risk, named: the shop page promising something the plans don't include; it now has a "Lo que tu tienda no incluye" section (no stock, couriers, e-invoicing or marketplace sync). Cannibalisation: no "Lima" in the national/shop titles, H1s or meta (tested).
- [x] Q5 · Opus session (exciting-liskov) read the sonnet subagent's diff, 2026-11-25; corrected its broken CRLF regex. Rendered check in Claude in Chrome at 127.0.0.1:8783, desktop and 375 px (iframe): no duplicated or invisible text, tables stack; fixed the caption squeezing to one word per line and the H1 price wrapping ("S/" / "299").
- [x] `lessons.md` updated.
