# 2026-11-23 — Give visitors a distinctive, interactive way to understand and choose MontaWeb

## Goal

Replace the homepage with a responsive editorial-studio experience that showcases real work, explains services clearly, and helps visitors start the right project.

## Out of scope

- Pricing, company details, contact details, and service scope changes.
- Backend, deployment, DNS, or production changes.
- Rebuilding the legal, brief, stand-alone guides, or client demo sites.
- Redesigning the internal content of secondary pages; their existing routes and content remain intact.

## Files that will change

- `index.html` — new homepage content hierarchy, accessible markup, SEO and real portfolio imagery.
- `css/home.css` — isolated visual system and responsive component styles for the new homepage.
- `js/home.js` — demo switcher, mobile navigation, project recommender, scroll and pointer interactions.
- `test/homepage-redesign.test.mjs` — structural and interaction regression coverage.
- `test/pages-have-go-up.test.mjs` — correctly distinguish immediate redirect documents from readable pages.
- `docs/decisions/2026-11-23-editorial-homepage-redesign.md` — design decision record.
- `.devkit/lessons.md` — only if implementation reveals a reusable surprise.

## The risk

A broken homepage interaction or mobile layout would immediately affect new visitors and could prevent them from reaching WhatsApp; browser checks and direct contact-link tests reduce that risk.

## How it is proven

- Test: `test/homepage-redesign.test.mjs` verifies the new experience, accessible controls, real imagery, preserved contact routes, and working recommendation logic.
- Gate: `./verify.sh`.
- Manual: browser rendering and interaction checks at desktop and mobile widths, including reduced motion and keyboard navigation.

## Steps

1. Establish the new editorial visual direction and rebuild the homepage without changing business facts.
2. Add the isolated responsive stylesheet and lightweight interaction layer.
3. Add regression tests and run the project gate.
4. Inspect the result in a real browser at multiple viewports and review the complete diff separately.

## Review — filled in after building, by the reviewer pass

Not by the author in the same sitting. See `.devkit/prompts/reviewer.md`.

- [x] Q1 · plain sentence a non-developer can read: The homepage is now a distinctive, mobile-friendly showcase with interactive examples and a short tool that helps visitors choose a web plan.
- [x] Q2 · the test that fails without this change: `test/homepage-redesign.test.mjs` checks the new design layer, decision journey, real demo assets, recommendation logic, process controls, responsive/accessibility features, and WCAG contrast tokens; reverting the homepage and its assets fails these cases.
- [x] Q3 · `./verify.sh` — result: VERIFY OK, 1 step (tests), rerun after the reviewer accessibility fix.
- [x] Q4 · the risk, named: A homepage-only design or interaction regression could prevent new visitors from reaching WhatsApp; no production deployment was performed, and secondary page content remains isolated.
- [x] Q5 · the reviewer read the diff (who, when): Separate reviewer pass by Cline on 2026-11-23 after the first green gate; found and fixed low accent/footer text contrast, then reran browser and gate checks.
- [x] `lessons.md` updated — documented the redirect-only page assumption found in the existing go-up test.

### Review verdict

PASS — keep an eye on conversion from the redesigned homepage after deployment; the primary remaining risk is real-user behavior rather than a known functional defect.

### Browser review evidence

- Chrome desktop at 1440px: no overflow, complete visual render, no JavaScript errors.
- Chrome mobile at 390px: no overflowing content, correct headline wrapping, working menu and visible transition state.
- Intermediate widths 681, 768, 1024, and 1920px: no overflow.
- Demo switcher, process accordion, two-step recommender, content-help handoff, and WhatsApp URL generation exercised successfully.
- Reduced-motion rendering verified; HTML audit found unique IDs, image alternatives, explicit button types, and valid JSON-LD.
