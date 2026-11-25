# AI receptionist: booking and lead tool plan
Date: 2026-11-25 · Status: proposed · Scope: research only, no code, no prompt text

## Problem
The agent has no tools. It collects name, business and a preferred time, then says an advisor will confirm. Two gaps:
1. Nothing is actually booked.
2. The lead lives only in ElevenLabs. Transcripts default to 2 years but we set 90 days, and audio is not kept.

Constraints: Mon-Sat 9:00-20:00 America/Lima, solo founder, free tiers preferred. The repo's `api/` is PHP on Apache (`enviar-brief.php`, `.htaccess`, `config.php` kept out of git), and it already emails `hola@montaweb.pe`.

## Facts from the docs
- Server (webhook) tools: LLM-filled path, query and body params; auth via secret headers, Bearer or OAuth connections; JSON response values can be saved as dynamic variables. The docs give no timeout or error-handling detail. Test this.
- System variables: `system__caller_id` (phone, no need to ask), `system__conversation_id`, `system__time`, `system__timezone` (set it to America/Lima, the default is UTC).
- Post-call webhook `post_call_transcription` carries `transcript_summary`, `data_collection_results` and `system__caller_id`. Verify the `ElevenLabs-Signature` HMAC. Return 200 or it counts as failed. Retries are optional. After 10 consecutive failures with no success in the last 7 days it is auto-disabled.
- Data collection: up to 25 fields on non-Trial and non-Enterprise plans (name, business, topic and so on). Results are readable in the dashboard and in the webhook.
- Cal.com `POST /v2/bookings`: `start` in UTC, `attendee.name` and `attendee.timeZone`, event type by id or slug, header `cal-api-version: 2026-02-25`, Bearer `cal_` key. The slots endpoint page returned 404 for me, so verify it in the Cal.com API reference. Free plan: Google Calendar sync and unlimited event types appear to be included. API-key access on free is unconfirmed (see Q1).

## Options

### (a) Server tool -> Cal.com API (live booking)
- Setup: Cal.com event type "Llamada 15 min" with Mon-Sat 9-20 Lima availability, Google Calendar connected. Two server tools: get slots and create booking. Key stored as a secret header. Phone can be passed in booking metadata or notes.
- Cost: free if the API key is allowed on the free plan. If not, it is a paid seat.
- Failure modes: the LLM mis-converts Lima to UTC (UTC-5, no DST); a slot is taken between the two calls; Cal.com is down, slow or rate-limited, which causes dead air on a phone call; the caller's name is mis-transcribed; the agent says "booked" after a failed call.
- Privacy: name, business and phone go to Cal.com (US processor) and Google. Both are cross-border transfers under Ley 29733 and need the privacy policy and consent. The calendar copy is the only persistent record, so this option alone does not solve the lead record.
- Prompt: must tell the agent to propose only slots returned by the tool, never invent times, confirm the slot aloud before booking, read back name and time after success, and offer the advisor-confirms fallback on any tool error. It also needs the timezone and the hours rule, and must say not to ask for the phone when the caller ID is present.

### (b) Post-call webhook -> small endpoint -> email/WhatsApp to founder
- Setup: `api/receptionist-lead.php` (or similar). It verifies the HMAC, dedupes by `conversation_id`, saves JSON in a protected leads dir (like `/api/leads`) and emails `hola@montaweb.pe` with name, business, phone (`system__caller_id`), preferred time and summary. It always returns 200 quickly. Enable the webhook for this agent only (Settings -> Post-call webhooks); data collection fields are defined in the Analysis tab.
- Optional WhatsApp ping: the repo has Kapso tooling. This needs a template and a Meta-verified number, so keep it for later; email is enough.
- Cost: 0 (existing hosting, existing mail).
- Failure modes: endpoint down for more than 7 days -> webhook auto-disabled (add a periodic check or an email when the lead folder is quiet); mail() lands in spam (use the existing SMTP config); callers who hang up early still produce a record, so filter on empty fields.
- Privacy: best of the three. Data stays on our host in Peru/our hosting, and we choose retention (the existing `retener-leads.php` fits). Request only the fields needed. Keep `transcript_summary`, not the full transcript.
- Prompt: the agent still says an advisor will confirm. It must say that the team will call back within a stated window (founder decides), and confirm the callback number is the one they are calling from (or ask for another).

### (c) Google Calendar via automation or script
- n8n/Make/Zapier: Make and Zapier free tiers have operation caps and are another US processor; n8n needs self-hosting (a VPS exists, but this is extra ops).
- Own script: Google Calendar API from PHP needs a service account, calendar sharing, freebusy and events.insert code, and timezone logic that we own and must maintain.
- Cost: free tier vs developer time. Highest build effort of the three.
- Failure modes: the same as (a) plus our own bugs, OAuth/service-account expiry, and no built-in availability rules, buffers or double-booking protection beyond what we code.
- Privacy: Google Calendar holds the data; a no-code vendor adds one more processor.
- Prompt: like (a), but with our own slot-offer logic.
- Verdict: reinvents Cal.com. Only worth it if Cal.com's API is not on the free plan and there is no budget.

## Comparison
| | (a) Cal.com tool | (b) Post-call lead | (c) Calendar script |
|---|---|---|---|
| Books a real slot | yes, live | no | yes, live |
| Durable lead record | no | yes | partly |
| Build effort | low-medium | low | high |
| Cost | free if API on free | 0 | 0 plus time |
| Live-call risk | yes | none | yes |
| Privacy exposure | highest | lowest | high |

## Recommendation
1. Build (b) first. It fixes the real gap (lead loss) with no call-time risk, no new processor and no cost.
2. Add (a) second, only after (b) is live and Q1 is answered. Both can run together, because (b) stays as the safety net when a booking fails.
3. Skip (c) unless (a) is blocked by pricing.

## Minimal first slice (b only)
1. Define data collection fields: name, business, topic, preferred_time (all optional strings).
2. Set the agent timezone to America/Lima.
3. Write the endpoint: HMAC check, dedupe, save JSON, email, 200. Add a test in `test/` with a signed sample payload.
4. Enable the post-call webhook for this agent and make 3 test calls (full, hang-up early, no name).
5. Update the prompt: callback promise and phone confirmation; add a short spoken data notice (wording to be written by a native-reviewed es-PE pass).
6. Set retention to 90 days and confirm it is applied to new conversations.

## Open questions for the founder
1. Does your Cal.com free account let you create an API key (Settings -> Developer)? Check before we plan (a).
2. Callback promise: how fast do you actually call back?
3. Email only, or do you also want a WhatsApp ping? (Needs a template and a verified number.)
4. Should the agent offer real slots (a) at all, or is "advisor confirms" fine for the first 30 days?
5. Where do you want the lead JSON kept, and for how long? Is there a privacy-policy / consent line for voice calls? (Ley 29733 lawyer review pending.)
6. Is the endpoint host for `api/` PHP (Apache) in production, or is it behind Caddy? A lesson in `.devkit` mentions Caddy serving `docs/` publicly, so check that `/api/leads` is not public.

## Sources
- https://elevenlabs.io/docs/agents-platform/customization/tools/server-tools
- https://elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks
- https://elevenlabs.io/docs/agents-platform/customization/personalization/dynamic-variables
- https://elevenlabs.io/docs/agents-platform/customization/agent-analysis/data-collection
- https://elevenlabs.io/docs/agents-platform/customization/privacy/retention
- https://cal.com/docs/api-reference/v2/bookings/create-a-booking
- https://cal.com/pricing (free-plan API access not confirmed; third-party summaries conflict)
