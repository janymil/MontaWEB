# Demo reels: scripts (es-PE) for /videos-publicitarios-con-ia

Date: 2026-11-25 · Status: approved by Jan, built (timings in reels.json follow the real voice-over) · Format: 9:16, 720×1280, 25–27 s, sound on but readable muted (the page autoplays muted).

Shared structure (all three):
- **0–2.5 s hook**: one big animated question over the strongest shot (words punch in on the beat).
- **Body**: 4–5 shots of 3–4 s, kinetic captions of the voice-over (2–5 words at a time, synced to the voice), slow push-ins, whip/flash cuts on the beat.
- **Offer card** (~4 s): slides in over a blurred shot: what, price stamp, when.
- **Outro** (~4.5 s): logo reveal, offer recap, green WhatsApp button that pulses, music hit on the last beat. No phone number, no label, no "ejemplo".
- Prices are invented but realistic for a Lima barrio business.

---

## 1. Pollería Doña Meche · voice Jair · music: upbeat cumbia, ends on a hit

**Locución (≈17 s):**
> ¿Hoy toca pollo a la brasa? En Doña Meche lo marinamos desde la noche anterior y lo doramos al carbón, despacito. Todos los martes: cuarto de pollo con papas, ensalada y sus cremas, a solo quince soles. Pídelo por WhatsApp y te lo llevamos calientito.

| s | Shot (footage) | On screen |
|---|---|---|
| 0–2.5 | Pollos girando sobre el carbón, llamas (raw `polleria.mp4` 0–2.5) | **¿Hoy toca pollo a la brasa?** |
| 2.5–6 | NEW P2: primer plano, cuchillo partiendo un pollo dorado en la tabla, piel crocante | Marinado desde la noche anterior |
| 6–9 | Carbón y pollos, plano cerrado (raw 0–3, zoom) | Al carbón, despacito |
| 9–13 | Sirven el plato en la mesa (raw 3.5–8) | Cuarto de pollo con papas, ensalada y sus cremas |
| 13–17 | Plato quieto, fondo desenfocado | Card: **Promo de los martes** · 1/4 de pollo + papas + ensalada · sello **S/ 15** |
| 17–21.5 | NEW P3: familia en una mesa de la misma pollería, comparten el pollo y se ríen | Pídelo por WhatsApp |
| 21.5–26 | Outro | Logo **Doña Meche** · Pollería a la brasa · "Martes: 1/4 de pollo a S/ 15" · botón **Pide por WhatsApp** · Delivery a tu casa |

## 2. Veterinaria Huellitas del Parque · voice Daniela · music: light ukulele, warm, ends on a hit

**Locución (≈19 s):**
> ¿Tu engreído ya tiene sus vacunas al día? En Huellitas del Parque lo revisamos con calma y mucho cariño. Este mes hay campaña de vacunación para perros y gatos: vacunas desde treinta y nueve soles, y el chequeo es gratis. Sale sanito y moviendo la cola. Separa tu cita por WhatsApp.

| s | Shot (footage) | On screen |
|---|---|---|
| 0–2.5 | El perro mira a cámara, lengua afuera (raw `veterinaria.mp4` 0–2.5) | **¿Ya tiene sus vacunas al día?** |
| 2.5–6.5 | La veterinaria lo revisa con el estetoscopio (raw 4–8) | Con calma y mucho cariño |
| 6.5–10.5 | NEW V2: la misma veterinaria (uniforme verde azulado, mismo consultorio) sostiene un gato atigrado tranquilo y le pone la vacuna; lo acaricia | Campaña de vacunación · perros y gatos |
| 10.5–14.5 | Card sobre el gato desenfocado | **Campaña de vacunación** · Vacunas desde **S/ 39** · Chequeo gratis |
| 14.5–19.5 | NEW V3: una dueña sale del consultorio con el mismo golden retriever, que mueve la cola, hacia un parque soleado | Sale sanito y moviendo la cola |
| 19.5–20.5 | (bridge) | Separa tu cita por WhatsApp |
| 20.5–25 | Outro | Logo **Huellitas del Parque** · Veterinaria · "Vacunas desde S/ 39 · chequeo gratis" · botón **Separa tu cita por WhatsApp** |

