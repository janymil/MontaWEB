// Builds the AI demo reels for /videos-publicitarios-con-ia as a motion-graphics edit.
//
// Usage (from the repo root):
//   ELEVENLABS_ENV=C:/path/.env node scripts/demo-reels/make-demo-reels.mjs [--draft] [slug]
//   node scripts/demo-reels/make-demo-reels.mjs --sheet <slug>         contact sheet -> .cache/<slug>-sheet.jpg (1 frame/s, 9 across)
//   node scripts/demo-reels/make-demo-reels.mjs --frame <slug> <t>     one composited frame at t seconds -> .cache/<slug>-frame-<t>.png
//   node scripts/demo-reels/make-demo-reels.mjs --timing [slug]        print caption timings from the voice-over alignment
//   --draft: a missing raw shot (raw/<name>.mp4) is replaced by a segment of the reel's "draftFile" and a warning is printed.
//            Without --draft a missing shot is an error.
//   --footage-only is not needed: the footage track is cached in .cache and rebuilt only when shots/cards/outro change.
// Reads ELEVENLABS_API_KEY from .env (cwd) or from the file named in ELEVENLABS_ENV. Voice, alignment, music and sound
// effects are cached in scripts/demo-reels/.cache, so reruns only pay for texts that changed.
//
// Output: images/video/demos/<slug>.mp4 + .webm + <slug>-poster.jpg
// Pipeline: footage track (ffmpeg: Ken Burns, transitions, blur boxes, blurred+darkened backdrop under cards)
//         + overlay layer (HTML/CSS in headless Chromium, transparent PNG frames, see overlay.mjs)
//         + audio (ElevenLabs voice with timestamps, music ducked under the voice, sfx hits, loudnorm -16 LUFS).
//
// reels.json schema ("reels": [ ... ]); every string shown on screen comes from here, nothing is added by the code:
//   slug, voice (ElevenLabs voice id), voiceover (the full text the voice reads), music (ElevenLabs music prompt),
//   palette { bg, bg2, accent, key, text, ink, red?, blue? }   key = highlight colour for caption keywords / stamp ring
//   draftFile                      raw clip used for missing shots in --draft mode
//   posterAt                       seconds; frame used for the poster (offer card or hook, not black)
//   shots[]  { file, from, to,     raw clip + source range in seconds; the slot on the timeline is (to - from), slots follow each other
//              transition?,        how the shot is ENTERED: cut | flash (white flash) | zoomin | slideleft (default cut; ignored for the first shot)
//              zoom?,              [start, end] scale of the slow push-in (default [1, 1.12]); end < start = pull-out
//              focus?,             [x, y] 0..1 point the zoom aims at (default [.5, .5])
//              blur?[] }           { x, y, w, h, from, to } boxes in output pixels over garbled AI lettering, seconds relative to the shot start
//   hook { lines[], highlightWord } the opening question, shown uppercase, 0-2.5 s; highlightWord gets the brand block
//   captions[] { text, display, key?, hold? }   text = EXACT substring of voiceover (in order), gives the timing via the character alignment;
//                                        display = on-screen string ("\n" = line break); key = word coloured with palette.key (default: longest)
//   cards[]  { type: "offer", at, dur, title?, headline?, items?[], price? | badge? }   at/dur in seconds
//            title = tilted ribbon, headline = big line, items = bullet lines (max 3), price = stamp ("S/ 15"), badge = stamp text without a price
//   shots[].speed? 0.4 = slow motion (source range is divided by speed on the timeline)
//   cards[].noBlur? true = footage stays sharp under the card; compact? true = small card in the upper third
//   outro { at, dur, pattern: rays|paws|pole, icon: flame|paw|scissors, name, kind, recap, cta, sub }
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, rmSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { renderFrames, cleanDir, FPS, W, H } from './overlay.mjs';

const ROOT = resolve(import.meta.dirname, '..', '..');
const CFG = JSON.parse(readFileSync(join(import.meta.dirname, 'reels.json'), 'utf8'));
const CACHE = join(import.meta.dirname, '.cache');
const OUT = join(ROOT, 'images', 'video', 'demos');
mkdirSync(CACHE, { recursive: true });

const envFile = process.env.ELEVENLABS_ENV || join(ROOT, '.env');
const KEY = existsSync(envFile) ? (readFileSync(envFile, 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m) || [])[1]?.trim() : undefined;
const API = 'https://api.elevenlabs.io';

