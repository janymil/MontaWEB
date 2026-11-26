// Renders a radio-style guion (docs/plans/*-guion.md) into a produced mp3:
// ElevenLabs Text to Dialogue (speech), /v1/music (jingles, beds, stingers, logos),
// /v1/sound-generation (SFX), mixed on one timeline with ffmpeg.
// Usage: node scripts/podcast/generate-radio.mjs [--guion f] [--out f] [--test] [--spot-only]
//        [--dry-run] [--fake-assets] [--work dir]     (see README-radio.md)
// Reads ELEVENLABS_API_KEY from .env (not needed for --dry-run / --fake-assets).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseGuion, buildSegments, selectTest, selectSpot } from './radio-parse.mjs';

const API = 'https://api.elevenlabs.io';
const VOICES = {
  DANIELA: { id: 'VywzfvxxNk4yFAaoMm4Q', owner: '6ca924052556a45b643b02d081936b5b1718ab20633c23ff2e769448981d10ab', name: 'MontaWeb Daniela' },
  JAIR: { id: 'I9uZPOVoQkQEhHPStmJz' },
};

// Mix constants (seconds / dB / LUFS)
export const MIX = {
  gap: 0.3, gapSfx: 0.15, jingleOverlap: 1.0, stingerOverlap: 0.2, stingerMax: 2.2,
  bedFade: 1.0, bedTail: 0.5, endTail: 0.8,
  // prepared-asset loudness (LUFS); voice -18 so the bed at -38 sits 20 dB below it
  lufs: { speech: -18, phone: -20, bed: -38, jingle: -20, stinger: -21, sfx: -26, sfxUnder: -32 },
  finalLufs: -16, truePeak: -1.5,
};

const hash = (o) => createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 12);

// ---------- requests (one per generated asset, deduplicated by key) ----------
function speechReq(lines) {
  const inputs = lines.map((l) => ({ text: l.text, voice_id: VOICES[l.voice].id }));
  return { kind: 'speech', key: `dlg-${hash(inputs)}`, inputs, chars: inputs.reduce((n, x) => n + x.text.length, 0) };
}
function musicReq(prompt, ms, label) {
  const p = { prompt, ms: Math.max(3000, Math.round(ms)) };
  return { kind: 'music', key: `music-${hash(p)}`, ...p, label };
}
function sfxReq(prompt, s, label) {
  const p = { prompt, s };
  return { kind: 'sfx', key: `sfx-${hash(p)}`, ...p, label };
}
const SFX_SECONDS = { before: 3, under: 8, after: 2.5 };
// Generated length asked for: shorter for "1 ring"/"cut"/"three pings" cues, longer for "2 rings".
const sfxSeconds = (it) => (/1 ring|cut|three message pings/i.test(it.desc) ? 2 : /2 rings/i.test(it.desc) ? 4.5 : SFX_SECONDS[it.at]);

// Attaches .req (and .voiceReq / .musicReq for sweepers) to every item; returns unique requests.
export function attachRequests(segs, allItems = segs) {
  const reqs = new Map();
  const add = (r) => { if (!reqs.has(r.key)) reqs.set(r.key, r); return r; };
  const musicOf = (it) => {
    if (it.type === 'jingle') return musicReq(`${it.desc}, instrumental, no vocals, clean ending`, it.seconds * 1000, `jingle ${it.id}`);
    if (it.type === 'sweeper') return musicReq(`${it.prompt || it.desc}, instrumental music logo, no vocals`, it.seconds * 1000, `logo ${it.id}`);
    throw new Error('no music for ' + it.type);
  };
  const find = (ref) => allItems.find((x) => x.type === ref.type && x.id === ref.id);
  for (const it of segs) {
    if (it.type === 'segment') it.req = add(speechReq(it.lines));
    else if (it.type === 'jingle') it.req = add(musicOf(it));
    else if (it.type === 'stinger') it.req = add(musicReq(`${it.desc}, very short, instrumental`, 3000, `stinger ${it.id}`));
    else if (it.type === 'bed' && it.id !== 'off') {
      it.req = add(musicReq(`${it.desc}, seamless loop, instrumental, no vocals, steady level`, it.id === 'bed-spot' ? 20000 : 30000, `bed ${it.id}`));
    } else if (it.type === 'sfx') it.req = add(sfxReq(it.desc, sfxSeconds(it), `sfx ${it.id}`));
    else if (it.type === 'sweeper') {
      it.voiceReq = add(speechReq([{ voice: it.voice, text: it.text }]));
      const src = it.musicRef ? find(it.musicRef) : it;
      if (!src) throw new Error(`sweeper ${it.id}: referenced music ${it.musicRef.id} not in this selection`);
      it.musicReq = add(musicOf(src));
    }
  }
  return [...reqs.values()];
}

