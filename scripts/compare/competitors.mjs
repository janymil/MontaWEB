// Every fact on /comparar lives here, with the page it was read from and the date.
// Rules (docs/COMPARATIVA.md, D. Leg. 1044 arts. 8, 11, 12):
//  - Only what the competitor's own page says on the checked date. Anything else is
//    "unlisted" ("No figura en su página"), never "no".
//  - Prices exactly as published, with their tax basis. We never add IGV or convert currency.
//    No foreign-currency amounts anywhere.
//  - No logos, no superlatives, no "más barato / el mejor / ahorras".
//  - `quotes`: text that must appear on the source page (scripts/compare-evidence.mjs checks it).
//    "html:" quotes are matched against the page source (Nubix animates its prices from 0).
//  - MontaWeb's own cells must match servicios.html / terminos.html (test/compare.test.mjs).
// After editing: node scripts/build-compare.mjs && node scripts/compare-evidence.mjs && npm test

export const VERIFIED_ON = '2026-11-25';
export const STALE_AFTER_DAYS = 45;
export const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const PRICES_IN_REVIEW_TEXT = 'Precios en revisión: estamos volviendo a revisar la página de cada proveedor. Mientras tanto, confirma cada precio en su fuente.';

export const CELL_LABEL = {
  yes: 'Incluido',
  extra: 'Pago aparte',
  info: 'Según su página',
  no: 'No',
  unlisted: 'No figura en su página',
};

export const ROWS = [
  { id: 'landing', label: 'Web de una página (landing)' },
  { id: 'web', label: 'Web de varias páginas: su plan más económico' },
  { id: 'store', label: 'Tienda online: su plan más económico' },
  { id: 'tax', label: 'IGV en el precio' },
  { id: 'hosting', label: 'Hosting y dominio al empezar' },
  { id: 'after', label: 'Pagos después de la entrega' },
  { id: 'delivery', label: 'Plazo de entrega' },
  { id: 'owner', label: 'La web y el dominio a tu nombre' },
  { id: 'guarantee', label: 'Garantía publicada' },
];

const S = (id, url, label, checked = VERIFIED_ON) => ({ id, url, label, checked });

// ---------------------------------------------------------------------------
// MontaWeb (sources: /servicios and /terminos on montaweb.pe)
// ---------------------------------------------------------------------------
export const MONTAWEB = {
  name: 'MontaWeb',
  cells: {
    landing: { k: 'info', amount: 50, text: 'Landing Page: S/ 50 pago único. 1 página, hasta 5 bloques, 2 revisiones.', mustAppear: ['S/ 50', 'hasta 5 bloques'] },
    web: { k: 'info', amount: 99, text: 'Web Simple Profesional: S/ 99 pago único, de 1 a 3 páginas. Web Corporativa: S/ 249, hasta 6 páginas y blog.', mustAppear: ['S/ 99', 'S/ 249'] },
    store: { k: 'info', amount: 299, text: 'Tienda Starter: S/ 299 pago único. Hasta 20 productos, carrito con pedidos por WhatsApp y pagos con Yape o Plin.', mustAppear: ['S/ 299', 'Hasta 20 productos'] },
    tax: { k: 'yes', text: 'Precios finales en soles, con el IGV incluido', mustAppear: ['precios finales en soles (PEN), con el IGV incluido'] },
    hosting: { k: 'yes', text: 'Hosting y SSL gratis el primer año, con subdominio (tunegocio.montaweb.pe). Dominio propio aparte: .com S/ 50 o .pe S/ 65 al año.', mustAppear: ['durante el primer año', 'S/ 65'] },
    after: { k: 'info', text: 'Sin mensualidad obligatoria. Si renuevas, hosting y SSL S/ 120 al año. Soporte opcional desde S/ 49 al mes.', mustAppear: ['S/ 120', 'S/ 49'] },
    delivery: { k: 'info', text: 'Landing: 2 a 4 días', mustAppear: ['2 a 4 días'] },
    owner: { k: 'yes', text: 'Cuando pagas el 100 %, la web es tuya. El dominio propio se registra a tu nombre.', mustAppear: ['a tu nombre'] },
    guarantee: { k: 'info', text: 'Si cancelas, te devolvemos lo pagado menos el trabajo ya hecho, según la etapa.', mustAppear: ['te devolvemos lo pagado'] },
  },
};

