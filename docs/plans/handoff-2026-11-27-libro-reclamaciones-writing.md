# Handoff: Libro de Reclamaciones data study, writing and publishing phase
2026-11-27 · MontaWeb main checkout, branch main, no worktree · Uncommitted changes: yes (research and plan files below; other sessions also have uncommitted files here, so commit only your own)

## Goal (what done looks like)
A published es-PE flagship study plus its cluster pages, following step 6 onward of `docs/plans/2026-11-27-libro-reclamaciones-study-plan.md`: the finding, the law by type of site, real fines, how to add the link, and a B2C box. Charts, full on-page SEO, CTA, an outreach plan (nothing sent), the `./verify.sh` gate passing, and Jan reading a sample of the Spanish.

## Done so far
- Decision (decided): `docs/decisions/2026-11-27-libro-reclamaciones-web-study.md`
- Plan, with the verified facts table and the step 1–4 results: `docs/plans/2026-11-27-libro-reclamaciones-study-plan.md`
- Data:
  - Headline: **699/2,399 = 29.1%** of independent Lima business sites link a libro on the home page.
  - By segment: presentation 19.6%, bookings and orders 26.9%, shops 54.4%.
  - Active businesses (5+ reviews) 34.2%; the rest 20.0%.
  - Wix 15%, Shopify 69%.
  - About 80% of the links are in the footer.
  - Aggregates: `docs/research/lima-web-census/data/libro-probe-summary.{json,csv}`
  - Per-site, private: `docs/research/lima-web-census/private/libro-probe.csv`
  - Hand check: `docs/research/lima-web-census/private/libro-handcheck-sample.csv`
- Scripts:
  - `scripts/libro-reclamaciones-probe.py` (pass `--resample` to regenerate the hand-check sample, which otherwise stays untouched)
  - `scripts/libro-reclamaciones-render.js` (Node Playwright from the npx cache; Python Playwright is not installed)
- Census method: `docs/research/lima-web-census/README.md`

## Next steps
1. Spot-check the 23 rows tagged `location=image_link` in `private/libro-probe.csv`. Some go to amazon.com or instagram.com and may be false positives. Fix the probe and rerun if needed.
2. Remaining facts:
   - the Yape/BCP Sala resolution number (not in public sources; try Indecopi's resolution search);
   - whether Tu Libro de Reclamaciones stores complaints (look at it in a browser);
   - open the PDFs for Junín 206-2026 and BBVA Puno 044-2026.
3. Cluster keyword research (DataForSEO via `scripts/keywords/dfs.py`, Peru 2604, ~USD 0.15). Save the raw files to `docs/research/keywords/2026-11-27-libro-*.json`.
4. Writing (opus only):
   - es-PE, following the language rule in the global CLAUDE.md;
   - Humanizer (`~/.claude/skills/writing/references/humanize.md` plus `humanize-scan.mjs`);
   - the writer gets only the purpose, the reader and the facts, never an English template;
   - read the repo's es-PE rules or mistakes log first, if one exists.
5. Build the pages (delegate to sonnet). Run the `modern-web-guidance` skill first. Follow the existing blog page pattern (`blog/prefijo-500-llamadas-comerciales.html`, `blog/estudio-web-negocios-lima-2026.html`) and decision `2026-11-26-blog-indexing-and-internal-links.md`.
6. The URL checker in `api/`: only if Jan says it belongs in v1, and with its own plan first.
7. Outreach plan; send nothing.
8. QA: check the rendered page for duplicated or invisible text, run `./verify.sh` and `npm test`.

## Gotchas
- Never claim a 2026 wave of fines against websites, that the new reglamento is in force (RM 244-2026-PCM is a draft), or the Yape resolution number.
- The only primary website fine is Res. 0226-2022/SPC (1.24 UIT for no libro, 0.58 UIT for no aviso). BBVA 5 UIT was for denying the physical libro in a branch, not a website case.
- UIT 2026 = S/ 5,500 (DS 301-2025-EF).
- Mention Indecopi's free tool honestly.
- No business names in public output.
- No meta-comments or disclaimers on the public page (global rule).
- A subagent brief that told the agent to get around sites blocking automated fetches was refused by the auto-mode check. Use public pages only.
- Don't touch `*lima-call-study*` or `*ai-recommends-lima*` files (other sessions).

## Open questions for Jan
- Name LibroDigital in the article, or only say "nuestro libro virtual"?
- Is the URL checker in scope for v1?
- SUNAT DS 058-2026-EF: the no-go research is in `docs/research/2026-11-27-sunat-ventas-redes-ds-058.md`, but not yet recorded as a decision. Record it?
