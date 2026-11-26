import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const read = f => readFileSync(path.join(ROOT, f), 'utf8');
const hasPhp = spawnSync('php', ['-v']).status === 0;
const skipPhp = hasPhp ? false : 'php CLI not installed here; run `php test/php/receptionist-init.test.php`';

test('PHP logic passes its CLI test', { skip: skipPhp }, () => {
    const r = spawnSync('php', [path.join(ROOT, 'test/php/receptionist-init.test.php')], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^ok - /m);
    assert.doesNotMatch(r.stdout, /^not ok/m);
});

const freePort = () => new Promise(resolve => {
    const s = createServer().listen(0, '127.0.0.1', () => {
        const { port } = s.address();
        s.close(() => resolve(port));
    });
});

// Runs a copy of the endpoint with a throwaway config, so a real api/config.php is never read.
test('served over HTTP the endpoint runs, authenticates and is not cacheable', { skip: skipPhp }, async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'mw-rcp-init-'));
    let server;
    try {
        for (const f of ['receptionist-init.php', 'receptionist-lead.php']) {
            copyFileSync(path.join(ROOT, 'api', f), path.join(dir, f));
        }
        writeFileSync(path.join(dir, 'config.php'),
            "<?php return ['elevenlabs_init_secret' => 'test-secret-not-real', 'receptionist_transfer_number' => '+00000000000'];\n");
        const port = await freePort();
        server = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', dir], { stdio: 'ignore' });
        const url = `http://127.0.0.1:${port}/receptionist-init.php`;
        const call = async init => {
            for (let i = 0; ; i++) {
                try {
                    return await fetch(url, init);
                } catch (e) {
                    if (i >= 50) throw e;
                    await new Promise(r => setTimeout(r, 100));
                }
            }
        };

        const ok = await call({ method: 'POST', headers: { 'X-Init-Secret': 'test-secret-not-real' }, body: '{"caller_id":"x"}' });
        assert.equal(ok.status, 200);
        assert.match(ok.headers.get('cache-control'), /no-store/);
        assert.match(ok.headers.get('content-type'), /application\/json/);
        const data = await ok.json();
        assert.equal(data.type, 'conversation_initiation_client_data');
        // the real clock is used here, so only the pairing of the two values is fixed
        const { advisors_open: open, transfer_number: number } = data.dynamic_variables;
        assert.ok((open === 'si' && number === '+00000000000') || (open === 'no' && number === 'closed'), JSON.stringify(data));

        const denied = await call({ method: 'POST' });
        assert.equal(denied.status, 401);
        assert.match(denied.headers.get('cache-control'), /no-store/);
        assert.equal(await denied.text(), '{"ok":false}');

        assert.equal((await call({ method: 'GET' })).status, 405);
    } finally {
        server?.kill();
        rmSync(dir, { recursive: true, force: true });
    }
});

test('endpoint never reads, stores or logs the request body', () => {
    const src = read('api/receptionist-init.php');
    assert.doesNotMatch(src, /php:\/\/input|\$_POST|\$_REQUEST|\$_GET|mw_rcp_read_body|file_put_contents|fopen|fwrite/);
    for (const l of src.match(/error_log\([^;]*;/g) ?? []) assert.doesNotMatch(l, /\$/, l);
});

test('secret is compared in constant time; no secret or phone number in the repo files', () => {
    const src = read('api/receptionist-init.php');
    assert.match(src, /hash_equals/);
    assert.match(src, /HTTP_X_INIT_SECRET/);
    assert.doesNotMatch(src, /\+?51[\s-]?9\d{2}[\s-]?\d{3}[\s-]?\d{3}|\b9\d{8}\b/);
    const example = read('api/config.example.php');
    assert.match(example, /'elevenlabs_init_secret' => '',/);
    assert.match(example, /'receptionist_transfer_number' => '',/);
});

test('setup note names the second webhook URL, header, config keys and placeholders', () => {
    const n = read('docs/plans/ai-receptionist/webhook-setup.md');
    for (const s of ['https://montaweb.pe/api/receptionist-init.php', 'X-Init-Secret', 'elevenlabs_init_secret',
        'receptionist_transfer_number', 'advisors_open', 'transfer_number']) {
        assert.ok(n.includes(s), s);
    }
});
