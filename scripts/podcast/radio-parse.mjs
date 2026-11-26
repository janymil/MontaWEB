// Parses a radio-style guion (docs/plans/*-guion.md) into an ordered timeline.
// Cue grammar: see scripts/podcast/README-radio.md. Pure functions, no I/O.

const SPEECH_RE = /^(DANIELA|JAIR)(\s*\[PHONE\])?:\s*(.*)$/;
const REF_RE = /^same\s+(?:style|family|logo)(?:\s+as\s+([\w-]+))?\s*[,;.]?\s*(.*)$/i;
const SECONDS_RE = /~\s*(\d+(?:\.\d+)?)\s*s\b/;
export const SFX_AT = ['before', 'under', 'after'];
export const MAX_SEGMENT_CHARS = 2200;

function fieldsOf(inner) {
  return inner.split('|').map((s) => s.trim());
}

function parseBlock(text, spot) {
  const items = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line === '---') continue;
    if (line.startsWith('### ')) {
      items.push({ type: 'heading', title: line.slice(4).trim(), spot });
      continue;
    }
    if (line.startsWith('#')) continue;
    const sp = line.match(SPEECH_RE);
    if (sp) {
      items.push({ type: 'speech', voice: sp[1], phone: !!sp[2], text: sp[3].trim(), spot });
      continue;
    }
    const pause = line.match(/^\[pause\s+(\d+(?:\.\d+)?)\s*s\]$/i);
    if (pause) {
      items.push({ type: 'pause', seconds: Number(pause[1]), spot });
      continue;
    }
    if (line === '[SPOT]') {
      items.push({ type: 'spot-marker', spot });
      continue;
    }
    const cue = line.match(/^\[(SWEEPER|JINGLE|BED|STINGER|SFX):\s*(.*)\]$/);
    if (!cue) continue; // prose / unknown line
    const f = fieldsOf(cue[2]);
    const base = { spot };
    if (cue[1] === 'BED') {
      items.push(f[0] === 'off' ? { ...base, type: 'bed', id: 'off' } : { ...base, type: 'bed', id: f[0], desc: f[1] || '' });
    } else if (cue[1] === 'JINGLE') {
      items.push({ ...base, type: 'jingle', id: f[0], desc: f[1] || '', seconds: (f[1] || '').match(SECONDS_RE)?.[1] * 1 || 4 });
    } else if (cue[1] === 'STINGER') {
      items.push({ ...base, type: 'stinger', id: f[0], desc: f[1] || '', seconds: 2 });
    } else if (cue[1] === 'SFX') {
      if (!SFX_AT.includes(f[2])) throw new Error(`SFX "${f[0]}": 'at' must be before|under|after, got "${f[2]}"`);
      items.push({ ...base, type: 'sfx', id: f[0], desc: f[1], at: f[2] });
    } else {
      const sw = (f[1] || '').match(/^(DANIELA|JAIR):\s*"(.*)"$/);
      if (!sw) throw new Error(`SWEEPER "${f[0]}": expected VOICE: "text", got ${f[1]}`);
      items.push({
        ...base, type: 'sweeper', id: f[0], voice: sw[1], text: sw[2], desc: f[2] || '',
        seconds: (f[2] || '').match(SECONDS_RE)?.[1] * 1 || 4,
        fadeOut: /fade out/i.test(f[2] || ''),
      });
    }
  }
  return items;
}

// "same style as bed-a, slightly darker" -> the referenced description + variation.
function resolveRefs(items) {
  const reg = { bed: new Map(), jingle: new Map(), stinger: new Map(), sweeper: new Map() };
  const first = {};
  for (const it of items) {
    if (!reg[it.type]) continue;
    if (it.type === 'bed' && it.id === 'off') continue;
    const reference = (m) => {
      const ref = m[1] || first[it.type];
      const baseDesc = reg[it.type].get(ref);
      if (!baseDesc) throw new Error(`${it.type} "${it.id}": cannot resolve reference "${ref}"`);
      return { ref, desc: m[2] ? `${baseDesc}. Variation: ${m[2]}` : baseDesc };
    };
    if (it.type === 'sweeper') {
      const m = it.desc.match(/same logo as ([\w-]+)/i);
      if (m) it.musicRef = { type: 'sweeper', id: m[1] };
      else if (/intro jingle/i.test(it.desc)) it.musicRef = { type: 'jingle', id: 'intro' };
      it.prompt = it.desc;
      reg.sweeper.set(it.id, it.desc);
    } else {
      const m = it.desc.match(REF_RE);
      if (m) it.desc = reference(m).desc;
      else if (!it.desc && it.type === 'bed') it.desc = reference({ 1: it.id, 2: '' }).desc;
      reg[it.type].set(it.id, it.desc);
    }
    first[it.type] ??= it.id;
  }
}

export function parseGuion(md) {
  const showAt = md.search(/^## Show\b/m);
  const spotAt = md.search(/^## Spot\b/m);
  if (showAt < 0 || spotAt < 0 || spotAt < showAt) throw new Error('guion needs "## Show" followed by "## Spot"');
  const show = parseBlock(md.slice(showAt, spotAt), false);
  const spot = parseBlock(md.slice(spotAt), true);
  const items = show.flatMap((it) => (it.type === 'spot-marker' ? spot : [it]));
  resolveRefs(items);
  const spotItems = items.filter((i) => i.spot);
  return { items, spot: spotItems };
}

// Consecutive non-phone speech lines form one Text to Dialogue segment. Any other
// item (cue, pause, phone line) ends it. Long segments are split at MAX_SEGMENT_CHARS.
export function buildSegments(items) {
  const out = [];
  let cur = null;
  const flush = () => { cur = null; };
  for (const it of items) {
    if (it.type === 'speech' && !it.phone) {
      const len = it.text.length;
      if (!cur || cur.chars + len > MAX_SEGMENT_CHARS) {
        cur = { type: 'segment', lines: [], chars: 0, phone: false, spot: it.spot };
        out.push(cur);
      }
      cur.lines.push({ voice: it.voice, text: it.text });
      cur.chars += len;
    } else if (it.type === 'speech') {
      flush();
      out.push({ type: 'segment', lines: [{ voice: it.voice, text: it.text }], chars: it.text.length, phone: true, spot: it.spot });
    } else if (it.type === 'heading') {
      continue;
    } else {
      flush();
      out.push(it);
    }
  }
  return out;
}

// --test: sections 1 and 2 up to "Por fin." plus the first stinger.
export function selectTest(items) {
  const idx = items.findIndex((i) => i.type === 'speech' && i.text === '[relieved] Por fin.');
  if (idx < 0) throw new Error('--test: line "[relieved] Por fin." not found');
  const stinger = items.slice(idx).find((i) => i.type === 'stinger');
  return [...items.slice(0, idx + 1), ...(stinger ? [stinger] : [])];
}

// --spot-only: the spot section plus the MontaWeb Radio logo (break-out jingle) as tail.
export function selectSpot(parsed) {
  const logo = parsed.items.find((i) => i.type === 'jingle' && i.id === 'break-out');
  return [...parsed.spot, ...(logo ? [{ ...logo, spot: true }] : [])];
}
