# AI receptionist: implementation guide (internal, for Jan)
Date: 2026-11-25 · Status: guide for the plans in `docs/plans/2026-11-25-receptionist-phase1-montaweb-line.md` and `...-phase2-client-addon.md`
Sources: `docs/research/2026-11-25-virtual-number-setup-steps.md`, `docs/research/2026-11-25-ai-receptionist-numbers-and-market.md`
Client-facing version: `guia-cliente-veterinarias-es-PE.md`

Part 0 answers your three questions. Part A is MontaWeb's own line, step by step. Part B is the separate service that runs the receptionist for clients. Part C is the runbook for installing one clinic.

---

## Part 0. Short answers

### Must it be a normal SIM? No. Use a virtual number.
My first plan used a SIM only because of the WhatsApp route: Meta needs a number to verify, and Peruvians usually publish a mobile number. If WhatsApp isn't needed (see below), a SIM adds cost and a forwarding step for nothing. A **virtual Lima number (+51 1 …) from Zadarma** is better:

| | Virtual number (Zadarma Lima) | Company SIM + forwarding |
|---|---|---|
| Monthly cost | **$5 (paid yearly, $60)** or $7.50 monthly | S/ 30–40 plan + virtual number anyway |
| Incoming calls | free, 2 calls at the same time | the SIM's forwarded calls use plan minutes |
| Connects to ElevenLabs | directly, official Zadarma guide | SIM → forwarding → virtual number → ElevenLabs |
| Your outgoing calls (callbacks) | $0.016/min to mobiles, $0.008 to Lima landlines, from the same 01 number | plan minutes |
| Looks like | a Lima landline "01 7xx xxxx": serious for a company | a mobile number |
| Needs | company documents (we have them) | a store visit |

So the route is: **caller → Zadarma Lima number → SIP → ElevenLabs agent**. No phone, no SIM, nothing physical.

