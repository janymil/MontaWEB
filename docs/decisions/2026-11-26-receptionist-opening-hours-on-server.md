# Our server, not the AI model, decides whether the receptionist may transfer a call
Date: 2026-11-26 · Status: decided

## Context
In a typed Preview test, published prompt v5 (Claude Haiku 4.5) tried to transfer a call at 01:28 on a
Thursday, 2 of 2 times, although it knew the time and the transfer rule included it.

## Decision
- At the start of each call ElevenLabs asks `api/receptionist-init.php`, which returns `advisors_open`
  (`si`/`no`) and `transfer_number` (the word `closed` when closed: ElevenLabs rejects an empty one).
- Open means Monday to Saturday, 09:00 up to 20:00, America/Lima.
- The transfer tool takes `{{transfer_number}}`; the prompt reads `{{advisors_open}}`.

## Why
A wrong model decision at night then has no number to ring. A prompt-only fix would still depend on
the model's judgement.

## Consequences / next steps
- A failing webhook may stop calls from starting: add an uptime check; if calls fail, turn it off in ElevenLabs.
- Holidays are not handled.
- Deployed and set up 2026-11-26 (server keys, ElevenLabs webhook). Not yet live:
  publishing the tested draft (prompt v6, transfer rule) with Jan's yes, then live calls.
- Setup steps: `docs/plans/ai-receptionist/webhook-setup.md`.
