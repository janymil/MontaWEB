// Builds the compact dataset embedded in blog/estudio-web-negocios-lima-2026.html
// from docs/research/lima-web-census/data/businesses-anon.csv. Re-run: node scripts/build-blog-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const dir = new URL('../docs/research/lima-web-census/data/', import.meta.url);
function parseCsv(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const [h, ...r] = parseCsv(readFileSync(new URL('businesses-anon.csv', dir), 'utf8'));
const rows = r.filter(x => x.length === h.length).map(x => Object.fromEntries(h.map((k, i) => [k, x[i]])));
const indep = rows.filter(x => x.chain === 'False');
const active = indep.filter(x => +x.reviews >= 5);
const pct = (a, b) => Math.round(a / b * 1000) / 10;
const zones = ['Lima Moderna', 'Lima Centro', 'Lima Norte', 'Lima Sur', 'Lima Este'];
const cats = [...new Set(indep.map(x => x.cat))].sort();
const cell = {};
for (const c of cats) { cell[c] = {}; for (const z of zones) {
  const a = active.filter(x => x.cat === c && x.zone === z);
  cell[c][z] = [a.length, a.filter(x => x.state === 'functional').length];
} }
const out = { independent: indep.length, active: active.length, cell };
const dead = s => s.filter(x => x.web_class === 'dead_google_site').length;
console.log({ independent: indep.length, active: active.length, deadGoogleAll: dead(indep), deadGoogleActive: dead(active),
  functionalAll: indep.filter(x=>x.state==='functional').length });
writeFileSync(new URL('cell_category_zone_active.json', dir), JSON.stringify(out));

// ---- study data + category table spliced into the article between marker comments ----
const csv = f => { const [hh, ...rr] = parseCsv(readFileSync(new URL(f, dir), 'utf8')); return rr.filter(x => x.length === hh.length).map(x => Object.fromEntries(hh.map((k, i) => [k, x[i]]))); };
const catAll = csv('by_category.csv'), catAct = csv('by_category_active.csv');
const zAll = csv('by_zone.csv'), zAct = csv('by_zone_active.csv');
const segName = { 'Presentación': 'P', 'Complejo (reservas/pedidos)': 'C', 'Tienda online': 'T' };
const categories = catAct.map(a => { const l = catAll.find(x => x.group === a.group);
  return { k: a.group, label: a.label, seg: segName[a.segment], all: { n: +l.businesses, pct: +l.functional_site_pct },
    active: { n: +a.businesses, pct: +a.functional_site_pct, demand: +a.proven_demand_no_site } }; });
const zoneKey = { 'Lima Moderna': 'moderna', 'Lima Centro': 'centro', 'Lima Norte': 'norte', 'Lima Sur': 'sur', 'Lima Este': 'este' };
const zonesOut = zAct.map(a => { const l = zAll.find(x => x.group === a.group);
  return { name: a.group, key: zoneKey[a.group], all: { n: +l.businesses, pct: +l.functional_site_pct }, active: { n: +a.businesses, pct: +a.functional_site_pct } }; });
const fun = JSON.parse(readFileSync(new URL('summary.json', dir), 'utf8'));
const g = (m, ks) => Math.round(ks.reduce((s, k) => s + (m[k] || 0), 0) * 10) / 10;
const stack = m => ({ ok: g(m, ['functional']), none: g(m, ['none']), social: g(m, ['social_only']), broken: g(m, ['broken', 'parked', 'redirects_social']), plat: g(m, ['platform_only', 'directory_only']) });
const study = { independent: fun.independent, active: fun.active_5plus_reviews, categories, zones: zonesOut,
  stack: { all: stack(fun.state_pct_independent), active: stack(fun.state_pct_active) }, cell: cell, cats: Object.fromEntries(categories.map(c => [c.k, c.label])) };
const rowsHtml = [...categories].sort((a, b) => b.active.pct - a.active.pct).map(c =>
  `<tr><td>${c.label[0].toUpperCase() + c.label.slice(1)}</td><td>${c.active.n}</td><td>${String(c.active.pct).replace('.', ',')} %</td><td>${c.active.demand}</td></tr>`).join('\n');
const table = `<table><thead><tr><th>Rubro</th><th>Negocios activos</th><th>Con web que funciona</th><th>Con 20+ reseñas y sin web</th></tr></thead><tbody>\n${rowsHtml}\n</tbody></table>`;
const splice = (html, tag, body) => html.replace(new RegExp(`(<!--${tag}-->)[\\s\\S]*?(<!--/${tag}-->)`), (_, a, b) => `${a}\n${body}\n${b}`);
import { existsSync } from 'node:fs';
const art = new URL('../blog/estudio-web-negocios-lima-2026.html', import.meta.url);
if (existsSync(art)) {
  let html = readFileSync(art, 'utf8');
  html = splice(html, 'STUDY-DATA', `<script type="application/json" id="study-data">${JSON.stringify(study)}</script>`);
  html = splice(html, 'CAT-TABLE', table);
  writeFileSync(art, html);
  console.log('spliced data + table into the article');
}
