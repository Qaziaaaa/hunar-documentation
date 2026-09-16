# HUNAR — Module 3: Full Admin Flow (A to Z)

## Purpose of this document
This module explains the **complete admin journey** inside HUNAR — from secure login, through the analytics dashboard, user/work verification, live job and payment monitoring, dispute handling, category management, platform controls, and account action (suspension/deactivation). Every screen and rule is described exactly as required. No extra features are added, and no required feature is missing.

The **Admin** is the platform operator who keeps HUNAR safe, verified, and running smoothly. Admin has a **dedicated dashboard** that is completely separate from the Customer and Worker dashboards.

---

## 1. Roles & Access Model

| Role | Own Dashboard |
|---|---|
| Customer | Customer Dashboard |
| Worker | Worker Dashboard |
| **Admin** | **Admin Dashboard** |

Only authorized admin accounts can access the admin surface. Admin entry is **highly protected** (separate secure login, role-guarded routes, throttled).

---

## 2. Admin Lifecycle (Big Picture)

```
1. Secure Admin Login → 2. Admin Dashboard (KPIs)
→ 3. Verify Workers → 4. Manage Users → 5. Monitor Jobs/Payments/Disputes
→ 6. Manage Categories → 7. Platform Controls → 8. Account Action (Suspend) → 9. Reports
```

---

## 3. Step A — Secure Admin Login

**This is the ONLY way into the admin area.**

- A dedicated admin sign-in screen (visually distinct, no customer/worker branding).
- Credentials: **admin email/username + password** (not phone-OTP; a hardened login path).
- The admin account carries the **ADMIN** role; backend guards reject any non-admin token from every admin endpoint.
- **Rate limiting & throttling** apply (block brute-force attempts).
- Login attempts and admin actions are **audit-logged**.
- After login: **access token (15 min) + refresh token (30 days)** same as other roles, plus role-checking on every request.

---

## 4. Step B — Admin Dashboard (Analytics & Overview)

The admin's home screen is a **live operations dashboard**.

### 4.1 KPI stat cards (top row)
- **Total Jobs** (open / active / completed / cancelled breakdowns)
- **Total Customers** (count, new this week)
- **Total Workers** (registered / verified / pending / suspended)
- **Total Revenue** (platform commission earned) & **total payments processed**
- **Active now** (live jobs in progress — near-realtime)

### 4.2 Main sections (admin navigation)

| Item | Purpose |
|---|---|
| Dashboard | KPI overview |
| Users | Customers & Workers management |
| Verifications | Worker document review queue |
| Jobs | Job/booking monitoring |
| Payments | Payment & wallet / txn monitoring |
| Disputes | Reports & conflict resolution |
| Categories | Service category management |
| Reports | Analytics exports / insights |
| Settings | Platform configuration & commission |
| Alerts / Notifications | System & user alerts |

---

## 5. Step C — User Management

### 5.1 Customers list
- Table of all customers: name, phone, join date, jobs posted, total spent, rating given, status.
- **Search** by name / phone.
- **Filters:** status (active/suspended), join date range.
- Row actions:
  - View customer profile (all their jobs, payments, reviews).
  - **Suspend / Deactivate** account (blocks login + posting) — see §9.
  - Reactivate.
  - Leave admin note (internal).

### 5.2 Workers list
- Table of all workers: name, phone, skills, verification status, rating, earnings, wallet balance, status (online/offline), registration date.
- **Search** by name / phone / trade.
- **Filters:** verification status, online/offline, suspended.
- Row actions:
  - View full worker profile (documents, jobs, earnings, reviews).
  - **Verify / Reject** (pending items).
  - **Suspend / Deactivate** — immediate effect: no new offers, no new matching (existing jobs handled by rules).
  - Reactivate.
  - **Wallet view** — ledger + top-ups + withdrawals.

**Access control:** only admin can change user status. Customers and workers cannot.

---

## 6. Step D — Worker Verification Queue (the core admin duty)

Workers cannot work until an admin approves them. This is a **human decision**; it is not automatic.

### 6.1 The verification screen
- Pending submissions appear as a **review queue**.
- Each item shows:
  - Worker identity (name, phone, photo)
  - **Skills**
  - **Experience** + bio
  - **Service areas**
  - **Documents:** CNIC front/back + any certificates (viewable/high-res)
- Admin examines the documents for authenticity and consistency.

