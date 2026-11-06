#!/usr/bin/env node
// Measures API latency (client wall time, server time, DB queries) for the
// Hunar backend. Each run sends a unique x-request-id; after the run the
// PerformanceInterceptor log lines are joined on that id to extract db= metrics.
//
// Usage:
//   node scripts/perf-baseline.mjs [--base URL] [--log PATH] [--runs N]
//                                  [--warmup N] [--out PATH_PREFIX] [--timeout MS]
//                                  [--label NAME]
//
// Output: <out>.json (raw samples + stats) and <out>.md (summary table).
// Never writes credentials, tokens, or request bodies to output files.

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { randomUUID } from 'node:crypto';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def;
};

const BASE = opt('base', 'http://localhost:4000/api/v1').replace(/\/$/, '');
const LOG_PATH = opt('log', '/tmp/opencode/backend.log');
const RUNS = Number(opt('runs', '15'));
const WARMUP = Number(opt('warmup', '3'));
const OUT_PREFIX = resolve(opt('out', '../docs/performance/baseline-api'));
const TIMEOUT_MS = Number(opt('timeout', '30000'));
const LABEL = opt('label', '');

// Seed credentials — fixed by the sprint brief, never rotated.
const CREDENTIALS = {
  worker: { phone: '03120000001', password: 'worker123' },
  customer: { phone: '03120000002', password: 'customer123' },
  admin: { email: 'admin@hunar.pk', password: 'admin123' },
};

const ROLE_LOGIN = {
  worker: { path: '/auth/login', body: CREDENTIALS.worker },
  customer: { path: '/auth/customer/login', body: CREDENTIALS.customer },
  admin: { path: '/auth/admin/login', body: CREDENTIALS.admin },
};

const ROLE_ORDER = ['customer', 'worker', 'admin'];

const round = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null);

const percentile = (sorted, p) => {
  if (sorted.length === 0) return null;
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
};

const stats = (values) => {
  const sorted = [...values].filter((v) => v != null && Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mean = sorted.reduce((s, v) => s + v, 0) / sorted.length;
  return {
    min: round(sorted[0]),
    max: round(sorted[sorted.length - 1]),
    mean: round(mean),
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
  };
};

async function request(method, path, { token, body, requestId } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body) headers['content-type'] = 'application/json';
  if (requestId) headers['x-request-id'] = requestId;

  const started = performance.now();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  await res.arrayBuffer();
  const clientMs = performance.now() - started;
  const serverHeader = res.headers.get('x-response-time');
  const serverMs = serverHeader ? Number.parseFloat(serverHeader) : null;
  return { status: res.status, clientMs, serverMs: Number.isFinite(serverMs) ? serverMs : null };
}

async function login(role) {
  const { path, body } = ROLE_LOGIN[role];
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = await res.json();
  if (!res.ok || !json?.data?.accessToken) {
    throw new Error(`login failed for role ${role}: HTTP ${res.status}`);
  }
  return json.data.accessToken;
}

