# Lessons — this app

One line per surprise, newest first. Cheaper than rediscovering the same trap next month.

Format: `YYYY-MM-DD — what happened — what to do next time`

Delete a lesson only when the thing that caused it no longer exists.

---

- 2026-11-24 — research data under `docs/` was publicly downloadable because Caddy serves the whole checkout; `/docs` and `/scripts` are now 404 via the `@private` matcher in `/etc/caddy/Caddyfile` (backup `.bak-*`). Anything new under the web root is public unless that matcher covers it.
- 2026-11-24 — the 28 s 480×854 promo re-encoded *smaller* as H.264/MP4 (1.20 MB, CRF 26) than as VP9/WebM (1.44 MB, CRF 34), so "WebM is always the light one" is false at this size; encode both, measure, and keep `<source>` order WebM→MP4 for browser support rather than for bytes.
- 2026-11-24 — "deploy to washington" looks like `git push live`, but `/var/www/montaweb` is a non-bare checkout of `main` with `receive.denyCurrentBranch` unset and no hooks, and the local `live/main` ref is often stale; deploy by pushing `origin` and running `git pull --ff-only origin main` on the server, commit only the paths you mean (the server carries its own uncommitted demo-site work), then verify the origin with `curl --resolve` because Cloudflare rewrites the public body (email obfuscation, challenge script).
- 2026-11-24 — the VPS at 216.22.17.204 does not answer HTTPS from this workstation at all (curl times out), so origin checks must run *on* the server (`ssh washington "curl --resolve montaweb.pe:443:127.0.0.1 …"`); the public hostname still works for end-to-end checks.
- 2026-11-24 — the brief's debounced autosave could recreate a draft after success, and legacy dark-theme status text was faint on the new light cards; cancel pending saves before clearing storage and override feedback colors in `site.css`.
- 2026-11-23 — `clinica.html` and `restaurante.html` are immediate redirects, but the shared page test required a scroll button on them; detect redirect-only documents and verify their destination instead of forcing unused UI onto them.
- 2026-11-07 — "add a go-up button" was already built on every live page by `initBackToTop()` in `js/app.js`; the only pages without one were the three orphan Google guides. Grep for the behaviour before building it, not just for the markup.
- 2026-11-07 — every page pins `js/app.js?v=2026` and Caddy serves `/js/*` with a 24 h TTL, so a fixed script keeps being served from cache. Bump `?v=` whichever shared js/css file you touch. The `update-cache-version.py` the README mentions no longer exists.
