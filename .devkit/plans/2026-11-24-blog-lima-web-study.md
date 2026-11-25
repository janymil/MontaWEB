# Plan: blog section + flagship article "Estudio web Lima 2026"

Status: approved scope from Jan (2026-11-24), not started. Research is finished and committed (`1aded9f`).

## Inputs (read these first)
- Research and numbers: `docs/research/lima-web-census/README.md`. Do not invent figures. Every number on the page must come from that README or from `docs/research/lima-web-census/data/*.csv|json`.
- Article draft (es-PE): `docs/research/lima-web-census/articulo-es.md`. Rewrite and enrich it; don't paste it as-is.
- Design system: `docs/decisions/2026-11-23-site-wide-editorial-design.md`, `css/site.css`, `js/app.js`. Copy the header, footer and nav from an existing page such as `servicios.html`.
- Read before editing: `.devkit/lessons.md`. In particular, bump `?v=` on any shared js/css file you touch.

## Deliverables
1. **`blog.html`: article index ("Blog" or "Estudios y guías").**
   - Editorial card grid: image, category, date, reading time, excerpt.
   - Built so new posts are easy to add. Keep it static: one card per post in HTML is fine.
2. **Single article page: `blog/estudio-web-negocios-lima-2026.html`.**
   - Clean URL `/blog/estudio-web-negocios-lima-2026`. Check the Caddy `.html` rewrite.
   - Hero with a key stat ("Solo 1 de cada 4…"), byline, date, reading time, share buttons (WhatsApp, LinkedIn, Facebook, X, copy link).
   - Sticky table of contents. Reading-progress bar.
   - **Interactive figures**, accessible, light and dark, no heavy library (inline SVG and vanilla JS, or one small chart lib):
     - a filterable bar chart by rubro (toggle "todos" / "activos", segment filter)
     - a zone map or zone bars for Lima (5 zones)
     - a stacked "¿qué encuentra el cliente?" bar
     - a "¿tu rubro?" widget: pick a rubro and a zone, see the % with web and how many competitors lack one, then a CTA
   - **Promo blocks inside the article:**
     - one mid-article MontaWeb box, for example a free diagnosis: "revisamos tu ficha de Google gratis"
     - links to the existing demos (`ejemplos`, the restaurante, clínica, barbería and abogados subdomains)
     - a strong final CTA (WhatsApp plus `/contacto`)
   - "Metodología" as a collapsible section, with a download link to the anonymised CSVs. Use a direct file link, because a directory URL returns 404.
3. **Header menu.** Add "Blog" to the nav on every public page. Update the shared nav test in `test/` if it exists.
4. **Images: real Lima photos.**
   - Use photos with clear licences only: Wikimedia Commons (CC BY or CC BY-SA, with credit) or Unsplash/Pexels (credit anyway). Good subjects: Miraflores, Centro de Lima, Gamarra/La Victoria, a market or small storefronts, SJL/Los Olivos streets.
   - Never use images found through Google Images or images of unclear origin.
   - Convert to WebP. Hero image around 1600 px and ≤ 250 KB; in-article images around 1200 px. Add `width`/`height`, `loading=lazy` below the fold, and descriptive Spanish `alt`.
   - List every image with its source URL, author and licence in `docs/research/lima-web-census/IMAGE-CREDITS.md`, and show credits under each figure.
   - Also make a 1200×630 OG share image with the headline stat.
5. **SEO:**
   - Unique title (≤ 60 characters) and meta description (≤ 155), canonical, OG/Twitter tags, `lang="es-PE"`.
   - JSON-LD: `Article` (author: Organization Semantika TECH / MontaWeb, datePublished, image), `BreadcrumbList`, `Dataset` (for the anonymised data) and `FAQPage` (4–5 real Q&As).
   - One H1 and a logical H2/H3 hierarchy.
   - Internal links to `/servicios`, `/ejemplos`, `/contacto`, `/diseño-web-lima` and `/google-mi-negocio`.
   - Add the blog and the article to `sitemap.xml`.
   - Run the `seo-audit` skill on the finished page.
6. **Outbound citations.** Link to authoritative, high-ranking sources, and verify each claim and URL before linking:
   - INEI (internet use and household ICT; Encuesta Nacional de Empresas, if relevant)
   - PRODUCE or ComexPerú (number of MYPEs in Peru and Lima)
   - Google's notice that Business Profile websites (business.site) were retired in 2024
   - Google Search Central (why a website matters for local search, if a suitable page exists)
   - Ley 29733 (official text, for the privacy note)
   - DataForSEO (data source)
   - Use `rel="noopener"`. Do not add `nofollow` to these editorial citations.
