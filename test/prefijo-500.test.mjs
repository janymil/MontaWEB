import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const read = f => readFileSync(path.join(ROOT, f), 'utf8');
const SLUG = 'prefijo-500-llamadas-comerciales';
const art = read(`blog/${SLUG}.html`);

test('prefijo 500 article: SEO basics', () => {
    const title = art.match(/<title>(.*?)<\/title>/)[1];
    const desc = art.match(/<meta name="description" content="(.*?)"/)[1];
    assert.ok(title.length <= 60, `title ${title.length}`);
    assert.ok(desc.length <= 155, `description ${desc.length}`);
    assert.match(art, /<html lang="es-PE"/);
    assert.match(art, new RegExp(`rel="canonical" href="https://montaweb\.pe/blog/${SLUG}"`));
    assert.match(art, /og:image" content="https:\/\/montaweb\.pe\/images\/blog\/og-prefijo-500\.png"/);
    assert.ok(existsSync(path.join(ROOT, 'images/blog/og-prefijo-500.png')));
    assert.equal([...art.matchAll(/<h1[ >]/g)].length, 1);
});

test('prefijo 500 article: JSON-LD parses, FAQ matches the visible FAQ', () => {
    const ld = JSON.parse(art.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const types = ld['@graph'].map(n => n['@type']);
    for (const t of ['Article', 'BreadcrumbList', 'FAQPage']) assert.ok(types.includes(t), t);
    const faq = ld['@graph'].find(n => n['@type'] === 'FAQPage');
    const visible = [...art.matchAll(/<details><summary>(.*?)<\/summary>/g)].map(m => m[1]);
    assert.ok(faq.mainEntity.length >= 5);
    for (const q of faq.mainEntity) assert.ok(visible.some(v => v.replace(/&nbsp;/g, ' ').startsWith(q.name.slice(0, 25))), q.name);
});

test('prefijo 500 article: internal links resolve, images exist, outbound links are safe', () => {
    for (const [, href] of art.matchAll(/href="(\/[^"#?]*)/g)) {
        const clean = decodeURIComponent(href);
        if (clean === '/') continue;
        const ok = [clean, clean + '.html', clean.replace(/^\//, '') + '.html'].some(f => existsSync(path.join(ROOT, f)));
        assert.ok(ok, `broken internal link ${href}`);
    }
    for (const [tag] of art.matchAll(/<img\b[^>]*>/g)) {
        assert.match(tag, /\balt="[^"]+"/); assert.match(tag, /\bwidth="\d+"/); assert.match(tag, /\bheight="\d+"/);
        assert.ok(existsSync(path.join(ROOT, tag.match(/src="([^"]+)"/)[1])), tag);
    }
    for (const [tag] of art.matchAll(/<a [^>]*target="_blank"[^>]*>/g)) assert.match(tag, /rel="noopener"/, tag);
    for (const src of ['busquedas.elperuano.pe/dispositivo/NL/2554556-3', 'gob.pe/institucion/indecopi', 'gob.pe/institucion/osiptel'])
        assert.ok(art.includes(src), src);
});

test('prefijo 500 article: key facts stay as verified', () => {
    for (const fact of ['018-2026-MTC', '15 de marzo de 2027', 'Ley 32323', '450 UIT', '1 537 250', '411 840', '118 195'])
        assert.ok(art.replace(/&nbsp;/g, ' ').includes(fact), fact);
    assert.doesNotMatch(art, /dataforseo|docs\/research|como en la radio|generad[oa]s? con IA/i);
});

test('prefijo 500 article is listed in the blog index, sitemap and llms.txt, and loads its assets', () => {
    assert.ok(read('blog.html').includes(`href="/blog/${SLUG}"`));
    assert.match(read('sitemap.xml'), new RegExp(`<loc>https://montaweb\.pe/blog/${SLUG}</loc>`));
    assert.ok(read('llms.txt').includes(`/blog/${SLUG}`));
    assert.match(art, /css\/prefijo-500\.css\?v=\d{8}[a-z]?/);
    assert.match(art, /js\/prefijo-500\.js\?v=\d{8}[a-z]?/);
    assert.ok(existsSync(path.join(ROOT, 'css/prefijo-500.css')) && existsSync(path.join(ROOT, 'js/prefijo-500.js')));
});

test('prefijo 500 article: video loads from YouTube only after a click', () => {
    assert.doesNotMatch(art, /<iframe[^>]+youtube/, 'no YouTube iframe in the static page');
    assert.match(art, /<button[^>]+data-yt="eWcyFwyDCPI"/);
    assert.ok(existsSync(path.join(ROOT, 'images/video/prefijo-500-poster.webp')));
    assert.match(read('js/prefijo-500.js'), /youtube-nocookie\.com\/embed\//);
    assert.match(read('privacidad.html'), /youtube-nocookie\.com/);
});
