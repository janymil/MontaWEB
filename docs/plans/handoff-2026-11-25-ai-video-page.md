# Handoff: AI video offer page (MontaWeb) — 2026-11-25

Worktree: C:\Users\USER\Documents\MontaWeb\.claude\worktrees\ai-video-offer-page-c09012
Branch: claude/ai-video-offer-page-c09012 · WIP commit 8cb9dde · NOT deployed (Jan says yes to deploys separately).

## Done
- Keyword research (DataForSEO, $0.10): primary "videos publicitarios con IA" (70/mo, CPC $1.94, only global tools rank). Slug `/videos-publicitarios-con-ia`. Table + decisions in `.devkit/plans/2026-11-25-ai-video-offer-page.md` (read it first).
- Decisions taken (in the plan): own page + new category on /servicios + compact homepage band after `#servicios` (hero untouched) + footer link; monthly pack = "próximamente" without price; **receptionist shown only as "en preparación", NO price** (its decision is still *proposed*, no backend: price would be misleading ad); /comparar untouched.
- es-PE copy (opus app-content, Humanizer page text 100/100): `docs/plans/2026-11-25-ai-video-page-copy-es-PE.md`. Title "Videos publicitarios con IA desde S/ 149 | MontaWeb"; H1 "Videos publicitarios con IA.<br><em>Sin grabar nada.</em>". Demo names: Pollería Doña Meche, Veterinaria Huellitas del Parque, Barbería Don Lucho.
- Writer's open points: /lawyer check of DS 115-2025-PCM label wording (fallback wording in the copy notes); /servicios already has "4. Cuidado y hosting" → renumber (new video category); other /servicios cards say "pago único" without IGV note — ask Jan whether those include IGV; FAQ promises a comprobante per payment.
- Demo raw clips (Google Flow, Gemini Omni 1.2 Flash, 8 s, 720x1280, 72 credits used) in worktree `scripts/demo-reels/raw/{polleria,veterinaria,barberia}.mp4` (gitignored; originals also in ~/Downloads). Pollería and vet clean. **Barbería has garbled AI text on the cape ("REQ/AV", "DO…")**: crop/blur or regenerate.
- `scripts/demo-reels/make-demo-reels.mjs` (untested): reads `scripts/demo-reels/reels.json` (to write: slug, clip, voice id, voiceover, subtitles[], label "Video generado con IA", endTitle, endLine, music prompt), ElevenLabs TTS + music, drawtext subtitles/label/end card, outputs `images/video/demos/<slug>.{mp4,webm}` + poster. Key: set `ELEVENLABS_ENV=C:/Users/USER/Documents/MontaWeb/.env` (worktree has no .env). Voice ids in `scripts/podcast/generate.mjs` (Daniela shared voice, Jair). Voice-over lines are es-PE text → opus writes them, Humanizer applies.

## Still to do
1. reels.json + run the reel script, look at the output frames.
2. Implementation (sonnet app-implementer, modern-web-guidance already consulted): page in the `tiendas-virtuales.html` shell; Service + 2 Offers + FAQPage + BreadcrumbList JSON-LD; videos below the fold: `loading="lazy"` + `preload="none"` + explicit width/height + poster + muted playsinline controls, no autoplay with sound; FAQ as plain `<details>` (no headings inside summary); /servicios category; homepage band; footer link on every page with the footer; sitemap, llms.txt; OG image; bump `?v=`; tests `test/ai-video-page.test.mjs` + page in `seo-and-tracking` and `site-wide-design` lists (assertions listed in the plan).
3. `./verify.sh` + `npm test`, render check desktop + 375 px (Claude in Chrome at 127.0.0.1:8783, see lessons), app-reviewer, decision file in MAIN checkout `docs/decisions/2026-11-25-ai-video-offer-page.md`, report to Jan (copy sample to read, demo reels, deploy).
