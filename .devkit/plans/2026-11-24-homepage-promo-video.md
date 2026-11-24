# 2026-11-24 — Visitors see the 30-second promo reel right below the hero

## Goal

Put the promo video the owner recorded (`Videos/montaweb_promo.mp4`) on the front page as a web-ready, self-hosted reel.

## Out of scope

- Uploading to YouTube/Vimeo and embedding a third-party player.
- Moving media to an R2 bucket or a separate CDN.
- Changing any price, service, contact detail, or secondary page.
- Re-encoding the original file in `Videos/`; it stays as the master, untracked.

## Files that will change

- `images/video/montaweb-promo.webm` — VP9 + Opus, first source for Chrome/Firefox/Edge.
- `images/video/montaweb-promo.mp4` — H.264 + AAC, fallback for Safari and older browsers.
- `images/video/montaweb-promo-poster.jpg` — 480×854 cover frame, shown before playback starts.
- `index.html` — new `#video` section between the ticker and the manifesto, plus a cache revision bump.
- `css/home.css` — dark two-column layout with the reel inside a phone-style frame, responsive at 900px/680px.
- `js/home.js` — `initPromoVideo()`: plays only while the reel is at least half on screen, always muted, never on `Save-Data` or `prefers-reduced-motion`.
- `test/homepage-redesign.test.mjs` — regression coverage for the markup, source order, real media files and size budget.

## The risk

A heavy autoplaying video could slow the homepage for mobile visitors or hammer the VPS bandwidth; the reel is ~1.4 MB, `preload="none"`, lazy, muted, and served from the same Caddy root under `/images/*` (7-day cache, Cloudflare in front). If a visitor's browser rejects both codecs, the poster and a download link remain.

## How it is proven

- Test: `test/homepage-redesign.test.mjs` — `homepage ships the vertical promo as a light, muted, lazy WebM with an MP4 fallback` asserts the `#promo-video` attributes, WebM-before-MP4 source order, existence and size of the three assets, and a real Matroska header. Removing the section or the files fails it.
- Gate: `./verify.sh`.
- Manual: `curl` against the origin (`--resolve`) and through Cloudflare: `206 Partial Content`, `video/webm` / `video/mp4`, `accept-ranges: bytes`.

## Steps

1. Encode the master with ffmpeg into WebM (VP9 CRF 34) and MP4 (H.264 CRF 26, `+faststart`), plus a poster frame.
2. Add the section, styles and lazy-playback script; bump `?v=` for `home.css` and `home.js`.
3. Add the regression test and run the gate.
4. Commit only these paths, push `origin main`, `git pull --ff-only origin main` on the Washington server, verify with curl.

## Review — filled in after building, by the reviewer pass

- [x] Q1 · plain sentence a non-developer can read: The MontaWeb promo video now plays near the top of the front page, silently and only while it is visible, with a button to start a WhatsApp conversation next to it.
- [x] Q2 · the test that fails without this change: `test/homepage-redesign.test.mjs` · "homepage ships the vertical promo as a light, muted, lazy WebM with an MP4 fallback".
- [x] Q3 · `./verify.sh` — result: VERIFY OK — 1 step (tests), 58 tests passing.
- [x] Q4 · the risk, named: A 1.4 MB reel on the critical path would cost mobile data and VPS bandwidth; mitigated by `preload="none"`, half-visible playback only, `Save-Data`/reduced-motion opt-out, and Cloudflare caching. Whoever notices: the owner, via analytics or a slow first load.
- [x] Q5 · the reviewer read the diff (who, when): Reviewer pass by Cline on 2026-11-24, after the green gate, reading the diff a second time; added the codec-order and file-header assertions after that pass.
- [x] `lessons.md` updated — VP9 came out larger than H.264 at this size.

### Review verdict

PASS — a visitors-facing addition with no backend change. The remaining risk is real-user bandwidth, not correctness.
