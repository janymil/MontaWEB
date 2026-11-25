# Phase 2 plan: AI receptionist as a paid add-on for clients, starting with veterinary clinics
Date: 2026-11-25 · Status: proposed (Jan decides pricing and where the backend lives)
Facts and sources: `docs/research/2026-11-25-ai-receptionist-numbers-and-market.md` · Targeting: `docs/research/2026-11-24-targeting-strategy.md`
Customer copy (es-PE, opus): `docs/plans/ai-receptionist/servicio-veterinarias-es-PE.md`

## 1. Which vertical first: veterinarias
| | Veterinaria | Dentista | Spa | Hotel |
|---|---|---|---|---|
| Hot leads (census) | **99** | 66 | 41 | 39 |
| Phone matters | very: owners call before coming, urgencies | high | medium (WhatsApp heavy) | medium (OTAs) |
| After-hours calls | **yes, urgencies at night/Sunday** | few | few | yes |
| Repeat bookings | vaccines, baño y corte, controls | cleanings | yes | no |
| Demo page exists | `veterinaria.html` | no | no | no |
| Fits MiCita agenda | yes (business type exists) | yes | yes | no |

Vets win: most leads, a demo already built, a clear money story (one consulta or baño is S/ 40–80, so 3–4 extra bookings a month pay for the plan), and a need a web site alone doesn't solve: calls during surgery and after hours. **Dentists are vertical #2** on the same engine (only the template changes).

