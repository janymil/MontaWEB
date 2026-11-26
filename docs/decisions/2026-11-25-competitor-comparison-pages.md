# /comparar compares MontaWeb with six Lima web providers, using only dated, quoted facts
Date: 2026-11-25 · Status: proposed (Jan reads a sample and approves before deploy) · competitor list superseded by 2026-11-26-comparar-competitor-selection.md (rules still apply)

## Context
Jan asked for a professional comparison of MontaWeb and its competitors, built like MiCita's /comparar (Washington: /var/www/micita/docs/COMPARATIVA.md). An earlier informal table had two errors: "Go Negocio" (gonegocio.pe does not exist and gonegocio.net publishes no prices) and Bersoft "landing S/ 199" (its cheapest plan is S/ 300). The homepage calculator also showed an unsourced "Otras agencias S/ 550–1,400 / ¡Ahorras…!" range.

## Decision
- Public pages: /comparar (hub, one table) and /comparar/<slug> for Bersoft, Hosting Perú (hosting.com.pe), KOM, Kozma 360, Nubix and TalentuPeru, which are Lima providers that publish prices in soles. Alphabetical order.
- Dropped: Go Negocio, Daniel Figueroa (only "desde" prices), Hazcrecertunegocio (no delivery terms; can be added later), Izipay web (price seen only on its home page), Wix/Hostinger/Shopify (no soles price; Shopify in USD). DIY builders get one short hub section with no amounts.
- Same rules as MiCita: quotes only, the tax basis as published, no foreign currency, no logos, no superlatives or "ahorras", "No figura en su página" instead of ✘, a trademark note and a correction email.
- The calculator keeps only MontaWeb's price and links to /comparar.

## Why
Comparative advertising in Peru must be truthful, objective and verifiable (D. Leg. 1044 arts. 8, 11, 12), and MontaWeb carries the burden of proof. Unsourced market ranges are the riskiest claim on the site.

## Consequences / next steps
- Monthly re-check, and before/after every change to these claims: the evidence capture in docs/COMPARATIVA.md (competitors, our own claims, archive.org, RFC 3161 timestamps, Washington + R2 `montaweb/comparar/<date>/`), then update `VERIFIED_ON`, rebuild and run `npm test`. The test fails after 45 days without a re-check, and the page hides the table on its own.
- Evidence matches MiCita's method (parity table in .devkit/plans/2026-11-25-comparar-evidence.md). First sealed set: 2026-11-25, taken after the pages went live that day.
- Details: docs/COMPARATIVA.md, plan .devkit/plans/2026-11-25-compare-pages.md, facts docs/research/2026-11-25-competitor-facts.md.
