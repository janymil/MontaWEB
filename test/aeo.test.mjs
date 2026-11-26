import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const read = f => readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const plain = html => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const ldBlocks = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
const findFaq = html => ldBlocks(html).flatMap(b => b['@graph'] || [b]).find(n => n['@type'] === 'FAQPage');

test('llms.txt exists, starts with an H1 and links only to pages that exist', () => {
    assert.ok(existsSync(path.join(ROOT, 'llms.txt')));
    const txt = read('llms.txt').replace(/\r\n/g, '\n'); // Windows checkouts (core.autocrlf) use CRLF
    assert.match(txt, /^# MontaWeb\n\n> /);
    const links = [...txt.matchAll(/\]\((https:\/\/montaweb\.pe\/[^)]*)\)/g)].map(m => m[1]);
    assert.ok(links.length >= 8);
    for (const url of links) {
        const p = decodeURIComponent(new URL(url).pathname).replace(/^\//, '') || 'index';
        assert.ok(existsSync(path.join(ROOT, `${p}.html`)), `${url} has no page`);
    }
});

test('robots.txt: every user-agent group still blocks /api/', () => {
    const ruleGroups = read('robots.txt').split(/\n\s*\n/).filter(g => /User-agent:/.test(g));
    assert.ok(ruleGroups.length >= 2);
    for (const g of ruleGroups) assert.match(g, /^Disallow: \/api\/$/m, g.split('\n')[0]);
    for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
        assert.match(read('robots.txt'), new RegExp(`^User-agent: ${bot}$`, 'm'));
    }
});

for (const [page, qSel] of [['index.html', /<summary><span>\d+<\/span>(.*?)<i/g], ['servicios.html', /<div class="faq-q"><h3>(.*?)<\/h3>/g]]) {
    test(`${page}: FAQPage markup matches the visible FAQ word for word`, () => {
        const html = read(page);
        const faq = findFaq(html);
        assert.ok(faq, 'FAQPage present');
        const visibleQs = [...html.matchAll(qSel)].map(m => plain(m[1]));
        assert.deepEqual(faq.mainEntity.map(q => q.name), visibleQs);
        const body = plain(html);
        for (const q of faq.mainEntity) assert.ok(body.includes(q.acceptedAnswer.text), `answer not visible: ${q.name}`);
    });
}

test('study page has a citation box with the canonical URL', () => {
    const html = read('blog/estudio-web-negocios-lima-2026.html');
    assert.match(html, /<aside class="cite-box"[^>]*>[\s\S]*?Cómo citar este estudio[\s\S]*?https:\/\/montaweb\.pe\/blog\/estudio-web-negocios-lima-2026[\s\S]*?<\/aside>/);
});
