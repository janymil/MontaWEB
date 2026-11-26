import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('deploy.sh has valid bash syntax', () => {
  const r = spawnSync('bash', ['-n', 'scripts/deploy.sh'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});

test('deploy.sh help prints usage', () => {
  const r = spawnSync('bash', ['scripts/deploy.sh', 'help'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Usage: scripts\/deploy\.sh/);
});
