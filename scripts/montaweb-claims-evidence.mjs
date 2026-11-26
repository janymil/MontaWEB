// Evidence for MontaWeb's OWN claims on /comparar (D. Leg. 1044 art. 8.3: the
// advertiser carries the burden of proof).
//   node scripts/montaweb-claims-evidence.mjs [--out DIR] [--commit SHA] [--proxy URL] [--archive] [--no-banner]
// --no-banner: second pass with the cookie notice closed («Rechazar»), so it covers no
// claim, plus the hub table scrolled to its right-hand columns. Use another --out.
// Stamped captures of the live pages, plus the data and legal pages exactly as in
// the deployed git commit (default: the HEAD of /var/www/montaweb on Washington).
// DIR defaults to docs/evidence/comparar/<date>/claims.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { COMPETITORS } from './compare/competitors.mjs';
import { openBrowser } from './lib/capture.mjs';
import { arg, archiveAll, archiveText, assertEmpty, limaDay, limaStamp, sha256File } from './lib/evidence.mjs';

const args = process.argv.slice(2);
const out = resolve(arg(args, '--out') ?? `docs/evidence/comparar/${limaDay()}/claims`);
const proxy = arg(args, '--proxy');
const SITE = 'https://montaweb.pe';
assertEmpty(out); // already holds a capture: stop
if (existsSync(join(out, '..', 'SHA256SUMS'))) throw new Error(`${join(out, '..')} is sealed: use a new --out folder.`);
mkdirSync(out, { recursive: true });

const run = (cmd, a) => execFileSync(cmd, a, { maxBuffer: 32 << 20 });
const commit = arg(args, '--commit') ?? run('ssh', ['washington', 'git -C /var/www/montaweb rev-parse HEAD']).toString().trim();
const copies = ['scripts/compare/competitors.mjs', 'servicios.html', 'terminos.html'].map(f => {
  const name = `${f.split('/').pop()}@${commit.slice(0, 8)}.txt`;
  writeFileSync(join(out, name), run('git', ['show', `${commit}:${f}`]));
  return { file: name, source: f, sha256: sha256File(join(out, name)) };
});

const PAGES = [
  ['servicios', '/servicios', 'Precios, qué incluye cada plan y plazos de MontaWeb'],
  ['terminos', '/terminos', 'IGV, hosting el primer año, dominio, propiedad y devoluciones'],
  ['comparar', '/comparar', 'La tabla comparativa tal como la ve el público'],
  ...COMPETITORS.map(c => [`comparar-${c.slug}`, `/comparar/${c.slug}`, `Página comparativa con ${c.name}`]),
  ['inicio', '/', 'Portada: precio de MontaWeb en la calculadora'],
];

const noBanner = args.includes('--no-banner');
const REJECT = `(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Rechazar'); if (b) return b.click(); if (!localStorage.getItem('mw-consent-v1')) throw new Error('no «Rechazar» button and no stored choice'); })()`;
const SCROLL_RIGHT = `[...document.querySelectorAll('*')].filter(e => e.querySelector('table') && e.scrollWidth > e.clientWidth + 5).forEach(e => { e.scrollLeft = e.scrollWidth; })`;
if (noBanner) PAGES.splice(3, 0, ['comparar-tabla-derecha', '/comparar', 'La misma tabla, desplazada a las últimas columnas', SCROLL_RIGHT]);

const browser = await openBrowser({ proxy });
const country = await browser.exitCountry();
const started = limaStamp();
const log = [];
let problems = country === 'PE' ? 0 : 1;
if (problems) console.log(`COUNTRY  exit is ${country}, not PE`);
for (const [name, path, proves, scroll] of PAGES) {
  const url = `${SITE}${path}`;
  try {
    const { html, ...shot } = await browser.capture(url, out, name, {
      purpose: `Prueba: ${proves}.${noBanner ? ' Aviso de cookies cerrado con «Rechazar».' : ''} Evidencia MontaWeb /comparar`,
      prepare: [noBanner && REJECT, scroll].filter(Boolean).join(';') || undefined,
    });
    log.push({ name, proves, ...shot });
    problems += shot.problems.length;
    console.log(`${shot.problems.length ? 'fail' : 'ok  '}  ${url}  HTTP ${shot.status}  ${shot.problems.join('; ')}`);
  } catch (e) {
    problems++;
    log.push({ name, proves, url, files: [], error: String(e.message || e).slice(0, 300) });
    console.log(`ERROR ${url}: ${e.message}`);
  }
}
await browser.close();

// sitemap.xml is saved as served (it is what shows which pages were public).
try {
  const res = await fetch(`${SITE}/sitemap.xml`, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  writeFileSync(join(out, 'sitemap.xml'), Buffer.from(await res.arrayBuffer()));
} catch (e) { problems++; console.log(`ERROR sitemap.xml: ${e.message}`); }
const sitemapFiles = existsSync(join(out, 'sitemap.xml')) ? [{ file: 'sitemap.xml', sha256: sha256File(join(out, 'sitemap.xml')) }] : [];

const archives = args.includes('--archive') ? await archiveAll(log.filter(e => !e.error).map(e => e.url), out) : [];
for (const e of log) {
  const r = archives.find(x => x.url === e.url);
  if (r) e.archive = { snapshot: r.snapshot, note: r.note };
}

writeFileSync(join(out, 'log.json'), JSON.stringify({ started, commit, site: SITE, exitCountry: country, method: browser.method, copies, entries: log }, null, 2));
writeFileSync(join(out, 'LOG.md'), [
  `# Evidencia de las afirmaciones propias de MontaWeb — ${started}`,
  '',
  `Commit desplegado: \`${commit}\`. Sitio: ${SITE}. País de salida a internet: ${country}. Capturado con ${browser.method}.`,
  '',
  '| Captura | URL | Prueba | Hora | HTTP | archive.org |',
  '| --- | --- | --- | --- | --- | --- |',
  ...log.map(e => `| ${e.name} | ${e.url} | ${e.proves} | ${e.at ?? ''} | ${e.status ?? e.error}${e.problems?.length ? ` · ${e.problems.join('; ')}` : ''} | ${archiveText(e.archive)} |`),
  '',
  '## Archivos (SHA-256)',
  ...[...copies, ...log.flatMap(e => e.files), ...sitemapFiles].map(f => `- ${f.file} \`${f.sha256}\``),
  '',
].join('\n'));
console.log(`\n${out}\ncommit ${commit.slice(0, 8)}, ${log.length} pages, ${problems} problem(s)`);
process.exitCode = problems ? 1 : 0;