// Parses PerformanceInterceptor lines: "METHOD path status Xms db=Nq/Mms req=ID".
function parseServerLog() {
  if (!existsSync(LOG_PATH)) return new Map();
  const raw = readFileSync(LOG_PATH, 'utf8');
  const ansi = /\x1b\[[0-9;]*m/g;
  const lineRe = /(\S+) (\/\S*) (\d+) ([\d.]+)ms db=(\d+)q\/([\d.]+)ms req=(\S+)/;
  const byId = new Map();
  for (const line of raw.split('\n')) {
    const m = lineRe.exec(line.replace(ansi, ''));
    if (m) byId.set(m[7], { status: Number(m[3]), durationMs: Number(m[4]), dbQueries: Number(m[5]), dbMs: Number(m[6]) });
  }
  return byId;
}

async function main() {
  const endpoints = [
    { name: 'GET /health', method: 'GET', path: '/health', auth: null },
    // Login runs are capped at 4: the backend's in-process limiter allows
    // 5 attempts / 5 min per account and the startup logins consume one.
    // Restart the backend (or wait 5 min) between harness invocations.
    { name: 'POST /auth/login (worker)', method: 'POST', path: '/auth/login', auth: null, body: CREDENTIALS.worker, warmup: 0, runs: 4 },
    { name: 'POST /auth/customer/login', method: 'POST', path: '/auth/customer/login', auth: null, body: CREDENTIALS.customer, warmup: 0, runs: 4 },
    { name: 'POST /auth/admin/login', method: 'POST', path: '/auth/admin/login', auth: null, body: CREDENTIALS.admin, warmup: 0, runs: 4 },
    { name: 'GET /jobs/customer?limit=50', method: 'GET', path: '/jobs/customer?limit=50', auth: 'customer' },
    { name: 'GET /jobs/available', method: 'GET', path: '/jobs/available?lat=33.6844&lng=73.0479&radiusKm=10', auth: 'worker' },
    { name: 'GET /jobs/:id', method: 'GET', path: null, auth: 'customer' },
    { name: 'GET /offers/my', method: 'GET', path: '/offers/my', auth: 'worker' },
    { name: 'GET /wallet/balance', method: 'GET', path: '/wallet/balance', auth: 'worker' },
    { name: 'GET /earnings/summary', method: 'GET', path: '/earnings/summary', auth: 'worker' },
    { name: 'GET /admin/kpis', method: 'GET', path: '/admin/kpis', auth: 'admin' },
    { name: 'GET /notifications/unread-count', method: 'GET', path: '/notifications/unread-count', auth: 'customer' },
    { name: 'GET /chat/conversations', method: 'GET', path: '/chat/conversations', auth: 'customer' },
    { name: 'GET /visits/my', method: 'GET', path: '/visits/my', auth: 'customer' },
  ];

  console.log(`perf-baseline: base=${BASE} runs=${RUNS} warmup=${WARMUP} log=${LOG_PATH}`);

  const tokens = {};
  for (const role of ROLE_ORDER) {
    try {
      tokens[role] = await login(role);
      console.log(`logged in as ${role}`);
    } catch (err) {
      console.error(`${err.message} — the backend keeps rate-limit counters in memory; restart it (or wait 5 minutes) and re-run.`);
      process.exit(1);
    }
  }

  // Resolve a real job id for GET /jobs/:id (customer-owned).
  const jobListRes = await fetch(`${BASE}/jobs/customer?limit=1`, {
    headers: { authorization: `Bearer ${tokens.customer}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const jobListJson = await jobListRes.json();
  const jobItems = Array.isArray(jobListJson?.data) ? jobListJson.data : (jobListJson?.data?.items ?? []);
  const jobEp = endpoints.find((e) => e.name === 'GET /jobs/:id');
  if (jobItems[0]?.id) {
    jobEp.path = `/jobs/${jobItems[0].id}`;
  } else {
    endpoints.splice(endpoints.indexOf(jobEp), 1);
    console.log('skipping GET /jobs/:id (customer has no jobs)');
  }

  const results = [];
  for (let ei = 0; ei < endpoints.length; ei++) {
    const ep = endpoints[ei];
    let role = ep.auth;
    const tok = () => (role ? tokens[role] : undefined);
    const send = (requestId) => request(ep.method, ep.path, { token: tok(), body: ep.body, requestId });

    let failure = null;
    const warmups = ep.warmup ?? WARMUP;
    for (let w = 0; w < warmups; w++) {
      try {
        const r = await send();
        if (r.status === 401 || r.status === 403) {
          const alt = ROLE_ORDER.find((r2) => r2 !== role);
          const altRes = await request(ep.method, ep.path, { token: tokens[alt], body: ep.body });
          if (altRes.status < 400) {
            role = alt;
            console.log(`  ${ep.name}: switched role ${ep.auth} -> ${role}`);
          } else {
            failure = `HTTP ${r.status} (fallback ${role}->${alt} also ${altRes.status})`;
          }
        } else if (r.status >= 400) {
          failure = `HTTP ${r.status}`;
        }
      } catch (err) {
        failure = `${err.name}: ${err.message}`;
      }
      if (failure) break;
    }

    if (failure) {
      console.log(`[${ei + 1}/${endpoints.length}] ${ep.name}: SKIPPED (${failure})`);
      results.push({ name: ep.name, auth: role, ok: false, error: failure, samples: [] });
      continue;
    }

    const samples = [];
    const runs = ep.runs ?? RUNS;
    for (let i = 0; i < runs; i++) {
      const requestId = randomUUID();
      try {
        const r = await send(requestId);
        samples.push({ ...r, id: requestId });
      } catch (err) {
        samples.push({ status: 0, clientMs: null, serverMs: null, id: requestId, error: `${err.name}: ${err.message}` });
      }
    }

    const ok = samples.filter((s) => s.status >= 200 && s.status < 300);
    const client = stats(ok.map((s) => s.clientMs));
    const server = stats(ok.map((s) => s.serverMs));
    results.push({
      name: ep.name,
      path: ep.path,
      method: ep.method,
      auth: role,
      ok: ok.length > 0,
      successCount: ok.length,
      errorCount: samples.length - ok.length,
      client,
      server,
      samples,
    });
    console.log(
      `[${ei + 1}/${endpoints.length}] ${ep.name}: p50=${client?.p50}ms p95=${client?.p95}ms ` +
        `serverP50=${server?.p50}ms ok=${ok.length}/${samples.length}`,
    );
  }

  // Join DB metrics from the interceptor log via each sample's request id.
  const logById = parseServerLog();
  const missing = [];
  for (const row of results) {
    if (!row.ok) continue;
    const joined = row.samples.map((s) => logById.get(s.id)).filter(Boolean);
    if (joined.length === 0) {
      missing.push(row.name);
      continue;
    }
    row.db = {
      queries: stats(joined.map((j) => j.dbQueries)),
      ms: stats(joined.map((j) => j.dbMs)),
      logServer: stats(joined.map((j) => j.durationMs)),
      joinedCount: joined.length,
    };
  }
  if (missing.length) {
    console.warn(`warning: no log lines for ${missing.join(', ')} (backend started without PERF_LOG_ALL / PERF_DB_METRICS=1?)`);
  }

  const json = {
    label: LABEL || 'baseline',
    timestamp: new Date().toISOString(),
    gitCommit: gitCommit(),
    base: BASE,
    runs: RUNS,
    warmup: WARMUP,
    results,
  };

  mkdirSync(dirname(OUT_PREFIX), { recursive: true });
  writeFileSync(`${OUT_PREFIX}.json`, JSON.stringify(json, null, 2));
  writeFileSync(`${OUT_PREFIX}.md`, renderMarkdown(json));
  console.log(`\nwrote ${OUT_PREFIX}.json and ${OUT_PREFIX}.md`);
  console.log(renderMarkdown(json));
}

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: dirname(fileURLToPath(import.meta.url)), encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function renderMarkdown(json) {
  const lines = [];
  lines.push(`# API performance baseline${json.label && json.label !== 'baseline' ? ` — ${json.label}` : ''}`);
  lines.push('');
  lines.push(`- Date: ${json.timestamp}`);
  lines.push(`- Commit: \`${json.gitCommit}\``);
  lines.push(`- Backend: \`${json.base}\` (production build)`);
  lines.push(`- Runs: ${json.runs} measured after ${json.warmup} warmup (sequential, HTTP keep-alive)`);
  lines.push('- DB: Neon Postgres (us-east-2), measured RTT ~281ms from this machine');
  lines.push('- client = end-to-end wall time; server = x-response-time; db = Prisma $use middleware');
  lines.push('- Login: 4 runs, no warmup (backend rate-limits logins to 5/5min in-process; startup auth consumes 1)');
  lines.push('');
  lines.push('| Endpoint | Role | client p50 | client p95 | client p99 | server p50 | db queries (mean) | db ms (mean) | ok |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const r of json.results) {
    if (!r.ok) {
      lines.push(`| \`${r.name}\` | ${r.auth ?? '-'} | - | - | - | - | - | - | ERROR: ${r.error} |`);
      continue;
    }
    lines.push(
      `| \`${r.name}\` | ${r.auth ?? '-'} | ${r.client.p50} | ${r.client.p95} | ${r.client.p99} | ` +
        `${r.server?.p50 ?? '-'} | ${r.db?.queries?.mean ?? '-'} | ${r.db?.ms?.mean ?? '-'} | ` +
        `${r.successCount}/${r.samples.length} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
