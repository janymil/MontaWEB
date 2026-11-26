// /comparar evidence helpers (docs/COMPARATIVA.md): manifest, archive records, R2 rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as E from '../scripts/lib/evidence.mjs';
import { seal, TSAS } from '../scripts/evidence-seal.mjs';

const folder = () => {
  const d = mkdtempSync(join(tmpdir(), 'ev-'));
  writeFileSync(join(d, 'a.txt'), 'a');
  mkdirSync(join(d, 'claims'));
  writeFileSync(join(d, 'claims', 'b.txt'), 'b');
  return d;
};
const memory = (objects = new Map()) => ({
  objects,
  head: async k => objects.has(k),
  put: async (k, body) => { objects.set(k, body); },
  get: async k => objects.get(k),
});

test('Lima day and stamp use UTC-5', () => {
  const d = new Date('2026-11-26T03:30:00Z');
  assert.equal(E.limaDay(d), '2026-11-25');
  assert.match(E.limaStamp(d), /25 de noviembre de 2026.*10:30:00.*hora de Lima, UTC-5/);
});

test('the stamp names the URL, time and method', () => {
  const s = E.stampText({ url: 'https://x.pe/', at: 'T', method: 'M', purpose: 'P' });
  for (const part of ['URL: https://x.pe/', 'Capturado: T', 'Método: M', 'P']) assert.ok(s.includes(part), part);
});

test('SHA256SUMS covers subfolders, skips timestamps/ and catches any change', () => {
  const d = folder();
  const body = E.writeManifest(d);
  assert.match(body, /^[0-9a-f]{64} {2}a\.txt\n[0-9a-f]{64} {2}claims\/b\.txt\n$/);
  mkdirSync(join(d, 'timestamps'));
  writeFileSync(join(d, 'timestamps', 'x.tsr'), 't');
  assert.deepEqual(E.checkManifest(d), []);
  writeFileSync(join(d, 'a.txt'), 'changed');
  writeFileSync(join(d, 'new.txt'), 'n');
  rmSync(join(d, 'claims', 'b.txt'));
  assert.deepEqual(E.checkManifest(d).sort(), ['changed a.txt', 'missing claims/b.txt', 'unlisted new.txt']);
});

test('upload never overwrites and verifies every object by reading it back', async () => {
  const d = folder();
  const store = memory();
  const first = await E.uploadFolder(d, 'montaweb/comparar/2026-11-25', store);
  assert.deepEqual([first.uploaded, first.skipped], [2, 0]);
  assert.ok(store.objects.has('montaweb/comparar/2026-11-25/claims/b.txt'));
  const again = await E.uploadFolder(d, 'montaweb/comparar/2026-11-25', store);
  assert.deepEqual([again.uploaded, again.skipped], [0, 2]);
  writeFileSync(join(d, 'a.txt'), 'changed');
  await assert.rejects(E.uploadFolder(d, 'montaweb/comparar/2026-11-25', store), /hash mismatch/);
  assert.equal(String(store.objects.get('montaweb/comparar/2026-11-25/a.txt')), 'a');
});

test('upload refuses a prefix without a dated folder', async () => {
  for (const p of ['montaweb', 'montaweb/comparar', '../2026-11-25', 'a/b/c/2026-11-25'])
    await assert.rejects(E.uploadFolder(folder(), p, memory()), /bad prefix/, p);
});

test('a rate-limited Save Page Now is not recorded as a new snapshot', async () => {
  const old = 'https://web.archive.org/web/20200101000000/https://x.pe/';
  const fetchImpl = async u => u.includes('/save/')
    ? { ok: false, status: 429, url: u, headers: new Headers() }
    : { ok: true, status: 200, url: old, headers: new Headers() };
  const r = await E.savePageNow('https://x.pe/#planes', { fetchImpl, pause: 0 });
  assert.equal(r.ok, false);
  assert.equal(r.snapshot, old);
  assert.match(r.note, /HTTP 429.*2020-01-01T00:00:00/);
});

test('the evidence scripts stamp captures and never reuse a folder', () => {
  const read = f => readFileSync(new URL(`../scripts/${f}`, import.meta.url), 'utf8');
  assert.match(read('lib/capture.mjs'), /data-evidence-stamp/);
  for (const f of ['compare-evidence.mjs', 'montaweb-claims-evidence.mjs']) assert.match(read(f), /assertEmpty\(out/, f);
  assert.match(read('upload-evidence.mjs'), /IfNoneMatch: '\*'/);
});

test('a capture never starts in a folder that has anything in it', () => {
  const d = folder();
  assert.throws(() => E.assertEmpty(d, ['claims']), /never overwritten/);
  E.assertEmpty(d, ['claims', 'a.txt']);
  E.assertEmpty(join(d, 'new'));
});

test('redirects, unfinished loads and failed PDFs count as problems', () => {
  const good = { url: 'https://x.pe/#planes', finalUrl: 'https://x.pe/', status: 200, loaded: true, countersDone: true };
  assert.deepEqual(E.captureProblems(good), []);
  const bad = E.captureProblems({ ...good, finalUrl: 'https://x.pe/otra', loaded: false, pdfError: 'boom', countersDone: false, status: 404 });
  assert.equal(bad.length, 5);
  assert.match(E.stampText({ url: 'https://x.pe/', finalUrl: 'https://x.pe/otra' }), /URL final: https:\/\/x\.pe\/otra/);
});

test('sealing can resume after a failed TSA without replacing a token or accepting changed files', async () => {
  const d = folder();
  const calls = [];
  const stampOne = async (dir, tsa) => {
    calls.push(tsa.name);
    if (calls.length === 2) throw new Error('TSA down');
    writeFileSync(join(dir, 'timestamps', `SHA256SUMS.${tsa.name}.tsr`), 't');
  };
  await assert.rejects(seal(d, stampOne), /TSA down/);
  await seal(d, stampOne);
  assert.deepEqual(calls, [TSAS[0].name, TSAS[1].name, TSAS[1].name]);
  writeFileSync(join(d, 'a.txt'), 'changed');
  await assert.rejects(seal(d, stampOne), /differs from its SHA256SUMS/);
});

test('an older copy returned by Save Page Now does not count as a new snapshot', async () => {
  const copy = 'https://web.archive.org/web/20261126005949/https://x.pe/';
  const fetchImpl = async () => ({ ok: true, status: 200, url: copy, headers: new Headers() });
  const at = iso => ({ fetchImpl, pause: 0, now: () => Date.parse(iso) });
  assert.equal((await E.savePageNow('https://x.pe/', at('2026-11-26T01:00:00Z'))).ok, true);
  const later = await E.savePageNow('https://x.pe/', at('2026-11-26T01:48:00Z'));
  assert.equal(later.ok, false);
  assert.match(later.note, /existing copy from 2026-11-26T00:59:49/);
});

test('LOG.md never shows an older copy without its note', () => {
  assert.equal(E.archiveText({ snapshot: 'S', note: 'existing copy' }), 'S (existing copy)');
  assert.equal(E.archiveText({ snapshot: '', note: 'failed' }), '— (failed)');
  assert.equal(E.archiveText(undefined), '');
  for (const f of ['compare-evidence.mjs', 'montaweb-claims-evidence.mjs'])
    assert.match(readFileSync(new URL(`../scripts/${f}`, import.meta.url), 'utf8'), /archiveText\(e\.archive\)/, f);
});
