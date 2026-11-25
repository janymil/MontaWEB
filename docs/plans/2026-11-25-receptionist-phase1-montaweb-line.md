# Phase 1 plan: MontaWeb's own AI receptionist (WhatsApp calls + a normal phone line)
Date: 2026-11-25 · Status: superseded by `ai-receptionist/implementation-guide.md` (virtual number, no SIM) · Builds on: `2026-11-25-ai-receptionist-setup.md`, `ai-receptionist/booking-tool-plan.md`
Facts and sources: `docs/research/2026-11-25-ai-receptionist-numbers-and-market.md`

## Goal
Anyone who calls MontaWeb, by WhatsApp or by a normal phone call, reaches the ElevenLabs agent "MontaWeb Recepcionista". It answers questions, recommends a plan and takes a callback request. Jan gets the lead by email (and later WhatsApp) within a minute of the call ending.

## The number: yes, it is a company number
- Get it in the name of **SEMANTIKA TECH E.I.R.L.** (RUC 20616806981), not Jan personally. Virtual number providers (Telnyx, Zadarma, DIDWW) sell Lima numbers only to companies and ask for the company registration (vigencia de poder / ficha RUC), the representative's ID and a Lima address proof under 3–6 months old. The San Isidro address on `privacidad.html` works if there is a utility bill or lease in the company's name for it. **Check before ordering.**
- No MTC/OSIPTEL registration was found for a business that *uses* a virtual number (the provider is the licensed party). DS 018-2026-MTC (numbering) was not fully read. Low risk, but it goes on the `/lawyer` check list.
- Keep **+51 965 403 196** as it is for now (Jan's human line on the site). It is not migrated.

## Recommended setup: one published number, two doors
| Door | How it reaches the agent | Monthly cost | Status |
|---|---|---|---|
| WhatsApp call to the new MontaWeb number | Meta WhatsApp Cloud API → ElevenLabs native WhatsApp integration | $0 (inbound is free from Meta) | planned, in `handoff-2026-11-25-whatsapp-number.md` |
| Normal call to that same number | the SIM forwards all calls (`**21*`) → Lima virtual number → SIP trunk → ElevenLabs | SIM plan ~S/ 30–40 + DID ~$5 | new |
| (optional) Lima landline 01 xxx xxxx on the site | same DID, published directly | included above | optional |

Why one number: Peruvians call and write the same number, and a mobile number is what goes into Google Business Profile and on the WhatsApp button. Normal calls ride on the same SIM through forwarding. A SIM whose number is registered on the Cloud API can no longer use the WhatsApp app, but it still receives normal calls, so forwarding them is safe.

### Provider for the Lima virtual number (DID)
1. **Zadarma Lima +51 1, $5/mo, no setup fee**, business documents. ElevenLabs supports generic SIP, but Zadarma has never been tested with it. **Spike first** (one month = $5).
2. Fallback: **Telnyx Peru local** (ElevenLabs has a published SIP guide for Telnyx). Same documents; its price page is inconsistent ($1–13.50/mo), so ask sales.
3. Skip Twilio: only Peru toll-free is listed, at $135/mo + $0.40/min inbound.

### SIM for the number
A **postpaid line in the company's name with unlimited national minutes** (Bitel, Entel, Claro or Movistar, about S/ 30–40/mo). A forwarded call is billed to the forwarding line as an outgoing call, so prepaid credit would run out. Ask the operator in store: "¿el desvío de llamadas a un fijo de Lima consume minutos del plan ilimitado?". The SIM sits in a cheap spare phone (or a dual-SIM phone) only to receive the Meta verification code and keep the line active.

## Technical build (in order)
| # | Step | Who | Tool |
|---|---|---|---|
| 1 | Finish the agent: v2 prompt, closing line, settings (already drafted) | Jan approves, Claude pastes | ElevenLabs |
| 2 | Company postpaid SIM | Jan (store, RUC) | operator |
| 3 | WhatsApp: new WABA "MontaWeb" in Meta Business, import into ElevenLabs, assign agent | Jan clicks Meta consent and types codes | ElevenLabs + Meta |
| 4 | Lead record: post-call webhook → `api/receptionist-lead.php` (HMAC check, dedupe, JSON in a protected folder, email to hola@) + data-collection fields | sonnet implementer, TDD, `./verify.sh` | PHP on current hosting |
| 5 | Order the Zadarma DID with company docs | Jan | Zadarma |
| 6 | SIP spike: Zadarma DID → ElevenLabs SIP trunk (inbound, codec, caller ID passes as `system__caller_id`) | Claude with Jan | ElevenLabs phone numbers |
| 7 | Forwarding `**21*<DID>#` on the SIM; test 5 normal calls + 5 WhatsApp calls | Jan dials, Claude reads transcripts | phone |
| 8 | Hand-off: "transfer to number" tool → Jan's line (+51 965…) in working hours, for "quiero hablar con una persona" | Claude configures, Jan tests | ElevenLabs system tools |
| 9 | Legal check (`/lawyer`): recording/transcript wording, AI disclosure, cross-border transfer to ElevenLabs (US), privacy-policy paragraph | Jan + lawyer mode | — |
| 10 | Publish the agent (Jan's yes), then put the number on montaweb.pe: header, contacto, footer, JSON-LD `telephone`, Google Business Profile | Jan's yes; separate code change | repo |
| 11 | Later: Cal.com booking tool (option (a) in `booking-tool-plan.md`) | after step 4 is stable | Cal.com |

## Tools we need
ElevenLabs Agents (Starter $6 → Creator $22 when live) · Claude Haiku 4.5 as the agent's LLM · Meta Business + WhatsApp Cloud API (free inbound) · Zadarma (or Telnyx) DID · company postpaid SIM · current PHP hosting for the webhook · email (existing) · Cal.com later.

## Monthly cost at launch (~100 calls × 3 min)
ElevenLabs ~$22 + LLM ~$3 + DID $5 + SIM ~S/ 35 ≈ **S/ 150/mo**. If volume is low, stay on Starter + overage.

## Done when
10 test calls (5 WhatsApp, 5 phone) answered correctly, each producing a lead email; Jan has read the transcripts; legal check done; agent published with Jan's yes.
