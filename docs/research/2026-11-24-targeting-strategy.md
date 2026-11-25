# Who to sell to: using the Lima web census for demos, outreach and lead choice

Date: 2026-11-24 · Data: `docs/research/lima-web-census/data/businesses-anon.csv` (independent businesses, 5+ reviews) · Script: `scripts/lima-web-census/targeting.py`

## 1. The core idea: score willingness to pay from signals we already have
"No website" can mean "won't pay" or "nobody sold it well". The census has fields that tell the two apart:

| Signal (per business) | Why it predicts paying | Points |
|---|---|---|
| Broken/parked site or link redirecting to social (384 businesses) | **Already paid for a website once.** Best lead there is. | +3 |
| Only Facebook/Instagram/WhatsApp (1,264) | Already spends time on marketing, just not on a site | +2 |
| High-ticket or recurring category | One new client pays for the site | +2 |
| 20+ reviews / 100+ reviews | Real customer flow | +2 / +1 |
| Claimed Google profile | Owner is reachable and cares about online image | +1 |
| Rating 4.3+ | Proud of reputation, wants to show it | +1 |
| 20+ photos | Owner invests effort in presentation | +1 |
| Lima Moderna / Centro | Higher ticket, more web competition | +1 |

Score ≥ 9 = **hot lead**: **538** of 5,622 active no-site businesses (10%). The category weight is our judgement, the rest is data.

Signals that mean "skip": unclaimed profile, 0 photos, no social, few reviews. Ferretería is the clearest example: only 41% claimed and 1% on social, so even with the lowest web coverage (6%) the owners aren't online.

## 2. Zones: your instinct is right, with one nuance
| Zone | No-site active | Hot leads | Hot rate | Median reviews | Claimed |
|---|---|---|---|---|---|
| Lima Moderna | 968 | 172 | 18% | 29 | 77% |
| Lima Centro | 1,204 | 164 | 14% | 26 | 69% |
| Lima Sur | 1,279 | 88 | 7% | 21 | 69% |
| Lima Norte | 1,214 | 73 | 6% | 21 | 68% |
| Lima Este | 957 | 41 | 4% | 18 | 66% |

Start with Moderna + Centro (62% of hot leads). Don't write off Norte/Sur entirely: their **strong** businesses (vets, gyms, hotels in Los Olivos/SMP, Chorrillos) score as well as Miraflores ones. Filter by score, not by district.

## 3. Which demo pages to build (by hot leads)
| Priority | Type | Hot leads | Why |
|---|---|---|---|
| 1 | **Veterinaria** | 99 | 570 without site, only 10% have one, median 41 reviews, high ticket |
| 2 | **Dentista** | 66 | 92% claimed, 38% on social: owners online and image-conscious |
| 3 | **Gimnasio** | 42 | 11% have a site, recurring revenue (memberships) |
| 4 | **Spa** | 41 | Booking-driven, image-driven |
| 5 | **Hotel / hostal** | 39 | Median 59 reviews; site = direct bookings without Booking commission |
| 6 | Local de eventos / taller mecánico | 34 + 34 | Event venues are high ticket; workshops are mostly in Lima Sur |
| 7 | **Fisioterapia / psicólogo** | 26 + 20 | 88% claimed, highest "paid before" rate |
| 8 | Restaurante | 25 | Huge pool (622) but low score: low margins, many on Rappi. Volume play later |

Already built: gimnasio (`gimnasiolaalameda/`), barbería, abogados, inmobiliaria, bar. Barbería scores low (13 hot); abogado and inmobiliaria are 59% covered, so they're a "redesign" pitch rather than a "first site" pitch. **Next demos: veterinaria, dentista/clínica dental, spa, hotel.**

Each demo should sell the **feature that brings money**, not "a website": online booking (vet, dentist, spa, physio), membership and class schedule (gym), direct booking (hotel). That segment ("Complejo") is the least covered (20%).

## 4. How to approach businesses without a website
Answer each of the four reasons with the pitch:

| Reason | Answer in the pitch |
|---|---|
| Doesn't want to pay | Show the money: "Your Google listing gets X visits; a booking button turns them into appointments". Monthly price option, low setup. |
| No time | "It's already done." Send a **personalised preview** built from their own Google data: name, photos, reviews, hours, WhatsApp button. Their only effort is saying yes. |
| Thinks they don't need it | Peer pressure from our data: "In your district, 3 out of 10 dentists already have a website" (`peer_site_rate` in the script). Show a competitor's site. |
| Never got a good offer | Be the good offer: concrete, local, WhatsApp-first, result-oriented, guarantee or trial. |

**Channel:** a 1:1 WhatsApp message to the number on their Google profile, then a visit for the top 50. Message order: their name + one specific compliment (rating/reviews) → link to *their* preview → one question ("¿Le gustaría que la publiquemos?"). No mass broadcasts: they get the number banned and are unsolicited bulk commercial messaging. Include an opt-out line. Have the legal side checked (Ley 29733, consumer protection rules on unsolicited advertising) before scaling.

**Best first batch:** the 384 "paid before" businesses (186 of them are hot leads) (broken/parked sites). Pitch: "Your website X is down; customers who click it from Google see an error. We can fix it this week."

## 5. Next steps
1. Done: `scripts/lima-web-census/export_leads.py` writes the 538 hot leads to the git-ignored `docs/research/lima-web-census/private/hot-leads-2026-11-24.csv`. Never commit or publish it.
2. Build demos: veterinaria, dental, spa, hotel.
3. Build an auto-generated "preview from your Google listing" template so a personalised demo costs minutes.
4. Test 30 messages per type, track reply → meeting → sale per category and zone, and re-weight the score with real results.
