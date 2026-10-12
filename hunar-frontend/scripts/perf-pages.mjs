#!/usr/bin/env node
// Measures SSR page latency (TTFB / total / HTML size) for key Hunar routes
// against `next start`. Complements scripts/perf-baseline.mjs (API latency).
//
// Usage:
//   node scripts/perf-pages.mjs [--base URL] [--runs N] [--warmup N]
//                               [--out PATH_PREFIX] [--label NAME]
//
// Output: <out>.json and <out>.md. Never writes tokens or credentials.

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def;
};

const BASE = opt('base', 'http://localhost:3001').replace(/\/$/, '');
const RUNS = Number(opt('runs', '10'));
const WARMUP = Number(opt('warmup', 2));
const OUT_PREFIX = resolve(opt('out', '../docs/performance/baseline-pages'));
const TIMEOUT_MS = Number(opt('timeout', '30000'));
const LABEL = opt('label', '');

const ROUTES = [
  { path: '/en', role: 'public' },
  { path: '/en/customer/login', role: 'public' },
  { path: '/en/customer/dashboard', role: 'customer (client-auth)' },
  { path: '/en/customer/jobs', role: 'customer (client-auth)' },
  { path: '/en/worker/dashboard', role: 'worker (client-auth)' },
  { path: '/en/worker/jobs', role: 'worker (client-auth)' },
  { path: '/en/admin/dashboard', role: 'admin (client-auth since perf-sprint chunk 7)' },
];

const round = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null);

const percentile = (sorted, p) => {
  if (sorted.length === 0) return null;
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
};

const stats = (values) => {
  const sorted = values.filter((v) => v != null && Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  return {
    min: round(sorted[0]),
    max: round(sorted[sorted.length - 1]),
    mean: round(sorted.reduce((s, v) => s + v, 0) / sorted.length),
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
  };
};

async function fetchRoute(path) {
  const started = performance.now();
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'accept-encoding': 'gzip' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: 'manual',
  });
  const body = await res.arrayBuffer();
  const totalMs = performance.now() - started;
  const ttfbHeader = res.headers.get('x-response-time');
  return {
    status: res.status,
    totalMs,
    bytes: body.byteLength,
    serverMs: ttfbHeader ? Number.parseFloat(ttfbHeader) : null,
    contentType: res.headers.get('content-type') ?? '',
  };
}

async function main() {
  console.log(`perf-pages: base=${BASE} runs=${RUNS} warmup=${WARMUP}`);
  const results = [];

  for (const route of ROUTES) {
    let failure = null;
    for (let w = 0; w < WARMUP; w++) {
      try {
        const r = await fetchRoute(route.path);
        if (r.status >= 400) failure = `HTTP ${r.status}`;
      } catch (err) {
        failure = `${err.name}: ${err.message}`;
      }
      if (failure) break;
    }
    if (failure) {
      console.log(`${route.path}: SKIPPED (${failure})`);
      results.push({ ...route, ok: false, error: failure, samples: [] });
      continue;
    }

    const samples = [];
    for (let i = 0; i < RUNS; i++) {
      try {
        samples.push(await fetchRoute(route.path));
      } catch (err) {
        samples.push({ status: 0, totalMs: null, bytes: 0, error: `${err.name}: ${err.message}` });
      }
    }
    const ok = samples.filter((s) => s.status >= 200 && s.status < 400);
    results.push({
      ...route,
      ok: ok.length > 0,
      successCount: ok.length,
      ttfb: stats(ok.map((s) => s.totalMs)),
      bytes: stats(ok.map((s) => s.bytes)),
      samples,
    });
    console.log(`${route.path}: p50=${results.at(-1).ttfb?.p50}ms p95=${results.at(-1).ttfb?.p95}ms bytes=${results.at(-1).bytes?.p50} ok=${ok.length}/${samples.length}`);
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
  lines.push(`# Frontend page-load baseline${json.label && json.label !== 'baseline' ? ` — ${json.label}` : ''}`);
  lines.push('');
  lines.push(`- Date: ${json.timestamp}`);
  lines.push(`- Commit: \`${json.gitCommit}\``);
  lines.push(`- Frontend: \`${json.base}\` (next start, production build)`);
  lines.push(`- Runs: ${json.runs} after ${json.warmup} warmup (sequential, gzip)`);
  lines.push('- p50/p95 are full-response wall time (SSR pages are static shells unless noted; client data fetch happens after hydration)');
  lines.push('');
  lines.push('| Route | Auth model | status | p50 | p95 | p99 | HTML bytes (p50) | ok |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const r of json.results) {
    if (!r.ok) {
      lines.push(`| \`${r.path}\` | ${r.role} | - | - | - | - | - | ERROR: ${r.error} |`);
      continue;
    }
    const status = r.samples[0]?.status ?? '-';
    lines.push(
      `| \`${r.path}\` | ${r.role} | ${status} | ${r.ttfb.p50} | ${r.ttfb.p95} | ${r.ttfb.p99} | ` +
        `${r.bytes.p50} | ${r.successCount}/${r.samples.length} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
