# Which companies /comparar should compare MontaWeb with

Date: 2026-11-26 (data gathered 2026-11-25). Decision draft: `docs/decisions/2026-11-26-comparar-competitor-selection.md`.
Builds on `docs/research/2026-11-25-competitor-facts.md` (prices of the current six) and the rules in `docs/COMPARATIVA.md`.

## One-screen summary (for Jan)

- **Lima has no "famous" web design agency for small businesses.** The search results for "diseño de páginas web lima" and similar searches are spread over 150+ small domains and directories. The well-known agencies (Staff Creativa, Tres, Onza, Bahía Creativa) work on quotes only and sell to larger clients (Staff Creativa's Clutch minimum is $5,000).
- **People in Peru barely search for agency names.** The highest is "staff digital" with 260 searches a month. KOM gets 210, and every other agency gets under 150. Real search volume is on platforms: Shopify 40,500, Wix 33,100, Hostinger 33,100, GoDaddy 27,100, "izipay web" 880, "pagina web wix" 880.
- **Backlink value is close to zero.** Compared companies never link to a comparison page. The value is credibility and long-tail search traffic. montaweb.pe has 0 referring domains today, so it can only rank for low-competition searches ("kom precios", "izipay web opiniones"), not for "wix" or "hostinger".
- **Recommended list (7):** KOM, Hosting Perú, Bersoft (keep); Glob Digital, Monstruo Creativo, Izipay web (add, with prices); Wix (add, facts only, no prices, with Shopify, Hostinger and GoDaddy as a short "builders" section). One generic page, with no names, on what to ask when an agency only sends quotes.
- **Drop Nubix, Kozma 360 and TalentuPeru.** None shows a legal name or RUC. Nubix says it has no real clients yet. Comparing against anonymous sellers adds no credibility and is hard to defend if one of them complains.
- **Before any of this goes live:** read every quote in a Lima browser (all facts below came through a summarising fetcher), then run the evidence capture per `docs/COMPARATIVA.md`.

## Method and sources

| Signal | Source | Notes |
|---|---|---|
| Who is visible | DataForSEO Google SERP, Peru (location 2604, es), top 30 for 8 searches: "diseño de paginas web lima", "agencia de diseño web lima", "empresa de diseño web en lima", "paginas web lima", "agencia de marketing digital lima", "precio pagina web peru", "mejores agencias de diseño web en lima", "diseño web peru" | 2026-11-25. Result: 150+ distinct domains, no domain in more than 4 of 8 searches except directories (themanifest, agencias.marketing, sortlist). |
| Google Maps reviews | DataForSEO Google Maps, Lima centre, top 60 for "agencia de diseño web", "diseño de paginas web", "agencia de marketing digital" | Rating and review count as shown on Maps. |
| Search demand | Google Ads search volume, Peru, es (DataForSEO), monthly average | `<brand>`, `<brand> precios`, `<brand> opiniones`. Empty = below Google's threshold (≈ <10). |
| Domain authority | DataForSEO Backlinks: domain rank (0–100) and referring main domains; Labs: estimated Peru organic traffic (ETV) | Free tools (Moz/Ahrefs) need a login or CAPTCHA, so I used the paid API we already have (~USD 0.35 total). |
| Size, RUC, listings, published facts | Sonnet subagents read each company's own pages and SUNAT mirrors (datosperu.org, universidadperu.com), plus Clutch/Sortlist/DesignRush snippets | All page text came through WebFetch's summariser, so every quote needs a check in a browser. Full notes: side-session notes folder `facts-*.md`. Platforms were re-checked from the built-in browser on the Lima PC. |

Raw data (not committed): scratchpad `serp-agencies.json`, `maps.json`, `domain-metrics.json`, `brand-volumes.json`.

## Scored table

Each criterion scored 0–3. Weights: Provable ×3 (we can only publish what their page says), Established ×2, Reputation ×2, Demand ×2, Same buyer ×2, Authority ×1. Max 36.

- **Established:** RUC start date (SUNAT mirror) and a real legal entity. 3 = 10+ years; 0 = no entity found.
- **Reputation:** Google Maps reviews, Clutch, Sortlist, DesignRush.
- **Demand:** Peru monthly searches for the brand. 3 ≥ 800; 2 = 150–800; 1 = 30–150; 0 = less.
- **Authority:** domain rank and referring domains.
- **Provable:** soles prices plus terms on their own page = 3. Some soles facts = 2. Facts only, or a foreign currency = 1. Quote-only = 0.
- **Same buyer:** sells websites to Lima small businesses, as MontaWeb does.

| # | Company (domain) | RUC start | Maps reviews | Brand searches/mo | Rank / ref. domains / PE traffic | Published facts | E | R | D | A | P | S | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | KOM (kom.pe) | 2019-05-17 | 89 (5.0); DesignRush 79 | 210 ("kom agencia digital") | 53 / 715 / 2,615 | Soles prices + IGV basis, delivery, renewal, guarantee | 2 | 3 | 2 | 2 | 3 | 3 | **31** |
| 2 | Hosting Perú (hosting.com.pe) | 2008-03-25 | — | 2,900 ("hosting peru", generic) | 34 / 365 / 836 | Soles with IGV, delivery, years of hosting | 3 | 1 | 2 | 1 | 3 | 3 | **28** |
| 3 | Izipay web (izipay.pe) | Izipay S.A.C. (RUC 20603235780) | — | 880 ("izipay web"); 40,500 ("izipay") | 41 / 391 / 7,483 | "S/49.00" per month "Incl.IGV" (home page only); Wix-based, domain "por promoción" | 3 | 2 | 3 | 2 | 2 | 2 | **28** |
| 4 | Wix (wix.com) | foreign | — | 33,100; "pagina web wix" 880 | 89 / 1.57 M / 55,527 | US$ only, even from Lima ("Los precios no incluyen los impuestos…"); facts: domain free 1 year, 14-day refund, Spanish support | 3 | 3 | 3 | 3 | 1 | 1 | **26** |
| 5 | Shopify | foreign | — | 40,500 | 96 / 2.8 M / 40,320 | USD only; 2% fee with external payment providers | 3 | 3 | 3 | 3 | 1 | 1 | **26** |
| 6 | Bersoft (bersoft.pe) | 2020-12-16 | 50 (5.0) | 30 | 40 / 21 / 15 | Soles with IGV, plans, delivery (inconsistent), "único dueño" | 1 | 2 | 1 | 1 | 3 | 3 | **24** |
| 7 | Glob Digital (globdigital.pe) | not found | 136 (4.9) | 50 | 62 / 256 / 137 | "desde los S/1,000.00 +IGV", domain + hosting + SSL, 1 year of support | 1 | 3 | 1 | 2 | 2 | 3 | **24** |
| 8 | GoDaddy | foreign | — | 27,100 | 84 / 5.5 M / 58,430 | USD by default; PEN only through a currency selector | 3 | 2 | 3 | 3 | 1 | 1 | **24** |
| 9 | Monstruo Creativo (monstruocreativo.com) | 2022-08-01 | 50 (4.9) | 90 | 56 / 107 / 24 | Emprendedor "S/ 1,200.00" (IGV basis not stated), domain + hosting year 1, delivery (inconsistent) | 1 | 2 | 1 | 2 | 2 | 3 | **22** |
| 10 | Hostinger | foreign | — | 33,100 | 82 / 107 k / 12,458 | No Peru page (404); the Spanish page shows euros | 3 | 2 | 3 | 3 | 0 | 1 | **21** |
| 11 | Kozma 360 (kozma360.com) | no entity found | DesignRush 8 | — | 0 / 34 / 0 | Soles prices with IGV | 0 | 1 | 0 | 0 | 3 | 3 | **17** |
| 12 | Bahía Creativa (bahiacreativa.pe) | 2014-11-01 | 49 (5.0) | — | 57 / 129 / 30 | Quote only; "3 y 4 semanas" | 3 | 2 | 0 | 2 | 0 | 2 | **16** |
| 13 | Tiendada (tiendada.com) | not found ("Simplistic SaaS") | — | 1,600 | 46 / 1,253 / 61,434 | USD, "Precio sin IGV/IVA" | 1 | 1 | 3 | 1 | 1 | 1 | **16** |
| 14 | Staff Digital (staffdigital.pe) | not found | — | 260 | 64 / 2,056 / 350 | Quote only; counters show "+ 0" | 2 | 1 | 2 | 3 | 0 | 1 | **15** |
| 15 | NetSolution (netsolution.pe) | 2011-08-22 | 104 (4.8) | — | 36 / 290 / 169 | Hosting only, no web design price | 3 | 3 | 0 | 1 | 0 | 1 | **15** |
| 16 | Staff Creativa (staffcreativa.pe) | 2005-05-31 | 22 (4.3) | 140 | 61 / 583 / 89 | Quote only; Clutch minimum $5k | 3 | 1 | 2 | 2 | 0 | 0 | **14** |
| 17 | Onza (onzamarketing.com) | not found | 104 (4.9); Sortlist 10 | — | 54 / 208 / 194 | Quote only; offices in 5 countries | 2 | 3 | 0 | 2 | 0 | 1 | **14** |
| 18 | Dextra (dextra.pe → dextrastudio.com) | not found | 128 (5.0) | — | 58 / 118 / 0 | Quote only | 1 | 3 | 0 | 2 | 0 | 2 | **14** |
| 19 | Index (index.pe) | 2017-01-13 | — | — | 57 / 506 / 6 | Prices in US$ (cannot be quoted) | 2 | 0 | 0 | 2 | 1 | 2 | **13** |
| 20 | TalentuPeru (talentuperu.com) | no entity found | — | — | 58 / 102 / 2 | Soles + IGV; no terms, privacy or complaints book | 0 | 0 | 0 | 1 | 2 | 3 | **13** |
| 21 | Hazcrecertunegocio | not found | — | — | 56 / 194 / 0 | Soles with IGV; no delivery terms | 0 | 0 | 0 | 1 | 2 | 3 | **13** |
| 22 | Nubix (nubix.pe) | no entity found | — | 720, probably not this company | 0 / 8 / 6 | Soles prices; site says it has no real clients yet | 0 | 0 | 0 | 0 | 2 | 3 | **12** |
| 23 | Tres / Tresmedia (tres.pe) | 2011-02-24 | DesignRush 3.5 | — | 44 / 277 / 54 | Quote only; large clients | 3 | 1 | 0 | 1 | 0 | 0 | **9** |
| 24 | Linklab (linklab.pe) | not found | 58 (5.0) | — | 22 / 32 / 25 | Site unreachable on 2026-11-25 | 0 | 2 | 0 | 1 | 0 | 2 | **9** |
| 25 | Agencia MK (agenciamk.com) | not found | — | 50 | 53 / 261 / 55 | Quote only | 0 | 0 | 1 | 2 | 0 | 1 | **6** |

Screened out without scoring:
- Not a Lima agency: MD Marketing Digital (Argentina), ToGrow (Medellín), Lemon Digital (Colombia).
- No working business site: Centro Digital de Marketing. Its site is an empty WordPress install, despite 393 Maps reviews.
- No Peru site: Tiendanube (shows ARS), Jumpseller.

For scale: montaweb.pe itself has rank 0 and 0 referring domains.

## Recommendation: 7 companies

| Company | Page type | Why |
|---|---|---|
| **KOM** (keep) | Full price comparison | Highest score. A real company since 2019, 89 Maps reviews, the most organic traffic of any Lima agency we checked, and complete published terms. "kom agencia digital" gets 210 searches a month. |
| **Hosting Perú** (keep) | Full price comparison | Oldest RUC (2008), its "19 años" claim matches, and prices include IGV. Its name matches a generic search ("hosting peru", 2,900 a month), which helps a page rank. |
| **Bersoft** (keep) | Full price comparison | Same buyer and same price range as MontaWeb, with 50 Maps reviews. Its "17 años / desde 2009" claim does not match its RUC (16-12-2020). We never repeat their self-claims anyway, so just make sure the page does not. |
| **Glob Digital** (add) | Price comparison, one row | 136 Maps reviews (4.9), the most of any working Lima agency with published prices, and it targets pymes. Only one price is published ("desde S/1,000.00 +IGV"), so compare that and its listed inclusions. RUC not found: get it before publishing. |
| **Monstruo Creativo** (add) | Price comparison | 50 reviews (4.9), a soles price (Emprendedor S/ 1,200.00) and a small-business plan. The IGV basis is not stated, so show "No figura en su página". Delivery days and years claims contradict each other on its own site, so quote one dated sentence or leave delivery out. |
| **Izipay web** (add) | Price comparison, "do it yourself" vs "done for you" | The only platform with a soles price including IGV ("S/49.00" per month). It is a Peruvian payment brand with high search interest ("izipay web" 880 a month). The price appears only on the home page, so read it in a Lima browser and capture it before use. |
| **Wix** (add) | Facts only, no amounts | Wix shows only US$ in Peru, so amounts are out under our rule. Its published facts can be compared: you build it yourself, domain free for 1 year, 14-day refund, Spanish support. It gets the most search volume of any platform, and Izipay web runs on it. Shopify, Hostinger and GoDaddy go in one short "builders" section on this page, with no amounts, instead of a page each. |

### The current six: keep or drop

| Company | Verdict | Reason |
|---|---|---|
| KOM | **Keep** | See above. |
| Hosting Perú | **Keep** | See above. |
| Bersoft | **Keep** | See above. Recheck its legal name: one mirror gives "Bersoft Importaciones Informáticas EIRL", with retail computer sales as its main activity. |
| Nubix | **Drop** | No legal name, RUC, address or complaints book on the site. It says it has not published real clients yet, and its terms are dated Jul 2026. A comparison against it adds no credibility. |
| Kozma 360 | **Drop** | Brand only, no legal entity. Its project counts contradict each other, and its client logos (Mattel, DirecTV, Etsy) are doubtful. |
| TalentuPeru | **Drop** | Anonymous: no RUC, terms, privacy policy or complaints book, and its prices exclude IGV. |

Dropping three pages means 301 redirects from `/comparar/nubix`, `/comparar/kozma-360` and `/comparar/talentuperu` to `/comparar`. Keep their sealed 2026-11-25 evidence (art. 51: 5 years).

## Agencies that publish no prices

Staff Digital/Creativa, Onza, Dextra, Bahía Creativa and Tres are the most established names, but they work on quotes only. There is nothing to compare on price, and few published facts (no delivery time, no ownership terms).

Proposed format: **one guide page, with no company names**: what to ask any agency that only sends a quote. It covers:
- the total with IGV, and what is one-time versus yearly
- who owns the domain, the hosting account and the files
- the renewal price from year 2
- delivery time in working days and from when it counts
- how many rounds of changes
- what happens if you leave

Each question shows MontaWeb's published answer next to it. This builds credibility without the legal risk of naming a firm whose offer we cannot show. It also targets long-tail searches like "cuanto cuesta una pagina web en peru", where the results are full of price guides. The Spanish copy must go through the non-English text rules (opus writer, humanizer, Jan reads it).

Name a quote-only firm on its own page only if both hold:
- people search for it (≥ ~150 a month; today only Staff Digital, 260)
- its site states at least 3 comparable facts (delivery, ownership, inclusions)

Staff Digital fails the second test today.

## Open items before implementation
1. Every quote above came through a summariser. Read each source page in a browser on the Lima PC, then run `compare-evidence.mjs` for the new sources.
2. Get the RUC for Glob Digital and Monstruo's IGV wording. Find the Izipay web price on a page other than the home page, or capture the home page.
3. Wix: capture `es.wix.com/pricing` from Lima for the facts used, and quote none of the US$ amounts.
4. The trademark note covers new names. Platform brand-use terms were not checked, so check them before the Wix page.
5. Update `docs/COMPARATIVA.md` "Adding a competitor". Today it requires a Lima provider with soles prices, which a facts-only Wix page breaks, so the rule needs a facts-only variant.
