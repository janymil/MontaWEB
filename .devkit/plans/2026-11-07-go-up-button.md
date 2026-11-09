# 2026-11-07 — a "go up" button on every page, and it is there as soon as you are scrolled

## Goal

Every HTML page of the site gets a working "volver arriba" button, and on the pages that already
had one it is visible immediately when the page opens already scrolled (e.g. arriving at
`/servicios#precios` from the menu).

## What is actually there today (checked, not assumed)

`js/app.js` → `initBackToTop()` already injects a `.back-to-top` button, and every page that loads
`js/app.js` (index, servicios, ejemplos, contacto, brief, diseño-web-lima, restaurante, gracias,
gracias-descarga, 404, privacidad, terminos) therefore has one. Two real gaps remain:

1. The button only appears after a `scroll` event. A page opened on an anchor
   (`/servicios#google-mi-negocio`, linked from the nav on every page) is already scrolled and shows
   no button until the reader moves.
2. Three pages load neither `js/app.js` nor `css/montaweb.css`, so they have no button at all:
   `google-mi-negocio.html`, `google-negocio-con-imagenes.html`, `google-negocio-moderno.html`.
   They are long articles, i.e. exactly the pages that need one.

## Out of scope

- `test-calculator.html` — a dev sandbox; it loads `js/main.js`, which has its own button.
- The untouched `.back-to-top` copy in `css/style.css` / `js/main.js` (that pair belongs to
  `test-calculator.html` only; removing it is a separate cleanup).
- Any redesign of the floating WhatsApp / price-comparator buttons.
- `attached_assets/**` — vendored article exports, not served pages.

## Files that will change

- `js/app.js` — `initBackToTop()`: `id="back-to-top"`, `type="button"`, `title`, no duplicate
  injection, and compute the initial state on load (fixes gap 1).
- `css/montaweb.css` — `.back-to-top` gets `display:flex` centring plus hover/focus-visible states.
- `google-mi-negocio.html`, `google-negocio-con-imagenes.html`, `google-negocio-moderno.html` —
  self-contained button (inline CSS + 8 lines of JS in their own palette). No new shared files:
  these pages must stay portable.
- `test/back-to-top.test.mjs` — new, behavioural.
- `test/pages-have-go-up.test.mjs` — new, coverage of every page.
- `package.json` — `npm test` becomes `node --test test/` (today it is
  `echo "Error: no test specified" && exit 1`, i.e. the gate cannot pass at all).
- Cache-busting `?v=` on the two shared files that changed, in every page that references them.

## The risk

A fixed button that sits on top of something the reader needs. If the position is wrong the button
covers a link or the WhatsApp widget, and nothing errors — it would only be noticed by a person on
a phone. Mitigation: same slot as the button that is already shipping (bottom-left on the design
system, bottom-right on the three articles, which have no other floating control), and
`z-index` below the modals.

## How it is proven

- Test: `test/back-to-top.test.mjs` — runs the real `js/app.js` against a minimal DOM harness and
  asserts (a) a `#back-to-top` button exists after `DOMContentLoaded`, (b) it is **shown on load
  when `window.scrollY` is already past the threshold**, (c) it hides/ shows across the threshold,
  (d) `click` scrolls to `0,0`. (b) fails on the old code.
- Test: `test/pages-have-go-up.test.mjs` — every `*.html` in the repo root either loads a script
  that injects the button (`js/app.js` / `js/main.js`) or carries its own `id="back-to-top"`.
  Fails on the old code for the three Google articles.
- Gate: `./verify.sh`

## Steps

1. Rewrite `initBackToTop()` in `js/app.js`; add the CSS states.
2. Add the self-contained button to the three article pages.
3. Write the two test files; point `npm test` at them.
4. Bump `?v=` for `js/app.js` and `css/montaweb.css` everywhere they are referenced (Caddy serves
   `/js/*` and `/css/*` with a 24 h TTL, so without the bump a returning visitor keeps the old file).
5. `./verify.sh`, then the reviewer pass.

## Review — filled in after building, by the reviewer pass

Not by the author in the same sitting. See `.devkit/prompts/reviewer.md`.

- [x] Q1 · plain sentence a non-developer can read: Every page of the site, including the three
      Google guides, now has a "volver arriba" button — and it is already showing when you land
      halfway down a page (for example from a menu link to `/servicios#precios`), which it was not before.
- [x] Q2 · the test that fails without this change: `test/back-to-top.test.mjs` — "the button is
      visible on load when the page opens already scrolled" and "app.js injects exactly one go-up
      button" (old code had no `id`), plus `test/pages-have-go-up.test.mjs` for the three Google
      guides, which had no button at all. Verified against `git show HEAD:js/app.js`: the old script
      leaves `show` off and sets no id.
- [x] Q3 · `./verify.sh` — result: `VERIFY OK — 1 step(s) in 0s: tests` (exit 0), 23 tests.
- [x] Q4 · the risk, named: a fixed control can cover a link on a small screen, and nothing errors
      when it does — a reader on a phone would notice before we would. Mitigated by reusing the slot
      the button already shipped in, and bottom-right on the three articles, which have no other
      floating control.
- [x] Q5 · the reviewer read the diff (who, when): second pass over the diff against the five
      questions after the gate went green; it caught that the three articles would print the floating
      button, now hidden with `@media print`.
- [x] `lessons.md` updated — two entries (the button already existed; `?v=` never changed).
