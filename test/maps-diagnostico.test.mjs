import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildGrid, haversineMeters } from '../scripts/maps-diagnostico/grid.mjs';
import {
  positionOf, scoreFromPositions, scoreBand, rankCompetitors, profileOf, chooseFixes, WEIGHTS,
} from '../scripts/maps-diagnostico/score.mjs';
import { render, fill, whatsappLink, gridExample } from '../scripts/maps-diagnostico/render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COPY_PATH = path.join(HERE, '..', 'scripts', 'maps-diagnostico', 'copy-es.json');
const COPY_KEYS = [
  'title', 'intro', 'grid_heading', 'grid_explainer', 'grid_rank_hint', 'grid_center_label', 'grid_example',
  'grid_example_absent', 'legend_top3', 'legend_4_10', 'legend_11_20',
  'legend_absent', 'score_heading', 'score_explainer', 'score_band_low', 'score_band_mid',
  'score_band_high', 'compare_heading', 'col_business', 'col_rating', 'col_reviews', 'col_photos',
  'col_website', 'col_hours', 'col_claimed', 'yes', 'no', 'you_label', 'fixes_heading',
  'fix_broken_website_title', 'fix_broken_website_body', 'fix_broken_website_offer',
  'fix_no_website_title', 'fix_no_website_body', 'fix_no_website_offer',
  'fix_unclaimed_profile_title', 'fix_unclaimed_profile_body', 'fix_unclaimed_profile_offer',
  'fix_incomplete_profile_title', 'fix_incomplete_profile_body', 'fix_incomplete_profile_offer',
  'fix_few_reviews_title', 'fix_few_reviews_body', 'fix_low_rating_title', 'fix_low_rating_body',
  'cta_button', 'cta_whatsapp_message', 'source_line', 'footer_brand',
];

// ---- grid -----------------------------------------------------------------
test('grid: 25 points, centre is the business, spacing is respected', () => {
  const g = buildGrid(-12.1193, -77.0326, 700);
  assert.equal(g.length, 25);
  const centre = g.find((p) => p.row === 2 && p.col === 2);
  assert.equal(centre.lat, -12.1193);
  assert.equal(centre.lng, -77.0326);
  const right = g.find((p) => p.row === 2 && p.col === 3);
  const down = g.find((p) => p.row === 3 && p.col === 2);
  assert.ok(Math.abs(haversineMeters(centre, right) - 700) < 5);
  assert.ok(Math.abs(haversineMeters(centre, down) - 700) < 5);
  // north is up: row 0 has the larger latitude
  assert.ok(g.find((p) => p.row === 0 && p.col === 0).lat > centre.lat);
  const g2 = buildGrid(-12.1193, -77.0326, 500);
  assert.ok(Math.abs(haversineMeters(g2[12], g2[13]) - 500) < 5);
});

// ---- score ----------------------------------------------------------------
test('score: documented weights and a known result', () => {
  assert.deepEqual(WEIGHTS, { top3: 1, top10: 0.5, top20: 0.15, absent: 0 });
  assert.equal(scoreFromPositions(Array(25).fill(1)), 100);
  assert.equal(scoreFromPositions(Array(25).fill(null)), 0);
  // 5 cells top3 (5), 10 cells 4-10 (5), 5 cells 11-20 (0.75), 5 absent => 10.75/25 = 43
  const pos = [1, 2, 3, 3, 1, ...Array(10).fill(7), ...Array(5).fill(15), ...Array(5).fill(null)];
  assert.equal(scoreFromPositions(pos), 43);
  assert.throws(() => scoreFromPositions([1, 2]));
});

test('score: bands', () => {
  assert.equal(scoreBand(0), 'low');
  assert.equal(scoreBand(34), 'low');
  assert.equal(scoreBand(35), 'mid');
  assert.equal(scoreBand(69), 'mid');
  assert.equal(scoreBand(70), 'high');
});

