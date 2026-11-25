# AI voice calls only with consent: inbound receptionist first, WhatsApp-first outbound
Date: 2026-11-25 · Status: decided (outbound part waits on the legal check)

## Context
An earlier plan (Cursor canvas, not in the repo) proposed an AI that cold-calls census leads from a +51 number and closes sales with a Culqi/Izipay link, with no human involved. Census leads never opted in, so those would be cold robocalls: legal risk (Código de Consumo art. 58, Indecopi "Gracias… no insista", Ley 29733), low pick-up rates, and brand damage.

## Decision
1. **Inbound AI receptionist first**: a phone line for montaweb.pe where an AI answers, qualifies the caller and books a call with Jan. It can later be sold to clients as an upsell.
2. **Outbound stays WhatsApp-first** (see `2026-11-24-lead-targeting-from-census.md`): a 1:1 personalised preview. Voice calls happen only after the business agrees, ideally through Kapso WhatsApp Business Calling (call permission + verified business profile).
3. **AI follow-up call (middle ground)** only with people who agreed: it walks them through the preview, answers questions, and sends the payment link only after an explicit yes.
4. No cold AI calls to census numbers.

## Guardrails for the AI caller
- It says up front that it is MontaWeb's AI assistant, and asks permission before recording.
- Before sending a payment link, it confirms package, price and scope in writing on WhatsApp.
- If anything is unclear, or the client asks for a person, it hands over to Jan.
- Jan reviews the first 20 calls (transcripts) before any scaling.

## Why
Consent turns cold calls into warm ones. It cuts the legal risk and raises trust, and the same stack (voice agent + calendar + WhatsApp) is reused across all three uses.

## Consequences / next steps
- Legal check of WhatsApp outreach and AI calls (`/lawyer`) before the outbound pilot.
- Build the inbound receptionist (platform choice, +51 or WhatsApp number, es-PE script written by opus and read by Jan).
- Budget about $0.10–0.20 per voice minute in total.
- Update 2026-11-25: platform is ElevenLabs Agents with its native WhatsApp integration (not Kapso, no server): fixed cost $0–6/mo, ~$0.26 per 3-min incoming call. LLM Claude Haiku 4.5 (DeepSeek rejected for Spanish writing quality; Haiku 5.5 latency up to 5 s). Voice: Jair Solano (Peruvian). Pipecat self-hosted is the later path at scale. Plan: `docs/plans/2026-11-25-ai-receptionist-setup.md`.
