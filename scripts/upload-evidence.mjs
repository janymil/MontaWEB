// Upload a sealed evidence folder to the R2 legal-evidence bucket (port of MiCita's
// scripts/upload-evidence.ts). Runs on Washington, where the credentials live:
//   cd /var/backups/montaweb/tools && set -a && . /etc/micita/legal-evidence.env && set +a &&
//   node upload-evidence.mjs <dir> montaweb/comparar/<YYYY-MM-DD>
// (tools/ holds a copy of this file, lib/evidence.mjs and a node_modules symlink to
// /var/www/micita/node_modules for @aws-sdk/client-s3.)
// Existing keys are never overwritten (a changed file needs a new date folder) and
// every object is read back and its SHA-256 compared.
import { resolve } from 'node:path';
import { PREFIX_RE, uploadFolder } from './lib/evidence.mjs';

const [dir, prefix] = process.argv.slice(2);
if (!dir || !prefix || !PREFIX_RE.test(prefix)) {
  console.error('usage: upload-evidence.mjs <dir> montaweb/comparar/<YYYY-MM-DD[-suffix]>');
  process.exit(2);
}
const env = name => {
  const v = process.env[name];
  if (!v) throw new Error(`missing ${name} (source /etc/micita/legal-evidence.env)`);
  return v;
};
const { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } = await import('@aws-sdk/client-s3');
const s3 = new S3Client({
  region: 'auto',
  endpoint: env('R2_EVIDENCE_ENDPOINT'),
  credentials: { accessKeyId: env('R2_EVIDENCE_ACCESS_KEY_ID'), secretAccessKey: env('R2_EVIDENCE_SECRET_ACCESS_KEY') },
});
const Bucket = env('R2_EVIDENCE_BUCKET');

const store = {
  // Only "not found" means free to write; any other error (permissions) stops the run.
  head: Key => s3.send(new HeadObjectCommand({ Bucket, Key })).then(() => true, e => {
    if (e.$metadata?.httpStatusCode === 404) return false;
    throw e;
  }),
  // IfNoneMatch: R2 refuses the write if the key appeared in the meantime.
  put: (Key, Body, hash) => s3.send(new PutObjectCommand({ Bucket, Key, Body, IfNoneMatch: '*', Metadata: { sha256: hash } })),
  get: async Key => Buffer.from(await (await s3.send(new GetObjectCommand({ Bucket, Key }))).Body.transformToByteArray()),
};

const { uploaded, skipped, objects } = await uploadFolder(resolve(dir), prefix, store);
console.log(`${uploaded} uploaded, ${skipped} already there, ${objects.length} read back with matching SHA-256: r2://${Bucket}/${prefix}/`);
