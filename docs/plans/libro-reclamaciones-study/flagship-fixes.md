# Flagship fixes (Jan's review 2026-11-27): exact es-PE strings + build notes

Page: `blog/libro-de-reclamaciones-virtual-estudio-lima.html`. Spanish below is final (written by opus). Do not reword. Any new visible string not listed here goes in as `TODO-ES: <english meaning>`.

## 1. Title
`<title>`, og:title, twitter:title, JSON-LD headline (if it uses the title): **Libro de reclamaciones virtual: revisamos 2 399 webs de Lima** (60 chars; nbsp in the number in HTML).

## 2. Hero photo
Copy the `post-hero__grid` pattern from `blog/estudio-web-negocios-lima-2026.html` (image column next to the H1, `<link rel="preload" as="image">`, width/height, `fetchpriority="high"`, not lazy). File: `/images/blog/libro-reclamaciones-hero.webp` (alt text: see `hero-alt.txt` next to this file, written after the photo is chosen). Add to JSON-LD `image` (as ImageObject with width/height, alongside the OG image).

## 3. Method line inside "Resumen en 30 segundos" (last item, as a `<p class="takeaways__method">` after the `<ul>`)
Cómo lo medimos: en noviembre de 2026 revisamos de forma automática la página de inicio de 2 399 webs propias de negocios independientes de 10 distritos de Lima y comprobamos a mano una muestra de 50.

## 4. Answer-first paragraphs
Under `<h2 id="mi-web-necesita-...">`, replace the paragraph "Respuesta corta: si tu web ofrece productos o servicios, asume que sí." with:
Si tu web vende en línea, sí: la Ley 32495 lo exige a toda plataforma de comercio electrónico. Si solo presenta tus servicios, la ley no lo dice con todas sus letras, pero Indecopi multó en 2022 a una web informativa y en 2026 la Sala dijo que las webs que promocionan productos o servicios también deben tenerlo. Lo prudente es ponerlo.

Under `<h2 id="cuanto-es-la-multa-...">`, insert before the existing first paragraph:
No hay un monto fijo: Indecopi decide cada multa según el caso, dentro de los topes que pone el Código.

At the end of that H2 section (after "...no encontró nada."), add:
Explicamos la escala completa, con los montos en soles y una calculadora, en la guía sobre la <a href="/blog/multa-por-no-tener-libro-de-reclamaciones">multa por no tener libro de reclamaciones</a>.

At the end of "1. La herramienta gratuita de Indecopi" (after "...puede bastar."), add:
En otra guía revisamos <a href="/blog/libro-de-reclamaciones-virtual-gratis-indecopi">qué hace el libro virtual gratis de Indecopi y cómo completar lo que le falta</a>.

## 5. Internal links
In "3. Una web de MontaWeb...", replace the paragraph with:
Todas las <a href="/diseño-de-paginas-web">webs que hacemos en MontaWeb</a>, incluidas las <a href="/tiendas-virtuales">tiendas virtuales</a>, salen con el enlace al libro de reclamaciones en el pie de página y el aviso en la página de inicio.
(use the same encoded href as the footer: `/dise%C3%B1o-de-paginas-web`)

Add both support pages to "Sigue explorando" (first two items):
- Multa por no tener libro de reclamaciones · small: Cuánto es en soles y casos reales
- Libro de reclamaciones virtual gratis · small: Qué hace la herramienta de Indecopi

## 6. First in-text mention links (target="_blank" rel="noopener")
- "Código de Protección y Defensa del Consumidor (Ley 29571)" (first bullet in the "¿Mi web necesita...?" section) → https://diariooficial.elperuano.pe/Normas/obtenerDocumento?idNorma=17
- "Reglamento del Libro de Reclamaciones" (second bullet) → https://www.inei.gob.pe/media/libro_reclamaciones/DS011_2011_PCM.pdf
- "La Ley 32495" (third bullet) → https://busquedas.elperuano.pe/dispositivo/NL/2457203-1
- "Resolución 0226-2022/SPC-INDECOPI" → https://img.lpderecho.pe/wp-content/uploads/2024/11/Resolucion-0226-2022-SPC-Indecopi-LPDerecho.pdf
- "Gestión informó" → https://gestion.pe/economia/caso-yape-libro-de-reclamaciones-virtual-ahora-podria-ser-necesario-en-este-tipo-de-webs-noticia/
- "RM 244-2026-PCM" (table) → https://busquedas.elperuano.pe/dispositivo/NL/2536260-1
- "la UIT de 2026 (S/ 5 500)" → https://busquedas.elperuano.pe/dispositivo/NL/2469116-1
- "Un colegio de Huancayo" → Junín PDF; "Al BBVA le pusieron 5 UIT" → Puno PDF (URLs in section 7)
- "Tu Libro de Reclamaciones" (first mention, section 1 of "Cómo poner...") → https://consumidor.indecopi.gob.pe/tulibro/#/

