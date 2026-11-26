// Overlay layer of the demo reels: one HTML page per reel, every animation driven by a single time value
// (window.render(t)), screenshotted with a transparent background by headless Chromium.
// All text on the page comes from the reel config; nothing is hard-coded here.
import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const W = 720, H = 1280, FPS = 30;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/ · /g, ' · ').replace(/S\/ /g, 'S/ ');
const norm = (w) => w.replace(/[¿?¡!.,:;·]/g, '').toLowerCase();
const f3 = (n) => Number(n).toFixed(3);

// ---------- icons (viewBox 0 0 100 100) ----------
const ICONS = {
  flame: (a, b) => `<path d="M50 5 C55 21 77 33 77 58 C77 77 65 93 50 93 C35 93 23 79 23 62 C23 51 29 43 36 37 C36 47 42 53 46 53 C42 39 44 21 50 5 Z" fill="${a}"/>
    <path d="M51 46 C55 57 63 61 63 72 C63 81 57 87 50 87 C43 87 37 81 37 72 C37 63 46 59 51 46 Z" fill="${b}"/>`,
  paw: (a) => `<g fill="${a}"><ellipse cx="22" cy="46" rx="8" ry="11" transform="rotate(-22 22 46)"/><ellipse cx="39" cy="27" rx="9" ry="12" transform="rotate(-8 39 27)"/>
    <ellipse cx="61" cy="27" rx="9" ry="12" transform="rotate(8 61 27)"/><ellipse cx="78" cy="46" rx="8" ry="11" transform="rotate(22 78 46)"/>
    <path d="M50 50 C64 50 79 63 79 75 C79 86 68 88 60 84 C55 82 45 82 40 84 C32 88 21 86 21 75 C21 63 36 50 50 50 Z"/></g>`,
  scissors: (a, b) => `<g stroke="${a}" stroke-linecap="round" fill="none"><circle cx="27" cy="78" r="12" stroke-width="7"/><circle cx="73" cy="78" r="12" stroke-width="7"/>
    <path d="M34 68 L70 12" stroke-width="9"/><path d="M66 68 L30 12" stroke-width="9"/></g><circle cx="50" cy="47" r="5.5" fill="${b}"/>`,
};
const WA = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

