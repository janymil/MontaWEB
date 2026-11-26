# Article audio is produced as "MontaWeb Radio": radio mix plus a MontaWeb spot
Date: 2026-11-26 · Status: decided

## Context
The Lima study audio (decision 2026-11-25-article-audio-podcast.md) sounded like a podcast: parts were concatenated with gaps, with no music under the voices. For the prefijo 500 guide, Jan wanted real radio production.

## Decision
- Show name in the station ID: **MontaWeb Radio**.
- The MontaWeb ad spot goes **both** inside the show (ad break) and as a standalone ~30 s file (`images/audio/spot-montaweb-30s.mp3`).
- New renderer `scripts/podcast/generate-radio.mjs` (+ `radio-parse.mjs`, `README-radio.md`). Cue grammar in the guion: SWEEPER, JINGLE, BED (ducked with sidechain), STINGER, SFX overlaid (before/under/after), `[PHONE]` filter, `[SPOT]`. Loudnorm −16 LUFS. Same voices (Daniela, Jair). `generate.mjs` stays for the Lima file.
- Flow: opus writes the es-PE guion → Jan approves → `--test` excerpt → Jan approves → full render + `--spot-only`.
- A speech line may not be tag-only (ElevenLabs rejects it); a test checks this.

## Why
The music bed, ducking and overlaid SFX make the audio sound like radio rather than a podcast. A reusable spot can also serve elsewhere (social, WhatsApp).

## Consequences / next steps
- First use: guion `docs/plans/2026-11-26-podcast-prefijo-500-guion.md`, output `images/audio/prefijo-500-llamadas-comerciales.mp3` (6:09).
- Mix constants (bed level, ducking, phone filter) were set without listening; adjust after Jan's ear check.
- Beds loop without a crossfade, so a click at the loop point is possible.
