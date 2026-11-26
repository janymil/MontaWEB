// Headless Chrome driven over the DevTools protocol (Node's built-in WebSocket, no
// dependencies): load a page as a Peru visitor, scroll it so lazy content and
// counters finish, then save HTML, text, a stamped full-page PNG and a stamped PDF.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { captureProblems, limaStamp, sha256File, stampText, visibleText } from './evidence.mjs';

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(p => p && existsSync(p));

const WIDTH = 1366, HEIGHT = 900, MAX_PNG = 16000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function openBrowser({ proxy } = {}) {
  if (!CHROME) throw new Error('Chrome/Edge not found (set CHROME_PATH)');
  const profile = mkdtempSync(join(tmpdir(), 'evidence-chrome-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
    '--lang=es-PE', '--remote-debugging-port=0', `--user-data-dir=${profile}`, ...(proxy ? [`--proxy-server=${proxy}`] : []), 'about:blank'],
  { stdio: 'ignore' });
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 150 && !(existsSync(portFile) && readFileSync(portFile, 'utf8').includes('\n')); i++) await sleep(100);
  const [port, path] = readFileSync(portFile, 'utf8').split('\n');
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path.trim()}`);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('DevTools connection failed')); });

  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (m.id && pending.has(m.id)) {
      const { res, rej, timer } = pending.get(m.id);
      clearTimeout(timer);
      pending.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    } else listeners.forEach(f => f(m));
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const n = ++id;
    const timer = setTimeout(() => { pending.delete(n); rej(new Error(`${method} timed out`)); }, 120_000);
    pending.set(n, { res, rej, timer });
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });

  const { userAgent, product } = await send('Browser.getVersion');
  const method = `navegador automatizado (${product.replace('HeadlessChrome', 'Chrome')} sin interfaz, protocolo DevTools), idioma es-PE`;

  async function open(url) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const s = (m, p) => send(m, p, sessionId);
    let status, loaded = false;
    const on = m => {
      if (m.sessionId !== sessionId) return;
      if (m.method === 'Network.responseReceived' && m.params.type === 'Document' && m.params.frameId === targetId) status = m.params.response.status;
      if (m.method === 'Page.loadEventFired') loaded = true;
    };
    listeners.add(on);
    await s('Page.enable');
    await s('Network.enable');
    await s('Network.setUserAgentOverride', { userAgent: userAgent.replace('HeadlessChrome', 'Chrome'), acceptLanguage: 'es-PE,es;q=0.9' });
    await s('Emulation.setTimezoneOverride', { timezoneId: 'America/Lima' });
    await s('Emulation.setLocaleOverride', { locale: 'es-PE' });
    await s('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
    const nav = await s('Page.navigate', { url });
    if (nav.errorText) throw new Error(nav.errorText);
    for (let i = 0; i < 600 && !loaded; i++) await sleep(100);
    const evaluate = async expression => {
      const r = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    };
    const close = async () => { listeners.delete(on); await send('Target.closeTarget', { targetId }).catch(() => {}); };
    // Some sites reload themselves right after the first load; wait for a stable body.
    for (let i = 0; i < 300; i++) {
      if (await evaluate(`!!document.body && document.readyState === 'complete'`).catch(() => false)) break;
      await sleep(100);
    }
    return { s, evaluate, close, status: () => status, loaded: () => loaded };
  }

  /** Scroll step by step (lazy images, reveal animations), then wait for [data-count] counters. */
  async function settle(page) {
    await sleep(2500);
    await page.evaluate(`(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      for (let y = 0; y < Math.min(document.body.scrollHeight, 60000); y += ${HEIGHT / 2}) { window.scrollTo({ top: y, behavior: 'instant' }); await wait(250); }
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }); await wait(1500);
    })()`);
    const counters = () => page.evaluate(`[...document.querySelectorAll('[data-count]')].map(e => ({ want: e.dataset.count, shown: e.textContent.trim() }))`);
    const done = list => list.every(c => c.shown.replace(/[^0-9]/g, '').includes(c.want.replace(/[^0-9]/g, '')));
    let list = await counters();
    for (let i = 0; i < 40 && !done(list); i++) {
      await page.evaluate(`document.querySelector('[data-count]:not([data-seen])') && [...document.querySelectorAll('[data-count]')][${i} % document.querySelectorAll('[data-count]').length].scrollIntoView({ block: 'center', behavior: 'instant' })`);
      await sleep(700);
      list = await counters();
    }
    await page.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
    await sleep(1200);
    return { counters: list, countersDone: done(list) };
  }

  /** Country of the exit IP as the browser (and therefore the proxy) sees it. */
  async function exitCountry() {
    const page = await open('https://www.cloudflare.com/cdn-cgi/trace');
    const text = await page.evaluate('document.body.innerText');
    await page.close();
    return /^loc=(\w+)/m.exec(text)?.[1] ?? 'desconocido';
  }

  /** Save <name>.html/.txt/.png/.pdf in dir. The HTML is taken before the stamp is added. */
  async function capture(url, dir, name, { purpose, prepare }) {
    const page = await open(url);
    try {
      const settled = await settle(page);
      if (prepare) { await page.evaluate(prepare); await sleep(800); }
      const status = page.status();
      const finalUrl = await page.evaluate('location.href');
      const at = limaStamp();
      const html = await page.evaluate(`'<!DOCTYPE html>\\n' + document.documentElement.outerHTML`);
      const base = join(dir, name);
      writeFileSync(`${base}.html`, html);
      writeFileSync(`${base}.txt`, visibleText(html));
      const text = stampText({ url, finalUrl, at, method, purpose });
      await page.evaluate(`(() => {
        const bar = document.createElement('div');
        bar.setAttribute('data-evidence-stamp', '');
        bar.textContent = ${JSON.stringify(text)};
        bar.style.cssText = 'all:initial;display:block;position:relative;z-index:2147483647;box-sizing:border-box;width:100%;background:#111;color:#ffeb3b;font:600 14px/1.4 monospace;padding:8px 12px;word-break:break-all';
        document.documentElement.insertBefore(bar, document.body);
      })()`);
      await sleep(400);
      const { cssContentSize } = await page.s('Page.getLayoutMetrics');
      const height = Math.ceil(cssContentSize.height);
      const shot = await page.s('Page.captureScreenshot', {
        format: 'png', captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: WIDTH, height, scale: Math.min(1, MAX_PNG / height) },
      });
      writeFileSync(`${base}.png`, Buffer.from(shot.data, 'base64'));
      let pdfError;
      await page.s('Emulation.setEmulatedMedia', { media: 'screen' }); // print CSS can blank a page
      try {
        const pdf = await page.s('Page.printToPDF', { printBackground: true, paperWidth: WIDTH / 96, paperHeight: 14, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 });
        writeFileSync(`${base}.pdf`, Buffer.from(pdf.data, 'base64'));
      } catch (e) { pdfError = e.message; }
      const files = ['html', 'txt', 'png', 'pdf'].filter(x => existsSync(`${base}.${x}`))
        .map(x => ({ file: `${name}.${x}`, sha256: sha256File(`${base}.${x}`) }));
      const result = { url, finalUrl, at, status, loaded: page.loaded(), pageHeight: height, ...settled, ...(pdfError && { pdfError }) };
      return { ...result, html, files, problems: captureProblems(result) };
    } finally { await page.close(); }
  }

  async function close() {
    await send('Browser.close').catch(() => {});
    ws.close();
    await sleep(800);
    proc.kill();
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* Windows may still hold a lock */ }
  }

  return { capture, exitCountry, close, method };
}
