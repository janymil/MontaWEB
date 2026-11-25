import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const read = f => readFileSync(path.join(ROOT, f), 'utf8');
const ARTICLE = 'blog/estudio-web-negocios-lima-2026.html';
const art = read(ARTICLE), index = read('blog.html');
const publicPages = readdirSync(ROOT).filter(n => n.endsWith('.html')).filter(n => read(n).includes('class="main-nav"'));

test('every public page has the Blog nav entry and footer link', () => {
    assert.ok(publicPages.length >= 13);
    for (const p of publicPages) {
        const nav = read(p).match(/<nav class="main-nav"[\s\S]*?<\/nav>/)[0];
        assert.match(nav, /<a href="\/blog"[^>]*>Blog<\/a>/, `${p} nav`);
        assert.match(read(p), /<div class="footer-column"><h3>Explora<\/h3>[^]*?<a href="\/blog">Blog<\/a>/, `${p} footer`);
    }
});

test('article SEO basics: title, description, canonical, OG, one h1', () => {
    const title = art.match(/<title>(.*?)<\/title>/)[1];
    const desc = art.match(/<meta name="description" content="(.*?)"/)[1];
    assert.ok(title.length <= 60, `title ${title.length}`);
    assert.ok(desc.length <= 155, `description ${desc.length}`);
    assert.match(art, /<html lang="es-PE"/);
    assert.match(art, /rel="canonical" href="https:\/\/montaweb\.pe\/blog\/estudio-web-negocios-lima-2026"/);
    assert.match(art, /og:image" content="https:\/\/montaweb\.pe\/images\/blog\/og-estudio-web-lima-2026\.png"/);
    assert.equal([...art.matchAll(/<h1[ >]/g)].length, 1);
    assert.equal([...index.matchAll(/<h1[ >]/g)].length, 1);
});

test('JSON-LD parses and declares Article, Breadcrumb and FAQ, and no Dataset', () => {
    const ld = JSON.parse(art.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const types = ld['@graph'].map(n => n['@type']);
    for (const t of ['Article', 'BreadcrumbList', 'FAQPage']) assert.ok(types.includes(t), t);
    assert.ok(!types.includes('Dataset'), 'the study data is not offered as a public dataset');
    const faq = ld['@graph'].find(n => n['@type'] === 'FAQPage');
    assert.ok(faq.mainEntity.length >= 4);
    JSON.parse(index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
});

test('embedded study data parses and matches the research headline numbers', () => {
    const data = JSON.parse(art.match(/id="study-data">([\s\S]*?)<\/script>/)[1]);
    assert.equal(data.independent, 19168);
    assert.equal(data.active, 7441);
    assert.equal(data.categories.length, 30);
    assert.equal(data.zones.length, 5);
    assert.equal(Math.round(data.stack.active.ok * 10) / 10, 24.4);
    assert.equal(Math.round(data.stack.all.ok * 10) / 10, 16.1);
});

test('internal links resolve and required internal links are present', () => {
    for (const html of [art, index]) {
        for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
            const clean = decodeURIComponent(href);
            if (clean === '/') continue;
            const ok = [clean, clean + '.html', clean.replace(/^\//, '') + '.html'].some(f => existsSync(path.join(ROOT, f)));
            assert.ok(ok, `broken internal link ${href}`);
        }
    }
    for (const l of ['/servicios', '/ejemplos', '/contacto', '/diseño-web-lima', '/google-mi-negocio']) assert.ok(art.includes(`href="${l}"`), l);
});

test('every image has alt, dimensions and an existing file; below-fold images are lazy', () => {
    for (const html of [art, index]) {
        const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
        assert.ok(imgs.length >= 1);
        for (const tag of imgs) {
            assert.match(tag, /\balt="[^"]*"/, tag);
            assert.match(tag, /\bwidth="\d+"/, tag);
            assert.match(tag, /\bheight="\d+"/, tag);
            const src = tag.match(/src="([^"]+)"/)[1];
            assert.ok(existsSync(path.join(ROOT, src)), `missing ${src}`);
        }
    }
    assert.ok(existsSync(path.join(ROOT, 'images/blog/og-estudio-web-lima-2026.png')));
    assert.ok(!/@@/.test(art + index), 'unfilled placeholder');
});

test('outbound links open safely and editorial citations are not nofollow', () => {
    for (const [tag] of art.matchAll(/<a [^>]*target="_blank"[^>]*>/g)) {
        assert.match(tag, /rel="noopener"/, tag);
        assert.doesNotMatch(tag, /nofollow/);
    }
    for (const host of ['gob.pe/institucion/inei', 'gob.pe/institucion/produce', 'support.google.com/business', 'gob.pe/institucion/anpd'])
        assert.ok(art.includes(host), host);
});

test('readers see no data downloads or data-vendor names, and the sitemap lists the blog and the article', () => {
    for (const page of [art, read('blog.html')]) {
        assert.doesNotMatch(page, /dataforseo/i, 'name Google Maps as the source, not the data vendor');
        assert.doesNotMatch(page, /\.csv|summary\.json|docs\/research|descarg/i, 'the study data is not given away');
    }
    const sm = read('sitemap.xml');
    assert.match(sm, /<loc>https:\/\/montaweb\.pe\/blog<\/loc>/);
    assert.match(sm, /<loc>https:\/\/montaweb\.pe\/blog\/estudio-web-negocios-lima-2026<\/loc>/);
});

test('the anonymised CSV carries no names or phone numbers', () => {
    const head = read('docs/research/lima-web-census/data/businesses-anon.csv').split('\n')[0];
    assert.doesNotMatch(head, /name|phone|tel|address|direcc|cid|url/i);
});

test('article uses the shared shell and loads its own css and js', () => {
    assert.match(art, /css\/site\.css\?v=\d{8}[a-z]?/);
    assert.match(art, /css\/blog\.css\?v=\d{8}[a-z]?/);
    assert.match(art, /js\/blog\.js\?v=\d{8}[a-z]?/);
    assert.match(art, /class="site-header" id="site-header"/);
    assert.match(art, /<main[^>]*id="contenido"/);
    assert.ok(existsSync(path.join(ROOT, 'css/blog.css')) && existsSync(path.join(ROOT, 'js/blog.js')));
});