test('positionOf: cid, then place_id, then exact title', () => {
  const items = [
    { type: 'maps_search', rank_absolute: 1, cid: 'A', place_id: 'pa', title: 'Uno' },
    { type: 'maps_search', rank_absolute: 2, cid: 'B', place_id: 'pb', title: 'Dos' },
    { type: 'maps_search', rank_absolute: 3, cid: 'C', place_id: 'pc', title: 'Tres' },
  ];
  assert.equal(positionOf(items, { cid: 'B' }), 2);
  assert.equal(positionOf(items, { cid: 'ZZ', place_id: 'pc' }), 3);
  assert.equal(positionOf(items, { title: 'Uno' }), 1);
  assert.equal(positionOf(items, { cid: 'ZZ', title: 'Nope' }), null);
  assert.equal(positionOf([], { cid: 'A' }), null);
});

// ---- competitors ----------------------------------------------------------
const mk = (cid, rank, extra = {}) => ({
  type: 'maps_search', rank_absolute: rank, cid, title: 'T' + cid, ...extra,
});

test('competitors: lowest average across the grid, self excluded', () => {
  const cells = Array.from({ length: 25 }, () => ({ items: [] }));
  // X: first in all cells. Y: second in all. Z: third in 12 cells. W: first in 3 cells only. SELF is first overall.
  cells.forEach((c, i) => {
    c.items = [mk('SELF', 1), mk('X', 2), mk('Y', 3)];
    if (i < 12) c.items.push(mk('Z', 4));
    if (i < 3) c.items.push(mk('W', 5));
  });
  const comps = rankCompetitors(cells, { cid: 'SELF' }, 3);
  assert.deepEqual(comps.map((c) => c.key), ['X', 'Y', 'Z']);
  assert.equal(comps[0].cellsPresent, 25);
  assert.equal(comps[0].avgPosition, 2);
  assert.ok(!comps.some((c) => c.key === 'SELF'));
});

test('competitors: a business that appears in few cells loses to a steady one', () => {
  const cells = Array.from({ length: 25 }, () => ({ items: [] }));
  cells.forEach((c, i) => {
    c.items = [];
    if (i === 0) c.items.push(mk('FLASH', 1));
    c.items.push(mk('STEADY', i === 0 ? 2 : 1));
  });
  const comps = rankCompetitors(cells, { cid: 'SELF' }, 2);
  assert.equal(comps[0].key, 'STEADY');
});

// ---- fixes ----------------------------------------------------------------
const profile = (o = {}) => ({
  name: 'Yo', rating: 4.6, reviews: 80, photos: 30, website: true, hours: true, claimed: true, ...o,
});
const comps3 = [
  profile({ reviews: 100 }), profile({ reviews: 200 }), profile({ reviews: 300 }),
];

test('fixes: no website -> web offer at 99', () => {
  const f = chooseFixes(profile({ website: false }), comps3);
  assert.equal(f[0].key, 'no_website');
  assert.equal(f[0].offer, 'web');
  assert.equal(f[0].price, 99);
});

test('fixes: unclaimed -> profile setup at 79', () => {
  const f = chooseFixes(profile({ claimed: false }), comps3);
  const u = f.find((x) => x.key === 'unclaimed_profile');
  assert.equal(u.price, 79);
  assert.equal(u.offer, 'gmn');
});

test('fixes: incomplete profile when no hours or under 10 photos', () => {
  assert.ok(chooseFixes(profile({ hours: false }), comps3).some((x) => x.key === 'incomplete_profile'));
  assert.ok(chooseFixes(profile({ photos: 9 }), comps3).some((x) => x.key === 'incomplete_profile'));
  assert.ok(!chooseFixes(profile({ photos: 10 }), comps3.map((c) => ({ ...c, photos: null }))).some((x) => x.key === 'incomplete_profile'));
});

test('fixes: few reviews (every leader has more) and low rating give advice only', () => {
  const f = chooseFixes(profile({ reviews: 90, rating: 4.1 }), comps3);
  const rev = f.find((x) => x.key === 'few_reviews');
  const low = f.find((x) => x.key === 'low_rating');
  assert.equal(rev.offer, null);
  assert.equal(low.offer, null);
  assert.equal(rev.price, null);
  assert.ok(!chooseFixes(profile({ reviews: 200 }), comps3).some((x) => x.key === 'few_reviews'));
  assert.ok(!chooseFixes(profile({ rating: 4.2 }), comps3).some((x) => x.key === 'low_rating'));
});