// ---------- timeline layout (pure) ----------
// Items need .dur (seconds of the prepared asset) and .file once assets exist.
export function layout(items) {
  const ev = [];
  let t = 0, gap = 0, lastEnd = 0;
  let under = [];
  let openBed = null;
  const nextAudible = (i) => items.slice(i + 1).find((x) => x.type !== 'bed' && x.type !== 'heading');
  const closeBed = (at, extra) => {
    if (openBed) { openBed.end = at + extra; ev.push(openBed); openBed = null; }
  };
  items.forEach((it, i) => {
    switch (it.type) {
      case 'segment': {
        const start = t + gap;
        ev.push({ kind: 'voice', file: it.file, start, dur: it.dur, phone: it.phone, label: it.lines[0].text.slice(0, 30) });
        for (const u of under) { u.start = start; u.dur = Math.min(u.dur, it.dur + 0.3); ev.push(u); }
        under = [];
        t = start + it.dur; lastEnd = t; gap = MIX.gap;
        break;
      }
      case 'pause': t += it.seconds; gap = 0; break;
      case 'jingle':
      case 'sweeper': {
        const start = t;
        const len = Math.min(it.dur, it.seconds);
        const next = nextAudible(i);
        const overlap = it.type === 'jingle' && next?.type === 'segment' ? Math.min(MIX.jingleOverlap, len / 2) : 0;
        ev.push({ kind: 'music', file: it.file, start, dur: len, fadeOut: it.fadeOut ? 1.5 : 0.4, label: `${it.type} ${it.id}` });
        t = start + len - overlap; gap = 0;
        break;
      }
      case 'stinger': {
        const start = t + 0.15;
        const len = Math.min(it.dur, MIX.stingerMax);
        ev.push({ kind: 'music', file: it.file, start, dur: len, fadeOut: 0.3, label: `stinger ${it.id}` });
        t = start + len - MIX.stingerOverlap; gap = 0.1;
        break;
      }
      case 'bed':
        closeBed(t, it.id === 'off' ? 0.3 : MIX.bedTail);
        if (it.id !== 'off') openBed = { kind: 'bed', file: it.file, start: t, label: `bed ${it.id}` };
        break;
      case 'sfx': {
        const base = { kind: 'sfx', file: it.file, dur: it.dur, label: `sfx ${it.id} (${it.at})` };
        if (it.at === 'before') {
          const start = t + (gap > 0 ? 0.2 : 0);
          ev.push({ ...base, start, db: MIX.lufs.sfx - MIX.lufs.sfx });
          t = start + it.dur; gap = 0;
        } else if (it.at === 'after') {
          ev.push({ ...base, start: lastEnd, db: 0 });
          if (gap > 0) gap = MIX.gapSfx;
        } else {
          under.push({ ...base, db: MIX.lufs.sfxUnder - MIX.lufs.sfx });
          if (gap > 0) gap = MIX.gapSfx;
        }
        break;
      }
      default: break;
    }
  });
  const sfxEnd = Math.max(0, ...ev.filter((e) => e.kind !== 'bed').map((e) => e.start + e.dur));
  const total = Math.max(t, sfxEnd) + MIX.endTail;
  if (openBed) { openBed.end = total; ev.push(openBed); }
  for (const e of ev) if (e.kind === 'bed') e.dur = Math.max(2, Math.min(e.end, total) - e.start);
  return { events: ev.sort((a, b) => a.start - b.start), total };
}

