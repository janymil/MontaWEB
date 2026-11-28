# One MontaWeb Radio episode for the whole Libro de Reclamaciones cluster
Date: 2026-11-28 · Status: decided

## Context
The Libro de Reclamaciones cluster has three pages: the flagship study and two support pages (multa, Indecopi gratis). Each blog article normally gets its own MontaWeb Radio episode (see 2026-11-26-montaweb-radio-audio-format.md).

## Decision
- One episode covers all three pages: `images/audio/libro-de-reclamaciones-virtual-estudio-lima.mp3` (8:46), guion `docs/plans/2026-11-28-podcast-libro-reclamaciones-guion.md`.
- The same player goes on all three pages. The flagship plays from the start. The multa page starts at the fines segment (4b). The Indecopi gratis page starts at the free-tool segment (5).
- The music, sweepers, stingers and the MontaWeb spot are reused unchanged from prefijo 500. The spot is about calls, not the libro, at Jan's request.
- The renderer gained `--test-until "<text>"` to set where the test excerpt stops.

## Why
Separate episodes would repeat most of the same facts. Readers of the short support pages want only their part, so a start time serves them without a second render.

## Consequences / next steps
- Future clusters: one episode per cluster by default, with segment start times on the support pages.
- Deploy and IndexNow only with Jan's yes, via `scripts/deploy.sh`.
