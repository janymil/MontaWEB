// data + copy -> one self-contained HTML page (inline CSS and SVG, no external requests).
import { scoreBand, bandOfPosition } from './score.mjs';

export const WHATSAPP_NUMBER = '51965403196';

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function fill(str, vars) {
  return String(str).replace(/\{(business|keyword|district|date|n|price|id)\}/g, (m, k) =>
    vars[k] === undefined || vars[k] === null ? m : String(vars[k]));
}

export function whatsappLink(template, vars) {
  const encodedVars = Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, String(v)]));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fill(template, encodedVars))}`;
}

const DASH = '—';
const COLORS = { top3: '#5fcf8a', top10: '#f6d04d', top20: '#ff9b6b', absent: '#d8d4c8' };

function gridSvg(cells, labelFn) {
  const size = 58, gap = 6, pad = 4;
  const total = pad * 2 + 5 * size + 4 * gap;
  const rects = cells.map(({ row, col, position }) => {
    const x = pad + col * (size + gap);
    const y = pad + row * (size + gap);
    const band = bandOfPosition(position);
    const centre = row === 2 && col === 2;
    const label = position == null ? DASH : position;
    return `<g><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="10" fill="${COLORS[band]}"` +
      (centre ? ' stroke="#181816" stroke-width="3"' : '') + '/>' +
      `<text x="${x + size / 2}" y="${y + size / 2 + (centre ? 3 : 7)}" text-anchor="middle" font-size="20" font-weight="800" fill="#181816">${label}</text>` +
      (centre ? `<circle cx="${x + size / 2}" cy="${y + 12}" r="5" fill="#181816"/><circle cx="${x + size / 2}" cy="${y + 12}" r="2" fill="#fffdf7"/>` : '') +
      '</g>';
  }).join('');
  return `<svg viewBox="0 0 ${total} ${total}" role="img" aria-label="${esc(labelFn)}" class="grid"><title>${esc(labelFn)}</title>${rects}</svg>`;
}

function profileCard(copy, p, isSelf, vars) {
  const t = (k) => esc(fill(copy[k], vars));
  const yn = (v) => (v === null || v === undefined ? DASH : v ? t('yes') : t('no'));
  const num = (v) => (v === null || v === undefined ? DASH : esc(v));
  const name = p.name ? esc(p.name) : DASH;
  return `<article class="card${isSelf ? ' me' : ''}">
