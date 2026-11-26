import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildGrid, haversineMeters } from '../scripts/maps-diagnostico/grid.mjs';
import {
  positionOf, scoreFromPositions, scoreBand, rankCompetitors, profileOf, chooseFixes, WEIGHTS,
} from '../scripts/maps-diagnostico/score.mjs';
import { render, fill, whatsappLink } from '../scripts/maps-diagnostico/render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COPY_PATH = path.join(HERE, '..', 'scripts', 'maps-diagnostico', 'copy-es.json');
const COPY_KEYS = [
  'title', 'intro', 'grid_heading', 'grid_explainer', 'legend_top3', 'legend_4_10', 'legend_11_20',
  'legend_absent', 'score_heading', 'score_explainer', 'score_band_low', 'score_band_mid',
  'score_band_high', 'compare_heading', 'col_business', 'col_rating', 'col_reviews', 'col_photos',
  'col_website', 'col_hours', 'col_claimed', 'yes', 'no', 'you_label', 'fixes_heading',
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

test('fixes: few reviews (below top-3 median) and low rating give advice only', () => {
  const f = chooseFixes(profile({ reviews: 150, rating: 4.1 }), comps3);
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
    render(copy, data({ score: 90, fixes: [] })),
  ];
  const all = htmls.join('\n');
  for (const k of COPY_KEYS) {
    assert.ok(all.includes(`KK_${k}_`) || all.includes(encodeURIComponent(`KK_${k}_`)) || all.includes(`KK_${k}_`.replace(/_/g, '_')), `copy key not used: ${k}`);
  }
  for (const h of htmls) {
    assert.ok(!/\{(business|keyword|district|date|n|price|id)\}/.test(h), 'placeholder left unfilled');
    assert.match(h, /<meta name="robots" content="noindex">/);
    assert.ok(!/https?:\/\/(?!wa\.me)/.test(h.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')), 'external request in HTML');
    assert.ok(!/google/i.test(h.replace(/KK_[a-z0-9_]+_/g, '')), 'vendor/brand name in HTML');
  }
});

test('render: unknown fields show a dash and copy is HTML-escaped', () => {
  const copy = marked();
  copy.title = '<b>x</b> {business}';
  const h = render(copy, data({ business: 'A & B' }));
  assert.ok(h.includes('&lt;b&gt;x&lt;/b&gt; A &amp; B'));
  assert.ok(h.includes('—'));
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
