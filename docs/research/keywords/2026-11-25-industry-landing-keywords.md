# Industry landing pages: keyword research (Peru)

Date: 2026-11-25 · Source: DataForSEO Google Ads volumes (Peru, Spanish, last 12 months) + Google Peru top 10 + Lima web census · Cost: $0.12 (balance $54.94)

Raw data: `2026-11-25-volume-peru.json` (440 keywords), `2026-11-25-serp-peru.json` (14 SERPs, titles only), `raw-serp-paginas-web-lima.json`. Free autocomplete seeds: `2026-11-25-autocomplete-raw.json`. Scripts: `scripts/keywords/` (`dfs.py` prints cost and balance after every paid call).

## Main findings
1. **Searches per industry in Peru are small**: 10–70 a month per keyword, and Google groups singular/plural together. No industry page brings big traffic by itself.
2. **Little competition from agencies.** For "pagina web restaurante / veterinaria / pasteleria / ferreteria" Google Peru shows small business sites, dead sites and Facebook pages, not web agencies. A good page can reach the top 3 quickly.
3. **"pagina web de X" is mostly navigational** (people looking for a specific school or restaurant). The buyer phrases are "pagina web para X" and "diseño web para X", each ~10/month.
4. That makes industry pages worth it mainly as **conversion and outreach assets**: a link we send to a restaurant owner from the census list, which also catches the small search demand and answers from AI tools.
5. **Bigger generic terms**: "crear pagina web" 1,900 (DIY intent, guides rank), "tienda online" 1,900 (shops, not buyers of a site), "paginas web lima" 170 and "diseño web lima" 170 (already covered by `/diseño-web-lima`), "diseño web peru" 110, and **"cuanto cuesta una pagina web (en peru)" 50+50 plus "precio pagina web" 40**, where the SERP is all price guides. A price guide is a separate opportunity.

## Ranking of industries (search demand × census targets × existing demo)
| # | Page | Keywords (monthly Peru volume) | Census: active Lima businesses with demand and no site | Demo |
|---|---|---|---|---|
| 1 | Restaurantes, cafeterías y pastelerías | pagina web restaurante(s) 70 · de restaurante 50 · de pasteleria 40 · carta digital restaurante 30 · de cafeteria 20 · para restaurantes 10 · diseño web para restaurantes 10 | 485 + 167 | yes |
| 2 | Hoteles, hostales y turismo | pagina web agencia de viajes 30 · de turismo 20 · para agencia de viajes 20 · hotel(es) 10–10 · diseño web para hoteles 10 | 330 | no |
| 3 | Veterinarias | pagina web de veterinaria(s) 20 · veterinaria 10 · para veterinaria 10 | 420 | yes |
| 4 | Clínicas, consultorios y dentistas (+ psicólogos, nutricionistas) | medicos 10 · dentista 10 · clinica dental 10 · psicologos 10 · para psicologos 10 · nutricionista 10 (CPC 2.87) | 147 + 105 + 65 + 37 | yes |
| 5 | Barberías, salones y spas | barberia 10 · peluqueria 10 · salon de belleza 10 · spa 10 | 226 + 74 + 114 | yes |
| 6 | Gimnasios | pagina web gimnasio 10 · gym 10 | 223 | yes |
| later | Inmobiliarias | pagina web inmobiliaria(s) 20 · de inmobiliaria 20 | only 12 (59% already have a site) | yes |
| later | Abogados | pagina web abogado(s) 10 · diseño web para abogados 10 | only 24 (59% have a site) | yes |
| skip | Colegios | 30, but navigational (parents looking for a school) | — | no |

## Notes on data quality
- Google now wraps organic links in redirect URLs, so DataForSEO reports `google.com` as the domain. The titles are correct; domains were read from the titles.
- Volumes under 10 show as 0. Many keywords with 0 still get a few searches.

## Update: competitors and feature keywords (same day)
Extra cost $0.39: DataForSEO Labs overview + ranked keywords for 10 Lima agencies, and one volume call for 346 feature keywords. **Total spent $0.51, balance $54.55.** Files: `2026-11-25-competitors-labs.json`, `2026-11-25-competitor-keywords-agg.json`, `2026-11-25-volume-peru-features.json`.

Prices: websites start at **S/ 99** (S/ 50 is a different service).

### How Lima agencies get clients (estimated monthly Google visits, Peru)
| Domain | Organic keywords | Est. visits | Google Ads |
|---|---|---|---|
| kom.pe | 647 | 2,615 | none seen |
| hosting.com.pe | 121 | 836 | none seen |
| bersoft, respiraweb, tuwebpe, talentuperu, paginasweblimaperu, nubix, kozma360, triico | 0–14 | 0–15 | none seen |

- **Almost none of them get clients from Google search.** kom.pe gets its traffic from a blog for entrepreneurs ("qué es emprendimiento", "ecommerce qué es", tool price articles), not from service pages. hosting.com.pe ranks for hosting and domains.
- **None of them has industry pages that rank.** No competitor ranks for any "página web para veterinaria / dentista / gimnasio / hotel" keyword. That ground is free.
- No Google Ads seen in Labs data (it can miss small advertisers). Their clients most likely come from Facebook/Instagram ads, the Google Maps local pack (shown for "paginas web lima"), "top 10 agencias" lists and referrals. Next free check: Meta Ad Library and Google Ads Transparency Center for these agencies.

### Bigger generic keywords (better than any industry keyword)
diseño de paginas web 1,900 · tienda virtual 1,900 · diseño web 1,000 · landing page 5,400 (mostly "what is / examples") · diseño de paginas web en lima 480 (kom #3, bersoft #4) · diseño de tiendas virtuales 480 (kom #1) · web empresas 480 · creacion de paginas web 320 (CPC 2.53, HIGH) · **chatbot whatsapp 320 (CPC 4.10), a fit for the AI receptionist** · pagina web en lima 170 · diseñador web lima 170 · paginas web peru 170 · diseño web profesional 140 · hacer una pagina web 140.

### Keyword map for the industry pages (primary first)
Owners search for *software/sistema* to run the business more than for "página web". Each page should target both, but claim only what MontaWeb really delivers.
| Page | Primary | Secondary (monthly Peru volume) | Money feature to sell |
|---|---|---|---|
| Veterinarias | pagina web para veterinaria | pagina web de veterinaria 20 · historia clinica veterinaria 70 · software veterinario 30 · sistema / programa para veterinaria 10 · publicidad para veterinaria 10 | online appointments + vaccine reminders by WhatsApp |
| Dentistas | pagina web para dentista / clinica dental | software dental 90 · software odontologico 20 · sistema para consultorio dental 10 · marketing para dentista 10 | online appointments |
| Clínicas, psicólogos, fisioterapia | pagina web para medicos / psicologos | pagina web psicologo 10+10 · nutricionista 10 (CPC 2.87) · software para clinica 20 · sistema para psicologo 10 | online appointments, online sessions |
| Gimnasios | pagina web para gimnasio / gym | software para gimnasio 30 · sistema para gimnasio 20 · app para gym 20 · marketing para gym 10 | memberships and class bookings |
| Spas y salones | pagina web para spa / salon de belleza | publicidad para salon de belleza 30 · sistema para salon de belleza 10 · pagina web peluqueria 10 | bookings, gift vouchers |
| Hoteles y hostales | pagina web para hotel | channel manager 70 (CPC 9.07) · software hotelero 40 (CPC 8.07) · sistema para hotel 40 · motor de reservas hotel 10 · reservas directas hotel 10 | direct bookings without OTA commission |
