# Handoff: referral program (/referidos) — finish review and get it merged
2026-11-25 · MontaWeb · branch `claude/referral-program-513d50` · worktree `C:\Users\USER\Documents\MontaWeb\.claude\worktrees\referral-program-513d50` · Uncommitted changes: no

## Goal (what done looks like)
Two-sided referral program live on montaweb.pe/referidos after Jan's native read and his yes to merge/push. Deploy only with Jan's explicit yes (see `.devkit/lessons.md` 2026-11-24 deploy lesson).

## Done so far
- `a53d977` page `referidos.html`, `css/referidos.css`, `js/referidos.js`, sitemap entry, "Referidos" link in the Explora footer column of 15 pages, `llms.txt` line, `test/referidos.test.mjs`, canonical entry in `test/seo-and-tracking.test.mjs`, decision `docs/decisions/2026-11-25-referral-program.md`, messages `docs/plans/2026-11-25-referral-messages.md`, lesson line.
- `674444f` Jan confirmed: Pack Presencia referral gets S/ 20 off instead of free GMB.
- `npm test` 98/98, `./verify.sh` OK. Checked in Chrome desktop + 390px: ?ref code flows into WhatsApp link, invalid code shows error, no overflow, no duplicated/hidden text.
- Humanizer scan on page + messages: score 92, only flags are `[Nombre]` placeholders (intended).

## Next steps
1. Jan reads the Spanish on `referidos.html` and the 3 messages; apply his changes (opus for any es-PE rewrite; log rejected phrases if the repo has a mistakes log).
2. Reviewer pass per `.devkit/DONE.md` / `.devkit/prompts/reviewer.md` (sonnet app-reviewer, range `ba75e1c..HEAD`).
3. Ask Jan: merge into main? Expect conflicts in `sitemap.xml` and footer lines with the industry-landing-pages work on main; footer edits are one line per file (Explora column only).
4. After merge, re-run `npm test` + `./verify.sh` on main. Push/deploy only on Jan's yes.

## Key files
- `referidos.html` — page; FAQ `<details>` must stay in sync with the FAQPage JSON-LD (test enforces).
- `js/referidos.js` — code regex `^[A-Z0-9]{3,12}$`, WhatsApp texts for referred visitor and for sharing.
- `docs/plans/2026-11-25-referral-messages.md` — announcement, follow-up, "referral paid" texts; nothing sent.

## Gotchas
- In-app Browser pane refuses localhost; the launch.json preview server also refused 127.0.0.1 from Chrome. Run `python -m http.server <port> --bind 127.0.0.1` in the background from the worktree and use Claude in Chrome.
- Chrome `resize_window` did not change viewport; test mobile with 390px iframes on a same-origin page.
- Hook blocks writing to the main checkout from this worktree; decision file lives on the branch.

## Open questions for Jan
- Native read of the Spanish (page + messages).
- Cash payouts need a declaración jurada with DNI; privacy policy doesn't cover it yet (ask /lawyer before adding).
- Merge to main / push / deploy: yes or no.
