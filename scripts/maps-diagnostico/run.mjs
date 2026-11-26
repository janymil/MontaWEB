#!/usr/bin/env node
// CLI: one business -> docs/research/maps-diagnostico/private/reports/<id>/{index.html,report.png,report.pdf}
//   node scripts/maps-diagnostico/run.mjs --name "..." --cid ... --lat ... --lng ... --keyword ... --district ...
//   node scripts/maps-diagnostico/run.mjs --from-census <cid>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import { buildGrid } from './grid.mjs';
import { probeSite } from './probe.mjs';
import { positionOf, scoreFromPositions, rankCompetitors, profileOf, chooseFixes } from './score.mjs';
import { fetchCell, balance, totalSpent, PRIVATE, REPO, BUDGET_USD } from './fetch.mjs';
import { render } from './render.mjs';
import { snapshot } from './snapshot.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function censusDir() {
  const rel = path.join('docs', 'research', 'lima-web-census');
  const here = path.join(REPO, rel);
  if (fs.existsSync(path.join(here, 'raw'))) return here;
  const i = REPO.indexOf(`${path.sep}.claude${path.sep}worktrees`);
  if (i > 0) {
    const main = path.join(REPO.slice(0, i), rel);
    if (fs.existsSync(path.join(main, 'raw'))) return main;
  }
  throw new Error('census raw data not found');
}

function categoryQueries(dir) {
  const harvest = path.resolve(dir, '..', '..', '..', 'scripts', 'lima-web-census', 'harvest.py');
  const map = {};
  try {
    for (const m of fs.readFileSync(harvest, 'utf8').matchAll(/"(\w+)":\s*\("[PCE]",\s*"([^"]+)"/g)) map[m[1]] = m[2];
  } catch { /* fall back to the category name */ }
  return map;
}

function fromCensus(cid) {
  const dir = censusDir();
  const rawDir = path.join(dir, 'raw');
  for (const f of fs.readdirSync(rawDir).filter((x) => x.endsWith('.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(rawDir, f), 'utf8'));
    const it = (j.items || []).find((i) => i.cid === cid && i.latitude != null);
    if (!it) continue;
    let rec = {};
    try {
      rec = JSON.parse(fs.readFileSync(path.join(dir, 'private', 'businesses.json'), 'utf8')).find((b) => b.id === cid) || {};
    } catch { /* optional */ }
    const q = categoryQueries(dir);
    return {
      name: it.title, cid, place_id: it.place_id, lat: it.latitude, lng: it.longitude,
      keyword: q[j.cat] || j.cat, district: rec.district || j.district, census: it,
    };
  }
  throw new Error(`cid ${cid} not found in census raw data`);
}

const limaDate = () => new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date());

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

async function main() {
  const { values: a } = parseArgs({
    options: {
      name: { type: 'string' }, cid: { type: 'string' }, 'place-id': { type: 'string' },
      lat: { type: 'string' }, lng: { type: 'string' }, keyword: { type: 'string' },
      district: { type: 'string' }, spacing: { type: 'string', default: '700' },
      'from-census': { type: 'string' },
    },
  });
  let biz;
  if (a['from-census']) {
    biz = fromCensus(a['from-census']);
    if (a.keyword) biz.keyword = a.keyword;
    if (a.district) biz.district = a.district;
  } else {
    for (const k of ['name', 'cid', 'lat', 'lng', 'keyword', 'district']) if (!a[k]) throw new Error(`missing --${k}`);
    biz = { name: a.name, cid: a.cid, place_id: a['place-id'], lat: Number(a.lat), lng: Number(a.lng), keyword: a.keyword, district: a.district };
  }
  const spacing = Number(a.spacing);
  const cacheKey = `${biz.cid}-${spacing}m-${biz.keyword.replace(/\W+/g, '_')}`;
  const grid = buildGrid(biz.lat, biz.lng, spacing);

  console.log(`Business: ${biz.name} | ${biz.keyword} | ${biz.district} | spent so far: US$${totalSpent().toFixed(4)} of ${BUDGET_USD}`);
  const results = await pool(grid, 5, (point) => fetchCell({ key: cacheKey, point, keyword: biz.keyword }));
  const cost = results.reduce((s, r) => s + r.cost, 0);
  const fresh = results.filter((r) => !r.cached).length;

  const target = { cid: biz.cid, place_id: biz.place_id, title: biz.name };
  const cells = grid.map((p, i) => ({ ...p, items: results[i].items, position: positionOf(results[i].items, target) }));
  const score = scoreFromPositions(cells.map((c) => c.position));

  let selfItem = null;
  for (const c of cells) {
    const hit = c.items.find((i) => i.cid === biz.cid) || (biz.place_id && c.items.find((i) => i.place_id === biz.place_id));
    if (hit) { selfItem = hit; break; }
  }
  const self = selfItem ? profileOf(selfItem) : { ...profileOf({ title: biz.name }), name: biz.name };
  const competitors = rankCompetitors(cells, target, 3).map((c) => profileOf(c.item));
  if (self.website === true && selfItem?.url) {
    const site = await probeSite(selfItem.url);
    console.log(`Website check: ${selfItem.url} -> ${site}`);
    if (site === 'broken') self.websiteBroken = true;
    if (site === 'social') self.website = false;
  }
  const fixes = chooseFixes(self, competitors);

  const id = crypto.randomBytes(9).toString('base64url');
  const data = { id, business: biz.name, keyword: biz.keyword, district: biz.district, date: limaDate(), score, cells, self, competitors, fixes };
  const copy = JSON.parse(fs.readFileSync(path.join(HERE, 'copy-es.json'), 'utf8'));
  const outDir = path.join(PRIVATE, 'reports', id);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), render(copy, data));
  const height = await snapshot(path.join(outDir, 'index.html'));

  const bal = await balance();
  const missing = ['rating', 'reviews', 'photos', 'website', 'hours', 'claimed']
    .filter((k) => [self, ...competitors].every((p) => p[k] === null));
  console.log(`Report id: ${id} | score: ${score} | self found in ${cells.filter((c) => c.position).length}/25 cells | fixes: ${fixes.map((f) => f.key).join(',') || '-'}`);
  console.log(`Fields missing for all businesses: ${missing.join(',') || 'none'} | self from SERP: ${!!selfItem}`);
  console.log(`Cost this report: US$${cost.toFixed(4)} (${fresh} paid calls, ${25 - fresh} cached) | total Phase 0: US$${totalSpent().toFixed(4)} | balance after: US$${bal} | page height ${height}px`);
  console.log(`Output: ${outDir}`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
