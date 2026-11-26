# Handoff: realistic radio-style audio (two hosts + spot) for the prefijo 500 guide
2026-11-26 · MontaWeb main checkout, branch main (deployed 7bc6728) · Uncommitted changes from this task: no (other sessions' files are untracked; leave them alone)

## Goal (what done looks like)
- A ~5–6 min es-PE conversation between DANIELA and JAIR about https://montaweb.pe/blog/prefijo-500-llamadas-comerciales. The voices stay as good as last time. Production must sound like real radio:
  - station ID / sweeper at the start
  - music bed under the talk, with sidechain ducking
  - jingle in/out and stingers between segments
  - topic SFX: phone ringing, a call from "500", busy tone, hang-up click
  - a short ad break with a 20–30 s MontaWeb spot inside the show
- Also a standalone 30 s MontaWeb spot mp3 (same theme: let customers find you, web + WhatsApp + form with consent checkbox).
- Player card + mini player on the article, the same as the Lima study. `AudioObject` in the JSON-LD, transcript in `<details>`, tests, deploy only after Jan's yes.

## Done so far
- Article live: `blog/prefijo-500-llamadas-comerciales.html` (commits 0c55270, 7bc6728). Facts and sources: `docs/research/2026-11-26-prefijo-500-llamadas-comerciales.md`; decision `docs/decisions/2026-11-26-prefijo-500-article.md`.
- How the Lima study audio was made (decision `docs/decisions/2026-11-25-article-audio-podcast.md`):
  - Script `docs/plans/2026-11-25-podcast-estudio-lima-guion.md` (opus, es-PE, approved by Jan). It uses v3 audio tags in [brackets] and `[SFX: …]` lines.
  - `scripts/podcast/generate.mjs`:
    - ElevenLabs Text to Dialogue `eleven_v3` with voices Daniela `VywzfvxxNk4yFAaoMm4Q` and Jair `I9uZPOVoQkQEhHPStmJz`. Shared-library voices get added to the account first.
    - Only 4 SFX (`SFX` map at :26): intro/outro music via `/v1/music` (falls back to `/v1/sound-generation`), audience "ooh", and a whoosh stinger.
    - Mix (:117+): each part is loudnormed separately and then **concatenated with gaps**. There is no music bed under the voices and no ducking. That is why it sounds like a podcast and not like radio.
  - Output `images/audio/estudio-web-lima-2026.mp3`. Player in `js/podcast.js` + `css/podcast.css`. Markup is the `section.pod` + `.pod-mini` blocks in `blog/estudio-web-negocios-lima-2026.html` (~line 115 and the end of the body).
  - Key `ELEVENLABS_API_KEY` is in `.env` (gitignored). About 5k credits for 6 minutes.
- I found no separate radio spot file from the Lima study. "Spot" may mean the whole show; ask Jan if unclear.

## Next steps
1. Write the guion as `docs/plans/2026-11-26-podcast-prefijo-500-guion.md` with opus, using only the verified facts in the article. Mark every SFX/music cue. Show it to Jan before rendering.
2. Make a new `scripts/podcast/generate-radio.mjs` (or extend `generate.mjs` without breaking the Lima file):
   - Cue types: `bed` (loop under the dialogue until the next cue, about −20 dB, ducked with ffmpeg `sidechaincompress` keyed by the voice track), `jingle`, `sweeper` (station ID voiced over music), `stinger`, and `sfx` overlaid at a timestamp (`adelay` + `amix`), not appended.
   - Render dialogue per segment and keep timings so the SFX can overlap the speech. A little room tone and a light bus compressor, then loudnorm to −16 LUFS.
3. Render a 30–60 s test first and let Jan hear it before the full run. Cache every generated asset by hash, as the current script does.
4. Add the player to the article, the JSON-LD `AudioObject`, the transcript and tests. Run `./verify.sh`, then deploy with `npm run deploy` only after Jan's yes.

## Gotchas
- Global rule: no meta-comments in public text (no "como en la radio", no "voces con IA"). The station name and the spot are fine. The page shows no note about how the audio was made.
- Global rule: every es-PE sentence passes Jan's 3 questions, plus the Humanizer (`~/.claude/skills/writing/references/humanize.md`). The scanner is `~/.claude/skills/writing/scripts/humanize-scan.mjs` and needs .md input.
- State the law correctly: the 500 does not authorise calls (consent is still required), and 15 Mar 2027 is the operators' deadline.
- ffmpeg is on PATH and the current script already uses it. Bump `?v=` on any shared js/css you touch (lessons.md).
- The in-app browser preview works with launch config `montaweb-static-8783`. Use the `.html` path.

## Open questions for Jan
- Station/show name for the sweeper? (Last time there was none.)
- Spot: inside the show only, standalone file only, or both?
