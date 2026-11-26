// Live check of a business website: ok | broken | social.
// Rules mirror scripts/lima-web-census/probe.py + analyze.py (site_state).
const PARKED = new RegExp(String.raw`domain (is )?for sale|este dominio (est[aá]|puede)|dominio en venta|buy this domain|parked (free|domain)|sedoparking|domain has expired|dominio ha expirado|cuenta suspendida|account suspended|this account has been suspended|website coming soon|sitio en construcci[oó]n|en construcci[oó]n|under construction|coming soon|p[aá]gina en mantenimiento|index of /|default web site page|welcome to nginx|apache2 (ubuntu|debian) default|hostinger.*(parked|default)|it works!`, 'i');
const BLOCKED = new Set([401, 403, 405, 406, 429, 503]); // bot protection: the site exists and answers
const SOCIAL_HOST = /facebook|instagram|linktr|wa\.me|whatsapp/i;

/** Pure: probe result -> 'ok' | 'broken' | 'social'. */
export function classifyProbe({ status = null, finalHost = '', body = '' } = {}) {
  if (status == null || (status >= 400 && !BLOCKED.has(status))) return 'broken';
  if (SOCIAL_HOST.test(finalHost)) return 'social';
  const low = body.toLowerCase();
  if (low.length < 60000 && PARKED.test(low.slice(0, 60000))) return 'broken';
  return 'ok';
}

export async function probeSite(url) {
  try {
    const r = await fetch(url, {
      redirect: 'follow', signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36' },
    });
    const type = r.headers.get('content-type') || '';
    const body = type.includes('html') ? (await r.text()).slice(0, 400000) : '';
    return classifyProbe({ status: r.status, finalHost: new URL(r.url).hostname, body });
  } catch {
    return classifyProbe({ status: null });
  }
}