function starburst(n = 24, rIn = 0.86) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = (i % 2 ? rIn : 1) * 50, a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`);
  }
  return `polygon(${pts.join(',')})`;
}

function lcg(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }

// ---------- scenes ----------
function hookScene(tl) {
  const { lines, highlightWord } = tl.hook, hl = norm(highlightWord || '');
  let i = 0;
  const base = 0.12, step = 0.12;
  const rows = lines.map((l) => `<div class="hline">${l.split(' ').map((w) => {
    const d = base + i * step, rot = [-8, 5, -5, 7][i % 4], isHl = norm(w) === hl;
    i++;
    return `<span class="w${isHl ? ' hl' : ''}" style="--d:${f3(d)}s;--rot:${rot}deg">${esc(w)}</span>`;
  }).join('')}</div>`).join('');
  const land = base + (i - 1) * step + 0.22;
  return `<div class="scene" data-s="0" data-e="${f3(tl.hook.end)}">
    <div class="hscrim" style="--x:${f3(tl.hook.end - 0.25)}s"></div>
    <div class="hexit" style="--x:${f3(tl.hook.end - 0.22)}s"><div class="hshake" style="--l:${f3(land)}s"><div class="hlines">${rows}</div></div></div>
  </div>`;
}

// lines of at most ~16 characters: a single short line stays, otherwise the most balanced 2-line split
function splitLines(text) {
  if (text.includes('\n')) return text.split('\n');
  const w = text.split(' ');
  if (text.length <= 16 || w.length < 2) return [text];
  let best = null;
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(a.length, b.length);
    if (!best || m < best.m) best = { m, l: [a, b] };
  }
  return best.l;
}

function captionScene(c, tl) {
  const words = splitLines(c.display).map((ln) => ln.split(' '));
  const flat = words.flat();
  const key = c.key ? norm(c.key) : norm([...flat].sort((a, b) => norm(b).length - norm(a).length)[0]);
  let keyDone = false;
  const html = words.map((ln) => ln.map((w) => {
    const isKey = !keyDone && norm(w) === key; if (isKey) keyDone = true;
    return `<span class="cw${isKey ? ' key' : ''}">${esc(w)}</span>`;
  }).join(' ')).join('<br>');
  const dur = c.end - c.start;
  return `<div class="scene" data-s="${f3(c.start)}" data-e="${f3(c.end)}">
    <div class="capout" style="--x:${f3(Math.max(0, dur - 0.1))}s"><div class="capbox"><div class="cpop"><div class="cbreath">
      <div class="ctext">${html}</div><div class="cbar"></div></div></div></div></div>
  </div>`;
}

function cardScene(c) {
  const hasItems = c.items && c.items.length;
  const items = (c.items || []).map((t, i) => `<div class="item" style="--d:${f3(0.15 + i * 0.1)}s">${esc(t)}</div>`).join('');
  const stampText = c.price
    ? `<div class="sprice">${esc(c.price)}</div>`
    : `<div class="sbadge">${esc(c.badge || '')}</div>`;
  const stamp = (c.price || c.badge) ? `<div class="stampwrap${hasItems ? '' : ' center'}"><div class="ring"></div><div class="slam"><div class="spulse">
      <div class="burst"></div><div class="sin">${stampText}</div></div></div></div>` : '';
  return `<div class="scene card${c.compact ? ' compact' : ''}" data-s="${f3(c.at)}" data-e="${f3(c.at + c.dur)}">
    <div class="cexit" style="--x:${f3(c.dur - 0.38)}s"><div class="cslide"><div class="cshake">
      <div class="panel"><div class="pshine"></div>
        ${c.title ? `<div class="ribbon"><span>${esc(c.title)}</span></div>` : '<div class="pole"></div>'}
        ${c.headline ? `<div class="headline" style="--d:.12s">${esc(c.headline)}</div>` : ''}
        <div class="items">${items}</div>
        ${stamp}
      </div></div></div></div>
  </div>`;
}

function outroScene(o, pal, kindIcon) {
  const iconKind = o.icon || 'flame';
  const iconSvg = ICONS[iconKind](pal.accent, pal.key);
  const iconColor = iconKind === 'paw' ? pal.key : iconKind === 'scissors' ? pal.accent : pal.accent;
  const iconBody = iconKind === 'paw' ? ICONS.paw(iconColor) : iconKind === 'scissors' ? ICONS.scissors(pal.accent, pal.red || pal.key) : iconSvg;
  const r = lcg(7);
  let pattern = '';
  if (o.pattern === 'rays') pattern = '<div class="rays"></div>';
  if (o.pattern === 'paws') {
    pattern = '<div class="paws">' + Array.from({ length: 16 }, (_, i) => {
      const x = Math.round(r() * 640), sz = 70 + Math.round(r() * 90), dur = 8 + Math.round(r() * 6), del = -Math.round(r() * dur * 10) / 10, rot = Math.round(r() * 80 - 40);
      return `<svg class="paw" viewBox="0 0 100 100" style="left:${x}px;width:${sz}px;height:${sz}px;--dur:${dur}s;--del:${del}s;--rot:${rot}deg">${ICONS.paw(pal.key)}</svg>`;
    }).join('') + '</div>';
  }
  if (o.pattern === 'pole') pattern = '<div class="stripes"></div><div class="pole-band top"><i></i></div><div class="pole-band bot"><i></i></div>';
  const dur = o.dur;
  return `<div class="scene outro p-${esc(o.pattern)}" data-s="${f3(o.at)}" data-e="${f3(o.at + dur)}">
    <div class="obg"><div class="obase"></div>${pattern}</div>
    <div class="opunch" style="--p:${f3(dur - 0.45)}s">
      <div class="ocol">
        <div class="badgewrap"><div class="float"><svg viewBox="0 0 200 200" width="290" height="290">
          <defs><clipPath id="bc"><circle cx="100" cy="100" r="96"/></clipPath>
            <linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
          <circle cx="100" cy="100" r="96" fill="${pal.key}"/>
          <circle cx="100" cy="100" r="85" fill="${pal.bg2}" stroke="${pal.accent}" stroke-width="6"/>
          <circle class="dots" cx="100" cy="100" r="76" fill="none" stroke="${pal.text}" stroke-opacity=".55" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round"/>
          <svg x="38" y="36" width="124" height="124" viewBox="0 0 100 100">${iconBody}</svg>
          <g clip-path="url(#bc)"><g class="sweepg"><rect x="-90" y="-40" width="50" height="280" fill="url(#sw)" transform="rotate(18 0 100)"/></g></g>
        </svg></div></div>
        <div class="oname">${esc(o.name)}</div>
        <div class="okind">${esc(o.kind)}</div>
        ${o.recap ? `<div class="orecap">${esc(o.recap)}</div>` : ''}
        <div class="btnwrap"><div class="btnp"><div class="btn"><svg viewBox="0 0 24 24" width="62" height="62"><path fill="#fff" d="${WA}"/></svg><span>${esc(o.cta)}</span></div></div></div>
        ${o.sub ? `<div class="osub">${esc(o.sub)}</div>` : ''}
      </div>
    </div>
    <div class="oflash" style="--p:${f3(dur - 0.45)}s"></div>
  </div>`;
}

// ---------- page ----------
const CSS = (pal) => `
@font-face{font-family:BC;src:url("file:///C:/Windows/Fonts/bahnschrift.ttf");font-weight:300 700;font-stretch:75% 100%}
:root{--bg:${pal.bg};--bg2:${pal.bg2};--accent:${pal.accent};--key:${pal.key};--text:${pal.text};--ink:${pal.ink};--red:${pal.red || pal.accent};--blue:${pal.blue || pal.key}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden}
#stage{position:relative;width:${W}px;height:${H}px;overflow:hidden;font-family:'Segoe UI',sans-serif;color:var(--text)}
.scene{position:absolute;inset:0;visibility:hidden}
.hd,.hline,.cw,.ribbon,.headline,.item,.sprice,.sbadge,.oname,.btn,.orecap{font-family:BC,Bahnschrift,'Arial Narrow',sans-serif}
@keyframes fadeout{from{opacity:1}to{opacity:0}}
@keyframes fadein{from{opacity:0}to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}

