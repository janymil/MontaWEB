// Renders pages with Playwright (found in the npx cache) and writes the rendered HTML to outdir.
// usage: NODE_PATH=<.../node_modules> node libro-reclamaciones-render.js in.json outdir
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
(async () => {
  const items = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); // [{host,url}]
  const out = process.argv[3]; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ ignoreHTTPSErrors: true, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' });
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const it = items[i++];
      const p = await ctx.newPage();
      try {
        await p.goto(it.url, { timeout: 25000, waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(3500);
        // expose computed background images / currentSrc of clickable descendants so the Python matcher sees image-only links
        await p.evaluate(() => {
          const rx = /libro|reclamaci|reclamo/i;
          document.querySelectorAll('a *, [onclick], [onclick] *, a').forEach(el => {
            try {
              const bg = getComputedStyle(el).backgroundImage || '';
              if (bg && bg !== 'none' && rx.test(decodeURIComponent(bg))) el.setAttribute('data-bgimg', bg.slice(0, 300));
              if (el.tagName === 'IMG' && el.currentSrc && rx.test(decodeURIComponent(el.currentSrc))) el.setAttribute('data-cursrc', el.currentSrc);
            } catch (e) {}
          });
        }).catch(() => {});
        fs.writeFileSync(path.join(out, it.host + '.html'), await p.content());
      } catch (e) { /* leave missing */ }
      await p.close().catch(() => {});
    }
  }
  await Promise.all([1, 2, 3, 4].map(worker));
  await b.close();
})();