// ---------------------------------------------------------------------------
// Competitors (alphabetical: the order means nothing)
// ---------------------------------------------------------------------------
export const COMPETITORS = [
  {
    slug: 'bersoft',
    taxShort: 'con IGV',
    name: 'Bersoft',
    legal: 'Bersoft E.I.R.L.',
    sources: [S('bersoft-planes', 'https://bersoft.pe/diseno-de-paginas-web-en-lima/', 'Diseño de páginas web en Lima (planes y preguntas frecuentes)')],
    cardLine: 'Planes desde S/ 300 con IGV, hosting y dominio el primer año.',
    cells: {
      landing: { k: 'unlisted', text: 'No publica un precio de landing', src: 'bersoft-planes' },
      web: { k: 'info', amount: 300, text: 'Paquete Básico: S/ 300 pago único', src: 'bersoft-planes', quotes: ['Paquete Básico — S/300', 'S/300 pago único'] },
      store: { k: 'unlisted', text: 'No publica un precio de tienda', src: 'bersoft-planes' },
      tax: { k: 'yes', text: 'Incluye IGV', src: 'bersoft-planes', quotes: ['nuestros precios públicos ya incluyen el IGV correspondiente'] },
      hosting: { k: 'yes', text: 'Hosting, dominio .com y SSL el primer año', src: 'bersoft-planes', quotes: ['el Hosting SSD, Dominio .com y Certificado SSL por el primer año'] },
      after: { k: 'unlisted', text: 'No publica cuánto cuesta renovar', src: 'bersoft-planes' },
      delivery: { k: 'info', text: 'Paquete Básico: 2 días hábiles en promedio, desde que recibe tu información', src: 'bersoft-planes', quotes: ['El Paquete Básico se entrega en un promedio de 2 días hábiles'] },
      owner: { k: 'yes', text: '«Tú eres el único dueño»', src: 'bersoft-planes', quotes: ['Tú eres el único dueño'] },
      guarantee: { k: 'unlisted', src: 'bersoft-planes' },
    },
    aboutTitle: 'Qué ofrece Bersoft',
    about: [
      'Bersoft es una agencia de Lima que trabaja con WordPress. En su página se presenta con «17 años de experiencia en Perú» y publica tres paquetes de pago único: Básico (S/ 300), Estándar (S/ 450) y Premium (S/ 600), con el IGV incluido.',
      'El primer año incluye hosting, dominio .com y certificado SSL. Lo que se paga desde el segundo año no figura en su página. También ofrece landing pages y tiendas virtuales, pero sin precio publicado.',
    ],
    aboutQuotes: ['17 años de experiencia en Perú', 'S/450 pago único', 'S/600 pago único', 'Diseño de páginas web en Lima', 'en WordPress (y también a medida)', 'Diseño de Tiendas Virtuales', 'Landing Page'],
    chooseThem: { title: 'Te conviene Bersoft si:', items: ['necesitas varias páginas internas desde el primer plan', 'quieres hosting, dominio .com y SSL incluidos el primer año', 'buscas una agencia que trabaje con WordPress'] },
  },
  {
    slug: 'hosting-peru',
    taxShort: 'con IGV',
    name: 'Hosting Perú',
    legal: 'Orange Global Group S.A.C.',
    sources: [S('hostingperu-web', 'https://www.hosting.com.pe/pagina-web/', 'Diseño de páginas web en Perú (planes y precios)')],
    cardLine: 'Web Básica desde S/ 199 con IGV, dominio y hosting incluidos.',
    cells: {
      landing: { k: 'unlisted', text: 'No publica un plan de una sola página', src: 'hostingperu-web' },
      web: { k: 'info', amount: 199, text: 'Web Básica: S/ 199 pago único', src: 'hostingperu-web', quotes: ['S/ 199 00 Pago único'] },
      store: { k: 'info', amount: 1499, text: 'Tienda Virtual: S/ 1,499 pago único', src: 'hostingperu-web', quotes: ['S/ 1499 00 Pago único'] },
      tax: { k: 'yes', text: 'Incluye IGV', src: 'hostingperu-web', quotes: ['Precios incluyen IGV'] },
      hosting: { k: 'yes', text: 'Web Básica: dominio .com 1 año y hosting 1 año', src: 'hostingperu-web', quotes: ['Dominio .com gratis por 1 año Hosting por 1 año'] },
      after: { k: 'unlisted', text: 'No publica cuánto cuesta renovar', src: 'hostingperu-web' },
      delivery: { k: 'info', text: 'Web Básica: 3 a 5 días', src: 'hostingperu-web', quotes: ['Desarrollo en 3 a 5 días'] },
      owner: { k: 'unlisted', src: 'hostingperu-web' },
      guarantee: { k: 'unlisted', src: 'hostingperu-web' },
    },
    aboutTitle: 'Qué ofrece Hosting Perú',
    about: [
      'Hosting Perú (hosting.com.pe) es una marca de Orange Global Group S.A.C., que vende hosting y dominios. Para páginas web publica cuatro planes de pago único con IGV: Web Básica (S/ 199), Web Empresarial (S/ 480), Web Administrable (S/ 980) y Tienda Virtual (S/ 1,499).',
      'Todos sus planes incluyen dominio .com por 1 año y hosting por un periodo que va de 1 a 4 años, según el plan. Lo que cuesta renovar después no figura en su página.',
    ],
    aboutQuotes: ['Orange Global Group S.A.C.', 'S/ 480 00 Pago único', 'S/ 980 00 Pago único', 'hosting (de 1 a 4 años', 'Hosting por 4 años', 'Hasta 4 páginas interiores', 'Correos ilimitados'],
    chooseThem: { title: 'Te conviene Hosting Perú si:', items: ['quieres dominio y hosting incluidos por más de un año en un solo pago (según el plan)', 'necesitas hasta 4 páginas interiores desde el primer plan', 'prefieres contratar web, hosting y correos con la misma empresa'] },
  },
  {
    slug: 'kom',
    taxShort: 'más IGV',
    name: 'KOM',
    legal: 'Otorongo Negro E.I.R.L.',
    sources: [S('kom-precios', 'https://kom.pe/precios/', 'Precios de KOM Agencia Digital')],
    cardLine: 'Landing desde S/ 950 + IGV, primer año de hosting y dominio incluido.',
    cells: {
      landing: { k: 'info', amount: 950, text: 'Landing Profesional: S/ 950', src: 'kom-precios', quotes: ['Landing Pages (desde S/ 950 + IGV)'] },
      web: { k: 'info', amount: 1250, text: 'Web Profesional: S/ 1,250', src: 'kom-precios', quotes: ['Páginas Web (desde S/ 1,250 + IGV)'] },
      store: { k: 'info', amount: 1950, text: 'Tienda virtual Profesional: S/ 1,950', src: 'kom-precios', quotes: ['Planes de diseño de tiendas virtuales en Perú', 'Profesional S/ 1950'] },
      tax: { k: 'extra', text: 'Más IGV', src: 'kom-precios', quotes: ['Los precios no incluyen I.G.V.'] },
      hosting: { k: 'yes', text: 'Primer año gratis: hosting, dominio .com, 5 correos y SSL', src: 'kom-precios', quotes: ['Te brindamos el primer año GRATIS de Hosting, Dominio .COM, 5 Correos y SSL'] },
      after: { k: 'extra', text: 'Desde el segundo año, renovación de S/ 350 + IGV (landing), S/ 450 + IGV (web) o S/ 750 + IGV (tienda) al año', src: 'kom-precios', quotes: ['la renovación de servicios cloud es de S/ 450 + IGV', 'S/ 750 + IGV para tiendas', 'S/ 350 + IGV'] },
      delivery: { k: 'info', text: 'Landing: 5 días', src: 'kom-precios', quotes: ['¡Lanza tu web en 5 días!'] },
      owner: { k: 'yes', text: '«Propiedad total del cliente»', src: 'kom-precios', quotes: ['propiedad total del cliente'] },
      guarantee: { k: 'info', text: '30 días de garantía', src: 'kom-precios', quotes: ['30 días de garantía'] },
    },
    aboutTitle: 'Qué ofrece KOM',
    about: [
      'KOM Agencia Digital es la marca de Otorongo Negro E.I.R.L. Publica tres planes (Profesional, Empresarial y Corporativo) para landing pages, páginas web, catálogos y tiendas virtuales. Sus precios no incluyen IGV.',
      'Todos los planes incluyen el primer año de hosting, dominio .com, correos y SSL. Desde el segundo año se paga una renovación anual que depende del tipo de web. En su página dice que más de 950 empresas la han elegido.',
    ],
    aboutQuotes: ['Más de 950 empresas han elegido KOM', 'convertirlo en tienda después por solo S/ 550 + IGV', 'Profesional 1.1.2. Empresarial 1.1.3. Corporativo', 'Planes de diseño de catálogos virtuales', 'Dominio .COM, 5 Correos y SSL', 'Renovación Anual'],
    chooseThem: { title: 'Te conviene KOM si:', items: ['quieres el primer año de hosting, dominio .com, 5 correos y SSL incluido', 'te interesa su garantía de 30 días', 'quieres sumar después una pasarela de pago con Izipay (S/ 550 + IGV, según su página)'] },
  },
  {
    slug: 'kozma-360',
    taxShort: 'con IGV',
    name: 'Kozma 360',
    legal: null,
    sources: [S('kozma-web', 'https://kozma360.com/creacion-de-paginas-web-en-lima/', 'Diseño de páginas web en Lima (paquetes)')],
    cardLine: 'Landing desde S/ 499 con IGV; hosting y dominio aparte en ese plan.',
    cells: {
      landing: { k: 'info', amount: 499, text: 'Landing Page: S/ 499 pago único', src: 'kozma-web', quotes: ['S/499 pago único · IGV incluido'] },
      web: { k: 'info', amount: 899, text: 'Web Profesional: S/ 899 pago único, hasta 8 páginas', src: 'kozma-web', quotes: ['S/899 pago único · IGV incluido', 'S/899 por una web profesional de hasta 8 páginas'] },
      store: { k: 'info', amount: 1399, text: 'Tienda Online: S/ 1,399 pago único', src: 'kozma-web', quotes: ['S/1,399 pago único · IGV incluido'] },
      tax: { k: 'yes', text: 'Incluye IGV', src: 'kozma-web', quotes: ['IGV incluido'] },
      hosting: { k: 'info', text: 'Landing: hosting y dominio aparte (S/ 250 al año). Web y Tienda: hosting y dominio .com gratis 1 año', src: 'kozma-web', quotes: ['En el plan Landing, el hosting + dominio se contrata aparte por S/250/año', 'GRATIS por 1 año en los planes Pro y Tienda'] },
      after: { k: 'extra', text: 'Hosting y dominio S/ 250 al año. Mantenimiento opcional: S/ 99 o S/ 149 al mes', src: 'kozma-web', quotes: ['se renueva cada año (S/250/año)', 'S/99 /mes', 'S/149 /mes'] },
      delivery: { k: 'info', text: 'Landing: 5 días', src: 'kozma-web', quotes: ['Entrega en 5 días GARANTIZADA'] },
      owner: { k: 'yes', text: '«La web, el dominio y las cuentas son 100% tuyas»', src: 'kozma-web', quotes: ['La web, el dominio y las cuentas son 100% tuyas'] },
      guarantee: { k: 'info', text: '15 días: modificaciones necesarias sin costo', src: 'kozma-web', quotes: ['Garantía de Satisfacción: 15 Días', 'modificaciones necesarias sin costo adicional durante 15 días'] },
    },
    aboutTitle: 'Qué ofrece Kozma 360',
    about: [
      'Kozma 360 es una agencia de marketing digital de Lima que hace webs en WordPress. Publica tres paquetes de pago único con IGV incluido: Landing Page (S/ 499), Web Profesional (S/ 899) y Tienda Online (S/ 1,399).',
      'En el plan Landing, el hosting y el dominio se contratan aparte por S/ 250 al año. En Web Profesional y Tienda Online vienen gratis el primer año y luego se renuevan por S/ 250 al año. Tiene una garantía de 15 días para modificaciones sin costo.',
    ],
    aboutQuotes: ['Landing S/499 Web Pro S/899 Tienda S/1,399', 'Landing a medida en WordPress + Elementor', 'Asesoría de Marketing Digital', 'Desde 2019 · Lima, Perú', 'Hosting + dominio: S/250/año', 'Hosting + dominio 1 año GRATIS', 'Al renovar tu hosting (S/250/año)', 'Tienda WooCommerce con carrito', 'Mantenimiento opcional'],
    chooseThem: { title: 'Te conviene Kozma 360 si:', items: ['quieres trabajar con WordPress y WooCommerce', 'valoras su garantía de 15 días para modificaciones sin costo', 'te sirve un mantenimiento mensual opcional con la misma agencia'] },
  },
  {
    slug: 'nubix',
    taxShort: 'su página no indica si incluye IGV',
    name: 'Nubix',
    legal: null,
    sources: [S('nubix-planes', 'https://nubix.pe/#planes', 'Página de inicio de Nubix, sección Planes')],
    cardLine: 'Landing desde S/ 199 más mantenimiento mensual, entrega en 48 horas.',
    cells: {
      landing: { k: 'info', amount: 199, text: 'Inicio: S/ 199 pago único, más mantenimiento de S/ 79 al mes', src: 'nubix-planes', quotes: ['html:data-count="199"', '1 página (landing)', 'Mantenimiento S/ 79/mes'] },
      web: { k: 'info', amount: 399, text: 'Negocio: S/ 399 pago único (5 páginas), más mantenimiento de S/ 129 al mes', src: 'nubix-planes', quotes: ['html:data-count="399"', '5 páginas', 'Mantenimiento S/ 129/mes'] },
      store: { k: 'unlisted', text: 'No publica un plan de tienda', src: 'nubix-planes' },
      tax: { k: 'unlisted', text: 'No indica si incluye IGV', src: 'nubix-planes' },
      hosting: { k: 'info', text: 'Hosting y dominio incluidos en el mantenimiento mensual', src: 'nubix-planes', quotes: ['Hosting, dominio y soporte incluidos'] },
      after: { k: 'extra', text: 'Mantenimiento desde S/ 79 al mes', src: 'nubix-planes', quotes: ['Mantenimiento S/ 79/mes'] },
      delivery: { k: 'info', text: '48 horas desde que recibe tus textos, fotos y logo', src: 'nubix-planes', quotes: ['contadas desde que recibimos tu información'] },
      owner: { k: 'info', text: 'El dominio es transferible; pasarlo a tu nombre cuesta S/ 99 único', src: 'nubix-planes', quotes: ['lo transferimos por S/ 99 único'] },
      guarantee: { k: 'info', text: 'Si no está lista en 48 horas, devuelve tu dinero', src: 'nubix-planes', quotes: ['Si en 48 horas no está lista, te devolvemos tu dinero'] },
    },
    aboutTitle: 'Qué ofrece Nubix',
    about: [
      'Nubix hace webs en Lima con entrega en 48 horas, contadas desde que recibe tus textos, fotos y logo. Si no la entrega en ese plazo, su página dice que devuelve tu dinero.',
      'Cobra un pago único por el diseño (Inicio S/ 199, Negocio S/ 399, Pro S/ 899) y un mantenimiento mensual que incluye hosting, dominio y soporte: S/ 79, S/ 129 o S/ 179 al mes, según el plan. Si quieres el dominio a tu nombre, lo transfiere por S/ 99. Su página no indica si los precios incluyen IGV.',
    ],
    aboutQuotes: ['html:data-count="899"', 'Mantenimiento S/ 179/mes', 'textos, fotos y logo', 'Un equipo pequeño de Lima'],
    chooseThem: { title: 'Te conviene Nubix si:', items: ['necesitas la web en 48 horas', 'prefieres pagar una mensualidad que incluya hosting, dominio y soporte'] },
  },
  {
    slug: 'talentuperu',
    taxShort: 'su página de webs no indica si incluye IGV',
    name: 'TalentuPeru',
    legal: null,
    sources: [
      S('talentu-web', 'https://talentuperu.com/diseno-paginas-web-lima/', 'Diseño de páginas web en Lima (planes)'),
      S('talentu-tienda', 'https://talentuperu.com/tiendas-virtuales-lima/', 'Tiendas virtuales en Lima (planes)'),
    ],
    cardLine: 'Landing desde S/ 375 con hosting y dominio; tiendas desde S/ 1,250 + IGV.',
    cells: {
      landing: { k: 'info', amount: 375, text: 'Plan Inicio: S/ 375, precio único', src: 'talentu-web', quotes: ['Web Landing Page Plan Inicio S/ 375 Precio único'] },
      web: { k: 'info', amount: 675, text: 'Plan Presencia: S/ 675, precio único (7 páginas internas)', src: 'talentu-web', quotes: ['S/ 675 Precio único 7 Páginas internas'] },
      store: { k: 'info', amount: 1250, text: 'Plan Emprendedor: S/ 1,250, precio único', src: 'talentu-tienda', quotes: ['S/ 1250 Precio único'] },
      tax: { k: 'info', text: 'Tiendas: no incluyen IGV. En los planes de web no lo indica', src: 'talentu-tienda', quotes: ['Los precios no incluyen I.G.V.'] },
      hosting: { k: 'yes', text: 'Plan Inicio: hosting, dominio .com y SSL', src: 'talentu-web', quotes: ['Hosting, Dominio .com y SSL'] },
      after: { k: 'unlisted', text: 'No publica cuánto cuesta renovar', src: 'talentu-web' },
      delivery: { k: 'info', text: 'Plan Inicio: 3 días', src: 'talentu-web', quotes: ['Entrega en 3 días!'] },
      owner: { k: 'unlisted', src: 'talentu-web' },
      guarantee: { k: 'unlisted', src: 'talentu-web' },
    },
    aboutTitle: 'Qué ofrece TalentuPeru',
    about: [
      'TalentuPeru es una agencia de Lima que publica planes de páginas web y de tiendas virtuales. Para webs: Plan Inicio (S/ 375, una página), Plan Presencia (S/ 675, 7 páginas internas en WordPress) y planes mayores desde S/ 950.',
      'Sus tiendas empiezan en S/ 1,250 (Plan Emprendedor), y esa página aclara que los precios no incluyen IGV. En los planes de web no dice si el IGV está incluido, ni cuánto cuesta renovar el hosting y el dominio.',
    ],
    aboutQuotes: ['Plan Crecimiento S/ 950', 'Diseño de Páginas Web en Lima', '7 Páginas internas', 'Desarrollo en WordPress'],
    chooseThem: { title: 'Te conviene TalentuPeru si:', items: ['quieres una web en WordPress con 7 páginas internas', 'buscas una landing que ya incluya hosting, dominio .com y SSL'] },
  },
];

