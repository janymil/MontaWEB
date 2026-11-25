# Handoff: test and finish the MontaWeb AI voice receptionist (ElevenLabs Agents)
2026-11-25 · MontaWeb main checkout, branch main · Uncommitted changes: yes (docs only from this session, plus Jan's unrelated WIP; nothing committed, don't commit without asking)

## Goal
An AI receptionist answers calls to a MontaWeb WhatsApp number in natural Peruvian Spanish, qualifies the caller, quotes the right package and collects a booking request for Jan. Done = 5 good test calls from Jan's phone, then the number goes on montaweb.pe.

## Done so far
- Decision: `docs/decisions/2026-11-25-ai-voice-outreach.md` (consent-only calls, inbound first, no cold AI calls, guardrails; route update at the end).
- Plan: `docs/plans/2026-11-25-ai-receptionist-setup.md`.
- Prompt (approved by Jan): `docs/plans/ai-receptionist/prompt-es-PE.md`, written by Opus from site facts, with sources and 9 open questions.
- ElevenLabs agent "MontaWeb Recepcionista" (draft, NOT published), in the account Jan is signed into in the built-in browser:
  https://elevenlabs.io/app/agents/agents/agent_9801m89s382pf83adk7an3mff8c7/agent
  Language Spanish · voice Jair Solano (Peruvian) · LLM Claude Haiku 4.5 · timezone America/Lima · first message + system prompt pasted and checked (12 sections, 11k chars).

## Next steps
1. Jan tests with the Preview button (browser voice). Scenarios: barbershop asking prices, restaurant, asks for a discount (→ hand-off to Jan), asks "¿eres una persona?", asks about IGV, refuses recording.
2. Check transcripts in ElevenLabs → Conversations. Note bad phrasing, wrong prices, slow replies.
3. Any change to Spanish text → an **opus** subagent (Jan's non-English rules + Humanizer), Jan approves, then paste.
4. If replies feel slow: compare LLM latency in the picker. If the Spanish is weak: try a stronger model and compare.
5. Settings to check: recording/data retention (can it be turned off per call?), turn timeout, max call duration, check before publishing.
6. Get Jan's answers to the open questions (bottom of the prompt file) and update the prompt.
7. Number: Jan gets a new prepaid SIM for MontaWeb → ElevenLabs WhatsApp "Import account" (Jan authorizes Meta). Publish the agent only with Jan's yes.
8. Later: booking tool (Cal.com or Google Calendar webhook), then the WhatsApp call button and number on montaweb.pe (separate code change, follow repo devkit rules).

## Gotchas
- Browser pane: coordinate clicks often miss in ElevenLabs. Use `find` → click by ref. Long text: click the field by ref, ctrl+a, then `type` (form_input not tested).
- An early misclick set the language to Azerbaijani; it was fixed to Spanish. Re-check the language before publishing.
- LLM picker shows real $/min and latency: DeepSeek Flash 4.1 $0.0076 (rejected), Haiku 4.5 $0.0083 ~550 ms, Haiku 5.5 up to 4.9 s, Gemini 3.8 Flash "slow".
- Kapso: Free plan, only number is MiCita (+51 986 751 013). Don't touch it. Kapso is not used for this.
- Meta prices (official): incoming calls free; outgoing to Peru $0.0121/min; marketing template $0.0703; utility/service $0.03; 1,000 free service msgs/number/month.
- ElevenAgents: $0.08/min on every plan; Free 15 min, Starter $6 (75 min), Creator $22 (275 min).
- Home page greets the account as "Alex": confirm it's Jan's own account before paying for a plan.

## Open questions for Jan
IGV/factura · "desde" vs fixed prices · hosting cost after 6 months · cost of the business preview · voice gender · which number sends WhatsApp links · legal check of WhatsApp outreach (`/lawyer`) before any outbound pilot.
