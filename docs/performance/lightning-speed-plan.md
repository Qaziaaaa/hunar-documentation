# Lightning-speed plan (next sprint)

Follow-up to the completed perf sprint ([`report.md`](report.md), commit `9e9c422`). That sprint fixed query
*shape* (N+1, serial rounds, `upsert` storms) and front-end refetch policy. What remains is the part that
sprint explicitly deferred: **the RTT floor, response transfer, read caching, and the client-render loading
path**.

Baseline for every number below: [`report.md`](report.md) / [`baseline-api.md`](baseline-api.md).
Measured environment: Neon Postgres **us-east-2**, developer machine Asia/Karachi, **~281 ms per query**.
Cache/priority rationale lives in [`caching.md`](caching.md); index detail in [`indexes.md`](indexes.md).

---

## Corrections to `report.md` (verified against the working tree)

Two "After" claims do not match the code on disk. Confirm each before treating the sprint as closed.

| Report claim | Actual state (verified) | Action |
|---|---|---|
| "gzip confirmed on (`Content-Encoding: gzip`)" | **No `compression` dependency** in `hunar-backend/package.json`; no `compression` import anywhere in `src/`; `main.ts` registers no compression middleware. Any gzip seen was from the frontend proxy, not the Nest server. | Item **B1** below |
| `getJobDetail` "haversine in JS" | `jobs.service.ts` `getJobDetail` **still runs a second `$queryRaw`** to compute distance after `findUnique`, despite the job row already carrying `latitude`/`longitude`. | Item **B4** below |

Net effect: the backend still ships **uncompressed JSON** and `getJobDetail` is still **2 sequential waves**
(~2 × 281 ms) instead of 1.

---

## Status — Phase A shipped (2026-10-09)

| Item | State | Evidence |
|---|---|---|
| B1 compression | ✅ done | `compression` dep + middleware in `main.ts`; **7,511 B → 290 B** on a 7.5 KB JSON response (`Content-Encoding: gzip`) |
| B2 upload cache headers | ✅ done | `Cache-Control: public, max-age=2592000, immutable` confirmed on `/uploads/*` |
| B3 Prisma pool | ✅ done | `connection_limit=20&pool_timeout=10` appended to `DATABASE_URL` in `.env`; documented in `.env.example` |
| B4 `getJobDetail` JS haversine | ✅ done | second `$queryRaw` removed; shared `haversineKm` extracted to `src/common/helpers/geo.util.ts` (sanity-checked: 1° lat = 111.195 km) |
| B5 per-page `COUNT(*)` | ✅ done | folded into the feed query as `COUNT(*) OVER ()`; verified on live Neon (window `total` == separate `COUNT(*)`) |

Gates: `tsc --noEmit` EXIT=0 · `nest build` EXIT=0 · `jest --runInBand` **237/237 pass, 22/22 suites**.

| # | Item | Layer | Effort | Expected impact |
|---|---|---|---|---|
| ~~B1~~ | ~~gzip/brotli compression~~ | backend | ~~done~~ | ✅ shipped |
| ~~B2~~ | ~~`Cache-Control` on `/uploads`~~ | backend | ~~done~~ | ✅ shipped |
| ~~B3~~ | ~~Prisma pool tuning~~ | backend | ~~done~~ | ✅ shipped |
| ~~B4~~ | ~~`getJobDetail` JS haversine~~ | backend | ~~done~~ | ✅ shipped |
| ~~B5~~ | ~~Drop per-page `COUNT(*)`~~ | backend | ~~done~~ | ✅ shipped |
| C1 | Read cache (Tier 2 from `caching.md`) | backend | 1–2 d | cached hits → RTT-free |
| C2 | Index migration | DB | ~2 h | feed/visit sort at scale |
| F1 | `next/image` migration | frontend | 1–2 d | image bytes + layout shift |
| F2 | Admin dashboard → React Query | frontend | 1 d | no all-or-nothing spinner |
| F3 | Job-feed incremental insert | frontend | ~3 h | kill refetch storm |
| I1 | **Co-locate DB + API region** | infra | ~1 h | **−400–500 ms on every query** |
| I2 | CDN for uploads | infra | ~3 h | offload images from API |

**I1 is the single highest-value item in this document.** Everything else is a multiplier on top of it.

> Note on **B3**: the `DATABASE_URL` change is local-only (`.env` is gitignored); the change must be mirrored
> in each deployed environment's config.

---

## Phase A — transfer & config (half a day, zero behaviour risk)

### B1. Response compression
JSON is the bulk of API traffic (admin lists, wallet ledger, job cards with `description` + `images[]`).

```bash
cd hunar-backend && npm i compression && npm i -D @types/compression
```

```ts
// src/main.ts — register before routes/guards, after CORS
import compression from 'compression';
app.use(compression({ threshold: 1024 }));
```