Zadarma has an official ElevenLabs guide (https://zadarma.com/en/support/instructions/elevenlabs/), which is why it beats Telnyx and DIDWW for us. **Telnyx** is the fallback if Zadarma rejects the documents (ElevenLabs has its own Telnyx guide; Peru local from $13.50/mo, same kind of documents). Twilio is out (Peru only toll-free, $135/mo).

Zadarma has no Peruvian mobile numbers, only landlines (Lima, Arequipa, Trujillo… and 0800/0801). That's fine for calls. It only matters for WhatsApp.

### Is WhatsApp Business necessary? No.
The receptionist answers **normal phone calls** with no Meta, Facebook or WhatsApp at all. WhatsApp only adds two optional things:
1. **WhatsApp calls answered by the AI** (people tap "call" inside WhatsApp). ElevenLabs connects to WhatsApp by "Import account" through Meta's sign-up, which needs a Facebook login that has admin rights on a Meta Business portfolio. With your account blocked, **this is parked**.
2. **WhatsApp messages** (lead alerts to you; call summaries to clinics). These can go through a provider (Kapso, 360dialog) and don't need ElevenLabs' Meta import. See Part B5 for the options. Email works on day one.

### Your blocked Facebook account: ways to get WhatsApp later
In order of preference:
1. **Appeal the block** (Meta account quality page). Cheapest, if it works.
2. **A trusted person with a clean Facebook account** (accountant, family member, future employee) creates the Meta Business portfolio for SEMANTIKA TECH E.I.R.L. and stays its admin. They click through the ElevenLabs "Import account" for you. Whether they can then add you with only a work email (no Facebook) is unconfirmed. Assume they keep doing the Meta clicks.
3. **360dialog "WhatsApp Login"** (beta): onboarding by scanning a QR code from the WhatsApp Business app, no Facebook. Business verification still applies, and payment is only by Meta credit line. Good for *messages*; probably not for ElevenLabs WhatsApp *calls*.
4. **Kapso** already works for MiCita's number. Use it to send messages from a MontaWeb number only if a new number can be added there without your Facebook (unconfirmed, ask Kapso support).

Nothing in Part A depends on this.

---

## Part A. MontaWeb's own receptionist line, step by step

### A0. What you'll have at the end
```
Caller dials 01 7xx xxxx (MontaWeb)
   → Zadarma (virtual number, PBX)
   → SIP over TCP → ElevenLabs agent "MontaWeb Recepcionista" (Claude Haiku 4.5, voice Jair Solano)
        ├─ "quiero hablar con una persona" → transfer (SIP REFER) → your mobile, in working hours
        └─ call ends → post-call webhook → montaweb.pe/api/receptionist-lead.php → email to hola@montaweb.pe
```

### A1. Shopping list
| Item | Where | Cost | Who pays/signs |
|---|---|---|---|
| ElevenLabs plan | elevenlabs.io → Agents | Starter $6 (75 min) for tests; Creator $22 (275 min) when live; $0.08/min after | Jan (card) |
| Agent's LLM | inside ElevenLabs | ~$0.008/min (Haiku 4.5) | billed by ElevenLabs |
| Lima number | zadarma.com | $60/year ($5/mo) | Jan (top-up of Zadarma balance) |
| Zadarma balance for callbacks | zadarma.com | top up $10 to start | Jan |
| Webhook endpoint | current montaweb.pe hosting | $0 | — |

**Monthly cost live:** ~$22 + $3 LLM + $5 number ≈ **$30 ≈ S/ 113** for up to ~275 min. About 90 calls of 3 min.

### A2. Documents to have ready (scans/photos, PDF or JPG)
1. **Company registration**: vigencia de poder or ficha registral of SEMANTIKA TECH E.I.R.L. from SUNARP (recent). Add the ficha RUC.
2. **Your ID**, both sides (carné de extranjería or passport).
3. **Proof of a Lima address, under 6 months old**, in the company's name if possible: a utility bill (luz/agua/internet) or the lease for Av. Javier Prado Este 560, San Isidro. If the bills are not in the company's name, ask Zadarma support in the chat *before paying* what they accept (lease + bill in the landlord's name is often accepted).

### A3. Finish the agent in ElevenLabs (before any number)
Already drafted (`settings-2026-11-25.md`, `prompt-es-PE.v2-draft.md`). Do this:
1. ElevenLabs → Agents → "MontaWeb Recepcionista". Check **Language = Spanish** (once it flipped to Azerbaijani).
2. Paste the approved v2 prompt and the max-duration line if they aren't in yet.
3. **Analysis → Data collection**: add these fields (type string, all optional):
   `nombre`, `negocio`, `rubro`, `interes` (what they want), `plan_recomendado`, `horario_preferido` (callback time), `telefono_alternativo`.
4. **Security / Overrides**: leave defaults. **Privacy**: audio storage off, retention 90 days (already set).
5. Test 5 times with the **Preview** button in the browser. Read the transcripts in **Conversations**.

### A4. Zadarma: account and number
**Plan:** stay on **Standard ($0)**. Incoming calls are free on every plan, and the AI runs on ElevenLabs. Office ($22/mo: 2,000 outgoing min, 1 number, 10 simultaneous calls, IVR, recording) only pays off above ~1,400 outgoing min/month, or when calls to several numbers start getting busy (each number includes 2 simultaneous calls; whether that is per number or per account is unconfirmed).

**Why Zadarma:** its own guide (https://zadarma.com/en/support/instructions/elevenlabs/, checked 2026-11-25) documents forwarding to `+<number>@sip.rtc.elevenlabs.io:5060;transport=tcp`, the ElevenLabs SIP trunk import with `pbx.zadarma.com`, and SIP REFER transfers. ElevenLabs' docs don't name Zadarma, but the format matches their SIP spec. Other providers need a yes to: incoming calls to an external SIP URI over TCP/TLS, caller ID passed, SIP REFER accepted. Wabi and Numero eSIM fail this (app-only numbers). FlyNumber ($5.95) and Telnyx ($13.50) pass.

**A4.0 Free test before paying (do this first):** create the free account, do A5–A7 with extension 100 but without a number, then call extension 100 from the Zadarma app. If the agent answers, the SIP link works. If an internal call can't be forwarded (untested), skip to buying the number.

1. Go to zadarma.com → **Sign up** with `hola@montaweb.pe`. Account type: **business**. Confirm the email.
2. Top up the balance (Settings → Balance; card or PayPal). $60 for the yearly number + $10 for calls.
3. **Services → Virtual numbers → Peru → Lima**. Choose a number you like (easy to say aloud, e.g. repeated digits). Choose **yearly payment** ($60).
4. Upload the A2 documents when asked (Settings → Documents / the number's "Upload documents" link). The number activates automatically once the documents are approved. The approval time is not published: plan 1–5 working days and ask support in the chat if it takes longer.
5. Write the number in E.164 format for later: `+511XXXXXXX` (example).

### A5. Zadarma: create the PBX extension for ElevenLabs
1. **My PBX → Extensions → Add** (e.g. extension `100`, name "ElevenLabs").
2. Set a **strong password** for it and save it in your password manager. You'll paste it into ElevenLabs yourself.
3. Note the SIP login shown by Zadarma for this extension (format like `123456-100`).
4. **My PBX → Incoming calls / numbers**: route the Lima number to extension `100`.

### A6. ElevenLabs: import the number as a SIP trunk
1. **Agents → Phone Numbers → Import number → From SIP Trunk.**
2. **Label**: `MontaWeb Lima`. **Phone number**: `+511XXXXXXX` (with the "+", exactly as Zadarma will send it).
3. **Inbound**: Media encryption **Disabled** (Zadarma's guide), no digest auth, Allowed numbers empty.
4. **Outbound** (needed for transfers): Address `pbx.zadarma.com`, Transport **TCP**, Media encryption **Disabled**, Username = the extension's SIP login from A5.3, Password = its password (you type it).
5. **Import**. Open the number → **Assign agent** → "MontaWeb Recepcionista".

### A7. Zadarma: send the calls to ElevenLabs
1. **My PBX → Extensions → extension 100 → Call forwarding and voicemail → Enable.**
2. Condition: **Always active**. Destination: **External server (SIP URI)**:
   `+511XXXXXXX@sip.rtc.elevenlabs.io:5060;transport=tcp`
   (your number, with "+", before the @).
3. Save. Call the number from your mobile: the agent should greet you within ~2 seconds.

### A8. Transfer to a person (working hours)
1. Agent → **Tools → System tools → Transfer to number → Enable.**
2. Type **SIP REFER** (blind transfer; warm transfer isn't supported over SIP).
3. Destination: your mobile in E.164 (`+51965403196`). Condition in the tool description: "only when the caller asks for a person or the case needs an advisor, Mon–Sat 9:00–20:00". Outside those hours the agent takes a callback request instead (already in the prompt).
4. Spanish wording for the transfer line → opus subagent, you approve (house rule).

### A9. Lead record: post-call webhook (code change in this repo)
Built by a sonnet implementer with TDD and `./verify.sh` (option (b) in `booking-tool-plan.md`):
1. `api/receptionist-lead.php`: verify the `ElevenLabs-Signature` HMAC, ignore duplicates by `conversation_id`, keep only the summary + data-collection fields + `system__caller_id`, save JSON in a folder outside the public web root, email hola@ with the lead, and return 200 fast.
2. In ElevenLabs: **Settings → Post-call webhooks → Add** the URL + secret; enable it for this agent only.
3. Retention: delete lead files after 12 months unless they became clients (reuse `retener-leads.php`).
4. Alert if no webhook arrives for 7 days while calls happen (ElevenLabs disables a webhook after 10 failures and 7 days without a success).

### A10. Test plan (10 calls before going live)
| # | Scenario | Check |
|---|---|---|
| 1 | Barbershop asks prices | right package, "desde" kept |
| 2 | Restaurant wants a menu QR + web | recommends one plan, no invented price |
| 3 | Asks for a discount | offers an advisor, doesn't promise |
| 4 | "¿Eres una persona?" | short disclosure line |
| 5 | Asks for a person (in hours) | transfer rings your mobile |
| 6 | Asks for a person (Sunday) | takes callback request |
| 7 | Refuses to continue / rude | ends politely |
| 8 | Silent caller | hangs up after 30 s |
| 9 | Caller from a landline | `system__caller_id` correct in the lead email |
| 10 | Long chat | closing line at 600 s |
Also check the **caller ID** reaches ElevenLabs (unconfirmed for Zadarma forwarding). If it arrives empty or as your Zadarma number, the agent must ask for the callback number (prompt tweak).

### A11. Legal check, then go live
1. `/lawyer`: AI disclosure wording, transcripts (stored 90 days) vs "no la grabamos", transfer of call data to ElevenLabs (US), and a paragraph for `privacidad.html` ("Llamadas atendidas por nuestro asistente virtual").
2. Publish the agent (your yes).
3. Code change: put the number on montaweb.pe (header, contacto, footer, JSON-LD `telephone`), and on Google Business Profile.

### A11b. One company, several apps (MontaWeb, MiCita, …)
The Zadarma account belongs to SEMANTIKA TECH, so it serves all apps. Recommended: **one Lima number per app** ($60/yr each, same account and documents), each routed to its own extension and its own agent, so no caller is asked "which app?". Keep one SEMANTIKA number for legal/general use (invoices, SUNAT, privacy pages) with a small front-desk agent that infers the app from the first sentence, asks only if unclear, and hands over with ElevenLabs' agent-transfer tool (untested over SIP). Optional later: look up the caller's number before the call to greet known customers by name.

### A12. Your callbacks from the same number
Install the **Zadarma app** (iOS/Android) or a softphone, logged in with a *second* extension (e.g. `101`, "Jan"). Outgoing calls show the 01 number and cost $0.016/min to mobiles. Use it for callbacks so clients see one company number.

### A13. Troubleshooting
| Symptom | Likely cause | Fix |
|---|---|---|
| Call rings, then silence/busy | SIP URI typo, "+" missing, UDP instead of TCP | recheck A7 string |
| Agent answers but transfer fails | outbound credentials wrong | recheck A6.4; extension needs outbound rights |
| No caller number in leads | Zadarma replaces caller ID on forwarding | ask Zadarma support to pass the original CLI; else the agent asks for the number |
| Agent speaks another language | language setting flipped | Agent → Language = Spanish |
| Lead emails stop | webhook disabled after failures | check endpoint logs, re-enable in ElevenLabs |

---

## Part B. The client service ("Recepcionista"), built as a separate service

### B1. My view on "separate service": yes, with two conditions
I agree. A separate service can sell to clinics on Google Calendar, other software or no agenda, not only MiCita users, and it keeps MiCita's code and risk apart. The cost is that it needs its own tenants, keys, billing and deploy. Two conditions keep that small:
1. **No client dashboard in version 1.** Clinics get WhatsApp/email summaries and a monthly report. You manage everything with an admin API + scripts. A portal comes when there are ~10 clinics.
2. **Same stack and VPS as your other apps** (Node + TypeScript, Postgres + Drizzle, Docker + Caddy behind Cloudflare), so app-devops, backups and monitoring are reused.

### B2. What the service is
```
Clinic's number ─(forwarding)─► per-clinic Zadarma number ─SIP─► ElevenLabs agent (one per clinic)
                                                                       │ server tools (HTTPS + per-clinic secret)
                                                                       ▼
                         ┌──────────────── Recepcionista service ────────────────┐
                         │ Tool API     /tools/availability, /book, /reschedule,  │
                         │              /cancel, /find-booking                    │
                         │ Webhook in   /webhooks/elevenlabs/post-call (HMAC)     │
                         │ Connectors   MiCita · Google Calendar · Generic REST · │
                         │              None (request only)                       │
                         │ Notifier     email · WhatsApp (provider, B5)           │
                         │ Usage meter  minutes per clinic, 80 % alert, report    │
                         │ Public API   /v1/calls, /v1/bookings + outbound        │
                         │              webhooks (call.completed, booking.created)│
                         └────────────────────────────────────────────────────────┘
```
"Connect to any app" means two things: **connectors** (we call their agenda) and the **public API + outbound webhooks** (their app pulls calls or receives events from us).

### B3. Data model (first version)
- `tenants`: name, business type, plan, minutes included, status, timezone.
- `tenant_sheet`: the clinic's info (hours, services and prices, vets, emergency phone and hours, 24 h referral clinic, tú/usted). Versioned, because it feeds the agent's knowledge base.
- `tenant_channels`: Zadarma number, ElevenLabs agent id and phone-number id.
- `tenant_connector`: type (`micita` | `gcal` | `rest` | `none`) + encrypted credentials.
- `tenant_notify`: WhatsApp numbers and emails for summaries.
- `calls`: conversation id, caller number, start, duration, outcome (booked / request / urgency / info / hung up), summary, data fields. Deleted after 90 days.
- `bookings`: call id, external id in the connector, status.
- `usage_monthly`: minutes per tenant per month.
- `api_keys`: hashed keys per tenant (public API) and per-tenant tool secrets.

### B4. Connector contract
Every connector implements the same five calls, so the agent and prompt never change:
`listServices()`, `getSlots(service, from, to)`, `book(service, slot, owner, pet, phone, note)`, `reschedule(bookingId, slot)`, `cancel(bookingId)` (+ `findBooking(phone)`).
1. **MiCita**: needs a small booking API in MiCita with a per-business API key (decision + slice in the MiCita repo).
2. **Google Calendar**: OAuth with the clinic's Google account; free slots = opening hours minus busy times (freebusy); book = events.insert with the owner and pet in the description.
3. **Generic REST**: the clinic's software implements our 5 endpoints (we publish an OpenAPI file). This is how "any app" connects.
4. **None**: `book()` stores a request and the summary says "confirmar cita".
Rule for all of them: the tool answers in under 1.5 s or returns "pending", and the agent says the clinic will confirm by WhatsApp. No silent waiting on the phone.

### B5. Sending WhatsApp summaries (Facebook-independent options)
1. **Email + daily digest**: works now, no Meta.
2. **Kapso**: you already use it for MiCita. Ask support whether a second number (MontaWeb) can be connected without your Facebook. If yes, send summaries as a utility template (~$0.03 each).
3. **360dialog WhatsApp Login**: QR onboarding, no Facebook (beta).
4. **A trusted admin** with a Meta Business portfolio (Part 0).
Version 1 ships with email plus whichever WhatsApp route works first. The client guide promises WhatsApp, so fix this before the first paying clinic.

### B6. Security and data (Ley 29733)
- The clinic is **responsable**. SEMANTIKA is **encargado**. ElevenLabs and Zadarma are sub-processors. A short data-processing agreement goes with the contract (`/lawyer`).
- Per-tenant secrets on every tool call. HMAC on the webhook. Connector credentials encrypted at rest. Rate limits on the tool API.
- No audio stored. Transcripts and calls deleted after 90 days (cron job). Pet health info is not "dato sensible", but treat owners' phones as personal data.
- `app-security-auditor` reviews the tool API, webhook and connectors before the first clinic.

### B7. Build order (vertical slices, each with tests, then a review)
| # | Slice | Done when | Model |
|---|---|---|---|
| 0 | Architecture doc + repo + decision (stack, data model, API contract, OpenAPI) | approved by you | opus (app-architect) |
| 1 | Skeleton: tenants, admin API key, post-call webhook → `calls`, email summary | a test call shows up as an email | sonnet |
| 2 | Connector "none" + tool `book` (request) + WhatsApp notifier (first route from B5) | the clinic gets a WhatsApp summary | sonnet |
| 3 | Usage meter, 80 % alert, monthly report email | report for a test month | sonnet |
| 4 | Provisioning script: create agent from template via ElevenLabs API, attach Zadarma number, set tools and webhook | new clinic in < 1 h | sonnet |
| 5 | Vet prompt template + sheet → knowledge base + 30-call eval set (`llm-eval`) | eval passes | opus (Spanish) |
| 6 | Google Calendar connector | live booking in a test calendar | sonnet |
| 7 | MiCita booking API (in MiCita) + MiCita connector | booking appears in MiCita | sonnet |
| 8 | Generic REST connector + public API + outbound webhooks + OpenAPI | a dummy app books through it | sonnet |
| 9 | Security audit + deploy + monitoring + backups | go/no-go | opus auditor, app-devops |
Pilot (2 vets, free month) can start after slice 5 with connector "none" or Google Calendar.

### B8. Cost per clinic (S/ 3.75 per $)
| Item | Monthly |
|---|---|
| Zadarma Lima number | $5 ≈ S/ 19 |
| AI minutes (ElevenLabs + LLM) | ≈ S/ 0.34/min → 250 min = S/ 85; 600 min = S/ 204 |
| WhatsApp summaries | ~S/ 0.11 each |
| VPS share | ~S/ 5 |
Prices stay as proposed (Esencial S/ 179, Clínica S/ 349, setup from S/ 299) until the pilot shows real minutes.

---

## Part C. Installing one clinic (runbook)
1. **Demo (15 min):** call the demo agent with the clinic's name in it (make it with the provisioning script from their Google Maps info). Ask: how many calls a day, who answers, after-hours calls, agenda used, phone type (mobile, Movistar landline, PBX).
2. **Sign-up:** contract + data-processing agreement + installation payment (Yape/transfer, boleta/factura).
3. **Info sheet:** send the form; the client returns it within 2 days (checklist in the client guide).
4. **Number:** order one Zadarma Lima number per clinic under SEMANTIKA's account. First confirm with Zadarma support that one business account may hold many numbers with the same documents. One number per clinic is needed because a forwarded call doesn't reliably tell us which clinic it came from.
5. **Provision:** run the script (agent from the vet template + sheet, number, tools, webhook, notify targets). Connect the agenda (MiCita key, Google OAuth by the client, or "none").
6. **Internal test:** 10 calls with the A10-style list adapted to vets (prices, vaccine, baño, emergency transfer, ask for a person, after hours).
7. **Forwarding at the clinic (on a video call):** for mobiles the standard GSM codes are `**61*<number>**20#` (no answer after 20 s), `**67*<number>#` (busy), `**62*<number>#` (unreachable); cancel all with `##002#`. **Not yet verified on Peruvian operators.** Test them on Movistar, Claro, Entel and Bitel lines before the first clinic and write the verified codes into the client guide. Landlines and PBXs: check with the operator. Ask whether forwarded calls use plan minutes.
8. **Test week:** only staff call. Fix the sheet and prompt (Spanish edits → opus, you approve).
9. **Go live** with the clinic's written OK. Week 1: read every transcript. After that: daily check of failed calls and calls with "urgency".
10. **Monthly:** usage report, invoice, sheet updates (prices, holidays).

## Open items
- Zadarma: documents accepted for the San Isidro address? Many numbers on one account? Caller ID passed through on forwarding?
- Forwarding codes verified on Peruvian operators.
- WhatsApp sender route (B5) chosen.
- `/lawyer`: disclosure, transcripts, cross-border transfer, clinic data-processing agreement.
- Prices confirmed after the pilot.
