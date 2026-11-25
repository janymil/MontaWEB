# Virtual Peruvian number + ElevenLabs Agents: setup steps and facts
Date: 2026-11-25 · Follow-up to `2026-11-25-ai-receptionist-numbers-and-market.md`. UNCONFIRMED = not on an official page.

## 1. ElevenLabs SIP trunk number (source: https://elevenlabs.io/docs/eleven-agents/phone-numbers/sip-trunking)
1. ElevenLabs Agents dashboard > **Phone Numbers** > **Import number** > **From SIP Trunk**.
2. Label (free text), Phone Number in E.164 (+51...).
3. Inbound: Media Encryption (Disabled/Allowed/Required), Allowed Numbers (optional), Allowed Source IPs (optional, default 0.0.0.0/0, TCP/TLS only), Remote Domains (TLS only), digest username/password (optional).
4. Outbound: Address (host only, no `sip:`), Transport TCP/TLS (UDP experimental), Media Encryption, Codecs G.722/PCMU/PCMA, optional headers, optional digest auth (empty = IP ACL).
5. **Import**, open the number > **Assign Agent** > pick agent.
- Inbound address: send calls to `sip:<number>@sip.rtc.elevenlabs.io`, port 5060 TCP/UDP or 5061 TLS; To user part must equal the imported number incl. "+" (https://elevenlabs.io/docs/eleven-agents/phone-numbers/sip-reference).
- Caller ID: reserved header `X-Caller-ID` maps to `system__caller_id`; it overrides the From user part (sip-reference). Fallback to plain From: implied, not stated.
- Transfer to number: works as **blind SIP REFER** only (no warm transfer). Your provider must answer REFER with 202/200, and should send NOTIFY sipfrag (sip-reference). In agent: enable **Transfer to number** > Human Transfer Rules > type SIP REFER > phone in +E.164 (per Zadarma guide below).

## 2. Zadarma Lima number
Source: https://zadarma.com/en/tariffs/numbers/peru/ , https://zadarma.com/en/support/instructions/elevenlabs/
| Item | Fact |
|---|---|
| Price | Lima (01): $5/mo with yearly billing, $7.5/mo monthly billing; $0 setup. (The earlier note's "$5" is the yearly price.) |
| Incoming calls | Free (not for 0800). 2 concurrent channels included. |
| Documents | Company registration certificate; passport/ID both sides; proof of address <6 months in the same city (Lima). |
| Who | "Business clients in Peru" only; number assigned randomly. |
| Approval time | Not stated ("automatic once verified"). UNCONFIRMED duration. |
| Mobile number | Not offered for Peru on the page (only Lima, Arequipa, Chiclayo, Chimbote, Cusco, Piura, Trujillo, 0800, 0801). |

**Zadarma > ElevenLabs works and has an official guide** (https://zadarma.com/en/support/instructions/elevenlabs/):
1. Zadarma: create a PBX extension, set its password (My PBX).
2. ElevenLabs: Phone Numbers > Import number > From SIP Trunk; Phone number = Zadarma number; inbound encryption Disabled, no auth; outbound Address `pbx.zadarma.com`, TCP, Disabled, username = PBX extension, password = extension password.
3. Zadarma: My PBX > Extensions > extension > Call forwarding and voicemail > Enable > "Always active" > "External server (SIP URI)" > `+51XXXXXXXXX@sip.rtc.elevenlabs.io:5060;transport=tcp` > Save. (Retell guide uses the same method: https://zadarma.com/en/support/instructions/retellai/ ; Vapi: https://zadarma.com/en/support/instructions/vapiai/). A search summary also mentions a per-number "External server" tab (Settings > Virtual phone numbers), UNCONFIRMED.
4. Transfer: agent > Transfer to number, type SIP REFER, destination +E.164.
- Caller ID passthrough on forwarding: UNCONFIRMED (a Retell forum note says Zadarma may overwrite CallerID on forwards to external numbers).

## 3. Alternatives
| | Telnyx | DIDWW |
|---|---|---|
| Peru numbers | Local only on page (from $13.50/mo; mobile not covered) https://telnyx.com/phone-numbers/peru | Lima local, mobile (+51 9), toll-free |
| Price | Per-min Peru rates UNCONFIRMED (not on public pages; contact sales) | Only in downloadable price list; UNCONFIRMED |
| Documents | Business only: rep name, company name, phone, rep ID, Peruvian company certificate, address matching area code, proof <3 months (https://support.telnyx.com/en/articles/3739545-peru-did-requirements). Approval time for local not stated | Mobile: "registration not required" (https://didww.com/coverage-and-prices/regulatory-requirements/registration-required/Peru); local: documents required, list/time UNCONFIRMED |
| ElevenLabs | **Official guide** https://elevenlabs.io/docs/eleven-agents/phone-numbers/telephony/telnyx : Telnyx portal > SIP connection, auth Credentials, FQDN `sip.rtc.elevenlabs.io`, TCP, inbound Destination Number Format +E.164, assign number to the connection, then import in ElevenLabs | No ElevenLabs guide found; generic SIP trunk applies |

Most reliable for a documented path: Zadarma (cheap, Peru-specific guide) or Telnyx (official ElevenLabs guide, but pricing unclear). Both need company docs. DIDWW mobile avoids KYC but price and ElevenLabs steps UNCONFIRMED.

## 4. Outgoing minutes (human callbacks)
- Zadarma (https://zadarma.com/en/tariffs/calls/): Peru Lima landline $0.008 (Economy) / $0.01 (Standard); Peru mobile $0.016 / $0.02; rural $0.08 / $0.10. SIP/PBX same rate UNCONFIRMED.
- Telnyx Peru rates: UNCONFIRMED. Peruvian postpaid plan prices: not found (UNCONFIRMED); Zadarma is about $0.02 per mobile minute, so compare against the plan's included minutes.

## 5. WhatsApp without personal Facebook
- Managed Meta accounts let people use Business Suite with work credentials, no personal Facebook (https://developers.facebook.com/documentation/facebook-login/managed-accounts), but 360dialog says creating a portfolio this way needs organisation-management permissions in Organisation Manager (https://docs.360dialog.com/docs/resources/meta-business-manager). Not realistic for an E.I.R.L.
- **360dialog "WhatsApp Login"** (open beta, Oct 2026): onboard without Facebook by scanning a QR from the WhatsApp Business App; Meta creates portfolio and WABA; non-EU; business verification still applies; number must not already be on Cloud API (https://docs.360dialog.com/partner/get-started/alphas-and-betas/whatsapp-login). It needs a number already running in the WhatsApp Business App, so a landline is not covered (UNCONFIRMED).
- Another trusted person as admin: Business settings > People > Invite people; invitee accepts; needs full control to invite; neither account may be restricted (third-party summary, UNCONFIRMED on Meta's help page). Whether a non-Facebook email invite works: UNCONFIRMED. Kapso/Twilio no-Facebook path: UNCONFIRMED (Kapso docs not checked).
- Landline on WhatsApp Business Platform: Meta lists fixed lines with voice OTP "Standard", SMS "Not Recommended"; requires accepting international calls, no IVR/forwarding on at that moment (https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/phone-numbers.md). A virtual DID forwarding to SIP/ElevenLabs would have to take the code call (disable forwarding or capture it) - UNCONFIRMED in practice.

## 6. Peru rules (short)
Numbering is governed by the MTC numbering plan (RS 022-2002-MTC) and Reglamento de Numeración (DS 021-2004-MTC). No page found on authorisation or documents for a business using a foreign virtual DID; DS 018-2026-MTC page returned 410, content UNCONFIRMED. Ask Zadarma/Telnyx whether their Lima numbers are sold to Peruvian companies only (Zadarma states yes).

## Recommendation
(a) MontaWeb's own line (E.I.R.L. has the company certificate): **Zadarma Lima +51 1, yearly billing ($5/mo)**. Steps: order and upload the 3 documents; create PBX extension; import SIP trunk in ElevenLabs per section 2; forward number to the ElevenLabs SIP URI; test caller ID and a REFER transfer. Fallback: Telnyx local (official ElevenLabs guide) if Zadarma rejects documents.
(b) Each clinic: keep the clinic's own number; set GSM no-answer/busy forwarding (**61*, **67*, Peru codes UNCONFIRMED) to one DID. Cheapest: one MontaWeb Zadarma number per clinic only if the clinic supplies its own company papers; otherwise use the MontaWeb DID with a per-clinic extension and per-clinic ElevenLabs agent (route via Zadarma extensions). WhatsApp is optional: 360dialog WhatsApp Login only if the clinic's number is already in the WhatsApp Business App; Jan's Facebook is not needed.
