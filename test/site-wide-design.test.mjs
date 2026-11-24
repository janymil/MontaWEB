import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const pages = [
    'index.html', 'servicios.html', 'ejemplos.html', 'contacto.html',
    'empresa.html', 'brief.html', 'diseño-web-lima.html', 'privacidad.html',
    'terminos.html', '404.html', 'gracias.html', 'gracias-descarga.html'
];
const read = file => readFileSync(path.join(ROOT, file), 'utf8');
const css = read('css/site.css');

for (const page of pages) {
    test(`${page} uses the complete shared public-site shell`, () => {
        const html = read(page);
        assert.match(html, /css\/site\.css\?v=20261124c/);
        assert.match(html, /js\/site\.js\?v=20261124c/);
        assert.match(html, /class="site-header" id="site-header"/);
        assert.match(html, /id="home-nav-toggle"/);
        assert.match(html, /class="home-footer"/);
        assert.match(html, /<main[^>]*id="contenido"/);
        assert.match(html, /data-theme="light"/);
        assert.doesNotMatch(html, /class="nav__menu"/);
        assert.doesNotMatch(html, /id="theme-toggle"/);
    });
}

test('homepage pricing links to the complete services and prices catalog', () => {
    const html = read('index.html');
    assert.match(html, /class="plans-all reveal-item"/);
    assert.match(html, /href="\/servicios">Ver todos los servicios y precios/);
});

test('contact form retains EmailJS and all submission fields', () => {
    const html = read('contacto.html');
    assert.match(html, /id="contact-form" data-handler="emailjs"/);
    assert.match(html, /js\/emailjs-contact-fixed\.js/);
    for (const id of ['nombre', 'telefono', 'email', 'mensaje', 'acepto', 'contact-status']) {
        assert.match(html, new RegExp(`id="${id}"`));
    }
});

test('brief retains all six steps, autosave UI and its original logic', () => {
    const html = read('brief.html');
    assert.match(html, /id="brief-form"/);
    assert.match(html, /id="brief-save-state"/);
    assert.match(html, /js\/brief\.js/);
    assert.equal([...html.matchAll(/class="brief-step(?: active)?" data-step="\d"/g)].length, 6);
});

test('brief success cancels pending autosave before clearing the draft', () => {
    const js = read('js/brief.js');
    const success = js.indexOf('function showSuccess(id)');
    const cancel = js.indexOf('clearTimeout(saveTimer);', success);
    const remove = js.indexOf('localStorage.removeItem(STORAGE_KEY);', success);
    assert.ok(success >= 0 && cancel > success && remove > cancel,
        'A pending autosave must not recreate the draft after a successful submission');
});

test('contact feedback uses readable light-surface colors', () => {
    assert.match(css, /\.site-page \.form-status--error \{ color:#8f1d1d; background:#fff0eb;/);
    assert.match(css, /\.site-page \.form-status--success \{ color:#234d1a; background:#efffd8;/);
});

test('portfolio retains every filter and the calculator remains available', () => {
    const portfolio = read('ejemplos.html');
    for (const filter of ['all', 'gastronomia', 'salud', 'belleza', 'profesionales', 'inmobiliaria', 'tiendas']) {
        assert.match(portfolio, new RegExp(`data-filter="${filter}"`));
    }
    assert.match(read('servicios.html'), /data-open-calculator/);
});

test('meaningful text and controls use the readable site-wide type scale', () => {
    const expectations = [
        ['.site-page .page-head > .container > p', 19],
        ['.site-page .p-card__desc', 16],
        ['.site-page .work__body p', 16],
        ['.site-page .form-field label', 15],
        ['.site-page .legal p', 17],
        ['.home-page .plan-description', 16],
        ['.home-page .finder-options strong', 16],
        ['.home-page .faq-answer p', 16],
        ['.footer-column a', 15]
    ];
    for (const [selector, minimum] of expectations) {
        const rule = css.match(new RegExp(`${selector.replace(/[.*]/g, '\\$&')}[^{]*\\{[^}]*font-size:(\\d+)px`));
        assert.ok(rule, `Missing font-size for ${selector}`);
        assert.ok(Number(rule[1]) >= minimum, `${selector} is only ${rule[1]}px`);
    }
});

test('secondary page variants match their document classes', () => {
    for (const [page, variant] of Object.entries({
        'servicios.html': 'services', 'ejemplos.html': 'examples', 'contacto.html': 'contact',
        'empresa.html': 'company', 'brief.html': 'brief', 'privacidad.html': 'legal'
    })) {
        assert.match(read(page), new RegExp(`site-page--${variant}`));
        assert.match(css, new RegExp(`\\.site-page--${variant}`));
    }
});
