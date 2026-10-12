# Index analysis (perf sprint)

Data from live Neon project `orderworker` (`twilight-field-95775077`, branch `br-mute-unit-b4ptri0s`) via read-only `pg_stat_user_indexes` / `pg_stat_user_tables` inspection, plus schema review (`hunar-backend/prisma/schema.prisma`) and the hot-path SQL added by this sprint.

## Hot queries → index coverage

| Query (code) | Filter / sort | Existing index | Verdict |
|---|---|---|---|
| `getAvailableJobs` rows+count (`jobs.service.ts:430,464`) | `status IN (...) AND lat BETWEEN AND lng BETWEEN [AND categoryId=ANY] ORDER BY createdAt DESC LIMIT` | `ServiceRequest(status)`, `(createdAt)`, `(city,area)`, `(categoryId)`, GiST `location` | ⚠️ see R1/R3 |
| `getAvailableJobs` `NOT EXISTS JobOffer` | `jobId = sr.id` | `JobOffer(jobId, workerId)` unique | ✅ (leading col covers) |
| worker `ServiceArea` EXISTS | `userId = $1` (+ haversine) | `ServiceArea(userId)` | ✅ first, then distance filter in CPU |
| `getMyVisits` last-location (`visits.service.ts:149`) | `WHERE jobId IN (...) ORDER BY jobId, recordedAt DESC` (`DISTINCT ON`) | `LocationTracking(jobId)` only | ⚠️ R2 — needs `(jobId, recordedAt)` |
| `getCustomerJobs` offers+`UPDATE ... 'VIEWING'` | `jobId IN (...)` [`AND status='PENDING'`] | `JobOffer(jobId)` / unique | ✅ |
| `listConversations` | `OR(customerId,workerId)` `ORDER BY lastMessageAt DESC` | `Conversation(customerId)`, `(workerId)`, `(lastMessageAt)` | ✅ at scale (seq-scans today — table is tiny, planner is right) |
| wallet `getOrCreateWallet` | `userId = $1` | `WorkerWallet.userId` **primary key** | ✅ (baseline's slow 1.2 s query was `upsert` doing 3 SELECTs, not a missing index — fixed in Chunk 5) |
| `Review`/`ServiceRequest` `groupBy` in `getCustomerJobs` | `revieweeId`, `customerId` | `Review(revieweeId)`, `ServiceRequest(customerId)` | ✅ |

## Findings from live stats

1. **GiST spatial indexes exist but are never used** — `ServiceRequest_location_gist_idx` and `ServiceArea_location_gist_idx` both show **0 scans**. The app filters with `lat/lng BETWEEN` boxes and computes haversine in SQL/JS; GiST with `earthdistance`/PostGIS `<->` KNN operators is a *different* access method. At current table sizes the sequential/B-tree scan is fine.
2. **`JobOffer_jobId_idx` shows 0 scans and is redundant** — the `@@unique([jobId, workerId])` composite covers every `jobId` lookup (it's what the planner picks). Dropping the duplicate `@@index([jobId])` would shave write cost with zero read impact. (Requires a Prisma schema change + migration — not applied this sprint.)
3. **Heavy seq-scan counts** (`JobOffer` 52,520; `ServiceRequest` 37,876) are *lifetime* counters on small tables where sequential scans are the correct plan. Not a problem yet; re-check after ~10× row growth (`neon inspect db --check seq-scans`).
4. **Low-value indexes to revisit at scale**: `ServiceRequest(city, area)` and `(categoryId)` show 0 scans (filters rarely combined this way), `WorkerProfile(skills)` 0 scans (`= ANY(skills)` isn't a plain equality), several audit/wallet 0-scan indexes. Keep them now — they cost little and guard future queries.

## Recommendations (priority order)

1. **`LocationTracking`: add a composite for the DISTINCT ON batch**
   ```prisma
   model LocationTracking {
     // ...
     @@index([jobId, recordedAt(sort: Desc)])   // replaces jobId-only for the hot query
   }
   ```
   Today: index-locate per `jobId`, then a per-job sort of all its rows. With the composite: index order == `DISTINCT ON ... ORDER BY jobId, recordedAt DESC` → top row per job directly. Measured impact: small while tables are tiny; grows with tracking frequency × page size.
2. **`ServiceRequest`: composite for the feed sort**
   ```prisma
   @@index([status, createdAt(sort: Desc)])
   ```
   Matches `WHERE status IN (...) ... ORDER BY createdAt DESC` — avoids sorting the filtered set.
3. **Do not add haversine-covering indexes by hand** — the predicate is computed, so only an operator-class change can serve it (PostGIS `||>` / `earthdistance` KNN). Defer; revisit when job volume makes the lat/lng box scan measurable (explain-analyze first).
4. **Drop `JobOffer.jobId` single-column index** (redundant, 0 scans) — low-value cleanup, needs migration.
5. **Verify with `EXPLAIN (ANALYZE, BUFFERS)`** on the real SQL before/after any migration (Neon console or `Neon_explain_sql_statement`); this sprint intentionally shipped **zero schema changes**.

## Not an index problem

- Baseline `/wallet/balance` at 1.2 s: `upsert` round trips (BEGIN + 3 SELECT + COMMIT), fixed by `findUnique` + create-on-miss (Chunk 5) → 307 ms (RTT floor).
- All measured latencies are dominated by the **~281 ms cross-region RTT**; index tuning alone cannot move a single-query endpoint below that (see `report.md`).
