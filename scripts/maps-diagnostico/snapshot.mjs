// HTML -> PNG + PDF with headless Edge or Chrome already installed (no npm dependency).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const run = promisify(execFile);
const WIDTH = 430;

export function findBrowser() {
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const local = process.env.LOCALAPPDATA || '';
  const candidates = [
    process.env.BROWSER_EXE,
    path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    local && path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error('no Edge or Chrome found; set BROWSER_EXE');
  return found;
}

const MEASURE = '<script>addEventListener("load",()=>{document.documentElement.setAttribute("data-h",String(document.documentElement.scrollHeight))})</script>';

async function browser(args, profile) {
  const exe = findBrowser();
  return run(exe, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, ...args],
    { maxBuffer: 64 * 1024 * 1024, timeout: 90_000 });
}

/** Writes report.png and report.pdf next to indexPath. Returns the page height in px. */
export async function snapshot(indexPath) {
  const dir = path.dirname(indexPath);
  // Headless browsers keep a minimum window width (about 500px); pin the page to the phone width.
  const html = fs.readFileSync(indexPath, 'utf8').replace('</style>', `html{inline-size:${WIDTH}px;overflow-x:hidden}</style>`);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mapsdx-'));
  try {
    const measureFile = path.join(profile, 'measure.html');
    fs.writeFileSync(measureFile, html.replace('</body>', `${MEASURE}</body>`));
    const dom = (await browser([`--window-size=${WIDTH},1200`, '--dump-dom', pathToFileURL(measureFile).href], profile)).stdout;
    const m = /data-h="(\d+)"/.exec(dom);
    if (!m) throw new Error('could not measure page height');
    const height = Number(m[1]) + 8;

    const png = path.join(dir, 'report.png');
    const pngSrc = path.join(profile, 'shot.html');
    fs.writeFileSync(pngSrc, html);
    await browser([`--window-size=${WIDTH},${height}`, `--screenshot=${png}`, '--force-device-scale-factor=2',
      pathToFileURL(pngSrc).href], profile);

    const pdfSrc = path.join(profile, 'print.html');
    fs.writeFileSync(pdfSrc, html.replace('</style>', `@page{size:${WIDTH}px ${height}px;margin:0}</style>`));
    await browser([`--window-size=${WIDTH},${height}`, `--print-to-pdf=${path.join(dir, 'report.pdf')}`, '--no-pdf-header-footer',
      pathToFileURL(pdfSrc).href], profile);
    return height;
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
}