## 7. Fuentes (replace the list; format like the estudio page)
<li><a href="https://diariooficial.elperuano.pe/Normas/obtenerDocumento?idNorma=17">Ley 29571, Código de Protección y Defensa del Consumidor (texto actualizado)</a>, artículos 110, 150 y 151.</li>
<li><a href="https://busquedas.elperuano.pe/dispositivo/NL/2457203-1">Ley 32495, que modifica los artículos 150 y 151 del Código</a>, El Peruano, 11 de noviembre de 2025.</li>
<li><a href="https://www.inei.gob.pe/media/libro_reclamaciones/DS011_2011_PCM.pdf">Reglamento del Libro de Reclamaciones, DS 011-2011-PCM</a> (texto original; tiene modificatorias posteriores).</li>
<li><a href="https://img.lpderecho.pe/wp-content/uploads/2024/11/Resolucion-0226-2022-SPC-Indecopi-LPDerecho.pdf">Resolución 0226-2022/SPC-INDECOPI</a>, 9 de febrero de 2022, publicada por LP Derecho.</li>
<li><a href="https://img.lpderecho.pe/wp-content/uploads/2026/08/Resolucion-Final-206-2026-INDECOPI-JUN-LPDerecho.pdf">Resolución Final 206-2026/INDECOPI-JUN</a>, 15 de mayo de 2026, publicada por LP Derecho.</li>
<li><a href="https://img.lpderecho.pe/wp-content/uploads/2026/08/Resolucion-Final-044-2026CPC-INDECOPI-Puno-LPDerecho.pdf">Resolución Final 044-2026/CPC-INDECOPI-PUN</a>, 21 de mayo de 2026, publicada por LP Derecho.</li>
<li><a href="https://gestion.pe/economia/caso-yape-libro-de-reclamaciones-virtual-ahora-podria-ser-necesario-en-este-tipo-de-webs-noticia/">Gestión: caso Yape, el libro de reclamaciones virtual ahora podría ser necesario en este tipo de webs</a>, 5 de agosto de 2026.</li>
<li><a href="https://busquedas.elperuano.pe/dispositivo/NL/2536260-1">RM 244-2026-PCM, que publica el proyecto de modificación del Reglamento</a>, El Peruano, 18 de julio de 2026.</li>
<li><a href="https://busquedas.elperuano.pe/dispositivo/NL/2469116-1">DS 301-2025-EF, valor de la UIT para 2026</a>, El Peruano, 17 de diciembre de 2025.</li>
<li><a href="https://www.gob.pe/institucion/indecopi/noticias/1296574-los-emprendedores-ya-pueden-generar-su-libro-de-reclamaciones-de-manera-rapida-y-sencilla-sin-costo-alguno">Indecopi: los emprendedores ya pueden generar su libro de reclamaciones sin costo</a>, 24 de noviembre de 2025, y la herramienta <a href="https://consumidor.indecopi.gob.pe/tulibro/#/">Tu Libro de Reclamaciones</a>.</li>
All with target="_blank" rel="noopener".

## 8. New section "Para periodistas y medios" (H2 id="para-medios"), placed after "Cómo hicimos el estudio y qué no mide", before FAQ
P: Puedes citar estas cifras y publicar el gráfico en tu nota, tu blog o tu boletín. Solo te pedimos un enlace a esta página como fuente.

H3 "Cifras para citar" (ul, each a `<blockquote>`-free plain li):
- Solo el 28,7 % de las webs de negocios independientes de Lima muestra en su página de inicio un enlace al libro de reclamaciones virtual: 688 de 2 399, en noviembre de 2026.
- En las webs de presentación, como las de estudios de abogados o contadores, la cifra baja a 18,9 %. En las tiendas online sube a 54,2 %.
- De las tiendas hechas en Shopify, el 71 % tiene el enlace. De las webs hechas en Wix, el 14,8 %.
- Entre los negocios con 5 reseñas o más en Google, el 33,9 % muestra el enlace. Entre los demás, el 19,3 %.
- Los arquitectos (9,4 %) y los estudios contables (11,3 %) son los rubros que menos lo muestran.

