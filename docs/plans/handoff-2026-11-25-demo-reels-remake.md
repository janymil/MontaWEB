# Handoff: remake the 3 demo reels for /videos-publicitarios-con-ia (2026-11-25)

Worktree: C:\Users\USER\Documents\MontaWeb\.claude\worktrees\ai-video-offer-page-c09012 · branch claude/ai-video-offer-page-c09012 · page committed (18109b6), tests 166/166, NOT deployed.

## Why
Jan rejected the current reels (`images/video/demos/*`, 10–13 s, one 8 s Flow clip + voice + subtitles): "no idea, no spark, boring, nobody will pay after watching these". He chose **Google Flow (Gemini Omni 1.2 Flash) + new scripts**.

## Goal
3 reels, **20–30 s each**, that sell the service by being real ads for the fictitious businesses: Pollería Doña Meche, Veterinaria Huellitas del Parque, Barbería Don Lucho. Same slugs and output paths, so the page needs no change except aria-labels/leyendas if scenes change.

Each reel: hook in the first 2 s (problem or craving) → 4–6 shots of 3–5 s (same people/place) → offer on screen (product, price, why now) → strong ending (name/logo, WhatsApp, CTA, music that lands). No AI label anywhere, no "ejemplo" text (Jan's rule). No real phone numbers.

## Jan's direction (2026-11-25)
Flow clips are **raw footage, not the finished ad**. The value is the edit around them: a designed **intro** (animated hook title, brand colours, punchy cut on the beat), **mid-video graphics** (offer/price card, kinetic text, zooms, speed ramps, transitions), and a designed **outro** (logo reveal, offer recap, WhatsApp CTA, music hit). Build these as motion graphics (e.g. HTML/CSS or Remotion rendered to video, or ffmpeg overlays), not just plain drawtext on a colour card. Existing good shots (pollería coals/plating, vet exam) can be reused.

## Steps
1. Write a one-page script per business (es-PE voice-over + on-screen text + shot list) in `docs/plans/`. es-PE = Opus + global "Text in other languages" rules + Humanizer scan. **Show Jan the 3 scripts before spending credits.**
2. Flow (Claude in Chrome, project "nov 25 - 22:17" at flow.google.com): stills first per shot (same location/people description), then image-to-video, 9:16, 720p. Prompts: only what the camera sees + "no text, no letters, no logos". Recipe: `~/.claude/skills/social-posts/subscriptions.md` §"AI video that works".
3. **Credits: Jan must click "Schváliť" himself.** The auto-mode check blocks Claude from approving; a pending confirmation times out and cancels. Tell Jan right before each request.
4. Download takes (tile ⋮ → Download → 720p) into `scripts/demo-reels/raw/` (gitignored). Build with `scripts/demo-reels/make-demo-reels.mjs`: it already joins `clips: [{file, from, to}]`, does ElevenLabs VO + music (cached), subtitles, end card, optional `blur` boxes; no label unless `label` is set. Config `reels.json` (currently a 16 s draft to rewrite); `reels-8s.json` = the rejected versions. Run with `ELEVENLABS_ENV=C:/Users/USER/Documents/MontaWeb/.env`. Voices: Jair `I9uZPOVoQkQEhHPStmJz`, Daniela `VywzfvxxNk4yFAaoMm4Q`. The script may need: per-shot subtitle timing, an on-screen price/offer card, a logo on the end card, and crossfades.
5. Look at the frames (contact sheet via ffmpeg tile) for garbled AI lettering before showing Jan. Update the leyendas/aria-labels in `videos-publicitarios-con-ia.html` to what's really on screen (es-PE, Opus). Delete `reels-8s.json` once replaced.
6. `npm test`, `./verify.sh`, commit on the branch, report to Jan with the 3 videos. Don't deploy.

## Open for Jan (from the page work)
- Confirm the /servicios amounts already include IGV (the page now says "Todos los precios son finales e incluyen IGV"; legal check `docs/research/2026-11-25-ai-video-legal-check.md`).
- Check the Ficha RUC: RMT or General (not RER/Nuevo RUS: they exclude advertising).
- The decision file in the main checkout (`docs/decisions/2026-11-25-ai-video-offer-page.md`) still says every video carries a label; update it to "no label" (Jan's call).
