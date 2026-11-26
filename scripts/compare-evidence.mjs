// Evidence pack for /comparar (docs/COMPARATIVA.md). Run it from Lima so the
// pages are seen as a Peruvian visitor sees them:
//   node scripts/compare-evidence.mjs [--out DIR]
// For every source in scripts/compare/competitors.mjs it saves, with headless Chrome:
//   <id>.html  the DOM after scripts ran,  <id>.pdf  a print of the page,
//   <id>.png   a 1366-wide screenshot,     <id>.txt  the visible text,
// then checks that every `quote` in the data appears in that source's text, and
// writes LOG.md + log.json with the Lima time and SHA-256 of each file.
// Exit code 1 when a quote is missing: the page changed, so fix the data first.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { COMPETITORS } from './compare/competitors.mjs';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
if (!CHROME) throw new Error('Chrome not found');

const limaDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
const limaStamp = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'full', timeStyle: 'long' }).format(new Date());
const i = process.argv.indexOf('--out');
const out = resolve(i > 0 ? process.argv[i + 1] : `docs/evidence/comparar/${limaDay}`);
mkdirSync(out, { recursive: true });

const chrome = (args, opts = {}) => execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
  '--virtual-time-budget=15000', '--lang=es-PE', ...args], { maxBuffer: 64 << 20, timeout: 90_000, stdio: ['ignore', 'pipe', 'ignore'], ...opts });
const sha = f => createHash('sha256').update(readFileSync(f)).digest('hex');
export const visibleText = html => html
  .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '’').replace(/&#8211;|&ndash;/g, '–')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/\s+/g, ' ');
export const norm = s => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();

const log = [];
let missing = 0;
for (const c of COMPETITORS) for (const s of c.sources) {
  const base = join(out, s.id);
  const entry = { competitor: c.name, id: s.id, url: s.url, captured: limaStamp, files: [], quotes: [] };
  try {
    const dom = chrome(['--dump-dom', s.url]).toString('utf8');
    writeFileSync(`${base}.html`, dom);
    writeFileSync(`${base}.txt`, visibleText(dom));
    chrome([`--print-to-pdf=${base}.pdf`, '--no-pdf-header-footer', s.url], { stdio: 'ignore' });
    chrome([`--screenshot=${base}.png`, '--window-size=1366,4000', s.url], { stdio: 'ignore' });
    for (const ext of ['html', 'txt', 'pdf', 'png']) if (existsSync(`${base}.${ext}`)) entry.files.push({ file: `${s.id}.${ext}`, sha256: sha(`${base}.${ext}`) });
    const text = norm(visibleText(dom));
    const checks = Object.entries(c.cells).filter(([, cell]) => cell.src === s.id).flatMap(([row, cell]) => (cell.quotes || []).map(q => [row, q]));
    if (s === c.sources[0]) for (const q of c.aboutQuotes || []) checks.push(['about', q]);
    for (const [row, q] of checks) {
      const ok = q.startsWith('html:') ? dom.includes(q.slice(5)) : text.includes(norm(q));
      entry.quotes.push({ row, quote: q, found: ok });
      if (!ok) { missing++; console.log(`MISSING  ${c.slug}.${row}: «${q}»  (${s.url})`); }
    }
  } catch (e) { entry.error = String(e.message || e).slice(0, 300); missing++; console.log(`ERROR    ${s.url}: ${entry.error}`); }
  log.push(entry);
  console.log(`${entry.error ? 'fail' : 'ok  '}  ${s.url}  (${entry.quotes.filter(q => q.found).length}/${entry.quotes.length} quotes)`);
}
writeFileSync(join(out, 'log.json'), JSON.stringify(log, null, 2));
writeFileSync(join(out, 'LOG.md'), `# Evidencia /comparar — ${limaStamp} (hora de Lima)\n\nCapturado con Chrome sin interfaz (headless) desde Lima, Perú.\n\n` +
  log.map(e => `## ${e.competitor} — ${e.url}\n${e.error ? `ERROR: ${e.error}\n` : ''}${e.files.map(f => `- ${f.file} \`${f.sha256}\``).join('\n')}\n${e.quotes.map(q => `- ${q.found ? '✔' : '✘'} ${q.row}: «${q.quote}»`).join('\n')}\n`).join('\n'));
console.log(`\n${out}\n${missing ? `${missing} problem(s)` : 'all quotes found'}`);
process.exit(missing ? 1 : 0);