## 3. Barbería Don Lucho · voice Jair · music: urban hip-hop beat with Latin percussion, ends on a hit

**Locución (≈17 s):**
> ¿Ya toca corte? En Barbería Don Lucho te hacemos el degradado como te gusta: bien parejito y sin apuro. Corte más barba, treinta soles. Y si vienes con un pata, el segundo corte sale a mitad de precio. Reserva por WhatsApp y no hagas cola.

| s | Shot (footage) | On screen |
|---|---|---|
| 0–2.5 | NEW B2: un chico en el baño de su casa se mira al espejo con el pelo crecido y desordenado, se lo revuelve, cara de "ya fue" | **¿Ya toca corte?** |
| 2.5–6 | La máquina hace el degradado (raw `barberia.mp4` 0–3) | Degradado como te gusta |
| 6–9 | Brocha en la nuca, el cliente relajado (raw 3–4.5 + 6–7; the cape lettering at 4–6 s is cut or blurred) | Bien parejito y sin apuro |
| 9–12.5 | Card sobre el cliente sonriendo (raw 6–8) | **Corte + barba** · sello **S/ 30** |
| 12.5–17 | NEW B3: dos amigos en sillones vecinos de la misma barbería, se cortan a la vez, se chocan el puño y se ríen | Card 2: **Ven con tu pata** · 2.º corte a mitad de precio |
| 17–21 | Cliente sonríe al espejo, barbero detrás (raw 6–8, other angle/zoom) | Reserva por WhatsApp y no hagas cola |
| 21–25.5 | Outro | Logo **Don Lucho** · Barbería · "Lunes a sábado" · botón **Reserva por WhatsApp** |

---

## Flow shots to generate (6 clips, 9:16, 720p, Gemini Omni 1.2 Flash, still first)

Every prompt ends with: "Vertical 9:16, natural light, realistic, no text, no letters, no logos, no captions."
- **P2**: Extreme close-up of a cook's hands cutting a golden, crispy rotisserie chicken in half with a large knife on a wooden board, steam rising, warm restaurant with exposed brick and hanging bulbs behind, out of focus.
- **P3**: A Peruvian family of four (parents, a girl, a boy) at a wooden table in a warm rustic rotisserie-chicken restaurant with exposed brick and hanging bulbs, sharing a plate of rotisserie chicken with french fries and salad, laughing, the boy takes a fry.
- **V2**: In a bright vet clinic with beige walls, plants on white shelves and a steel exam table, a smiling female vet with brown hair in a bun and teal scrubs holds a calm tabby cat and gives it a small injection at the scruff, then strokes its head.
- **V3**: A young woman walks out of a bright vet clinic glass door with a happy golden retriever on a leash, the dog wags its tail and looks up at her, sunny park with trees outside.
- **B2**: A young Latino man with overgrown, messy dark hair looks at himself in a small home bathroom mirror, runs his hand through his hair, makes a fed-up face.
- **B3**: Two young Latino friends sit in neighbouring barber chairs in a barbershop with exposed brick, warm hanging bulbs and wooden shelves, two tattooed barbers cut their hair, the friends fist-bump and laugh. Plain black capes.

## Native-speaker check (es-PE, Opus)
Every line above was put through the three questions (understandable / would a Peruvian say it / is the combination used). Kept on purpose: "hoy toca", "con sus cremas", "calientito", "engreído", "sanito", "un pata", "parejito", "no hagas cola". Rejected while drafting: "el pollo de tu barrio" (slogan nobody says), "va de regalo" (sounds translated for a chequeo), "su corte sale a mitad" (unclear whose cut).
