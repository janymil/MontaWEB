import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { readRows, checkReportHtml, main, EXPECTED } from '../scripts/maps-diagnostico/publish.mjs';

const token = (i) => ({ 0: '-h2qzzTest00', 2: '_h2qzzTest02' })[i] || `tok_${String(i).padStart(8, '0')}`;
const PHONE = '+51987654321';
const html = (t, extra = '') => `<!doctype html><html><head><meta name="robots" content="noindex">
<meta property="og:title" content="x"><meta property="og:type" content="website">
<meta property="og:image" content="https://montaweb.pe/d/${t}/report.png"></head>
<body>${extra}<a href="https://wa.me/51965403196?text=a">w</a></body></html>`;

function fixture({ count = EXPECTED, extra = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mwpub-'));
  const reports = path.join(dir, 'reports');
  let csv = '﻿n,lead name,phone,report_id,token\n';
  for (let i = 0; i < count; i++) {
    const t = token(i);
    csv += `${i + 1},"Name, with comma",${PHONE},${t},${t}\n`;
    const d = path.join(reports, t);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'index.html'), html(t, extra[i] || ''));
    fs.writeFileSync(path.join(d, 'report.png'), 'png');
    fs.writeFileSync(path.join(d, 'report.pdf'), 'pdf');
  }
  fs.mkdirSync(path.join(reports, 'oldPhase0000'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'tracking.csv'), csv);
  const server = path.join(dir, 'server').replace(/\\/g, '/');
  return { dir, reports, server, tracking: path.join(dir, 'tracking.csv') };
}

/** ssh is replaced by a local bash running the same remote script; tar stays real. */
const runner = (calls, server) => (cmd, args, opts) => {
  calls.push([cmd, ...args]);
  if (cmd === 'ssh') return spawnSync('bash', ['-c', args.at(-1).replaceAll('/srv/montaweb-reports', server)], opts);
  return spawnSync(cmd, args, opts);
};

function go(f, argv, calls = [], env = {}) {
  const out = [];
  main(argv, {
    tracking: f.tracking, reportsDir: f.reports, run: runner(calls, f.server), log: (l) => out.push(l),
    env: { DEPLOY_HOST: 'testhost', DEPLOY_REPORTS_DIR: '/srv/montaweb-reports', ...env },
  });
  return out.join('\n');
}

test('publish: reads exactly the tracking rows, quoted commas included', () => {
  const rows = readRows(fs.readFileSync(fixture().tracking, 'utf8'));
  assert.equal(rows.length, 30);
  assert.deepEqual(rows[1], { token: 'tok_00000001', phone: PHONE });
  assert.throws(() => readRows(fs.readFileSync(fixture({ count: 29 }).tracking, 'utf8')), /expected 30/);
  assert.throws(() => readRows('phone,report_id,token\n' + '1,../../etc/x,../../etc/x\n'.repeat(30)), /bad token/);
});

test('publish: refuses phones, relative links and a missing noindex', () => {
  const t = token(1);
  assert.deepEqual(checkReportHtml(html(t), t, [PHONE]), []);
  for (const bad of ['987654321', '987 654 321', 'https://wa.me/51987654321', 'tel:+51-987-654-321', '%2B51987654321', '912 345 678']) {
    assert.match(checkReportHtml(html(t, `<p>${bad}</p>`), t, [PHONE]).join(), /phone/, bad);
  }
  assert.match(checkReportHtml(html(t, '<img src="report.png">'), t, []).join(), /relative/);
  assert.match(checkReportHtml(html(t, '<a href="/servicios">s</a>'), t, []).join(), /relative/);
  assert.match(checkReportHtml(html(t).replace('noindex', 'index'), t, []).join(), /noindex/);
  assert.match(checkReportHtml(html(token(2)), t, []).join(), /og:image/);
});

test('publish: dry run is the default and runs nothing', () => {
  const f = fixture();
  const calls = [];
  assert.match(go(f, [], calls), /DRY RUN/);
  assert.deepEqual(calls, []);
  assert.equal(fs.existsSync(f.server), false);
});

test('publish: --execute puts only the 30 report folders on the server', () => {
  const f = fixture();
  const calls = [];
  go(f, ['--execute'], calls);
  const tokens = Array.from({ length: 30 }, (_, i) => token(i)).sort();
  assert.deepEqual(fs.readdirSync(f.server).filter((n) => !n.startsWith('.')).sort(), tokens);
  assert.deepEqual(fs.readdirSync(f.server).filter((n) => n.startsWith('.')), ['.removed']);
  assert.deepEqual(fs.readdirSync(path.join(f.server, token(0))).sort(), ['.published', 'index.html', 'report.pdf', 'report.png']);
  assert.ok(calls.find((c) => c[0] === 'ssh').includes('testhost'));
});

