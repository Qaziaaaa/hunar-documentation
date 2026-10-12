# Architecture notes (auth, data fetch, DB placement)

## Locked decisions (this sprint)

| Decision | Choice | Why |
|---|---|---|
| Auth/data-fetch model | **Option A — client-side authenticated fetch** | Token lives in `localStorage` (existing contract). Rewriting to httpOnly-cookie + SSR fetch would touch every auth path, both apps' middleware, and the socket handshake — unacceptable risk for a performance sprint. |
| Database placement | **Stay on Neon us-east-2** | ~281 ms measured RTT from the dev region is the hard floor. Migration is an ops change with backups/replication implications — documented, not executed. |
| Server response caching | **Deferred** (plan in `caching.md`) | Ship measurable query/wave fixes first; cache layer next with its own before/after. |

## The server-component token problem (why mocks existed)

- `getAccessToken()` reads `localStorage` → **always `null` on the server**.
- 22 async server pages fetched backend routes unauthenticated → **401** → api layers answered with **mock fallbacks** so builds wouldn't crash.
- Worst case: `admin/dashboard/page.tsx` was an async *server* component and rendered `MOCK_ADMIN_KPIS`/`MOCK_WORKERS` in production regardless of the real backend (verified pre-fix: unauthenticated `/admin/kpis` returns 401).

**Fix (Chunk 7):** admin dashboard is now a client component (fetch runs in the browser with the real token, loading/error/retry states, no fabricated numbers); page `metadata` moved to a sibling server `layout.tsx`. All read-path fallbacks removed:

| File | Functions that no longer swallow errors |
|---|---|
| `admin-api.ts` | 10 read fetchers (KPIs, verifications, transactions, withdrawals, disputes, live jobs, audit, settings, workers, customers). Write paths keep `true/false` contract (false = surfaced failure). |
| `customer-jobs-api.ts` | `getCustomerJobs`, `getJobOffers` |
| `customer-visits-api.ts` | `getCustomerVisits` |
| `chat-api.ts` | `listConversations`, `getConversationMessages`, `getMessagesByJob` |
| `customer-profile-api.ts` | `getCustomerProfile` (was: fabricated `defaultCustomerProfile`) |

Call-site safety was audited: customer/chat fetchers are TanStack Query `queryFn`s (error states) or have explicit `.catch`; component keeps its designed empty state. Auth OTP fallback flows were **not** touched (business logic, out of scope). `isMockMode()` was already hard-coded `false`.

### Remaining deliberate fallbacks (audited, left in place)

| Location | Behavior | Why it stays |
|---|---|---|
| `worker/services/jobs.service` (and earnings) | `401 → []`, other errors rethrow | Signed-out = empty list is correct semantics |
| `chat-api sendChatMessage/uploadChatImage` | optimistic local message on failure | Product feature (offline-tolerant chat); warn logged |
| `verification-api getVerificationStatus` | server → last-known localStorage → default | Offline status page; local-cache pattern |
| `customer-quote-service` | server pending quote → local session | Local-first design |
| `auth-api` OTP/login fallbacks | synthesized OTP responses | Auth business logic — separate workstream |
| `post-job-api uploadJobPhoto` | local objectURL on upload failure | **Dead code** (no callers); not a production path |

Full-sweep check after Chunk 7: **no async server component calls any HTTP fetcher** (only `getTranslations`), so no server path can hit a removed fallback.

## HTTP layer (Chunk 6)

`hunar-frontend/src/lib/api-client.ts`:
- Timeouts by intent: **GET/HEAD 15 s, mutations 30 s, uploads 60 s, token refresh 10 s** (`AbortSignal.timeout`).
- `AbortController` per request, composed with any external `options.signal`; timeout → `ApiError("REQUEST_TIMEOUT", 0)`.
- Before: a stalled connection hung forever (no abort path) — a common hidden source of "the page never finishes".

## Query batching principles (Chunks 3–5, backend)

1. **`Promise.all` = 1 round trip; serial awaits = 1 RTT each (~281 ms).** `include` relations and `$transaction([...])` (BEGIN/COMMIT ≈ 5 RTT) are serial by default — the main N+1/wave offenders.
2. **One `Promise.all` per *logical* wave** (data dependencies force waves). `getCustomerJobs` = 3 waves; `getKpis` = 1 wave of 14; `getMyVisits` = 1 wave + one batched `DISTINCT ON` raw.
3. **`upsert` is 5 RTT even when the row exists** (BEGIN + 3 SELECT + COMMIT) — use `findUnique` + create-on-miss for hot read paths (`getOrCreateWallet`: 1225 → 307 ms).
4. Raw single `UPDATE` = 1 RTT vs `updateMany` = 3. Guard `Prisma.join(...)` on empty arrays (throws).
5. Contract rules honored: no API shape changes; frontend transforms verified field-by-field against baseline payloads (incl. `distanceKm` parity to 6 decimals).

## DB placement math (why everything sits near the floor)

```
floor(endpoint) ≈ waves × 281 ms RTT + app overhead
1 query:  ~300 ms   → health, wallet, earnings, notifications (measured 285–307)
2 waves:  ~615 ms   → jobs/available, jobs/:id, chat/conversations (measured 614–616)
3–4 waves: 920–1230 → offers/my, jobs/customer, visits/my
```

Options considered: **(a)** move DB → out of scope; **(b)** read replica near dev/users → same ops cost as (a); **(c)** cache → `caching.md`; **(d)** fewer waves → done this sprint (only remaining lever without ops change).

## What was explicitly rejected

- **httpOnly-cookie SSR auth rewrite** (Option B): high blast radius, zero measurable win for client-driven screens (SSR shells were already 5–28 ms).
- **Moving/sharding the database**: ops risk; documented as the structural fix.
- **Redis cluster / cache-manager integration**: in-process `MemoryRedisService` exists; real distributed cache deferred until multi-instance deployment.
- **Schema migrations for indexes**: recommendations only (`indexes.md`) — this sprint shipped zero migrations.
