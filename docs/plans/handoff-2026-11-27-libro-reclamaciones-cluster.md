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
