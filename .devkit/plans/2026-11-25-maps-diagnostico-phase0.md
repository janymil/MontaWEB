# Plan: Maps diagnostico, Phase 0 prototype

Branch `maps-diagnostico-phase0`. Source plan: `docs/plans/2026-11-25-google-maps-diagnostico.md`.

## Change (owner sentence)
A script that produces a one-page mobile Google Maps report (HTML, PNG, PDF) for one business, from real search data.

## Steps
1. Tests first (`test/maps-diagnostico.test.mjs`): grid, score, competitors, fixes, render smoke.
2. `scripts/maps-diagnostico/`: grid, score, fetch (cache + cost + budget), render, snapshot (headless Edge/Chrome), run (CLI).
3. `copy-es.json` with `TODO <key>` values only (Spanish written later by a separate writer).
4. `.gitignore`: `docs/research/maps-diagnostico/private/`.
5. Generate 3 reports (2 hot leads + 1 client), real cost, budget US$1.00 for all Phase 0.

## Decisions
- Weights: top 3 = 1.0, 4-10 = 0.5, 11-20 = 0.15, absent = 0. Score = round(100 * sum / 25).
- Competitors: absent cells count as position 21; ranked by that average, ties by cells present.
- Cache dir keyed by cid + spacing + keyword, so re-runs cost 0.

## Risks
- Wrong rule/weights mislead a business owner: report text is TODO until reviewed; nothing is sent.
- Spend: hard cap tracked in `private/raw/_spend.json`.
- Private data (phones) stays in git-ignored `private/`.

## Not in scope
Public page, API endpoint, deploy, extra endpoints.
