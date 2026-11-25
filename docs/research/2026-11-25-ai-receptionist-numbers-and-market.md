# AI receptionist: Peruvian numbers, ElevenLabs Agents, rules and market prices
Date: 2026-11-25 · Fact-gathering only (web search + official pages). UNCONFIRMED = not verified on an official page.

## 1. Ways to get a +51 number an ElevenLabs agent can answer

| Option | Availability / cost | KYC and setup | Source |
|---|---|---|---|
| Twilio | Pricing page lists only Peru toll-free: $135/mo + $0.3986/min inbound. Lima/mobile: not listed, Lima local stock UNCONFIRMED (check Console search). Twilio/ElevenLabs native import works for purchased numbers. | Peru-specific bundle docs UNCONFIRMED. Generic bundle review up to 2 business days. | https://www.twilio.com/voice/pricing/pe , https://www.twilio.com/en-us/sip-trunking/pricing/pe , https://support.twilio.com/hc/en-us/articles/8338625205147 |
| Telnyx | Local, toll-free, shared-cost. Monthly price conflicting: "from $13.50" on the .md page, "$1" on the HTML page. Inbound per-minute UNCONFIRMED. | Local and toll-free are business only: company registration certificate, representative ID, Peruvian proof of address <3 months matching the area code. Persona natural not allowed. Shared-cost ~72 h; local time not stated. | https://telnyx.com/phone-numbers/peru.md , https://support.telnyx.com/en/articles/3739545-peru-did-requirements |
| Zadarma | Lima +51 1: $5/mo, $0 setup, incoming calls advertised free (rate not stated). Business clients in Peru only. | Company registration certificate + ID + utility bill <6 months in Lima. Activation after verification, time not stated. SIP-capable (UNCONFIRMED vs ElevenLabs). | https://zadarma.com/en/tariffs/numbers/peru/lima/ |
| DIDWW | Local (Lima, Cusco...), mobile, toll-free. Mobile and shared-cost: no registration. Local/toll-free: end-user documents needed. Prices only in a downloadable list; third-party quotes ~$3.50/mo + $0.025/min inbound are UNCONFIRMED. | Local: company certificate + address proof (DIDWW page lists no detail). | https://www.didww.com/virtual_numbers/Peru/Local/Lima/51-1 , https://didww.com/coverage-and-prices/regulatory-requirements/registration-required/Peru |
| Vonage, Plivo, Bandwidth, Voxbone | ElevenLabs lists them as compatible SIP providers. Peru stock and prices UNCONFIRMED. | - | https://elevenlabs.io/docs/eleven-agents/phone-numbers/sip-trunking |
| Peruvian carriers (Movistar/Claro/Entel/Bitel Empresas) and local ITSPs | No published soles prices found for a SIP trunk or DID. One local ITSP (Comunicate Facil SAC) lists "Central Telefónica Virtual" and SIP trunk, quote needed. | Quote only. | https://connectamericas.com/company/comunicate-facil-sac |
| Call forwarding from a SIM | Peruvian codes and fees UNCONFIRMED. GSM standard codes (Movistar Spain doc): **21* unconditional, **61* no answer, **67* busy, ##21# cancel. Costs vary; prepaid needs balance. | Check each operator's Peru help page. | https://www.movistar.es/blog/mi-movistar/desviar-llamadas-movistar/ (Spain, not Peru) |
| WhatsApp Business Calling | Meta: "All user-initiated calls are free" (so inbound free). Peru has its own calling rate card in PEN (for business-initiated calls). Peru-specific restrictions not found. | WhatsApp Business account, payment method in WhatsApp Manager. | https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/pricing/ |
| ElevenLabs WhatsApp (native) | Exists. Import WhatsApp Business account, assign agent; inbound calls are rejected until an agent is assigned. Meta bills separately. | | https://elevenlabs.io/docs/eleven-agents/whatsapp |

Notes: Twilio's regulatory page has no Peru row (https://www.twilio.com/en-us/guidelines/regulatory). Twilio status page reported voice incidents to Peru subscribers in Aug 2026 (https://status.twilio.com/incidents/c43qy8xqstjz). Telnyx and DIDWW both say local numbers are business use only; DIDWW and Zadarma need a company certificate, so a persona natural with RUC 10 probably does not qualify (UNCONFIRMED).

## 2. ElevenLabs Agents (official pricing page, 2026-11-25)
Source: https://elevenlabs.io/pricing/agents (Black Friday discounts shown until Dec 1).

| Plan | $/mo | Included min | Concurrent | Seats |
|---|---|---|---|---|
| Free | 0 | 15 | 4 | - |
| Starter | 6 | 75 | 6 | - |
| Creator | 22 | 275 | 10 | - |
| Pro | 99 | 1,238 | 20 | - |
| Scale | 299 | 3,738 | 30 | 3 |
| Business | 990 | 12,375 | 40 | 10 |

