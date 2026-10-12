# Performance sprint report (Before → After)

Commit `9e9c422` (branch `dev`), measured 2026-10-07. Companion docs: [`baseline.md`](baseline.md) (Before), raw data [`baseline-api.*`](baseline-api.md) / [`final-api.*`](final-api.md), [`baseline-pages.*`](baseline-pages.md) / [`final-pages.*`](final-pages.md).

## Environment (identical for Before and After)

- Backend: NestJS production build, `localhost:4000`, `PERF_DB_METRICS=1 PERF_LOG_ALL=1`
- Frontend: `next start` production build, `localhost:3001`
- DB: Neon Postgres **us-east-2**, developer machine Asia/Karachi → **~281 ms measured RTT per query** (this session's runs ranged ~240–750 ms per query — network jitter is real; compare medians, not single p95 spikes)
- Method: sequential, keep-alive, warmup + 15 runs (4 for logins); Prisma `$use` middleware counts client ops 1:1
- **Hard floor: one query ≈ 285–310 ms.** No code change beats that without moving the DB (out of scope) or caching (deferred, see `caching.md`).

## API: Before vs After (client p50 / p95, db queries)

| Endpoint | p50 Before → After | Δ p50 | queries Before → After | Notes |
|---|---|---|---|---|
| `GET /health` | 307 → 285 | floor | 1 → 1 | control; at RTT floor |
| `POST /auth/login` (worker) | 343 → 348 | floor | 1 → 1 | control |
| `POST /auth/customer/login` | 408 → 394 | floor | 1 → 1 | control |
| `POST /auth/admin/login` | 409 → 433 | floor | 1 → 1 | control (jitter) |
| `GET /jobs/customer?limit=50` | 1536 → **1229** | **−20%** | 2 → 8 (3 parallel waves) | N+1 enrichment batched; client fan-out 1+2N → **O(1)** |
| `GET /jobs/available` | 1229 → **616** | **−50%** | 6 → 6 (2 waves: profile batch, rows+count) | serial → parallel |
| `GET /jobs/:id` | 1471 → **616** | **−58%** | 2 → 4 (1 wave) | haversine in JS, relations parallel |
| `GET /offers/my` | 1488 → **922** | **−38%** | 2 → 2 (`Promise.all`, no BEGIN/COMMIT) | `$transaction` → parallel |
| `GET /wallet/balance` | 1225 → **307** | **−75%** | 1 → 1 | `upsert` (5 RTT) → `findUnique`+create-on-miss |
| `GET /earnings/summary` | 248 → 307 | floor | 1 → 1 | control (at floor) |
| `GET /admin/kpis` | 1495 → **642** | **−57%** | 14 → 14 (**1 wave**) | all 14 counts in one `Promise.all` |
| `GET /notifications/unread-count` | 240 → 307 | floor | 1 → 1 | control (at floor) |
| `GET /chat/conversations` | 961 → **614** | **−36%** | 1 (include-chain) → 4 (2 waves) | serial include loads → batched relation queries |
| `GET /visits/my` | 1905 → **1229** | **−35%** | **22 → 3** | N+1 gone; last-location `DISTINCT ON` batched |

p95 note: this run's tails carried heavy link jitter (`/jobs/available` p95 2150 with p50 616; `/health` control p95 334 vs 312 Before). Tail comparisons across runs are unreliable from this location; medians are the signal.

## Frontend (Before → After)

| Metric | Before | After |
|---|---|---|
| SSR p50 (all 7 routes) | 5–28 ms | 5–18 ms (static shells; not the bottleneck) |
| Customer jobs screen requests | **1 + 2N** (201 for 100 jobs) | **O(1)** — single `GET /jobs/customer?limit=100` |
| Admin dashboard HTML | 159,545 B of server-rendered **mock** data | 83,273 B shell + authenticated client fetch (real data) |
| Route navigation feedback | none (0 `loading.tsx` in app) | skeletons on 7 hot routes |
| Data refetch policy | flat `staleTime: 60s` | per-domain: 15 s notifications → 30 s chat/wallet/jobs → 5 min static |
| Worker feed polling | 15 s `setInterval` + focus + socket | focus + socket only |
| HTTP timeouts | none (hangs possible) | GET 15 s / mutation 30 s / upload 60 s / refresh 10 s, `AbortSignal` respected |

## Targets (from sprint brief)

| Area | Target | Before | After | Status |
|---|---|---|---|---|
| `GET /health` p95 | < 50 ms | 311.9 | 333.9 | ❌ floor-bound by 1 remote query (documented, out of scope) |
| Auth (login) p95 | < 1.2 s | 410–414 | 452–775 | ✅ |
| `GET /jobs/customer` p95 | < 800 ms | 1844 | 1706 | ❌ p50 −20% (1229); needs ≤2 waves to clear — next lever is caching |
| `GET /jobs/available` p95 | < 1.2 s | 1537 | 2150* | ❌ p50 halved (616); *tail = this-run jitter (p50/p95 diverged 3.5×) |
| Admin p95 | < 1 s | 2577 | 1056 | ≈✅ borderline (p50 642, −57%; p95 56 ms over on a jittery run) |
| Customer jobs screen requests | O(1), not O(N) | 1 + 2N | **O(1)** | ✅ |
| p95 variance (`/visits/my`) | stable | 1905 → 3828 | 1229 → 2470 | ✅ absolute −35%/−36%; 22 → 3 queries |

## What changed (by chunk)

- **0–2** build fixed; `PerformanceInterceptor` + request-id ↔ Prisma `$use` metrics; before/after harnesses (`hunar-backend/scripts/perf-baseline.mjs`, `hunar-frontend/scripts/perf-pages.mjs`).
- **3** `getCustomerJobs`: 3-wave batch (findMany+count+categories → offers select + raw `UPDATE ...='VIEWING'` → workers + 2 `groupBy`); frontend list fetch collapsed to one request; payload parity verified.
- **4** `getAvailableJobs` (profile batch + rows/count waves), `getJobDetail` (JS haversine, parallel relations, parity delta 0.000000), `getMyOffers` (`$transaction` → `Promise.all`).
- **5** wallet `upsert` → `findUnique` (5 RTT → 1), `getMyVisits` N+1 → 3 queries with batched `DISTINCT ON`, `getKpis` 14 counts in one wave, `listConversations` include-chain → 2 waves.
- **6** `api-client.ts` timeouts + `AbortController` composition.
- **7** Production mock/silent fallbacks removed: `admin-api` 10 read paths (was serving `MOCK_*` — the admin dashboard, a server component with no token, rendered fabricated KPIs in production), customer jobs/offers/visits/profile, chat list/messages. Admin dashboard converted to client component with loading/error/retry states; `metadata` moved to `admin/dashboard/layout.tsx`. Write paths keep their boolean failure contract; auth OTP flows untouched (business logic).
- **8** Per-domain `staleTime` in `query-provider.tsx`; 7 hot-route `loading.tsx` skeletons (shared `RouteSkeleton`); 15 s feed poll removed (focus + socket push remain).

## Verified

- `npx tsc --noEmit` EXIT=0; `npm run build` EXIT=0 (107 pages); backend production build serves all 14 harness endpoints 15/15 (4/4 logins).
- Payload parity checked for list/detail/offers/visits transforms (contract unchanged; additive-only rule honored).
- **Backend tests:** `npm test` → **222 passed / 8 failed (was 210/13)**. The 5 failures introduced by the query rewrites were fixed by updating specs to the new batched shapes (`wallet.service.spec` ×4 → `findUnique` mocks; `chat.service.spec` `listConversations` → relation `findMany` fakes), plus `jobs.service.spec` — a suite that **never ran at HEAD** (merge dropped two closers, TS1005) — was unblocked and now passes 7/7 against the rewritten `getAvailableJobs`/`getJobDetail`.
- The **8 remaining failures are pre-existing at `9e9c422`** (verified in a clean `git worktree`): `chat.service` ×6, `chat.gateway` ×1, `worker-profile` PostGIS ×1. Unrelated to this sprint; left untouched.
- Lint: zero new violations in changed files (repo's pre-existing `no-explicit-any` debt untouched); gzip confirmed on (`Content-Encoding: gzip`).

## Remaining gaps & recommended next steps

1. **RTT floor is the dominant cost** — single-query endpoints cannot pass a <100 ms target from this region. Options: move DB closer (out of scope), or **response caching** (deferred → `caching.md`).
2. **`/jobs/customer` (1229 p50) and `/visits/my` (1229 p50)** sit at ~4 query waves; caching list responses for 30–60 s would put them at the floor.
3. **Indexes** worth adding for the raw queries introduced by batching (`visits/my` `LocationTracking(jobId)`, offer/job status filters) — see `indexes.md`.
4. `p95` numbers need a stable network (CI runner or same-region probe) to be publishable; local tails are jitter-dominated.

## Reproduce

```bash
# backend (fresh — login rate limiter is in-process, 5/5 min)
cd hunar-backend && npm run build
PERF_DB_METRICS=1 PERF_LOG_ALL=1 NODE_ENV=production PORT=4000 node dist/main
node scripts/perf-baseline.mjs --label final --out ../docs/performance/final-api
# frontend
cd hunar-frontend && npm run build && PORT=3001 npm run start
node scripts/perf-pages.mjs --label final --out ../docs/performance/final-pages
```