/* hook */
.hscrim{position:absolute;inset:0;background:radial-gradient(ellipse 85% 48% at 50% 44%,rgba(0,0,0,.62),rgba(0,0,0,.18) 75%,transparent);animation:fadein .15s both,fadeout .2s var(--x) both}
.hexit{position:absolute;inset:0;animation:hexit .2s cubic-bezier(.5,0,.9,.4) var(--x) both}
@keyframes hexit{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.62)}}
.hshake{position:absolute;inset:0;animation:shake .3s linear var(--l) both}
@keyframes shake{0%{transform:translate(0,0)}15%{transform:translate(-12px,7px) rotate(-.7deg)}35%{transform:translate(10px,-8px) rotate(.6deg)}55%{transform:translate(-7px,5px)}75%{transform:translate(4px,-3px)}100%{transform:translate(0,0)}}
.hlines{position:absolute;left:60px;width:600px;top:160px;height:940px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.hline{display:inline-flex;gap:.2em;white-space:nowrap;font-size:130px;line-height:.98;text-transform:uppercase;font-variation-settings:'wght' 700,'wdth' 75;filter:drop-shadow(0 8px 14px rgba(0,0,0,.55))}
.hline .w{display:inline-block;position:relative;isolation:isolate;color:#fff;-webkit-text-stroke:.075em var(--ink);paint-order:stroke fill;animation:wpop .24s cubic-bezier(.2,1.7,.4,1) var(--d) both}
@keyframes wpop{from{opacity:0;transform:scale(1.7) rotate(var(--rot))}to{opacity:1;transform:scale(1) rotate(0)}}
.hline .w.hl{color:var(--ink);-webkit-text-stroke:0}
.hline .w.hl::before{content:'';position:absolute;left:-.16em;right:-.16em;top:.08em;bottom:-.02em;background:var(--accent);z-index:-1;border-radius:.1em;transform-origin:left center;transform:skewX(-7deg);box-shadow:0 .05em 0 rgba(0,0,0,.35);animation:wipe .28s cubic-bezier(.2,.9,.3,1) calc(var(--d) + .04s) both}
@keyframes wipe{from{transform:skewX(-7deg) scaleX(0)}to{transform:skewX(-7deg) scaleX(1)}}

/* captions */
.capout{position:absolute;inset:0;animation:fadeout .1s linear var(--x) both}
.capbox{position:absolute;left:60px;width:600px;top:730px;height:230px;display:flex;align-items:center;justify-content:center}
.cpop{animation:cpop .18s cubic-bezier(.2,1.6,.4,1) both}
@keyframes cpop{from{opacity:0;transform:translateY(24px) scale(.85)}to{opacity:1;transform:none}}
.cbreath{animation:breath 1.3s ease-in-out infinite alternate;display:flex;flex-direction:column;align-items:center}
@keyframes breath{from{transform:scale(1)}to{transform:scale(1.04)}}
.ctext{text-align:center;font-size:66px;line-height:1.02;white-space:nowrap;font-variation-settings:'wght' 700,'wdth' 80;
  filter:drop-shadow(0 6px 12px rgba(0,0,0,.7))}
.cw{color:#fff;-webkit-text-stroke:.22em rgba(0,0,0,.92);paint-order:stroke fill;letter-spacing:.01em}
.cw.key{color:var(--key)}
.cbar{margin-top:12px;width:150px;height:9px;border-radius:5px;background:var(--accent);box-shadow:0 3px 8px rgba(0,0,0,.5);transform-origin:center;animation:bar .3s cubic-bezier(.2,.9,.3,1) .06s both}
@keyframes bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}

/* offer card */
.cexit{position:absolute;inset:0;animation:cexit .38s cubic-bezier(.5,0,.9,.5) var(--x) both}
@keyframes cexit{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(-120px) scale(.86)}}
.cslide{position:absolute;inset:0;animation:cslide .6s linear both}
@keyframes cslide{0%{transform:translateY(900px)}55%{transform:translateY(-26px);animation-timing-function:ease-in-out}78%{transform:translateY(9px)}100%{transform:translateY(0)}}
.cslide{animation-timing-function:cubic-bezier(.2,.8,.3,1)}
.cshake{position:absolute;inset:0;animation:cshake .3s linear .5s both}
@keyframes cshake{0%{transform:translate(0,0)}20%{transform:translate(-7px,5px)}45%{transform:translate(6px,-5px)}70%{transform:translate(-3px,2px)}100%{transform:translate(0,0)}}
.panel{position:absolute;left:60px;top:290px;width:600px;height:580px;border-radius:36px;overflow:visible;
  background:linear-gradient(160deg,var(--bg2),var(--bg));border:7px solid var(--key);box-shadow:0 30px 70px rgba(0,0,0,.55),inset 0 0 0 3px rgba(255,255,255,.08)}
.pshine{position:absolute;inset:0;border-radius:28px;overflow:hidden;pointer-events:none}
.pshine::after{content:'';position:absolute;top:-20%;bottom:-20%;width:120px;left:-200px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);transform:skewX(-18deg);animation:shine 1.9s linear .8s infinite}
@keyframes shine{from{left:-200px}to{left:760px}}
.ribbon{position:absolute;left:50%;top:-44px;margin-left:-280px;width:560px;text-align:center;transform:rotate(-4deg);animation:rib .25s cubic-bezier(.2,1.6,.4,1) .08s both}
@keyframes rib{from{opacity:0;transform:rotate(-14deg) scale(.4)}to{opacity:1;transform:rotate(-4deg) scale(1)}}
.ribbon span{display:block;white-space:nowrap;padding:12px 50px 10px;background:var(--accent);color:#fff;font-size:54px;line-height:1.05;text-transform:uppercase;font-variation-settings:'wght' 700,'wdth' 78;
  -webkit-text-stroke:.06em var(--ink);paint-order:stroke fill;clip-path:polygon(0 0,100% 0,96% 50%,100% 100%,0 100%,4% 50%);filter:drop-shadow(0 6px 0 rgba(0,0,0,.35))}
