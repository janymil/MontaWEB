# Handoff: MontaWeb visibility in Facebook groups (posting as Semantika TECH Page)
2026-11-25 · MontaWeb main checkout, branch main · This task's docs are all committed (other sessions have uncommitted site work; don't touch it)

## Goal
Posts that give value first in the 13 joined groups, 2–3 a day, every exact es-PE text approved by Jan before posting, each logged. No Marketplace (see decision).

## Done so far
- Shortlist, rules and membership: `docs/research/2026-11-25-facebook-groups.md` (commits 1b3c161, 337b74a, 116c35c)
- Decision: `docs/decisions/2026-11-25-facebook-groups-not-marketplace.md`
- Joined 13 groups as the Page. Real-estate groups #13/#14 not joined (Jan's call).
- Posted 2026-11-25: A Lima Emprendedora (pending approval), B Emprendedores Perú (pending approval), C RESTAURANTES LIMA PERU (live, with study image). Texts: `docs/plans/2026-11-25-facebook-posts.md`.

## Next steps
1. Check A and B were approved, and fill in permalinks in the post log (open the group, click the post's timestamp).
2. Watch A's comments: we promised the first 5 commenters a reply in the comments about their site or Maps profile: how it looks on a phone, whether the WhatsApp button reaches their number, and where they rank in Google for their trade in their district. Draft each reply, show Jan, then post it.
3. Next posts, a different angle per group. Groups not posted in yet: Surco Emprendedor (Lima Moderna 42 %), Promociona Tu Negocio (direct offer with prices allowed), MyPes y PyMes, Dueños de Restaurantes, Restaurants y Afines (Menú QR S/ 69), Pollerías, the two vet groups (veterinaria.montaweb.pe demo; vets 10 % with web), Barberos (barberia.montaweb.pe; 12 %), GIMNASIO PERÚ (11 %). Max 2–3 a day; check Jan's pacing.
4. Draft in es-PE directly (Opus), run the Humanizer (`~/.claude/skills/writing/references/humanize.md` + `scripts/humanize-scan.mjs`; delete the generated humanize-scan.json), show Jan the exact text and image, and post only on his yes. Log each post and commit only the docs files.

## Key files
- `docs/plans/2026-11-25-third-party-mentions-texts.md:10` — prices and facts
- `blog/estudio-web-negocios-lima-2026.html` — study figures (JSON per trade and zone near the end)
- `images/blog/og-estudio-web-lima-2026.png` — post image

## Gotchas
- Use Claude in Chrome (Jan's Chrome). The Page "Semantika TECH" is already the active profile.
- FB composer: typing "1. " starts an auto-list, so type only the first number; the next lines number themselves.
- Join via JS: `[role=button][aria-label="Join Group"]` click; a dialog with "Participant questions" means stop and ask Jan.
- Post button: find "Post" in the Create post dialog; image via file_upload on the composer's file-input.
- `npm test` fails on another session's `llms.txt` CRLF change; it's not ours.
- Study claims must stay exact: 19 168 businesses; 24,4 % of active ones have a working web; Lima Este 11,6 %, Moderna 42,2 %; restaurants 16,3 % (Lima Este 6/129); 15 % of booking businesses' sites allow booking online.

## Open questions for Jan
- Membership question in Surco Emprendedor still unanswered (posting already allowed).
