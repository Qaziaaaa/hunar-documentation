# Module 17 — Admin Operations

## 1. What this module is

This module is the **control room** of the platform — the admin panel where staff
manage everything:

- see platform statistics,
- review worker verification requests,
- manage users (search, view, suspend/reactivate),
- manage service categories,
- monitor jobs, bookings, and payments,
- handle flagged reviews and disputes,
- review audit logs,
- configure platform settings.

## 2. Why we build it

Without admin control, the marketplace cannot stay trustworthy:
- unverified or fake workers would flood the platform,
- bad reviews would harm good workers,
- disputes would have no process,
- nobody would know how healthy the platform is.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Admin | Everything in this module |
| Super Admin (extension of admin) | Platform settings like commission rates, limits |
| System | Enforces that only admins can access admin features |

## 4. Main screens / features

- **Dashboard** — stat cards: total users, workers, jobs, active jobs, completed jobs,
  revenue/commission, pending verifications, active disputes.
- **User management** — list + search + detail; suspend/reactivate.
- **Worker verification queue** — pending cases with documents (Module 15) and approve/reject.
- **Verification history** — past decisions with reasons.
- **Category management** — CRUD/order/activation (Module 03).
- **Job monitoring** — browse jobs, view detail, correct stuck states (audited).
- **Payment monitoring** — transactions, statuses, payout overviews (Module 10).
- **Review moderation** — flagged reviews queue (Module 11).
- **Dispute queue** — cases to resolve (Module 18).
- **Audit log viewer** — what happened, who did it, when (Module 19).
- **Settings** — commission rate, matching radius, notification limits (Super Admin).

## 5. What data this module reads/writes

It mostly **reads** everything and **writes only controlled admin actions**:

- approve/reject verification,
- suspend/reactivate accounts,
- deactivate categories,
- resolve disputes,
- moderate reviews,
- correct stuck states,
- change platform settings.

Every admin write produces an **audit entry** (Module 19).

## 6. Main workflows

### Workflow A — Worker verification review

1. Dashboard shows "N pending verifications".
2. Admin opens a case → sees worker info + documents + submitted data.
3. Admin approves (worker verified) or rejects (with a reason).
4. The worker is notified (Module 13); matching becomes possible (Module 05).
5. Everything is audited.

### Workflow B — Suspend/reactivate a user

1. Admin opens a user's detail.
2. Admin suspends with a written reason (after a complaint, Module 18).
3. The account cannot log in or act (Module 01).
4. Admin can reactivate later; the history persists.

### Workflow C — Fix a stuck job

1. Support identifies a job stuck in a state (Module 09).
2. Admin reviews the history and performs a **corrected transition** (e.g. back to a valid state).
3. The correction is logged with the admin and reason; notifications are sent to affected users.

### Workflow D — Resolve a dispute

(Detailed in Module 18 — admin role here: read evidence, decide, apply refund/release.)

### Workflow E — Change a platform setting

1. Super Admin opens Settings.
2. Changes rate/limit; sees a confirmation summary.
3. The change is logged; a note shows "changed by X at Y from A to B".

## 7. Business rules (the system MUST)

1. **Admin actions require admin/super-admin role and authentication** — enforced server-side.
2. Every admin write action is recorded in the audit log (who, what, when, before/after).
3. Sensitive admin views (documents, payment details) show masked values where needed.
4. Admin edits never directly hack around the state machine without a logged correction flow.
5. Suspension is reversible; deactivation intent is preserved in history.
6. Admin search respects role hierarchy (Super Admin can see more than a normal admin — decided later).
7. Only a correction flow can change a completed/cancelled state; it is the exception path, not the norm.
8. Dashboard numbers are computed from real data (jobs, users, payments, reviews).
9. Admin settings changes are versioned/audited so the team knows when a rate changed.

## 8. Edge cases the system must handle safely

- Admin rejects a worker by mistake → the worker can resubmit; the rejection reason is clear.
- Admin suspends the wrong user → reversible; audit trail explains; support apologized via a note.
- Two admins process the same verification case simultaneously → only one decision sticks.
- Admin opens a payment detail that a customer flagged → sensitive values masked; no secrets leaked.
- A worker whose case is pending logs in → clearly told "awaiting review" with status.
- Playing with settings by an unauthorized admin → blocked by role checks.
- Stuck-job correction conflicts with an ongoing real-time state change → one wins; the other retries.

## 9. Connections to other modules

| Module | How they connect |
|---|---|
| 01 Auth & Accounts | Account suspension/reactivation |
| 02 Profiles & Verification | Verification queue and decisions |
| 03 Service Categories | Category management |
| 09 Execution & Completion | Stuck-state corrections |
| 10 Payments & Wallet | Payment monitoring, payout runs, settings |
| 11 Reviews & Ratings | Review moderation queue |
| 13 Notifications | Admin decisions trigger notifications |
| 15 File Uploads & Media | Document viewing |
| 16 Search & Filtering | Admin search |
| 18 Disputes & Support | Dispute resolution |
| 19 Security & Audit | Everything is audited |

## 10. Definition of done

- [ ] Admin dashboard shows the required statistics from real data.
- [ ] Verification queue → approve/reject with reasons and notifications.
- [ ] User search + suspend/reactivate with reasons and audit.
- [ ] Category management.
- [ ] Payment monitoring (masked values).
- [ ] Flagged-review queue and moderation decisions.
- [ ] Stuck-job correction flow (audited, exception-only).
- [ ] Settings page for rates/limits (Super Admin) with change history.
- [ ] Every admin write appears in the audit log.
- [ ] Module 21 tests cover role enforcement, simultaneous decisions, and audit completeness.