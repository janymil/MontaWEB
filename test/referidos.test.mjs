import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT } from './dom-harness.mjs';

const read = file => readFileSync(path.join(ROOT, file), 'utf8');
const page = read('referidos.html');

// Boots the real js/referidos.js against the few DOM nodes it touches.
function boot(search) {
    const node = () => ({ hidden: true, textContent: '', value: '', href: '', attrs: {}, on: {},
        addEventListener(type, fn) { this.on[type] = fn; },
        setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }, focus() {} });
    const els = {};
    const doc = node();
    doc.getElementById = id => (els[id] ??= node());
    const opened = [];
    vm.runInNewContext(read('js/referidos.js'), { document: doc, location: { search },
        window: { open: url => opened.push(url) }, URLSearchParams, URL, encodeURIComponent });
    const click = (href, skip = false, id = '') => {
        const link = { href, id, hasAttribute: name => skip && name === 'data-ref-skip' };
        const closest = selector => (href.startsWith(selector.match(/\^="(.*)"\]/)[1]) ? link : null);
        doc.on.click?.({ target: { closest } });
        return decodeURIComponent(link.href);
    };
    const share = value => {
        doc.getElementById('ref-share-code').value = value;
        doc.getElementById('ref-share-form').on.submit({ preventDefault() {} });
    };
    return { el: id => doc.getElementById(id), click, share, opened };
}

test('referidos: a code in the URL (any case) shows the banner and goes into every WhatsApp link to us', () => {
    const ref = boot('?ref=%20eden24');
    assert.equal(ref.el('ref-welcome').hidden, false);
    assert.equal(ref.el('ref-code-label').textContent, 'EDEN24');
    assert.match(decodeURIComponent(ref.el('ref-welcome-cta').href), /código EDEN24/);
    assert.match(ref.click('https://wa.me/51965403196?text=Hola'), /código EDEN24/, 'header and floating buttons');
    assert.match(ref.click('https://wa.me/51965403196'), /código EDEN24/, 'footer link');
    assert.equal(ref.click('https://wa.me/51965403196?text=cliente', true), 'https://wa.me/51965403196?text=cliente');
    assert.equal(ref.click('https://wa.me/?text=x'), 'https://wa.me/?text=x', 'share links are not ours');
    assert.match(page, /data-ref-skip[^>]*>[\s\S]{0,120}Pedir mi código/);
});

test('referidos: the price quote keeps its message and gains the code once', () => {
    const ref = boot('?ref=eden24');
    const quote = `https://wa.me/51965403196?text=${encodeURIComponent('Presupuesto: Web Simple S/ 99 & extras')}`;
    const once = ref.click(quote, false, 'calcWhatsapp');
    assert.match(once, /Presupuesto: Web Simple S\/ 99 & extras\n\nCódigo de referido: EDEN24$/);
    const twice = ref.click(`https://wa.me/51965403196?text=${encodeURIComponent(once.split('?text=')[1])}`, false, 'calcWhatsapp');
    assert.equal(twice.match(/Código de referido/g).length, 1);
});

test('referidos: no code or a bad code changes nothing', () => {
    for (const search of ['', '?ref=EDEN-24', '?ref=<b>']) {
        const ref = boot(search);
        assert.equal(ref.el('ref-welcome').hidden, true, search);
        assert.equal(ref.click('https://wa.me/51965403196'), 'https://wa.me/51965403196', search);
    }
});

test('referidos: the share form builds the link, rejects bad codes and clears the error on typing', () => {
    const ref = boot('');
    ref.share('x!');
    assert.equal(ref.opened.length, 0);
    assert.equal(ref.el('ref-share-code').attrs['aria-invalid'], 'true');
    ref.el('ref-share-code').on.input();
    assert.equal(ref.el('ref-share-code').attrs['aria-invalid'], undefined);
    assert.equal(ref.el('ref-share-status').textContent, '');
    ref.share('eden24');
    assert.match(decodeURIComponent(decodeURIComponent(ref.opened[0])), /montaweb\.pe\/referidos\?ref=EDEN24/);
});

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
    const plain = html => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const answers = [...page.matchAll(/<\/summary>([\s\S]*?)<\/details>/g)].map(m => plain(m[1]));
    assert.deepEqual(faq.mainEntity.map(q => plain(q.acceptedAnswer.text)), answers);
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
    const pages = [...readdirSync(ROOT), ...readdirSync(path.join(ROOT, 'blog')).map(n => `blog/${n}`)];
    for (const f of pages.filter(n => n.endsWith('.html'))) {
        const html = read(f);
        if (!html.includes('<h3>Explora</h3>')) continue;
        assert.match(html, /<h3>Explora<\/h3>.*href="\/referidos"/, f);
    }
});

test('referidos: every offer of the free profile states the S/ 99 minimum', () => {
    const msg = read('docs/plans/2026-11-25-referral-messages.md').split('## 1.')[1].split('## 2.')[0];
    const offers = [
        ...page.match(/<meta (name="description"|property="og:description")[^>]*>/g),
        ...(page.match(/<(p|li)[^>]*>[^\n]*?<\/(p|li)>/g) || []).filter(t => /Google Mi Negocio/.test(t) && /gratis|sin costo/.test(t)),
        ...read('js/referidos.js').split('\n').filter(l => l.includes('Google Mi Negocio')),
        ...read('llms.txt').split('\n').filter(l => l.includes('[Referidos]')),
        ...msg.split('\n').filter(l => l.includes('Google Mi Negocio')),
    ];
    assert.ok(offers.length >= 8, `found ${offers.length}`);
    for (const offer of offers) assert.match(offer, /S\/ 99/, offer);
});
