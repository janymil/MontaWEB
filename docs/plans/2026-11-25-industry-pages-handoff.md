# Handoff: industry landing pages (5 remaining + hub + wiring)

Branch `claude/industry-landing-pages-ce59d4` (worktree `.claude/worktrees/industry-landing-pages-ce59d4`). Commit c0d4d77 has the vet page. Jan read its Spanish and approved it on 2026-11-25.

## Done
- `pagina-web-para-veterinarias.html`: the reference for structure, head/meta, JSON-LD (Service + BreadcrumbList + FAQPage, word for word the same as the visible `<details>` FAQ), header/footer shell and CSS/JS includes. The footer already has the "Webs por rubro" link to `/paginas-web-por-rubro`.
- `css/rubros.css`: shared components (`rubro-hero`, `wa-mock`, `rubro-split`, `rubro-prose`, `rubro-h2`, `rubro-note`, `rubro-table`, `rubro-plans`, `rubro-faq` (details), `rubro-demo`, `rubro-links`, `breadcrumb`). Every selector is prefixed `.site-page`. Each page sets the hero colour with `style="--rubro-bg:var(--sky|--orange|--lime|...)"`.
- Plan: `.devkit/plans/2026-11-25-industry-landing-pages.md`. `npm test` passes 99/99.

## Rules (from `docs/decisions/2026-11-25-industry-landing-pages.md`)
- Price from S/ 99 (Web Simple, up to 3 sections). Web Corporativa is S/ 249; Google Mi Negocio is S/ 79. **Never write S/ 50.** Hosting and SSL are included the first year, then S/ 120 a year. The domain is an optional extra (no price on the page).
- Booking happens only by WhatsApp, through a button with a prefilled message for that industry. Never promise online booking, clinical records, membership software, a channel manager or a booking engine. Answer the "software / sistema para X" searches honestly in the FAQ.
- Keywords: primary in the title, H1 and meta; secondary in the H2s and FAQ (keyword map in `docs/research/keywords/2026-11-25-industry-landing-keywords.md`).
- Each page needs its own content and section order, not the vet page with the name swapped. Example ideas: dentists sell "precios de tratamientos + cita de evaluación"; clinics/psychologists sell "first appointment and online sessions by video call, booked by WhatsApp"; gyms sell "free trial class + horarios de clases + planes"; spas sell "booking + gift vouchers (vale de regalo) requested by WhatsApp"; hotels sell "direct booking by WhatsApp without OTA commission", honest about not being a channel manager.
- Demos: vets → veterinaria.montaweb.pe; clinics/dentists → clinica.montaweb.pe; gyms → `/gimnasiolaalameda/`; spas/salons → barberia.montaweb.pe. Hotels have no demo, so leave out the demo block or point to `/ejemplos`. Check what each demo shows before describing it (the vet demo includes online booking and a shop, so it is described as a design reference).
- Published fact usable per industry: the share of businesses with a working website, from `/blog/estudio-web-negocios-lima-2026` (grep that file; e.g. gyms 11 %).
- es-PE text is written by Opus with "tú", following Jan's "Text in other languages" rules plus the Humanizer (`~/.claude/skills/writing/references/humanize.md`, scanner `scripts/humanize-scan.mjs`). The vet page scored 92.

## Remaining steps
1. Five pages: `pagina-web-para-dentistas`, `pagina-web-para-consultorios` (médicos, psicólogos, fisioterapia, nutricionistas), `pagina-web-para-gimnasios`, `pagina-web-para-spa-y-salon-de-belleza`, `pagina-web-para-hoteles`.
2. Hub `paginas-web-por-rubro.html`: links to the 6 pages, ItemList + BreadcrumbList. Add a "Otros rubros" `rubro-links` strip on each page.
3. Wiring (Sonnet subagent, then check its work): `sitemap.xml` (7 URLs), one hub link in `servicios.html` and `index.html`, the same footer link on other pages only if the edit stays small (other sessions are editing main), and `test/industry-pages.test.mjs` (assertions listed in the plan file).
4. Run `npm test` and `./verify.sh`; check the rendered pages at desktop and 375 px (`montaweb-static-8781` launch config, `http://127.0.0.1:8781/<page>.html`; force-reload the CSS); commit; fill in the plan's Review section. No merge or push without Jan's yes.

## Open (Jan did not object; defaults kept)
- The AI receptionist add-on is not mentioned (its decision is still "proposed").
- No per-industry OG image; the default `montaweb-og.jpg` is used.
