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
