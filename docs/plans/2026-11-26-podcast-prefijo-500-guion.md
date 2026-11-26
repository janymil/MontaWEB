# Radio script: prefijo 500 guide (es-PE), MontaWeb Radio

For: blog/prefijo-500-llamadas-comerciales.html. Rendered with ElevenLabs Text to Dialogue (eleven_v3), mixed by `scripts/podcast/generate-radio.mjs`.
Voices: DANIELA = VywzfvxxNk4yFAaoMm4Q, JAIR = I9uZPOVoQkQEhHPStmJz (same as the Lima study).
Facts: only those in the published article (`docs/research/2026-11-26-prefijo-500-llamadas-comerciales.md`).
Status: approved by Jan 2026-11-26. Target length ~5.5 min (show) + 30 s standalone spot.

## Cue grammar (for the mixer)
- `[SWEEPER: id | spoken text | music]` station ID: voice over a short music logo, processed (light reverb).
- `[JINGLE: id | description, ~Ns]` music-only sting; the next line may start over its tail.
- `[BED: id | description]` music loop under the dialogue from here until the next `[BED: …]` or `[BED: off]`, about −20 dB, ducked by the voice (sidechain).
- `[STINGER: id | description]` short transition (1–2 s), placed between segments.
- `[SFX: id | description | at]` overlaid, not appended. `at` = `before` (ends where the next line starts), `under` (starts with the next line), or `after` (starts right after the previous line, may overlap the next line).
- `[SPOT]` inserts the spot section below.
- `NAME [PHONE]:` the line goes through a telephone filter (band-pass ~300–3400 Hz, light distortion). Render these lines separately.
- `[pause 2s]` silence (room tone only).
- Tags in lowercase [brackets] inside a line are v3 audio tags (not spoken).

---

## Show

### 1. Cold open
[SFX: ring | mobile phone ringing, plain default ringtone, 2 rings | before]

DANIELA: ¿Aló?
[pause 2s]
[SFX: callcenter | faint call-center murmur behind the phone voice | under]
JAIR [PHONE]: [fast, scripted] Buenas tardes, le saluda Ricardo, del área de beneficios. Usted tiene una tarjeta de crédito preaprobada, y solo por hoy…
DANIELA: [flat] No, gracias.
[SFX: hangup | phone hang-up click + 1 s busy tone | after]

### 2. Station ID and intro
[SWEEPER: id-open | JAIR: "MontaWeb Radio." | bright radio logo with a riser, ~4 s]
[JINGLE: intro | upbeat Latin pop jingle, guitars and percussion, ~6 s, tail under the first line]
[BED: bed-a | light, warm acoustic guitar and soft percussion loop, no vocals, ~100 bpm]

DANIELA: [laughs] ¿A quién no le ha pasado? Contestas, hay un silencio y te ofrecen una tarjeta que nunca pediste.
JAIR: Y siempre justo cuando estás almorzando.
DANIELA: Bienvenidos a MontaWeb Radio. Yo soy Daniela.
JAIR: Y yo soy Jair. Hoy hablamos de algo que llega en marzo: el prefijo quinientos.
DANIELA: A ver, explícamelo fácil. ¿Qué es eso del quinientos?
JAIR: Desde marzo de dos mil veintisiete, las empresas que te llamen o te manden un SMS para venderte algo van a tener que hacerlo desde un número que empieza con quinientos.
DANIELA: O sea, te suena el celular, ves el quinientos…
JAIR: …y ya sabes que es una venta antes de contestar. Tú decides si contestas.
DANIELA: [relieved] Por fin.
JAIR: Lo dispone un decreto supremo del Ministerio de Transportes y Comunicaciones, el cero dieciocho, que salió el quince de septiembre. Son números de nueve cifras: quinientos y seis dígitos más.
DANIELA: ¿Y vale para todo? ¿Fijos, celulares?
JAIR: Fijos y celulares, llamadas y mensajes de texto. Y también cuenta cuando llama un call center en nombre de otra empresa.
DANIELA: ¿Y WhatsApp?
JAIR: La norma no menciona WhatsApp. Habla solo de llamadas y SMS.
DANIELA: ¿Y si me llaman para confirmar mi cita con el dentista? ¿Eso también sale con quinientos?
JAIR: No. Si la llamada solo informa, como una cita o el aviso de que tu pedido ya está en camino, puede seguir saliendo de un número común.
DANIELA: Pero si en esa misma llamada me ofrecen algo…
JAIR: [laughs] Ahí ya es venta. Y tiene que salir con quinientos.

[STINGER: st-1 | short whoosh with a two-note synth hit]
[BED: bed-b | same style as bed-a, slightly darker, piano added]

### 3. The 500 is not a permission
DANIELA: Ahora, Jair, ¿por qué recién en marzo? Si la norma ya salió.
JAIR: Porque las operadoras tienen un plazo para adaptar sus redes y asignar los números. Ciento ochenta días, como máximo. Vence el quince de marzo de dos mil veintisiete.
DANIELA: Y esto viene de antes, ¿no? Yo me acuerdo de una ley contra el spam.
JAIR: La Ley treinta y dos mil trescientos veintitrés, de mayo de dos mil veinticinco. Y aquí viene lo importante.
DANIELA: A ver.
JAIR: El quinientos no te da permiso para llamar. Solo identifica la llamada.
DANIELA: [surprised] ¿O sea que la empresa no saca su quinientos y ya puede llamar a quien quiera?
JAIR: No. Desde esa ley, para llamarte o escribirte con publicidad, la empresa necesita que tú hayas aceptado antes, de forma expresa.
DANIELA: ¿Y la clásica primera llamada? «Hola, ¿le puedo contar de una promoción?».
JAIR: Eso ya no vale. El permiso se pide antes, y por otro medio.
DANIELA: ¿Y si ya soy cliente? Si le compré algo a esa tienda una vez.
JAIR: Tampoco. Haberle comprado una vez no es aceptar publicidad.
DANIELA: ¿Y las bases de datos que venden por ahí?
JAIR: [laughs] Esas no traen el permiso de nadie. La hayas comprado o armado con números sacados de internet, da lo mismo.

