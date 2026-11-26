import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const read = f => readFileSync(path.join(ROOT, f), 'utf8');
const plain = html => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const ldGraph = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(m => JSON.parse(m[1])).flatMap(b => b['@graph'] || [b]);

const LIMA = 'diseño-web-lima.html', NAT = 'diseño-de-paginas-web.html', SHOP = 'tiendas-virtuales.html';
const U_LIMA = '/dise%C3%B1o-web-lima', U_NAT = '/dise%C3%B1o-de-paginas-web', U_SHOP = '/tiendas-virtuales';
const PAGES = [
    { file: LIMA, url: U_LIMA, keyword: 'diseño de páginas web en lima' },
    { file: NAT, url: U_NAT, keyword: 'diseño de páginas web' },
    { file: SHOP, url: U_SHOP, keyword: 'tienda virtual' },
];
const parts = html => ({
    title: plain(html.match(/<title>([\s\S]*?)<\/title>/)[1]),
    h1: plain(html.match(/<h1[\s\S]*?<\/h1>/)[0]),
    meta: decode(html.match(/<meta name="description" content="([^"]*)"/)[1]),
});

for (const { file, keyword } of PAGES) {
    test(`${file}: title, H1 and meta description carry the primary keyword`, () => {
        const { title, h1, meta } = parts(read(file));
        for (const [k, v] of Object.entries({ title, h1, meta })) {
            assert.ok(v.toLowerCase().includes(keyword), `${k} lacks "${keyword}": ${v}`);
        }
        if (file === SHOP) assert.ok(meta.toLowerCase().includes('tiendas virtuales'), 'meta lacks tiendas virtuales');
    });

    test(`${file}: one <main>, one page-head`, () => {
        const html = read(file);
        assert.equal((html.match(/<main\b/g) || []).length, 1);
        assert.equal((html.match(/class="page-head"/g) || []).length, 1);
    });

    test(`${file}: JSON-LD has Service, FAQPage and BreadcrumbList matching the visible FAQ`, () => {
        const html = read(file);
        const g = ldGraph(html);
        for (const t of ['Service', 'FAQPage', 'BreadcrumbList']) assert.ok(g.some(n => n['@type'] === t), t);
        const faq = g.find(n => n['@type'] === 'FAQPage');
        const details = [...html.matchAll(/<details[\s\S]*?<\/details>/g)].map(m => m[0]);
        const summaries = details.map(d => plain(d.match(/<summary[\s\S]*?<\/summary>/)[0]));
        const answers = details.map(d => plain(d.replace(/<summary[\s\S]*?<\/summary>/, '').match(/<p[\s\S]*?<\/p>/)[0]));
        assert.ok(summaries.length > 0, 'no visible FAQ');
        assert.deepEqual(faq.mainEntity.map(q => q.name), summaries);
        assert.deepEqual(faq.mainEntity.map(q => q.acceptedAnswer.text), answers);
    });

    test(`${file}: listed in sitemap.xml and llms.txt`, () => {
        const url = PAGES.find(p => p.file === file).url;
        assert.ok(read('sitemap.xml').includes(`<loc>https://montaweb.pe${url}</loc>`));
        assert.ok(read('llms.txt').includes(`](https://montaweb.pe${url})`));
    });
}

test('national page never says Lima in title, H1 or meta; shop page not in title', () => {
    const n = parts(read(NAT));
    for (const [k, v] of Object.entries(n)) assert.ok(!/lima/i.test(v), `${k}: ${v}`);
    assert.ok(!/lima/i.test(parts(read(SHOP)).title));
});

test('"S/ 99" on the two design pages', () => {
    for (const f of [LIMA, NAT]) assert.ok(read(f).includes('S/ 99'), f);
});

test('shop page shows the real shop prices and no S/ 50 website plan', () => {
    const html = read(SHOP);
    for (const p of ['S/ 299', 'S/ 499', 'S/ 59']) assert.ok(html.includes(p), p);
    assert.doesNotMatch(html, /Landing/);
    assert.doesNotMatch(html, /S\/ 50(?! al año)/);
});

test('cross links between the keyword pages', () => {
    assert.ok(read(LIMA).includes(`href="${U_NAT}"`));
    assert.ok(read(NAT).includes(`href="${U_LIMA}"`));
    assert.ok(read(NAT).includes(`href="${U_SHOP}"`));
    assert.ok(read(SHOP).includes(`href="${U_NAT}"`));
});

test('index and servicios link to the new pages', () => {
    assert.ok(read('index.html').includes(`href="${U_NAT}"`));
    assert.ok(read('servicios.html').includes(`href="${U_NAT}"`));
    assert.ok(read('servicios.html').includes(`href="${U_SHOP}"`));
});

test('every shared footer "Servicios" column links to both new URLs', () => {
    const walk = (d, o = []) => {
        for (const e of readdirSync(path.join(ROOT, d))) {
            if (['node_modules', 'docs', '.git', '.claude', '.devkit'].includes(e)) continue;
            const rel = d ? `${d}/${e}` : e;
            if (statSync(path.join(ROOT, rel)).isDirectory()) walk(rel, o);
            else if (rel.endsWith('.html')) o.push(rel);
        }
        return o;
    };
    let checked = 0;
    for (const f of walk('')) {
        const html = read(f);
        assert.ok(!html.includes('/servicios#web-simple">Diseño web<'), `${f} still has the old footer link`);
        if (!/class="home-footer"/.test(html)) continue;
        if (!/Servicios/.test(html.slice(html.indexOf('class="home-footer"')))) continue;
        checked++;
        const foot = html.slice(html.indexOf('class="home-footer"'));
        assert.ok(foot.includes(`<a href="${U_NAT}">Diseño de páginas web</a>`), `${f} footer: national`);
        assert.ok(foot.includes(`<a href="${U_SHOP}">Tiendas online</a>`), `${f} footer: shop`);
    }
    assert.ok(checked >= 20, `only ${checked} footers checked`);
});
