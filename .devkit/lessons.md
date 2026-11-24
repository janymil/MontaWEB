# Lessons — this app

One line per surprise, newest first. Cheaper than rediscovering the same trap next month.

Format: `YYYY-MM-DD — what happened — what to do next time`

Delete a lesson only when the thing that caused it no longer exists.

---

- 2026-11-24 — the brief's debounced autosave could recreate a draft after success, and legacy dark-theme status text was faint on the new light cards; cancel pending saves before clearing storage and override feedback colors in `site.css`.
- 2026-11-23 — `clinica.html` and `restaurante.html` are immediate redirects, but the shared page test required a scroll button on them; detect redirect-only documents and verify their destination instead of forcing unused UI onto them.
- 2026-11-07 — "add a go-up button" was already built on every live page by `initBackToTop()` in `js/app.js`; the only pages without one were the three orphan Google guides. Grep for the behaviour before building it, not just for the markup.
- 2026-11-07 — every page pins `js/app.js?v=2026` and Caddy serves `/js/*` with a 24 h TTL, so a fixed script keeps being served from cache. Bump `?v=` whichever shared js/css file you touch. The `update-cache-version.py` the README mentions no longer exists.