[STINGER: st-2 | same family as st-1, different hit]

### 4. Fines
DANIELA: ¿Y quién controla todo esto? Porque a mí me llaman así todas las semanas.
JAIR: El Indecopi, y ya está multando. Al BBVA le puso más de un millón y medio de soles en enero, en primera instancia. El banco apeló.
[SFX: register | cash register "ka-ching", short | after]
DANIELA: [gasps] ¿Un millón y medio?
JAIR: A Interbank, más de cuatrocientos mil, en agosto. Y a Pacífico Seguros, ciento dieciocho mil soles. Esa ya quedó confirmada en segunda instancia.
DANIELA: ¿Y hasta cuánto puede llegar una multa?
JAIR: Hasta cuatrocientas cincuenta UIT. Casi dos millones y medio de soles.
DANIELA: Ya, pero esos son bancos. ¿A un negocio chico también le toca?
JAIR: Sí. Si llamas para ofrecer un plan, una clase de prueba o una promoción, esto también va contigo.
DANIELA: Nos vamos a una pausa. Y tranquilos, que nadie los va a llamar.
JAIR: [laughs] Jajaja.

[BED: off]
[JINGLE: break-out | MontaWeb Radio logo, short, ~3 s]
[SPOT]
[SWEEPER: id-back | DANIELA: "Seguimos en MontaWeb Radio." | same logo as id-open, ~3 s]
[BED: bed-a]

### 5. What to do before March
DANIELA: Jair, si yo tengo un negocio y vendo por teléfono, ¿qué hago antes de marzo?
JAIR: Primero, separa lo que informa de lo que vende. Recordar una cita no necesita el quinientos. Ofrecer algo, sí.
DANIELA: Ya.
JAIR: Después, consigue el permiso antes y por escrito. Una casilla en tu web, un formulario o un mensaje donde el cliente acepta recibir ofertas.
DANIELA: Y la casilla sin marcar, ¿no? Que no venga marcadita.
JAIR: [laughs] Sin marcar. Y guarda la prueba: la fecha, el canal y el texto exacto que aceptó cada persona.
DANIELA: Porque eso es lo que te va a pedir el Indecopi.
JAIR: Exacto. Y pide tu número quinientos a tu operadora para las llamadas de venta. Nada de vender desde celulares personales.
DANIELA: ¿Y si alguien me dice que ya no quiere?
JAIR: Lo sacas de tu lista ese mismo día.

[STINGER: st-3 | same family, rising]

### 6. Selling without calling
DANIELA: Ahora, la pregunta incómoda.
JAIR: [laughs] A ver.
DANIELA: Si la gente ve el quinientos y ya sabe que es una venta… va a contestar menos, ¿no?
JAIR: Seguramente. Cuántos menos, todavía nadie lo sabe. En la guía hay una calculadora para que pruebes con las cifras de tu negocio.
DANIELA: ¿Y entonces cómo vendes?
JAIR: Haciendo que el cliente dé el primer paso. Si alguien te escribe por WhatsApp, llena el formulario de tu web o te llama porque te vio en Google Maps, eso no es spam.
DANIELA: Es alguien que ya está interesado.
JAIR: Y si tu formulario tiene la casilla para aceptar ofertas, cada contacto te llega con su permiso registrado.
DANIELA: Que es justo lo que pide la ley.

[STINGER: st-4 | same family as st-1]

### 7. Close
DANIELA: Y si a ti te siguen llamando sin permiso, puedes reclamar en línea en el Indecopi. Tienen una opción para llamadas de publicidad no autorizadas.
JAIR: Anota la fecha, la hora, el número y qué empresa te llamó.
DANIELA: La guía completa, con la calculadora y las fuentes, está en el blog de montaweb punto pe.
JAIR: Gracias por escucharnos.
DANIELA: [excited] ¡Hasta la próxima!

[BED: off]
[SWEEPER: id-close | JAIR: "MontaWeb Radio." | intro jingle reprise, ~5 s, fade out]

---

## Spot (~25 s inside the show; the standalone file is the same spot on its own bed, ~30 s)
[BED: bed-spot | short upbeat commercial bed, brighter than the show beds]

[SFX: ring2 | old landline ringing, 1 ring, cut | before]
JAIR: [tired, sighs] Cuarenta llamadas hoy. Me contestaron tres.
[SFX: ping | short message notification ping, generic | after]
DANIELA: ¿Y si en vez de llamar tú, el cliente te escribe a ti?
DANIELA: En MontaWeb te hacemos tu web con botón de WhatsApp y un formulario con casilla de permiso. El cliente te encuentra en Google, te escribe, y su permiso queda registrado.
[SFX: ping-multi | three message pings in a row | before]
JAIR: [pleasantly surprised] Oye… me están escribiendo.
DANIELA: Webs desde noventa y nueve soles, pago único, con el primer año de hosting incluido. MontaWeb punto pe.
JAIR: Que el cliente te escriba primero.
[BED: off]
