# Target outreach with a willingness-to-pay score from the Lima web census
Date: 2026-11-24 · Status: proposed

## Context
The Lima web census (19,168 independent businesses) shows who lacks a website. Not every business without a site will pay, and Jan doesn't want to spend time on ones that won't.

## Decision
- Score each active no-site business on: paid for a site before (broken/parked), social-only presence, category ticket size, reviews, claimed profile, rating, photos, zone. Contact score ≥ 9 first (538 leads).
- First batch: the 186 hot leads whose site is broken, parked or redirects to social (384 such businesses in total).
- Next demo pages: veterinaria, dental, spa, hotel. Each sells a money feature (booking, memberships, direct booking), not "a website".
- Outreach: personalised preview from the business's own Google listing, sent 1:1 by WhatsApp. No mass broadcasts.

## Why
Moderna + Centro hold 62% of hot leads, but strong Norte/Sur businesses score just as well, so we filter by score, not by district. Full analysis: `docs/research/2026-11-24-targeting-strategy.md`.

## Consequences / next steps
- Hot lead list exported to the git-ignored `docs/research/lima-web-census/private/` folder. Keep it private, out of the repo.
- Re-weight the score after the first 30 messages per category, using reply and sale rates.
- Legal check of cold WhatsApp outreach before scaling.
