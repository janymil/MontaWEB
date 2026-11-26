// /comparar pages: data rules (docs/COMPARATIVA.md) and generated output.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as D from '../scripts/compare/competitors.mjs';
import { buildAll } from '../scripts/build-compare.mjs';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8').replace(/\r\n/g, '\n');
const text = html => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

test('every competitor has a dated source, and every cell either cites one or is unlisted', () => {
  for (const c of D.COMPETITORS) {
    assert.ok(c.sources.length, c.slug);
    for (const s of c.sources) {
      assert.match(s.url, /^https:\/\//, `${c.slug} url`);
      assert.match(s.checked, /^\d{4}-\d{2}-\d{2}$/, `${c.slug} date`);
    }
    for (const r of D.ROWS) {
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
});

test('MontaWeb figures match /servicios and /terminos', () => {
  const site = text(read('servicios.html') + read('terminos.html')).toLowerCase();
  for (const [row, cell] of Object.entries(D.MONTAWEB.cells))
    for (const s of cell.mustAppear) assert.ok(site.includes(s.toLowerCase()), `MontaWeb ${row}: "${s}" not on servicios/terminos`);
});

test('prices were checked in the last 45 days (re-check every month)', () => {
  const age = (Date.now() - Date.parse(`${D.VERIFIED_ON}T12:00:00-05:00`)) / 864e5;
  assert.ok(age <= D.STALE_AFTER_DAYS, `VERIFIED_ON ${D.VERIFIED_ON} is ${Math.round(age)} days old: run node scripts/compare-evidence.mjs and update the data`);
  for (const c of D.COMPETITORS) for (const s of c.sources) assert.equal(s.checked, D.VERIFIED_ON, `${c.slug}: ${s.id} not re-checked`);
});

const pages = buildAll();

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
    assert.ok(html.includes('son marcas de sus respectivos dueños'), f);
    assert.ok(html.includes('No sumamos impuestos ni convertimos monedas'), f);
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
