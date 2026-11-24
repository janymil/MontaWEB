# The editorial design system covers every public MontaWeb page
Date: 2026-11-23 · Status: decided

## Context

The first redesign only covered the homepage, producing a disconnected experience when visitors followed links. The owner also identified that its 6–12px supporting text was too small to read comfortably.

## Decision

Use the warm paper, ink, tangerine, chartreuse, and sky editorial system across all 12 public site documents. Share navigation, footer, typography, controls, cards, forms, CTAs, and responsive behavior through `css/site.css` and `js/site.js`. Preserve existing page content, SEO, prices, form handlers, and business workflows. Body copy is 16–18px, supporting copy 14–16px, and controls 15–16px; smaller text is limited to decorative mock browser chrome.

## Why

A website must feel like one product at every step. A shared system removes design discontinuity and future maintenance drift, while a readable type scale makes the design usable rather than merely attractive.

## Consequences / next steps

- `css/home.css` retains homepage layout-specific rules; `css/site.css` is loaded last to enforce shared typography and secondary-page layouts.
- Existing stand-alone articles, downloadable documents, and instant redirects remain independent.
- Browser checks must include every public document and all existing interactive workflows.
