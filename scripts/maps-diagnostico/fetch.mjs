// API + cache + cost. Credentials come from the env file at DFS_ENV and are never printed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '..', '..');
export const PRIVATE = path.join(REPO, 'docs', 'research', 'maps-diagnostico', 'private');
export const BUDGET_USD = 1.0; // hard cap for all of Phase 0
const API = 'https://api.dataforseo.com/v3/';

function credentials() {
  const file = process.env.DFS_ENV || 'C:\\Users\\USER\\Documents\\sellbird-pilot\\.env';
  const vals = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i > 0 && !line.trim().startsWith('#')) {
      vals[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  if (!vals.DATAFORSEO_LOGIN || !vals.DATAFORSEO_PASSWORD) throw new Error('missing API credentials in DFS_ENV file');
  return vals;
}

async function call(method, endpoint, body) {
  const v = credentials();
  const auth = Buffer.from(`${v.DATAFORSEO_LOGIN}:${v.DATAFORSEO_PASSWORD}`).toString('base64');
  const res = await fetch(API + endpoint.replace(/^\//, ''), {
    method,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API HTTP ${res.status} on ${endpoint}`);
  return res.json();
}

export async function balance() {
  const d = await call('GET', 'appendix/user_data');
  return d.tasks[0].result[0].money.balance;
}

const spendFile = () => path.join(PRIVATE, 'raw', '_spend.json');
export function totalSpent() {
  try { return JSON.parse(fs.readFileSync(spendFile(), 'utf8')).total_usd; } catch { return 0; }
}
function addSpend(usd) {
  fs.mkdirSync(path.dirname(spendFile()), { recursive: true });
  fs.writeFileSync(spendFile(), JSON.stringify({ total_usd: Math.round((totalSpent() + usd) * 1e6) / 1e6 }, null, 1));
}

export function cacheDir(key) {
  return path.join(PRIVATE, 'raw', key);
}

/** One grid cell. Reads the cache if present (cost 0); otherwise one paid call. */
export async function fetchCell({ key, point, keyword, depth = 20 }) {
  const file = path.join(cacheDir(key), `${point.row}-${point.col}.json`);
  if (fs.existsSync(file)) {
    const cached = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { items: itemsOf(cached), cost: 0, cached: true };
  }
  if (totalSpent() >= BUDGET_USD) throw new Error(`budget US$${BUDGET_USD} reached, stopping`);
  const body = [{
    keyword, language_code: 'es', location_coordinate: `${point.lat},${point.lng},16z`, depth,
  }];
  const d = await call('POST', 'serp/google/maps/live/advanced', body);
  const task = d.tasks?.[0];
  if (!task || task.status_code !== 20000) throw new Error(`API task failed: ${task?.status_code} ${task?.status_message}`);
  const cost = Number(d.cost) || 0;
  fs.mkdirSync(cacheDir(key), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(d));
  addSpend(cost);
  return { items: itemsOf(d), cost, cached: false };
}

function itemsOf(d) {
  return d.tasks?.[0]?.result?.[0]?.items ?? [];
}
