# Radio renderer (`generate-radio.mjs`)

Turns a radio-style guion (`docs/plans/*-guion.md`) into a mixed mp3. The Lima study renderer (`generate.mjs`) is separate and untouched.

## Commands
```
node scripts/podcast/generate-radio.mjs --dry-run              # timeline + API calls + characters, no API calls
node scripts/podcast/generate-radio.mjs --test                 # 30-60 s excerpt -> images/audio/_test-prefijo-500.mp3 (gitignored)
node scripts/podcast/generate-radio.mjs                        # full show -> images/audio/prefijo-500-llamadas-comerciales.mp3
node scripts/podcast/generate-radio.mjs --spot-only --out images/audio/spot-montaweb-30s.mp3
node scripts/podcast/generate-radio.mjs --fake-assets --out <file>   # local sine/noise placeholders, tests the mix for free
```
Options: `--guion <md>`, `--out <mp3>`, `--work <dir>` (cache, default `scripts/podcast/.cache`). Needs `ELEVENLABS_API_KEY` in `.env` (not for `--dry-run` / `--fake-assets`). Every generated asset is cached by content hash, so a rerun only pays for changed text or prompts.

## Cue grammar -> what the mix does
| Cue | Behaviour |
|---|---|
| `DANIELA:` / `JAIR:` | Speech. Consecutive lines form one Text to Dialogue call (`eleven_v3`, es). Any cue, pause or phone line ends the segment. Lowercase `[tags]` stay in the text. Segments are placed with a 0.3 s gap (0.15 s around an SFX). Per-line timestamps are not used. |
| `NAME [PHONE]:` | Own call, then high-pass 300 Hz, low-pass 3.4 kHz, compression and tanh saturation. |
| `[pause Ns]` | N s of silence (room tone only). |
| `[SWEEPER: id \| VOICE: "text" \| music]` | Spoken text (that host's voice) over a generated music logo, light echo, composed once and cached. `same logo as X` / `intro jingle reprise` reuse that music; `fade out` gives a 1.5 s tail. |
| `[JINGLE: id \| desc, ~Ns]` | `/v1/music`, placed between segments. If speech follows directly, it starts over the last 1 s of the jingle. |
| `[STINGER: id \| desc]` | `/v1/music` (3 s minimum), used up to 2.2 s, next line starts 0.2 s before it ends. |
| `[BED: id \| desc]` / `[BED: off]` | Music looped (`-stream_loop`) from the cue to the next BED/off, 1 s fade in/out, 20 dB under the voice, ducked by `sidechaincompress` keyed by the voice (attack 15 ms, release 400 ms). `[BED: id]` alone reuses the earlier description. |
| `[SFX: id \| desc \| at]` | `/v1/sound-generation`, overlaid with `adelay` + `amix`. `before`: occupies the time just before the next line and ends where it starts. `under`: starts with the next line, 6 dB quieter, cut to that line's length. `after`: starts when the previous line ends and may run into the next. |
| `[SPOT]` | Inlines the `## Spot` section. |

Bus: voice + ducked bed + music + SFX + brown room tone (about -55 dB), bus compressor, limiter, two-pass `loudnorm` to -16 LUFS / TP -1.5, mp3 libmp3lame 144 kbps, 44.1 kHz stereo. Each source is first gain-matched (voice -18 LUFS, bed -38, jingles -20, SFX -26).

References like `same style as bed-a, slightly darker` become the earlier description plus `Variation: ...`.
`--spot-only` renders the Spot section plus the `break-out` jingle as the logo tail. `--test` stops after the line `[relieved] Por fin.` and adds the first STINGER.
