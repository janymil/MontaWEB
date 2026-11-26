# 2026-11-25 — A business owner can see, price and order a MontaWeb AI promo video on its own page

## Goal

Sell the decided AI promo reel add-on (S/ 149 for 1, S/ 349 for 3, IGV included) on a dedicated page, linked from /servicios and the homepage, without moving websites out of the centre.

## Keyword choice (DataForSEO, Peru, es, 12 months; raw: `docs/research/keywords/2026-11-25-ai-video-volume-peru.json`, cost $0.10)

| Keyword | Vol/mo | Intent | Use |
|---|---|---|---|
| crear video(s) con ia | 6,600 | DIY, tools | not targeted (wrong buyer) |
| videos con ia | 4,400 | DIY, tools | not targeted |
| spot publicitario | 2,900 | definition/school | not targeted |
| **videos publicitarios con ia** | **70**, CPC $1.94, HIGH | buyer | **primary: slug, title, H1** |
| video publicitario / videos promocionales | 110 / 110 | mixed | secondary (H2, meta) |
| spot publicitario con ia | 70 | buyer | secondary (FAQ, body) |
| publicidad con ia / anuncios con ia | 140 / 90 | mixed | body |
| reels con ia, videos para tiktok | 20 / 90 | mixed | body |

SERP for the primary, spot con IA and video publicitario: only global tools (generators, Adobe, Vaideo); no Peruvian service page in the top 8. A service page with a price can rank.

URL: `/videos-publicitarios-con-ia` (ASCII, no accent, so no encoded URL).

## Decisions taken here (refining the brief)

- **Placement:** own page + a new category block on /servicios (2 price cards) + a compact band on the homepage after the services bento. Hero untouched. Footer "Servicios" column gets one link.
- **Monthly pack:** shown as one line "próximamente" without price (gated on 3 buyers).
- **AI receptionist:** its decision is still *proposed* (no backend, no number yet), so the page mentions it only as "en preparación" with a WhatsApp interest link and **no price**. Showing S/ 179–349 for a product that can't be bought yet risks misleading advertising (INDECOPI). Jan decides when it goes on sale.
- **/comparar:** not touched; it compares web providers, not video.
- **Disclosure (changed by Jan, 2026-11-25):** no AI label anywhere: not on the page, not burned into the demo reels. Legal check (`docs/research/2026-11-25-ai-video-legal-check.md`): DS 115-2025-PCM art. 25 makes a visible label optional for non-high-risk AI, so this is allowed; TikTok/Meta AI toggles are set by the client at upload.

## Out of scope

Monthly pack checkout · receptionist page · posting/ad management · avatar or cloned-voice videos · jingles, voice spots, WhatsApp audio packs (decided not sold) · deploy.

## Files that will change

- `videos-publicitarios-con-ia.html` — new page, editorial shell of `tiendas-virtuales.html`; Service + Offer(×2) + FAQPage + BreadcrumbList JSON-LD
- `servicios.html` — new category "4. Videos con IA" with 2 cards + link; JSON-LD offers
- `index.html` — compact band after `#servicios`
- footer "Servicios" column on every page that has it — one link "Videos con IA"
- `css/site.css` (+ homepage css if needed) — reel player / band styles; bump `?v=`
- `images/og/og-videos-publicitarios-con-ia.png` (+ script in `scripts/`)
- `videos/demos/` — 2–3 demo reels (WebM+MP4+poster) or marked slots
- `sitemap.xml`, `llms.txt`
- `test/ai-video-page.test.mjs` — new; add page to `seo-and-tracking` and `site-wide-design` lists

## The risk

A promise MontaWeb can't keep (delivery time, revisions, music rights, "realistic people") → refund/INDECOPI claim; Jan notices on the first order. Selling the receptionist before it exists → misleading ad. Demo reels presented as client work → misleading ad. Footer edits collide with other branches → merge conflict, trivial.

## How it is proven

- Test `test/ai-video-page.test.mjs`: title/H1/meta contain "videos publicitarios con IA"; prices S/ 149 and S/ 349 and "IGV" visible and equal in JSON-LD offers; FAQ JSON-LD = visible summaries; no AI-label or "negocio ficticio" text on the page; no receptionist price on the page; no "S/ 1,490"/jingle offer; page in sitemap + llms.txt; linked from index, servicios and footer; every `<video>` has poster + playsinline + muted and no autoplay with sound.
- Gate: `./verify.sh`; rendered check desktop + 375 px at 127.0.0.1:8783.

## Steps

1. es-PE copy by opus app-content (purpose + facts only), Humanizer scan.
2. Build page, wiring, OG image, tests (sonnet app-implementer).
3. Demo reels with Jan's tools, or marked slots.
4. Render check, app-reviewer, commit, report to Jan.

## Review — filled in after building, by the reviewer pass

- [x] Q1 · A business owner sees 3 example reels, the prices (S/ 149 one, S/ 349 three, IGV incluido) and orders by WhatsApp; linked from home, /servicios and every footer.
- [x] Q2 · test/ai-video-page.test.mjs (e.g. "S/ 149, S/ 349 and IGV equal the JSON-LD offers").
- [x] Q3 · VERIFY OK, 166/166 tests (2026-11-25).
- [x] Q4 · Over-promising (revisions, delivery, rights) or demos read as real client work → INDECOPI claim; receptionist has no price.
- [x] Q5 · app-reviewer (Opus), 2026-11-25, full diff: APPROVE, minor items fixed (revision wording, plan text, reels-8s note).
- [ ] `lessons.md` updated — only if something surprised us
