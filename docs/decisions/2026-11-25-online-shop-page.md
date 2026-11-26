# MontaWeb gets a /tiendas-virtuales page that sells the existing shop plans
Date: 2026-11-25 · Status: decided

## Context
"tienda virtual" (1,900 a month in Peru) and "diseño de tiendas virtuales" (480, kom.pe ranks #1) are among the biggest generic keywords in `docs/research/keywords/2026-11-25-industry-landing-keywords.md`. The brief assumed MontaWeb sells no shops, but `/servicios` already sells Tienda Starter (S/ 299) and Tienda Pro (S/ 499). Jan said yes to a dedicated page.

## Decision
- Build `/tiendas-virtuales` (Peru-wide), with the prices and scope from `/servicios`, unchanged:
  - Tienda Starter **S/ 299**: up to 20 products, cart, order sent to WhatsApp, Yape/Plin by QR, no payment gateway.
  - Tienda Pro **S/ 499**: up to 60 products, categories, card payments through Culqi or Mercado Pago, shipping zones.
  - Catálogo WhatsApp **S/ 59**: the lighter option with no cart.
- Hosting + SSL included in year 1 (`2026-11-25-hosting-first-year-included.md`).
- The page must not promise anything the plans don't include: no stock or inventory system, no courier integration, no electronic invoicing, no marketplace sync.
- Primary keywords: "tienda virtual", "diseño de tiendas virtuales". Secondary: "tienda online" and "crear tienda virtual".
- Linked from `/servicios#tienda-online`, `/diseño-de-paginas-web` and the footer's "Tiendas online" link.

## Why
The plans and prices already exist, so this is a page, not a new product. Almost no Lima agency gets search traffic, and kom.pe is the only one ranking for shop design.

## Consequences / next steps
- es-PE text written by Opus following the Humanizer; Jan reads a sample.
- If the shop scope or prices change on /servicios, update this page in the same commit.
