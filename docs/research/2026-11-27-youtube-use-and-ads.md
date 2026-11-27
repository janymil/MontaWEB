# Using the prefijo 500 video, and whether to buy YouTube ads

Date: 2026-11-27. Video: https://youtu.be/eWcyFwyDCPI (3 views when checked). Nothing was spent, created or changed on the site.

## Recommendation
Do not buy YouTube ads for this video now. Reuse it for free. Revisit ads when a WhatsApp enquiry can be traced back to its source.

Why:
- The video is a 6-minute news explainer; the offer appears at 3:42. It builds trust, it is not a direct ad.
- "Business owner" targeting for Peru is not verified. The practical proxy is a custom segment built from search terms.
- "llamadas spam" searches are likely mostly consumers wanting to block calls (our inference, not measured).
- A small budget buys few clicks and cannot show which audience works.

## Reuse (needs Jan's yes for anything on the site or posted)
1. Verify the channel for advanced features, so description links become clickable. Phone verification alone is not enough: it then takes channel history, or ID/video verification where offered ([features](https://support.google.com/youtube/answer/9891124?hl=en), [links](https://support.google.com/youtube/answer/13748639?hl=en)).
2. Article: add a click-to-load `youtube-nocookie` embed near the audio player, so nothing from YouTube loads before the click. No CSP header on the live page blocks it.
3. Skip the video sitemap. Google gives video features only to watch pages, not to a blog post with an embed ([video SEO](https://developers.google.com/search/docs/appearance/video)). VideoObject on the article is harmless, with no promised gain.
4. Cut three vertical clips: 2:04–2:31 (the 500 is not a permission), 2:57–3:27 (Indecopi fines), 4:21–5:05 (what to do before March). The master is 16:9, so they need reframing. Use as Shorts and as Page/group posts, with Jan approving each text. Links in Shorts are not clickable.
5. WhatsApp: send the video only inside conversations the business started or agreed to. No cold blast: it is promotion, the subject is consent, and the outreach legal check is still pending (`docs/decisions/2026-11-25-ai-voice-outreach.md`).
6. Audio and blog index: no change needed.

## What ads cost
Rate used: USD 1 = S/ 3.47 ([open.er-api.com](https://open.er-api.com/v6/latest/USD), 2026-11-27).

| Item | Figure | Source quality |
|---|---|---|
| YouTube cost per view, Peru | USD 0.02–0.10 (S/ 0.07–0.35) | Agency estimates, no data cited: [Funnel.pe](https://funnel.pe/youtube-ads-empresas-peru/), [Itera](https://somositera.com/cuanto-cuesta-la-publicidad-en-youtube-ads/) |
| YouTube cost per website click, Peru | not found | |
| Demand Gen minimum budget | USD 5/day or equivalent (S/ 17) | [Google](https://developers.google.com/ads/blog/posts/2026/02/minimum-budget-requirement-for-demand) |
| Video views / Studio "Promote" minimum | none found officially | [Google](https://support.google.com/youtube/answer/16869935?hl=en) |
| IGV 18% | Google charges it to "individual" accounts; RUC businesses self-pay it | [Google](https://support.google.com/google-ads/answer/2375370?hl=en), [3rcore](https://3rcore.com/es/blogs/google-ads-en-peru-cuenta-pago-igv); confirm with accountant |
| Search ad click, "diseño de paginas web" | CPC USD 1.84; 1,900 searches/month | DataForSEO, 2026-11-25, `keywords/2026-11-25-volume-peru-features.json` |

- A 6-minute video can run as skippable in-stream or in-feed (no maximum stated; under 3 min recommended), not as non-skip, bumper or Short ([specs](https://support.google.com/youtube/answer/2375464?hl=en)).
- In-stream is charged at 30 s watched or on interaction.
- Paid promotion does not change organic performance ([Google](https://support.google.com/youtube/answer/12199105?hl=en), said about Promote).
- Targeting: custom segments, detailed demographics, topics, placements, location ([Google](https://support.google.com/google-ads/answer/2497941?hl=en)). Company size/industry for Peru: check inside an Ads account.

## If Jan wants a test anyway
- Creative: a new 30–60 s cut with the offer in the first seconds, not the full video.
- Campaign: Demand Gen, maximize clicks, Peru, custom segment from seller terms (selling by WhatsApp, web page for a business, CRM), not "llamadas spam".
- Budget: USD 5/day for 10 days = USD 50, about S/ 174 (S/ 205 with IGV).
- Landing: the article, with UTM tags. GA4 counts only visitors who accept cookies, so also ask each new chat where it came from.
- Success: at least 2 WhatsApp enquiries from businesses. Stop rule: end at USD 50; no repeat if zero.
- These thresholds are our judgment, not a benchmark.

## Cheaper ways to reach businesses
- 1:1 personalised previews to census hot leads (decision 2026-11-24, proposed; legal check pending).
- Facebook groups as the Semantika TECH Page (decision 2026-11-25).
- Search ads reach people already looking for a website; USD 50 is about 27 clicks at USD 1.84.
- Meta click-to-WhatsApp: sources disagree tenfold (S/ 0.21–0.52 [Paradero Digital](https://www.paraderodigital.pe/publicidad-en-facebook-instagram-y-whatsapp-precios-y-costos/), undated; USD 1–3 LatAm [Aurora Inbox](https://www.aurorainbox.com/en/2026/05/13/what-is-click-to-whatsapp-ads/)). Needs its own test.
