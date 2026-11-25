# Lima web census 2026: how many small businesses that need a website actually have one

Date: 2026-11-24 · Data: Google Maps via DataForSEO (pulled 2026-11-24) + homepage probe of every listed site · Cost: $0.60

## Question
Among Lima businesses that would clearly benefit from a website (a presentation site, a booking/ordering site, or an online shop), what share has a working website of their own?

## Method
1. **Universe.** 30 business types in 3 segments:
   - *Presentación* (8): abogado, estudio contable, arquitecto, inmobiliaria, psicólogo, taller mecánico, constructora, imprenta.
   - *Complejo: reservas, pedidos o matrícula* (13): restaurante, hotel, centro médico, dentista, gimnasio, spa, salón, barbería, veterinaria, fisioterapia, academia, nido, local de eventos.
   - *Tienda online* (9): ropa, mueblería, florería, pastelería, óptica, joyería, ferretería, pet shop, cosméticos.

   Bodegas, market stalls, public bodies and similar were left out on purpose.
2. **Sample.** For each type, a Google Maps search (Spanish, top 100 results, zoom 14z) in 10 districts, two per zone: Miraflores and Surco (Moderna), Cercado and La Victoria (Centro), Los Olivos and SMP (Norte), Ate and SJL (Este), Chorrillos and VES (Sur). That is 300 searches and 28,731 listings.
3. **Cleaning.**
   - 5,227 results were dropped as off-category. A result counts only if its Google category matches the type, per a regex in `harvest.py`.
   - Closed businesses were dropped.
   - 3,821 duplicates were dropped (same Maps CID).
   - That leaves **19,683 businesses**.
   - 515 listings are **chains**: the same own domain on 3 or more listings. They are excluded, which leaves **19,168 independent businesses**.
4. **Web classification** of the website link on the Google profile: none, social only (Facebook, Instagram, TikTok, wa.me, Linktree…), platform only (Doctoralia, Fresha, Rappi, Booking…), directory only (Páginas Amarillas…), dead Google `business.site` (retired 2024), free builder subdomain, or own domain.
5. **Probe.** One homepage GET per unique host (3,820 hosts).
   - A site is **functional** if it answers (bot-protection 401/403/429/503 counts as up), is not parked or "en construcción", and does not redirect to social media.
   - The probe also records HTTPS, mobile viewport, WhatsApp link, form, schema.org, e-commerce engine, booking tool, response time and copyright year.
6. **"Active" cut.** A business with 5 or more Google reviews (7,441). This removes ghost listings, which are 34% of all listings and have 0 reviews.

## Key findings (independent businesses)
| | All 19,168 | Active (5+ reviews) 7,441 |
|---|---|---|
| Working website of its own | **16.1%** | **24.4%** |
| No link at all | 65.0% | 51.9% |
| Only Facebook/Instagram/WhatsApp | 13.4% | 17.0% |
| Broken, parked or dead site | 4.2% | 5.1% |
| Only a platform or directory | 1.2% | 1.5% |

- **By segment (active):**

  | Segment | Working site |
  |---|---|
  | Presentación | 40% |
  | Tienda online | 26% |
  | Complejo | **20%** |

  The businesses that most need a booking or ordering system are the least likely to have a site.
- **By zone (active):**

  | Zone | Working site |
  |---|---|
  | Lima Moderna | 42% |
  | Lima Centro | 31% |
  | Lima Sur | 16% |
  | Lima Norte | 15% |
  | Lima Este | **12%** |
- **Lowest coverage (active):**

  | Business type | Working site |
  |---|---|
  | ferretería | 6% |
  | veterinaria | 10% |
  | gimnasio | 11% |
  | barbería | 12% |
  | pastelería | 12% |
  | local de eventos | 12% |
  | salón | 14% |
  | restaurante | 16% |
- **Highest coverage (active):**

  | Business type | Working site |
  |---|---|
  | arquitecto | 62% |
  | abogado | 59% |
  | inmobiliaria | 59% |
  | constructora | 50% |
  | joyería | 49% |
- **Reviews vs web:** 11% of businesses with 0 reviews have a working site, against 45% of those with 200+ reviews. This is a correlation, not causation.
- **Proven demand, no site.** 3,012 businesses have 20+ reviews and no working site. The largest groups:

  | Business type | Businesses |
  |---|---|
  | restaurantes | 485 |
  | veterinarias | 420 |
  | hoteles/hostales | 330 |
  | barberías | 226 |
  | gimnasios | 223 |
  | pastelerías | 167 |
  | dentistas | 147 |
  | talleres | 136 |
  | locales de eventos | 118 |
  | spas | 114 |
- **Quality of the 3,085 working sites:**
  - 91% use HTTPS and 96% have a mobile viewport.
  - 51% link to WhatsApp.
  - 43% have a form.
  - 13% take over 3 s for the HTML alone.
  - 18% show a copyright year before 2024.
  - 11% sit on a free-builder subdomain.
  - **Only 15% of complejo sites take bookings online.**
  - **Only 53% of shop sites can actually sell** (store engine or buy button).
  - Platforms: WordPress 44%, custom/other 43%, Wix 5%, Shopify 4%.

## Validity and limits
- **Ranking bias is small.** Working sites make up 17.9% of Maps positions 1–20 and 15.0% of positions 51–100. Taking the top 100 does not inflate coverage much.
- **Agrees with the pilot.** The independent Sellbird/MiCita pilot (2026-11, 7 types, Lima Norte and Sur, different query set) found about 30% with any link at all. This study finds about 31% for the same zones.
- **Maps only sees what owners list.** A business may own a site it never added to Google. For a customer searching Maps, that site does not exist.
- **Homepage only.** A booking or shop feature on a subpage is missed, so the booking and e-commerce numbers are lower bounds.
- **Not a census of every business.** These figures describe the businesses Google Maps shows in 10 of Lima's 43 districts. They are not an exact count of all of Lima.

## Files
- **Committed (anonymised, no names or phones):**
  - `data/summary.json`, `data/funnel.json`
  - `data/by_*.csv`: category, segment, zone, district, review band, with `_active` variants
  - `data/rank_bias.csv`, `data/site_quality.csv`, `data/platforms.csv`
  - `data/businesses-anon.csv`: one row per business
- **Not committed (Ley 29733: phones and names):** `raw/` (DataForSEO responses) and `private/businesses.json`. They are kept on Jan's PC and in `/root/research/lima-web-census/` on Washington. They are not in the web root.
- **Scripts:** `scripts/lima-web-census/`.
  - Re-run with `harvest.py`, then `build.py`, then `probe.py`, then `analyze.py`.
  - The DataForSEO keys live in `sellbird-pilot/.env`.
- **Article draft (es-PE):** `articulo-es.md`.

## Next step
Choose which demo sites to build. Use `proven_demand_no_site` in `data/by_category_active.csv`, and compare it with the demos that already exist (restaurante, clínica, barbería, abogados, inmobiliaria, gimnasio).
