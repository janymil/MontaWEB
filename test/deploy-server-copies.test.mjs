import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

// End to end against throwaway repos: "ssh" runs the command locally, "curl" always answers 200.
function setup(t) {
  const root = mkdtempSync(join(tmpdir(), 'mw-deploy-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sh = (script, dir = '.') => {
    const r = spawnSync('bash', ['-c', script], { cwd: join(root, dir), encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r.stdout.trim();
  };
  const put = (file, text) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  };
  for (const [name, body] of [['ssh', 'shift 5\nexec bash -c "$*"\n'], ['curl', 'printf 200\n']]) {
    put(`bin/${name}`, `#!/usr/bin/env bash\n${body}`);
    chmodSync(join(root, 'bin', name), 0o755);
  }
  const cfg = 'git config user.name t; git config user.email t@example.test; git config core.autocrlf false';
  sh('git init -q --bare -b main origin.git; git clone -q origin.git local 2>/dev/null');
  put('local/index.html', 'v1\n');
  mkdirSync(join(root, 'local/scripts'));
  copyFileSync('scripts/deploy.sh', join(root, 'local/scripts/deploy.sh'));
  sh(`${cfg}; git add -A; git commit -qm one; git push -q origin main`, 'local');
  sh('git clone -q -c core.autocrlf=false origin.git server');
  sh(cfg, 'server');
  put('local/index.html', 'v2\n');
  put('local/demo/página uno.html', 'demo\n');
  sh('git add index.html demo; git commit -qm two', 'local');

  const deploy = () => spawnSync('bash', ['-c',
    'export PATH="$PWD/../bin:$PATH" DEPLOY_PATH="$(cd ../server && pwd)" DEPLOY_LOG="$(cd .. && pwd)/server.log" DEPLOY_LOCK="$(cd .. && pwd)/server.lock"; bash scripts/deploy.sh deploy --yes'],
  { cwd: join(root, 'local'), encoding: 'utf8' });
  const read = (file) => readFileSync(join(root, file), 'utf8');
  const backups = () => readdirSync(root).filter((n) => n.startsWith('server-backup-'));
  return { root, sh, put, deploy, read, backups };
}

test('identical server copies are backed up and the deploy finishes, verifies and logs', (t) => {
  const { sh, put, deploy, read, backups } = setup(t);
  put('server/index.html', 'v2\n'); // tracked, modified
  put('server/demo/página uno.html', 'demo\n'); // untracked
  put('server/unrelated.txt', 'keep\n');
  const r = deploy();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(sh('git rev-parse HEAD', 'server'), sh('git rev-parse HEAD', 'local'));
  assert.equal(sh('git status --porcelain', 'server'), '?? unrelated.txt');
  assert.equal(backups().length, 1);
  assert.equal(read(`${backups()[0]}/demo/página uno.html`), 'demo\n');
  assert.equal(read(`${backups()[0]}/index.html`), 'v2\n');
  assert.match(r.stdout, /Verification/);
  assert.match(read('server.log'), /verify=ok/);
});

test('a differing server copy stops the deploy before anything is pushed or changed', (t) => {
  const { root, sh, put, deploy, read, backups } = setup(t);
  put('server/index.html', 'v2\n');
  put('server/demo/página uno.html', 'edited on server\n');
  const before = sh('git rev-parse main', 'origin.git');
  const r = deploy();
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /DIFF demo\/página uno\.html/);
  assert.equal(sh('git rev-parse main', 'origin.git'), before);
  assert.equal(read('server/index.html'), 'v2\n');
  assert.equal(read('server/demo/página uno.html'), 'edited on server\n');
  assert.equal(backups().length, 0);
  assert.equal(existsSync(join(root, 'server.log')), false);
});

test('a staged server change that differs from the incoming file stops the deploy', (t) => {
  const { sh, put, deploy, read } = setup(t);
  put('server/index.html', 'staged on server\n');
  sh('git add index.html', 'server');
  put('server/index.html', 'v2\n');
  const r = deploy();
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /DIFF index\.html/);
  assert.equal(sh('git show :index.html', 'server'), 'staged on server');
  assert.equal(read('server/index.html'), 'v2\n');
});

test('server copies are restored when the server update fails', (t) => {
  const { sh, put, deploy, read } = setup(t);
  put('server/index.html', 'v2\n');
  put('server/other.txt', 'server only\n');
  sh('git add other.txt; git commit -qm diverged', 'server');
  const r = deploy();
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.equal(read('server/index.html'), 'v2\n');
});
