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

## Second webhook: opening hours at call start

Status: code written, not deployed, nothing set up in ElevenLabs.

`api/receptionist-init.php` is called when a call starts. Open means Monday to Saturday, 09:00 up to but not including 20:00, Lima time. It returns `advisors_open` (`si` or `no`) and `transfer_number` (the real number when open, empty when closed). It reads and stores nothing from the request.

Do these in order, after your yes to merge and deploy.

1. On the server, add two keys to `api/config.php`: `elevenlabs_init_secret` (a long random string you generate) and `receptionist_transfer_number` (the number to transfer to). Never commit either. These two have no environment variable fallback.
2. In ElevenLabs, set the conversation initiation client data webhook:
   - URL: `https://montaweb.pe/api/receptionist-init.php`
   - Request header: `X-Init-Secret`, value = the same secret.
3. Set the agent's dynamic variable placeholders to `advisors_open` = `no` and `transfer_number` = empty. Preview does not call the webhook and uses these.
4. Enable fetching initiation data from the webhook for this agent only.
5. The transfer tool must use `{{transfer_number}}` and the prompt must read `{{advisors_open}}`. Change both as a draft; publish only with your yes.

Test with real calls: one in opening hours (the mobile rings) and one outside (a callback is offered, nothing rings).

Risks: a failed or timed-out webhook can stop calls from starting, so add an uptime check, and if calls fail to start, turn the webhook off in ElevenLabs. 401 = header does not match the server secret; 503 = secret missing on the server. In hours with no number configured, the answer is `advisors_open` = `no`.
