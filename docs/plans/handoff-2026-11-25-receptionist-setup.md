# Handoff: hands-on setup of the MontaWeb AI receptionist (ElevenLabs + Zadarma SIP)
2026-11-25 · MontaWeb main checkout, branch main · Uncommitted changes: yes (docs from this session + Jan's unrelated site WIP; commit nothing without asking)

## Goal
A call to a Zadarma Lima number (SEMANTIKA TECH E.I.R.L.) is answered by the ElevenLabs agent "MontaWeb Recepcionista"; "hablar con una persona" transfers to Jan; each call emails a lead to hola@montaweb.pe. Done = the 10 test calls in the guide's A10 pass, then publish only with Jan's yes.

## Done so far
- Guide (the source of truth, step by step): `docs/plans/ai-receptionist/implementation-guide.md` (Part 0 answers, Part A MontaWeb line, Part B client service, Part C clinic runbook).
- Decision: `docs/decisions/2026-11-25-receptionist-number-and-vet-addon.md` (virtual Zadarma number, no SIM; vets first; separate service = decided by Jan).
- Research: `docs/research/2026-11-25-virtual-number-setup-steps.md`, `docs/research/2026-11-25-ai-receptionist-numbers-and-market.md`.
- Client docs (es-PE, opus, Humanizer 100/100, Jan not yet read): `docs/plans/ai-receptionist/guia-cliente-veterinarias-es-PE.md`, `servicio-veterinarias-es-PE.md`.
- Phase plans: `docs/plans/2026-11-25-receptionist-phase2-client-addon.md`; phase 1 file is superseded by the guide.
- Zadarma ↔ ElevenLabs confirmed in Zadarma's own guide (https://zadarma.com/en/support/instructions/elevenlabs/): forward to `+<num>@sip.rtc.elevenlabs.io:5060;transport=tcp`, outbound `pbx.zadarma.com` TCP, encryption off, SIP REFER transfers. Not yet tested by us.

## Next steps
1. Guide A3: finish the agent in ElevenLabs (built-in browser; Jan is signed in). Check language = Spanish, v2 prompt + closing line pasted, add the data-collection fields from A3.3. Agent: https://elevenlabs.io/app/agents/agents/agent_9801m89s382pf83adk7an3mff8c7/agent
2. A4.0 free test: Jan creates the Zadarma account (Standard $0, business, hola@montaweb.pe) himself; then A5–A7 with extension 100 and a call from the Zadarma app.
3. If the test works: Jan orders the Lima number (yearly $60) with the A2 documents; ask Zadarma support first whether the San Isidro address proof and many numbers per account are OK.
4. A6–A8 with the real number; A9 webhook = code change (sonnet implementer, TDD, `./verify.sh`); A10 tests; A11 `/lawyer` check.

## Gotchas
- Never type passwords, codes or card data; account creation, payments and Meta/terms clicks are Jan's. Ask before each.
- ElevenLabs in the browser pane: coordinate clicks miss; use find → ref clicks. Language once flipped to Azerbaijani.
- Don't touch Kapso / MiCita number (+51 986 751 013).
- Wabi and Numero eSIM can't do SIP (app-only). Fallbacks: Telnyx (ElevenLabs guide), FlyNumber.
- Caller ID passthrough on Zadarma is unconfirmed: check in test 9.
- `npm test` fails on `test/site-wide-design.test.mjs:18` (expects `site.css?v=20261124c`, pages have `?v=20261125`): from Jan's pre-existing WIP, not this work.
- Any Spanish text change → opus subagent + Humanizer, Jan approves.

## Open questions for Jan
Read the client guide aloud · prices (S/ 179 / 349 / setup 299, IGV) · WhatsApp route while Facebook is blocked (appeal / trusted admin / 360dialog QR / Kapso) · one number per app vs one SEMANTIKA number with a router.
