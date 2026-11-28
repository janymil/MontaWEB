# Plan: "¿Tu web tiene Libro de Reclamaciones?", a Lima data study
Date: 2026-11-27 · Decision: `docs/decisions/2026-11-27-libro-reclamaciones-web-study.md` (proposed)

## Verified facts (fact-check 2026-11-27)
| Fact | Source | Use |
|---|---|---|
| Res. 0226-2022/SPC-INDECOPI (Exp. 0189-2019/CPC-INDECOPI-AQP, Maquisistema): an informative site with no sales was fined 1.24 UIT for no libro, 0.58 UIT for no aviso and 1 UIT for non-compliant hojas | Primary PDF via lpderecho.pe, signed 09.02.2022 | Main case. Say it is from 2022. |
| Reglamento art. 9: an "aviso fácilmente identificable en la página de inicio" with a link to the virtual libro (Anexo III) | Quoted in 0226-2022 | Legal duty for the home page |
| Ley 32495 (El Peruano, 11 Nov 2025): arts. 150/151 add "toda plataforma digital de comercio electrónico" and require a permanent visible link | busquedas.elperuano.pe 2457203-1 | Online shops |
| Sala, Yape/BCP (Gestión, 5 Aug 2026): sites that "promocionan productos o servicios y fomentan relaciones de consumo" are covered; complaint declared fundada, no fine | Gestión | Recent signal. **Number still missing.** |
| Draft RM 244-2026-PCM (18 Jul 2026): a visible "Libro de Reclamaciones" link on the home page, covering web, apps and social media | El Peruano 300583; Rubio Leguía | Only as "proyecto". Re-check before publishing. |
| Art. 110: leve up to 50 UIT, grave up to 150 UIT, muy grave up to 450 UIT; caps for micro (10% of income) and small firms (20%); amonestación possible | Ley 29571 | Fine scale. No inflated "desde 1 UIT". |
| Real 2026 fines: Indecopi Junín 0.50 UIT (colegio); BBVA S/ 27,500 | LP Derecho, Gestión (PARTLY) | Open the PDFs first |
| Free tool "Tu Libro de Reclamaciones" (Indecopi, Nov 2025) | gob.pe news 1296574 | Must be mentioned. Test the URL. |

**Step 1 results (2026-11-27, second fact-check):**
- Yape/BCP: the resolution number is still NOT FOUND. The case started in 2024 and was decided under the rules before the reform. Res. Final 2002-2026 CC2 is a first-instance decision that may or may not be this case, so do not cite it.
- BBVA: one case, not two. Res. Final 044-2026/CPC-INDECOPI-PUN (21-05-2026) confirmed 5 UIT (S/ 27,500) for denying the physical libro in a branch (art. 152). It is not a website case.
- Junín 206-2026: a colegio was fined 0.50 UIT for having no libro, plus 1.55 UIT for another breach (search snippet only, the PDF still needs opening).
- UIT 2026 = S/ 5,500, DS 301-2025-EF (El Peruano 17-12-2025). VERIFIED.
- Tu Libro: it generates the hoja and the aviso. Whether it stores complaints is unclear. Check it in a browser.
- Gestión 11-11-2025: Indecopi "supervisará" that e-commerce platforms keep a visible link. No figures.
- RM 244-2026-PCM is still a draft. It would repeal Anexo III (the standard aviso format). No final DS was found.

Do not claim: a 2026 wave of Indecopi fines against websites, that the new reglamento is in force, or the Yape resolution number.

## Steps
1. **Missing facts (sonnet):** find the Yape/BCP resolution number in Indecopi's resolution search, open the 2026 fine PDFs, test the Tu Libro URL, and confirm the UIT 2026 value in El Peruano.
2. **Fix the probe (sonnet):** `scripts/libro-reclamaciones-probe.py` today matches the word "reclamaciones" anywhere in the HTML, and it misses sites rendered by JavaScript.
   - Count a site only when there is a link (`<a>` whose text or href matches the libro, or links to librodigital, Tu Libro, reclamavirtual, claimbook and similar), and record where it sits (header, footer, body).
   - Render sites that return little HTML with Playwright.
   - Save per-site results to `docs/research/lima-web-census/data/libro-probe.csv`, with no business names in the public output.