## 2. What the vet receptionist does
1. Answers when the clinic can't: busy, no answer after ~4 rings, or after hours. The clinic **keeps its number** (conditional forwarding).
2. Says it is the clinic's virtual assistant; answers from the clinic's own sheet: hours, address, services, prices, vaccine schedule, what to bring, parking.
3. Books / moves / cancels: consulta, vacuna, baño y corte, control. It collects owner name, pet name, species, breed and age, and the reason.
4. **Urgencies:** a fixed list of red flags (not breathing well, seizures, poisoning, hit by a car, heavy bleeding, can't urinate, birth problems). The receptionist gives **no medical advice** and transfers to the on-duty vet's mobile. If nobody answers, it reads the clinic's own emergency instruction (address of the 24 h clinic they refer to).
5. After every call: WhatsApp summary to the clinic (who, pet, reason, what was booked, "call back" flag).
6. Monthly report: calls answered, bookings made, after-hours calls, urgencies transferred.
7. Never: diagnoses, medicines or doses, prices not on the sheet, promises about cure.

## 3. Architecture
```
Caller → clinic's number ──(forward: no answer/busy/after hours)──► per-clinic Lima DID (Zadarma/Telnyx)
                                                                    │ SIP
WhatsApp call (optional, clinics on Cloud API) ─────────────────────► ElevenLabs agent (1 per clinic, from template)
                                                                    │ server tools (HTTPS, per-clinic key)
                                                                    ▼
                                              Receptionist module (in MiCita backend)
                                              ├─ get_slots / book / move / cancel → MiCita agenda
                                              ├─ clinic_info → clinic sheet (hours, services, prices, emergency rules)
                                              ├─ post-call webhook → call log, WhatsApp summary, usage meter
                                              └─ monthly report + minutes billing
```
**Decided (Jan): a separate service** with its own API and agenda connectors (MiCita, Google Calendar, generic REST/webhook, "none"). The full build is in `ai-receptionist/implementation-guide.md`. The diagram above still holds, with "Receptionist module (in MiCita backend)" replaced by "Recepcionista service", which calls MiCita through MiCita's booking API.

### Per-clinic provisioning (target: < 1 hour of Jan's time)
1. Onboarding form: clinic sheet (services, prices, hours, vets, emergency number, 24 h referral clinic, tone tú/usted).
2. Script creates the agent from the template via the ElevenLabs API (prompt template + clinic sheet as knowledge base, voice, LLM Haiku 4.5, America/Lima, audio off, 90-day transcripts, data-collection fields, webhook, tools with the clinic's key).
3. Order the DID (in **MontaWeb's** company name; the clinic is our customer) and attach it to the agent via SIP.
4. Clinic sets forwarding: `**61*<DID>**20#` (no answer, 20 s), `**67*<DID>#` (busy), `**62*<DID>#` (unreachable). After-hours: the clinic forwards all calls (`**21*`) at closing, or we route by time inside the agent. Operators and phone systems differ: test per clinic.
5. A week of test calls (Jan + clinic staff), then live.

### Main risks
- **Latency / dead air** when a tool is slow → tools answer in < 1.5 s, agent says a filler line, fallback "le confirmamos por WhatsApp".
- **Wrong medical-sounding answers** → hard rules + red-flag transfer + an eval set of 30 vet calls (use `llm-eval` skill) run before each prompt change.
- **Forwarding cost/behaviour on the clinic's line** → check it at the demo.
- **Data**: pet owners' names and phones; health of animals is not "dato sensible" under Ley 29733, but the owner's data is personal data. Contract: clinic = responsable, MiCita/SEMANTIKA = encargado; DPA clause; ElevenLabs = sub-processor (US, cross-border transfer). `/lawyer` check before the first client.
- **ElevenLabs terms for agencies** (sub-accounts, reselling) unconfirmed → ask their sales before client #3.

## 4. Cost and pricing (assumed S/ 3.75 per $)
All-in cost per AI minute ≈ $0.09 (ElevenLabs $0.08 + LLM ~$0.01) ≈ **S/ 0.34/min**, plus DID ~S/ 19/mo per clinic and ~S/ 0.11 per WhatsApp summary.

| Plan (proposed) | Price | Minutes | Includes | Our cost at full use | Margin |
|---|---|---|---|---|---|
| Esencial | S/ 179/mes | 250 | answers, takes requests, WhatsApp summary | ~S/ 120 | ~S/ 59 |
| Clínica | S/ 349/mes | 600 | + MiCita booking, urgency transfer, monthly report | ~S/ 245 | ~S/ 104 |
| Extra minute | S/ 0.80 | | | S/ 0.34 | |
| Setup | desde S/ 299 once | | sheet, voice, tests | Jan ~2 h | |

Market check: Dialzara $29–349 ($0.35–0.48/min overage), Rosie €49–299, ElevenLabs' own Reception.ai $29/75 min. Our per-minute price is in line, and we add Spanish, setup, WhatsApp summary and booking. Most clinics will use well under the cap (only overflow + after-hours calls reach the AI), so real margins are higher. **Margins improve later** by moving to self-hosted Pipecat (~$0.03/min) once there are ~15 clinics. Bundle: web + receptionist at a discount ("Pack Clínica Digital").

## 5. Rollout
| Step | What | Who / model |
|---|---|---|
| 0 | Phase 1 live and stable for 2 weeks (same stack) | — |
| 1 | Decision in MiCita repo: receptionist module + API contract (tools, webhook, usage) | opus (app-architect) |
| 2 | Vet prompt template + clinic-sheet schema + 30-call eval set | opus (Spanish), Jan reads |
| 3 | Module slices: clinic-info tool → booking tools → post-call webhook + WhatsApp summary → usage meter → monthly report | sonnet app-implementer, TDD, app-security-auditor on tools/webhook |
| 4 | Provisioning script (ElevenLabs API + DID) | sonnet |
| 5 | Pilot: 2 vets from the hot-lead list, free for one month, in exchange for feedback and a testimonial | Jan |
| 6 | Landing section on `veterinaria.html` + a `/recepcionista-virtual` page (SEO-first: keywords "recepcionista virtual veterinaria", "contestador automático clínica") | opus copy, sonnet build |
| 7 | Price confirmed after the pilot; then dentists template | Jan |

## Tools we need
ElevenLabs Agents (API, SIP, webhooks, transfer tool; Creator → Pro plan as clinics grow) · Claude Haiku 4.5 · Zadarma/Telnyx DIDs (one per clinic) · MiCita backend (Express/TS/Postgres) + its WhatsApp Cloud API · Meta utility templates for summaries · `llm-eval` for the vet eval set · Cal.com not needed for clients (MiCita is the agenda).

## Decisions Jan needs to make
1. Receptionist module in MiCita (recommended) or a separate small service?
2. Prices: Esencial S/ 179 / Clínica S/ 349 / setup S/ 299, or other?
3. Free one-month pilot for 2 vets: yes or no?
