// Every fact on /comparar lives here, with the page it was read from and the date.
// Rules (docs/COMPARATIVA.md, D. Leg. 1044 arts. 8, 11, 12):
//  - Only what the competitor's own page says on the checked date. Anything else is
//    "unlisted" ("No figura en su página"), never "no".
//  - Prices exactly as published, with their tax basis. We never add IGV or convert currency.
//    No foreign-currency amounts anywhere.
//  - No logos, no superlatives, no "más barato / el mejor / ahorras", and we never repeat a
//    competitor's claims about itself (years in business, number of clients, reviews).
//  - `quotes`: text that must appear on the source page (scripts/compare-evidence.mjs checks it).
//    "html:" quotes are matched against the page source (e.g. read-only form values).
//  - MontaWeb's own cells must match servicios.html / terminos.html (test/compare.test.mjs).
//  - Two page kinds: price comparisons (ROWS, soles prices) and `kind: 'facts'` pages for
//    platforms that show no soles price in Peru (FACT_ROWS, no amounts at all). A facts page may
//    carry a `builders` list; each item points at a cell (`b-*`) so its quotes are checked too.
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

// Rows of a facts-only page (no amounts).
export const FACT_ROWS = [
  { id: 'who', label: '¿Quién arma la web?' },
  { id: 'pay', label: 'Cómo se paga' },
  { id: 'price', label: 'Moneda e impuestos' },
  { id: 'domain', label: 'Dominio' },
  { id: 'refund', label: 'Devolución del dinero' },
  { id: 'support', label: 'Atención' },
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
  // MontaWeb's column on facts-only pages
  facts: {
    who: { k: 'info', text: 'Nosotros. Te mostramos la web terminada en un enlace de prueba y pides los ajustes.', mustAppear: ['te mostramos la web terminada en un enlace de prueba'] },
    pay: { k: 'info', text: 'Pago único por el diseño. Desde el segundo año, hosting y SSL S/ 120 al año, solo si renuevas.', mustAppear: ['pago único', 'S/ 120 por cada año que decidas renovar'] },
    price: { k: 'yes', text: 'Precios finales en soles, con el IGV incluido', mustAppear: ['precios finales en soles (PEN), con el IGV incluido'] },
    domain: { k: 'info', text: 'Subdominio gratis el primer año (tunegocio.montaweb.pe). Dominio propio aparte: .com S/ 50 o .pe S/ 65 al año, registrado a tu nombre.', mustAppear: ['S/ 65', 'se registra a tu nombre'] },
    refund: { k: 'info', text: 'Si cancelas, te devolvemos lo pagado menos el trabajo ya hecho, según la etapa.', mustAppear: ['te devolvemos lo pagado'] },
    support: { k: 'info', text: 'Por WhatsApp, en español', mustAppear: ['Asesoría gratuita por WhatsApp'] },
  },
};

