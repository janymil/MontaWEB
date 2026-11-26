// /comparar pages: data rules (docs/COMPARATIVA.md) and generated output.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as D from '../scripts/compare/competitors.mjs';
import { buildAll } from '../scripts/build-compare.mjs';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8').replace(/\r\n/g, '\n');
const pages = buildAll();
const text = html => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

test('every competitor has a dated source, and every cell either cites one or is unlisted', () => {
  for (const c of D.COMPETITORS) {
    assert.ok(c.sources.length, c.slug);
    for (const s of c.sources) {
      assert.match(s.url, /^https:\/\//, `${c.slug} url`);
      assert.match(s.checked, /^\d{4}-\d{2}-\d{2}$/, `${c.slug} date`);
    }
    const builderCells = (c.builders || []).map(b => ({ id: b.cell }));
    for (const r of [...D.rowsFor(c), ...builderCells]) {
      const cell = c.cells[r.id];
      assert.ok(cell, `${c.slug} is missing row ${r.id}`);
      assert.ok(D.CELL_LABEL[cell.k], `${c.slug}.${r.id} kind`);
      if (cell.k !== 'unlisted') {
        assert.ok(c.sources.some(s => s.id === cell.src), `${c.slug}.${r.id} has no source`);
        assert.ok(cell.quotes?.length, `${c.slug}.${r.id} states a fact without a quote to check`);
      }
    }
  }
});

test('MontaWeb has every row', () => {
  for (const r of D.ROWS) assert.ok(D.MONTAWEB.cells[r.id], r.id);
  for (const r of D.FACT_ROWS) assert.ok(D.MONTAWEB.facts[r.id], `facts.${r.id}`);
});

test('MontaWeb figures (tables and the quote guide) match /servicios and /terminos', () => {
  const site = text(read('servicios.html') + read('terminos.html')).toLowerCase();
  const claims = [...Object.entries(D.MONTAWEB.cells), ...Object.entries(D.MONTAWEB.facts).map(([k, v]) => [`facts.${k}`, v]),
    ...D.GUIDE.questions.map((q, i) => [`guide.q${i + 1}`, q]), ...D.GUIDE.faq.filter(f => f.mustAppear).map(f => ['guide.faq', f])];
  for (const [row, cell] of claims) {
    assert.ok(cell.mustAppear?.length, `MontaWeb ${row} has no mustAppear`);
    for (const s of cell.mustAppear) assert.ok(site.includes(s.toLowerCase()), `MontaWeb ${row}: "${s}" not on servicios/terminos`);
  }
});

test('facts-only pages carry no amounts, and price pages are the only ones in the hub table', () => {
  for (const c of D.FACTS_PAGES) {
    for (const [id, cell] of Object.entries(c.cells)) {
      assert.equal(cell.amount, undefined, `${c.slug}.${id} has an amount`);
      assert.doesNotMatch(cell.text || '', /\d[\d.,]*\s*(dólares|USD|€)|S\/\s?\d/, `${c.slug}.${id} states an amount`);
    }
    assert.doesNotMatch(text(pages[`comparar/${c.slug}.html`]), /\bUS\$|\bUSD\b|€/, c.slug);
  }
  for (const c of D.PRICE_COMPETITORS) assert.ok(['landing', 'web', 'store'].some(k => typeof c.cells[k].amount === 'number'), `${c.slug} has no soles price`);
});

test('we never repeat a competitor\'s claims about itself', () => {
  const selfClaims = [/\d+\s*años de experiencia/i, /más de \d[\d.,]*\s*(empresas|clientes|proyectos)/i, /\d+\s*reseñas/i, /desde (19|20)\d\d/i];
  for (const [f, html] of Object.entries(pages)) for (const re of selfClaims) assert.doesNotMatch(text(html), re, `${f}: ${re}`);
});

test('the quote guide names no company', () => {
  const html = text(pages[`comparar/${D.GUIDE.slug}.html`]);
  for (const c of D.COMPETITORS) assert.ok(!html.includes(c.name), `guide mentions ${c.name}`);
  for (const b of D.FACTS_PAGES.flatMap(c => c.builders || [])) assert.ok(!html.includes(b.name), `guide mentions ${b.name}`);
});

test('dropped comparison pages are gone, redirected, and out of the sitemap', () => {
  const caddy = read('deploy/Caddyfile');
  const sm = read('sitemap.xml');
  for (const slug of ['nubix', 'kozma-360', 'talentuperu']) {
    assert.ok(!existsSync(new URL(`comparar/${slug}.html`, root)), `comparar/${slug}.html still exists`);
    assert.match(caddy, new RegExp(`@comparar_dropped path[^\\n]*/comparar/${slug}(\\s|$)`), `no redirect for ${slug}`);
    assert.ok(!sm.includes(`/comparar/${slug}<`), `${slug} still in sitemap`);
  }
  assert.match(caddy, /redir @comparar_dropped \/comparar 301/);
});

test('prices were checked in the last 45 days (re-check every month)', () => {
  const age = (Date.now() - Date.parse(`${D.VERIFIED_ON}T12:00:00-05:00`)) / 864e5;
  assert.ok(age <= D.STALE_AFTER_DAYS, `VERIFIED_ON ${D.VERIFIED_ON} is ${Math.round(age)} days old: run node scripts/compare-evidence.mjs and update the data`);
  for (const c of D.COMPETITORS) for (const s of c.sources) assert.equal(s.checked, D.VERIFIED_ON, `${c.slug}: ${s.id} not re-checked`);
});

test('generated pages are up to date (run node scripts/build-compare.mjs)', () => {
  for (const [f, html] of Object.entries(pages)) {
    assert.ok(existsSync(new URL(f, root)), `${f} missing`);
    assert.equal(read(f), html, `${f} is stale`);
  }
});

test('no superlatives, savings claims or foreign-currency amounts', () => {
  const banned = [/más barat/i, /el mejor/i, /la mejor/i, /\bahorr/i, /precio real/i, /número 1|n[°º] ?1/i, /\bUSD\b|US\$|\$ ?\d/, /€/, /garantizamos el menor/i];
  for (const [f, html] of Object.entries(pages)) for (const re of banned) assert.doesNotMatch(text(html), re, `${f}: ${re}`);
});

test('each page has canonical, FAQ and breadcrumb schema, and the trademark note', () => {
  for (const [f, html] of Object.entries(pages)) {
    assert.match(html, /<link rel="canonical" href="https:\/\/montaweb\.pe\/comparar/, f);
    assert.match(html, /"@type":"FAQPage"/, f);
    assert.match(html, /"@type":"BreadcrumbList"/, f);
    if (f !== `comparar/${D.GUIDE.slug}.html`) { // the guide names no company and shows no competitor price
      assert.ok(html.includes('son marcas de sus respectivos dueños'), f);
      assert.ok(html.includes('No sumamos impuestos ni convertimos monedas'), f);
    }
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
    assert.doesNotThrow(() => JSON.parse(ld), f);
  }
});

test('sitemap lists every comparison page', () => {
  const sm = read('sitemap.xml');
  for (const f of Object.keys(pages)) assert.ok(sm.includes(`https://montaweb.pe/${f.replace(/\.html$/, '')}</loc>`), f);
});

test('homepage calculator no longer shows an unsourced "otras agencias" price range', () => {
  const app = read('js/app.js');
  assert.doesNotMatch(app, /Otras agencias/);
  assert.doesNotMatch(app, /Ahorras entre/);
  assert.match(app, /\/comparar/);
});

test('scrolled sideways, the first column header stays over the row labels and nothing leaks out of the table box', () => {
  const css = read('css/compare.css');
  assert.match(css, /\.cmp-table thead th:first-child \{[^}]*position:sticky; inset-inline-start:0;/);
  // without a positioned wrapper the hidden "fuente" text widens the whole page
  assert.match(css, /\.cmp-table-wrap \{ position:relative;/);
});
