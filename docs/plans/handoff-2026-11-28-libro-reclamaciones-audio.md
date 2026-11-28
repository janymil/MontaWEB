# Handoff: MontaWeb Radio audio for the Libro de Reclamaciones study
2026-11-28 · main checkout, branch main

## Goal
A radio-style audio episode for https://montaweb.pe/blog/libro-de-reclamaciones-virtual-estudio-lima, made exactly like the prefijo 500 one: same show name (MontaWeb Radio), same hosts/voices (Daniela, Jair), same jingles, sweepers, beds, stingers and MontaWeb spot, same renderer and player embed.

## Where the reference is
- Decision: `docs/decisions/2026-11-26-montaweb-radio-audio-format.md` (format, cue grammar, flow, gotchas).
- Reference guion: `docs/plans/2026-11-26-podcast-prefijo-500-guion.md`; handoff `docs/plans/handoff-2026-11-26-prefijo-500-audio.md`.
- Renderer: `scripts/podcast/generate-radio.mjs` (+ `radio-parse.mjs`, `README-radio.md`). Output example: `images/audio/prefijo-500-llamadas-comerciales.mp3`; spot `images/audio/spot-montaweb-30s.mp3`.
- Player embed: see how `blog/prefijo-500-llamadas-comerciales.html` embeds its audio (and any JSON-LD AudioObject); copy that.

## Facts for the guion (all verified, use only these)
- Article source text: `docs/plans/libro-reclamaciones-study/articulo.md`; the live HTML is the final version (`blog/libro-de-reclamaciones-virtual-estudio-lima.html`). Support pages: `blog/multa-por-no-tener-libro-de-reclamaciones.html`, `blog/libro-de-reclamaciones-virtual-gratis-indecopi.html`.
- Gotchas: no 2026 wave of website fines; RM 244-2026-PCM is only a draft; no Yape resolution number; 2026 fines (Junín 0,50 UIT, BBVA Puno 5 UIT) are physical-libro cases; the micro/small fine caps have conditions (accredited income, not a repeat offender, no harm to life or health).
- LibroDigital prices: Gratis S/ 0 (1 local, 5 reclamos), Básico S/ 89/año, Pro S/ 189/año. No launch offer. Scanner: librodigital.pe/revisar-mi-web.

## Flow (from the decision; do not skip steps)
1. Opus writes the es-PE guion (global language rule + Humanizer; no English template; no meta-comments such as "como en la radio" or AI-voice notes) → Jan approves.
2. `--test` excerpt → Jan approves by ear.
3. Full render, embed the player on the flagship, `./verify.sh`, commit your files only.
4. Deploy + IndexNow only with Jan's yes, via `scripts/deploy.sh`.

## State of the study (for context)
Deployed 2026-11-28 (83c1c5b). "KEO" in Jan's review = GEO (confirmed). Outreach drafts in `docs/plans/libro-reclamaciones-study/outreach.md`, not sent.
