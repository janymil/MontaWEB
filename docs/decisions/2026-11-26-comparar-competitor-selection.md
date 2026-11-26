# /comparar compares MontaWeb with KOM, Hosting Perú, Bersoft, Glob Digital, Monstruo Creativo, Izipay web and Wix
Date: 2026-11-26 · Status: decided (Jan approved the list on 2026-11-26; quotes still need a Lima-browser check and evidence before publishing)

## Context
The first /comparar set (decision 2026-11-25-competitor-comparison-pages.md) used six providers picked only because they publish soles prices. Their size and reputation were never checked. Jan wants established, known names that build credibility and bring search traffic. Research: docs/research/2026-11-26-comparar-competitor-selection.md (25 candidates scored on Peru search data, Maps reviews, SUNAT start dates, domain authority and published facts).

## Decision
- **Keep:** KOM, Hosting Perú, Bersoft (price comparison).
- **Add:** Glob Digital, Monstruo Creativo (price comparison), and Izipay web (soles price, comparing "do it yourself" with "done for you").
- **Add, facts only:** Wix, with Shopify, Hostinger and GoDaddy as one short "builders" section. They show only foreign currency in Peru, so no amounts.
- **Drop:** Nubix, Kozma 360, TalentuPeru. None has a legal name or RUC on its site, and Nubix has no real clients yet. 301 their pages to /comparar and keep their sealed evidence for 5 years.
- **Agencies that only quote** (Staff Digital/Creativa, Onza, Dextra, Bahía Creativa, Tres): no named pages. Instead, one generic guide on what to ask when an agency sends a quote, with MontaWeb's published answers.

## Why
- Lima has no well-known small-business web agency. Brand searches for every agency are ≤ 260 a month.
- Real search demand and recognition sit with the platforms (Wix, Shopify, Hostinger, GoDaddy, Izipay).
- Among agencies, the most credible comparisons are firms that are real (a RUC), reviewed (50–136 Maps reviews) and publish soles prices we can quote and prove (D. Leg. 1044 arts. 8, 11, 12).
- Anonymous sellers add no credibility.
- Naming quote-only firms adds legal risk with nothing comparable to show.

## Consequences / next steps
- After Jan approves:
  - read every quote in a Lima browser (the research data came through a summariser)
  - fill the gaps: Glob Digital's RUC, Monstruo's IGV basis, the Izipay price page
  - run the evidence capture
  - update scripts/compare/competitors.mjs, the redirects, sitemap and llms.txt
- docs/COMPARATIVA.md needs a "facts-only" rule for the Wix page.
- The Spanish copy for the new pages and the guide follows the non-English text rules.
- 2026-11-25-competitor-comparison-pages.md is partly superseded: its list of six is replaced; its rules still apply.
- **Status 2026-11-25 (Lima):**
  - Implemented in the repo, not committed or deployed.
  - Quotes were checked in the browser and captured in `docs/evidence/comparar/2026-11-25-3/` (not sealed yet).
  - Glob Digital RUC: 20600593740. Monstruo's IGV basis is not stated, so it is marked "no figura". Izipay's legal name was not found.
  - GoDaddy shows S/ prices from Lima, which contradicts the "dollars only" premise. It stays in the Wix builders list without amounts; moving it to a price page needs a new decision.
  - The server Caddyfile redirect for the dropped pages is still pending Jan's yes.
