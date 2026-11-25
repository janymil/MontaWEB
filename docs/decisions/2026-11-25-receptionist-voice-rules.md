# The AI receptionist never names Jan, says "asesores", and discloses AI only briefly
Date: 2026-11-25 · Status: decided

## Context
Testing the ElevenLabs agent "MontaWeb Recepcionista" (see `2026-11-25-ai-voice-outreach.md`). The first prompt named Jan 27 times and stressed the AI nature of the call.

## Decision
- The agent never names the owner. Hand-offs, callbacks, discounts, IGV/factura, payment and scheduling are "uno de nuestros asesores" (v2 prompt: `docs/plans/ai-receptionist/prompt-es-PE.v2-draft.md`).
- AI disclosure stays short: "Soy el asistente virtual" in the first message and "Soy un asistente virtual. Si prefiere, uno de nuestros asesores le devuelve la llamada." when asked. No "inteligencia artificial", no "no soy una persona".
- "Desde" is never dropped from prices; the final price is confirmed in writing.
- Settings: turn timeout 7 s, end after 30 s silence, max call 600 s with an es-PE closing line, call audio not stored, transcripts kept 90 days (`settings-2026-11-25.md`).

## Why
Jan wants the brand to speak, not the founder, and finds heavy AI emphasis unnecessary: "asistente virtual" is already clear. Minimal data storage fits Ley 29733.

## Consequences / next steps
- Jan introduces himself as an advisor on callbacks.
- Not published yet; publishing needs Jan's yes. Legal check of the "no la grabamos" wording and recording consent before go-live.
- Copy leads out of transcripts within 90 days until a booking tool exists.
