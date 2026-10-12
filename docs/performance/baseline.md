# Performance baseline (Before)

Measured 2026-10-07 at commit `9e9c422`, before any optimization work.

## Environment

- Backend: NestJS production build on `localhost:4000`, `PERF_DB_METRICS=1 PERF_LOG_ALL=1`
- Frontend: `next start` production build on `localhost:3001`
- DB: Neon Postgres **us-east-2**; developer machine in Asia/Karachi → **measured ~281 ms round-trip per query**
- Method: sequential requests, HTTP keep-alive, warmup then N runs; percentiles are nearest-rank
- Raw evidence: [`baseline-api.json`](baseline-api.json), [`baseline-pages.json`](baseline-pages.json)
- Reproduce: `node hunar-backend/scripts/perf-baseline.mjs` (backend must be fresh — login rate-limits are in-process, 5/5 min) and `node hunar-frontend/scripts/perf-pages.mjs`

## API latency (Before)

Full table: [`baseline-api.md`](baseline-api.md). `db queries` / `db ms` come from a Prisma `$use` middleware inside the request-scoped AsyncLocalStorage store.

| Endpoint | Role | client p50 | client p95 | db queries (mean) | db ms (mean) |
|---|---|---|---|---|---|
| `GET /health` | - | 307.1 | 311.9 | 1 | 304 |
| `POST /auth/login (worker)` | - | 342.7 | 410 | 1 | 307.5 |
| `POST /auth/customer/login` | - | 407.6 | 414.2 | 1 | 343.5 |
| `POST /auth/admin/login` | - | 409 | 413 | 1 | 342 |
| `GET /jobs/customer?limit=50` | customer | 1535.9 | 1844 | 2 | 3087.6 |
| `GET /jobs/available` | worker | 1228.8 | 1536.7 | 6 | 1823.5 |
| `GET /jobs/:id` | customer | 1470.9 | 1536.1 | 2 | 1381.8 |
| `GET /offers/my` | worker | 1487.7 | 2088.6 | 2 | 3134.1 |
| `GET /wallet/balance` | worker | 1225.3 | 1467.5 | 1 | 1246.3 |
| `GET /earnings/summary` | worker | 247.8 | 250.8 | 1 | 245 |
| `GET /admin/kpis` | admin | 1495.2 | 2576.6 | 14 | 3748.8 |
| `GET /notifications/unread-count` | customer | 239.8 | 308.9 | 1 | 245.6 |
| `GET /chat/conversations` | customer | 961.1 | 1247.4 | 1 | 1069.6 |
| `GET /visits/my` | customer | 1905.1 | 3827.9 | **22** | **11452.5** |

## Frontend pages (Before)

Full table: [`baseline-pages.md`](baseline-pages.md).

| Route | p50 | HTML bytes (p50) |
|---|---|---|
| `/en` | 27.7 ms | 257,716 |
| `/en/customer/login` | 6.9 ms | 77,150 |
| `/en/customer/dashboard` | 7.3 ms | 109,574 |
| `/en/customer/jobs` | 6.6 ms | 77,275 |
| `/en/worker/dashboard` | 6.5 ms | 78,650 |
| `/en/worker/jobs` | 8.7 ms | 77,846 |
| `/en/admin/dashboard` | 7.5 ms | 159,545 |

## Key findings

1. **The latency floor is one DB round trip (~250–310 ms).** Single-query endpoints (`/health`, `/earnings/summary`, `/notifications/unread-count`) sit at ~240–310 ms. Every extra query adds up to ~281 ms when serial. No endpoint can go below ~250 ms without caching or a closer DB.
2. **N+1 confirmed:** `GET /visits/my` runs **22 queries (11.5 s cumulative DB time)** — the worst offender. `GET /admin/kpis` runs **14 queries (3.7 s)**; `GET /jobs/available` runs **6 queries**.
3. **A single query is abnormally slow:** `/wallet/balance` executes one query taking **~1.2 s** vs ~300 ms for `/health` — likely a missing index or unindexed filter (Chunk 5 candidate).
4. **Parallel queries inflate cumulative `db ms`** beyond wall time (e.g. `/jobs/customer` 3.1 s db / 1.5 s wall) — `Promise.all` fan-out exists server-side too.
5. **Frontend SSR is not the bottleneck:** every page is a static shell served in 6–28 ms. The perceived slowness comes after hydration:
   - Customer jobs screen issues **1 + 2N HTTP requests** (list + per-job detail + offers) — 201 requests for 100 jobs.
   - `api-client.ts` has no `AbortController`/timeouts; 22 async server pages fetch **unauthenticated → 401 → mock fallback** (no token available server-side: `getAccessToken` returns null on the server), and admin dashboard bakes whatever it fetched at build time.
   - No caching layer anywhere: zero `CacheInterceptor`, zero `loading.tsx`, zero `prefetchQuery`, no compression middleware, single global `staleTime: 60s`.
   - `job-request-feed.tsx` polls every 15 s despite a working Socket.IO connection.
6. **DB is remote (us-east-2, ~281 ms RTT).** Moving it is out of scope this sprint; everything below targets query count, serial vs parallel execution, and caching.

## Targets (sprint brief)

| Area | Target | Baseline | Status |
|---|---|---|---|
| `GET /health` p95 | < 50 ms | 311.9 ms | ❌ (floor-bound by 1 remote query) |
| Auth (login) p95 | < 1.2 s | 410–414 ms | ✅ |
| `GET /jobs/customer` p95 | < 800 ms | 1844 ms | ❌ |
| `GET /jobs/available` p95 | < 1.2 s | 1536.7 ms | ❌ |
| Admin p95 | < 1 s | 2576.6 ms | ❌ |
| Customer jobs screen requests | O(1), not O(N) | 1 + 2N | ❌ |
| p95 variance | stable | `/visits/my` 1905 → 3828 ms | ❌ |