// ---------------------------------------------------------------------------
// Competitors (alphabetical: the order means nothing)
// Legal names are kept for our records (not shown): Glob Digital = Grupo Globperu S.A.C.,
// RUC 20600593740 (its libro de reclamaciones page); Monstruo Creativo = Monstruo Creativo
// S.A.C., RUC 20609563258 (its términos y condiciones); both read 2026-11-25.
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
      'Bersoft es una agencia de Lima que trabaja con WordPress. Publica tres paquetes de pago único: Básico (S/ 300), Estándar (S/ 450) y Premium (S/ 600), con el IGV incluido.',
      'El primer año incluye hosting, dominio .com y certificado SSL. Lo que se paga desde el segundo año no figura en su página. También ofrece landing pages y tiendas virtuales, pero sin precio publicado.',
    ],
    aboutQuotes: ['S/450 pago único', 'S/600 pago único', 'Diseño de páginas web en Lima', 'en WordPress (y también a medida)', 'Diseño de Tiendas Virtuales', 'Landing Page'],
    chooseThem: { title: 'Te conviene Bersoft si:', items: ['necesitas varias páginas internas desde el primer plan', 'quieres hosting, dominio .com y SSL incluidos el primer año', 'buscas una agencia que trabaje con WordPress'] },
  },
  {
    slug: 'glob-digital',
    taxShort: 'más IGV',
    name: 'Glob Digital',
    legal: 'Grupo Globperu S.A.C.',
    sources: [S('glob-web', 'https://www.globdigital.pe/diseno-web.html', 'Agencia de desarrollo y diseño web en Lima (preguntas frecuentes)')],
    cardLine: 'Paquetes para pymes desde S/ 1,000 + IGV, con dominio, hosting y SSL.',
    cells: {
      landing: { k: 'unlisted', text: 'No publica un precio de landing', src: 'glob-web' },
      web: { k: 'info', amount: 1000, text: 'Paquetes de diseño web para pymes: desde S/ 1,000.00', src: 'glob-web', quotes: ['paquetes de diseño web para Pymes', 'que va desde los S/1,000.00 +IGV'] },
      store: { k: 'unlisted', text: 'No publica un precio de tienda', src: 'glob-web' },
      tax: { k: 'extra', text: 'Más IGV', src: 'glob-web', quotes: ['S/1,000.00 +IGV'] },
      hosting: { k: 'yes', text: 'Sus paquetes incluyen dominio, hosting y certificado SSL; por cuánto tiempo no figura en su página', src: 'glob-web', quotes: ['incluyen el servicio de dominio, hosting y certificado SSL'] },
      after: { k: 'unlisted', text: 'No publica cuánto cuesta renovar', src: 'glob-web' },
      delivery: { k: 'unlisted', src: 'glob-web' },
      owner: { k: 'unlisted', src: 'glob-web' },
      guarantee: { k: 'unlisted', src: 'glob-web' },
    },
    aboutTitle: 'Qué ofrece Glob Digital',
    about: [
      'Glob Digital es una agencia de Lima que hace webs con WordPress, PHP, .Net y React. También ofrece branding, publicidad online y hosting.',
      'Para negocios que recién empiezan publica paquetes de diseño web para pymes desde S/ 1,000.00 + IGV. Según su página, incluyen dominio, hosting y SSL, optimización SEO, capacitación para usar el administrador y 1 año de soporte técnico. Los demás proyectos los cotiza según lo que necesites.',
    ],
    aboutQuotes: ['WordPress, PHP, .Net y React', 'Branding', 'Publicidad Online', 'la optimización SEO para los buscadores, la capacitación en el uso del administrador y 1 año de soporte técnico', 'el precio dependerá de la complejidad de tu proyecto'],
    chooseThem: { title: 'Te conviene Glob Digital si:', items: ['quieres 1 año de soporte técnico incluido en el paquete', 'necesitas una web en WordPress, PHP, .Net o React', 'te interesa contratar también branding o publicidad online con la misma agencia'] },
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
    slug: 'izipay-web',
    taxShort: 'con IGV',
    name: 'Izipay web',
    legal: null,
    sources: [S('izipay-web', 'https://www.izipay.pe/izipay-web/', 'izipay web: Plan Plus y comisiones')],
    cardLine: 'Tienda online que personalizas tú: S/ 49.00 al mes con IGV, más comisión por venta.',
    lead: 'Izipay web es una tienda online que personalizas tú, con la asesoría de un especialista de Izipay, y que se paga cada mes. En MontaWeb te hacemos la tienda y la pagas una sola vez. Aquí puedes comparar lo que cada uno publica.',
    cells: {
      landing: { k: 'unlisted', text: 'No publica un plan de una sola página', src: 'izipay-web' },
      web: { k: 'unlisted', text: 'Solo publica un plan de tienda', src: 'izipay-web' },
      store: { k: 'info', amount: 49, period: 'mes', text: 'Plan Plus: S/ 49.00 al mes, con productos ilimitados', src: 'izipay-web', quotes: ['Plan mensual:', 'S/ 49.00', 'Productos ilimitados'] },
      tax: { k: 'yes', text: 'Incluye IGV', src: 'izipay-web', quotes: ['S/ 49.00 Incl. IGV'] },
      hosting: { k: 'yes', text: 'Hosting y dominio .com incluidos «por promoción»', src: 'izipay-web', quotes: ['Por promoción, tendrás hosting y un dominio propio (.com)'] },
      after: { k: 'extra', text: 'S/ 49.00 cada mes, más una comisión por cada venta: 3.44 % + IGV, y S/ 0.69 + IGV por el canal virtual (su página dice que las tasas son referenciales)', src: 'izipay-web', quotes: ['La comisión izipay es del 3.44% del valor de la operación más el 18% de IGV', 'comisión del canal virtual de S/0.69 más IGV', 'Recuerda que las tasas son referenciales'] },
      delivery: { k: 'unlisted', text: 'No publica un plazo de entrega', src: 'izipay-web' },
      owner: { k: 'unlisted', src: 'izipay-web' },
      guarantee: { k: 'unlisted', src: 'izipay-web' },
    },
    aboutTitle: 'Qué ofrece Izipay web',
    about: [
      'Izipay web es el servicio de tienda online de Izipay. Su Plan Plus cuesta S/ 49.00 al mes con IGV e incluye productos ilimitados, el botón de pago con tarjeta y, por promoción, hosting y un dominio .com.',
      'Tú eliges una de sus plantillas y personalizas la tienda con la asesoría de sus especialistas. La tienda se administra desde el celular con la app Wix Owner. Por cada venta cobra una comisión, que su página presenta como referencial.',
    ],
    aboutQuotes: ['Acepta pagos con tarjeta', 'Elige entre 700 plantillas', 'Personaliza tu tienda online con la asesoría de nuestros especialistas', 'app Wix Owner'],
    chooseThem: { title: 'Te conviene Izipay web si:', items: ['prefieres pagar cada mes en vez de un monto más grande al inicio', 'quieres cobrar con tarjeta desde el primer día con el botón de pago de Izipay', 'vas a vender muchos productos: su plan no pone un límite'] },
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
      'Todos los planes incluyen el primer año de hosting, dominio .com, correos y SSL. Desde el segundo año se paga una renovación anual que depende del tipo de web.',
    ],
    aboutQuotes: ['convertirlo en tienda después por solo S/ 550 + IGV', 'Profesional 1.1.2. Empresarial 1.1.3. Corporativo', 'Planes de diseño de catálogos virtuales', 'Dominio .COM, 5 Correos y SSL', 'Renovación Anual'],
    chooseThem: { title: 'Te conviene KOM si:', items: ['quieres el primer año de hosting, dominio .com, 5 correos y SSL incluido', 'te interesa su garantía de 30 días', 'quieres sumar después una pasarela de pago con Izipay (S/ 550 + IGV, según su página)'] },
  },
  {
    slug: 'monstruo-creativo',
    taxShort: 'su página de planes no indica si incluye IGV',
    name: 'Monstruo Creativo',
    legal: 'Monstruo Creativo S.A.C.',
    sources: [
      S('monstruo-web', 'https://monstruocreativo.com/diseno-web/', 'Diseño de páginas web (planes y precios)'),
      S('monstruo-tienda', 'https://monstruocreativo.com/tienda-virtual/', 'Tienda virtual (planes y precios)'),
    ],
    cardLine: 'Plan Emprendedor de S/ 1,200.00 para web o tienda; no indica si incluye IGV.',
    cells: {
      landing: { k: 'unlisted', text: 'No publica un precio de landing', src: 'monstruo-web' },
      web: { k: 'info', amount: 1200, text: 'Emprendedor: S/ 1,200.00 (Inicio, Nosotros, Servicios y Contacto)', src: 'monstruo-web', quotes: ['S/ 1,200.00', 'Pestañas clásicas: Inicio + Nosotros + Servicios (4 sub pestañas) + Contacto'] },
      store: { k: 'info', amount: 1200, text: 'Tienda Emprendedor: S/ 1,200.00; la agencia carga hasta 50 productos', src: 'monstruo-tienda', quotes: ['Precios de Tienda Virtual', 'S/ 1,200.00', 'Subida masiva de productos por la agencia (con fotos), hasta 50 productos máximo'] },
      tax: { k: 'unlisted', text: 'Su página de planes no indica si incluye IGV', src: 'monstruo-web' },
      hosting: { k: 'info', text: 'Emprendedor: dominio .com y hosting gratis por 1 año (opcionales, según su página)', src: 'monstruo-web', quotes: ['Dominio .com gratis: Por 1 año (opcional)', 'Hosting Cloud ilimitado con CDN gratis por 1 año: Si (opcional)'] },
      after: { k: 'unlisted', text: 'No publica cuánto cuesta renovar', src: 'monstruo-web' },
      delivery: { k: 'info', text: 'Emprendedor: 5 días hábiles', src: 'monstruo-web', quotes: ['Tu web lista en: 5 dias hábiles'] },
      owner: { k: 'unlisted', src: 'monstruo-web' },
      guarantee: { k: 'unlisted', src: 'monstruo-web' },
    },
    aboutTitle: 'Qué ofrece Monstruo Creativo',
    about: [
      'Monstruo Creativo es una agencia de Lima con tres planes de páginas web: Emprendedor (S/ 1,200.00), Empresarial (S/ 1,700.00) y Corporativo (S/ 2,200.00). Para tiendas virtuales usa los mismos nombres y precios.',
      'En el plan Emprendedor, el dominio .com y el hosting del primer año van gratis, aunque su página los marca como opcionales. El soporte técnico dura 15 días después de la entrega. Su página de planes no indica si los precios incluyen IGV.',
    ],
    aboutQuotes: ['S/ 1,700.00', 'S/ 2,200.00', 'Soporte técnico: 15 días después de entregar la web', 'Sección para el horario de atención del negocio', 'Sección para colocar certificaciones de la empresa', 'Video de Capacitación Grabado'],
    chooseThem: { title: 'Te conviene Monstruo Creativo si:', items: ['quieres secciones para tu horario, tus sedes y tus certificaciones desde el primer plan', 'necesitas una tienda en la que la agencia cargue por ti hasta 50 productos', 'te sirve aprender a manejar tu web con un video de capacitación'] },
  },
  {
    slug: 'wix',
    kind: 'facts',
    name: 'Wix',
    legal: null,
    sources: [
      S('wix-planes', 'https://es.wix.com/pricing', 'Planes Premium de Wix'),
      S('shopify-precios', 'https://www.shopify.com/pe/precios', 'Precios de Shopify'),
      S('hostinger-creador', 'https://www.hostinger.com/es/creador-de-paginas-web', 'Creador de páginas web de Hostinger'),
      S('godaddy-creador', 'https://www.godaddy.com/es/paginas-web/creador-de-paginas-web', 'Creador de páginas web de GoDaddy'),
    ],
    cardLine: 'Para armar tu web tú mismo. Comparamos condiciones, sin precios: no los publica en soles.',
    lead: 'Con Wix armas tu web tú mismo, con sus plantillas y su editor. Con MontaWeb te la hacemos y te la entregamos lista. Aquí comparamos lo que cada uno publica sobre cómo se paga, el dominio, la devolución del dinero y la atención.',
    noPrice: 'Wix muestra sus precios en dólares y sin impuestos. En estas comparaciones solo usamos precios en soles, así que no los ponemos aquí: puedes verlos en su página de planes.',
    cells: {
      who: { k: 'info', text: 'Tú, con sus plantillas y su editor de arrastrar y soltar', src: 'wix-planes', quotes: ['plantillas personalizables gratuitas', 'un editor inteligente con capacidad de arrastrar y soltar'] },
      pay: { k: 'info', text: 'Suscripción a un plan Premium. Los precios que muestra son de planes anuales pagados por adelantado', src: 'wix-planes', quotes: ['Los precios mostrados son para las suscripciones anuales pagadas en su totalidad en el momento de la compra'] },
      price: { k: 'info', text: 'Muestra sus precios en dólares, sin impuestos: estos se calculan según tu dirección de facturación', src: 'wix-planes', quotes: ['html:US$', 'Los precios no incluyen los impuestos aplicables que se determinan según tu dirección de facturación'] },
      domain: { k: 'yes', text: 'Dominio gratis por 1 año en sus planes Premium', src: 'wix-planes', quotes: ['Dominio gratis por 1 año', 'Dominio personalizado'] },
      refund: { k: 'info', text: '14 días para pedir la devolución del dinero, en todos los planes Premium', src: 'wix-planes', quotes: ['Garantía de devolución del dinero en 14 días para todos los planes Premium'] },
      support: { k: 'info', text: 'Atención al cliente en español', src: 'wix-planes', quotes: ['Atención al cliente en español'] },
      // builders section (no amounts)
      'b-shopify': { k: 'info', text: 'Para crear una tienda online. Se paga cada mes o cada año, y tiene 3 días de prueba gratis.', src: 'shopify-precios', quotes: ['Prueba 3 días gratis', 'Pago mensual', 'Pago anual', 'Tienda online', 'html:USD'] },
      'b-hostinger': { k: 'info', text: 'Tiene un creador de páginas web con garantía de reembolso de 30 días.', src: 'hostinger-creador', quotes: ['Creador de páginas web', 'Garantía de reembolso de 30 días'] },
      'b-godaddy': { k: 'info', text: 'Su creador de páginas web se empieza a usar gratis y se paga al publicar. Los planes anuales incluyen un dominio gratis.', src: 'godaddy-creador', quotes: ['Comienza gratis y paga cuando estés listo para publicar', 'Dominio gratis incluido con los planes anuales'] },
    },
    buildersTitle: 'Otras plataformas para armarla tú mismo',
    buildersIntro: 'Shopify, Hostinger y GoDaddy también venden planes para que armes tu web o tu tienda. Igual que con Wix, no ponemos sus precios. Esto es lo que dicen sus páginas:',
    builders: [{ name: 'Shopify', cell: 'b-shopify' }, { name: 'Hostinger', cell: 'b-hostinger' }, { name: 'GoDaddy', cell: 'b-godaddy' }],
    aboutTitle: 'Qué ofrece Wix',
    about: [
      'Wix es una plataforma para hacer tu propia web: eliges una plantilla, la cambias con su editor y la publicas. Para usar un dominio propio y quitar la marca Wix del sitio necesitas un plan Premium.',
      'Todos sus planes Premium incluyen atención al cliente en español y 14 días para pedir la devolución del dinero si no te convence.',
    ],
    aboutQuotes: ['Eliminación de la marca Wix del sitio', 'Planes Premium de Wix', 'Todos los planes incluyen', 'Dominio personalizado'],
    chooseThem: { title: 'Te conviene Wix si:', items: ['te gusta aprender y tienes tiempo para armar y actualizar tu web', 'quieres cambiar el diseño tú mismo, cuando quieras', 'quieres probar un plan Premium con 14 días para pedir la devolución'] },
  },
];

