# A virtual Lima number for the receptionist; vets are the first add-on vertical
Date: 2026-11-25 · Status: proposed

## Context
Phase 1 (MontaWeb's own AI receptionist) needed a phone number route beyond WhatsApp calls. Phase 2 sells the receptionist to clients, and the census shows where demand is (`docs/research/2026-11-24-targeting-strategy.md`). Facts: `docs/research/2026-11-25-ai-receptionist-numbers-and-market.md`.

## Decision (proposed)
1. MontaWeb's receptionist line is a **virtual Lima number (+51 1) from Zadarma** ($60/yr) in the name of SEMANTIKA TECH E.I.R.L., routed by SIP straight to ElevenLabs (Zadarma has an official ElevenLabs guide). No SIM. Fallback: Telnyx. Twilio is skipped (Peru toll-free only, $135/mo). WhatsApp is optional and parked while Jan's Facebook account is blocked (options in the implementation guide, Part 0).
2. The first client add-on is the **veterinary receptionist**; dentists come second on the same template.
3. Clients keep their own number and forward unanswered, busy and after-hours calls to a per-clinic virtual number.
4. **Decided (Jan, 2026-11-25):** the multi-client backend is a **separate service** ("Recepcionista") with its own small API and connectors to any agenda: MiCita is connector #1, then Google Calendar, a generic REST/webhook connector and "no agenda" (request + summary). It is not built inside MiCita. MontaWeb sells and installs it.
5. Proposed prices: Esencial S/ 179/mo (250 min), Clínica S/ 349/mo (600 min), S/ 0.80 extra minute, setup from S/ 299.

## Why
A virtual number is cheaper than a SIM, has free incoming calls, connects directly and needs no Meta/Facebook. Forwarding keeps the client's number, so switching is low-risk. Vets have the most hot leads (99), an existing demo, after-hours urgencies and repeat bookings. A separate service can serve clinics on any agenda, not only MiCita.

## Consequences / next steps
- Plans: `docs/plans/2026-11-25-receptionist-phase1-montaweb-line.md`, `docs/plans/2026-11-25-receptionist-phase2-client-addon.md`.
- Spike Zadarma SIP to ElevenLabs before any public number.
- `/lawyer` check: AI disclosure, transcripts, cross-border transfer, clinic contracts (responsable/encargado).
- MiCita only exposes a booking API (slots, book, move, cancel) with a per-business key; that needs a small decision in the MiCita repo.
- Step-by-step guides: `docs/plans/ai-receptionist/implementation-guide.md` (internal), `docs/plans/ai-receptionist/guia-cliente-veterinarias-es-PE.md` (client).
