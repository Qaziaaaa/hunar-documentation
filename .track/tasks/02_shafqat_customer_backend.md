# SHAFQAT ULLAH — CUSTOMER FLOW BACKEND (A to Z)

## Status: 🟢 ACTIVE (resumed) — 74% ✅ (VERIFIED 2026-09-22 — build passes)

Shafqat resumed backend on 09-22: payments module (wallet balance/ledger/topup/commission hold-confirm-reverse, earnings) + customer auth APIs merged to origin/dev. Rule: work counts for the person assigned it — customer flow APIs built in shared modules count for Shafqat.

---

## Your Role
Backend Developer — Full Customer Flow APIs

## Your Partner
**Abdullah** (Frontend) — You coordinate on API contracts. He builds the UI, you build the APIs.

## Your Flow
All backend APIs for the customer journey: auth, job posting, offers, payments, reviews, notifications.

## Source Documents
- `Project Modules/02_Customer_Flow.md` — Full requirements
- `members/Shafqat Ullah MD/` — Your architecture docs

---

## MILESTONES

### M1: Auth APIs

| # | Task | API Endpoint | Status |
|---|------|-------------|--------|
| 1 | Customer sign-up (phone → OTP → password) | `POST /auth/customer/signup` | ⏸️ |
| 2 | Request OTP | `POST /auth/customer/otp/request` | ⏸️ |
| 3 | Verify OTP | `POST /auth/customer/otp/verify` | ⏸️ |
| 4 | Complete signup (set password) | `POST /auth/customer/signup/complete` | ⏸️ |
| 5 | Customer login (phone + password) | `POST /auth/customer/login` | ⏸️ |
| 6 | Refresh token | `POST /auth/customer/refresh` | ⏸️ |
| 7 | Role guard middleware | Middleware | ⏸️ |

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

### M2: Job & Offer APIs

| # | Task | API Endpoint | Status |
|---|------|-------------|--------|
| 8 | Post a job (service, problem, media, location, time) | `POST /jobs` | ⏸️ |
| 9 | Get my jobs (all statuses) | `GET /jobs/customer` | ⏸️ |
| 10 | Get job detail (with offers) | `GET /jobs/[id]` | ⏸️ |
| 11 | Get offers for a job | `GET /jobs/[id]/offers` | ⏸️ |
| 12 | Accept an offer | `POST /offers/[id]/accept` | ⏸️ |
| 13 | Counter an offer | `POST /offers/[id]/counter` | ⏸️ |
| 14 | Reject an offer | `POST /offers/[id]/reject` | ⏸️ |
| 15 | Worker profile (for customer view) | `GET /workers/[id]` | ⏸️ |
| 16 | Cancel job | `PUT /jobs/[id]/cancel` | ⏸️ |

**Rules:**
- One offer per job per worker (enforce server-side)
- Bounded negotiation rounds (stop after fixed limit)
- Price locking on acceptance
- Real-time updates via Socket.IO (offer accepted → all other workers see "Closed")

---

### M3: Payment, Review & Notification APIs

| # | Task | API Endpoint | Status |
|---|------|-------------|--------|
| 17 | Process payment (demo wallet / cash / card mock) | `POST /payments` | ⏸️ |
| 18 | Payment history | `GET /payments/customer` | ⏸️ |
| 19 | Submit review (1-5 stars + text) | `POST /reviews` | ⏸️ |
| 20 | Get my reviews | `GET /reviews/customer` | ⏸️ |
| 21 | Get worker reviews (for profile) | `GET /workers/[id]/reviews` | ⏸️ |
| 22 | Inspection report (worker submits, customer views) | `GET /jobs/[id]/inspection` | ⏸️ |
| 23 | Approve / counter repair estimate | `PUT /jobs/[id]/repair/approve` | ⏸️ |
| 24 | Customer notifications | `GET /notifications` | ⏸️ |
| 25 | Mark notifications read | `PUT /notifications/read` | ⏸️ |
| 26 | Chat (send message, get history) | `POST /chat/send`, `GET /chat/[jobId]` | ⏸️ |
| 27 | File upload (photos, voice notes) | `POST /uploads` | ⏸️ |

---

## WHAT YOU NEED FROM YOUR PARTNER (Abdullah)

| When | What You Need |
|------|---------------|
| M1 | UI testing for auth flow |
| M2 | API contract agreement (request/response shapes) |
| M3 | Integration testing for payments, reviews, chat |

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
4. **Role separation:** Customer routes reject Worker and Admin tokens.
5. **One offer per job per worker** — enforced server-side.
6. **Bounded negotiation** — round counter stops infinite haggling.
7. **Price locking** — agreed prices locked; no silent changes.
8. **All money movements idempotent** — prevent double-charges.
9. **Real-time events** — emit Socket.IO events for offer changes, new messages.
10. **Audit trail** — log all important actions.

---

## DONE CHECKLIST

- [ ] Auth: OTP (5min/15min/3 attempts) + bcrypt + JWT (15min/30 days) + role guard
- [ ] Job posting APIs (create, list, detail)
- [ ] Offer APIs (send, counter, accept, reject, bounded rounds)
- [ ] Payment APIs (process, history)
- [ ] Review APIs (submit, list, average rating)
- [ ] Inspection APIs (view report)
- [ ] Repair approval APIs (approve, counter)
- [ ] Notification APIs (list, mark read)
- [ ] Chat APIs (send, history, real-time)
- [ ] File upload (photos, voice notes)
- [ ] Socket.IO events for all real-time updates