<p class="cap">${t('col_business')}</p>
<h3>${name}${isSelf ? ` <span class="tag">${esc(fill(copy.you_label, vars))}</span>` : ''}</h3>
<dl>
<div><dt>${t('col_rating')}</dt><dd>${num(p.rating)}</dd></div>
<div><dt>${t('col_reviews')}</dt><dd>${num(p.reviews)}</dd></div>
<div><dt>${t('col_photos')}</dt><dd>${num(p.photos)}</dd></div>
<div><dt>${t('col_website')}</dt><dd>${yn(p.website)}</dd></div>
<div><dt>${t('col_hours')}</dt><dd>${yn(p.hours)}</dd></div>
<div><dt>${t('col_claimed')}</dt><dd>${yn(p.claimed)}</dd></div>
</dl></article>`;
}

const CSS = `
:root{--paper:#f3f0e7;--ink:#181816;--cream:#fffdf7;--orange:#ff5b35;--orange-text:#b8391f;--lime:#d9fa65;--muted:#5d5b55;--line:rgba(24,24,22,.18)}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:1rem;line-height:1.55}
main{max-inline-size:430px;margin-inline:auto;padding:20px 16px 28px}
h1{font-size:clamp(1.5rem,1rem + 4vw,1.9rem);line-height:1.15;letter-spacing:-.03em;margin:0 0 .5rem}
h2{font-size:1.15rem;letter-spacing:-.02em;margin:0 0 .35rem}
h3{font-size:1rem;margin:0 0 .5rem}
p{margin:0 0 .75rem}
section{margin-block:1.6rem 0}
.brand{display:inline-block;font-weight:800;font-size:.85rem;letter-spacing:.02em;background:var(--lime);padding:.15rem .6rem;border-radius:2px;margin-block-end:.9rem}
.grid{display:block;inline-size:100%;block-size:auto;margin-block:.5rem}
.legend{list-style:none;padding:0;margin:.4rem 0 0;display:grid;grid-template-columns:1fr 1fr;gap:.35rem .75rem;font-size:.85rem}
.legend li{display:flex;align-items:center;gap:.5rem}
.sw{inline-size:1rem;block-size:1rem;border-radius:4px;flex:none}
.score{display:flex;align-items:baseline;gap:.4rem;margin-block:.25rem}
.score strong{font-size:3.2rem;line-height:1;letter-spacing:-.05em}
.score span{color:var(--muted);font-weight:700}
.bar{block-size:12px;background:var(--paper-deep,#e9e4d8);border:1px solid var(--line);border-radius:6px;overflow:hidden;margin-block:.4rem .7rem}
.bar i{display:block;block-size:100%;background:var(--orange)}
.card{background:var(--cream);border:1px solid var(--line);border-radius:6px;padding:.8rem .9rem;margin-block-end:.7rem}
.card.me{border:2px solid var(--ink)}
.tag{display:inline-block;font-size:.72rem;background:var(--ink);color:var(--cream);padding:0 .45rem;border-radius:2px;vertical-align:middle}
.cap{margin:0;color:var(--muted);font-size:.75rem;text-transform:uppercase;letter-spacing:.06em}
dl{display:grid;grid-template-columns:1fr 1fr;gap:.35rem .8rem;margin:0}
dl div{display:flex;justify-content:space-between;gap:.5rem;border-block-end:1px dashed var(--line);padding-block-end:.15rem}
dt{color:var(--muted);font-size:.85rem}
dd{margin:0;font-weight:700}
.fix{background:var(--cream);border-inline-start:4px solid var(--orange);padding:.7rem .9rem;margin-block-end:.7rem;border-radius:0 6px 6px 0}
.fix h3{margin-block-end:.25rem}
.offer{font-weight:700;color:var(--orange-text);margin:0}
.cta{display:flex;align-items:center;justify-content:center;min-block-size:54px;padding:14px 21px;background:var(--ink);color:var(--cream);text-decoration:none;font-weight:700;border-radius:2px;margin-block:1.6rem 0;text-align:center}
.cta:focus-visible{outline:3px solid var(--orange);outline-offset:3px}
.src,footer{color:var(--muted);font-size:.8rem;margin-block-start:1rem}
`;

export function render(copy, d) {
  const hits = d.cells.filter((c) => c.position != null).length;
  const vars = { business: d.business, keyword: d.keyword, district: d.district, date: d.date, id: d.id, n: hits, price: '' };
  const f = (key, extra = {}) => esc(fill(copy[key], { ...vars, ...extra }));
  const band = scoreBand(d.score);

  const legend = [
    ['top3', 'legend_top3'], ['top10', 'legend_4_10'], ['top20', 'legend_11_20'], ['absent', 'legend_absent'],
  ].map(([b, k]) => `<li><span class="sw" style="background:${COLORS[b]}"></span>${f(k)}</li>`).join('');

  const fixes = d.fixes.map((fx) => {
    const x = { price: fx.price ?? '', n: fx.n ?? '' };
    return `<div class="fix"><h3>${f(`fix_${fx.key}_title`, x)}</h3><p>${f(`fix_${fx.key}_body`, x)}</p>` +
      (fx.offer ? `<p class="offer">${f(`fix_${fx.key}_offer`, x)}</p>` : '') + '</div>';
  }).join('');

  const wa = whatsappLink(copy.cta_whatsapp_message, vars);

  return `<!doctype html>
<html lang="es-PE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${f('title')}</title>
<style>${CSS}</style>
</head>
<body>
<main>
<span class="brand">${f('footer_brand')}</span>
<h1>${f('title')}</h1>
<p>${f('intro')}</p>

<section aria-labelledby="h-grid">
<h2 id="h-grid">${f('grid_heading')}</h2>
<p>${f('grid_explainer')}</p>
${gridSvg(d.cells, fill(copy.grid_heading, vars))}
<ul class="legend">${legend}</ul>
</section>

<section aria-labelledby="h-score">
<h2 id="h-score">${f('score_heading')}</h2>
<div class="score"><strong>${esc(d.score)}</strong><span>/ 100</span></div>
<div class="bar" aria-hidden="true"><i style="inline-size:${Math.max(0, Math.min(100, d.score))}%"></i></div>
<p>${f(`score_band_${band}`)}</p>
<p>${f('score_explainer')}</p>
</section>

<section aria-labelledby="h-compare">
<h2 id="h-compare">${f('compare_heading')}</h2>
${profileCard(copy, d.self, true, vars)}
${d.competitors.map((c) => profileCard(copy, c, false, vars)).join('\n')}
</section>

<section aria-labelledby="h-fixes">
<h2 id="h-fixes">${f('fixes_heading')}</h2>
${fixes}
</section>

<a class="cta" href="${esc(wa)}">${f('cta_button')}</a>
<p class="src">${f('source_line')}</p>
<footer>${f('footer_brand')}</footer>
</main>
</body>
</html>
`;
}
