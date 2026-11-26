import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const read = f => readFileSync(path.join(ROOT, f), 'utf8');
const SLUG = 'prefijo-500-llamadas-comerciales';
const art = read(`blog/${SLUG}.html`);
const pod = art.match(/<section class="pod"[\s\S]*?<\/section>/)?.[0] || '';

function expectedLines() {
    const n = read('docs/plans/2026-11-26-podcast-prefijo-500-guion.md').split(/\r?\n/)
        .filter(l => /^(DANIELA|JAIR)( \[PHONE\])?:/.test(l))
        .map(l => l.replace(/^[A-Z]+( \[PHONE\])?:\s*/, '').replace(/\[[^\]]*\]/g, '').trim())
        .filter(t => t && t !== 'Jajaja.');
    return n.length;
}

test('prefijo 500 podcast: card, audio file and assets', () => {
    assert.match(pod, /data-pod="prefijo-500-llamadas-comerciales" data-duration="369"/);
    assert.match(pod, /<audio preload="none" src="\/images\/audio\/prefijo-500-llamadas-comerciales\.mp3\?v=\d{8}[a-z]?"/);
    assert.ok(existsSync(path.join(ROOT, 'images/audio/prefijo-500-llamadas-comerciales.mp3')));
    assert.match(pod, /<h2 class="pod__title" id="pod-title">Escucha la guía en 6 minutos<\/h2>/);
    assert.match(pod, /data-pod-dur>6:09</);
    assert.match(art, /css\/podcast\.css\?v=\d{8}[a-z]?/);
    assert.match(art, /js\/podcast\.js\?v=\d{8}[a-z]?/);
    assert.ok(existsSync(path.join(ROOT, 'css/podcast.css')) && existsSync(path.join(ROOT, 'js/podcast.js')));
    // card sits right after the byline, inside the hero
    assert.ok(art.indexOf('class="byline"') < art.indexOf('class="pod"'));
    assert.ok(art.indexOf('class="pod"') < art.indexOf('class="phone-demo"'));
});

test('prefijo 500 podcast: JSON-LD has the AudioObject', () => {
    const ld = JSON.parse(art.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const a = ld['@graph'].find(n => n['@type'] === 'Article').audio;
    assert.equal(a['@type'], 'AudioObject');
    assert.equal(a.duration, 'PT6M9S');
    assert.equal(a.encodingFormat, 'audio/mpeg');
    assert.equal(a.contentUrl, `https://montaweb.pe/images/audio/${SLUG}.mp3`);
    assert.equal(a.inLanguage, 'es-PE');
});

test('prefijo 500 podcast: transcript matches the script, no tags', () => {
    const t = pod.match(/<div class="pod__transcript">([\s\S]*?)<\/div>/)[1];
    const lines = [...t.matchAll(/<p><b>(Daniela|Jair|Teleoperador):<\/b> (.+?)<\/p>/g)];
    assert.equal(lines.length, expectedLines());
    assert.equal([...t.matchAll(/<p>/g)].length, lines.length);
    assert.ok(!t.includes('['));
    assert.equal(lines.filter(m => m[1] === 'Teleoperador').length, 1);
});

test('prefijo 500 podcast: mini player present', () => {
    assert.match(art, /<div class="pod-mini" data-pod-mini hidden role="region" aria-label="Reproductor de audio">/);
    assert.match(art, /Escuchando: la guía en audio/);
});
