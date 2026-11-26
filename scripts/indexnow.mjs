#!/usr/bin/env node
// Tell Bing, Yandex and other IndexNow engines that pages changed.
// Usage: node scripts/indexnow.mjs <url-or-path> [...]   (paths like /blog/x become https://montaweb.pe/blog/x)
//        node scripts/indexnow.mjs --sitemap              (every <loc> in sitemap.xml)
// The key file is at the site root, as IndexNow requires; it is public on purpose.
import { readFileSync, readdirSync } from 'node:fs';

const HOST = 'montaweb.pe';
const key = readdirSync('.').find(f => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, -4);
if (!key) { console.error('No IndexNow key file (32 hex chars + .txt) in the repo root.'); process.exitCode = 1; }
else {
  const args = process.argv.slice(2);
  const urls = args.includes('--sitemap')
    ? [...readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    : args.map(a => a.startsWith('http') ? a : `https://${HOST}${a.startsWith('/') ? '' : '/'}${a}`);
  if (!urls.length) { console.error('Give URLs/paths or --sitemap.'); process.exitCode = 1; }
  else {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList: urls })
    });
    // 200/202 = accepted; 403 = key file not reachable yet (deploy first); 422 = URL not on this host.
    console.log(`IndexNow ${res.status} for ${urls.length} URL(s)`);
    if (res.status >= 300) process.exitCode = 1;
  }
}
