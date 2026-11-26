# Handoff: merge the referral program (/referidos) into main
2026-11-25 · MontaWeb · branch `claude/referral-program-513d50` · worktree `C:\Users\USER\Documents\MontaWeb\.claude\worktrees\referral-program-513d50` · Uncommitted changes: no (after the commit of this note)

## Goal (what done looks like)
Branch merged into local `main`, `npm test` and `./verify.sh` green there, Jan asked separately about push and deploy.

## Done so far
- Jan approved the Spanish ("Reads well") and said yes to the merge, to happen once the other work on main is committed.
- Reviewer APPROVE at `c740604`; `npm test` 103/103 and `./verify.sh` OK on the branch.
- `f4ddc66`, `e3724cf`, `c740604`: code kept on every WhatsApp link, price quote preserved, script tests.
- `6bfef5f`: S/ 99 minimum for both sides (Jan confirmed, recorded in the decision), eligibility = any paying client.

## Next steps
1. In `C:\Users\USER\Documents\MontaWeb`: `git status`. Merge only if the compare-page and hosting work is committed (last check: still uncommitted, many shared pages). If not, tell Jan and stop; do not commit, stash or edit that work.
2. `git merge claude/referral-program-513d50`. Expected conflict: `.devkit/lessons.md` (keep both sides). Check `sitemap.xml`, `llms.txt`, footers.
3. `npm test` + `./verify.sh`. The footer test covers root and `blog/` pages with an "Explora" column, so `comparar.html` may need the `/referidos` link; check `comparar/` by hand (not covered).
4. Ask Jan before push or deploy (`.devkit/lessons.md`, 2026-11-24 deploy lesson).

## Key files
- `docs/decisions/2026-11-25-referral-program.md`: the rules.
- `docs/plans/2026-11-25-referral-messages.md`: messages; nothing sent.
- `js/referidos.js`, `test/referidos.test.mjs`.

## Gotchas
- The compare work is probably held by the session "Porovnanie Montaweb a kompetencie" (not confirmed).
- A hook blocks writing to the main checkout from the worktree.
- Check a gate's own exit code before committing, not a `grep` of its output.

## Open questions for Jan (none blocks the merge)
- Does buying only a support plan (paid in advance) earn the reward?
- Reward card and decision say the free profile comes "with the web"; condition 7 grants it for any service of S/ 99+.
- Clients without hosting: S/ 40 hosting discount is useless to them.
- Before any message is sent or referral processed: `/lawyer` on the opt-in rule, privacy policy (referral data, DNI) and validity dates.