- Overage $0.08/min on every plan; burst (up to 3x concurrency) $0.16/min. LLM billed separately. No telephony fee from ElevenLabs; your provider bills you.
- SIP inbound: supported, trunk sends to sip.rtc.elevenlabs.io (TCP 5060 / TLS 5061); needs G.722/PCMU/PCMA. Twilio native import of purchased numbers is also supported: https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration
- Agency features: API to create agents (POST /v1/convai/agents/create; CLI `elevenlabs agents push`). Sub-accounts, per-agent usage reporting, white-label: UNCONFIRMED (not found; Enterprise only mentioned for SSO/seats).
- Post-call webhook: fires after analysis, signed with a secret. Server (webhook) tools: agent calls your HTTP endpoint mid-call (booking, lookups).
- Separate product: ElevenLabs Reception.ai, $29/75 min, $79/275 min (3 numbers), $199/1,000 min; numbers included; no white-label: https://elevenlabs.io/docs/es/reception-ai/billing/plans-and-pricing

## 3. Peru rules (short, not legal advice)
- MTC/OSIPTEL rules for a business using a VoIP/virtual number: nothing found. DS 018-2026-MTC (numbering, 15 Sep 2026) exists, scope for VoIP UNCONFIRMED: https://cms.law/es/per/publication/atribuyen-el-prefijo-500-como-rango-exclusivo-para-originar-llamadas-y-mensajes-de-texto-con-fines-comerciales-o-publicitarios
- DS 016-2024-JUS (reglamento Ley 29733) in force 31 Mar 2025. Holders have a right not to be subject to solely automated decisions with significant effects, and must be informed of them; consent for commercial calls tightened. Specific rule on call recording consent or AI-voice disclosure: UNCONFIRMED, read the text: https://www.congreso.gob.pe/Docs/DGP/DIDP/files/ds_016-2024-jus.pdf , https://elperuano.pe/noticia/267273-llamadas-comerciales-sin-tu-permiso-conozca-el-nuevo-reglamento-que-protege-tus-datos

## 4. Market prices
| Service | Price | Minutes / overage | Source |
|---|---|---|---|
| Dialzara (US) | $29-$349/mo | 60 min to 1,000 min; overage $0.48 down to $0.35 | https://www.cloudtalk.io/dialzara-pricing/ |
| Rosie (EU/US) | EUR 49 / 149 / 299 | 250 / 1,000 / 2,000 min | https://www.cloudtalk.io/es/blog/rosie-ai-precios-de-servicio-de-atencion-telefonica/ |
| Goodcall | ~$59/mo ($41 annual); sources conflict | per-call, overage UNCONFIRMED | https://vida.io/blog/goodcall-pricing |
| Smith.ai (human+AI) | ~$290-300/mo | 30 calls; ~$10/call after | https://murf.ai/blog/answering-service-pricing |
| Reception.ai (ElevenLabs) | $29 / 79 / 199 | 75 / 275 / 1,000; $0.40-0.22 | link above |
| Peru agency (kom.pe) | ~S/ 6,000 setup + S/ 300/mo narrow case; S/ 15-20k + S/ 1,000-1,500/mo larger | custom | https://kom.pe/cuanto-cuesta-implementar-ia-en-una-pyme-peruana/ (via search summary) |

LatAm-specific (Mexico, Colombia, Chile) published AI-receptionist prices: not found (only 1-2 data points, Peru agency above). Vetstoria, PetDesk voice, Arini, Viva: prices not found. Typical US small-business spend $50-150/mo (https://www.myaifrontdesk.com/blogs/how-much-does-an-ai-receptionist-cost-a-straight-answer-for-2026, vendor source).

## 5. Missed calls
- Ohio State secret-shopper study, 5,000+ US vet practices: appointment obtained 67% of calls (<62% rural); failures mostly no staff reached or hold >5 min. https://news.osu.edu/checkup-time-for-fido-wait-might-be-longer-in-the-country/
- Vendor claims (weak): 24-30% of vet calls unanswered, 85% of those callers do not call back; >$100k/yr lost: https://www.puppilot.co/blog/are-you-missing-calls-what-is-it-costing-your-veterinary-clinic/ , https://todaysveterinarybusiness.com/the-six-figure-problem-with-your-phone-system/
- Dental: UK trade test 44% of calls not reaching a person (original unconfirmed); $400-900 per missed routine visit is an uncited estimate. No solid LatAm source found.

## Recommendation
1. MontaWeb itself: cheapest test without KYC friction is WhatsApp calling via ElevenLabs native WhatsApp (inbound free from Meta, no DID). For a phone line, forward the existing mobile/landline via GSM forwarding to a Zadarma Lima DID ($5/mo) or Telnyx/DIDWW number once the SIP trunk is confirmed; needs RUC 20 company docs (UNCONFIRMED for RUC 10). Avoid Twilio (only $135/mo toll-free confirmed).
2. Each client: keep their existing number and use call forwarding (no-answer **61*, busy **67*) to one shared DID per client, or one DID with per-client routing; WhatsApp calling when the client already has a WhatsApp Business number. Per client cost ~ $5-13/mo DID + $0.08/min + LLM. Check ElevenLabs Enterprise/partner terms for agency multi-workspace before scaling (UNCONFIRMED).