test('fixes: max 3, no repeated offer, ordered by impact', () => {
  const worst = profile({
    website: false, claimed: false, hours: false, photos: 2, reviews: 3, rating: 3.5,
  });
  const f = chooseFixes(worst, comps3);
  assert.equal(f.length, 3);
  assert.deepEqual(f.map((x) => x.key), ['no_website', 'unclaimed_profile', 'few_reviews']);
  const offers = f.map((x) => x.offer).filter(Boolean);
  assert.equal(new Set(offers).size, offers.length);
});

test('fixes: missing fields never trigger a rule', () => {
  const unknown = { name: 'Yo', rating: null, reviews: null, photos: null, website: null, hours: null, claimed: null };
  assert.deepEqual(chooseFixes(unknown, comps3), []);
});

test('profileOf: reads SERP item fields, missing -> null', () => {
  const p = profileOf({
    title: 'Vet', rating: { value: 4.4, votes_count: 14 }, total_photos: 12, url: null,
    work_hours: { timetable: { monday: [{ open: {}, close: {} }] } }, is_claimed: false,
  });
  assert.deepEqual(p, {
    name: 'Vet', rating: 4.4, reviews: 14, photos: 12, website: false, hours: true, claimed: false,
  });
  const empty = profileOf({ title: 'X' });
  assert.equal(empty.rating, null);
  assert.equal(empty.website, null);
  assert.equal(empty.claimed, null);
  assert.equal(empty.hours, null);
});

// ---- render ---------------------------------------------------------------
function marked() {
  const o = {};
  for (const k of COPY_KEYS) o[k] = `KK_${k}_ {business} {keyword} {district} {date} {n} {price} {id}`;
  o.grid_example += ' {direction} {rank}';
  o.grid_example_absent += ' {direction}';
  return o;
}
function data(over = {}) {
  const cells = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) cells.push({ row: r, col: c, position: ((r * 5 + c) % 23) || null });
  return {
    id: 'abcDEF123_-xyz', business: 'Negocio Demo', keyword: 'veterinaria', district: 'Surco',
    date: '25/11/2026', score: 50, cells,
    self: profile(),
    competitors: [profile({ name: 'Uno' }), profile({ name: 'Dos', rating: null, website: false }), profile({ name: 'Tres' })],
    fixes: [], ...over,
  };
}

