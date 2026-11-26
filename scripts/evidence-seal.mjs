// Seal an evidence folder: write SHA256SUMS over every file, have two public
// RFC 3161 timestamp authorities sign its hash, and verify both answers.
//   node scripts/evidence-seal.mjs <dir>            seal and verify; re-run to add a token that failed
//   node scripts/evidence-seal.mjs <dir> --verify   verify only (offline)
// Only the SHA-256 of SHA256SUMS leaves the machine. Needs `openssl` on PATH
// (Git Bash ships it; from PowerShell add C:\Program Files\Git\mingw64\bin).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkManifest, limaStamp, sha256File, writeManifest } from './lib/evidence.mjs';

export const TSAS = [
  {
    name: 'freetsa',
    url: 'https://freetsa.org/tsr',
    certs: { ca: 'https://freetsa.org/files/cacert.pem', untrusted: 'https://freetsa.org/files/tsa.crt' },
  },
  {
    name: 'digicert',
    url: 'http://timestamp.digicert.com',
    // The signing chain comes inside the token (-cert); the root anchors it.
    certs: { ca: 'https://cacerts.digicert.com/DigiCertTrustedRootG4.crt.pem' },
  },
];

const openssl = args => execFileSync(process.env.OPENSSL ?? 'openssl', args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();

async function get(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function stamp(dir, tsa) {
  const base = join(dir, 'timestamps', `SHA256SUMS.${tsa.name}`);
  for (const [role, url] of Object.entries(tsa.certs)) writeFileSync(join(dir, 'timestamps', `${tsa.name}-${role}.pem`), await get(url));
  openssl(['ts', '-query', '-data', join(dir, 'SHA256SUMS'), '-sha256', '-cert', '-out', `${base}.tsq`]);
  writeFileSync(`${base}.tsr`, await get(tsa.url, { method: 'POST', headers: { 'Content-Type': 'application/timestamp-query' }, body: readFileSync(`${base}.tsq`) }));
}

/** TSAs still without an answer. An existing token is never replaced. */
export const missingTsas = dir => TSAS.filter(t => !existsSync(join(dir, 'timestamps', `SHA256SUMS.${t.name}.tsr`)));

export async function seal(dir, stampOne = stamp) {
  if (!existsSync(join(dir, 'timestamps'))) { writeManifest(dir); mkdirSync(join(dir, 'timestamps')); }
  const changed = checkManifest(dir);
  if (changed.length) throw new Error(`folder differs from its SHA256SUMS, not stamping: ${changed.join(', ')}`);
  for (const tsa of missingTsas(dir)) await stampOne(dir, tsa);
}

export function verify(dir) {
  const problems = checkManifest(dir);
  const results = [];
  for (const tsa of TSAS) {
    const ts = join(dir, 'timestamps');
    const base = join(ts, `SHA256SUMS.${tsa.name}`);
    const trust = ['-CAfile', join(ts, `${tsa.name}-ca.pem`), ...(tsa.certs.untrusted ? ['-untrusted', join(ts, `${tsa.name}-untrusted.pem`)] : [])];
    try {
      // -data binds the token to the manifest file; -queryfile also checks the nonce.
      openssl(['ts', '-verify', '-data', join(dir, 'SHA256SUMS'), '-in', `${base}.tsr`, ...trust]);
      openssl(['ts', '-verify', '-queryfile', `${base}.tsq`, '-in', `${base}.tsr`, ...trust]);
      const time = /Time stamp: (.*)/.exec(openssl(['ts', '-reply', '-in', `${base}.tsr`, '-text']))?.[1].trim();
      results.push({ tsa: tsa.name, url: tsa.url, time });
    } catch (e) {
      problems.push(`${tsa.name}: ${String(e.stderr || e.message).trim().slice(-300)}`);
    }
  }
  return { problems, results };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const [folder, flag] = process.argv.slice(2);
  if (!folder || !existsSync(folder)) { console.error('usage: evidence-seal.mjs <dir> [--verify]'); process.exit(2); }
  const dir = resolve(folder);
  if (flag !== '--verify') await seal(dir);
  const { problems, results } = verify(dir);
  for (const r of results) console.log(`ok    ${r.tsa}: ${r.time}`);
  for (const p of problems) console.log(`FAIL  ${p}`);
  console.log(`SHA256SUMS sha256 ${sha256File(join(dir, 'SHA256SUMS'))} (checked ${limaStamp()})`);
  process.exitCode = problems.length ? 1 : 0;
}
