# HAKIM ULLAH — WORKER FLOW BACKEND (A to Z)

## Status: ⏸️ PAUSED

Backend work is paused. This file defines what you will build when backend work starts.

---

## Your Role
Backend Developer — Full Worker Flow APIs

## Your Partner
**Shahzad** (Frontend) — You coordinate on API contracts. He builds the UI, you build the APIs.

## Your Flow
All backend APIs for the worker journey: auth, onboarding, verification, jobs, offers, visits, inspection, repair, wallet, commission, chat, notifications.

## Source Documents
- `Project Modules/01_Worker_Flow.md` — Full requirements
- `members/hakimullah/` — Your architecture docs

---

## MILESTONES

### M1: Auth + Onboarding + Profile

| # | Task | API Endpoint | Status |
|---|------|-------------|--------|
| 1 | Worker sign-up (phone → OTP → password) | `POST /auth/worker/signup` | ⏸️ |
| 2 | Request OTP | `POST /auth/worker/otp/request` | ⏸️ |
| 3 | Verify OTP | `POST /auth/worker/otp/verify` | ⏸️ |
| 4 | Complete signup (set password) | `POST /auth/worker/signup/complete` | ⏸️ |
| 5 | Worker login (phone + password) | `POST /auth/worker/login` | ⏸️ |
| 6 | Refresh token | `POST /auth/worker/refresh` | ⏸️ |
| 7 | Role guard middleware | Middleware | ⏸️ |
| 8 | Onboarding — save personal details | `PUT /workers/onboarding/personal` | ⏸️ |
| 9 | Onboarding — save skills | `PUT /workers/onboarding/skills` | ⏸️ |
| 10 | Onboarding — save experience | `PUT /workers/onboarding/experience` | ⏸️ |
| 11 | Onboarding — save service areas (PostGIS) | `PUT /workers/onboarding/areas` | ⏸️ |
| 12 | Onboarding — upload documents | `POST /workers/onboarding/documents` | ⏸️ |
| 13 | Onboarding — submit for verification | `POST /workers/onboarding/submit` | ⏸️ |
| 14 | Get verification status | `GET /workers/verification-status` | ⏸️ |
| 15 | Worker profile (public) | `GET /workers/[id]` | ⏸️ |
| 16 | Edit profile | `PUT /workers/[id]` | ⏸️ |

**OTP Rules (enforce strictly):**
- Valid for **5 minutes**
- Re-request at most once per **15 minutes**
- Max **3 failed attempts** before invalidation
- Rate-limit repeated requests

**Token Rules:**
- Access token: **15 minutes**
- Refresh token: **30 days**
- Password: **bcrypt hash**

---

### M2: Jobs + Offers + Visits + Inspection

| # | Task | API Endpoint | Status |
|---|------|-------------|--------|
| 17 | Get nearby jobs (PostGIS matching) | `GET /jobs/nearby` | ⏸️ |
| 18 | Get job detail | `GET /jobs/[id]` | ⏸️ |
| 19 | Send visit offer | `POST /jobs/[id]/offers` | ⏸️ |
| 20 | Get my offers | `GET /workers/me/offers` | ⏸️ |
| 21 | Counter offer | `PUT /offers/[id]/counter` | ⏸️ |
| 22 | Accept counter | `PUT /offers/[id]/accept-counter` | ⏸️ |
| 23 | Get active jobs | `GET /workers/me/jobs/active` | ⏸️ |
| 24 | Start visit | `PUT /jobs/[id]/visit/start` | ⏸️ |
| 25 | I've arrived (trigger commission hold) | `PUT /jobs/[id]/visit/arrive` | ⏸️ |
| 26 | Start inspection | `PUT /jobs/[id]/inspection/start` | ⏸️ |
| 27 | Submit inspection | `POST /jobs/[id]/inspection` | ⏸️ |
| 28 | Update location (real-time) | `PUT /workers/me/location` | ⏸️ |

**PostGIS Matching:**
```sql
ST_DWithin(worker_location, ST_MakePoint(:lng, :lat)::geography, :radius_meters)
```

**Rules:**
- One offer per job per worker (enforce server-side)
- Bounded negotiation rounds
- Price locking on acceptance
- State machine: open → receiving_offers → offer_accepted → visit_in_progress → visit_completed → inspection_done → repair_negotiating → repair_approved → repair_in_progress → completed
- Real-time updates via Socket.IO

---

### M3: Repair + Wallet + Commission + Chat + Notifications

