import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const read = f => readFileSync(path.join(ROOT, f), 'utf8');
const endpoint = read('api/receptionist-lead.php');
const hasPhp = spawnSync('php', ['-v']).status === 0;

test('PHP logic passes its CLI test', {
    skip: hasPhp ? false : 'php CLI not installed here; run `php test/php/receptionist-lead.test.php`',
}, () => {
    const r = spawnSync('php', [path.join(ROOT, 'test/php/receptionist-lead.test.php')], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.doesNotMatch(r.stdout, /^not ok/m);
});

test('the PHP test file covers the key cases', () => {
    const t = read('test/php/receptionist-lead.test.php');
    for (const needle of ['401', '413', '503', 'duplicate', 'minimisation', 'path-traversal']) assert.ok(t.includes(needle), needle);
});

test('signature scheme matches ElevenLabs: HMAC-SHA256 over "t.body", header t=,v0=', () => {
    assert.match(endpoint, /hash_hmac\('sha256', \$time \. '\.' \. \$body, \$secret\)/);
    assert.match(endpoint, /hash_equals/);
    assert.match(endpoint, /HTTP_ELEVENLABS_SIGNATURE/);
});

test('no secret is hardcoded; it comes from config or env', () => {
    assert.match(endpoint, /ELEVENLABS_WEBHOOK_SECRET/);
    assert.match(endpoint, /elevenlabs_webhook_secret/);
    assert.doesNotMatch(endpoint, /secret['"]?\s*=\s*'[^']{8,}'/i);
    assert.match(read('api/config.example.php'), /elevenlabs_webhook_secret/);
    assert.match(read('api/config.example.php'), /PON_AQUI/);
});

test('stored leads are not public: Caddy 404, Apache deny, gitignored', () => {
    assert.match(endpoint, /const MW_RCP_DIR = __DIR__ \. '\/leads'/);
    assert.match(read('deploy/Caddyfile'), /@private path [^\n]*\/api\/leads\/\*[^\n]*\n\s*respond @private 404/);
    assert.match(read('api/leads/.htaccess'), /Require all denied/);
    const gi = read('.gitignore');
    assert.match(gi, /^api\/leads\/\*$/m);
    assert.match(gi, /^api\/leads\/rcp-\*\.json$/m);
});

test('endpoint does not log personal data or echo internals', () => {
    for (const l of endpoint.match(/error_log\([^;]*;/g) ?? []) {
        assert.doesNotMatch(l, /nombre|telefono|resumen|negocio|getMessage/, l);
    }
    assert.doesNotMatch(endpoint, /echo[^;]*getMessage/);
});

test('90-day purge covers receptionist leads', () => {
    const r = read('api/retener-leads.php');
    assert.match(r, /rcp-\*\.json/);
    assert.match(r, /-90 days/);
});

test('setup note for the founder names the URL, secret key and event', () => {
    const f = 'docs/plans/ai-receptionist/webhook-setup.md';
    assert.ok(existsSync(path.join(ROOT, f)));
    const n = read(f);
    for (const s of ['https://montaweb.pe/api/receptionist-lead.php', 'elevenlabs_webhook_secret', 'post_call_transcription']) {
        assert.ok(n.includes(s), s);
    }
});
