# Caching strategy (deferred — plan + what already shipped)

Caching was **deferred** from this sprint's runtime changes (locked decision: no new cache layer shipped unmeasured). This doc records what shipped for free, and the ready-to-implement plan with measured targets.

## Tier 1 — shipped (client-side, zero backend risk)

- **Per-domain `staleTime`** (`hunar-frontend/src/components/providers/query-provider.tsx`): 15 s notifications → 30 s chat/wallet/customer jobs → 60 s visits/worker jobs → 5 min settings/profile/reviews. Every avoided refetch is a full ~600 ms–1.2 s API round trip the user doesn't wait for.
- `refetchOnWindowFocus: false` kept (focus already triggers the worker feed refresh; blanket focus-refetch would reintroduce burst traffic).
- React Query cache survives route navigation (component unmount doesn't drop cache) — combined with new `loading.tsx` skeletons, revisited screens paint instantly from cache then revalidate.

## Tier 2 — recommended next (backend response cache)

Infrastructure already present: `MemoryRedisService` (`src/common/redis/memory-redis.service.ts`, currently only used by the login rate limiter) behind the `REDIS` token. It is **in-process** (no network hop; restart clears it — acceptable for hot-read caching, and today the app is single-instance).

| Key | Endpoint | TTL | Invalidate on |
|---|---|---|---|
| `perf:jobs:customer:{userId}:{page}:{limit}` | `GET /jobs/customer` (1229 ms) | 30 s | job create/update/offer-placement by that customer |
| `perf:jobs:available:{workerId}:{hash(query)}` | `GET /jobs/available` (616 ms) | 15 s | any job status change (OPEN/OFFERS_RECEIVED) |
| `perf:visits:{userId}:{page}` | `GET /visits/my` (1229 ms) | 30 s | visit create/status change; location writes do **not** invalidate (payload staleness of last-location ≤30 s is fine) |
| `perf:kpis` | `GET /admin/kpis` (642 ms) | 30 s | any mutation in admin flows (or just TTL) |
| `perf:conversations:{userId}` | `GET /chat/conversations` (614 ms) | 10 s | new message / conversation create |
| `perf:offers:{userId}` | `GET /offers/my` (922 ms) | 15 s | offer placed/status change for that worker |

Expected effect (p50, same region): every cached hit drops to **one in-process lookup — effectively 0 ms network-excluded, ~RTT-free server-side**; user-visible p50 for these routes would approach the health-check floor (≈10–30 ms server time + network). Hardest target in `report.md` (`/jobs/customer` p95 < 800 ms) becomes trivially met.

Rules of engagement (set by this sprint):
- Cache **only idempotent GET reads**; never mutations or auth responses.
- Store **transport-serialized DTOs** (same shape the controller returns) so hit/miss is shape-identical.
- No PII beyond what the endpoint already returns; keys are user-scoped so cross-user leaks are impossible.
- Guard with a kill switch (`process.env.PERF_READ_CACHE !== 'off'`) and measure with the existing harness before/after.

## Tier 3 — deliberately not used

- **CDN/HTTP caching of API responses**: all reads carry `Authorization` headers (and several are per-user) → `Cache-Control` private/no-store is correct; CDN caching would be a contract change.
- **SSR-side caching / `revalidate`**: admin dashboard was converted to client fetch (token lives in `localStorage`); caching rendered shells would cache *unauthenticated* HTML (the old bug — see `architecture.md`).
- **Prisma `cacheStrategy` (React/JS extended query cache)**: 5.x supports accelerate-style caching but requires Prisma Accelerate — out of scope.

## Why the DB wasn't moved (context for caching as the lever)

Single query ≈ **281 ms** (us-east-2 ↔ Asia/Karachi, measured). Caching is the only lever that removes RTT without changing hosting; moving Postgres closer to users or adding a read replica would be the structural fix (documented in `architecture.md`, out of scope this sprint).
