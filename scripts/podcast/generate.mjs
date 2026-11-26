// Renders a two-host podcast script (docs/plans/*-guion.md) with ElevenLabs
// Text to Dialogue (eleven_v3) + sound effects, then mixes it with ffmpeg.
// Usage: node scripts/podcast/generate.mjs <script.md> <out.mp3> [workDir]
// Reads ELEVENLABS_API_KEY from .env. Generated parts are cached in workDir,
// so a rerun only pays for parts whose text changed.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const [, , scriptPath, outPath, workArg] = process.argv;
if (!scriptPath || !outPath) throw new Error('usage: generate.mjs <script.md> <out.mp3> [workDir]');
const work = resolve(workArg || 'scripts/podcast/.cache');
mkdirSync(work, { recursive: true });

const env = readFileSync('.env', 'utf8');
const KEY = (env.match(/^ELEVENLABS_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!KEY) throw new Error('ELEVENLABS_API_KEY missing in .env');
const API = 'https://api.elevenlabs.io';

const VOICES = {
  DANIELA: { id: 'VywzfvxxNk4yFAaoMm4Q', owner: '6ca924052556a45b643b02d081936b5b1718ab20633c23ff2e769448981d10ab', name: 'MontaWeb Daniela' },
  JAIR: { id: 'I9uZPOVoQkQEhHPStmJz' },
};

const SFX = {
  intro: { kind: 'music', prompt: 'Upbeat modern Latin radio podcast intro jingle, light percussion, bright synth and guitar, energetic and friendly, instrumental only, clean ending', ms: 8000 },
  outro: { kind: 'music', prompt: 'Short upbeat modern Latin radio podcast outro jingle, light percussion, bright synth and guitar, friendly, instrumental only, ends with a clean final hit', ms: 6000 },
  ooh: { kind: 'sfx', prompt: 'Small live studio audience reacting with a surprised "ooooh", short, close, no music', s: 2.2 },
  stinger: { kind: 'sfx', prompt: 'Short radio show transition stinger, quick whoosh into a bright soft chime, clean', s: 1.6 },
};
const sfxFor = (line) => {
  const l = line.toLowerCase();
  if (l.includes('intro')) return 'intro';
  if (l.includes('outro')) return 'outro';
  if (l.includes('ooooh')) return 'ooh';
  return 'stinger';
};

// ---- parse the script ----
const body = readFileSync(scriptPath, 'utf8').split(/^---$/m).slice(1).join('---');
const parts = []; // {type:'dialogue', lines:[{voice,text}]} | {type:'sfx', key}
for (const raw of body.split(/\r?\n/)) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith('[SFX')) { parts.push({ type: 'sfx', key: sfxFor(line) }); continue; }
  const m = line.match(/^(DANIELA|JAIR):\s*(.+)$/);
  if (!m) continue;
  let last = parts[parts.length - 1];
  if (!last || last.type !== 'dialogue' || last.lines.reduce((n, x) => n + x.text.length, 0) > 2200) {
    last = { type: 'dialogue', lines: [] };
    parts.push(last);
  }
  last.lines.push({ voice: m[1], text: m[2] });
}

const hash = (o) => createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 12);

async function post(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function ensureSharedVoice(v) {
  if (!v.owner) return;
  const res = await fetch(`${API}/v1/voices/${v.id}`, { headers: { 'xi-api-key': KEY } });
  if (res.ok) return;
  const add = await fetch(`${API}/v1/voices/add/${v.owner}/${v.id}`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_name: v.name }),
  });
  const j = await add.json();
  if (!add.ok) throw new Error('add voice: ' + JSON.stringify(j).slice(0, 300));
  if (j.voice_id && j.voice_id !== v.id) v.id = j.voice_id;
}

async function render(part) {
  if (part.type === 'dialogue') {
    const inputs = part.lines.map((l) => ({ text: l.text, voice_id: VOICES[l.voice].id }));
    const file = join(work, `dlg-${hash(inputs)}.mp3`);
    if (!existsSync(file)) {
      console.log(`dialogue: ${inputs.length} lines, ${inputs.reduce((n, x) => n + x.text.length, 0)} chars`);
      writeFileSync(file, await post('/v1/text-to-dialogue?output_format=mp3_44100_128', { model_id: 'eleven_v3', language_code: 'es', inputs }));
    }
    return file;
  }
  const s = SFX[part.key];
  const file = join(work, `sfx-${part.key}-${hash(s)}.mp3`);
  if (!existsSync(file)) {
    console.log(`${s.kind}: ${part.key}`);
    let buf;
    if (s.kind === 'music') {
      try {
        buf = await post('/v1/music?output_format=mp3_44100_128', { prompt: s.prompt, music_length_ms: s.ms, force_instrumental: true });
      } catch (e) {
        console.log('music API failed, falling back to sound effects:', e.message.slice(0, 160));
        buf = await post('/v1/sound-generation?output_format=mp3_44100_128', { text: s.prompt, duration_seconds: Math.min(s.ms / 1000, 22), prompt_influence: 0.5 });
      }
    } else {
      buf = await post('/v1/sound-generation?output_format=mp3_44100_128', { text: s.prompt, duration_seconds: s.s, prompt_influence: 0.6 });
    }
    writeFileSync(file, buf);
  }
  return file;
}

await ensureSharedVoice(VOICES.DANIELA);
const files = [];
for (const p of parts) files.push({ type: p.type, key: p.key, file: await render(p) });

// ---- mix: normalise each part, jingles a bit lower, short gaps, then loudness-normalise ----
const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const norm = [];
files.forEach((f, i) => {
  const out = join(work, `n${String(i).padStart(2, '0')}.wav`);
  const vol = f.type === 'dialogue' ? 'loudnorm=I=-16:TP=-1.5:LRA=11' : f.key === 'ooh' ? 'loudnorm=I=-17:TP=-2' : f.key === 'stinger' ? 'loudnorm=I=-18:TP=-2' : 'loudnorm=I=-16:TP=-1.5';
  const fade = f.type === 'sfx' ? ',afade=t=in:d=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=' + (f.key === 'intro' || f.key === 'outro' ? '1.2' : '0.4') + ',areverse' : '';
  ff(['-i', f.file, '-af', vol + fade + ',apad=pad_dur=0.25', '-ar', '44100', '-ac', '1', out]);
  norm.push(out);
});
const list = join(work, 'concat.txt');
writeFileSync(list, norm.map((n) => `file '${n.replace(/\\/g, '/')}'`).join('\n'));
mkdirSync(resolve(outPath, '..'), { recursive: true });
ff(['-f', 'concat', '-safe', '0', '-i', list, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', '-ac', '1', '-b:a', '64k', outPath]);
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', outPath]).toString().trim();
console.log(`done: ${outPath} (${Math.round(dur)} s)`);
