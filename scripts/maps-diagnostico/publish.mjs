#!/usr/bin/env node
// Publish the Maps diagnostico reports to https://montaweb.pe/d/<token>/ (a server directory OUTSIDE
// the site checkout). Dry run unless --execute. The reports and tracking.csv never enter git.
//   node scripts/maps-diagnostico/publish.mjs                       check and list, touches no server
//   node scripts/maps-diagnostico/publish.mjs --execute             upload the tracking.csv reports
//   node scripts/maps-diagnostico/publish.mjs --remove=<id> --execute   take one report down for good
// Removal after 90 days: deploy/montaweb-reports-retention.cron (on the server).
// The retention cron hardcodes /var/www/montaweb-reports; it must match DEPLOY_REPORTS_DIR.
// Env: DEPLOY_HOST (default washington) and DEPLOY_PATH, as in scripts/deploy.sh; DEPLOY_REPORTS_DIR.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { WHATSAPP_NUMBER } from './render.mjs';

const PRIVATE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'research', 'maps-diagnostico', 'private');
export const EXPECTED = 30;
const TOKEN = /^[A-Za-z0-9_-]{12}$/;
const FILES = ['index.html', 'report.pdf', 'report.png'];

function parseCsv(text) {
  const rows = [[]];
  let field = '', quoted = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c !== '"') field += c;
      else if (s[i + 1] === '"') { field += '"'; i++; } else quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === ',') { rows.at(-1).push(field); field = ''; }
    else if (c === '\n') { rows.at(-1).push(field); field = ''; rows.push([]); }
    else if (c !== '\r') field += c;
  }
  rows.at(-1).push(field);
  return rows.filter((r) => r.some((v) => v !== ''));
}

const checkToken = (t) => {
  if (!TOKEN.test(t ?? '')) throw new Error(`bad token: ${t}`);
  return t;
};

/** tracking.csv -> [{token, phone}], exactly EXPECTED unique rows. */
export function readRows(csv) {
  const [head, ...body] = parseCsv(csv);
  const col = (name) => {
    const i = head.indexOf(name);
    if (i < 0) throw new Error(`tracking.csv has no column ${name}`);
    return i;
  };
  const [id, tok, phone] = [col('report_id'), col('token'), col('phone')];
  const rows = body.map((r) => {
    if (r[id] !== r[tok]) throw new Error(`bad token: report_id and token differ (${r[id]})`);
    return { token: checkToken(r[tok]), phone: r[phone] };
  });
  if (rows.length !== EXPECTED || new Set(rows.map((r) => r.token)).size !== EXPECTED) {
    throw new Error(`expected ${EXPECTED} unique reports in tracking.csv, found ${rows.length} rows`);
  }
  return rows;
}

