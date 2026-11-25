# MontaWeb measures with GA4 (+ Meta Pixel later) only after cookie consent; montaweb.pe without www is the one canonical host
Date: 2026-11-25 · Status: decided

## Context
An SEO/trust audit found: www served a duplicate site, /index duplicated the homepage, canonicals and absolute share images were missing, the schema referenced an undefined `#organization`, and there was no tracking at all. The privacy policy (2026-11-19) promised to ask for consent before any analytics.

## Decision
- Canonical host is `https://montaweb.pe` (no www). `www.montaweb.pe` and `/index` 301 to it (`deploy/Caddyfile`). Every indexable page carries canonical + og:url + an absolute og:image (default `images/og/montaweb-og.jpg`, 1200×630); thank-you pages and 404 are `noindex`.
- The homepage JSON-LD defines `https://montaweb.pe/#organization` (ProfessionalService, alternateName "MontaWeb Perú", disambiguatingDescription vs. other MontaWebs); `/servicios` and `/diseño-web-lima` point to it.
- Analytics: GA4 property **MontaWeb** (`G-L8EY4JE7DQ`, account Semantika TECH) and, once created, a Meta Pixel. Both load only from `js/consent.js` after the visitor clicks «Aceptar». WhatsApp and phone clicks are sent as GA4 `generate_lead` / Pixel `Contact`.
- The homepage shows the 50/50 payment terms as a guarantee block that only restates `terminos.html` §10 (no new promises).
- Testimonials appear only when they are real and the client agreed in writing. We never write placeholder or invented reviews.

## Why
Duplicate hosts split ranking signals. The brand clashes with a Barcelona agency, so a clear entity (schema + GBP + sameAs) matters more than for a unique name. Peru's Ley 29733 and our own policy require consent before non-essential cookies.

## Consequences / next steps
- Apply the Caddy blocks on the VPS (needs Jan's yes), then re-check www/http with curl.
- Mark `generate_lead` as a key event in GA4 once the first hit arrives.
- Meta Pixel: create it in Events Manager, then fill `META_PIXEL_ID` in `js/consent.js`.
- Google Business Profile + social profiles: when they exist, add their URLs to `sameAs` in the homepage JSON-LD.
- `/google-mi-negocio` still carries 2025-era body copy; it needs a content refresh.