H3 "Inserta el gráfico en tu web"
P: Copia este código y pégalo en tu página. El gráfico se muestra con el enlace a la fuente.
`<textarea readonly>` with the embed code, and a button **Copiar código** → after click: **Código copiado** (aria-live).
Embed code (exact):
```
<figure style="margin:0;max-width:720px"><a href="https://montaweb.pe/blog/libro-de-reclamaciones-virtual-estudio-lima"><img src="https://montaweb.pe/images/blog/libro-reclamaciones-grafico.png" width="1200" height="675" style="width:100%;height:auto" alt="Webs de negocios en Lima con enlace al libro de reclamaciones: tiendas online 54,2 %, reservas y pedidos 26,6 %, presentación 18,9 %, total 28,7 %"></a><figcaption>Fuente: <a href="https://montaweb.pe/blog/libro-de-reclamaciones-virtual-estudio-lima">estudio de MontaWeb sobre el libro de reclamaciones virtual en webs de Lima</a> (noviembre de 2026).</figcaption></figure>
```
Show a preview of the PNG above the textarea (lazy, same alt).

Chart PNG `/images/blog/libro-reclamaciones-grafico.png`, 1200×675, site colours, render with headless Chrome from a temp HTML. Texts:
- Title: ¿Cuántas webs de negocios en Lima muestran el libro de reclamaciones?
- Subtitle: Webs con enlace al libro en la página de inicio, por tipo de web
- Bars: Tiendas online 54,2 % · Reservas y pedidos 26,6 % · Presentación 18,9 % · Todas las webs 28,7 %
- Footer: Base: 2 399 webs de negocios independientes de Lima, noviembre de 2026. Fuente: MontaWeb (montaweb.pe)

H3 "Cómo citar este estudio"
P (class="cite"): MontaWeb (Semantika TECH). "Siete de cada diez webs de negocios en Lima no muestran su libro de reclamaciones virtual". Noviembre de 2026. https://montaweb.pe/blog/libro-de-reclamaciones-virtual-estudio-lima

P: ¿Necesitas otro cruce de datos o quieres hablar con nosotros para una nota? Escríbenos a <a href="mailto:hola@montaweb.pe">hola@montaweb.pe</a>.

Add "para-medios" to the TOC automatically (TOC is built from H2s by `data-toc`; check).

## 9. JSON-LD (Article + Dataset already exist; extend, keep valid)
- `dateModified` 2026-11-27 (today), `datePublished` unchanged.
- author: Organization "MontaWeb" with `url`, `logo`, `sameAs` (copy from the estudio page); publisher: Organization "Semantika TECH" or as the estudio page does — match it.
- `speakable`: SpeakableSpecification, cssSelector [".lede", ".takeaways"].
- `citation`: CreativeWork/Legislation list of the Fuentes URLs (Ley 29571, Ley 32495, DS 011-2011-PCM, Res. 0226-2022, Gestión article).
- `isBasedOn`: the Dataset @id.
- Dataset: `variableMeasured` (PropertyValue items: "Webs con enlace al libro de reclamaciones en la página de inicio" unitText "%" value 28.7; same for "tiendas online" 54.2, "reservas y pedidos" 26.6, "presentación" 18.9), `temporalCoverage` "2026-11", `spatialCoverage` Place "Lima, Perú", `measurementTechnique` = the method line from §3, `creator` = MontaWeb, `license` none (do NOT add a download/distribution; we do not offer the raw data).
- BreadcrumbList if missing. FAQPage only if the estudio page already uses it (match).

## 10. Checks
Title ≤60, meta 140–155, JSON parse, all new links open (curl -I or browser), no duplicated/invisible text, 375 px layout (hero image stacks under/over H1 cleanly, textarea does not overflow), `./verify.sh`. Bump `?v=` on any shared css/js touched.

## 11. Fact-check corrections to existing flagship text (2026-11-27)
- LibroDigital paragraph: replace "Cuando el cliente envía su reclamo, le llega la constancia por correo al instante, y a ti te avisa antes de que venza el plazo de 15 días hábiles." with: "Cuando el cliente envía su reclamo, recibe su constancia en PDF al momento, y a ti te avisa antes de que venza el plazo de 15 días hábiles."
- FAQ "¿En cuánto tiempo debo responder un reclamo?": answer becomes "En 15 días hábiles como máximo, sea un reclamo o una queja."
- Section 2 (hero photo) is ON HOLD until Jan picks a photo. Do not add an empty slot.
