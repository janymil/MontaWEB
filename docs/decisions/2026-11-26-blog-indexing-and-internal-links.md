# Blog articles get contextual internal links and IndexNow pings
Date: 2026-11-26 · Status: decided

## Context
The prefijo 500 guide was linked only from /blog, while the Lima study had 9 internal links. Search Console was already verified (meta tag in index.html), but nothing told Bing/IndexNow about new pages. Bing also feeds ChatGPT search and Copilot answers.

## Decision
- Every new article gets contextual links from the pages whose readers it serves. For prefijo 500 those are the 6 industry pages, /paginas-web-por-rubro, /diseño-web-lima, the Lima study's "Sigue explorando" block, and the home footer. Each link sits in a sentence that fits the page, with varied anchor text.
- IndexNow: key file `3412b026f4175bbe43a94bcad82002b4.txt` in the repo root (IndexNow requires the root; the key is public on purpose). After a deploy, run `npm run indexnow -- /blog/<slug>`, or `-- --sitemap` for all URLs.
- Search Console: after publishing, use URL Inspection → Request indexing for each new or changed article.

## Why
Internal links are the cheapest ranking signal we control. IndexNow gets pages into Bing within hours instead of weeks.

## Consequences / next steps
- Jan still has to add montaweb.pe to Bing Webmaster Tools (import from Search Console) to see Bing data.
- Changing FAQ text on a page also means updating its FAQPage JSON-LD, or the tests fail. That is why the shop page got no link yet.