.pole{position:absolute;left:30px;right:30px;top:20px;height:16px;border-radius:8px;background:repeating-linear-gradient(-45deg,var(--red) 0 14px,var(--text) 14px 28px,var(--blue) 28px 42px,var(--text) 42px 56px);animation:polemove 1s linear infinite}
@keyframes polemove{from{background-position:0 0}to{background-position:79px 0}}
.headline{position:absolute;left:30px;right:30px;top:90px;text-align:center;white-space:nowrap;font-size:104px;line-height:.98;text-transform:uppercase;color:var(--key);font-variation-settings:'wght' 700,'wdth' 75;
  -webkit-text-stroke:.06em var(--ink);paint-order:stroke fill;filter:drop-shadow(0 6px 0 rgba(0,0,0,.4));animation:ipop .24s cubic-bezier(.2,1.6,.4,1) var(--d) both}
.items{position:absolute;left:36px;top:104px;width:360px}
.item{font-size:58px;line-height:1.08;text-wrap:balance;color:var(--text);font-variation-settings:'wght' 700,'wdth' 80;margin-bottom:18px;padding-left:34px;position:relative;filter:drop-shadow(0 3px 0 rgba(0,0,0,.35));animation:ipop .24s cubic-bezier(.2,1.6,.4,1) var(--d) both}
.item::before{content:'';position:absolute;left:0;top:.28em;width:20px;height:20px;border-radius:50%;background:var(--key)}
@keyframes ipop{from{opacity:0;transform:translateX(-40px) scale(.9)}to{opacity:1;transform:none}}
.stampwrap{position:absolute;left:220px;top:270px;width:380px;height:380px}
.stampwrap.center{left:110px;top:230px}
.compact .panel{top:190px;height:350px}
.compact .headline{top:50px;font-size:84px}
.compact .stampwrap.center{left:165px;top:112px;width:270px;height:270px}
.compact .sin{inset:14px}
.compact .sbadge{font-size:48px;padding:0 10px}
.slam{position:absolute;inset:0;animation:slam .42s linear .3s both}
@keyframes slam{0%{opacity:0;transform:scale(2.6) rotate(-44deg);animation-timing-function:cubic-bezier(.5,0,.9,.5)}48%{opacity:1;transform:scale(.86) rotate(-10deg);animation-timing-function:ease-out}72%{transform:scale(1.09) rotate(-16deg);animation-timing-function:ease-in-out}100%{transform:scale(1) rotate(-14deg)}}
.spulse{position:absolute;inset:0;animation:pulse .9s ease-in-out .9s infinite alternate}
@keyframes pulse{from{transform:scale(1)}to{transform:scale(1.055)}}
.burst{position:absolute;inset:0;background:var(--key);clip-path:${starburst()};filter:drop-shadow(0 8px 0 rgba(0,0,0,.35))}
.sin{position:absolute;inset:20px;border-radius:50%;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--accent) 80%,#fff),var(--accent));border:6px solid var(--text);display:flex;align-items:center;justify-content:center;text-align:center;box-shadow:inset 0 0 0 4px rgba(0,0,0,.14)}
.sprice{font-size:150px;line-height:1;color:#fff;font-variation-settings:'wght' 700,'wdth' 78;white-space:nowrap;-webkit-text-stroke:.07em var(--ink);paint-order:stroke fill;filter:drop-shadow(0 5px 0 rgba(0,0,0,.35))}
.sbadge{font-size:64px;line-height:1;color:#fff;padding:0 22px;text-wrap:balance;text-transform:uppercase;font-variation-settings:'wght' 700,'wdth' 78;-webkit-text-stroke:.07em var(--ink);paint-order:stroke fill;filter:drop-shadow(0 4px 0 rgba(0,0,0,.35))}
.ring{position:absolute;inset:0;border-radius:50%;border:9px solid var(--key);opacity:0;animation:ringx .5s ease-out .5s both}
@keyframes ringx{from{opacity:.9;transform:scale(.7)}to{opacity:0;transform:scale(1.9)}}

/* outro */
.obg{position:absolute;inset:0;overflow:hidden;animation:oreveal .5s cubic-bezier(.6,0,.2,1) both}
@keyframes oreveal{from{clip-path:circle(0% at 50% 28%)}to{clip-path:circle(150% at 50% 28%)}}
.obase{position:absolute;inset:0}
.outro.p-rays .obase{background:radial-gradient(circle at 50% 28%,#ff8a2a 0,#e0560d 26%,#8a2f0a 55%,var(--bg) 92%)}
.rays{position:absolute;left:50%;top:28%;width:2600px;height:2600px;margin:-1300px 0 0 -1300px;background:repeating-conic-gradient(rgba(255,214,90,.30) 0 7.5deg,transparent 7.5deg 15deg);-webkit-mask-image:radial-gradient(circle,#000 0,rgba(0,0,0,.5) 35%,transparent 62%);animation:spin 34s linear infinite}
.outro.p-paws .obase{background:linear-gradient(170deg,#12756d,var(--bg) 55%,#083f3b)}
.paws{position:absolute;inset:0}
.paw{position:absolute;top:0;opacity:.16;animation:drift var(--dur) linear var(--del) infinite}
@keyframes drift{from{transform:translateY(1380px) rotate(var(--rot))}to{transform:translateY(-220px) rotate(calc(var(--rot) + 50deg))}}
.outro.p-pole .obase{background:radial-gradient(circle at 50% 30%,#2a241b,var(--bg) 80%)}
.stripes{position:absolute;left:-300px;top:-300px;width:1500px;height:2000px;background:repeating-linear-gradient(-45deg,rgba(226,172,69,.16) 0 34px,transparent 34px 68px);animation:stripemove 2.4s linear infinite}
@keyframes stripemove{from{transform:translateX(0)}to{transform:translateX(96.17px)}}
.pole-band{position:absolute;left:0;right:0;height:34px;overflow:hidden;box-shadow:0 0 0 3px var(--ink)}
.pole-band.top{top:92px}.pole-band.bot{top:1160px}
.pole-band i{position:absolute;left:-200px;top:0;width:1200px;height:34px;background:repeating-linear-gradient(-45deg,var(--red) 0 17px,var(--text) 17px 34px,var(--blue) 34px 51px,var(--text) 51px 68px);animation:polemove2 1.1s linear infinite}
.pole-band.bot i{animation-direction:reverse}
@keyframes polemove2{from{transform:translateX(0)}to{transform:translateX(96.17px)}}
.opunch{position:absolute;inset:0;animation:punch .32s ease-out var(--p) both}
@keyframes punch{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}
.oflash{position:absolute;inset:0;background:#fff;opacity:0;animation:oflash .22s ease-out var(--p) forwards}
@keyframes oflash{0%{opacity:.5}100%{opacity:0}}
.ocol{position:absolute;left:40px;width:640px;top:140px;height:960px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.badgewrap{animation:badgein .75s cubic-bezier(.2,1.3,.4,1) .25s both}
@keyframes badgein{from{opacity:0;transform:scale(.1) rotate(-220deg)}to{opacity:1;transform:scale(1) rotate(0)}}
.float{animation:float 1.6s ease-in-out infinite alternate;filter:drop-shadow(0 14px 18px rgba(0,0,0,.5))}
@keyframes float{from{transform:translateY(0)}to{transform:translateY(-9px)}}
.dots{transform-origin:100px 100px;animation:spin 14s linear infinite}
.sweepg{animation:sweep 1.5s ease-in-out .9s infinite}
@keyframes sweep{0%{transform:translateX(0)}60%,100%{transform:translateX(330px)}}
.oname{max-width:600px;text-align:center;text-wrap:balance;font-size:100px;line-height:.94;text-transform:uppercase;color:#fff;font-variation-settings:'wght' 700,'wdth' 75;
  -webkit-text-stroke:.07em var(--ink);paint-order:stroke fill;filter:drop-shadow(0 6px 0 rgba(0,0,0,.4));animation:nreveal .45s cubic-bezier(.2,.9,.3,1) .7s both}
@keyframes nreveal{from{opacity:0;clip-path:inset(0 100% 0 0);transform:translateY(30px)}to{opacity:1;clip-path:inset(-20px -20px -20px -20px);transform:none}}
.okind{font-size:28px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--key);text-shadow:0 2px 6px rgba(0,0,0,.55);animation:rise .3s cubic-bezier(.2,1.4,.4,1) 1.0s both}
@keyframes rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.orecap{margin-top:14px;text-align:center;text-wrap:balance;font-size:42px;line-height:1.05;color:#fff;font-variation-settings:'wght' 700,'wdth' 82;-webkit-text-stroke:.12em rgba(0,0,0,.6);paint-order:stroke fill;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5));animation:ipop2 .26s cubic-bezier(.2,1.6,.4,1) 1.35s both}
@keyframes ipop2{from{opacity:0;transform:scale(.8) translateY(20px)}to{opacity:1;transform:none}}
.btnwrap{margin-top:12px;animation:btnin .5s cubic-bezier(.2,1.5,.4,1) 1.75s both}
@keyframes btnin{from{opacity:0;transform:translateY(130px) scale(.6)}to{opacity:1;transform:none}}
.btnp{animation:btnpulse .8s ease-in-out 2.3s infinite alternate}
@keyframes btnpulse{from{transform:scale(1)}to{transform:scale(1.05)}}
.btn{display:flex;align-items:center;justify-content:center;gap:18px;min-width:520px;max-width:620px;white-space:nowrap;padding:20px 34px 20px 28px;border-radius:80px;background:#25D366;color:#fff;font-size:38px;line-height:1.02;font-variation-settings:'wght' 700,'wdth' 85;
  text-shadow:0 2px 0 rgba(0,0,0,.3);box-shadow:0 10px 0 #128c4a,0 18px 26px rgba(0,0,0,.45),0 0 0 6px rgba(255,255,255,.25)}
.btn span{text-wrap:balance;text-align:left}
.btn svg{flex:none;filter:drop-shadow(0 2px 0 rgba(0,0,0,.25))}
.osub{font-size:34px;font-weight:600;color:var(--text);text-shadow:0 2px 6px rgba(0,0,0,.6);animation:rise .3s ease-out 2.1s both}

/* flash at t=0 */
.flash{background:#fff}
`;

export function buildHtml(tl) {
  const pal = tl.palette;
  const scenes = [
    hookScene(tl),
    ...tl.captions.map((c) => captionScene(c, tl)),
    ...tl.cards.map((c) => cardScene(c)),
    outroScene(tl.outro, pal),
    `<div class="scene flash" data-s="0" data-e="0.065"></div>`,
  ];
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${CSS(pal)}</style></head><body>
<div id="stage">${scenes.join('\n')}</div>
<script>
const scenes=[...document.querySelectorAll('.scene')].map(el=>({el,s:+el.dataset.s,e:+el.dataset.e,anims:null,on:false}));
function fit(){
  const lines=[...document.querySelectorAll('.hline')];
  let fs=130;
  const over=()=>lines.some(l=>l.offsetWidth>596);
  while(over()&&fs>40){fs-=2;lines.forEach(l=>l.style.fontSize=fs+'px');}
  document.querySelectorAll('.ctext').forEach(el=>{ let f=66; while(el.offsetWidth>596&&f>30){f-=2;el.style.fontSize=f+'px';} });
  document.querySelectorAll('.oname,.headline,.ribbon span').forEach(el=>{ let f=parseFloat(getComputedStyle(el).fontSize); while(el.scrollWidth>el.clientWidth+1&&f>30){f-=2;el.style.fontSize=f+'px';} });
}
window.ready=(async()=>{
  await document.fonts.load("700 40px BC");
  await document.fonts.ready;
  fit();
  scenes.forEach(sc=>{ sc.anims=sc.el.getAnimations({subtree:true}); sc.anims.forEach(a=>a.pause()); });
  return document.fonts.check("700 40px BC");
})();
window.render=(t)=>{
  for(const sc of scenes){
    const on=t>=sc.s-1e-6&&t<sc.e-1e-6;
    if(on){ if(!sc.on){sc.el.style.visibility='visible';sc.on=true;} const ms=(t-sc.s)*1000; for(const a of sc.anims) a.currentTime=ms; }
    else if(sc.on){ sc.el.style.visibility='hidden'; sc.on=false; }
  }
  void document.body.offsetHeight;
};
</script></body></html>`;
}

function browserPath() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'ms-playwright');
  const shell = readdirSync(base).filter((d) => d.startsWith('chromium_headless_shell-')).sort().pop();
  if (!shell) throw new Error('No chromium_headless_shell in ' + base + ' (run: npx playwright-core install chromium)');
  const dir = join(base, shell);
  const sub = readdirSync(dir).find((d) => d.startsWith('chrome-headless-shell'));
  return join(dir, sub, 'chrome-headless-shell.exe');
}

// Render frames [i0, i1) to dir as f%05d.png (transparent). workers = parallel pages.
export async function renderFrames(tl, dir, { from = 0, to, workers = 3, only } = {}) {
  mkdirSync(dir, { recursive: true });
  const htmlFile = join(dir, '..', `${tl.slug}-overlay.html`);
  writeFileSync(htmlFile, buildHtml(tl), 'utf8');
  const browser = await chromium.launch({ executablePath: browserPath(), args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--allow-file-access-from-files'] });
  try {
    const total = to ?? Math.round(tl.total * FPS);
    const idx = only ? [only] : Array.from({ length: total - from }, (_, k) => from + k);
    let next = 0;
    const pages = [];
    for (let w = 0; w < workers; w++) {
      const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
      page.on('pageerror', (e) => console.error('  page error:', e.message));
      await page.goto('file:///' + htmlFile.replace(/\\/g, '/'));
      const fontOk = await page.evaluate(() => window.ready);
      if (!fontOk) console.warn('  WARNING: Bahnschrift did not load; headings use a fallback font');
      pages.push(page);
    }
    await Promise.all(pages.map(async (page) => {
      while (next < idx.length) {
        const i = idx[next++];
        await page.evaluate((t) => window.render(t), i / FPS);
        await page.screenshot({ path: join(dir, `f${String(i).padStart(5, '0')}.png`), omitBackground: true, type: 'png' });
      }
    }));
    return htmlFile;
  } finally { await browser.close(); }
}

export function cleanDir(dir) { rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); }