// Shared copy -----------------------------------------------------------------

const range = key => {
  const xs = [MONTAWEB, ...COMPETITORS].map(c => c.cells[key]?.amount).filter(n => typeof n === 'number');
  return [Math.min(...xs), Math.max(...xs)];
};
const soles = n => `S/ ${n.toLocaleString('en-US')}`;
const [l0, l1] = range('landing');
const [t0, t1] = range('store');

export const TRADEMARK_NOTE = `${COMPETITORS.map(c => c.name).join(', ')} son marcas de sus respectivos dueños. MontaWeb no está vinculada a ninguna de ellas. Solo comparamos lo que cada empresa publica en su propia página, en la fecha indicada.`;
export const CORRECTION_TEXT = '¿Ves un dato que cambió o que no es correcto? Escríbenos y lo corregimos.';

export const CTA = {
  title: '¿Quieres saber cuánto costaría tu web?',
  text: 'Cuéntanos por WhatsApp qué necesitas. Te respondemos con el plan, el plazo y el precio final por escrito, antes de que pagues nada.',
  button: 'Escribir por WhatsApp',
  href: 'https://wa.me/51965403196?text=Hola%20MontaWeb,%20vi%20la%20comparaci%C3%B3n%20de%20precios%20y%20quiero%20cotizar%20mi%20web',
};

