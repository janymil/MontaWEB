import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const PAGE = 'videos-publicitarios-con-ia.html';
const URL_PATH = '/videos-publicitarios-con-ia';
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const html = read(PAGE);
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/ /g, ' ');
const textOf = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const jsonLd = () => {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    return blocks.flatMap((b) => (b['@graph'] ? b['@graph'] : [b]));
};
const node = (type) => jsonLd().find((n) => n['@type'] === type);

test('title, H1 and meta description carry the primary keyword', () => {
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    const desc = html.match(/<meta name="description" content="([^"]+)"/)[1];
    const h1 = textOf(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]);
    for (const [name, value] of [['title', title], ['meta description', desc], ['h1', h1]]) {
        assert.ok(value.toLowerCase().includes('videos publicitarios con ia'), `${name}: ${value}`);
    }
});

test('canonical, og:url and og:image point to the apex host and the image exists', () => {
    assert.ok(html.includes(`<link rel="canonical" href="https://montaweb.pe${URL_PATH}">`));
    assert.ok(html.includes(`<meta property="og:url" content="https://montaweb.pe${URL_PATH}">`));
    assert.ok(html.includes('content="https://montaweb.pe/images/og/og-videos-publicitarios-con-ia.png"'));
    assert.ok(existsSync(path.join(ROOT, 'images/og/og-videos-publicitarios-con-ia.png')));
});

test('S/ 149, S/ 349 and IGV are visible and equal the JSON-LD offers', () => {
    const body = textOf(html.replace(/<script[\s\S]*?<\/script>/g, ''));
    assert.ok(body.includes('S/ 149'));
    assert.ok(body.includes('S/ 349'));
    assert.ok(body.includes('IGV'));
    const service = node('Service');
    assert.ok(service, 'Service node');
    const offers = [].concat(service.offers);
    assert.equal(offers.length, 2);
    const prices = offers.map((o) => `${o.price}`).sort();
    assert.deepEqual(prices, ['149', '349']);
    for (const o of offers) {
        assert.equal(o.priceCurrency, 'PEN');
        assert.equal(o['@type'], 'Offer');
        assert.ok(body.includes(`S/ ${o.price}`), `visible price for ${o.price}`);
    }
});

test('FAQ JSON-LD equals the visible questions and answers', () => {
    const faq = node('FAQPage');
    assert.ok(faq, 'FAQPage node');
    const visible = [...html.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g)]
        .map((m) => [textOf(m[1]), textOf(m[2])]);
    const ld = faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]);
    assert.ok(ld.length >= 8, 'FAQ questions present');
    assert.deepEqual(visible, ld);
});

test('FAQ summaries contain no headings', () => {
    for (const m of html.matchAll(/<summary>([\s\S]*?)<\/summary>/g)) assert.doesNotMatch(m[1], /<h[1-6]/);
});

test('BreadcrumbList ends on this page', () => {
    const bc = node('BreadcrumbList');
    assert.ok(bc);
    assert.equal(bc.itemListElement.at(-1).item, `https://montaweb.pe${URL_PATH}`);
});

test('the page carries no remarks about how the content was made', () => {
    const t = textOf(html);
    for (const banned of ['generado con IA', 'Hecho con IA', 'negocio ficticio', 'no existen']) {
        assert.ok(!t.includes(banned), banned);
        assert.ok(!html.includes(banned), `${banned} (markup)`);
    }
    for (const f of ['servicios.html', 'llms.txt']) assert.ok(!read(f).includes('Video generado con IA'), f);
});

test('the receptionist block has no price and the monthly pack has none either', () => {
    const block = html.match(/<section[^>]*id="recepcionista"[\s\S]*?<\/section>/);
    assert.ok(block, 'receptionist section with id="recepcionista"');
    assert.ok(textOf(block[0]).toLowerCase().includes('en preparación'));
    assert.doesNotMatch(textOf(block[0]), /S\/|\d{2,}/);
    const monthly = html.match(/<p[^>]*class="[^"]*reel-monthly[^"]*"[\s\S]*?<\/p>/);
    assert.ok(monthly, 'monthly pack line');
    assert.doesNotMatch(textOf(monthly[0]), /S\/|\d/);
});

test('no 1,490 pack and no jingle or voice-spot offer', () => {
    const body = textOf(html.replace(/<script[\s\S]*?<\/script>/g, ''));
    assert.doesNotMatch(body, /1[.,\s]?490/);
    assert.ok(!/jingle/i.test(body.replace(/Jingles ni spots para radio\./, '')), 'jingle only in the "no incluye" line');
    assert.ok(!/1[.,]?490/.test(html));
});