// ---------- ffmpeg filter graph (pure) ----------
const f3 = (n) => Number(n).toFixed(3);
const FMT = 'aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo';
const PHONE = 'volume=2dB,highpass=f=300,lowpass=f=3400,acompressor=threshold=0.1:ratio=4:attack=5:release=60:makeup=2,asoftclip=type=tanh';

export function buildGraph({ events, total }) {
  const inputs = [];
  const lines = [];
  const bus = { voice: [], music: [], sfx: [], bed: [] };
  const add = (e, chain, b) => {
    const i = inputs.length;
    inputs.push({ file: e.file, loop: e.kind === 'bed' });
    const label = `${b}${i}`;
    lines.push(`[${i}:a]${FMT},${chain}[${label}]`);
    bus[b].push(label);
  };
  const delay = (e) => `adelay=${Math.round(e.start * 1000)}:all=1`;
  for (const e of events) {
    const cut = `atrim=0:${f3(e.dur)},asetpts=PTS-STARTPTS`;
    if (e.kind === 'voice') add(e, `${e.phone ? PHONE + ',' : ''}${delay(e)}`, 'voice');
    else if (e.kind === 'music') add(e, `${cut},afade=t=out:st=${f3(Math.max(0, e.dur - e.fadeOut))}:d=${f3(e.fadeOut)},${delay(e)}`, 'music');
    else if (e.kind === 'sfx') add(e, `${cut},afade=t=in:d=0.02,afade=t=out:st=${f3(Math.max(0, e.dur - 0.15))}:d=0.15,volume=${f3(e.db)}dB,${delay(e)}`, 'sfx');
    else add(e, `${cut},afade=t=in:d=${MIX.bedFade},afade=t=out:st=${f3(Math.max(0, e.dur - MIX.bedFade))}:d=${MIX.bedFade},${delay(e)}`, 'bed');
  }
  const mixBus = (name) => {
    const l = bus[name];
    if (l.length === 0) lines.push(`anullsrc=r=44100:cl=stereo,atrim=0:${f3(total)}[${name}]`);
    else if (l.length === 1) lines.push(`[${l[0]}]anull[${name}]`);
    else lines.push(`${l.map((x) => `[${x}]`).join('')}amix=inputs=${l.length}:normalize=0:duration=longest:dropout_transition=0[${name}]`);
  };
  for (const n of ['voice', 'music', 'sfx', 'bed']) mixBus(n);
  lines.push('[voice]asplit=2[vkey][vmix]');
  lines.push('[bed][vkey]sidechaincompress=threshold=0.05:ratio=3:attack=15:release=400:makeup=1[bedduck]');
  lines.push(`anoisesrc=color=brown:amplitude=0.05:sample_rate=44100:duration=${f3(total)},lowpass=f=500,volume=-20dB,${FMT}[room]`);
  lines.push('[vmix][bedduck][music][sfx][room]amix=inputs=5:normalize=0:duration=longest:dropout_transition=0[mix]');
  lines.push(`[mix]acompressor=threshold=0.178:ratio=2:attack=30:release=300,alimiter=limit=0.97,atrim=0:${f3(total)}[out]`);
  return { inputs, graph: lines.join(';\n') };
}

