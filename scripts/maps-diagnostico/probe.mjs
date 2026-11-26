// Live check of a business website: ok | broken | social | unverifiable.
// "broken" is a public claim about someone's business, so only clear failures qualify: the name does
// not resolve, the connection is refused, 404/410/5xx, or a parked/suspended page. Anything this
// machine cannot be sure about (timeout, reset, TLS, anti-bot, antivirus) is "unverifiable".
import { setTimeout as delay } from 'node:timers/promises';

export const TIMEOUT_MS = 40000;
export const RETRY_DELAY_MS = 45000; // before retrying a 5xx or DNS failure, so a blip can pass
const KNOWN_GOOD = 'https://www.google.com/'; // if this fails too, the problem is on our side

const CLEAR_ERRORS = new Set(['ENOTFOUND', 'ECONNREFUSED']);
const PARKED = /domain (is )?for sale|este dominio (est[aá]|puede)|dominio en venta|buy this domain|parked (free|domain)|sedoparking|domain has expired|dominio ha expirado|cuenta suspendida|account (has been )?suspended|index of \/|default web site page|welcome to nginx|apache2 (ubuntu|debian) default|hostinger.{0,40}(parked|default)|it works!/i;
const UNFINISHED = /website coming soon|sitio en construcci[oó]n|en construcci[oó]n|under construction|coming soon|p[aá]gina en mantenimiento/i;
const CHALLENGE = /just a moment|cf-browser-verification|challenge-platform|captcha|attention required|verifying your browser/i;
const INTERCEPTED = /bitdefender/i;
const SOCIAL_HOST = /facebook|instagram|linktr|wa\.me|whatsapp/i;
const SHORT_PAGE = 1500; // visible characters; a real site that merely mentions a phrase is longer

const visibleText = (html) => html
  .replace(/<!--[\s\S]*?-->|<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/** Pure: one probe result -> 'ok' | 'broken' | 'social' | 'unverifiable'. */
export function classifyProbe({ status = null, finalHost = '', body = '', error = null, antiBot = false } = {}) {
  if (error || status == null) return CLEAR_ERRORS.has(error) ? 'broken' : 'unverifiable';
  if (INTERCEPTED.test(body)) return 'unverifiable';
  if (status >= 500) return antiBot || CHALLENGE.test(body) ? 'unverifiable' : 'broken';
  if (status === 404 || status === 410) return 'broken';
  if (status >= 400) return 'unverifiable';
  if (SOCIAL_HOST.test(finalHost)) return 'social';
  const text = visibleText(body);
  if (text.length < SHORT_PAGE) {
    if (PARKED.test(text)) return 'broken';
    if (UNFINISHED.test(text)) return 'unverifiable';
  }
  return 'ok';
}

function errorCode(e) {
  if (e?.name === 'TimeoutError' || e?.name === 'AbortError') return 'TIMEOUT';
  const codes = (e?.cause?.errors ?? [e?.cause]).map((c) => c?.code || 'UNKNOWN');
  return codes.find((c) => !CLEAR_ERRORS.has(c)) ?? codes[0] ?? 'UNKNOWN';
}

async function attempt(url, fetchImpl) {
  try {
    const r = await fetchImpl(url, {
      redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36' },
    });
    const type = r.headers.get('content-type') || '';
    const body = type.includes('html') ? (await r.text()).slice(0, 400000) : '';
    const antiBot = !!r.headers.get('cf-mitigated');
    return { state: classifyProbe({ status: r.status, finalHost: new URL(r.url).hostname, body, antiBot }), reached: true, transient: r.status >= 500, detail: `HTTP ${r.status}` };
  } catch (e) {
    const error = errorCode(e);
    return { state: classifyProbe({ error }), reached: false, transient: error === 'ENOTFOUND', detail: error };
  }
}

/** What a website state changes on the business profile. */
export function applySiteState(self, state) {
  if (state === 'broken') self.websiteBroken = true;
  if (state === 'social') self.website = false;
}

/** Roots to confirm a failure on: same scheme (for a deep path), then the other scheme. */
function rootsOf(url) {
  const u = new URL(url);
  const same = `${u.protocol}//${u.host}/`;
  const other = `${u.protocol === 'https:' ? 'http' : 'https'}://${u.host}/`;
  return u.href === same ? [other] : [same, other];
}

export async function probeSite(url, { fetchImpl = fetch, log = () => {}, sleep = delay } = {}) {
  const full = /^https?:/i.test(url) ? url : 'http://' + url;
  const works = (r) => r.state === 'ok' || r.state === 'social';
  const tryOnce = async (u) => {
    const r = await attempt(u, fetchImpl);
    log(`${u} -> ${r.detail} (${r.state})`);
    return r;
  };
  const first = await tryOnce(full);
  if (works(first)) return first.state;
  if (first.transient) await sleep(RETRY_DELAY_MS);
  const second = await tryOnce(full); // retry once
  if (works(second)) return second.state;
  if (first.state !== 'broken' || second.state !== 'broken') return 'unverifiable';
  // Confirm on the root(s). When we never reached a server (it could be local software in the way)
  // anything but another clear failure cancels the claim; otherwise a working page does.
  for (const root of rootsOf(full)) {
    const alt = await tryOnce(root);
    if (second.reached ? works(alt) : alt.state !== 'broken') return 'unverifiable';
  }
  return (await tryOnce(KNOWN_GOOD)).state === 'ok' ? 'broken' : 'unverifiable';
}
