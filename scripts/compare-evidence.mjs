// Evidence pack for /comparar: competitor sources (docs/COMPARATIVA.md). Run it from
// Lima so the pages are seen as a Peruvian visitor sees them:
//   node scripts/compare-evidence.mjs [--out DIR] [--proxy socks5://127.0.0.1:11080] [--archive]
// For every source in scripts/compare/competitors.mjs it saves, with headless Chrome:
//   <id>.html  the DOM after scripts ran,   <id>.txt  its visible text,
//   <id>.png   a stamped full-page capture, <id>.pdf  a stamped print,
// then checks that every `quote` appears in that source, and writes LOG.md, log.json
// (Lima time, HTTP status, SHA-256 per file), RECHECK.md and, with --archive, ARCHIVES.md.
// Exit code 1 when a quote is missing: the page changed, so fix the data first.
// Afterwards: montaweb-claims-evidence.mjs, evidence-seal.mjs, upload-evidence.mjs.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { COMPETITORS } from './compare/competitors.mjs';
import { openBrowser } from './lib/capture.mjs';
import { arg, archiveAll, assertEmpty, limaDay, limaStamp, norm, sha256File, visibleText } from './lib/evidence.mjs';

const args = process.argv.slice(2);
const out = resolve(arg(args, '--out') ?? `docs/evidence/comparar/${limaDay()}`);
const proxy = arg(args, '--proxy');
assertEmpty(out, ['claims', 'claims-sin-aviso', 'prelaunch-unstamped']); // already holds a capture: stop
mkdirSync(out, { recursive: true });

const browser = await openBrowser({ proxy });
const country = await browser.exitCountry();
const started = limaStamp();
console.log(`exit country: ${country}`);

const log = [];
let problems = 0;
if (country !== 'PE') { problems++; console.log(`COUNTRY  exit is ${country}, not PE`); }
for (const c of COMPETITORS) for (const s of c.sources) {
  const entry = { competitor: c.name, id: s.id, url: s.url, files: [], quotes: [] };
  try {
    const shot = await browser.capture(s.url, out, s.id, { purpose: 'Evidencia MontaWeb /comparar' });
    const { html, ...rest } = shot;
    Object.assign(entry, rest);
    for (const p of shot.problems) { problems++; console.log(`PROBLEM  ${s.url}: ${p}`); }
    const text = norm(visibleText(html));
    const checks = Object.entries(c.cells).filter(([, cell]) => cell.src === s.id).flatMap(([row, cell]) => (cell.quotes || []).map(q => [row, q]));
    if (s === c.sources[0]) for (const q of c.aboutQuotes || []) checks.push(['about', q]);
    for (const [row, q] of checks) {
      const found = q.startsWith('html:') ? html.includes(q.slice(5)) : text.includes(norm(q));
      entry.quotes.push({ row, quote: q, found });
      if (!found) { problems++; console.log(`MISSING  ${c.slug}.${row}: «${q}»  (${s.url})`); }
    }
  } catch (e) { entry.error = String(e.message || e).slice(0, 300); problems++; console.log(`ERROR    ${s.url}: ${entry.error}`); }
  log.push(entry);
  console.log(`${entry.error ? 'fail' : 'ok  '}  ${s.url}  (${entry.quotes.filter(q => q.found).length}/${entry.quotes.length} quotes)`);
}
await browser.close();

if (args.includes('--archive')) {
  const results = await archiveAll(log.filter(e => !e.error).map(e => e.url), out);
  for (const e of log) {
    const r = results.find(x => x.url === e.url);
    if (r) e.archive = { snapshot: r.snapshot, note: r.note };
  }
}

writeFileSync(join(out, 'log.json'), JSON.stringify({ started, exitCountry: country, proxy: proxy ?? null, method: browser.method, entries: log }, null, 2));
const quoteLines = e => e.quotes.map(q => `- ${q.found ? '✔' : '✘'} ${q.row}: «${q.quote}»`).join('\n');
writeFileSync(join(out, 'LOG.md'), `# Evidencia /comparar — ${started}\n\n` +
  `Capturado con ${browser.method}. País de salida a internet (Cloudflare trace): ${country}.${proxy ? ` Proxy: ${proxy}.` : ''}\n\n` +
  log.map(e => `## ${e.competitor} — ${e.url}\n${e.error ? `ERROR: ${e.error}` : `Capturado: ${e.at} · HTTP ${e.status}${e.problems.length ? ` · PROBLEMAS: ${e.problems.join('; ')}` : ''}`}\n` +
    `${e.archive ? `archive.org: ${e.archive.snapshot || e.archive.note}\n` : ''}` +
    `${e.files.map(f => `- ${f.file} \`${f.sha256}\``).join('\n')}\n${quoteLines(e)}\n`).join('\n'));
const all = log.flatMap(e => e.quotes);
writeFileSync(join(out, 'RECHECK.md'), `# Recheck — ${started}\n\n${all.filter(q => q.found).length}/${all.length} quotes found; ${problems} problem(s).\n\n` +
  log.map(e => `## ${e.id}\n${e.error ?? quoteLines(e)}\n`).join('\n'));
console.log(`\n${out}\nLOG.md sha256 ${sha256File(join(out, 'LOG.md'))}\n${problems ? `${problems} problem(s)` : `all ${all.length} quotes found`}`);
process.exitCode = problems ? 1 : 0;
