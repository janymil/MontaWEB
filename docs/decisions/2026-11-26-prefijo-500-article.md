# Blog guide on the 500 prefix for sales calls, used to sell inbound lead capture
Date: 2026-11-26 · Status: decided

## Context
DS 018-2026-MTC (El Peruano, 15 Sep 2026) reserves 500 XXX XXX numbers for commercial calls and SMS. Operators must be ready by 15 Mar 2027. Ley 32323 (May 2025) already requires prior express consent (art. 58 Código de Consumo). Research: `docs/research/2026-11-26-prefijo-500-llamadas-comerciales.md`. Peru volumes: "llamadas spam" 590, "como bloquear llamadas spam" 590, "gracias no insista indecopi" 590, "ley 32323" 140, "prefijo 500" 30 (the term is new, so volume lags).

## Decision
- Publish `/blog/prefijo-500-llamadas-comerciales` as a "Guía". Title targets "llamadas spam" + "prefijo 500".
- Content: what the norm says, the timeline, "the 500 is not a permission", Indecopi fines (BBVA, Interbank, Pacífico, with instance status), who enforces what, a checklist for small businesses, and how to report spam calls.
- Interactive parts: a phone mock-up (today vs 500), a 3-question compliance checker, an animated fines chart and a cold-call calculator where the reader sets the drop rate. We give no figure of our own for the drop.
- MontaWeb angle: "que el cliente te busque a ti". Web + WhatsApp button + a form with a consent checkbox (the consent record the law asks for) + Google Business Profile. Mid-article promo and final CTA.
- Left out as unverified: the MTC figure of 1,360 million calls a year, calling hours, sanctions for companies calling from non-500 numbers after March 2027, and DL 1723 details.

## Why
The topic hits every small business that sells by phone, and its answer (inbound leads with recorded consent) is what MontaWeb sells. It is a timely news topic until March 2027, with links available from consumer and legal outlets.

## Consequences / next steps
- Jan reads the Spanish before deploy; no Pixabay photos yet (the API key lives in another project's .env).
- The promo promises a form that stores consent (date + accepted text): make sure every new site build does this.
- Outreach ideas (send nothing without Jan's yes): LP Derecho, Gestión's consumer desk, Cámara de Comercio de Lima newsletter, ASPEC.
- Revisit in March 2027: confirm the operators' rollout and add what Indecopi or the MTC says then.