test('render: every copy key is used and no placeholder is left', () => {
  const copy = marked();
  const fixesA = chooseFixes(profile({ website: false, claimed: false, reviews: 3 }), comps3);
  const fixesB = chooseFixes(profile({ hours: false, rating: 3.9, reviews: 3 }), comps3);
  const htmls = [
    render(copy, data({ score: 10, fixes: fixesA })),
    render(copy, data({ score: 50, fixes: fixesB })),
    render(copy, data({ score: 90, fixes: chooseFixes(profile({ websiteBroken: true }), comps3) })),
    render(copy, data({ cells: gridOf({}) })),
  ];
  const all = htmls.join('\n');
  for (const k of COPY_KEYS) {
    assert.ok(all.includes(`KK_${k}_`) || all.includes(encodeURIComponent(`KK_${k}_`)) || all.includes(`KK_${k}_`.replace(/_/g, '_')), `copy key not used: ${k}`);
  }
  for (const h of htmls) {
    assert.ok(!/\{(business|keyword|district|date|n|price|id|direction|rank)\}/.test(h), 'placeholder left unfilled');
    assert.match(h, /<meta name="robots" content="noindex">/);
    assert.ok(!/https?:\/\/(?!wa\.me)/.test(h.replace(/<meta property="og:image"[^>]*>/, '').replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')), 'external request in HTML');
    assert.ok(!/google/i.test(h.replace(/KK_[a-z0-9_]+_/g, '')), 'vendor/brand name in HTML');
  }
});

test('render: link preview tags carry the title and an absolute image under /d/<id>/', () => {
  const copy = marked();
  copy.title = 'T "{business}"';
  const h = render(copy, data({ id: '-h2qzzTest00', business: 'A & B' }));
  assert.ok(h.includes('<meta property="og:title" content="T &quot;A &amp; B&quot;">'));
  assert.ok(h.includes('<meta property="og:type" content="website">'));
  assert.ok(h.includes('<meta property="og:image" content="https://montaweb.pe/d/-h2qzzTest00/report.png">'));
  assert.match(h, /<meta name="robots" content="noindex">/);
});

test('render: unknown fields show a dash and copy is HTML-escaped', () => {
  const copy = marked();
  copy.title = '<b>x</b> {business}';
  const h = render(copy, data({ business: 'A & B' }));
  assert.ok(h.includes('&lt;b&gt;x&lt;/b&gt; A &amp; B'));
  assert.ok(h.includes('—'));
});

test('render: the comparison is one table, you first and marked, then the top 3', () => {
  const copy = marked();
  copy.you_label = 'TU';
  const long = 'Haniel Wellness - Spa Médico / Masajes / Massage / estetica';
  const h = render(copy, data({
    self: profile({ name: long, rating: 4, reviews: 7, photos: null, website: false }),
  }));
  assert.equal((h.match(/<table/g) || []).length, 1);
  assert.ok(!h.includes('<article'), 'old cards still rendered');
  const table = h.slice(h.indexOf('<table'), h.indexOf('</table>'));
  const head = table.slice(0, table.indexOf('</thead>'));
  for (const k of ['col_business', 'col_rating', 'col_reviews', 'col_photos', 'col_website', 'col_hours', 'col_claimed']) {
    assert.ok(head.includes(`KK_${k}_`), `header missing ${k}`);
  }
  const bodies = table.split('<tbody').slice(1);
  assert.equal(bodies.length, 4);
  assert.match(bodies[0], /^ class="me">/);
  assert.ok(bodies[0].includes(long) && bodies[0].includes('>TU</span>'));
  assert.ok(!bodies.slice(1).some((b) => b.includes('class="me"') || b.includes('>TU<')));
  const cellsOf = (b) => [...b.matchAll(/<td>(.*?)<\/td>/g)].map((m) => m[1].replace(/KK_([a-z]+)_[^<]*/, '$1'));
  assert.deepEqual(cellsOf(bodies[0]), ['4.0', '7', '—', 'no', 'yes', 'yes']);
  assert.ok(bodies[1].includes('Uno'));
  assert.deepEqual(cellsOf(bodies[2]), ['—', '80', '30', 'no', 'yes', 'yes']);
  // long names must wrap inside the page, never widen the table
  assert.match(h, /table-layout:fixed/);
  assert.match(h, /overflow-wrap:anywhere/);
});

test('render: whatsapp link carries the report id, encoded', () => {
  const link = whatsappLink('Hola {id} {business}', { id: 'tok123', business: 'A&B' });
  assert.ok(link.startsWith('https://wa.me/51965403196?text='));
  assert.ok(link.includes('tok123'));
  assert.ok(link.includes(encodeURIComponent('A&B')));
});

test('fill: replaces all occurrences', () => {
  assert.equal(fill('{n} y {n}', { n: 3 }), '3 y 3');
});

test('copy-es.json has exactly the agreed keys', () => {
  const copy = JSON.parse(fs.readFileSync(COPY_PATH, 'utf8'));
  assert.deepEqual(Object.keys(copy).sort(), [...COPY_KEYS].sort());
});

test('website: social links do not count as a website', async () => {
  const { isRealWebsite, profileOf } = await import('../scripts/maps-diagnostico/score.mjs');
  assert.equal(isRealWebsite('https://www.facebook.com/fidosvet'), false);
  assert.equal(isRealWebsite('https://instagram.com/x'), false);
  assert.equal(isRealWebsite('https://wa.me/51999'), false);
  assert.equal(isRealWebsite('https://fidosvet.pe/'), true);
  assert.equal(isRealWebsite(''), false);
  assert.equal(profileOf({ url: 'https://m.facebook.com/a' }).website, false);
});

test('fixes: far fewer photos than the top 3 counts as an incomplete profile', async () => {
  const { chooseFixes } = await import('../scripts/maps-diagnostico/score.mjs');
  const self = { website: true, claimed: true, hours: true, photos: 40, reviews: 500, rating: 4.8 };
  const comps = [{ photos: 200, reviews: 100 }, { photos: 300, reviews: 100 }, { photos: 90, reviews: 100 }];
  assert.deepEqual(chooseFixes(self, comps).map((f) => f.key), ['incomplete_profile']);
});

test('probe: broken, parked, blocked and social sites', async () => {
  const { classifyProbe } = await import('../scripts/maps-diagnostico/probe.mjs');
  assert.equal(classifyProbe({ status: null }), 'unverifiable');
  assert.equal(classifyProbe({ status: 404, finalHost: 'a.pe' }), 'broken');
  assert.equal(classifyProbe({ status: 403, finalHost: 'a.pe', body: '<html>ok</html>' }), 'unverifiable');
  assert.equal(classifyProbe({ status: 200, finalHost: 'a.pe', body: '<html>Este dominio está en venta</html>' }), 'broken');
  assert.equal(classifyProbe({ status: 200, finalHost: 'www.facebook.com', body: '' }), 'social');
  assert.equal(classifyProbe({ status: 200, finalHost: 'a.pe', body: '<html><h1>Clínica</h1></html>' }), 'ok');
});

test('fixes: a broken website gets its own rebuild fix, not no_website', async () => {
  const { chooseFixes } = await import('../scripts/maps-diagnostico/score.mjs');
  const self = { website: true, websiteBroken: true, claimed: true, hours: true, photos: 50, reviews: 500, rating: 4.8 };
  const f = chooseFixes(self, [{ photos: 50, reviews: 100 }]);
  assert.deepEqual(f.map((x) => x.key), ['broken_website']);
  assert.equal(f[0].price, 99);
});

// ---- real leaders ---------------------------------------------------------
// 25 cells; at(i) lists [cid, rank] pairs, self's position comes from the same list.
const gridCells = (at) => Array.from({ length: 25 }, (_, i) => {
  const entries = at(i);
  return {
    items: entries.map(([cid, rank]) => mk(cid, rank)),
    position: entries.find(([cid]) => cid === 'SELF')?.[1] ?? null,
  };
});

test('leaders: only businesses above you at more points than below, absent counts as below', async () => {
  const { leadersOf } = await import('../scripts/maps-diagnostico/score.mjs');
  const cells = gridCells((i) => {
    const e = [];
    if (i < 10) e.push(['SELF', 5]);
    if (i < 6) e.push(['AHEAD', 1]); // above 6, below 4 (absent while you rank)
    if (i < 5) e.push(['TIE', 2]); // above 5, below 5
    if (i >= 8 && i < 10) e.push(['BEHIND', 9]); // above 0
    if (i >= 10 && i < 13) e.push(['ONLY', 20]); // above 3 (you absent), below 10
    if (i >= 10) e.push(['WIDE', 18]); // above 15 (you absent), below 10
    return e;
  });
  const leaders = leadersOf(cells, { cid: 'SELF' });
  assert.deepEqual(leaders.map((l) => l.key).sort(), ['AHEAD', 'WIDE']);
  const ahead = leaders.find((l) => l.key === 'AHEAD');
  assert.equal(ahead.above, 6);
  assert.equal(ahead.below, 4);
});

test('leaders: picked from all candidates, not only the former top 3; max 3', async () => {
  const { leadersOf } = await import('../scripts/maps-diagnostico/score.mjs');
  // S1-S3 are steady right behind you where you rank (best average, never ahead enough);
  // L1-L4 own the cells where you are absent.
  const split = (n) => gridCells((i) => (i < n
    ? [['SELF', 1], ['S1', 2], ['S2', 3], ['S3', 4]]
    : [['L1', 1], ['L2', 2], ['L3', 3], ['L4', 4]]));
  assert.deepEqual(leadersOf(split(13), { cid: 'SELF' }), []);
  assert.deepEqual(leadersOf(split(11), { cid: 'SELF' }).map((l) => l.key), ['L1', 'L2', 'L3']);
});

test('fixes: few_reviews needs real leaders and every one of them has more reviews', () => {
  const keys = (self, leaders) => chooseFixes(self, leaders).map((f) => f.key);
  assert.deepEqual(keys(profile({ reviews: 3 }), []), []);
  assert.deepEqual(keys(profile({ reviews: 150 }), comps3), []); // one leader has only 100
  assert.deepEqual(keys(profile({ reviews: 150 }), [profile({ reviews: 151 })]), ['few_reviews']);
  assert.deepEqual(keys(profile({ reviews: 150 }), [profile({ reviews: 500 }), profile({ reviews: null })]), []);
});

test('render: with no leaders the comparison section is gone; with one it lists you and that one', () => {
  const copy = marked();
  const none = render(copy, data({ competitors: [] }));
  assert.ok(!none.includes('KK_compare_heading_'));
  assert.ok(!none.includes('<table'));
  const one = render(copy, data({ competitors: [profile({ name: 'Uno' })] }));
  assert.ok(one.includes('KK_compare_heading_'));
  assert.equal(one.slice(one.indexOf('<table')).split('<tbody').length - 1, 2);
});

// ---- website check: only clear failures are a claim -----------------------
test('probe: only clear failures count as broken, the rest is unverifiable', async () => {
  const { classifyProbe } = await import('../scripts/maps-diagnostico/probe.mjs');
  const c = (r) => classifyProbe({ finalHost: 'a.pe', ...r });
  for (const error of ['ENOTFOUND', 'ECONNREFUSED']) assert.equal(c({ error }), 'broken', error);
  for (const error of ['TIMEOUT', 'ECONNRESET', 'EAI_AGAIN', 'CERT_HAS_EXPIRED', 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR']) {
    assert.equal(c({ error }), 'unverifiable', error);
  }
  for (const status of [404, 410, 500, 502, 503, 522]) assert.equal(c({ status }), 'broken', String(status));
  for (const status of [400, 401, 403, 405, 406, 429, 451]) assert.equal(c({ status }), 'unverifiable', String(status));
  assert.equal(c({ status: 503, body: '<title>Just a moment...</title>' }), 'unverifiable');
  assert.equal(c({ status: 503, antiBot: true }), 'unverifiable');
  assert.equal(c({ status: 200, body: '<title>Bitdefender Endpoint Security</title> page blocked' }), 'unverifiable');
  assert.equal(c({ status: 200, body: '<h1>Account Suspended</h1>' }), 'broken');
  assert.equal(c({ status: 200, body: '<h1>Sitio en construcción</h1>' }), 'unverifiable');
  const long = '<p>' + 'Servicios para tu obra. '.repeat(80) + 'Proyectos en construcción. It works!</p>';
  assert.equal(c({ status: 200, body: long }), 'ok');
  assert.equal(c({ status: 200, body: '<script>var s="account suspended"</script><h1>Clínica</h1>' }), 'ok');
});

const failWith = (code) => Object.assign(new TypeError('fetch failed'), { cause: { code } });
const answer = (status, body = '<h1>Clínica</h1>') => (u) => ({
  status, url: u, headers: new Headers({ 'content-type': 'text/html' }), text: async () => body,
});
// script: url -> outcomes, one per call (the last one repeats); unknown urls do not resolve
const GOOD = 'https://www.google.com/';
const noSleep = async () => {};
const fakeFetch = (extra) => {
  const script = { [GOOD]: [answer(200)], ...extra };
  const calls = [];
  const impl = async (u) => {
    calls.push(u);
    const list = script[u] || [failWith('ENOTFOUND')];
    const out = list[Math.min(calls.filter((x) => x === u).length - 1, list.length - 1)];
    if (out instanceof Error) throw out;
    return out(u);
  };
  return { impl, calls };
};

test('probe: a failure is retried once, and one success clears the claim', async () => {
  const { probeSite } = await import('../scripts/maps-diagnostico/probe.mjs');
  const f = fakeFetch({ 'https://a.pe/': [failWith('ECONNREFUSED'), answer(200)] });
  assert.equal(await probeSite('https://a.pe/', { fetchImpl: f.impl, sleep: noSleep }), 'ok');
  assert.equal(f.calls.length, 2);
  const g = fakeFetch({ 'https://a.pe/': [answer(500), failWith('ECONNRESET')] });
  assert.equal(await probeSite('https://a.pe/', { fetchImpl: g.impl, sleep: noSleep }), 'unverifiable');
});

test('probe: broken only when the other scheme at the root does not answer either', async () => {
  const { probeSite } = await import('../scripts/maps-diagnostico/probe.mjs');
  assert.equal(await probeSite('http://gone.pe/', { fetchImpl: fakeFetch({}).impl, sleep: noSleep }), 'broken');
  const expired = fakeFetch({ 'https://b.pe/': [failWith('ECONNREFUSED')], 'http://b.pe/': [answer(404)] });
  assert.equal(await probeSite('https://b.pe/', { fetchImpl: expired.impl, sleep: noSleep }), 'broken');
  const half = fakeFetch({ 'https://c.pe/': [failWith('ECONNREFUSED')], 'http://c.pe/': [answer(200)] });
  assert.equal(await probeSite('https://c.pe/', { fetchImpl: half.impl, sleep: noSleep }), 'unverifiable');
  const deep = fakeFetch({ 'http://d.pe/old/page': [answer(404)], 'https://d.pe/': [answer(200)] });
  assert.equal(await probeSite('http://d.pe/old/page', { fetchImpl: deep.impl, sleep: noSleep }), 'unverifiable');
});

test('probe: waits about 40 seconds before giving up', async () => {
  const { TIMEOUT_MS } = await import('../scripts/maps-diagnostico/probe.mjs');
  assert.equal(TIMEOUT_MS, 40000);
});

test('probe: a 5xx or DNS failure waits about 45 s before the retry, other failures do not', async () => {
  const { probeSite } = await import('../scripts/maps-diagnostico/probe.mjs');
  const run = async (outcomes) => {
    const waits = [];
    const f = fakeFetch({ 'https://a.pe/': outcomes });
    const state = await probeSite('https://a.pe/', { fetchImpl: f.impl, sleep: async (ms) => { waits.push([ms, f.calls.length]); } });
    return { state, waits };
  };
  assert.deepEqual(await run([answer(503), answer(200)]), { state: 'ok', waits: [[45000, 1]] });
  assert.deepEqual(await run([failWith('ENOTFOUND'), answer(200)]), { state: 'ok', waits: [[45000, 1]] });
  assert.deepEqual(await run([answer(404), answer(200)]), { state: 'ok', waits: [] });
});

test('probe: no broken claim when the known-good host fails too', async () => {
  const { probeSite } = await import('../scripts/maps-diagnostico/probe.mjs');
  for (const bad of [failWith('ENOTFOUND'), answer(503)]) {
    const f = fakeFetch({ [GOOD]: [bad] });
    assert.equal(await probeSite('http://gone.pe/', { fetchImpl: f.impl, sleep: noSleep }), 'unverifiable');
    assert.ok(f.calls.includes(GOOD));
  }
});

test('probe: a failing deep path is not broken when the root on the same scheme works', async () => {
  const { probeSite } = await import('../scripts/maps-diagnostico/probe.mjs');
  const probe = (script) => probeSite('https://e.pe/old/page', { fetchImpl: fakeFetch(script).impl, sleep: noSleep });
  assert.equal(await probe({ 'https://e.pe/old/page': [answer(404)], 'https://e.pe/': [answer(200)] }), 'unverifiable');
  assert.equal(await probe({ 'https://e.pe/old/page': [answer(404)], 'https://e.pe/': [answer(404)], 'http://e.pe/': [answer(404)] }), 'broken');
});

// ---- API task status ------------------------------------------------------
test('fetch: "No Search Results" is an empty cell, any other task error stops', async () => {
  const { itemsFromResponse } = await import('../scripts/maps-diagnostico/fetch.mjs');
  const res = (status_code, status_message, result) => ({ tasks: [{ status_code, status_message, result }] });
  assert.deepEqual(itemsFromResponse(res(40102, 'No Search Results.', null)), []);
  assert.equal(itemsFromResponse(res(20000, 'Ok.', [{ items: [{ cid: 'A' }] }])).length, 1);
  assert.throws(() => itemsFromResponse(res(40102, 'Something else', null)), /40102/);
  assert.throws(() => itemsFromResponse(res(40200, 'Payment Required.', null)), /40200/);
  assert.throws(() => itemsFromResponse({}), /task failed/);
});

test('fetch: the report date is the Lima day the data was queried', async () => {
  const { limaDate } = await import('../scripts/maps-diagnostico/fetch.mjs');
  assert.equal(limaDate('2026-11-26 03:10:00 +00:00'), '25/11/2026');
  assert.equal(limaDate('2026-11-26 15:00:00 +00:00'), '26/11/2026');
});

test('fixes: the photo comparison uses the nearby businesses, not only the leaders', () => {
  const nearby = [profile({ photos: 100, reviews: 500 }), profile({ photos: 100 }), profile({ photos: 100 })];
  assert.deepEqual(chooseFixes(profile({ photos: 30, reviews: 3 }), [], nearby).map((f) => f.key), ['incomplete_profile']);
});

// ---- self-explanatory grid --------------------------------------------------
// Row 0 is north, col 0 west; `ranks` is keyed "row,col", everything else is absent.
function gridOf(ranks) {
  return Array.from({ length: 25 }, (_, i) => {
    const row = Math.floor(i / 5), col = i % 5;
    return { row, col, position: ranks[`${row},${col}`] ?? null };
  });
}

test('grid example: direction and rank come from the matching adjacent square', () => {
  for (const [key, direction] of [['1,2', 'norte'], ['3,2', 'sur'], ['2,3', 'este'], ['2,1', 'oeste']]) {
    assert.deepEqual(gridExample(gridOf({ [key]: 7 })), { direction, rank: 7 });
  }
  // an adjacent square with a rank wins over absent ones; diagonals, far squares and the centre never count
  assert.deepEqual(gridExample(gridOf({ '2,1': 12, '2,2': 1, '0,2': 2, '1,1': 3 })), { direction: 'oeste', rank: 12 });
  const none = gridExample(gridOf({ '2,2': 1, '0,2': 2, '1,1': 3 }));
  assert.deepEqual(none, { direction: 'norte', rank: null });
  // the directions match the real geography of buildGrid
  const g = buildGrid(-12.1, -77.03, 700);
  const at = (r, c) => g.find((p) => p.row === r && p.col === c);
  assert.ok(at(1, 2).lat > at(2, 2).lat && at(3, 2).lat < at(2, 2).lat);
  assert.ok(at(2, 3).lng > at(2, 2).lng && at(2, 1).lng < at(2, 2).lng);
});

test('render: hint above the grid, tag on the centre, one example between grid and legend', () => {
  const copy = JSON.parse(fs.readFileSync(COPY_PATH, 'utf8'));
  const h = render(copy, data({ cells: gridOf({ '3,2': 4, '2,2': 1 }) }));
  const section = h.slice(h.indexOf('aria-labelledby="h-grid"'), h.indexOf('aria-labelledby="h-score"'));
  const order = [copy.grid_heading, 'Es un mapa de los alrededores', 'El número dice en qué puesto', '<svg',
    'al sur de tu negocio, te encuentra en el puesto 4.', 'class="legend"'].map((t) => section.indexOf(t));
  assert.ok(order.every((n, i) => n >= 0 && (i === 0 || n > order[i - 1])), `order: ${order}`);
  assert.equal((section.match(/Por ejemplo:/g) || []).length, 1);
  assert.match(section, /<g class="me-tag">.*>Tu negocio<\/text><\/g><\/svg>/);
  assert.match(section, /<span class="sw"[^>]*>—<\/span>No sales entre los 20 primeros/);

  const absent = render(copy, data({ cells: gridOf({}) }));
  assert.ok(absent.includes('al norte de tu negocio, no te encuentra entre los 20 primeros.'));
});

test('render: the copy says 700 m, so any other spacing is refused', () => {
  assert.throws(() => render(marked(), data({ spacing: 500 })), /700/);
  assert.doesNotThrow(() => render(marked(), data({ spacing: 700 })));
});

test('website state: applied to the profile the same way as a live check', async () => {
  const { applySiteState } = await import('../scripts/maps-diagnostico/probe.mjs');
  const of = (state) => { const self = { website: true }; applySiteState(self, state); return self; };
  assert.deepEqual(of('broken'), { website: true, websiteBroken: true });
  assert.deepEqual(of('social'), { website: false });
  for (const state of ['ok', 'unverifiable', null]) assert.deepEqual(of(state), { website: true });
});
