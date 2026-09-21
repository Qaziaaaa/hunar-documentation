# HASHIM — AUTH SHARED + ADMIN DASHBOARD BACKEND

## Status: 🟡 IN PROGRESS (41% — VERIFIED)

**Verified: Build passes, 10/11 tests pass, code reviewed.**

Auth module DONE. Admin verification DONE. Users DONE. Notifications DONE.
Remaining: Admin main controller/service, Admin middleware, Customer profile, Firebase, SMS.

---

## Your Role

Backend Developer — Shared Auth APIs + Full Admin Dashboard APIs

## Your Partner

**Faizan** (Frontend) — You coordinate on API contracts. He builds the UI, you build the APIs.

## Your Flow

1. Auth module (shared across all roles — customer, worker, admin)
2. Full admin dashboard APIs (user management, verifications, jobs, payments, disputes, categories, settings, reports, audit)

## Source Documents

- `Project Modules/03_Admin_Flow.md` — Full admin requirements
- `Project Modules/01_Worker_Flow.md` — Auth requirements (Sections 3.1, 3.2)
- `Project Modules/02_Customer_Flow.md` — Auth requirements (Sections 3.1, 3.2)
- `members/hakimullah/backend-architecture.md` — Backend architecture reference

---

## MILESTONES

### M1: Auth Module (Shared)

| #   | Task                                            | API Endpoint                 | Status |
| --- | ----------------------------------------------- | ---------------------------- | ------ |
| 1   | Request OTP (shared for all roles)              | `POST /auth/otp/request`     | ✅     |
| 2   | Verify OTP                                      | `POST /auth/otp/verify`      | ✅     |
| 3   | Complete signup (set password, assign role)     | `POST /auth/signup/complete` | ✅     |
| 4   | Login (phone + password for customer/worker)    | `POST /auth/login`           | ✅     |
| 5   | Admin login (email + password)                  | `POST /auth/admin/login`     | ✅     |
| 6   | Refresh token                                   | `POST /auth/refresh`         | ✅     |
| 7   | Logout                                          | `POST /auth/logout`          | ✅     |
| 8   | Role guard middleware (CUSTOMER, WORKER, ADMIN) | Middleware                   | ✅     |
| 9   | Rate limiting middleware                        | Middleware                   | ✅     |

**OTP Rules (enforce strictly):**

- Valid for **5 minutes**
- Re-request at most once per **15 minutes**
- Max **3 failed attempts** before invalidation
- Rate-limit repeated requests

**Token Rules:**

- Access token: **15 minutes**
- Refresh token: **30 days**
- Password: **bcrypt hash**

**Role Rules:**

- Exactly 3 roles: CUSTOMER, WORKER, ADMIN
- One role per account, never switches
- Admin uses email + password (not phone + OTP)
- All admin endpoints require ADMIN role

---

### M2: User Management + Verification APIs

| #   | Task                                                            | API Endpoint                                    | Status |
| --- | --------------------------------------------------------------- | ----------------------------------------------- | ------ |
| 10  | Get all customers (list with search/filter)                     | `GET /admin/customers`                          | ✅     |
| 11  | Get customer detail (profile, jobs, payments, reviews)          | `GET /admin/customers/[id]`                     | ✅     |
| 12  | Suspend customer (with reason)                                  | `PUT /admin/customers/[id]/suspend`             | ✅     |
| 13  | Reactivate customer                                             | `PUT /admin/customers/[id]/reactivate`          | ✅     |
| 14  | Get all workers (list with search/filter)                       | `GET /admin/workers`                            | ✅     |
| 15  | Get worker detail (profile, documents, jobs, earnings, reviews) | `GET /admin/workers/[id]`                       | ✅     |
| 16  | Suspend worker (with reason)                                    | `PUT /admin/workers/[id]/suspend`               | ✅     |
| 17  | Reactivate worker                                               | `PUT /admin/workers/[id]/reactivate`            | ✅     |
| 18  | Get verification queue (pending submissions)                    | `GET /admin/verifications`                      | ✅     |
| 19  | Get verification detail (documents, skills, experience)         | `GET /admin/verifications/[id]`                 | ✅     |
| 20  | Approve verification                                            | `PUT /admin/verifications/[id]/approve`         | ✅     |
| 21  | Reject verification (with reason)                               | `PUT /admin/verifications/[id]/reject`          | ✅     |
| 22  | Request changes (with notes)                                    | `PUT /admin/verifications/[id]/request-changes` | ✅     |
| 23  | Revoke verification                                             | `PUT /admin/verifications/[id]/revoke`          | ✅     |

**Rules:**

- Only admin can change user status
- Suspend requires mandatory reason (stored in audit log)
- Re-verification triggered automatically when worker changes identity documents
- Every action is audit-trailed

---

### M3: Jobs, Payments, Disputes, Categories, Settings, Reports

