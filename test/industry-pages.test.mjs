import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const SLUGS = ['veterinarias', 'dentistas', 'consultorios', 'gimnasios', 'spa-y-salon-de-belleza', 'hoteles']
    .map(s => `pagina-web-para-${s}`);
const HUB = 'paginas-web-por-rubro';
const BASE = 'https://montaweb.pe';

const read = f => readFileSync(path.join(ROOT, f), 'utf8');
const plain = html => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const ldBlocks = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
const nodes = html => ldBlocks(html).flatMap(b => b['@graph'] || [b]);
const byType = (html, t) => nodes(html).find(n => n['@type'] === t);
const hrefs = html => [...html.matchAll(/href="([^"]*)"/g)].map(m => m[1]);
const visibleText = html => plain(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''));

for (const slug of SLUGS) {
    const file = `${slug}.html`;
    test(`${slug}: basics`, () => {
        assert.ok(existsSync(path.join(ROOT, file)));
        const html = read(file);
        assert.match(html, /<html lang="es-PE"/);
        assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
        assert.match(html, new RegExp(`<link rel="canonical" href="${BASE}/${slug}">`));
        assert.match(html.match(/<title>([\s\S]*?)<\/title>/)[1], /S\/ 99/);
        assert.ok(!html.includes('S/ 50'), 'S/ 50 must not appear');
        assert.match(html, /css\/rubros\.css\?v=\d{8}[a-z]?"/);
    });

    test(`${slug}: JSON-LD Service, Breadcrumb and FAQ match the page`, () => {
        const html = read(file);
        assert.ok(ldBlocks(html).length >= 1);
        const service = byType(html, 'Service');
        assert.ok(service, 'Service');
        assert.equal(String(service.offers.price), '99');
        const bc = byType(html, 'BreadcrumbList');
        assert.ok(bc, 'BreadcrumbList');
        assert.equal(bc.itemListElement.length, 3);
        assert.equal(bc.itemListElement[1].item, `${BASE}/${HUB}`);
        const faq = byType(html, 'FAQPage');
        assert.ok(faq, 'FAQPage');
        const items = [...html.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)];
        assert.ok(items.length > 0);
        assert.deepEqual(faq.mainEntity.map(q => q.name), items.map(m => plain(m[1])));
        assert.deepEqual(faq.mainEntity.map(q => plain(q.acceptedAnswer.text)), items.map(m => plain(m[2])));
    });

    test(`${slug}: WhatsApp, links and no compromised host`, () => {
        const html = read(file);
        const wa = hrefs(html).filter(h => h.includes('wa.me'));
        assert.ok(wa.length > 0);
        for (const h of wa) {
            assert.match(h, /^https:\/\/wa\.me\/51965403196(\?|$)/, h);
        }
        // the footer "Conecta" link is a plain wa.me link; the page's CTAs must prefill a message
        assert.ok(wa.filter(h => /[?&]text=/.test(h)).length >= 2, 'CTA links with text=');
        assert.ok(hrefs(html).includes(`/${HUB}`), 'links to hub');
        const strip = html.match(/aria-labelledby="otros-rubros"[\s\S]*?<\/section>/);
        assert.ok(strip, 'otros-rubros strip');
        for (const other of SLUGS.filter(s => s !== slug)) {
            assert.ok(strip[0].includes(`href="/${other}"`), `strip links to ${other}`);
        }
        assert.ok(!html.includes('clinica.montaweb.pe'));
    });

    test(`${slug}: no forbidden promises`, () => {
        const text = visibleText(read(file)).toLowerCase();
        for (const phrase of ['historia clínica digital incluida', 'reserva online', 'reservas online', 'agenda online']) {
            assert.ok(!text.includes(phrase), phrase);
        }
    });
}

test('hub: h1, ItemList, breadcrumb and links to all six pages', () => {
    const html = read(`${HUB}.html`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    const list = byType(html, 'ItemList');
    assert.equal(list.itemListElement.length, 6);
    assert.deepEqual(list.itemListElement.map(i => i.url).sort(), SLUGS.map(s => `${BASE}/${s}`).sort());
    assert.equal(byType(html, 'BreadcrumbList').itemListElement.length, 2);
    const h = hrefs(html);
    for (const s of SLUGS) assert.ok(h.includes(`/${s}`), s);
});

test('sitemap.xml lists the hub and the six industry pages', () => {
    const xml = read('sitemap.xml');
    for (const s of [HUB, ...SLUGS]) assert.ok(xml.includes(`<loc>${BASE}/${s}</loc>`), s);
});
