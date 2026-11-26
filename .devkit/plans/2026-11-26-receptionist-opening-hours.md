# 2026-11-26 — a caller who asks for a person at night is offered a callback, and no phone rings

Status: stage 2 code built (stage 1 skipped), not committed, deployed or set up in ElevenLabs.
Cause checked 2026-11-26 01:38: the agent knows the time and the transfer tool condition includes {{system__time}}; the model skips the check. Transfer hours stay Mon–Sat 09:00–20:00 Lima.

## Goal
The receptionist never transfers a call outside opening hours.

## Why
Preview, published v5, Claude Haiku 4.5: at 01:28 on a Thursday it tried to transfer, 2 of 2 times.
Per ElevenLabs docs `system__time` reads like `Friday, 12:33 12 December 2025` and is filled in every turn,
so the likely (not proven) cause is the model's own time reasoning.

## Two stages. Do stage 1; do stage 2 only if stage 1 fails, or Jan wants a hard guarantee

### Stage 1: prompt only (no code, no deploy)
Replace `{{system__time}}` with `{{system__time_date}}` (weekday + date) and `{{system__time_hour}}`
(integer 0–23), and word the rule as: open = not Sunday and hour from 9 to 19; check this before any transfer.
- Spanish wording by an opus subagent, Jan approves.
- Test as an unpublished draft in Preview (`include_draft=true`), outside hours: 5 tries, varied wording, 0 transfers.
  In hours: 2 tries, transfer attempted (Preview cannot complete it).
- Publish only with Jan's yes. Still the model's judgement, so not a guarantee.

### Stage 2: our server decides
ElevenLabs calls our server when an inbound SIP call starts; we answer with two variables:
- `advisors_open`: `si` / `no`
- `transfer_number`: the real number when open, empty when closed. The transfer tool takes `{{transfer_number}}`,
  so a wrong model decision at night cannot ring anyone.

Risks to accept before building:
- Docs: "A failed or timed-out webhook can prevent the conversation from starting." Our server down = no calls answered.
- Preview does not run the webhook (variables come from dashboard placeholders), so only real calls prove it.
  Blocked until Zadarma verification.
- Not documented: timeout length, behaviour with an empty transfer number, missing variables on a live call.

## Out of scope
Holidays; different hours per product; model change; deleting the old Spanish data fields; ElevenLabs workflows
(expression edges exist, but Sunday detection and syntax are undocumented); a Zadarma PBX time schedule (not checked).

## Files that will change
Stage 1:
- `docs/plans/ai-receptionist/prompt-es-PE.v6-draft.md` — new prompt version.

Stage 2:
- `api/receptionist-init.php` — new. POST only; checks a secret header (`hash_equals`), 503 if no secret set;
  computes open/closed with `America/Lima`; returns
  `{"type":"conversation_initiation_client_data","dynamic_variables":{...}}`. Stores and logs nothing from the request.
- `api/config.example.php` — `elevenlabs_init_secret`, `receptionist_transfer_number` (real values only on the server).
- `test/php/receptionist-init.test.php`, `test/receptionist-init.test.mjs`.
- `docs/plans/ai-receptionist/webhook-setup.md` — dashboard steps.
- prompt draft — rule reads `{{advisors_open}}`.

## The risk
Stage 1: still transfers at night → Jan's phone rings → noticed the same night.
Or refuses in hours → lead gets a callback instead of a live person → noticed in scenario 7.
Stage 2: endpoint fails → callers are not answered → noticed only if someone reports it, so add an uptime check.
Endpoint without the secret check would hand out the transfer number to anyone.

## How it is proven
- Test (`test/php/receptionist-init.test.php`, stage 2), with an injected clock: Mon 08:59 closed, 09:00 open,
  Sat 19:59 open, 20:00 closed, Sun 12:00 closed, Thu 01:28 closed; closed → empty number; wrong or no secret → 401;
  secret not configured → 503; GET → 405.
- Stage 1 has no automated test: the Preview runs above are the manual check.
- Gate: `./verify.sh`
- Live (stage 2): one call in hours (mobile rings), one outside (callback, no ring).

## Steps
Stage 1
1. Draft the rule (opus subagent) → Jan approves.
2. Paste as draft, run the Preview checks (spends credits).
3. Jan's yes → publish; ask before committing the prompt file.

Stage 2
1. Tests first, then `api/receptionist-init.php`; gate; reviewer pass.
2. Jan's yes → commit; Jan's yes → `npm run deploy`; Jan puts both values in the server config.
3. Jan sets the secret header and webhook URL in ElevenLabs; set placeholders for Preview
   (`advisors_open`=`no`, `transfer_number` empty); enable fetching initiation data for the agent.
4. Prompt + transfer tool change as draft → Jan's yes → publish.
5. Live calls; if calls fail to start, turn the webhook off in the dashboard.

## Review — filled in after building, by the reviewer pass

Not by the author in the same sitting. See `.devkit/prompts/reviewer.md`.

- [x] Q1 · plain sentence a non-developer can read: outside opening hours our server gives the receptionist no number to transfer to. (Not live yet.)
- [x] Q2 · the test that fails without this change: `test/receptionist-init.test.mjs` + `test/php/receptionist-init.test.php`
- [ ] Q3 · `./verify.sh` — receptionist tests 13/13; `npm test` 248/251, the 3 failures are another session's maps work
- [x] Q4 · the risk, named: endpoint down or slow can stop calls from starting; empty-number behaviour untested on a live call
- [x] Q5 · the reviewer read the diff (who, when): main session (code written by a subagent), 2026-11-26
- [ ] `lessons.md` updated — only if something surprised us
