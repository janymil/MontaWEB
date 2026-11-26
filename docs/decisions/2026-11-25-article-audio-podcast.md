# Blog studies get a two-host audio version made with ElevenLabs
Date: 2026-11-25 · Status: decided

## Context
Jan wanted an audio version of the Lima web study, NotebookLM-style, with a radio feel.

## Decision
- Script written by us in es-PE (not ElevenLabs GenFM auto-scripts), approved by Jan, then rendered with ElevenLabs Text to Dialogue (eleven_v3) using two Peruvian voices (Daniela, Jair), plus generated jingle, stingers and audience reactions.
- Generator: `scripts/podcast/generate.mjs` (script in `docs/plans/*-guion.md` → mp3 in `images/audio/`). Key: `ELEVENLABS_API_KEY` in `.env` (gitignored).
- Player: card under the article title; once playing and scrolled past, a mini player docks in the sticky contents sidebar (desktop) or a bottom bar (mobile). Transcript in a `<details>`, `AudioObject` in the Article JSON-LD.

## Why
GenFM writes its own Spanish, which we can't control for es-PE quality or exact figures. The hero card is where readers decide to listen and the sidebar is hidden on mobile.

## Consequences / next steps
- Future articles: write a guion, run the generator (~6 min ≈ 5k credits).
- GA4 events `podcast_play` / `podcast_complete` (after consent).
