# 2026-11-25 — AI answer tools can read and quote MontaWeb's prices and study

## Goal

Make the on-site AEO/GEO fixes from the 2026-11-25 audit: llms.txt, explicit AI-crawler rules, FAQPage markup on home and /servicios, and a "cómo citar" box on the study.

## Out of scope

Off-site work (price-guide listings, press outreach, directories), new FAQ questions, `sameAs` links (no social profiles exist on the site yet), and a Dataset schema (we don't offer the data for download).

## Files that will change

- `llms.txt` (new, standard root file): Markdown map for LLMs
- `robots.txt`: named groups for AI crawlers, each still blocking `/api/`
- `index.html`: FAQPage node that matches the visible FAQ word for word; `makesOffer` for the 3 plans
- `servicios.html`: FAQPage JSON-LD that matches the visible FAQ
- `blog/estudio-web-negocios-lima-2026.html` + `css/blog.css`: citation box
- `test/aeo.test.mjs`: new tests

## The risk

FAQ markup that doesn't match the visible text breaks Google's rules, and Google can ignore it or take manual action. A named bot group in robots.txt that forgets `Disallow: /api/` would open the API to that bot. Search Console would catch either within days.

## How it is proven

- Test: `test/aeo.test.mjs` checks that llms.txt exists and links real pages, that every robots group blocks /api/, and that each FAQPage question/answer equals the visible `<summary>`/`.faq-q` text.
- Gate: `./verify.sh`

## Steps

1. robots.txt + llms.txt
2. FAQPage on home and servicios
3. Citation box on the study, bump the blog.css `?v=`
4. Tests, gate, check the rendered page

## Review — filled in after building, by the reviewer pass