| #   | Task                                                           | API Endpoint                            | Status |
| --- | -------------------------------------------------------------- | --------------------------------------- | ------ |
| 24  | Get all jobs (list with filters)                               | `GET /admin/jobs`                       | ✅     |
| 25  | Get job detail (full audit history)                            | `GET /admin/jobs/[id]`                  | ✅     |
| 26  | Force cancel job (with reason)                                 | `PUT /admin/jobs/[id]/cancel`           | ✅     |
| 27  | Get transactions feed (wallet ledger)                          | `GET /admin/transactions`               | ✅     |
| 28  | Get payments feed                                              | `GET /admin/payments`                   | ⏸️     |
| 29  | Commission snapshot (total + per transaction)                  | `GET /admin/commission`                 | ⏸️     |
| 30  | Get withdrawal queue                                           | `GET /admin/withdrawals`                | ⏸️     |
| 31  | Process withdrawal                                             | `PUT /admin/withdrawals/[id]/process`   | ⏸️     |
| 32  | Freeze wallet (in dispute)                                     | `PUT /admin/wallet/[workerId]/freeze`   | ⏸️     |
| 33  | Get disputes queue                                             | `GET /admin/disputes`                   | ⏸️     |
| 34  | Get dispute detail (evidence trail)                            | `GET /admin/disputes/[id]`              | ⏸️     |
| 35  | Resolve dispute (favor one party)                              | `PUT /admin/disputes/[id]/resolve`      | ⏸️     |
| 36  | Dismiss dispute                                                | `PUT /admin/disputes/[id]/dismiss`      | ⏸️     |
| 37  | Escalate dispute                                               | `PUT /admin/disputes/[id]/escalate`     | ⏸️     |
| 38  | Get categories                                                 | `GET /admin/categories`                 | ⏸️     |
| 39  | Add category                                                   | `POST /admin/categories`                | ⏸️     |
| 40  | Edit category                                                  | `PUT /admin/categories/[id]`            | ⏸️     |
| 41  | Deactivate category                                            | `PUT /admin/categories/[id]/deactivate` | ⏸️     |
| 42  | Get platform settings                                          | `GET /admin/settings`                   | ⏸️     |
| 43  | Update commission rate (super-admin only)                      | `PUT /admin/settings/commission`        | ⏸️     |
| 44  | Update other settings                                          | `PUT /admin/settings`                   | ⏸️     |
| 45  | Get reports (jobs funnel, worker performance, revenue, growth) | `GET /admin/reports/[type]`             | ⏸️     |
| 46  | Export report (CSV/PDF)                                        | `GET /admin/reports/[type]/export`      | ⏸️     |
| 47  | Get audit trail                                                | `GET /admin/audit`                      | ⏸️     |
| 48  | Admin notifications                                            | `GET /admin/notifications`              | ⏸️     |
| 49  | Mark notifications read                                        | `PUT /admin/notifications/read`         | ⏸️     |

**Rules:**

- Commission rate change is super-admin only (sensitive)
- Every change is audit-logged (who, from, to, when)
- Category deactivation: existing jobs finish, new posts blocked
- Force cancel requires mandatory reason + audit
- Dispute resolution uses job evidence trail (built-in audit)

---

## WHAT YOU NEED FROM YOUR PARTNER (Faizan)

| When | What You Need                                    |
| ---- | ------------------------------------------------ |
| M1   | UI testing for admin login                       |
| M2   | API contract agreement (request/response shapes) |
| M3   | Integration testing for all admin screens        |

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
4. **Role separation:** ADMIN routes reject CUSTOMER and WORKER tokens.
5. **Admin login uses email + password** (not phone + OTP).
6. **Commission rate change is super-admin only** — ordinary admins can view but not change.
7. **Every admin action is audit-logged** — who, what, when.
8. **Suspend requires mandatory reason** — stored in audit log.
9. **Dispute resolution uses job evidence trail** — built-in audit is the source of truth.
10. **Category deactivation** — existing jobs finish, new posts blocked.
11. **Force cancel requires mandatory reason** + audit + parties notified.
12. **All money movements idempotent** — prevent double-charges.
13. **Real-time events** — emit Socket.IO events for admin alerts.
14. **Audit trail** — log everything: login, verification decisions, suspend/reactivate, commission changes, dispute resolutions, category changes.

---

## DONE CHECKLIST

- [x] Auth: OTP (5min/15min/3 attempts) + bcrypt + JWT (15min/30 days) + role guard
- [x] Admin login (email + password)
- [x] Role guard middleware (CUSTOMER, WORKER, ADMIN)
- [x] Rate limiting middleware
- [x] Customer management APIs (list, detail, suspend, reactivate)
- [x] Worker management APIs (list, detail, suspend, reactivate)
- [x] Verification workflow APIs (queue, detail, approve, reject, request-changes, revoke)
- [ ] Jobs monitoring APIs (list, detail, force cancel)
- [ ] Payment monitoring APIs (transactions, payments, commission)
- [ ] Withdrawal queue APIs (list, process)
- [ ] Wallet freeze API
- [ ] Dispute APIs (queue, detail, resolve, dismiss, escalate)
- [ ] Category management APIs (list, add, edit, deactivate)
- [ ] Platform settings APIs (get, update commission, update other)
- [ ] Reports APIs (jobs funnel, worker performance, revenue, growth)
- [ ] Export APIs (CSV/PDF)
- [ ] Audit trail API
- [ ] Admin notification APIs (list, mark read)
- [ ] Socket.IO events for admin alerts
