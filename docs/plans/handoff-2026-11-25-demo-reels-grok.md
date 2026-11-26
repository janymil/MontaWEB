# Handoff: demo reels, third attempt with Grok (2026-11-25)

Worktree: C:\Users\USER\Documents\MontaWeb\.claude\worktrees\ai-video-offer-page-c09012 · branch claude/ai-video-offer-page-c09012 · last commit 787a44c · NOT deployed.

## Where it stands
- `docs/plans/2026-11-25-demo-reels-scripts.md`: es-PE scripts Jan approved (VO, on-screen text, offers S/ 15, S/ 39, S/ 30). Reuse them unless Jan changes them.
- `scripts/demo-reels/` has a renderer (`make-demo-reels.mjs` + `overlay.mjs`, HTML/CSS overlay via playwright-core, ElevenLabs VO/music/SFX with cache) and `reels.json`. Output in `images/video/demos/<slug>.{mp4,webm}` + poster.
- Raw Flow clips are in `scripts/demo-reels/raw/` (gitignored).

## Jan's verdict on 787a44c: "horrible"
- **All 3 reels look the same.** They share one template: hook, captions, card with a stamp, and an outro with a pattern, badge and green pill. They also have the same SFX (boom/whoosh) and the same ending. Each business needs its own visual identity, its own edit rhythm, its own music genre and sound design, and its own ending idea. Don't reuse one template with different colours.
- **Flow footage isn't good enough for this job.** Jan wants to try **Grok** (Grok Imagine video) instead. He has the Grok app on Windows and is signed in to Grok in his Chrome. Use Claude in Chrome on grok.com (Imagine) first; Computer use on the desktop app is the fallback.

## Next steps
1. Before generating anything, write per reel a distinct creative concept. Examples (Jan picks):
   - Pollería: a mini-story ("martes en casa: nadie quiere cocinar → llega el pollo").
   - Vet: a POV from the dog.
   - Barbería: a before/after with a beat-synced transformation.

   Spell out per reel: footage style, typography, colour, transitions, music genre, and how it ends. Show Jan the 3 concepts and get a yes.
2. Generate the shots in Grok via Chrome. Check the credits/plan limits first and tell Jan before spending. No text, no letters, no logos in prompts.
3. Edit each reel with its own look. The renderer can stay, but no shared template: give each reel its own overlay layout, animation language and SFX set.
4. Rules are unchanged: no AI label, no "ejemplo", no real phone numbers, es-PE by Opus with native checks + Humanizer, then `npm test`, `./verify.sh`, commit, don't deploy. Update the page's aria-labels/figcaptions if the scenes change.