export const CHOOSE_MW = {
  title: 'Te conviene MontaWeb si:',
  items: [
    'quieres empezar con poco: landing desde S/ 50 o tienda con Yape y Plin desde S/ 299',
    'prefieres pagar una sola vez, sin mensualidad obligatoria',
    'te basta un subdominio gratis al inicio y quieres decidir después si compras dominio propio',
  ],
};

export const HUB = {
  title: 'Precio de una página web en Lima: MontaWeb y 6 proveedores (2026)',
  description: `Compara lo que cobran MontaWeb, Bersoft, Hosting Perú, KOM, Kozma 360, Nubix y TalentuPeru por una web o tienda online: precio, IGV, hosting, plazos y renovación.`,
  h1: 'Compara antes de elegir',
  lead: 'Juntamos en una tabla lo que cobra MontaWeb y lo que publican seis proveedores de páginas web en Lima: precio, IGV, hosting, dominio, plazo de entrega y lo que pagas después. Cada dato sale de la página de cada empresa, con enlace y fecha.',
  tableTitle: 'Todo en una tabla',
  caption: 'Precios y condiciones que publican MontaWeb y seis proveedores de Lima',
  cardsTitle: 'Comparaciones una por una',
  howTitle: 'Cómo armamos esta comparación',
  how: [
    'Solo usamos lo que cada empresa publica en su propia web. Copiamos los precios tal como aparecen, anotamos la fecha en que los revisamos y guardamos una captura de cada página.',
    'Si un dato no aparece en su página, lo marcamos como «No figura en su página». Eso no quiere decir que no lo ofrezcan: pregúntales directamente.',
    'Elegimos proveedores de Lima que publican sus precios en soles. Dejamos fuera a quienes solo dan precio por cotización, porque no hay un número que comparar.',
    'Los planes no son iguales entre sí: cambian el número de páginas, las revisiones, el hosting y lo que se paga después. Por eso mostramos el detalle y no solo el precio.',
  ],
  diyTitle: '¿Y si la armo yo mismo con Wix o Shopify?',
  diy: [
    'También puedes hacer tu web con plataformas como Wix, Hostinger o Shopify: pagas una suscripción y tú mismo armas la página con sus plantillas. Es otro tipo de servicio, porque el trabajo lo haces tú, así que no los ponemos en la misma tabla que las agencias.',
    'Es buena opción si te gusta aprender y tienes tiempo para hacerlo. Si prefieres que alguien la haga por ti y te la entregue lista, compara las opciones de arriba.',
  ],
  faq: [
    { q: '¿Cuánto cuesta una página web en Lima?', a: `Según las páginas que revisamos, una web de una sola página (landing) cuesta entre ${soles(l0)} y ${soles(l1)}, y el primer plan de tienda online, entre ${soles(t0)} y ${soles(t1)}. Algunos precios incluyen IGV y otros no, y no todos incluyen hosting y dominio. Revisa la tabla para ver el detalle de cada proveedor.` },
    { q: '¿El precio incluye hosting y dominio?', a: 'Depende del proveedor. Varios incluyen hosting y dominio el primer año y luego cobran una renovación anual; otros los cobran en una mensualidad o aparte. En MontaWeb, el hosting y el SSL son gratis el primer año con un subdominio (tunegocio.montaweb.pe), y el dominio propio cuesta S/ 50 (.com) o S/ 65 (.pe) al año.' },
    { q: '¿Cómo puede MontaWeb publicar precios desde S/ 50?', a: 'Trabajamos con planes cerrados: cada uno tiene un alcance fijo (páginas, revisiones y plazo) que confirmamos por escrito antes de empezar. Si tu proyecto necesita más, te decimos el precio del extra antes de hacerlo.' },
    { q: '¿Qué pago después de que me entregan la web?', a: 'En MontaWeb no hay mensualidad obligatoria. Desde el segundo año, el hosting con SSL cuesta S/ 120 al año si decides renovarlo, y el soporte mensual es opcional, desde S/ 49. En otros proveedores cambia mucho: mira la fila «Pagos después de la entrega».' },
    { q: '¿Cada cuánto actualizan esta comparación?', a: 'Revisamos todas las fuentes una vez al mes y cada vez que alguien nos avisa de un cambio. La fecha de la última revisión aparece encima de cada tabla. Si ves un dato distinto en la página de un proveedor, vale lo que diga su página.' },
  ],
};

