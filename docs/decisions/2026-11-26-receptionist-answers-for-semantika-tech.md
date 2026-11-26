# The AI receptionist answers for SEMANTIKA TECH and all its products, not only MontaWeb
Date: 2026-11-26 · Status: decided

## Context
The agent was written as MontaWeb's receptionist. Jan: the Zadarma Lima number (+51 1 701 8523) is the company number of SEMANTIKA TECH.

## Decision
- The receptionist answers as SEMANTIKA TECH, knows its apps and projects, and identifies which one the caller is calling about.
- The greeting changes accordingly (es-PE, written by Opus, approved by Jan before publishing).
- Products covered (Jan, 2026-11-26): MontaWeb, MiCita, LibroDigital.pe, DatosPrivados.
- Not covered: PepCalculator, MT5Connector, Zenit Vita, Kaptia. A caller about anything else just gets a message taken (assumed; Jan can change it).

## Why
Callers of the company number may be customers of any product.

## Consequences / next steps
- Collect verified facts per product (what it is, who it is for, price, support route); the agent must not invent any.
- Lead data and email need a "product" field (code change in api/receptionist-lead.php plus a data-collection field).
- Voice-rules decision (2026-11-25) still applies.
