# The homepage promo reel is self-hosted as WebM + MP4
Date: 2026-11-24 · Status: accepted

## Context

MontaWeb has a 28-second, 480×854 vertical promo (H.264/AAC, 2.4 MB) and wants it on the front page. The options were: upload it with the site (self-hosted), store it in a Cloudflare R2 bucket, or publish it on YouTube and embed the player.

## Decision

Self-host it in the existing document root: `images/video/montaweb-promo.webm` (VP9 + Opus, ~1.4 MB), `images/video/montaweb-promo.mp4` (H.264 + AAC, ~1.2 MB) as a fallback, and a 480×854 poster. Caddy already serves `/images/*` with a 7-day `Cache-Control` behind Cloudflare, so no server, DNS or bucket configuration changes are needed.

## Why

- **Self-hosted wins at this size.** One short reel is a rounding error next to the existing images; the browser uses ranged requests (`accept-ranges: bytes`) and Cloudflare absorbs repeat traffic. It keeps the site a single deployable, with no extra credentials, CORS rules, or storage bill.
- **YouTube is for reach, not for the hero.** An embedded player adds third-party cookies and consent obligations, drops the brand around the video, and its autoplay is out of our control. It is still worth uploading there as a discovery channel, but not as the main player.
- **R2 is the answer to a different problem.** It pays off once many or long videos would compete with page traffic, or when video bandwidth needs to be off the VPS/CDN bill. Right now that would add a moving part without moving any weight.
- **Both codecs, WebM first.** WebM/VP9 is the smaller-risk default for Chrome, Firefox and Edge; H.264/MP4 keeps Safari and older devices working. `preload="none"` and playback only when half the reel is visible keep it off the initial load.

## Consequences / next steps

- `Videos/montaweb_promo.mp4` stays the untracked master; re-encode from it if the reel ever changes.
- Keep new videos under ~2 MB, or revisit this decision (R2 + HLS) when several videos share the homepage.
- Uploading the same reel to YouTube as an extra discovery channel is compatible with this decision and does not change the page markup.
