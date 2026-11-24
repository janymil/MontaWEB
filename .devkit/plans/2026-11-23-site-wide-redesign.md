# 2026-11-23 — Make the whole public website consistent and comfortably readable

## Goal

Apply the homepage's editorial design to every public site page, increase the type scale, and preserve every existing business workflow.

## Out of scope

- Pricing, legal, company, service-scope, backend, deployment, or DNS changes.
- Client demo sites, instant redirect documents, downloads, and three self-contained legacy Google articles.
- Rewriting form logic or changing form destinations.

## Files that will change

- `index.html`, `servicios.html`, `ejemplos.html`, `contacto.html`, `empresa.html`, `brief.html`, `diseño-web-lima.html`, `privacidad.html`, `terminos.html`, `404.html`, `gracias.html`, `gracias-descarga.html` — shared shell, design assets, page classes, pricing link.
- `css/home.css` — remove the micro-type decisions from the homepage.
- `css/site.css` — shared editorial system and layouts for secondary pages.
- `js/site.js` — shared accessible navigation and scroll behavior.
- `scripts/unify_site_design.py` — repeatable static-shell migration for the 12 documents.
- `test/site-wide-design.test.mjs` — coverage, typography, navigation, form-preservation, pricing-link, and brief autosave-race checks.
- `js/brief.js`, `brief.html` — final browser-QA fix: cancel a pending draft save on successful submission and bump the script cache version.
- `images/modern/favicon.svg`, root favicon/Apple/PWA PNG and ICO assets, `site.webmanifest` — replace the legacy gradient-favicon with the header's orange star mark and complete browser fallbacks.
- `docs/decisions/2026-11-23-site-wide-editorial-design.md` — expanded design decision.
- `.devkit/lessons.md` — record reusable migration surprises only.

## The risk

Global visual overrides could hide form errors, break mobile layouts, or make interactive controls unreadable across many pages; every public page therefore needs browser overflow and runtime checks, with explicit checks for contact, brief, filters, and calculator behavior.

## How it is proven

- Test: `test/site-wide-design.test.mjs` fails if any public page loses the shared shell, if micro-type returns to key components, if forms lose their handlers, or if the all-services link disappears.
- Gate: `./verify.sh`.
- Manual: Chrome screenshots and interaction checks for all 12 pages at desktop and mobile widths; contact and brief code-path validation without sending real submissions.

## Steps

1. Establish the readable type scale and shared navigation/footer.
2. Migrate all public documents to the shared shell without changing content or form logic.
3. Build secondary-page layouts for catalog, portfolio, contact, company, brief, legal, and utility pages.
4. Add regression coverage, run the gate, and inspect every page in Chrome.
5. Complete a separate reviewer pass and address findings.

## Review — filled in after building, by the reviewer pass

- [x] Q1 · plain sentence a non-developer can read: Every public page now shares the same readable editorial design, and the existing forms and interactive tools work consistently on desktop and mobile.
- [x] Q2 · the test that fails without this change: `test/site-wide-design.test.mjs` checks the shared shell, readable typography, preserved forms and workflows, light-surface feedback colors, and the brief autosave cancellation; reverting those changes fails the relevant cases.
- [x] Q3 · `./verify.sh` — result: VERIFY OK, 1 step (tests), 52 tests passed after the final QA fixes.
- [x] Q4 · the risk, named: Shared visual overrides could affect readability or a workflow on an uncommon viewport; all 12 pages were checked at desktop/mobile sizes, and no production deployment or real form submission was performed.
- [x] Q5 · the reviewer read the diff (who, when): Cline reviewer pass on 2026-11-24 after the green gate; final browser review found and fixed faint contact feedback and a pending-autosave race, then reran the gate and browser checks.
- [x] `lessons.md` updated — recorded the autosave race and legacy feedback-color surprise.

### Review verdict

PASS — production EmailJS/PHP delivery remains an integration check after deployment; submissions in this QA were deliberately mocked.

### Browser review evidence

- All 12 public pages reviewed through desktop/mobile contact sheets and full-page homepage rendering; safe image dimensions avoided the earlier provider limit.
- Final interaction run: 28/28 checks passed, covering every mobile menu, homepage tools, calculator, filters, FAQs, contact states, six brief steps, autosave/restore, fallback/download/success, resource downloads, and back-to-top.
- Contact and brief submissions were mocked; no real email or backend request was sent. Zero uncaught JavaScript exceptions occurred in the final interaction pass.
