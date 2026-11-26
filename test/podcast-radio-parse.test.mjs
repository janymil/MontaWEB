import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGuion, buildSegments, selectTest, selectSpot } from '../scripts/podcast/radio-parse.mjs';

const md = readFileSync(new URL('../docs/plans/2026-11-26-podcast-prefijo-500-guion.md', import.meta.url), 'utf8');
const parsed = parseGuion(md);
const count = (items, type) => items.filter((i) => i.type === type).length;

test('counts speech lines and cues in the full timeline', () => {
  assert.equal(count(parsed.items, 'speech'), 75);
  assert.equal(count(parsed.items, 'heading'), 7);
  assert.equal(count(parsed.items, 'sfx'), 7);
  assert.equal(count(parsed.items, 'sweeper'), 3);
  assert.equal(count(parsed.items, 'jingle'), 2);
  assert.equal(count(parsed.items, 'stinger'), 4);
  assert.equal(count(parsed.items, 'pause'), 1);
  assert.equal(count(parsed.items, 'bed'), 7);
  assert.equal(count(parsed.items, 'spot-marker'), 0);
});

test('[SPOT] is expanded inline between the break-out jingle and id-back', () => {
  const i = parsed.items.findIndex((x) => x.id === 'break-out');
  assert.equal(parsed.items[i + 1].id, 'bed-spot');
  assert.equal(parsed.items[i + 1].spot, true);
  const back = parsed.items.findIndex((x) => x.id === 'id-back');
  assert.equal(parsed.items[back - 1].id, 'off');
  assert.equal(parsed.spot.length, 11);
  assert.equal(count(parsed.spot, 'speech'), 6);
});

test('only the Jair cold-open line is PHONE', () => {
  const phones = parsed.items.filter((i) => i.phone);
  assert.equal(phones.length, 1);
  assert.equal(phones[0].voice, 'JAIR');
  assert.match(phones[0].text, /^\[fast, scripted\] Buenas tardes/);
});

test('lowercase audio tags stay inside the spoken text', () => {
  assert.ok(parsed.items.some((i) => i.type === 'speech' && i.text === '[laughs] Jajaja.'));
  // ElevenLabs rejects a dialogue input that is only tags, so every speech line needs spoken text.
  for (const i of parsed.items.filter((x) => x.type === 'speech')) {
    assert.ok(i.text.replace(/\[[^\]]*\]/g, '').trim(), `tag-only line: ${i.text}`);
  }
  assert.ok(parsed.items.some((i) => i.text === '[flat] No, gracias.'));
});

test('BED ranges: ids in order, off closes, references resolve', () => {
  const beds = parsed.items.filter((i) => i.type === 'bed').map((b) => b.id);
  assert.deepEqual(beds, ['bed-a', 'bed-b', 'off', 'bed-spot', 'off', 'bed-a', 'off']);
  const [a, b, , , , a2] = parsed.items.filter((i) => i.type === 'bed');
  assert.match(b.desc, /^light, warm acoustic guitar/);
  assert.match(b.desc, /slightly darker, piano added/);
  assert.equal(a2.desc, a.desc);
});

test('SFX at values and ids', () => {
  const sfx = parsed.items.filter((i) => i.type === 'sfx').map((s) => `${s.id}:${s.at}`);
  assert.deepEqual(sfx, ['ring:before', 'callcenter:under', 'hangup:after', 'register:after', 'ring2:before', 'ping:after', 'ping-multi:before']);
});

test('sweepers: voice, text, seconds, music references', () => {
  const [open, back, close] = parsed.items.filter((i) => i.type === 'sweeper');
  assert.deepEqual([open.voice, open.text, open.seconds], ['JAIR', 'MontaWeb Radio.', 4]);
  assert.deepEqual([back.voice, back.text, back.seconds], ['DANIELA', 'Seguimos en MontaWeb Radio.', 3]);
  assert.deepEqual(back.musicRef, { type: 'sweeper', id: 'id-open' });
  assert.deepEqual(close.musicRef, { type: 'jingle', id: 'intro' });
  assert.equal(close.fadeOut, true);
});

test('jingle seconds and pause seconds', () => {
  assert.equal(parsed.items.find((i) => i.id === 'intro').seconds, 6);
  assert.equal(parsed.items.find((i) => i.id === 'break-out').seconds, 3);
  assert.equal(parsed.items.find((i) => i.type === 'pause').seconds, 2);
});

test('stinger families resolve to st-1 description', () => {
  const st = parsed.items.filter((i) => i.type === 'stinger');
  assert.match(st[0].desc, /^short whoosh/);
  for (const s of st.slice(1)) assert.match(s.desc, /^short whoosh with a two-note synth hit/);
});

test('buildSegments merges consecutive speech and splits on cues and phone lines', () => {
  const segs = buildSegments(parsed.items).filter((s) => s.type === 'segment');
  assert.equal(segs.length, 13);
  assert.equal(segs.reduce((n, s) => n + s.lines.length, 0), 75);
  assert.equal(segs.filter((s) => s.phone).length, 1);
  assert.equal(segs[0].lines.length, 1); // "¿Aló?" alone, before pause
  assert.ok(segs.every((s) => s.chars <= 2200));
});

test('--test selection ends at "Por fin." plus first stinger', () => {
  const t = selectTest(parsed.items);
  const last = t.at(-1);
  assert.equal(last.type, 'stinger');
  assert.equal(last.id, 'st-1');
  assert.equal(t.at(-2).text, '[relieved] Por fin.');
  assert.equal(t[0].type, 'heading');
});

test('--spot-only selection is the spot plus the logo tail', () => {
  const s = selectSpot(parsed);
  assert.equal(count(s, 'speech'), 6);
  assert.equal(s.at(-1).id, 'break-out');
});

test('rejects an SFX with a bad at value', () => {
  assert.throws(() => parseGuion('## Show\n[SFX: x | d | sideways]\n## Spot\n'), /at/);
});
