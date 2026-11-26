# MontaWeb runs a two-sided referral program for its clients
Date: 2026-11-25 · Status: decided

## Context
Prices are low and paid once (Web Simple S/ 99 … Tienda Pro S/ 499; hosting S/ 120/yr from year 2), so a referral reward has to stay small. Options weighed: tiered cash (A), two-sided (B), hosting credit only (C). Jan chose B.

## Decision
- Who can refer: past and current MontaWeb clients (not the general public, for now).
- Referrer reward, per closed sale of S/ 99 or more: S/ 20 by Yape **or** S/ 40 off their next hosting renewal (their choice).
- Referred business: a free Google Mi Negocio profile setup (list price S/ 79) with its web.
- If the referred plan already includes Google Mi Negocio (Pack Presencia), the referred business gets S/ 20 off instead (confirmed by Jan).
- Sales under S/ 99 (landing, Google Mi Negocio alone, menú QR) earn no reward for either side: the referred business's free profile (or S/ 20 off) also needs a sale of S/ 99 or more (confirmed by Jan 2026-11-25).
- Paid once the referred client has paid the second half (web delivered and approved).
- Tracking: each client gets a code (e.g. EDEN24). The link `montaweb.pe/referidos?ref=CODE` opens WhatsApp with the code in the message; fallback is the referrer's name in the first message.
- First contact wins; no self-referral; the referred business must not have talked with us in the last 90 days; no cap on referrals.
- Public page: `/referidos`, with terms.

## Why
- B gives the new business a reason to write (friend gains too), which matters more than the size of the reward.
- Cost on a S/ 99 sale: S/ 20 (20 %) or ~S/ 0 cash with the hosting credit; on S/ 249: 8 %. The GMB setup is ~1 h of work.
- Hosting credit costs almost nothing on the existing VPS and needs no SUNAT sustento; cash payouts need a declaración jurada to be deductible.

## Consequences / next steps
- Jan assigns codes to clients and keeps a simple sheet: code, client, referred business, sale, reward, paid date.
- Announce by WhatsApp: `docs/plans/2026-11-25-referral-messages.md`.
- Reopen to non-clients later if clients refer too little.
