# MontaWeb

MontaWeb: web-design agency site (Semantika TECH) for small businesses in Peru, plus client demo sites in subfolders.

## Stack
Static HTML/CSS/JS (`css/`, `js/`, `images/`), small API in `api/`, EmailJS contact form. Tests with `node --test` in `test/`.

## Commands
- `npm test`: node --test
- `./verify.sh`: devkit gate

## Where things are
Client demo sites live in their own folders (e.g. `edenbar/`, `gimnasiolaalameda/`). Deploy files in `deploy/`.
- Decisions: `docs/decisions/` (one file per decision; read the relevant one before changing pricing, features, legal or architecture).
- New one-off scripts go in `scripts/`; reports in `docs/reports/`; plans in `docs/plans/`. Nothing new in the repo root.

<!-- devkit:begin -->
## devkit is active in this app

- The gate is `./verify.sh`; its steps are in `.devkit/profile.sh`.
- Definition of done and the reviewer pass: `.devkit/DONE.md` and `.devkit/prompts/reviewer.md`.
- Read `.devkit/lessons.md` before editing — an older lesson beats your instinct.
- A change bigger than one file starts as a plan in `.devkit/plans/`.
<!-- devkit:end -->