7. **Backlink plan.** Jan said "backlinks". Outbound citations alone don't earn backlinks. Write `docs/plans/2026-11-24-backlinks-estudio-web.md` with:
   - target outlets and blogs: Gestión, El Comercio Economía, Andina, Infobae Perú, Semana Económica, PQS, Cámara de Comercio de Lima, university entrepreneurship blogs, LinkedIn
   - a short es-PE press note and a pitch email
   - an embeddable chart snippet with attribution
   - **Sending nothing:** every pitch needs Jan's yes.

## Quality bar
- Must look and read like a high-end editorial data piece. Use the `frontend-design` skill.
- Reading time around 7–9 minutes.
- Mobile first. axe clean. LCP < 2.5 s on mobile. No console errors.
- `npm test` and `./verify.sh` pass. Add tests for the new pages: links, nav entry, JSON-LD parses, images have alt.
- Before deploying, check in a browser at 375 px and at desktop width, in light and dark.

## Deploy (only with Jan's explicit yes in that session)
Commit only these paths. Push to `origin`, then run `ssh washington "cd /var/www/montaweb && git pull --ff-only origin main"`. Verify with `curl --resolve montaweb.pe:443:127.0.0.1` on the server, as described in `.devkit/lessons.md`.

## After the article
Choose the demo sites to build. Use `proven_demand_no_site` in `docs/research/lima-web-census/data/by_category_active.csv`. The leading candidates without a demo are veterinaria, hotel/hostal, pastelería, taller mecánico and local de eventos.

## SEO keywords and content cluster (added 2026-11-24, per Jan via the research session)

Method: free Google autocomplete only (hl=es, gl=pe). It shows relevance, **not volume**. DataForSEO credit (~$0.06) was not spent. Lima-specific long tails return nothing; Peru-level pricing queries are strong.

- **Primary keyword:** `negocios sin página web` (+ Lima, + estudio). Applied: title "Negocios sin página web en Lima: estudio de 19 168 (2026)" (57 chars), H1 "Negocios sin página web en Lima: solo 1 de cada 4 con clientela tiene una que funciona".
- **Secondary:** negocios locales sin página web; negocios sin web; cómo encontrar negocios sin página web; para qué sirve una página web en un negocio (now an H2); google mi negocio página web; página web para pequeños negocios.
- **Pricing / commercial (for the cluster, strongest signal):** cuánto cuesta una página web en Perú (+ crear, hacer, mantenimiento, dominio); diseño web Lima; página web para restaurante / barbería / hotel / abogados.
- To verify later with real volumes if Jan funds a keyword tool: the zero-competition coined term "estudio negocios con página web Lima".

### Cluster: this article is the hub (build later, not now)
Each spoke carries its stat from `data/by_category_active.csv` (active businesses = 5+ reviews) and links back to the hub. Internal-link slots to add in the article once the pages exist: "Qué hacer" section and the per-rubro table.

| # | Spoke page | Local stat to use |
|---|---|---|
| 1 | Cuánto cuesta una página web en Perú (precios, dominio, mantenimiento) | Services prices on `/servicios`; no study stat needed |
| 2 | Página web para restaurante en Lima (carta digital, pedidos) | 16,3 % of 743 active restaurants; 485 with 20+ reviews and no site |
| 3 | Página web para barbería (reservas por WhatsApp) | 11,9 % of 388; 226 with 20+ reviews and no site |
| 4 | Página web para hotel o hostal (reservas directas) | 25,6 % of 581; 330 with 20+ reviews and no site |
| 5 | Página web para abogados | 59,0 % of 183 (the benchmark: what "normal" looks like) |
| 6 | Página web para veterinaria | 10,4 % of 636; 420 with 20+ reviews and no site |
| 7 | Página web para gimnasio | 10,9 % of 431; 223 with 20+ reviews and no site |
| 8 | Google Mi Negocio vs página web propia | 17,0 % of active businesses use only social links; 5,1 % broken (summary data) |
| 9 | Para qué sirve una página web en un negocio local | Headline 24,4 % |
| 10 | Crear tienda online en Perú | Tienda online segment: 25,9 % of 1 446; only 53 % of shop sites can sell |

Existing pages to reuse: `/ejemplos` and the demo subdomains (restaurante, clínica, barbería, abogados, inmobiliaria), `/google-mi-negocio`, `/servicios`.