### 6.2 Decision actions
- **Approve** → profile becomes **verified** (teal verified badge becomes visible to customers; worker can now match, offer, visit, and earn).
- **Reject** → profile rejected; worker gets the reason and a chance to re-submit.
- **Request Changes** → admin notes what to fix; worker edits and re-submits.

### 6.3 Re-verification
- If a worker changes identity documents, the profile goes back to **pending verification** automatically until the admin approves again.
- Admin can also manually revoke a previously granted verification.

---

## 7. Step E — Job / Operations Monitoring

### 7.1 Active & all jobs
Admin can browse every job (open, receiving-offers, active, completed, cancelled, disputed) with:
- Job ID, category, problem, media
- Customer (who posted)
- Worker (who was selected)
- Status & current stage (timeline)
- Visit charge / repair estimate / total
- Location
- Timestamps

**Live view:** active jobs ticking through the state machine in near-realtime (Socket.IO) — the admin sees "live" progress without refresh.

### 7.2 Drill-down per job
Admin opens a job to see the full **audit history**: every offer, counter, acceptance, visit step, inspection, approval, payment, and review — with timestamps. This is the record used to resolve any dispute.

---

## 8. Step F — Payment & Wallet Monitoring (Oversight)

Admin monitors money movement with **read/oversight control** (the actual wallet mechanics are automatic — see Module 1 §12).

- **Transactions feed:** all wallet ledger entries (earnings credits, commissions deducted, top-ups, withdrawals) with worker, amount, type, timestamp.
- **Payments feed:** all customer payments (amount, method, job, worker, date, status).
- **Commission snapshot:** total platform revenue earned (10% of visit charges) + rate per transaction.
- **Withdrawal queue:** requested payouts and their status (processed / pending / failed).
- **Flaging:** anomaly views (e.g., unusual withdrawal patterns) surfaced for review.

Admin actions here are administrative (view/resolve/freeze a wallet in a dispute), not manual money-moving — automatic ledger logic stays automatic to prevent double-charging (idempotency enforced).

---

## 9. Step G — Account Action: Suspend / Deactivate

A direct, well-defined control used when a user violates rules or a dispute requires it.

### 9.1 What suspension does
- **Customer suspension:** cannot log in / post new jobs. Existing jobs follow policy (admin can assist completion or cancel).
- **Worker suspension:** cannot match new jobs, cannot send/receive new offers, cannot chat new conversations. Already-scheduled or in-progress visits are handled case-by-case by admin.

### 9.2 How it's done
1. Admin picks the user from Users → **Suspend**.
2. Reason is mandatory (stored in the audit log).
3. The user is notified (clear, impersonal message).
4. Admin can **Reactivate** anytime; a note of reactivation is also logged.
5. Every suspend/activate action is **audit-trailed**.

### 9.3 When used
- Reported fraud / violation of terms
- Repeated no-shows or poor reliability
- Dispute escalation requiring a hold
- Verification failure or impersonation

---

## 10. Step H — Disputes & Reports (Resolution)

Customers and workers can report problems (`Dispute` / `Report`). The admin resolves them.

### 10.1 Incoming reports
- Queue of reports: type (customer-vs-worker, worker-vs-customer, tech/abuse), reporter, reported user, reason, job reference, media, timestamps.

### 10.2 Resolution workflow
1. Admin opens the report.
2. Admin views the **full job evidence** (offers, messages, inspection photos, approval records, payment records) — the built-in audit trail is the dispute evidence.
3. Admin decides:
   - **Resolve** in favor of one party (adjusts outcome / restores wallet credit / mandates refund where applicable).
   - **Dismiss** (no action — e.g., baseless report).
   - **Escalate** to manual/senior attention for complex cases.
4. Parties are notified of the outcome.
5. Every decision is recorded (audit + dispute state history).

### 10.3 Protection rules to respect
- A customer's complaint about **price changing after inspection** is directly answerable by the built-in "locked repair price + explicit scope-change approval" rule: the admin checks whether the worker violated it.
- **No-show** reports signal reliability problems; admin can track repeat offenders.

---

## 11. Step I — Service Category Management

The admin controls which services exist on the platform.

- **Add a new category** (e.g., a new trade).
- **Edit** name / icon / description / sort order.
- **Deactivate** a category (no new jobs; existing jobs complete).
- Categories feed both the customer "Post a Job" wizard and the worker skill selection.

When a category changes, worker skill lists and customer dropdowns update accordingly.

