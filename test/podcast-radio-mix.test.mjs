import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { layout, buildGraph, measureOutput, MIX } from '../scripts/podcast/generate-radio.mjs';

const seg = (dur, extra = {}) => ({ type: 'segment', file: 's.wav', dur, phone: false, lines: [{ voice: 'JAIR', text: 'x' }], ...extra });
const at = (items, kind, label) => layout(items).events.find((e) => e.kind === kind && (!label || e.label.includes(label)));

test('speech segments are separated by a natural gap, pauses add silence', () => {
  const { events } = layout([seg(2), seg(3), { type: 'pause', seconds: 2 }, seg(1)]);
  const v = events.filter((e) => e.kind === 'voice');
  assert.equal(v[0].start, 0);
  assert.ok(Math.abs(v[1].start - (2 + MIX.gap)) < 1e-9);
  assert.ok(Math.abs(v[2].start - (v[1].start + 3 + 2)) < 1e-9);
});

test('SFX before ends where the next line starts', () => {
  const { events } = layout([{ type: 'sfx', at: 'before', id: 'r', file: 'r.wav', dur: 3 }, seg(2)]);
  const sfx = events.find((e) => e.kind === 'sfx');
  const voice = events.find((e) => e.kind === 'voice');
  assert.ok(Math.abs(sfx.start + sfx.dur - voice.start) < 1e-9);
});

test('SFX under starts with the next line and is trimmed to it, quieter', () => {
  const { events } = layout([{ type: 'pause', seconds: 1 }, { type: 'sfx', at: 'under', id: 'u', file: 'u.wav', dur: 8 }, seg(2, { phone: true })]);
  const sfx = events.find((e) => e.kind === 'sfx');
  const voice = events.find((e) => e.kind === 'voice');
  assert.equal(sfx.start, voice.start);
  assert.ok(sfx.dur <= 2.3 + 1e-9);
  assert.ok(sfx.db < 0);
});

test('SFX after starts right after the previous line and overlaps the next', () => {
  const { events } = layout([seg(2), { type: 'sfx', at: 'after', id: 'a', file: 'a.wav', dur: 2.5 }, seg(1)]);
  const [v1, v2] = events.filter((e) => e.kind === 'voice');
  const sfx = events.find((e) => e.kind === 'sfx');
  assert.equal(sfx.start, v1.start + v1.dur);
  assert.ok(sfx.start + sfx.dur > v2.start);
});

test('speech starts over the last second of a jingle; sweepers do not overlap', () => {
  const j = layout([{ type: 'jingle', id: 'j', file: 'j.wav', dur: 6, seconds: 6 }, { type: 'bed', id: 'b', file: 'b.wav' }, seg(2)]);
  assert.equal(j.events.find((e) => e.kind === 'voice').start, 5 + MIX.gap * 0 + 0); // 6 - 1, gap reset by music
  const s = layout([{ type: 'sweeper', id: 's', file: 's.wav', dur: 4, seconds: 4 }, seg(2)]);
  assert.equal(s.events.find((e) => e.kind === 'voice').start, 4);
});

test('bed spans from its cue to the next bed or off, covering a longer range than its asset', () => {
  const { events, total } = layout([{ type: 'bed', id: 'a', file: 'b.wav' }, seg(40), { type: 'bed', id: 'off' }, seg(1)]);
  const bed = events.find((e) => e.kind === 'bed');
  assert.equal(bed.start, 0);
  assert.ok(bed.dur >= 40 && bed.dur < total);
});

test('graph: beds loop, phone lines are band-limited, bed is ducked by the voice', () => {
  const lay = layout([{ type: 'bed', id: 'a', file: 'b.wav' }, seg(3, { phone: true }), seg(3)]);
  const { inputs, graph } = buildGraph(lay);
  assert.equal(inputs.filter((i) => i.loop).length, 1);
  assert.match(graph, /highpass=f=300,lowpass=f=3400/);
  assert.match(graph, /\[bed\]\[vkey\]sidechaincompress=.*release=400/);
  assert.match(graph, /amix=inputs=5:normalize=0/);
});

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
test('fake-asset render of the spot lands near -16 LUFS and persists as an mp3', { skip: !hasFfmpeg }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'radio-'));
  const out = join(dir, 'spot.mp3');
  const r = spawnSync(process.execPath, ['scripts/podcast/generate-radio.mjs', '--spot-only', '--fake-assets', '--work', join(dir, 'w'), '--out', out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(out));
  const { lufs, peak } = measureOutput(out);
  assert.ok(Math.abs(lufs - -16) < 1, `LUFS ${lufs}`);
  assert.ok(peak <= -1, `peak ${peak}`);
});