// ---------- ffmpeg helpers ----------
function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} failed (${r.status}): ${(r.stderr || '').slice(-800)}`);
  return r;
}
const ff = (args) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
const probeDur = (f) => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).stdout.trim());
function loudnorm(args, file) {
  const r = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', args + ':print_format=json', '-f', 'null', '-']);
  const j = r.stderr.slice(r.stderr.lastIndexOf('{'));
  return JSON.parse(j.slice(0, j.lastIndexOf('}') + 1));
}

// ---------- asset production ----------
function loadKey() {
  const m = readFileSync('.env', 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m);
  if (!m) throw new Error('ELEVENLABS_API_KEY missing in .env');
  return m[1].trim();
}
async function post(key, path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return Buffer.from(await res.arrayBuffer());
}
async function ensureSharedVoice(key, v) {
  if (!v.owner) return;
  const res = await fetch(`${API}/v1/voices/${v.id}`, { headers: { 'xi-api-key': key } });
  if (res.ok) return;
  const add = await fetch(`${API}/v1/voices/add/${v.owner}/${v.id}`, {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify({ new_name: v.name }),
  });
  const j = await add.json();
  if (!add.ok) throw new Error('add voice: ' + JSON.stringify(j).slice(0, 300));
  if (j.voice_id && j.voice_id !== v.id) v.id = j.voice_id;
}

// Local stand-ins so the mix can be tested without credits.
function fakeAsset(req, file) {
  if (req.kind === 'speech') {
    const chars = req.chars;
    const d = Math.max(0.6, chars / 14).toFixed(2);
    const f = 140 + (req.inputs[0].voice_id === VOICES.DANIELA.id ? 80 : 0);
    ff(['-f', 'lavfi', '-i', `sine=f=${f}:d=${d}`, '-f', 'lavfi', '-i', `anoisesrc=d=${d}:c=pink:a=0.2`, '-filter_complex',
      `[0:a]tremolo=f=5:d=0.9[a];[1:a]lowpass=f=1500[b];[a][b]amix=inputs=2:normalize=0`, '-ac', '2', file]);
  } else if (req.kind === 'music') {
    const d = (req.ms / 1000).toFixed(2);
    ff(['-f', 'lavfi', '-i', `sine=f=330:d=${d}`, '-f', 'lavfi', '-i', `sine=f=495:d=${d}`, '-filter_complex',
      `[0:a][1:a]amix=inputs=2:normalize=0,tremolo=f=2:d=0.5`, '-ac', '2', file]);
  } else {
    ff(['-f', 'lavfi', '-i', `anoisesrc=d=${req.s}:c=pink:a=0.3`, '-ac', '2', file]);
  }
}

async function produce(req, ctx) {
  const dir = ctx.fake ? join(ctx.work, 'fake') : ctx.work;
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${req.key}.mp3`);
  if (existsSync(file)) return file;
  if (ctx.fake) { fakeAsset(req, file); return file; }
  const q = '?output_format=mp3_44100_128';
  let buf;
  if (req.kind === 'speech') {
    console.log(`dialogue ${req.key}: ${req.inputs.length} lines, ${req.chars} chars`);
    buf = await post(ctx.apiKey, '/v1/text-to-dialogue' + q, { model_id: 'eleven_v3', language_code: 'es', inputs: req.inputs });
  } else if (req.kind === 'music') {
    console.log(`music ${req.label} (${req.ms / 1000}s)`);
    try {
      buf = await post(ctx.apiKey, '/v1/music' + q, { prompt: req.prompt, music_length_ms: req.ms, force_instrumental: true });
    } catch (e) {
      console.log('music API failed, falling back to sound effects:', e.message.slice(0, 160));
      buf = await post(ctx.apiKey, '/v1/sound-generation' + q, { text: req.prompt, duration_seconds: Math.min(req.ms / 1000, 22), prompt_influence: 0.5 });
    }
  } else {
    console.log(`sfx ${req.label} (${req.s}s)`);
    buf = await post(ctx.apiKey, '/v1/sound-generation' + q, { text: req.prompt, duration_seconds: req.s, prompt_influence: 0.6 });
  }
  writeFileSync(file, buf);
  return file;
}

