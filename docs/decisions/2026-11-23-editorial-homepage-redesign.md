# MontaWeb homepage uses an interactive editorial-studio design
Date: 2026-11-23 · Status: superseded by 2026-11-23-site-wide-editorial-design.md

## Context

The owner requested a fresh, modern, innovative redesign without being influenced by the current visual design. The site is static HTML/CSS/JavaScript and its Spanish-language business content, pricing, and conversion routes are already established.

## Decision

Use a warm paper, ink, tangerine, and chartreuse visual system with expressive serif/sans typography, asymmetric compositions, real project imagery, and restrained motion. The homepage leads with an interactive portfolio preview, then explains services, plans, process, and FAQs. New homepage styles and scripts are isolated in `home.css` and `home.js` so existing secondary pages keep working.

## Why

The direction makes a web-design service visible rather than abstract, differentiates MontaWeb from generic gradient-led agency sites, and gives visitors useful interactions instead of decorative complexity. Isolation limits regression risk across the multi-page static site.

## Consequences / next steps

- Keep business claims, prices, company details, and WhatsApp links aligned with existing pages.
- Preserve semantic HTML, keyboard operation, reduced-motion support, and responsive behavior.
- A future phase can apply the same design language to secondary page content deliberately rather than through risky global overrides.
