import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const read = file => readFileSync(path.join(ROOT, file), 'utf8');
const page = read('referidos.html');

test('referidos: three steps, both rewards, FAQ as details and terms', () => {
    assert.equal((page.match(/<ol class="ref-steps">([\s\S]*?)<\/ol>/)[1].match(/<li>/g) || []).length, 3);
    assert.match(page, /S\/ 20 <span>por Yape/);
    assert.match(page, /S\/ 40 <span>menos en tu hosting/);
    assert.match(page, /Google Mi Negocio <span>gratis/);
    assert.ok((page.match(/<details>/g) || []).length >= 4, 'FAQ items');
    assert.doesNotMatch(page, /<summary>[^<]*<h\d/, 'no headings inside summary');
    assert.match(page, /id="condiciones"/);
});

test('referidos: FAQ JSON-LD matches the visible questions', () => {
    const ld = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const faq = ld['@graph'].find(n => n['@type'] === 'FAQPage');
    const visible = [...page.matchAll(/<summary>(.*?)<\/summary>/g)].map(m => m[1]);
    assert.deepEqual(faq.mainEntity.map(q => q.name), visible);
});

test('referidos: script puts the code in the WhatsApp message and validates it', () => {
    const js = read('js/referidos.js');
    assert.match(page, /js\/referidos\.js\?v=\d{8}[a-z]?/);
    assert.match(js, /new URLSearchParams\(location\.search\)\.get\('ref'\)/);
    assert.match(js, /\/\^\[A-Z0-9\]\{3,12\}\$\//);
    assert.match(js, /encodeURIComponent\(text\)/);
    assert.match(js, /textContent = code/, 'code is written as text, never as HTML');
});

test('referidos: in the sitemap and in every footer', () => {
    assert.match(read('sitemap.xml'), /<loc>https:\/\/montaweb\.pe\/referidos<\/loc>/);
    for (const f of readdirSync(ROOT).filter(n => n.endsWith('.html'))) {
        const html = read(f);
        if (!html.includes('<h3>Explora</h3>')) continue;
        assert.match(html, /<h3>Explora<\/h3>.*href="\/referidos"/, f);
    }
});