/** Problems that make a report unfit to publish; [] = fine. Never echoes a phone number. */
export function checkReportHtml(html, token, phones) {
  const problems = [];
  const text = html
    .replace(/%([0-9a-f]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16)))
    .replaceAll(WHATSAPP_NUMBER, '');
  const spaced = (digits) => new RegExp(digits.split('').join('[\\s().-]*'));
  const leadPhone = phones.map((p) => String(p).replace(/\D/g, '').slice(-9))
    .some((digits) => digits.length >= 7 && spaced(digits).test(text));
  const anyMobile = /(?<!\d)(?:51[\s-]*)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}(?!\d)/.test(text);
  if (leadPhone || anyMobile) problems.push('phone number in the page');
  const links = [...html.matchAll(/\s(?:href|src|srcset|action|poster)\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]);
  links.push(...[...html.matchAll(/url\(\s*["']?([^"')]*)/gi)].map((m) => m[1]));
  if (links.some((l) => !/^(https:\/\/|#|data:)/i.test(l))) problems.push('relative or non-https link');
  if (!/<meta name="robots" content="noindex[^"]*">/.test(html)) problems.push('no noindex meta');
  for (const p of ['title', 'type']) {
    if (!html.includes(`<meta property="og:${p}" content="`)) problems.push(`no og:${p}`);
  }
  if (!html.includes(`<meta property="og:image" content="https://montaweb.pe/d/${token}/report.png">`)) problems.push('og:image is not this report');
  return problems;
}

/** Copies exactly the listed report folders into outDir, after checking every one of them. */
function stage(rows, reportsDir, outDir) {
  const phones = rows.map((r) => r.phone);
  for (const { token } of rows) {
    const from = path.join(reportsDir, token);
    const found = fs.readdirSync(from, { withFileTypes: true });
    const extra = found.filter((e) => !e.isFile() || !FILES.includes(e.name));
    if (extra.length) throw new Error(`${token}: unexpected file ${extra.map((e) => e.name).join(', ')}`);
    if (found.length !== FILES.length) throw new Error(`${token}: missing one of ${FILES.join(', ')}`);
    const problems = checkReportHtml(fs.readFileSync(path.join(from, 'index.html'), 'utf8'), token, phones);
    if (problems.length) throw new Error(`${token}: ${problems.join('; ')}`);
    fs.mkdirSync(path.join(outDir, token));
    for (const f of FILES) fs.copyFileSync(path.join(from, f), path.join(outDir, token, f));
  }
}

function serverDir(env) {
  const dir = env.DEPLOY_REPORTS_DIR || '/var/www/montaweb-reports';
  const site = env.DEPLOY_PATH || '/var/www/montaweb';
  if (!/^(\/[A-Za-z0-9_-][A-Za-z0-9_.-]*)+\/montaweb-reports$/.test(dir)
    || dir === site || dir.startsWith(`${site}/`) || site.startsWith(`${dir}/`)) {
    throw new Error(`DEPLOY_REPORTS_DIR must be a plain absolute path to a montaweb-reports directory outside the site checkout: ${dir}`);
  }
  return dir;
}

// Both run on the server. Tokens may start with "-", hence the -- everywhere.
// .removed/<token> keeps a taken-down report from coming back with the next upload;
// .published dates the first upload (the retention cron reads it).
const uploadScript = (dir) => `set -eu
umask 022
d='${dir}'
mkdir -p "$d/.removed"
in=$(mktemp -d "$d/.incoming.XXXXXX")
trap 'rm -rf -- "$in"' EXIT
tar -xzf - -C "$in"
for r in "$d"/.removed/*; do
  [ -e "$r" ] || continue
  echo "skipped (removed earlier): \${r##*/}"
  rm -rf -- "$in/\${r##*/}"
done
cp -R -- "$in"/. "$d/"
for p in "$in"/*/; do
  [ -d "$p" ] || continue
  t=\${p%/}; t=\${t##*/}
  [ -e "$d/$t/.published" ] || : > "$d/$t/.published"
  echo "published: $t"
done
rm -rf -- "$in"
chmod -R u=rwX,go=rX -- "$d"
`;

const removeScript = (dir, token) => `set -eu
d='${dir}'
mkdir -p "$d/.removed"
: > "$d/.removed/${token}"
rm -rf -- "$d/${token}"
echo "removed: ${token}"
`;

function parseArgv(argv) {
  const a = { execute: false, remove: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--execute') a.execute = true;
    else if (argv[i] === '--remove') a.remove = checkToken(argv[++i]); // the id may start with "-"
    else if (argv[i].startsWith('--remove=')) a.remove = checkToken(argv[i].slice('--remove='.length));
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return a;
}

export function main(argv, {
  env = process.env, run = spawnSync, log = console.log,
  tracking = path.join(PRIVATE, 'tracking.csv'), reportsDir = path.join(PRIVATE, 'reports'),
} = {}) {
  const args = parseArgv(argv);
  const host = env.DEPLOY_HOST || 'washington';
  const dir = serverDir(env);
  const ssh = (script, input) => {
    const r = run('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', host, script], { input, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`ssh failed (${r.status}): ${r.stderr || r.error?.message || ''}`);
    log(r.stdout.trimEnd());
  };

  if (args.remove) {
    if (!args.execute) return log(`DRY RUN: would remove ${args.remove} from ${host}:${dir}. Add --execute to do it.`);
    return ssh(removeScript(dir, args.remove));
  }

  const rows = readRows(fs.readFileSync(tracking, 'utf8'));
  const staged = fs.mkdtempSync(path.join(os.tmpdir(), 'mapspub-'));
  try {
    stage(rows, reportsDir, staged);
    log(`Checked ${rows.length} reports (${FILES.join(', ')}): no phone numbers, no relative links, noindex and preview tags present.`);
    if (!args.execute) {
      for (const { token } of rows) log(`  https://montaweb.pe/d/${token}/`);
      return log(`DRY RUN: nothing sent. --execute would upload them to ${host}:${dir}.`);
    }
    const tar = run('tar', ['-czf', '-', '-C', staged, '.'], { maxBuffer: 512 * 1024 * 1024 });
    if (tar.status !== 0) throw new Error(`tar failed: ${tar.stderr || tar.error?.message}`);
    return ssh(uploadScript(dir), tar.stdout);
  } finally {
    fs.rmSync(staged, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
