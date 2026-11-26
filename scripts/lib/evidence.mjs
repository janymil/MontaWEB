// Shared helpers for the /comparar evidence pack (docs/COMPARATIVA.md). No dependencies.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const limaDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(d);
export const limaStamp = (d = new Date()) =>
  `${new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'full', timeStyle: 'medium' }).format(d)} (hora de Lima, UTC-5)`;

export const arg = (args, name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

export const sha256 = buf => createHash('sha256').update(buf).digest('hex');
export const sha256File = f => sha256(readFileSync(f));

export const visibleText = html => html
  .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '’').replace(/&#8211;|&ndash;/g, '–')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/\s+/g, ' ');
export const norm = s => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();

export const stampText = ({ url, finalUrl, at, method, purpose }) =>
  `URL: ${url}${finalUrl && !samePage(url, finalUrl) ? ` · URL final: ${finalUrl}` : ''} · Capturado: ${at} · Método: ${method} · ${purpose}`;

/** Every file under dir as sorted forward-slash relative paths. */
export function listFiles(dir, rel = '') {
  return readdirSync(join(dir, rel), { withFileTypes: true })
    .flatMap(e => {
      const p = rel ? `${rel}/${e.name}` : e.name;
      return e.isDirectory() ? listFiles(dir, p) : [p];
    })
    .sort();
}

/** `sha256sum -c` compatible manifest. SHA256SUMS itself and timestamps/ come after it. */
export const inManifest = p => p !== 'SHA256SUMS' && !p.startsWith('timestamps/');

export function writeManifest(dir) {
  const body = listFiles(dir).filter(inManifest).map(p => `${sha256File(join(dir, p))}  ${p}`).join('\n') + '\n';
  writeFileSync(join(dir, 'SHA256SUMS'), body);
  return body;
}

/** Returns the problems: changed, missing or unlisted files. Empty = intact. */
export function checkManifest(dir) {
  const listed = new Map(readFileSync(join(dir, 'SHA256SUMS'), 'utf8').split('\n').filter(Boolean)
    .map(l => [l.slice(66), l.slice(0, 64)]));
  const problems = [];
  for (const [p, hash] of listed) {
    if (!existsSync(join(dir, p))) problems.push(`missing ${p}`);
    else if (sha256File(join(dir, p)) !== hash) problems.push(`changed ${p}`);
  }
  for (const p of listFiles(dir).filter(inManifest)) if (!listed.has(p)) problems.push(`unlisted ${p}`);
  return problems;
}

const SNAPSHOT = /^https:\/\/web\.archive\.org\/web\/(\d{14})/;
export const snapshotDay = url => {
  const m = SNAPSHOT.exec(url || '');
  if (!m) return null;
  const [y, mo, d, h, mi, s] = [[0, 4], [4, 6], [6, 8], [8, 10], [10, 12], [12, 14]].map(([a, b]) => +m[1].slice(a, b));
  return limaDay(new Date(Date.UTC(y, mo - 1, d, h, mi, s)));
};

/**
 * archive.org "Save Page Now". Anonymous requests are often rate limited (429), so
 * a failure also records the newest existing snapshot, labelled as such.
 */
export async function savePageNow(url, { fetchImpl = fetch, pause = 8000, tries = 2 } = {}) {
  const target = url.split('#')[0];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let why = '';
  for (let n = 0; n < tries; n++) {
    try {
      const res = await fetchImpl(`https://web.archive.org/save/${target}`, { signal: AbortSignal.timeout(150_000) });
      const where = res.headers.get('content-location');
      const snap = where ? new URL(where, 'https://web.archive.org').href : res.url;
      if (res.ok && snapshotDay(snap) === limaDay()) return { url, ok: true, snapshot: snap };
      why = res.ok ? 'no new snapshot returned' : `HTTP ${res.status}`;
    } catch (e) { why = String(e.message || e); }
    await sleep(pause * (n + 1));
  }
  try {
    const res = await fetchImpl(`https://web.archive.org/web/2/${target}`, { signal: AbortSignal.timeout(60_000) });
    const day = snapshotDay(res.url);
    if (res.ok && day) return { url, ok: day === limaDay(), snapshot: res.url, note: `Save Page Now failed (${why}); newest existing copy, ${day}` };
  } catch { /* keep the first reason */ }
  return { url, ok: false, snapshot: '', note: `Save Page Now failed (${why}); no existing copy` };
}

export async function archiveAll(urls, out, opts = {}) {
  const results = [];
  for (const url of [...new Set(urls)]) {
    const r = await savePageNow(url, opts);
    results.push(r);
    console.log(`archive ${r.ok ? 'ok  ' : 'FAIL'}  ${url}  ${r.snapshot}${r.note ? `  (${r.note})` : ''}`);
    await new Promise(res => setTimeout(res, opts.pause ?? 8000));
  }
  writeFileSync(join(out, 'ARCHIVES.md'), `# archive.org — ${limaStamp()}\n\n| URL | Copia | Nota |\n| --- | --- | --- |\n` +
    results.map(r => `| ${r.url} | ${r.snapshot || '—'} | ${r.note ?? ''} |`).join('\n') + '\n');
  return results;
}

/** Evidence is never overwritten: a capture only starts in a new or empty folder. */
export function assertEmpty(dir, allowed = []) {
  const found = existsSync(dir) ? readdirSync(dir).filter(n => !allowed.includes(n)) : [];
  if (found.length) throw new Error(`${dir} is not empty (${found.slice(0, 3).join(', ')}). Evidence is never overwritten: use a new --out folder.`);
}

const samePage = (a, b) => a.split('#')[0].replace(/\/$/, '') === b.split('#')[0].replace(/\/$/, '');

/** Everything that makes a capture unfit as proof. Empty = good. */
export function captureProblems({ url, finalUrl, status, loaded, countersDone, pdfError }) {
  return [
    (!status || status >= 400) && `HTTP ${status}`,
    !loaded && 'the page did not finish loading',
    finalUrl && !samePage(url, finalUrl) && `redirected to ${finalUrl}`,
    !countersDone && 'a [data-count] counter did not finish',
    pdfError && `PDF failed: ${pdfError}`,
  ].filter(Boolean);
}

/** R2 keys for an evidence folder. Prefix: <area>[/<area>]/<YYYY-MM-DD[-suffix]>. */
export const PREFIX_RE = /^([a-z0-9-]+\/){1,2}\d{4}-\d{2}-\d{2}[a-z0-9-]*$/;

/**
 * Upload every file, never overwriting, then read every object back and compare
 * SHA-256 (also the ones already there, so a re-run verifies the whole folder).
 * `store`: { head(key) → bool, put(key, body, hash), get(key) → Buffer }.
 */
export async function uploadFolder(dir, prefix, store) {
  if (!PREFIX_RE.test(prefix)) throw new Error(`bad prefix: ${prefix}`);
  let uploaded = 0, skipped = 0;
  const objects = [];
  for (const rel of listFiles(dir)) {
    const key = `${prefix}/${rel}`;
    const body = readFileSync(join(dir, rel));
    const hash = sha256(body);
    if (await store.head(key)) skipped++;
    else { await store.put(key, body, hash); uploaded++; }
    if (sha256(await store.get(key)) !== hash) throw new Error(`hash mismatch: ${key}`);
    objects.push({ key, sha256: hash });
  }
  return { uploaded, skipped, objects };
}