const HOOK_END = 2.5, VO_DELAY = 0.1;
const TRANS = { cut: ['fade', 0.05], flash: ['fadewhite', 0.14], zoomin: ['zoomin', 0.3], slideleft: ['slideleft', 0.25] };

const hash = (o) => createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 12);
const ffArgs = (args) => ['-hide_banner', '-loglevel', 'error', '-y', ...args];
const ff = (args) => execFileSync('ffmpeg', ffArgs(args), { stdio: 'inherit', maxBuffer: 1 << 28 });
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const fx = (n) => Number(n).toFixed(3);

// ---------- ElevenLabs ----------
async function post(path, body, json = false) {
  if (!KEY) throw new Error('ELEVENLABS_API_KEY missing (set ELEVENLABS_ENV to the .env path)');
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: json ? 'application/json' : 'audio/mpeg' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return json ? res.json() : Buffer.from(await res.arrayBuffer());
}

async function cachedFile(kind, spec, ext, make) {
  const file = join(CACHE, `${kind}-${hash(spec)}.${ext}`);
  if (!existsSync(file)) { console.log(`  ${kind}: generating`); writeFileSync(file, await make()); }
  return file;
}

async function voiceOver(r) {
  const spec = { v: r.voice, t: r.voiceover, ts: 1 };
  const mp3 = join(CACHE, `vo-${hash(spec)}.mp3`), js = join(CACHE, `vo-${hash(spec)}.json`);
  if (!existsSync(mp3) || !existsSync(js)) {
    console.log('  voice-over: generating (with timestamps)');
    const res = await post(`/v1/text-to-speech/${r.voice}/with-timestamps?output_format=mp3_44100_128`, {
      text: r.voiceover, model_id: 'eleven_multilingual_v2', language_code: 'es',
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, speed: 1.0 },
    }, true);
    writeFileSync(mp3, Buffer.from(res.audio_base64, 'base64'));
    writeFileSync(js, JSON.stringify(res.alignment));
  }
  return { mp3, align: JSON.parse(readFileSync(js, 'utf8')) };
}

const sfx = (prompt, seconds) => cachedFile('sfx', { prompt, seconds }, 'mp3', () =>
  post('/v1/sound-generation?output_format=mp3_44100_128', { text: prompt, duration_seconds: seconds, prompt_influence: 0.6 }));

// ---------- timeline ----------
function locateChunks(r, align) {
  const chars = align.characters;
  if (chars.join('') !== r.voiceover) throw new Error(`${r.slug}: alignment text differs from voiceover`);
  let pos = 0;
  return r.captions.map((c) => {
    const i = r.voiceover.indexOf(c.text, pos);
    if (i < 0) throw new Error(`${r.slug}: caption text not found in order in the voiceover: "${c.text}"`);
    pos = i + c.text.length;
    return { ...c, vStart: align.character_start_times_seconds[i] + VO_DELAY, vEnd: align.character_end_times_seconds[pos - 1] + VO_DELAY };
  });
}

function makeTimeline(r, align) {
  const o = r.outro, total = o.at + o.dur;
  const chunks = locateChunks(r, align);
  const captions = [];
  chunks.forEach((c, i) => {
    let start = Math.max(c.vStart, HOOK_END - 0.05);
    let end = Math.min(chunks[i + 1] ? chunks[i + 1].vStart : Infinity, c.vEnd + (c.hold ?? 0.55), o.at - 0.05);
    for (const k of r.cards) {
      if (start >= k.at - 0.05 && start < k.at + k.dur) start = k.at + k.dur + 0.1;
      else if (start < k.at && end > k.at) end = k.at;
    }
    if (end - start < 0.35) { console.warn(`  warning: caption "${c.display}" dropped (too short: ${(end - start).toFixed(2)} s)`); return; }
    captions.push({ ...c, start, end });
  });
  return { slug: r.slug, total, palette: r.palette, hook: { ...r.hook, end: HOOK_END }, captions, cards: r.cards, outro: o, voLen: align.character_end_times_seconds.at(-1) + VO_DELAY };
}