export const PRICE_COMPETITORS = COMPETITORS.filter(c => c.kind !== 'facts');
export const FACTS_PAGES = COMPETITORS.filter(c => c.kind === 'facts');
export const rowsFor = c => (c.kind === 'facts' ? FACT_ROWS : ROWS);

// Shared copy -----------------------------------------------------------------

// One-time prices only: a monthly plan is not part of a "cuesta entre X e Y" range.
const range = key => {
  const xs = [MONTAWEB, ...PRICE_COMPETITORS].map(c => c.cells[key]).filter(x => typeof x?.amount === 'number' && !x.period).map(x => x.amount);
  return [Math.min(...xs), Math.max(...xs)];
};
const soles = n => `S/ ${n.toLocaleString('en-US')}`;
const [l0, l1] = range('landing');
const [t0, t1] = range('store');
const fmtDay = iso => { const [y, m, d] = iso.split('-'); return `${+d} de ${MONTHS_ES[+m - 1]} de ${y}`; };

const BUILDER_NAMES = FACTS_PAGES.flatMap(c => (c.builders || []).map(b => b.name));
export const TRADEMARK_NOTE = `${[...COMPETITORS.map(c => c.name), ...BUILDER_NAMES].join(', ')} son marcas de sus respectivos dueños. MontaWeb no está vinculada a ninguna de ellas. Solo comparamos lo que cada empresa publica en su propia página, en la fecha indicada.`;
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

const n = PRICE_COMPETITORS.length;
const names = PRICE_COMPETITORS.map(c => c.name);
// "y" becomes "e" before an /i/ sound (Izipay, Hi…), but not before "hie-"/"hia-"
const conj = next => (/^(h?i)(?![aeoué])/i.test(next) ? 'e' : 'y');
const nameList = `${names.slice(0, -1).join(', ')} ${conj(names.at(-1))} ${names.at(-1)}`;

export const HUB = {
  title: `Precio de una página web en Lima: MontaWeb y ${n} proveedores (2026)`,
  description: `Compara lo que cobran MontaWeb, ${nameList} por una web o tienda online: precio, IGV, hosting, plazos y renovación.`,
  h1: 'Compara antes de elegir',
  lead: `Juntamos en una tabla lo que cobra MontaWeb y lo que publican ${n} proveedores de páginas web y tiendas online en Lima: precio, IGV, hosting, dominio, plazo de entrega y lo que pagas después. Cada dato sale de la página de cada empresa, con enlace y fecha.`,
  tableTitle: 'Todo en una tabla',
  caption: `Precios y condiciones que publican MontaWeb y ${n} proveedores de Lima`,
  cardsTitle: 'Comparaciones una por una',
  howTitle: 'Cómo armamos esta comparación',
  how: [
    'Solo usamos lo que cada empresa publica en su propia web. Copiamos los precios tal como aparecen, anotamos la fecha en que los revisamos y guardamos una captura de cada página.',
    'Si un dato no aparece en su página, lo marcamos como «No figura en su página». Eso no quiere decir que no lo ofrezcan: pregúntales directamente.',
    'Elegimos proveedores que publican sus precios en soles. Dejamos fuera a quienes solo dan precio por cotización, porque no hay un número que comparar.',
    'Los planes no son iguales entre sí: cambian el número de páginas, las revisiones, el hosting y lo que se paga después. Por eso mostramos el detalle y no solo el precio.',
  ],
  howLink: { before: 'Si la agencia que te interesa solo da precio por cotización, revisa ', text: 'qué preguntar antes de aceptar una cotización', after: '.' },
  diyTitle: '¿Y si la armo yo mismo?',
  diy: [
    'Hay plataformas que te cobran una suscripción y te dan plantillas para que armes tu web o tu tienda. Izipay web publica su precio en soles, por eso está en la tabla. Es otro tipo de servicio: el trabajo lo haces tú, con la ayuda que te dé la plataforma.',
    'Wix y Shopify muestran sus precios en dólares. Por eso las comparamos aparte y sin montos, junto con Hostinger y GoDaddy.',
  ],
  diyLink: { href: '/comparar/wix', text: 'MontaWeb vs Wix y otras plataformas' },
  faq: [
    { q: '¿Cuánto cuesta una página web en Lima?', a: `Según las páginas que revisamos, una web de una sola página (landing) cuesta entre ${soles(l0)} y ${soles(l1)}, y el primer plan de tienda online con pago único, entre ${soles(t0)} y ${soles(t1)}. Algunos precios incluyen IGV y otros no, y no todos incluyen hosting y dominio. Revisa la tabla para ver el detalle de cada proveedor.` },
    { q: '¿El precio incluye hosting y dominio?', a: 'Depende del proveedor. Varios incluyen hosting y dominio el primer año y luego cobran una renovación anual; otros los cobran en una mensualidad o aparte. En MontaWeb, el hosting y el SSL son gratis el primer año con un subdominio (tunegocio.montaweb.pe), y el dominio propio cuesta S/ 50 (.com) o S/ 65 (.pe) al año.' },
    { q: '¿Cómo puede MontaWeb publicar precios desde S/ 50?', a: 'Trabajamos con planes cerrados: cada uno tiene un alcance fijo (páginas, revisiones y plazo) que confirmamos por escrito antes de empezar. Si tu proyecto necesita más, te decimos el precio del extra antes de hacerlo.' },
    { q: '¿Qué pago después de que me entregan la web?', a: 'En MontaWeb no hay mensualidad obligatoria. Desde el segundo año, el hosting con SSL cuesta S/ 120 al año si decides renovarlo, y el soporte mensual es opcional, desde S/ 49. En otros proveedores cambia mucho: mira la fila «Pagos después de la entrega».' },
    { q: '¿Cada cuánto actualizan esta comparación?', a: 'Revisamos todas las fuentes una vez al mes y cada vez que alguien nos avisa de un cambio. La fecha de la última revisión aparece encima de cada tabla. Si ves un dato distinto en la página de un proveedor, vale lo que diga su página.' },
  ],
};

for (const c of PRICE_COMPETITORS) {
  const cheapest = ['landing', 'web', 'store'].map(k => c.cells[k]).find(x => typeof x.amount === 'number');
  const per = cheapest.period ? ` al ${cheapest.period}` : '';
  c.title = `MontaWeb vs ${c.name}: precios de página web en Lima (2026)`;
  c.description = `Compara MontaWeb y ${c.name}: precio de landing, web y tienda online, IGV, hosting, dominio, plazo de entrega y renovación. Datos de su página, con fecha.`;
  c.lead ??= `${c.name} y MontaWeb hacen páginas web para negocios de Lima. Aquí puedes comparar lo que cada uno publica: precios, IGV, hosting, plazos y lo que pagas después de la entrega.`;
  c.faq = [
    { q: `¿Cuánto cuesta una página web con ${c.name}?`, a: `Su plan más económico publicado cuesta ${soles(cheapest.amount)}${per} (${c.taxShort}). ${c.cells.after.k === 'unlisted' ? 'Lo que se paga después de la entrega no figura en su página.' : `Después de la entrega: ${c.cells.after.text.charAt(0).toLowerCase()}${c.cells.after.text.slice(1)}.`}` },
    { q: `¿${c.name} incluye hosting y dominio?`, a: `${c.cells.hosting.text}, según su página. En MontaWeb, el hosting y el SSL son gratis el primer año con un subdominio, y el dominio propio se paga aparte (.com S/ 50 o .pe S/ 65 al año).` },
    { q: `¿Dónde veo los precios de ${c.name}?`, a: `En su propia página: ${c.sources[0].url}. La revisamos el ${fmtDay(c.sources[0].checked)}. Si ves algo distinto, vale lo que diga su página.` },
  ];
}

for (const c of FACTS_PAGES) {
  c.title = `MontaWeb vs ${c.name}: hacer tu web tú mismo o que te la entreguen lista (2026)`;
  c.description = `Compara MontaWeb y ${c.name}${c.builders ? `, además de ${c.builders.map(b => b.name).join(', ').replace(/, ([^,]*)$/, (_, last) => ` ${conj(last)} ${last}`)}` : ''}: quién arma la web, cómo se paga, dominio, devolución del dinero y atención. Datos de su página, con fecha.`;
  c.faq = [
    { q: `¿Cuánto cuesta ${c.name} en soles?`, a: `${c.name} no publica precios en soles: su página muestra los planes en dólares y sin impuestos. Por eso aquí no ponemos montos.` },
    { q: `¿${c.name} incluye dominio?`, a: `${c.cells.domain.text}, según su página. En MontaWeb empiezas con un subdominio gratis y el dominio propio cuesta S/ 50 (.com) o S/ 65 (.pe) al año, a tu nombre.` },
    { q: `¿Dónde veo los planes de ${c.name}?`, a: `En su propia página: ${c.sources[0].url}. La revisamos el ${fmtDay(c.sources[0].checked)}. Si ves algo distinto, vale lo que diga su página.` },
  ];
}

// ---------------------------------------------------------------------------
// Guide: what to ask when an agency only sends a quote. No company names.
// Every MontaWeb answer must appear on servicios.html / terminos.html (`mustAppear`).
// ---------------------------------------------------------------------------
export const GUIDE = {
  slug: 'cotizacion-pagina-web',
  title: 'Cotización de página web: qué preguntar antes de pagar (2026)',
  description: 'Ocho preguntas para revisar la cotización de tu página web antes de pagar el adelanto: IGV, renovación, dominio, archivos, plazos, cambios y qué pasa si cancelas.',
  crumb: 'Qué preguntar en una cotización',
  h1: 'Antes de aceptar la cotización de tu página web, pregunta esto',
  lead: [
    'Muchas agencias no publican precios: les cuentas qué necesitas y te mandan una cotización. No tiene nada de malo, pero dos cotizaciones casi nunca traen lo mismo, y lo que no dicen suele aparecer después, cuando toca renovar o cuando quieres cambiarte de proveedor.',
    'Estas son las preguntas que conviene hacer por escrito antes de pagar el adelanto. Debajo de cada una ponemos lo que responde MontaWeb en sus términos, como ejemplo de una respuesta concreta.',
  ],
  mwLabel: 'Lo que responde MontaWeb',
  questions: [
    {
      q: '¿El precio incluye IGV?',
      why: 'Una cotización de S/ 800 + IGV termina en S/ 944. Pide que te escriban el total que vas a pagar, con el impuesto ya sumado, para comparar cotizaciones con la misma base.',
      mw: 'Nuestros precios son finales en soles, con el IGV incluido.',
      mustAppear: ['precios finales en soles (PEN), con el IGV incluido'],
    },
    {
      q: '¿Qué pago una sola vez y qué pago cada año?',
      why: 'El diseño casi siempre se paga una vez. El hosting y el dominio se pagan cada año, y algunas agencias cobran además un mantenimiento mensual. Pide las dos cifras por separado: lo que pagas al empezar y lo que pagarás cada año para que tu web siga en línea.',
      mw: 'El diseño es un pago único. El hosting con SSL es gratis el primer año; desde el segundo cuesta S/ 120 al año, solo si decides renovarlo.',
      mustAppear: ['pago único', 'S/ 120 por cada año que decidas renovar'],
    },
    {
      q: '¿Cómo me cobran la renovación?',
      why: '«Primer año gratis» es una oferta común. Pregunta cuánto cuesta el segundo año y si te avisan antes de cobrarlo, para que no te llegue un cargo que no esperabas.',
      mw: 'No cobramos renovaciones automáticas: te avisamos con al menos 15 días de anticipación y el servicio se renueva solo si pagas.',
      mustAppear: ['te avisamos con al menos 15 días de anticipación y el servicio se renueva solo si pagas'],
    },
    {
      q: '¿A nombre de quién se registra el dominio?',
      why: 'El dominio es la dirección de tu web (tunegocio.pe). Si queda a nombre de la agencia, para cambiarte de proveedor necesitas que la agencia acepte transferírtelo. Pide que el titular seas tú o tu empresa.',
      mw: 'El dominio propio se registra a tu nombre.',
      mustAppear: ['se registra a tu nombre'],
    },
    {
      q: '¿La web y sus archivos son míos?',
      why: 'Pregunta si, cuando terminas de pagar, te dan los accesos y una copia de los archivos para llevar tu web a otro proveedor. Si tu web solo funciona dentro de un sistema de la agencia, irte puede significar empezar de cero.',
      mw: 'Cuando pagas el 100 %, la web es tuya. Si lo pides, te damos sin costo una copia completa de los archivos para llevarla a otro proveedor.',
      mustAppear: ['una copia completa de los archivos de tu web para llevarla a otro proveedor, sin costo'],
    },
    {
      q: '¿En cuántos días hábiles me la entregan, y desde cuándo se cuenta?',
      why: '«Entrega en una semana» puede contarse desde el pago, desde que mandas tus textos y fotos o desde que apruebas el diseño. Si eso no queda claro desde el inicio, el plazo se alarga y nadie sabe quién se retrasó.',
      mw: 'Plazos en días hábiles: de 2 a 4 para una landing y de 5 a 10 para una tienda. Se cuentan desde que recibimos el adelanto y tus textos, fotos y logo.',
      mustAppear: ['Plazos referenciales en días hábiles', 'El plazo empieza cuando recibimos el adelanto'],
    },
    {
      q: '¿Cuántas rondas de cambios incluye?',
      why: 'Cuando ves tu web terminada, casi siempre quieres ajustar algo. Pregunta cuántas veces puedes pedir cambios sin pagar más y cuánto cuesta una ronda extra.',
      mw: 'Cada plan incluye 2 o 3 rondas de cambios. Las rondas extra se cotizan aparte.',
      mustAppear: ['cada plan incluye 2 o 3 rondas', 'Las rondas extra'],
    },
    {
      q: '¿Qué pasa si cancelo a mitad del proyecto?',
      why: 'Pregunta cuánto te devuelven si cancelas antes de la entrega y dónde está escrito. Una promesa que solo quedó en una llamada es difícil de reclamar después.',
      mw: 'Si cancelas, te devolvemos lo pagado menos el trabajo ya hecho, según la etapa del proyecto. Está en nuestros términos.',
      mustAppear: ['te devolvemos lo pagado'],
    },
  ],
  keepTitle: 'Guarda todo por escrito',
  keep: [
    'Guarda la cotización, el contrato y los términos tal como te los mandaron. Si después algo no se cumple, eso es lo que vas a mostrar para reclamar, por ejemplo en el Libro de Reclamaciones de la empresa.',
  ],
  compareLink: { before: 'Si prefieres empezar por precios publicados, mira ', text: 'la comparación de proveedores de Lima', after: ', con fuente y fecha.' },
  faq: [
    { q: '¿Cuánto cuesta una página web en Perú?', a: `Depende del alcance. En las páginas que revisamos en Lima, una landing cuesta entre ${soles(l0)} y ${soles(l1)}, y el primer plan de tienda online con pago único, entre ${soles(t0)} y ${soles(t1)}. Antes de comparar, revisa si el precio incluye IGV, hosting y dominio.` },
    { q: '¿Es normal que una agencia solo dé precio por cotización?', a: 'Sí. Muchas agencias cotizan cada proyecto porque el trabajo cambia mucho de un cliente a otro. Lo importante es que la cotización responda por escrito las preguntas de esta página antes de que pagues.' },
    { q: '¿Cuánto tiempo vale una cotización?', a: 'Lo define cada empresa, así que pregúntalo. La cotización de MontaWeb vale 15 días calendario, salvo que indique otra cosa.', mustAppear: ['La cotización tiene validez de 15 días calendario'] },
  ],
};
