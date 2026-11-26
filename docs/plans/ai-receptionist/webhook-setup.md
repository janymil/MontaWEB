# Post-call lead webhook: setup steps (founder does these)

Date: 2026-11-25 · Status: live since 2026-11-25 (webhook 47d5ddfb…, attached to the agent only; secret in server api/config.php; data fields name, business, preferred_time added; signed test passed). Not yet done: agent timezone and 90-day retention (step 4).

The endpoint is `api/receptionist-lead.php`. It checks the ElevenLabs signature, stores name, business, caller phone, summary and preferred time in `api/leads/rcp-<conversation_id>.json` (not public: Caddy answers 404 for `/api/leads/*`), and emails `hola@montaweb.pe`. Files are purged after 90 days by `api/retener-leads.php` (daily cron already in `deploy/montaweb-lead-retention.cron`).

## Before it works (needs your yes, nothing here was done)
1. Merge and deploy the branch to the server (see `.devkit/lessons.md` for the deploy procedure).
2. Make sure `api/config.php` exists on the server with working SMTP (same file the brief form uses).

## In ElevenLabs
1. Agents → MontaWeb Recepcionista → **Analysis** tab → Data collection. Add these string fields with these exact ids: `name`, `business`, `preferred_time`. (A `topic` field is fine but is not stored.)
2. Settings → **Post-call webhooks** (workspace level) → create a webhook:
   - URL: `https://montaweb.pe/api/receptionist-lead.php`
   - Authentication: HMAC (the default). ElevenLabs shows the **secret** once; copy it.
   - Event: `post_call_transcription` only (audio events are ignored by the endpoint).
3. Enable that webhook for this agent only (Agent → Advanced/Security → post-call webhook), not workspace-wide.
4. Set the agent timezone to America/Lima and keep transcript retention at 90 days.

## On the server
1. Put the secret in `api/config.php` as `'elevenlabs_webhook_secret' => '…'` (see `api/config.example.php`), or set the environment variable `ELEVENLABS_WEBHOOK_SECRET` for PHP-FPM. Never commit it.
2. Check that `https://montaweb.pe/api/leads/` and a lead file URL answer 404.

## Test
1. In ElevenLabs use "Send test event" if offered, or make a test call and say a name and a business.
2. Within a minute an email "Nuevo lead (llamada) — …" arrives at `hola@montaweb.pe`; the same call delivered twice sends one email.
3. Make a second call and hang up at once: no email, no file (by design).
4. If nothing arrives: ElevenLabs → Post-call webhooks shows the delivery status. 401 = wrong secret, 503 = secret missing on the server, 502 = server could not send the email (the lead is kept and the retry sends it). After 10 failures with no success in 7 days ElevenLabs disables the webhook, so check this after go-live.
