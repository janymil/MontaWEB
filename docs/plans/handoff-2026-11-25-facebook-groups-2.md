# Handoff: MontaWeb Facebook groups, round 3 + Page Services tab
2026-11-25 · MontaWeb main checkout, branch main · This task's docs are committed (9483e9d); other sessions have uncommitted site work, don't touch it

## Goal
Keep posting value-first in the 13 joined groups as the Semantika TECH Page, with Jan's yes on every exact es-PE text, each post logged. Set up the Page's Services tab instead of Marketplace.

## Done so far
- Round 1 (A–C) and round 2 (D–F) texts: `docs/plans/2026-11-25-facebook-posts.md`
- Post log + status: `docs/research/2026-11-25-facebook-groups.md` (section "Post log")
- Status at 19:45: A declined (Lima Emprendedora); B, C, D, E pending; F (Veterinarios) listed under both Pending and Removed. Nothing live yet.
- All 13 joined groups now say "Now you can post" (incl. Promociona Tu Negocio, GIMNASIO PERÚ).

## Next steps
1. Recheck each posted group at `facebook.com/groups/<id>/my_posted_content` (+ `my_pending_content`, `my_declined_content`, `my_removed_content`). Live → add the permalink to the log; comments → draft replies, show Jan, post on yes.
2. Draft round 3 for the 7 groups with no post: Promociona Tu Negocio (prices allowed: Web Simple S/ 99, Landing desde S/ 50, tienda desde S/ 299, hosting + SSL first year included), MyPes y PyMes (question: "¿tu negocio sale en Google Maps?"), Dueños de Restaurantes, Restaurants y Afines (Menú QR S/ 69), Pollerías (pedidos por WhatsApp), Groomers/Veterinarias, GIMNASIO PERÚ (11 %). Plus a data-only retry for Lima Emprendedora. Get trade-by-zone numbers from the JSON at the end of `blog/estudio-web-negocios-lima-2026.html` (zone arrays = [active businesses, with working web]).
3. Services tab on the Semantika TECH Page: draft each plan's name/price/description in es-PE, show Jan, save only on yes.
4. Humanizer on every text: `node ~/.claude/skills/writing/scripts/humanize-scan.mjs <file>` (run it on a scratchpad copy; delete humanize-scan.json). Commit only the docs files.

## Key files
- `docs/decisions/2026-11-25-facebook-groups-not-marketplace.md` — why no Marketplace
- `docs/decisions/2026-11-25-hosting-first-year-included.md` — hosting fact for prices
- `docs/plans/2026-11-25-third-party-mentions-texts.md:10` — price list

## Gotchas
- Claude in Chrome; the Page is the active profile. Every group holds Page posts for admin approval: seeing it in the feed right after posting doesn't mean it's live.
- An offer ("free check for the first 5") got A declined; lead with data, demo only in trade groups, say the demo business doesn't exist.
- Composer: click "Write something...", type; image via file_upload on the composer's hidden file-input (`find` "file input inside Create post dialog"). Check the image name shows in the composer before Post. Don't click the photo icon (may open a native picker).
- Chrome window is maximised; resize_window doesn't make phone-width screenshots. Desktop screenshot via `save_to_disk`, copy from tool-results to scratchpad, then upload.
- First visit to some groups shows a welcome dialog (invite + rules): click Next / Got it, invite nobody.
- Pacing: 6 posts already went out on 2026-11-25; next posts on 2026-11-26, 2–3 a day unless Jan says otherwise.

## Open questions for Jan
- Pacing for round 3 (2–3 a day, or all at once as with D–F?).