---

## 12. Step J — Platform Settings & Controls

### 12.1 Commission control (super-admin only)
- The platform **commission rate** (default **10%** of the visiting charge) is configurable.
- Changing the rate is a **super-admin** privilege (sensitive): ordinary admins can view but not change it.
- Any change is audit-logged (who, from, to, when).
- Future rate ideas (per-category rates) are an updation item — see Module 4; MVP = single global 10%.

### 12.2 Other platform settings
- Service-area / radius defaults (worker match radius).
- Limits: max photos per job, allowed file types (validated systemwide).
- Notification / system-message broadcasting to all users (announcements).
- Environment-level toggles (feature flags) so features can be turned on/off safely.

---

## 13. Step K — Reports & Analytics

Admin can pull and view reports (for decisions, not complex BI in MVP):
- Jobs funnel (posted → offers → accepted → completed)
- Worker performance (verification %, ratings, cancellations, no-shows)
- Revenue (commission collected, top categories)
- User growth (customers/workers over time)
- Export as needed (CSV/PDF where available)

**Not in MVP** (per scope): heavy predictive analytics/BI dashboards — those are a later updation (Module 4).

---

## 14. Alerts & Notifications (Admin)

Admin receives operational alerts in-app (with unread badges):
- New worker submissions awaiting verification
- New dispute/report to review
- Payment/withdrawal failures
- Worker offline due to low wallet (threshold events)
- Suspicious activity patterns
- System health issues

---

## 15. Audit Trail (Foundation of Admin Work)

Every important action is logged with who/what/when:
- Login / logout
- Verification decisions (approve/reject/request-changes)
- Suspend / reactivate
- Commission changes
- Dispute resolutions
- Category changes

This log is the **single source of truth** for accountability and dispute resolution.

---

## 16. Edge Cases & Rules (Admin)

| Scenario | Behavior |
|---|---|
| Worker's documents look fake | Reject with reason; worker may re-submit; repeat offenders watched. |
| Worker wallet goes very negative | Admin view shows it; new matching blocked automatically; admin may flag for review. |
| Both parties dispute a payment | Admin reviews evidence trail; can resolve (credit/refund) via wallet ledger. |
| Category being deactivated has active jobs | Existing jobs finish; new posts blocked for that category. |
| Admin needs to force a job cancel | Allowed with mandatory reason + audit; parties notified. |
| Highly sensitive action (commission change) | Super-admin only; logged; reversible with another logged change. |
| Account deletion request | Admin can permanently delete (GDPR-style) with full audit confirmation. |

---

## 17. Complete Admin Flow Summary (A to Z, one list)

| # | Step | Where |
|---|---|---|
| 1 | Secure admin login (role-guarded, throttled) | Auth |
| 2 | View live KPI dashboard | Dashboard |
| 3 | Review & verify/reject worker submissions | Verifications |
| 4 | Manage customers (view/suspend/reactivate) | Users |
| 5 | Manage workers (view/status/wallet) | Users |
| 6 | Monitor jobs live (state machine + drill-down audit) | Jobs |
| 7 | Monitor payments, commissions & withdrawals | Payments |
| 8 | Suspend/deactivate accounts with reason | Users |
| 9 | Resolve disputes using job evidence trail | Disputes |
| 10 | Manage service categories (add/edit/deactivate) | Categories |
| 11 | Set platform settings (commission super-admin only, feature flags) | Settings |
| 12 | View & export reports | Reports |
| 13 | Handle alerts & audit everything | Alerts / Audit |

---

## 18. Design & UX Conventions (Admin Surface)

The Admin Dashboard uses the same HUNAR design tokens (per the admin design prototype):

- **Sidebar navigation** with grouped sections (Dashboard, Users, Jobs, Payments, Disputes, Categories, Reports, Settings…)
- **KPI cards** with clear stat values + small trend lines
- **Tables** with search, sort, and filter controls
- **Status chips:** Pending = Orange `#F59E0B`; Approved/Active = Teal `#0F8B8D`; In Progress = Navy `#123B5D`; Completed/Paid = Green `#16A34A`; Rejected/Suspended/Cancelled = Red `#DC2626`
- **Background `#F8FAFC`, white cards**, Navy headings `#123B5D`, gray secondary text `#64748B`
- Dense but readable operations layout; every destructive action requires confirm + reason
- Everything admin does leaves a visible audit entry.