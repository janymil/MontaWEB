# Plan: MontaWeb AI receptionist on WhatsApp (ElevenLabs Agents, native WhatsApp)
Date: 2026-11-25 · Decision: `docs/decisions/2026-11-25-ai-voice-outreach.md`

## Route chosen
ElevenLabs Agents with its built-in WhatsApp integration ("Import account" via Meta). No Kapso, no server.
- Kapso stays for MiCita only (Free plan, 1 number).
- Later option: Meta Cloud API + self-hosted Pipecat (~$0.10/call vs ~$0.26), when volume passes ~1,000 calls/month or the receptionist becomes a product for clients.

## Steps (Jan = only Jan can do it; Claude = browser or terminal, Jan watching)
1. Jan: ElevenLabs account (sign in or create). Plan: Free for tests (15 min), Starter $6 before going live.
2. Claude: create the agent draft: voice (Latin American Spanish), LLM (Gemini Flash), Spanish language, call recording off until the consent line is in.
3. Opus: write the es-PE system prompt and first message (packages, prices, hours, booking, hand-off to Jan, AI disclosure). Jan reads it and approves.
4. Test in the ElevenLabs browser widget (no number needed).
5. Jan: MontaWeb number (new prepaid SIM, not used in the WhatsApp app) + Meta Business portfolio. Then "Import account" in ElevenLabs. Jan authorizes Meta.
6. Booking: ElevenLabs webhook tool → Cal.com or Google Calendar (decide after the first tests).
7. 5 test calls from Jan's phone, check the transcripts, then put the number on montaweb.pe (separate change in this repo).

## Cost
Fixed $0–6/mo (ElevenLabs plan). Per 3-min incoming call ≈ $0.26–0.29 ($0.08/min + LLM). Meta: incoming calls free.