| # | Task | API Endpoint | Status |
|---|------|-------------|--------|
| 29 | Repair negotiation (accept/counter) | `PUT /jobs/[id]/repair/counter` | ⏸️ |
| 30 | Approve repair | `PUT /jobs/[id]/repair/approve` | ⏸️ |
| 31 | Start repair | `PUT /jobs/[id]/repair/start` | ⏸️ |
| 32 | Complete repair | `PUT /jobs/[id]/repair/complete` | ⏸️ |
| 33 | Scope-change request | `POST /jobs/[id]/repair/scope-change` | ⏸️ |
| 34 | Get wallet balance | `GET /wallet/balance` | ⏸️ |
| 35 | Get wallet ledger | `GET /wallet/ledger` | ⏸️ |
| 36 | Wallet top-up (upload screenshot) | `POST /wallet/topup` | ⏸️ |
| 37 | Get top-up status | `GET /wallet/topup/status` | ⏸️ |
| 38 | Hold commission (on arrive) | `POST /wallet/hold-commission` | ⏸️ |
| 39 | Confirm commission (on OTP) | `POST /wallet/confirm-commission` | ⏸️ |
| 40 | Reverse commission (on cancel) | `POST /wallet/reverse-commission` | ⏸️ |
| 41 | Get earnings summary | `GET /workers/me/earnings` | ⏸️ |
| 42 | Chat — send message | `POST /chat/send` | ⏸️ |
| 43 | Chat — get history | `GET /chat/[jobId]` | ⏸️ |
| 44 | Notifications — list | `GET /notifications` | ⏸️ |
| 45 | Notifications — mark read | `PUT /notifications/read` | ⏸️ |
| 46 | File upload (photos, documents, chat images) | `POST /uploads` | ⏸️ |
| 47 | Socket.IO setup (real-time events) | WebSocket | ⏸️ |

**Wallet Rules:**
- Every worker starts at Rs. 0
- Commission = 10% of visit charge
- Hold on arrive, deduct on OTP confirmation
- Reverse if job cancelled before OTP
- Insufficient balance → block arrive
- Idempotent movements (Redis keys)
- Platform wallet stores all commission

---

## WHAT YOU NEED FROM YOUR PARTNER (Shahzad)

| When | What You Need |
|------|---------------|
| M1 | UI testing for auth + onboarding flow |
| M2 | API contract agreement (request/response shapes) |
| M3 | Integration testing for wallet, chat, notifications |

---

## TECH STACK

- **Framework:** NestJS (modular monolith)
- **ORM:** Prisma
- **Database:** PostgreSQL + PostGIS
- **Cache:** Redis
- **Queue:** BullMQ
- **Real-time:** Socket.IO
- **File Storage:** S3 (production) / MinIO (dev)

---

## RULES TO FOLLOW

1. **OTP rules are non-negotiable.** 5 min valid, 15 min re-request, 3 attempts, rate-limited.
2. **Passwords hashed with bcrypt only.**
3. **Token lifetimes:** access 15 min, refresh 30 days.
4. **Role separation:** Worker routes reject Customer and Admin tokens.
5. **PostGIS for distance matching** — no manual distance scripts.
6. **One offer per job per worker** — enforced server-side.
7. **Bounded negotiation** — round counter stops infinite haggling.
8. **Price locking** — agreed prices locked; repair scope changes need explicit re-approval.
9. **Commission = 10% of visit charge only.** Hold on arrive, deduct on OTP, reverse on cancel.
10. **Wallet is ACTIVE.** Every worker has a wallet starting at Rs. 0.
11. **Insufficient balance blocks arrival** — Arrive button disabled until wallet has enough.
12. **All money movements idempotent** — Redis idempotency keys.
13. **Platform wallet** stores all deducted commissions separately.
14. **Real-time events** — emit Socket.IO events for all state changes.
15. **Audit trail** — log all important actions.

---

## DONE CHECKLIST

- [ ] Auth: OTP (5min/15min/3 attempts) + bcrypt + JWT (15min/30 days) + role guard
- [ ] Onboarding APIs (6 steps incl. skills + service areas + documents)
- [ ] Verification workflow (approved/rejected/request-changes + re-submit)
- [ ] Jobs feed API with PostGIS `ST_DWithin` + all 5 filters
- [ ] Offers: send (one per job), counter (bounded), accept/reject, real-time close to others
- [ ] Visits: state machine + live location tracking
- [ ] Inspection submission (diagnosis, repair plan, estimate, photos, time)
- [ ] Repair: bounded negotiation, locked price, scope-change re-approval, complete
- [ ] Commission: 10% per visit charge, Hold on arrive / Deducted on OTP / Reversed on cancel
- [ ] Wallet module: Rs. 0 start, top-up via screenshot, commission auto-deduction, platform wallet, ledger, idempotent
- [ ] Chat: real-time + images, scoped to active jobs
- [ ] Notifications: all events + unread tracking
- [ ] File upload with compression (S3/MinIO)
- [ ] Socket.IO events for all real-time updates