// ---------- footage track ----------
function resolveShots(r, draft) {
  const shots = r.shots.map((s, i) => {
    let file = resolve(ROOT, s.file), from = s.from, to = s.to;
    if (!existsSync(file)) {
      if (!draft) throw new Error(`${r.slug}: missing ${s.file} (use --draft to substitute a segment of ${r.draftFile})`);
      console.warn(`  warning: ${s.file} missing, draft uses a segment of ${r.draftFile}`);
      file = resolve(ROOT, r.draftFile);
      const raw = dur(file) - 0.1, len = to - from;
      from = len >= raw ? 0 : Math.min(raw - len, (i * 2.3) % (raw - len));
      to = from + len;
    }
    return { ...s, file, from, to, len: (to - from) / (s.speed || 1) };
  });
  let t = 0;
  shots.forEach((s) => { s.start = t; t += s.len; });
  return shots;
}

function buildFootage(r, tl, shots, out) {
  const dnext = shots.map((_, i) => (i + 1 < shots.length ? TRANS[shots[i + 1].transition || 'cut'][1] : 0));
  const parts = [];
  shots.forEach((s, i) => {
    const L = s.len + dnext[i] + (i === shots.length - 1 ? 1.5 : 0), N = Math.round(L * FPS);
    const [z0, z1] = s.zoom || [1, 1.12], [fxp, fyp] = s.focus || [0.5, 0.5];
    const blurs = s.blur || [];
    const blurChain = blurs.length
      ? `,split=${blurs.length + 1}[base${i}]${blurs.map((_, k) => `[bs${i}_${k}]`).join('')};` +
        blurs.map((b, k) => `[bs${i}_${k}]crop=${b.w}:${b.h}:${b.x}:${b.y},boxblur=24:3[bk${i}_${k}]`).join(';') + ';' +
        blurs.map((b, k) => `${k === 0 ? `[base${i}]` : `[bo${i}_${k - 1}]`}[bk${i}_${k}]overlay=${b.x}:${b.y}:enable='between(t,${b.from},${b.to})'${k === blurs.length - 1 ? '' : `[bo${i}_${k}]`}`).join(';')
      : '';
    parts.push(`[${i}:v]trim=start=${fx(s.from)}:duration=${fx(L * (s.speed || 1))},setpts=(PTS-STARTPTS)/${s.speed || 1},${s.speed && s.speed < 1 ? `minterpolate=fps=${FPS}:mi_mode=blend,` : ''}fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,tpad=stop_mode=clone:stop_duration=${fx(L)},trim=duration=${fx(L)},setpts=PTS-STARTPTS${blurChain}` +
      `${blurs.length ? '' : ''},scale=${W * 3}:${H * 3}:flags=bicubic,` +
      `zoompan=z='${z0}+(${z1}-${z0})*(1-pow(1-min(on/${N},1),2))':x='(iw-iw/zoom)*${fxp}':y='(ih-ih/zoom)*${fyp}':d=1:s=${W}x${H}:fps=${FPS},format=yuv420p,setsar=1[s${i}]`);
  });
  // chain with xfade: the outgoing shot is extended by the transition length, so every shot starts at its nominal slot time
  let cur = 's0';
  shots.forEach((s, i) => {
    if (i === 0) return;
    const [name, d] = TRANS[s.transition || 'cut'];
    parts.push(`[${cur}][s${i}]xfade=transition=${name}:duration=${d}:offset=${fx(s.start)}[x${i}]`);
    cur = `x${i}`;
  });
  parts.push(`[${cur}]tpad=stop_mode=clone:stop_duration=3,trim=duration=${fx(tl.total)},setpts=PTS-STARTPTS[fv]`);
  // blurred + darkened backdrop under the offer cards (alpha-faded in and out)
  cur = 'fv';
  tl.cards.forEach((c, k) => {
    if (c.noBlur) return;
    parts.push(`[${cur}]split[ca${k}][cb${k}]`);
    parts.push(`[cb${k}]boxblur=22:2,eq=brightness=-0.12:saturation=0.9,format=yuva420p,fade=t=in:st=${fx(c.at - 0.05)}:d=0.3:alpha=1,fade=t=out:st=${fx(c.at + c.dur - 0.3)}:d=0.3:alpha=1[cbb${k}]`);
    parts.push(`[ca${k}][cbb${k}]overlay=format=auto[cc${k}]`);
    cur = `cc${k}`;
  });
  parts.push(`[${cur}]format=yuv420p[out]`);
  const script = join(CACHE, `${r.slug}-footage.filter`);
  writeFileSync(script, parts.join(';\n'), 'utf8');
  ff([...shots.flatMap((s) => ['-i', s.file]), '-/filter_complex', script, '-map', '[out]', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', out]);
}

// ---------- audio ----------
async function buildAudio(r, tl, vo, out) {
  const music = await cachedFile('music', { p: r.music, ms: Math.ceil(tl.total * 1000) + 500 }, 'mp3', () =>
    post('/v1/music?output_format=mp3_44100_128', { prompt: r.music, music_length_ms: Math.ceil(tl.total * 1000) + 500, force_instrumental: true }));
  const boom = await sfx('short punchy cinematic boom hit with a bright whoosh', 1.5);
  const whoosh = await sfx('fast whoosh swoosh transition sound effect, short and crisp', 1.0);
  // sfx events: [file, time, volume, maxLength]
  const ev = [[whoosh, 0.02, 0.8, 1.0], [boom, tl.outro.at + 0.42, 1.0, 1.5]];
  tl.cards.forEach((c) => { ev.push([whoosh, c.at - 0.05, 0.6, 0.9]); ev.push([boom, c.at + 0.5, 0.45, 0.7]); });
  r.shots.forEach((s, i) => { if (i && s.transition === 'slideleft') ev.push([whoosh, tl.shotStarts[i] - 0.1, 0.5, 0.8]); });
  const fmt = 'aformat=sample_rates=44100:channel_layouts=stereo';
  const os = tl.outro.at;
  const f = [
    `[0:a]${fmt},adelay=${Math.round(VO_DELAY * 1000)}|${Math.round(VO_DELAY * 1000)},volume=1.0,asplit=2[vo][key]`,
    `[1:a]${fmt},volume='0.55+0.45*min(1,max(0,(t-${fx(os - 0.3)})/0.5))':eval=frame[m0]`,
    `[m0][key]sidechaincompress=threshold=0.025:ratio=9:attack=15:release=450:makeup=1[mu]`,
    ...ev.map((e, i) => `[${i + 2}:a]${fmt},atrim=0:${e[3]},afade=t=out:st=${fx(e[3] - 0.25)}:d=0.25,adelay=${Math.round(e[1] * 1000)}|${Math.round(e[1] * 1000)},volume=${e[2]}[e${i}]`),
    `[vo][mu]${ev.map((_, i) => `[e${i}]`).join('')}amix=inputs=${ev.length + 2}:normalize=0:duration=longest,atrim=duration=${fx(tl.total)},afade=t=out:st=${fx(tl.total - 0.15)}:d=0.15,loudnorm=I=-16:TP=-1.5:LRA=11[aud]`,
  ].join(';');
  const script = join(CACHE, `${r.slug}-audio.filter`);
  writeFileSync(script, f, 'utf8');
  ff(['-i', vo.mp3, '-i', music, ...ev.flatMap((e) => ['-i', e[0]]), '-/filter_complex', script, '-map', '[aud]', '-ar', '44100', '-c:a', 'pcm_s16le', out]);
}

// ---------- reel ----------
async function prepare(r, draft) {
  const vo = await voiceOver(r);
  const tl = makeTimeline(r, vo.align);
  const shots = resolveShots(r, draft);
  tl.shotStarts = shots.map((s) => s.start);
  const shotsEnd = shots.reduce((n, s) => n + s.len, 0);
  if (Math.abs(shotsEnd - r.outro.at) > 0.05) console.warn(`  warning: shots end at ${shotsEnd.toFixed(2)} s but the outro starts at ${r.outro.at} s`);
  if (tl.voLen > r.outro.at + 0.5) console.warn(`  warning: voice-over ends at ${tl.voLen.toFixed(1)} s, after the outro starts (${r.outro.at} s)`);
  return { vo, tl, shots };
}

async function ensureFootage(r, tl, shots, draft) {
  const spec = { shots: shots.map((s) => ({ ...s, size: existsSync(s.file) ? statSync(s.file).size : 0 })), cards: tl.cards.map((c) => [c.at, c.dur, !!c.noBlur]), total: tl.total, v: 4 };
  const file = join(CACHE, `${r.slug}-footage-${hash(spec)}.mp4`);
  if (!existsSync(file)) { console.log('  footage: rendering'); buildFootage(r, tl, shots, file); }
  return file;
}

async function build(r, draft) {
  const t0 = Date.now();
  console.log(`reel ${r.slug}`);
  const { vo, tl, shots } = await prepare(r, draft);
  console.log(`  voice-over ${tl.voLen.toFixed(1)} s, total ${tl.total} s`);
  const footage = await ensureFootage(r, tl, shots, draft);
  const t1 = Date.now();
  const frames = join(CACHE, `${r.slug}-frames`);
  cleanDir(frames);
  await renderFrames(tl, frames, { workers: 3 });
  console.log(`  overlay frames: ${((Date.now() - t1) / 1000).toFixed(0)} s`);
  const wav = join(CACHE, `${r.slug}-mix.wav`);
  await buildAudio(r, tl, vo, wav);
  mkdirSync(OUT, { recursive: true });
  const mp4 = join(OUT, `${r.slug}.mp4`), webm = join(OUT, `${r.slug}.webm`), jpg = join(OUT, `${r.slug}-poster.jpg`);
  const inputs = ['-i', footage, '-framerate', String(FPS), '-i', join(frames, 'f%05d.png'), '-i', wav];
  const vf = '[0:v][1:v]overlay=format=auto:shortest=1,format=yuv420p[v]';
  ff([...inputs, '-filter_complex', vf, '-map', '[v]', '-map', '2:a', '-t', fx(tl.total), '-c:v', 'libx264', '-crf', String(r.crf || 27), '-maxrate', '850k', '-bufsize', '1700k', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', mp4]);
  ff([...inputs, '-filter_complex', vf, '-map', '[v]', '-map', '2:a', '-t', fx(tl.total), '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', '-c:a', 'libopus', '-b:a', '96k', webm]);
  ff(['-ss', String(r.posterAt), '-i', mp4, '-frames:v', '1', '-q:v', '3', jpg]);
  rmSync(frames, { recursive: true, force: true });
  console.log(`  done: ${tl.total} s, mp4 ${(statSync(mp4).size / 1e6).toFixed(2)} MB, webm ${(statSync(webm).size / 1e6).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

async function sheet(r) {
  const mp4 = join(OUT, `${r.slug}.mp4`);
  if (!existsSync(mp4)) throw new Error(`${mp4} not built yet`);
  const rows = Math.ceil(dur(mp4) / 9);
  const out = join(CACHE, `${r.slug}-sheet.jpg`);
  ff(['-i', mp4, '-vf', `fps=1,scale=200:-2,tile=9x${rows}:padding=4:color=black`, '-frames:v', '1', '-q:v', '3', out]);
  console.log(out);
}

async function frame(r, t, draft) {
  const { tl, shots } = await prepare(r, draft);
  const footage = await ensureFootage(r, tl, shots, draft);
  const dir = join(CACHE, `${r.slug}-frametmp-${t}`);
  cleanDir(dir);
  const idx = Math.round(t * FPS);
  await renderFrames(tl, dir, { workers: 1, only: idx });
  const out = join(CACHE, `${r.slug}-frame-${t}.png`);
  ff(['-ss', fx(idx / FPS), '-i', footage, '-i', join(dir, `f${String(idx).padStart(5, '0')}.png`), '-filter_complex', '[0:v][1:v]overlay=format=auto', '-frames:v', '1', out]);
  rmSync(dir, { recursive: true, force: true });
  console.log(out);
}

async function timing(r) {
  const { vo, tl } = await prepare(r, true);
  console.log(`${r.slug}: voice-over ends ${tl.voLen.toFixed(2)} s`);
  const ch = vo.align.characters, st = vo.align.character_start_times_seconds;
  let s = 0;
  for (let i = 0; i < ch.length; i++) if (i === ch.length - 1 || /[.?:,]/.test(ch[i]) && ch[i + 1] === ' ') { console.log(`  ${(st[s] + VO_DELAY).toFixed(2)}-${(vo.align.character_end_times_seconds[i] + VO_DELAY).toFixed(2)}  ${r.voiceover.slice(s, i + 1)}`); s = i + 2; }
  tl.captions.forEach((c) => console.log(`  caption ${c.start.toFixed(2)}-${c.end.toFixed(2)}  ${c.display.replace('\n', ' / ')}`));
}

const argv = process.argv.slice(2);
const draft = argv.includes('--draft');
const pos = argv.filter((a) => !a.startsWith('--'));
const find = (slug) => CFG.reels.find((r) => r.slug === slug) || (() => { throw new Error(`unknown reel ${slug}`); })();
if (argv.includes('--sheet')) await sheet(find(pos[0]));
else if (argv.includes('--frame')) await frame(find(pos[0]), Number(pos[1]), draft);
else if (argv.includes('--timing')) { for (const r of CFG.reels) if (!pos[0] || r.slug === pos[0]) await timing(r); }
else for (const r of CFG.reels) if (!pos[0] || r.slug === pos[0]) await build(r, draft);
