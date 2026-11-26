# 2026-11-25 — A vet, dentist, clinic, gym, spa or hotel owner finds a page written for their business

## Goal

Six industry landing pages plus a hub, each selling the one feature that brings that industry money (booking by WhatsApp), ranking for the Peru keywords in `docs/research/keywords/2026-11-25-industry-landing-keywords.md`.

## Out of scope

Restaurants, lawyers, real estate (later, per the decision). New demos. Online booking, clinical records, membership software, channel managers (not sold). A price guide page. Rewriting servicios/footer beyond one link each.

## Files that will change

- `pagina-web-para-veterinarias.html`, `pagina-web-para-dentistas.html`, `pagina-web-para-consultorios.html`, `pagina-web-para-gimnasios.html`, `pagina-web-para-spa-y-salon-de-belleza.html`, `pagina-web-para-hoteles.html` — new pages (clean URLs via the existing Caddy `{path}.html` rewrite)
- `paginas-web-por-rubro.html` — hub
- `css/rubros.css` — components only these pages use (chat mockup, details FAQ, price strip); `site.css` untouched to avoid conflicts with parallel sessions
- `sitemap.xml`, footer "Servicios" column (one hub link per page that carries the footer), `servicios.html` + `index.html` one link to the hub
- `test/industry-pages.test.mjs` — new
- Demo redirects (`veterinaria.html` etc.) stay as they are.

## The risk

A page promises something MontaWeb does not sell (online booking, S/ 50 price) → a client asks for it, trust and refund risk; Jan notices on the first call. Doorway-page penalty if the pages read as a template → Google ignores them; seen in Search Console within weeks. Footer/sitemap merge conflicts with sessions on main → seen at merge.

## How it is proven

- Test: `test/industry-pages.test.mjs` asserts per page: canonical/og:url/absolute og:image, title+H1+meta contain the primary keyword, JSON-LD parses with Service + FAQPage + BreadcrumbList, FAQPage questions match the visible `<summary>` items, price S/ 99 present and "S/ 50" absent, no forbidden promises ("reserva online", "historia clínica" only inside FAQ answers that deny it, etc.), a wa.me link with a prefilled text, link to the hub, in sitemap; hub links all six.
- Gate: `./verify.sh`
- Manual: rendered pages checked in a browser at desktop and 375 px; Jan reads the vet page Spanish.

## Steps

1. Vet page + `css/rubros.css`; Humanizer scan; browser check; Jan reads it.
2. The other five pages, each with its own structure and examples.
3. Hub page.
4. Wiring (sitemap, footer, servicios/index links) + tests — sonnet subagent, checked.
5. Gate, rendered check, commit on the branch.

## Review — filled in after building, by the reviewer pass

- [ ] Q1 · plain sentence a non-developer can read:
- [ ] Q2 · the test that fails without this change:
- [ ] Q3 · `./verify.sh` — result:
- [ ] Q4 · the risk, named:
- [ ] Q5 · the reviewer read the diff (who, when):
- [ ] `lessons.md` updated — only if something surprised us
