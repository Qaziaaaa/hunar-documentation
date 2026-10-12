# Realtime & polling inventory

## Target model

**Socket.IO push is the freshness channel; React Query cache is the default state; polling only as an explicit fallback.** The sprint removed incidental polling, not deliberate fallbacks.

## What changed in this sprint

| Location | Before | After |
|---|---|---|
| `job-request-feed.tsx` (worker dashboard) | `setInterval(refresh, 15_000)` **+** focus listener **+** socket push → up to 4 backend hits/min per open dashboard (`GET /jobs/available` ≈ 616 ms server work each) | **socket push (`JOB_MATCHED`/`new_job`) + focus refresh only** |
| `query-provider.tsx` | flat `staleTime: 60s` (all queries refetch 1×/min while mounted) | per-domain: notifications 15 s, chat/wallet/jobs 30 s, static 5 min |
| Customer jobs screen | 1 + 2N requests (per-job offers/detail) | single list fetch (O(1)) |
| Admin dashboard | server component re-fetched mocked data at request time | client fetch with real token; no background polling |

## Remaining network intervals (audited, intentional)

| Location | Interval | What it does | Verdict |
|---|---|---|---|
| `peshawar-live-tracking-map.tsx:91` | 5 s `GET /visits/.../location` | **Polling fallback** while socket `location:update` events also run (customer live-tracking page, only open during active tracking) | Keep — it's the safety net if the socket drops. *Future:* poll only when no push received for >10 s and `document.visibilityState === 'visible'` to halve traffic. |
| Everything else (`radar-search-view`, voice players, chat recording timer, OTP countdown) | 0.5–3 s | **Local UI animation/timers, zero network** | No action |

No `refetchInterval` exists anywhere in the app (grep verified). No other `setInterval` hits the network.

## Realtime channels in use

- **Socket.IO (backend `Gateway`, in-process)**: worker push notifications (`JOB_MATCHED`, `new_job`), live location (`location:track:start/stop` → `location:update`), chat messages, auth/session events.
- **Focus as a poor-man's invalidation**: worker feed refreshes when the tab regains focus (kept — covers "was away, came back" without background traffic).
- **TanStack Query invalidations**: mutation-driven (`invalidateQueries` after saves/accepts) — the primary coherence mechanism for list screens.

## Why not add more push?

- **Job status transitions** are already push-eligible (`EventBus` exists in `src/common/event-bus`), and the customer job-detail screen relies on refetch-on-navigation + 30 s staleTime instead. If live job status matters UX-wise, next step is broadcasting `job:status_changed` to the job's participant rooms — small change, needs a socket-contract decision (additive events only).
- **Notification badge**: 15 s staleTime + socket push already present; a dedicated `unread_count` push event would let it drop to instant (additive).

## Guardrails (for future changes)

1. Any new `setInterval` hitting the API needs: an off-switch, visibility awareness, and a line in this table.
2. Push events must be **additive** (old clients ignore unknown event names — contract rule).
3. Measure with the harness: every periodic request multiplies the measured steady-state load, not just the p50.