*Verify:* `curl -s -H 'Accept-Encoding: gzip' -D - -o /dev/null localhost:4000/api/v1/health` →
expect `Content-Encoding: gzip` and `Vary: Accept-Encoding`. Then re-run
`node scripts/perf-baseline.mjs --label gzip` and compare **response bytes**, not just latency
(localhost has ~0 network cost, so bytes are the real signal here).

### B2. Cache headers for static uploads
`main.ts` serves `express.static(uploadsDir)` with defaults → `Cache-Control: max-age=0`, so every
avatar/thumbnail revalidates on each render.

```ts
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '30d',
  immutable: true,
}));
```

Upload keys are `uuid`-based (`uploads.service.ts`), i.e. content-addressed by construction, so
`immutable` is safe. Prefer serving these from object storage in production (→ I2).

### B3. Prisma pool
`DATABASE_URL` has no pool params → default `~2×CPU+1`, which exhausts when a single page fires several
parallel queries at 281 ms each. Append `?connection_limit=20&pool_timeout=10` (Neon pooler) and confirm
the value is below the provider's connection cap.

### B4. `getJobDetail` — compute distance in JS
`jobs.service.ts` fetches the job (with `latitude`/`longitude`) then issues a **second query** for distance.
A JS haversine already exists but is private to another module:
`haversineKm(...)` at `src/modules/notifications/notifications.service.ts:229`. Extract it into a shared
helper (e.g. `src/common/helpers/geo.util.ts`) and use it here, so both call sites stay consistent.

