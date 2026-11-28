# Handoff: Libro de Reclamaciones study, cluster pages and outreach
2026-11-27 · MontaWeb main checkout, branch main · Flagship committed in 07a81a3 (not deployed, IndexNow not pinged)

## Goal
Two es-PE support pages linked to and from the flagship, an outreach plan (send nothing), then Jan's go for deploy + IndexNow.

## Done
- Flagship: `blog/libro-de-reclamaciones-virtual-estudio-lima.html` (source text `docs/plans/libro-reclamaciones-study/articulo.md`, Humanizer 100/100, fact-checked). Blog index, sitemap, OG image, JSON-LD done; `./verify.sh` OK.
- Final numbers: 688/2,399 = 28.7%; presentation 18.9, bookings 26.6, shops 54.2; active 33.9 vs 19.3; Wix 14.8, Shopify 71.0; footer 78.5%. Data: `docs/research/lima-web-census/data/libro-probe-summary.json`.
- Jan's answers: name LibroDigital; use the live scanner https://librodigital.pe/revisar-mi-web/ (no new checker). Prices (read in Chrome 2026-11-27): Gratis S/ 0 (1 local, 5 reclamos total), Básico S/ 89/año IGV incl. (ilimitados), Pro S/ 189/año (IA que redacta respuestas, 5 locales), Empresarial S/ 429/año. Do not mention the temporary S/ 69 launch offer.
- Keywords: `docs/research/keywords/2026-11-27-libro-reclamaciones-cluster.md`.
- Facts: plan `docs/plans/2026-11-27-libro-reclamaciones-study-plan.md` + `side-session-notes/local_daeaf134-.../facts-2026-11-27.md`.

## Next steps
0. FIRST, fix the flagship (Jan's review 2026-11-27, things the first build missed):
   - **Hero image** next to the H1, like `blog/estudio-web-negocios-lima-2026.html` (`post-hero__grid` + `/images/blog/lima-hero.webp`, preload, in JSON-LD `image`). Use a real licensed local photo that fits the topic (a Lima shop counter or storefront with a libro de reclamaciones sign, or a business web on a phone). Real footage before AI (memory rule): Pixabay/Envato first; record the licence. Alt text in es-PE written by opus.
   - **Clickable sources**: every item in "Fuentes" gets a real link (El Peruano for Ley 32495 and DS 301-2025-EF, the LP Derecho PDFs for 0226-2022, Junín 206-2026 and Puno 044-2026, the Gestión Yape article, gob.pe for Tu Libro and RM 244-2026-PCM, Ley 29571 on gob.pe/SPIJ). Format like the estudio page (`<ul class="sources">`, title linked + date). URLs are in the plan and the facts note; verify each opens. Also link the first in-text mention of each law/resolution.
   - **SEO / AEO / GEO ("KEO" in Jan's words: confirm with Jan what he means)** per `~/.claude/skills/writing/references/seo.md`, `serp.md`, `information-gain.md`, `links.md`: answer-first paragraph for each question H2 (featured-snippet and AI-answer ready), a short quotable key-findings block with the method in one line, `speakable` + `citation` + `isBasedOn` in JSON-LD, Dataset `variableMeasured`, author/publisher entity, dateModified, an "Cómo citar este estudio" line (es-PE by opus), internal links to /tiendas-virtuales and service pages, check title ≤60 chars (now 61).
   - **Backlink-ready**: embeddable chart (copy-paste embed code with credit link) and a press/data summary section journalists can quote; plus the outreach plan (step 3). Do not offer the raw data for download.
   - Rerun the rendered-page check (duplicates, invisible text, 375 px) and `./verify.sh`.
1. Write (opus only, global language rule, Humanizer + scanner; writer gets purpose/reader/facts, no English template):
   - "multa por no tener libro de reclamaciones" (110/mo; secondary: libro de reclamaciones ley 210, reglamento 260, cuanto es la multa 40). Draft at `docs/plans/libro-reclamaciones-study/multa.md`.
   - "libro de reclamaciones virtual indecopi / gratis" (140 + 170; Indecopi tool vs LibroDigital vs own form). Draft at `docs/plans/libro-reclamaciones-study/indecopi-gratis.md`.
   - Fact-check each with a sonnet subagent against the plan/facts files.
2. Build both (sonnet, same brief style as the flagship: exact text, `TODO-ES:` for any new string, then fill them in opus); cross-link with the flagship and add a contextual link from `/tiendas-virtuales` if a fitting sentence exists.
3. Outreach plan in `docs/plans/libro-reclamaciones-study/outreach.md`: Gestión (Yape piece author), LP Derecho, Infomercado, consumer-law firms, gremios (PRODUCE, Cámara de Lima). Draft messages only. Send nothing.
4. Ask Jan: read a sample of the flagship Spanish (he chose "build it" before reading); deploy + IndexNow ping (his yes needed).

## Gotchas
- Never claim a 2026 website-fine wave, that RM 244-2026-PCM is in force, or a Yape resolution number. In the Yape case the complainant was the Defensoría, not a consumer; the Sala "declaró fundada" the complaint; no fine reported.
- Two-year record keeping: only LibroDigital's own page and kom.pe say it; no official text in our files.
- 2026 fines (Junín 0.50 UIT colegio; BBVA Puno 5 UIT) are physical-libro cases.
- Site number format: "28,7 %", "2 399" with nbsp.
- Don't touch `*lima-call-study*` or `*ai-recommends-lima*` files.

## Status after session 2 (2026-11-27)
- Steps 0–3 done except the flagship hero photo: no fitting free Lima photo on Pixabay/Pexels/Unsplash (waiting for Jan: Envato or the closest free one). Spec in `libro-reclamaciones-study/flagship-fixes.md` §2.
- Support pages built: `blog/multa-por-no-tener-libro-de-reclamaciones.html` (calculator `js/multa-calc.js`), `blog/libro-de-reclamaciones-virtual-gratis-indecopi.html`. Drafts + fact-checks applied. Browser QA at 1280 and 375 px clean.
- Outreach drafts: `libro-reclamaciones-study/outreach.md` (nothing sent).
- Open: Jan's meaning of "KEO" (built as GEO/AEO); Jan's sample read of the Spanish; deploy + IndexNow (his yes).
