# Handoff: connect a MontaWeb WhatsApp number to the ElevenLabs receptionist (in Claude in Chrome)
2026-11-25 · MontaWeb main checkout, branch main · Uncommitted changes: yes (docs + Jan's unrelated WIP; commit nothing without asking)

## Goal
A new MontaWeb WhatsApp Business number lives in ElevenLabs Agents, is assigned to the agent "MontaWeb Recepcionista", and Jan can call it from his own WhatsApp and talk to the agent. Publish the agent only with Jan's yes.

## Done so far
- Decisions: `docs/decisions/2026-11-25-ai-voice-outreach.md`, `docs/decisions/2026-11-25-receptionist-voice-rules.md` (no "Jan" in the prompt, "asesores", short AI disclosure, call settings).
- Agent draft in ElevenLabs: https://elevenlabs.io/app/agents/agents/agent_9801m89s382pf83adk7an3mff8c7/agent (Spanish, voice Jair Solano, Claude Haiku 4.5).
- Prompts: `docs/plans/ai-receptionist/prompt-es-PE.v2-draft.md` (current), `max-duration-message-draft.md` (closing line options).
- Earlier notes: `docs/plans/handoff-2026-11-25-ai-receptionist.md`, `docs/plans/2026-11-25-ai-receptionist-setup.md`.

## Next steps
0. Use **Claude in Chrome** (Jan asked): load the `anthropic-skills:chrome-browser` skill first, work in a new tab. Check that Jan is signed in to ElevenLabs and Meta Business in his Chrome.
1. Confirm with Jan: is the v2 prompt and the max-duration closing line in the agent? If not, paste the approved versions (Spanish edits → opus subagent, Jan approves).
2. Number: Jan needs a new prepaid Peruvian SIM (any operator) that is **not** registered in the WhatsApp/WhatsApp Business app (or he deletes that account first). It must be able to receive an SMS or a voice call for the code.
3. ElevenLabs → Agents → WhatsApp (Channels / integrations) → "Import account". Meta's embedded signup opens. Jan chooses or creates the Business portfolio (MiCita's portfolio may be reused), creates a **new** WhatsApp Business Account "MontaWeb", sets the display name "MontaWeb" + category, adds the number, and **types the verification code himself**. Accepting Meta terms and granting permissions = Jan clicks.
4. In ElevenLabs: assign the number to "MontaWeb Recepcionista"; turn on calls for the number (and the WhatsApp call button if offered); decide whether ElevenLabs also answers text messages (default: calls only until a text prompt exists).
5. Meta payment method: needed only for outbound calls/templates. Incoming calls are free. Skip unless Jan wants it.
6. Test: Jan calls the number from his own WhatsApp. Check the transcript in Conversations. Then ask Jan about publishing.
7. Record the result in `docs/plans/2026-11-25-ai-receptionist-setup.md` (number, WABA, status). Display-name review by Meta can take days (MiCita's was PENDING_REVIEW).

## Gotchas
- Do NOT touch Kapso or the MiCita number (+51 986 751 013). Its WABA belongs to Kapso's Meta app; MontaWeb gets its own WABA.
- Never type passwords, SMS/2FA codes or card numbers. Jan does those. Ask before every account creation, terms acceptance or permission grant.
- A number that's imported into ElevenLabs can't be used in the normal WhatsApp app at the same time.
- In the built-in browser, ElevenLabs coordinate clicks missed. Use find/ref clicks (Chrome may behave the same).
- Costs: ElevenAgents $0.08/min + LLM ~$0.008/min; incoming WhatsApp calls free from Meta.

## Open questions for Jan
Which SIM/number · reuse the MiCita Business portfolio or create a new one · ElevenLabs answers texts too, or calls only · publish after the first test call?
