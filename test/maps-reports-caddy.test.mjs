// Runs the montaweb.pe block of deploy/Caddyfile in a local Caddy (skipped if Caddy is not installed).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';

const hasCaddy = spawnSync('caddy', ['version']).status === 0;
const TOKEN = '-h2qzzTest00';

const freePort = () => new Promise((resolve) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

const get = (port, p) => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port, path: p }, (res) => {
    let body = '';
    res.on('data', (c) => { body += c; });
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
  }).on('error', reject);
});

test('sitemap and robots.txt do not mention /d/', () => {
  assert.doesNotMatch(fs.readFileSync('sitemap.xml', 'utf8'), /montaweb\.pe\/d\//);
  // Blocking /d/ would stop crawlers from seeing the noindex, and would advertise the path.
  assert.doesNotMatch(fs.readFileSync('robots.txt', 'utf8'), /^Disallow:\s*\/d(\/|\s*$)/m);
});

test('Caddy serves /d/<token>/ from outside the checkout and nothing else', { skip: !hasCaddy && 'caddy not installed' }, async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mwcaddy-')).replace(/\\/g, '/');
  const put = (rel, text) => {
    fs.mkdirSync(path.dirname(`${dir}/${rel}`), { recursive: true });
    fs.writeFileSync(`${dir}/${rel}`, text);
  };
  put('site/index.html', 'HOME');
  put('site/404.html', 'NOTFOUND');
  put(`reports/${TOKEN}/index.html`, 'REPORT');
  put(`reports/${TOKEN}/report.png`, 'PNG');
  put(`reports/${TOKEN}/report.pdf`, 'PDF');
  put(`reports/${TOKEN}/.published`, '');
  put(`reports/${TOKEN}/tracking.csv`, 'secret');
  put('reports/tracking.csv', 'secret');
  put(`reports/.removed/${TOKEN}`, '');
  put('reports/.incoming.abc123/index.html', 'secret');

  const caddyfile = fs.readFileSync('deploy/Caddyfile', 'utf8').replace(/\r/g, '');
  const port = await freePort();
  const block = caddyfile.slice(caddyfile.indexOf('\nmontaweb.pe {'))
    .replace('montaweb.pe {', `http://127.0.0.1:${port} {`)
    .replaceAll('/var/www/montaweb-reports', `${dir}/reports`)
    .replace('root * /var/www/montaweb', `root * ${dir}/site`)
    .replace('import visitlog', '');
  put('Caddyfile', `{\n\tadmin off\n\tauto_https off\n}\n${block}`);

  const proc = spawn('caddy', ['run', '--config', `${dir}/Caddyfile`, '--adapter', 'caddyfile'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let log = '';
  proc.stderr.on('data', (c) => { log += c; });
  t.after(() => { proc.kill(); });
  let up = false;
  for (let i = 0; i < 100 && !up; i++) {
    await new Promise((r) => setTimeout(r, 100));
    up = await get(port, '/').then((r) => r.body === 'HOME', () => false);
  }
  assert.ok(up, log);

  for (const [p, body] of [[`/d/${TOKEN}/`, 'REPORT'], [`/d/${TOKEN}/report.png`, 'PNG'], [`/d/${TOKEN}/report.pdf`, 'PDF']]) {
    const r = await get(port, p);
    assert.equal(r.status, 200, p);
    assert.equal(r.body, body, p);
    assert.equal(r.headers['x-robots-tag'], 'noindex, nofollow', p);
    assert.equal(r.headers['cache-control'], 'private, no-store', p);
  }
  const slash = await get(port, `/d/${TOKEN}`);
  assert.equal(slash.status, 308);
  assert.equal(slash.headers.location, `/d/${TOKEN}/`);

  for (const p of ['/d', '/d/', '/d/unknownTOKEN/', '/d/unknownTOKEN/report.png', `/d/${TOKEN}/index`, `/d/${TOKEN}/.published`,
    `/d/${TOKEN}/tracking.csv`, '/d/tracking.csv', `/d/.removed/${TOKEN}`, '/d/.incoming.abc123/', `/d/${TOKEN}/%2e%2e/tracking.csv`,
    `/d/${TOKEN}/..%2ftracking.csv`]) {
    const r = await get(port, p);
    assert.equal(r.status, 404, p);
    assert.doesNotMatch(r.body, /secret|REPORT/, p);
  }
  // index.html is folded into the clean URL by the site-wide rule, never served under a second address
  assert.notEqual((await get(port, `/d/${TOKEN}/index.html`)).status, 200);
});
