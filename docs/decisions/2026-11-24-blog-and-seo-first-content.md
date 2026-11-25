# MontaWeb gets a blog; content is SEO-first, with the Lima web study as the flagship
Date: 2026-11-24 · Status: decided

## Context
We ran original research on Lima small businesses: 19,168 businesses, 30 business types, all 5 zones (`docs/research/lima-web-census/`). The first draft was plain text, and Jan rejected that. An article that doesn't rank or earn links is worthless to the agency.

## Decision
- montaweb.pe gets a `/blog` section with a "Blog" entry in the main nav. Each post is a static page under `/blog/<slug>`.
- The Lima web study (`/blog/estudio-web-negocios-lima-2026`) is the flagship piece. Its job is to earn links (media, chambers of commerce, universities).
- Commercial traffic comes from a cluster of supporting pages per business type or buyer question. Each one carries its local stat and links to and from the study.
- Every content piece is planned with:
  - keyword research
  - full on-page SEO and JSON-LD
  - verified authoritative citations
  - licensed real Lima photos
  - interactive figures
  - a mid-article promo and a final CTA
  - a backlink outreach plan
- Outreach is never sent without Jan's yes.

## Why
Original local data is linkable, and generic agency copy is not. Rankings need both the authority the links bring and pages that match how Peruvians actually search.

## Consequences / next steps
- Build plan: `.devkit/plans/2026-11-24-blog-lima-web-study.md`.
- Then pick the cluster pages and keywords.
- Then choose which demo sites to build, from `proven_demand_no_site` in `data/by_category_active.csv`.
- The rule also lives in the global CLAUDE.md, under "Content and articles".