// Convert to 44.1 kHz stereo wav at a target integrated loudness (cached).
function prep(file, lufs, ctx, tag) {
  const out = join(ctx.work, `prep-${tag}-${hash([file, lufs])}.wav`);
  if (existsSync(out)) return out;
  const m = Number(loudnorm('loudnorm=I=-16:TP=-1.5:LRA=11', file).input_i);
  const gain = Number.isFinite(m) ? Math.max(-30, Math.min(30, lufs - m)) : 0;
  ff(['-i', file, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=0.95`, '-ar', '44100', '-ac', '2', out]);
  return out;
}

// Station ID: spoken text over the music logo, light reverb, music trimmed to the cue length.
function composeSweeper(it, voiceWav, musicWav, ctx) {
  const len = Math.max(it.seconds, probeDur(voiceWav) + 0.9);
  const fo = it.fadeOut ? 1.5 : 0.5;
  const out = join(ctx.work, `sweeper-${hash([voiceWav, musicWav, len, fo])}.wav`);
  if (!existsSync(out)) {
    ff(['-i', musicWav, '-i', voiceWav, '-filter_complex',
      `[0:a]atrim=0:${f3(len)},asetpts=PTS-STARTPTS,volume=-3dB,afade=t=out:st=${f3(len - fo)}:d=${f3(fo)}[m];` +
      `[1:a]adelay=600:all=1,aecho=0.8:0.6:40|70:0.3|0.2[v];[m][v]amix=inputs=2:normalize=0:duration=longest,atrim=0:${f3(len)}`,
      '-ar', '44100', '-ac', '2', out]);
  }
  return out;
}

async function prepareAll(segs, reqs, ctx) {
  if (!ctx.fake) await ensureSharedVoice(ctx.apiKey, VOICES.DANIELA);
  const files = new Map();
  for (const r of reqs) files.set(r.key, await produce(r, ctx));
  const L = MIX.lufs;
  for (const it of segs) {
    if (it.type === 'sweeper') {
      const v = prep(files.get(it.voiceReq.key), L.speech, ctx, 'speech');
      const m = prep(files.get(it.musicReq.key), L.jingle, ctx, 'jingle');
      it.file = composeSweeper(it, v, m, ctx);
    } else if (it.req) {
      const target = it.type === 'segment' ? (it.phone ? L.phone : L.speech) : it.type === 'bed' ? L.bed
        : it.type === 'sfx' ? L.sfx : it.type === 'stinger' ? L.stinger : L.jingle;
      it.file = prep(files.get(it.req.key), target, ctx, it.type);
    }
    if (it.file) it.dur = probeDur(it.file);
  }
}

// ---------- mix ----------
function mixDown(segs, outPath, ctx) {
  const lay = layout(segs);
  const { inputs, graph } = buildGraph(lay);
  const script = join(ctx.work, 'mix-filter.txt');
  writeFileSync(script, graph);
  const master = join(ctx.work, 'master.wav');
  ff([...inputs.flatMap((i) => (i.loop ? ['-stream_loop', '-1', '-i', i.file] : ['-i', i.file])),
    '-/filter_complex', script, '-map', '[out]', '-ar', '44100', '-ac', '2', join(ctx.work, 'master-raw.wav')]);
  // Trim trailing silence (keep 0.4 s) so the file ends on the last sound, then a short fade.
  ff(['-i', join(ctx.work, 'master-raw.wav'), '-af',
    'areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.4,afade=t=in:d=0.3,areverse',
    master]);
  const m = loudnorm(`loudnorm=I=${MIX.finalLufs}:TP=${MIX.truePeak}:LRA=11`, master);
  mkdirSync(dirname(resolve(outPath)), { recursive: true });
  ff(['-i', master, '-af',
    `loudnorm=I=${MIX.finalLufs}:TP=${MIX.truePeak}:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
    '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '144k', outPath]);
  return lay;
}

export function measureOutput(file) {
  const r = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const s = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  return { lufs: Number(s.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]), peak: Number(s.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]) };
}