*Verify:* response parity — `distanceKm` must be byte-identical to the SQL result for the same inputs
(the sprint's parity-delta standard was `0.000000`). Add/extend a `jobs.service.spec.ts` case.

### B5. Drop the per-page `COUNT(*)`
`getAvailableJobs` runs the feed query then a separate `COUNT(*)` with the same joined conditions on
**every** page. For infinite scroll the total is only needed once.

- Return `total` only when `page === 1` (set `total: null` / omit `totalPages` otherwise), **or**
- Fold it in with `COUNT(*) OVER () AS total` in the existing raw query (single wave, no second round trip).

Choose one and keep the response contract additive-only (the sprint's rule). Update the frontend type
accordingly; `toPageResult` in `common/helpers/pagination.util.ts` is the single place to touch.

**Gate:** `npx tsc --noEmit` EXIT=0 and `npm test` no new failures (baseline: 222 pass / 8 pre-existing fail).

---

## Phase B — read caching (1–2 days)

Implement Tier 2 from [`caching.md`](caching.md). Infrastructure already exists:
`MemoryRedisService` behind the `REDIS_PROVIDER` token (`src/common/redis/redis.module.ts`), currently only
used by the login rate limiter. It is **in-process** — no network hop — which is exactly what you want for
RTT-free hot reads, and acceptable while the app is single-instance.

Order by measured p50 (from `report.md`):

| Order | Endpoint | p50 | TTL | Invalidate on |
|---|---|---|---|---|
| 1 | `GET /jobs/customer` | 1229 ms | 30 s | job create/update or offer by that customer |
| 2 | `GET /visits/my` | 1229 ms | 30 s | visit create/status change (location writes excluded) |
| 3 | `GET /offers/my` | 922 ms | 15 s | offer placed/status change for that worker |
| 4 | `GET /admin/kpis` | 642 ms | 30 s | admin mutations, or TTL only |
| 5 | `GET /jobs/available` | 616 ms | 15 s | any job status change |
| 6 | `GET /chat/conversations` | 614 ms | 10 s | new message / conversation create |

Rules (from the sprint's locked decisions):
- Cache **only idempotent GET reads** — never mutations, auth, or OTP responses.
- Store the **transport-serialized DTO** so hit/miss shapes are identical.
- Keys are user-scoped; no PII beyond what the endpoint already returns.
- Kill switch: `process.env.PERF_READ_CACHE !== 'off'`.
- **Cache the categories / platform-settings / eligibility reads too** (`worker-eligibility.util.ts`,
  `getSettings`) — they are read-mostly and currently hit the DB on every request.

Do this **one endpoint at a time**, measuring with `scripts/perf-baseline.mjs` before/after. The sprint's
rule was "no new cache layer shipped unmeasured" — keep it.

When the app becomes multi-instance, swap `MemoryRedisService` for the real `RedisService` so cache and
Socket.IO pub/sub share state.

---

## Phase C — query & index (half a day)

From [`indexes.md`](indexes.md) recommendations 1–2 (currently **not applied**):

```prisma
// LocationTracking — serves getMyVisits' DISTINCT ON batch
@@index([jobId, recordedAt(sort: Desc)])

// ServiceRequest — matches the feed's ORDER BY createdAt DESC
@@index([status, createdAt(sort: Desc)])
```

Also: drop the redundant `JobOffer.jobId` single-column index (0 scans; `@@unique([jobId, workerId])` covers it).

*Verify:* `EXPLAIN (ANALYZE, BUFFERS)` on the real SQL before/after (Neon console). Validate the Prisma
schema and generate; apply via a proper migration. Keep the sprint's "explain before indexing" rule.

---

## Phase D — client-render loading path (2–4 days)

### F1. `next/image`
~70 raw `<img>` tags across features (job feed, chat, admin doc review, offers). They have no
`width`/`height` (layout shift), no lazy-load, no `srcset`, no AVIF/WebP. `next.config.ts` already declares
`remotePatterns` for the API origin and `images.unsplash.com`, so this is mostly mechanical.
Start with the highest-traffic screens: worker feed, customer jobs list, chat.

### F2. Admin dashboard
`app/[locale]/(admin)/admin/dashboard/page.tsx` holds one `data` state from `Promise.all` of **8 fetches**
and renders nothing until all resolve — one slow endpoint blocks the page. Child widgets fetch again through
`features/admin/hooks/use-admin-resource.ts`, which is a bespoke `useEffect` hook with **no caching or
dedup**. Convert to React Query (`useQuery` per panel) and let each panel paint its own skeleton.

### F3. Job-feed refetch storm
`features/worker-dashboard/components/job-request-feed.tsx` calls `refreshLiveJobs()` on **every** socket
`job:new` push — a full list refetch for every connected worker per new job. Insert the pushed job
incrementally into `liveJobs` (the event already carries `jobId`, `categoryId`, lat/lng, `createdAt`) and
keep one full refresh on `focus`/reconnect.

### F4. Code-splitting & i18n
- Zero uses of `next/dynamic` today. Lazy-load Leaflet maps, modals, and admin charts.
- `messages/ur.json` is 67 KB / `en.json` 51 KB and loaded monolithically. Split by namespace/route.
- Remove unused deps (`mapbox-gl`, `html2canvas` are declared but unreferenced in `src/`).

---

## Phase E — structural (do I1 first, it dwarfs the rest)

### I1. Co-locate the database with the application
Every number in `report.md` is dominated by a **~281 ms cross-region RTT**; single-query endpoints cannot
go below it. Move the Neon project to `ap-south-1` (Mumbai) or Singapore, and/or run the API in `us-east-2`.
This is a dashboard/config change, not a code change, and it removes ~400–500 ms from **every** endpoint
simultaneously. The sprint marked it "out of scope" — it is now the top of the list.

### I2. CDN for uploads
Set `STORAGE_PUBLIC_BASE_URL` (already supported by the storage layer, currently optional) to S3/CloudFront
and point the frontend at it, so images never transit the API server. Also move sharp re-encoding off the
request path (uploads currently buffer in RAM via `memoryStorage` and block the event loop), and switch to
presigned direct-to-S3 uploads.

### I3. Keyset pagination
`normalizePage` uses `OFFSET (page-1)*limit` everywhere. For feeds, migrate to cursor/keyset on
`(createdAt, id)` to avoid deep-offset scans as data grows.

---

## Success metrics

| Metric | Now | Target after A–C | Target after I1 |
|---|---|---|---|
| `GET /jobs/customer` p50 | 1229 ms | ≤ 310 ms (cached) | ≤ 60 ms |
| `GET /visits/my` p50 | 1229 ms | ≤ 310 ms (cached) | ≤ 60 ms |
| `GET /jobs/available` p50 | 616 ms | ≤ 310 ms | ≤ 60 ms |
| `GET /jobs/:id` queries | 2 waves | 1 wave | 1 wave |
| JSON list payload bytes | uncompressed | −60–80% | — |
| Admin dashboard first paint | blocked on 8 fetches | per-panel skeleton | — |
| `GET /health` p50 | 285 ms | unchanged (floor) | ~20 ms |

Publish p95 only from a stable network (CI runner or same-region probe); local tails are jitter-dominated.

## Verification protocol (every phase)

1. `cd hunar-backend && npx tsc --noEmit` → EXIT=0.
2. `npm run build` → EXIT=0.
3. `npm test` → no new failures beyond the 8 pre-existing (`chat.service` ×6, `chat.gateway` ×1,
   `worker-profile` PostGIS ×1 — verified pre-existing in a clean worktree during the last sprint).
4. Harness before/after: `node scripts/perf-baseline.mjs --label <phase>` and
   `node scripts/perf-pages.mjs --label <phase>`.
5. Payload parity for any changed list/detail transform (additive-only contract).
6. Record results as `docs/performance/<label>-api.md` alongside the existing Before/After files.

## Reproduce the harness

```bash
cd hunar-backend && npm run build
PERF_DB_METRICS=1 PERF_LOG_ALL=1 NODE_ENV=production PORT=4000 node dist/main
node scripts/perf-baseline.mjs --label lightning --out ../docs/performance/lightning-api
```