for (const c of COMPETITORS) {
  const cheapest = ['landing', 'web', 'store'].map(k => c.cells[k]).find(x => typeof x.amount === 'number');
  c.title = `MontaWeb vs ${c.name}: precios de página web en Lima (2026)`;
  c.description = `Compara MontaWeb y ${c.name}: precio de landing, web y tienda online, IGV, hosting, dominio, plazo de entrega y renovación. Datos de su página, con fecha.`;
  c.lead = `${c.name} y MontaWeb hacen páginas web para negocios de Lima. Aquí puedes comparar lo que cada uno publica: precios, IGV, hosting, plazos y lo que pagas después de la entrega.`;
  c.faq = [
    { q: `¿Cuánto cuesta una página web con ${c.name}?`, a: `Su plan más económico publicado cuesta ${soles(cheapest.amount)} (${c.taxShort}). ${c.cells.after.k === 'unlisted' ? 'Lo que se paga después de la entrega no figura en su página.' : `Después de la entrega: ${c.cells.after.text.charAt(0).toLowerCase()}${c.cells.after.text.slice(1)}.`}` },
    { q: `¿${c.name} incluye hosting y dominio?`, a: `${c.cells.hosting.text}, según su página. En MontaWeb, el hosting y el SSL son gratis el primer año con un subdominio, y el dominio propio se paga aparte (.com S/ 50 o .pe S/ 65 al año).` },
    { q: `¿Dónde veo los precios de ${c.name}?`, a: `En su propia página: ${c.sources[0].url}. La revisamos el ${(([y, m, d]) => `${+d} de ${MONTHS_ES[+m - 1]} de ${y}`)(c.sources[0].checked.split('-'))}. Si ves algo distinto, vale lo que diga su página.` },
  ];
}