test('publish: a bad report or an extra file stops everything before ssh', () => {
  const withPhone = fixture({ extra: { 29: '987654321' } });
  const withExtra = fixture();
  fs.writeFileSync(path.join(withExtra.reports, token(3), 'facts.json'), '{}');
  for (const [f, why] of [[withPhone, /phone/], [withExtra, /unexpected file/]]) {
    const calls = [];
    assert.throws(() => go(f, ['--execute'], calls), why);
    assert.deepEqual(calls, []);
  }
});

test('publish: a second upload keeps the first publication date', () => {
  const f = fixture();
  go(f, ['--execute']);
  const marker = path.join(f.server, token(5), '.published');
  const old = new Date(Date.now() - 50 * 86400e3);
  fs.utimesSync(marker, old, old);
  go(f, ['--execute']);
  assert.ok(Math.abs(fs.statSync(marker).mtimeMs - old.getTime()) < 5000);
});

test('publish: --remove takes one report down and a later upload does not bring it back', () => {
  const f = fixture();
  go(f, ['--execute']);
  const dry = [];
  assert.match(go(f, ['--remove', token(0)], dry), /DRY RUN/);
  assert.deepEqual(dry, []);
  assert.ok(fs.existsSync(path.join(f.server, token(0))));
  go(f, ['--remove', token(0), '--execute']);
  assert.equal(fs.existsSync(path.join(f.server, token(0))), false);
  assert.ok(fs.existsSync(path.join(f.server, token(1))));
  go(f, ['--execute']);
  assert.equal(fs.existsSync(path.join(f.server, token(0))), false);
});

test('publish: an upload where every report was removed earlier succeeds and publishes nothing', () => {
  const f = fixture();
  fs.mkdirSync(path.join(f.server, '.removed'), { recursive: true });
  for (let i = 0; i < EXPECTED; i++) fs.writeFileSync(path.join(f.server, '.removed', token(i)), '');
  const out = go(f, ['--execute']);
  assert.doesNotMatch(out, /published:/);
  assert.deepEqual(fs.readdirSync(f.server), ['.removed']);
});

test('publish: rejects a server directory inside or above the site checkout, a bad token and a typo', () => {
  const f = fixture();
  for (const dir of [
    '/var/www', '/var/www/montaweb', '/var/www/montaweb/d', '/var/www/montaweb/montaweb-reports', '/var/www/other',
    '/var/www/x/../montaweb-reports', "/srv/a'b/montaweb-reports", 'relative/montaweb-reports',
  ]) {
    assert.throws(() => go(f, [], [], { DEPLOY_REPORTS_DIR: dir }), /DEPLOY_REPORTS_DIR/, dir);
  }
  assert.throws(() => go(f, [], [], { DEPLOY_PATH: '/srv/montaweb-reports/site' }), /DEPLOY_REPORTS_DIR/);
  assert.throws(() => go(f, ['--remove', '..', '--execute']), /bad token/);
  assert.throws(() => go(f, ['--exceute']), /unknown argument/);
});

test('retention cron removes folders published 90 days ago from the reports directory only', () => {
  const cron = fs.readFileSync('deploy/montaweb-reports-retention.cron', 'utf8').replace(/\r/g, '');
  const line = cron.split('\n').find((l) => /^\d/.test(l));
  const command = line.split(' ').slice(6).join(' ');
  const f = fixture();
  go(f, ['--execute']);
  const age = (t, days) => {
    const when = new Date(Date.now() - days * 86400e3 - 3600e3);
    fs.utimesSync(path.join(f.server, t, '.published'), when, when);
  };
  age(token(0), 90);
  age(token(1), 89);
  age(token(2), 90);
  const r = spawnSync('bash', ['-c', command.replaceAll('/var/www/montaweb-reports', f.server)], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.existsSync(path.join(f.server, token(0))), false);
  assert.ok(fs.existsSync(path.join(f.server, token(1))));
  assert.deepEqual(fs.readdirSync(path.join(f.server, '.removed')).sort(), [token(0), token(2)].sort());
  go(f, ['--execute']);
  assert.equal(fs.existsSync(path.join(f.server, token(0))), false);
  assert.equal(fs.existsSync(path.join(f.server, token(2))), false);
  assert.ok(fs.existsSync(path.join(f.server, token(1))));
});
