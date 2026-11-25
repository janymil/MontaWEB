# 2026-11-25 — Each call the AI receptionist takes reaches hola@montaweb.pe as an email lead

## Goal
A PHP endpoint receives the ElevenLabs post-call webhook, verifies it, stores a minimal lead and emails it to the founder.

## Out of scope
Cal.com live booking (option a), WhatsApp ping, editing the ElevenLabs agent, Kapso, any deploy or server change.

## Files that will change
- `api/receptionist-lead.php` — endpoint (HMAC check, 2 MB cap, dedupe by conversation_id, JSON store, email). Functions are pure and injectable; the handler only runs when `MW_RCP_NO_RUN` is not defined.
- `api/config.example.php` — documents `elevenlabs_webhook_secret` (real value lives in untracked `config.php` or env `ELEVENLABS_WEBHOOK_SECRET`).
- `api/retener-leads.php` — also purges `rcp-*.json` after 90 days.
- `test/php/receptionist-lead.test.php` — PHP CLI test of the logic (no PHP on this workstation, see risk).
- `test/receptionist-lead.test.mjs` — runs the PHP test when `php` exists; always checks storage is private (Caddy `@private`, gitignore, `.htaccess`), no hardcoded secret, retention covers the files.
- `deploy/Caddyfile` — no change needed: `/api/leads/*` is already 404 (`@private`); leads stored in `api/leads/`.
- `docs/plans/ai-receptionist/webhook-setup.md` — steps for the founder in ElevenLabs.

## The risk
Wrong HMAC check → real leads rejected (founder loses calls, noticed when the inbox stays empty; ElevenLabs auto-disables after 10 failures). Wrong storage path → lead data public (checked by test). PHP could not be run here; first real run is the founder's test call.

## How it is proven
- `test/php/receptionist-lead.test.php`: bad/missing/stale signature, valid signature, oversize, malformed JSON, dedupe, mail-retry, empty lead ignored, field minimisation.
- `test/receptionist-lead.test.mjs`: storage privacy and config checks.
- Gate: `./verify.sh`, `npm test`.

## Steps
1. Plan, then tests. 2. Endpoint. 3. Retention + config example. 4. Setup note. 5. Gate, commit.

## Review
- [ ] Q1 · plain sentence:
- [ ] Q2 · test that fails without the change:
- [ ] Q3 · `./verify.sh` — result:
- [ ] Q4 · risk:
- [ ] Q5 · reviewer:
