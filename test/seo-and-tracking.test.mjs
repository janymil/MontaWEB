import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const INDEXABLE = {
    'index.html': 'https://montaweb.pe/',
    'servicios.html': 'https://montaweb.pe/servicios',
    'ejemplos.html': 'https://montaweb.pe/ejemplos',
    'contacto.html': 'https://montaweb.pe/contacto',
    'brief.html': 'https://montaweb.pe/brief',
    'terminos.html': 'https://montaweb.pe/terminos',
    'privacidad.html': 'https://montaweb.pe/privacidad',
    'empresa.html': 'https://montaweb.pe/empresa',
    'blog.html': 'https://montaweb.pe/blog',
    'diseño-web-lima.html': 'https://montaweb.pe/dise%C3%B1o-web-lima',
    'diseño-de-paginas-web.html': 'https://montaweb.pe/dise%C3%B1o-de-paginas-web',
    'tiendas-virtuales.html': 'https://montaweb.pe/tiendas-virtuales',
    'videos-publicitarios-con-ia.html': 'https://montaweb.pe/videos-publicitarios-con-ia',
    'google-mi-negocio.html': 'https://montaweb.pe/google-mi-negocio',
    'blog/estudio-web-negocios-lima-2026.html': 'https://montaweb.pe/blog/estudio-web-negocios-lima-2026',
};

for (const [file, url] of Object.entries(INDEXABLE)) {
    test(`${file}: canonical, og:url and absolute og:image`, () => {
        const html = read(file);
        assert.ok(html.includes(`<link rel="canonical" href="${url}">`), 'canonical');
        assert.ok(html.includes(`<meta property="og:url" content="${url}">`), 'og:url');
        const img = html.match(/<meta property="og:image" content="([^"]+)"/);
        assert.ok(img && img[1].startsWith('https://montaweb.pe/'), `og:image absolute on montaweb.pe (got ${img && img[1]})`);
        assert.match(html, /<meta name="description" content="[^"]{50,220}">/, 'meta description 50–220 chars');
        assert.match(html, /<html lang="es-PE"/);
    });
}

test('thank-you and 404 pages are noindex', () => {
    for (const f of ['404.html', 'gracias.html', 'gracias-descarga.html']) {
        assert.match(read(f), /<meta name="robots" content="noindex/, f);
    }
});

test('homepage defines the #organization node that other pages reference', () => {
    assert.ok(read('index.html').includes('"@id": "https://montaweb.pe/#organization"'));
    assert.ok(read('diseño-web-lima.html').includes('"@id": "https://montaweb.pe/#organization"'));
    assert.ok(read('servicios.html').includes('"provider":'));
});

test('every content page loads the consent-gated analytics script', () => {
    const pages = readdirSync(new URL('..', import.meta.url)).filter((f) => f.endsWith('.html'));
    for (const f of pages) {
        const html = read(f);
        if (html.includes('http-equiv="refresh"')) continue;
        assert.ok(html.includes('/js/consent.js'), f);
    }
});

test('analytics only loads after consent', () => {
    const js = read('js/consent.js');
    assert.match(js, /if \(v === 'granted'\) loadTrackers\(\)/);
    assert.ok(!/^\s*loadTrackers\(\);/m.test(js), 'no unconditional loadTrackers() call');
    assert.match(read('privacidad.html'), /Google Analytics 4/);
});

test('Lima landing page is linked from the footer', () => {
    assert.ok(read('index.html').includes('href="/dise%C3%B1o-web-lima"'));
});
