# Plan: free Google Maps check ("diagnóstico") as a MontaWeb lead magnet

Date: 2026-11-25 · Status: proposed (waiting for Jan's go per phase)
Decision: `docs/decisions/2026-11-25-google-maps-diagnostico.md`

## Goal
Give a small Lima business a one-page report: where it shows up on Google Maps for its main search ("veterinaria", "dentista"...) across its district, how it compares with the 3 businesses that rank above it, and the 3 fixes that would help most. The report opens the sale of the things we already sell (Google Mi Negocio S/ 79, web from S/ 99, support S/ 49–99/month) and later a monthly Maps add-on.

Why: Peru demand is in Google Maps / Business Profile (google business profile 2,900/mo, google mi negocio 1,000/mo), not in "SEO services" (servicio seo 70, agencia seo lima 40). Small businesses pay for being found, not for data.

## What the report shows (one mobile page, es-PE)
1. **Ranking grid**: 5×5 points about 700 m apart, centred on the business. Each cell = its position (1–20, or "no aparece"). Plain SVG with street/district labels; no Google logo, no Google map tiles.
2. **Visibility score 0–100**: share of the grid where it is in the top 3 (counts most), plus top 10.
3. **You vs. the top 3**: rating, number of reviews, photos, website yes/no, hours filled in, profile claimed.
4. **3 fixes**, chosen by rule (no website → web; few reviews → review routine; unclaimed/incomplete profile → Google Mi Negocio setup), each with what we do and the published price.
5. **CTA**: WhatsApp button with a prefilled message carrying the report id.

Never promise "#1 on Google" or guaranteed results (Indecopi, misleading advertising). Never name the data vendor; source line says "Google Maps, consultado el <fecha>".

## Engine (estimated cost about US$0.05–0.06 per report)
- DataForSEO `serp/google/maps/live/advanced`, `location_coordinate = lat,lng,16z`, depth 20, 25 calls per report. Census cost was $0.60 for 290 calls at depth 100 (≈$0.002/call), so 25 calls ≈ $0.05. **Phase 0 measures the real cost.**
- Business match by `cid`/`place_id` from the census (outbound) or from the Maps link the person pastes (inbound).
- Competitor and own-profile fields come from the same SERP items (rating, votes, photos, url, is_claimed, work hours). Add `business_data/google/my_business_info` only if fields are missing.
- Raw JSON cached in `docs/research/maps-diagnostico/private/` (git-ignored, contains phones).

## Code layout
- `scripts/maps-diagnostico/` — `grid.py` (points), `fetch.py` (API + cache, prints cost and balance like `scripts/keywords/dfs.py`), `score.py` (pure: positions → score + fixes), `render.py` (HTML from a template).
- Spanish strings live in one file (`copy-es.json`), written by an Opus subagent from purpose + facts only, run through the Humanizer, sample read by Jan.
- Output: `d/<random-token>/index.html` on montaweb.pe, `noindex`, not in the sitemap, removed after 90 days.
- Pure logic (grid, score, fix rules) gets unit tests; implementation starts with a devkit plan in `.devkit/plans/` and passes `./verify.sh`.

## Phases (each needs Jan's go; kill criteria decide the next one)
**Phase 0 — prototype (1 session, sonnet implementer).** Generate reports for 3 known businesses (one MontaWeb client, two census leads). Measure cost per report; Jan judges whether the report reads right and is believable. Done = 3 HTML reports + real cost.

**Phase 1 — outbound test (2–3 weeks).** 30 hot census leads (score ≥ 9, all categories). Jan sends each report 1:1 on WhatsApp next to the demo preview, as the lead-targeting decision says; no broadcasts, nothing sent without Jan. Track replies and sales in a sheet.
Go to Phase 2 if: ≥ 20% replies **and** ≥ 3 paid sales. Otherwise stop and record why.

**Phase 2 — public page `/diagnostico-google-maps`.** Form: Maps link or business name + district, category, WhatsApp, consent checkbox (Ley 29733, link to privacy). `api/` endpoint stores the request, honeypot + per-IP daily cap (cost guard, e.g. 30 reports/day total). Phase 2a: Jan runs the generator by hand within 24 h; 2b: automatic via cron.
SEO-first: target "google mi negocio", "google business profile", "como aparecer en google maps"; full meta/OG/JSON-LD, sitemap, links from /servicios, the industry pages and the blog; one supporting article built on the Lima census ("qué tienen los negocios que salen primero en Google Maps en Lima").

**Phase 3 — monthly add-on "Google Maps al día".** Monthly re-run of the grid, profile kept up to date, review replies drafted, one-page monthly report on WhatsApp. Data cost about US$0.05/client/month. Price for Jan to decide; proposal S/ 59/month alone, or included in Soporte S/ 99. Needs its own decision file before it goes on /servicios.

## Answered by Jan (2026-11-25)
1. Delivery: **both**: the link on montaweb.pe (`/d/<token>`) and an image/PDF sent in WhatsApp. `render.py` outputs HTML + PNG + PDF.
2. Phase 1: **all hot leads** (score ≥ 9), not only vets and dentists.

## Still open
3. Add-on price (Phase 3). Proposal: its own price (S/ 59/month) and also included in Soporte S/ 99; decide before Phase 3.

## Risks
- Rank depends on who searches from where: the grid is the honest answer; the report says so in one plain line.
- Lima districts differ in size: spacing may need 500 m in dense zones (Miraflores) and 1 km elsewhere; tune in Phase 0.
- Abuse of the public form (people checking competitors): public data, acceptable; the daily cap limits cost.