3. **Full run** on all functional own-domain independent sites (~3,500), split by segment (presentación / reservas / tienda), zone, category and shop-like vs not. Also record which provider the link goes to.
4. **Hand check (Jan or opus):** 50 random sites, 25 yes and 25 no. The error rate must be under 5%, or fix the probe and run again.
5. **Go/no-go on the numbers to Jan.** If the share with a link is high (>60%), the story changes ("most comply"). Report that and wait.
6. **Writing (opus, es-PE, global language rule + Humanizer):**
   - Flagship: `/blog/libro-de-reclamaciones-web-estudio-lima` (working slug). Contents: the finding, what the law says by type of site, the real fines, how to add the link (Indecopi's free tool, LibroDigital, our sites), and a B2C box on how to complain on a website.
   - Support pages (cluster): "¿Mi página web necesita libro de reclamaciones?", "Libro de reclamaciones virtual para tienda online" (linked from /tiendas-virtuales), "Multa por no tener libro de reclamaciones".
   - Interactive: a checker where the visitor enters a URL and sees whether a libro link is found. It runs server-side in `api/` and gets its own plan before any code. Plus charts by segment and zone.
   - SEO: keyword research for the cluster (DataForSEO, ~USD 0.15), meta, OG image, JSON-LD (Article + Dataset), sitemap, blog index, internal links, IndexNow.
   - Promo mid-article (MontaWeb site with the libro included) and a CTA at the end. Real licensed photos.
7. **Outreach plan:** Gestión (author of the Yape piece), LP Derecho, Infomercado, consumer-law firms, gremios (PRODUCE, Cámara de Lima). Send nothing without Jan's yes.
8. QA: the rendered page has no duplicated or invisible text, the gate `./verify.sh` passes, and Jan reads a sample of the Spanish.

## Results of steps 2–4 (2026-11-27)
- Population: 2,586 functional independent own-domain hosts (3,503 was the number of rows before dedup). Excluded: ERR 101, UNKNOWN_JS 86.
- First run: 677/2,398 = 28.2%. Hand check of 50 sites: YES precision 23/25 (2 unclear, 0 wrong); 2 of 25 NO were misses, both image-only links to a Google or Microsoft form. Fixed by matching `<a><img>`.
- **Second run (final): 699/2,399 = 29.1%** link a libro on the home page. Presentation 19.6%, bookings and orders 26.9%, shops 54.4%. Shop-like 38.9% vs 22.7%. Active (5+ reviews) 34.2% vs 20.0%. Footer holds about 80% of the links. Wix 15%, Shopify 69%. MENTION_ONLY (text, no link) 32.
- DONE 2026-11-27: image_link spot check removed 11 false positives (`--recheck-image-links`). **Final: 688/2,399 = 28.7%**; P 18.9%, C 26.6%, E 54.2%; active 33.9% vs 19.3%; Wix 14.8%, Shopify 71.0%; footer 78.5%.
- (old note) Before publishing, spot-check the 23 `image_link` rows. Some go to amazon.com or instagram.com and may be false positives. Worst case the share drops to about 28.5%, and the headline still holds.
- Files: `scripts/libro-reclamaciones-probe.py`, `scripts/libro-reclamaciones-render.js`, `docs/research/lima-web-census/data/libro-probe-summary.{json,csv}`; per site (private): `private/libro-probe.csv`, `private/libro-handcheck-sample.csv`.
- **Verdict on the numbers: go.** About 7 in 10 independent Lima business sites show no link, and 4 in 5 presentation sites. The story holds.

## Open questions for Jan
- ANSWERED 2026-11-27: name LibroDigital. No new checker; use the existing https://librodigital.pe/revisar-mi-web/.