// ---------- CLI ----------
function parseArgs(argv) {
  const a = { guion: 'docs/plans/2026-11-26-podcast-prefijo-500-guion.md', work: 'scripts/podcast/.cache' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--guion') a.guion = argv[++i];
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--work') a.work = argv[++i];
    else if (['--test', '--spot-only', '--dry-run', '--fake-assets'].includes(k)) a[k.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = true;
    else throw new Error(`unknown option ${k}`);
  }
  a.out ??= a.test ? 'images/audio/_test-prefijo-500.mp3'
    : a.spotOnly ? 'images/audio/spot-montaweb-30s.mp3' : 'images/audio/prefijo-500-llamadas-comerciales.mp3';
  return a;
}

function describe(it) {
  if (it.type === 'segment') return `${it.phone ? 'PHONE ' : 'SPEECH'} ${it.lines.length} line(s), ${it.chars} chars: ${it.lines[0].text.slice(0, 40)}`;
  if (it.type === 'pause') return `pause ${it.seconds}s`;
  if (it.type === 'sfx') return `SFX ${it.id} [${it.at}]`;
  return `${it.type.toUpperCase()} ${it.id ?? ''} ${it.seconds ? `~${it.seconds}s` : ''}`.trim();
}

function dryRun(segs, reqs) {
  console.log('TIMELINE');
  segs.forEach((it, i) => console.log(`${String(i + 1).padStart(3)}. ${describe(it)}`));
  console.log('\nAPI CALLS (unique, cached ones are skipped at render time)');
  for (const r of reqs) {
    if (r.kind === 'speech') console.log(`  POST /v1/text-to-dialogue  eleven_v3  ${r.inputs.length} input(s), ${r.chars} chars  [${r.key}]`);
    else if (r.kind === 'music') console.log(`  POST /v1/music  ${r.ms / 1000}s  ${r.label}  [${r.key}]`);
    else console.log(`  POST /v1/sound-generation  ${r.s}s  ${r.label}  [${r.key}]`);
  }
  const sp = reqs.filter((r) => r.kind === 'speech');
  const mu = reqs.filter((r) => r.kind === 'music');
  const sx = reqs.filter((r) => r.kind === 'sfx');
  const chars = sp.reduce((n, r) => n + r.chars, 0);
  console.log(`\nSUMMARY: ${sp.length} dialogue calls (${chars} characters), ${mu.length} music calls (${mu.reduce((n, r) => n + r.ms / 1000, 0)} s), ${sx.length} sfx calls (${sx.reduce((n, r) => n + r.s, 0)} s).`);
  console.log(`Estimated credits: about ${chars} for speech (v3 bills per character, tags included) plus music/sound-generation by duration (check the ElevenLabs rate card). No API calls made.`);
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const parsed = parseGuion(readFileSync(a.guion, 'utf8'));
  const items = a.test ? selectTest(parsed.items) : a.spotOnly ? selectSpot(parsed) : parsed.items;
  const segs = buildSegments(items);
  const reqs = attachRequests(segs, parsed.items);
  if (a.dryRun) return dryRun(segs, reqs);
  const ctx = { work: resolve(a.work), fake: !!a.fakeAssets, apiKey: a.fakeAssets ? null : loadKey() };
  mkdirSync(ctx.work, { recursive: true });
  await prepareAll(segs, reqs, ctx);
  const lay = mixDown(segs, a.out, ctx);
  const m = measureOutput(a.out);
  console.log(`done: ${a.out} (${Math.round(probeDur(a.out))} s, ${m.lufs} LUFS, peak ${m.peak} dBFS, ${lay.events.length} events)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((e) => { console.error(e.message); process.exitCode = 1; });
}
