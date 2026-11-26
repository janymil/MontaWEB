// Builds the AI demo reels for /videos-publicitarios-con-ia.
// Input: scripts/demo-reels/reels.json (es-PE texts + path to each raw AI clip from Google Flow).
// Per reel: ElevenLabs voice-over + instrumental music, burned subtitles, a permanent
// "Video generado con IA" label, an end card; output WebM + MP4 + poster JPG in images/video/demos/.
// Usage: node scripts/demo-reels/make-demo-reels.mjs [only-slug]
// Reads ELEVENLABS_API_KEY from .env (cwd) or from the file in ELEVENLABS_ENV. Audio is cached in
// scripts/demo-reels/.cache, so a rerun only pays for texts that changed.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const CFG = JSON.parse(readFileSync(join(import.meta.dirname, 'reels.json'), 'utf8'));
const CACHE = join(import.meta.dirname, '.cache');
const OUT = join(ROOT, 'images', 'video', 'demos');
mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT, { recursive: true });

const envFile = process.env.ELEVENLABS_ENV || join(ROOT, '.env');
const KEY = existsSync(envFile) ? (readFileSync(envFile, 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m) || [])[1]?.trim() : undefined;
const API = 'https://api.elevenlabs.io';
const FONT = 'C\\:/Windows/Fonts/arialbd.ttf';
const W = 720, H = 1280, END = 2.6;

const hash = (o) => createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 12);
const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

async function post(path, body) {
  if (!KEY) throw new Error('ELEVENLABS_API_KEY missing (set ELEVENLABS_ENV to the .env path)');
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function cached(kind, spec, make) {
  const file = join(CACHE, `${kind}-${hash(spec)}.mp3`);
  if (!existsSync(file)) { console.log(`  ${kind}: generating`); writeFileSync(file, await make()); }
  return file;
}

// Text for drawtext goes through textfile= so accents, colons and quotes need no escaping.
const tf = (name, text) => { const f = join(CACHE, `${name}.txt`); writeFileSync(f, text, 'utf8'); return f.replace(/\\/g, '/').replace(':', '\\:'); };

async function build(r) {
  console.log(`reel ${r.slug}`);
  const vo = await cached('vo', { v: r.voice, t: r.voiceover }, () => post(`/v1/text-to-speech/${r.voice}?output_format=mp3_44100_128`, {
    text: r.voiceover, model_id: 'eleven_multilingual_v2', language_code: 'es',
    voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, speed: 1.0 },
  }));
  const voLen = dur(vo);
  const clipLen = dur(resolve(ROOT, r.clip));
  const main = Math.max(clipLen, voLen + 0.6);
  const total = main + END;
  const music = await cached('music', { p: r.music, ms: Math.ceil(total * 1000) + 500 }, () =>
    post('/v1/music?output_format=mp3_44100_128', { prompt: r.music, music_length_ms: Math.ceil(total * 1000) + 500, force_instrumental: true }));

  // subtitles: spread the chunks over the voice-over, proportional to their length
  const chars = r.subtitles.reduce((n, s) => n + s.length, 0);
  let t = 0.3;
  const subs = r.subtitles.map((s, i) => {
    const d = (s.length / chars) * voLen;
    const from = t; t += d;
    return `drawtext=fontfile='${FONT}':textfile='${tf(`${r.slug}-sub${i}`, s)}':fontsize=40:fontcolor=white:line_spacing=8:box=1:boxcolor=black@0.55:boxborderw=18:x=(w-text_w)/2:y=h*0.72:enable='between(t,${from.toFixed(2)},${t.toFixed(2)})'`;
  });
  const label = `drawtext=fontfile='${FONT}':textfile='${tf(`${r.slug}-label`, r.label)}':fontsize=24:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=10:x=w-text_w-28:y=36`;
  const endTitle = `drawtext=fontfile='${FONT}':textfile='${tf(`${r.slug}-end1`, r.endTitle)}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=h*0.40:enable='gte(t,${main.toFixed(2)})'`;
  const endLine = `drawtext=fontfile='${FONT}':textfile='${tf(`${r.slug}-end2`, r.endLine)}':fontsize=36:fontcolor=${r.accent || '#ffd166'}:x=(w-text_w)/2:y=h*0.40+100:enable='gte(t,${main.toFixed(2)})'`;

  const v = [
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30,setsar=1,tpad=stop_mode=clone:stop_duration=${(main - clipLen + 0.05).toFixed(2)},trim=duration=${main.toFixed(2)}[a]`,
    `color=c=${r.endColor || '#1c1917'}:s=${W}x${H}:r=30:d=${END}[b]`,
    `[a][b]concat=n=2:v=1:a=0,${subs.join(',')},${endTitle},${endLine},${label},format=yuv420p[v]`,
    `[1:a]adelay=300|300,volume=1.0[vo]`,
    `[2:a]volume=0.16,afade=t=out:st=${(total - 1).toFixed(2)}:d=1[mu]`,
    `[vo][mu]amix=inputs=2:duration=longest:normalize=0,atrim=duration=${total.toFixed(2)},loudnorm=I=-16:TP=-1.5[aud]`,
  ].join(';');
  const mp4 = join(OUT, `${r.slug}.mp4`), webm = join(OUT, `${r.slug}.webm`), jpg = join(OUT, `${r.slug}-poster.jpg`);
  ff(['-i', resolve(ROOT, r.clip), '-i', vo, '-i', music, '-filter_complex', v, '-map', '[v]', '-map', '[aud]',
    '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', mp4]);
  ff(['-i', mp4, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', '-c:a', 'libopus', '-b:a', '64k', webm]);
  ff(['-ss', String(r.posterAt ?? 1.5), '-i', mp4, '-frames:v', '1', '-q:v', '4', jpg]);
  console.log(`  done: ${total.toFixed(1)} s`);
}

const only = process.argv[2];
for (const r of CFG.reels) if (!only || r.slug === only) await build(r);