test('every <video> has poster, playsinline, muted, controls and no autoplay; sources are WebM then MP4', () => {
    const videos = [...html.matchAll(/<video\b([^>]*)>([\s\S]*?)<\/video>/g)];
    assert.equal(videos.length, 3);
    for (const [, attrs, inner] of videos) {
        assert.match(attrs, /\bposter="images\/video\/demos\/[a-z-]+-poster\.jpg"|\bposter="\/images\/video\/demos\/[a-z-]+-poster\.jpg"/);
        assert.match(attrs, /\bplaysinline\b/);
        assert.match(attrs, /\bmuted\b/);
        assert.match(attrs, /\bcontrols\b/);
        assert.match(attrs, /preload="none"/);
        assert.match(attrs, /width="720"/);
        assert.match(attrs, /height="1280"/);
        assert.match(attrs, /aria-label="Video publicitario de [^"]+"/);
        assert.doesNotMatch(attrs, /autoplay/);
        const srcs = [...inner.matchAll(/<source src="([^"]+)" type="([^"]+)"/g)];
        assert.deepEqual(srcs.map((s) => s[2]), ['video/webm', 'video/mp4']);
    }
    const slugs = ['polleria-dona-meche', 'veterinaria-huellitas-del-parque', 'barberia-don-lucho'];
    for (const s of slugs) {
        for (const ext of ['webm', 'mp4']) assert.ok(html.includes(`images/video/demos/${s}.${ext}`), `${s}.${ext}`);
        assert.ok(html.includes(`images/video/demos/${s}-poster.jpg`));
    }
});

test('page is in sitemap.xml and llms.txt', () => {
    assert.ok(read('sitemap.xml').includes(`<loc>https://montaweb.pe${URL_PATH}</loc>`));
    assert.ok(read('llms.txt').includes(`](https://montaweb.pe${URL_PATH})`));
});

test('linked from index, servicios and the footer of every page that has the Servicios column', () => {
    assert.ok(read('index.html').includes(`href="${URL_PATH}"`));
    assert.ok(read('servicios.html').includes(`href="${URL_PATH}"`));
    const walk = (dir) => readdirSync(path.join(ROOT, dir)).flatMap((n) => {
        const rel = dir ? `${dir}/${n}` : n;
        if (['node_modules', '.git', '.claude', '.devkit', 'docs', 'ejemplos1', 'edenbar', 'gimnasiolaalameda', 'attached_assets'].includes(n)) return [];
        return statSync(path.join(ROOT, rel)).isDirectory() ? walk(rel) : rel.endsWith('.html') ? [rel] : [];
    });
    const withFooter = walk('').filter((f) => read(f).includes('<h3>Servicios</h3>'));
    assert.ok(withFooter.length >= 20, `found ${withFooter.length} pages with the column`);
    for (const f of withFooter) {
        assert.match(read(f), /<a href="\/videos-publicitarios-con-ia">Videos con IA<\/a>/, f);
    }
});

test('servicios has "4. Videos con IA" before "5. Cuidado y hosting", with both prices', () => {
    const s = read('servicios.html');
    const i4 = s.indexOf('4. Videos con IA');
    const i5 = s.indexOf('5. Cuidado y hosting');
    assert.ok(i4 > 0 && i5 > i4, 'videos category first, hosting renumbered to 5');
    assert.ok(!s.includes('4. Cuidado y hosting'));
    const block = s.slice(i4, i5);
    assert.ok(block.includes('S/ 149') && block.includes('S/ 349'));
    assert.ok(block.includes(`href="${URL_PATH}"`));
    const offers = s.match(/"url": "https:\/\/montaweb\.pe\/servicios#(?:pack-)?video-ia"[\s\S]*?"price": "(\d+)"/g) || [];
    assert.equal(offers.length, 2, 'two video offers in servicios JSON-LD');
});

test('homepage band sits right after #servicios', () => {
    const idx = read('index.html');
    const after = idx.slice(idx.indexOf('id="servicios"'));
    const bandAt = after.indexOf('NUEVO · VIDEOS CON IA');
    const nextSection = after.indexOf('id="proyectos"');
    assert.ok(bandAt > 0 && bandAt < nextSection, 'band between #servicios and #proyectos');
});
