# FAIZAN — AUTH SHARED + ADMIN DASHBOARD FRONTEND

## Your Role
Frontend Developer — Shared Auth Components + Full Admin Dashboard

## Your Partner
**Hashim** (Backend) — You coordinate on API contracts. He builds the APIs, you build the UI.

## Your Flow
1. Shared auth components (used by Abdullah for customer auth, Shahzad for worker auth)
2. Full admin dashboard (KPIs, users, verifications, jobs, payments, disputes, categories, settings)

## Source Documents
- `Project Modules/03_Admin_Flow.md` — Full admin requirements
- `Abdullah desigens customer + landing page/hunar_admin_operations_dashboard_modern/` — Admin dashboard prototype
- `Abdullah desigens customer + landing page/jobs_management_work_orders_hunar_admin/` — Jobs management prototype
- `Abdullah desigens customer + landing page/payments_escrow_wallet_hunar/` — Payments prototype
- `Abdullah desigens customer + landing page/dispute_resolution_help_center_hunar/` — Disputes prototype
- `Abdullah desigens customer + landing page/scheduled_visits_arrival_tracker_hunar/` — Live tracker prototype

---

## MILESTONES

### M1: Auth Shared Components + Admin Login

| # | Task | Route / Location | Status |
|---|------|------------------|--------|
| 1 | Shared OTP input component | `features/auth/components/otp-input.tsx` | ✅ Done |
| 2 | Shared phone step component | `features/auth/components/phone-step.tsx` | ✅ Done |
| 3 | Shared password step component | `features/auth/components/password-step.tsx` | ✅ Done |
| 4 | Shared auth shell (layout) | `features/auth/components/auth-shell.tsx` | ✅ Done |
| 5 | Shared auth brand (logo + tagline) | `features/auth/components/auth-brand.tsx` | ✅ Done |
| 6 | Shared auth top bar | `features/auth/components/auth-top-bar.tsx` | ✅ Done |
| 7 | Shared auth trust footer | `features/auth/components/auth-trust-footer.tsx` | ✅ Done |
| 8 | Admin sign-in screen (email + password, distinct from worker/customer) | `(auth)/admin/sign-in/` | ✅ Done |
| 9 | Admin auth guard (role check) | `features/auth/components/admin-guard.tsx` | ✅ Done |

**M1 Deliverable:** Auth components shared across all flows. Admin can sign in.

---

### M2: Admin Dashboard + Users + Verifications

| # | Task | Route | Status |
|---|------|-------|--------|
| 10 | Admin dashboard shell (sidebar, header, content area) | `(admin)/admin/dashboard/` | ✅ Done |
| 11 | KPI stat cards (Total Jobs, Customers, Workers, Revenue, Active Now) | `(admin)/admin/dashboard/` | ✅ Done |
| 12 | Marketplace activity chart (jobs posted vs completed vs disputes) | `(admin)/admin/dashboard/` | ✅ Done |
| 13 | Pending verifications widget (quick approve/reject) | `(admin)/admin/dashboard/` | ✅ Done |
| 14 | Live jobs stream table | `(admin)/admin/dashboard/` | ✅ Done |
| 15 | Job status distribution chart (donut) | `(admin)/admin/dashboard/` | ✅ Done |
| 16 | Users — Customers list (table: name, phone, join date, jobs, spent, status) | `(admin)/admin/users/customers/` | ✅ Done |
| 17 | Users — Workers list (table: name, phone, skills, verification, rating, wallet, status) | `(admin)/admin/users/workers/` | ✅ Done |
| 18 | User detail modal (profile, jobs, payments, reviews) | Modal | ✅ Done |
| 19 | Suspend / deactivate user (with reason) | Modal | ✅ Done |
| 20 | Reactivate user | Modal | ✅ Done |
| 21 | Verification queue (pending submissions list) | `(admin)/admin/verifications/` | ✅ Done |
| 22 | Verification detail (documents, skills, experience, service areas) | `(admin)/admin/verifications/[id]/` | ✅ Done |
| 23 | Approve / reject / request changes actions | `(admin)/admin/verifications/[id]/` | ✅ Done |

**M2 Deliverable:** Admin can see KPIs, manage users, and verify workers.

---

### M3: Jobs + Payments + Disputes + Categories + Settings

| # | Task | Route | Status |
|---|------|-------|--------|
| 24 | Jobs monitoring (all jobs table with filters) | `(admin)/admin/jobs/` | ✅ Done |
| 25 | Job detail drill-down (full audit history) | `(admin)/admin/jobs/[id]/` | ✅ Done |
| 26 | Force cancel job (with reason) | Modal | ✅ Done |
| 27 | Payments monitoring (transactions feed) | `(admin)/admin/payments/` | ✅ Done |
| 28 | Commission snapshot (total revenue + per transaction) | `(admin)/admin/payments/` | ✅ Done |
| 29 | Withdrawal queue (pending/processed/failed) | `(admin)/admin/payments/withdrawals/` | ✅ Done |
| 30 | Wallet freeze (in dispute) | Modal | ✅ Done |
| 31 | Disputes queue (incoming reports) | `(admin)/admin/disputes/` | ✅ Done |
| 32 | Dispute detail (evidence trail, job history) | `(admin)/admin/disputes/[id]/` | ✅ Done |
| 33 | Resolve / dismiss / escalate dispute | `(admin)/admin/disputes/[id]/` | ✅ Done |
| 34 | Categories management (add/edit/deactivate) | `(admin)/admin/categories/` | ✅ Done |
| 35 | Platform settings (commission rate, radius, limits, feature flags) | `(admin)/admin/settings/` | ✅ Done |
| 36 | Reports & analytics (jobs funnel, worker performance, revenue, growth) | `(admin)/admin/reports/` | ✅ Done |
| 37 | Export reports (CSV/PDF) | `(admin)/admin/reports/` | ✅ Done |
| 38 | Notifications panel + unread badges | `(admin)/admin/notifications/` | ✅ Done |
| 39 | Audit trail viewer | `(admin)/admin/audit/` | ✅ Done |

**M3 Deliverable:** Full admin dashboard working end-to-end.

---

## WHAT YOU NEED FROM YOUR PARTNER (Hashim)

| When | What You Need |
|------|---------------|
| M1 | Admin auth API (email + password login) |
| M2 | User management APIs, verification APIs |
| M3 | Jobs monitoring APIs, payment APIs, dispute APIs, category APIs, settings APIs, report APIs |

---

## WHAT YOU'RE BLOCKED ON

| Blocker | Resolution |
|---------|------------|
| Backend paused | Build with mock data, integrate later |
| No API contracts yet | Define endpoints with Hashim before M2 |

---

## RULES TO FOLLOW

1. **Use mock data** for all screens until backend is ready.
2. **Use design tokens** — Navy `#123B5D`, Teal `#0F8B8D`, Orange `#F59E0B`, Green `#16A34A`, Red `#DC2626`.
3. **Follow HTML prototypes** for admin dashboard layout.
4. **Sidebar navigation** with grouped sections (Main, Operations, Governance).
5. **Tables with search, sort, filter** — dense but readable.
6. **Status chips:** Pending = Orange, Approved/Active = Teal, In Progress = Navy, Completed/Paid = Green, Rejected/Suspended = Red.
7. **Every destructive action requires confirm + reason.**
8. **KPI cards** with clear stat values + trend lines.
9. **Audit trail** — every admin action leaves a visible entry.
10. **All money shown as "Rs."** with Pakistani formatting.
11. **No features outside this file.** Only build what's listed.

---

## DONE CHECKLIST

- [x] Auth components are reusable (OTP, phone, password, shell)
- [x] Admin can sign in (email + password)
- [x] Admin dashboard shows KPI cards (5 stats)
- [x] Marketplace activity chart works
- [x] Pending verifications widget works
- [x] Live jobs stream table works
- [x] Job status distribution chart works
- [x] Customer list table with search/filter works
- [x] Worker list table with search/filter works
- [x] User detail modal works
- [x] Suspend / deactivate / reactivate works
- [x] Verification queue works
- [x] Verification detail with approve/reject/request changes works
- [x] Jobs monitoring table works
- [x] Job detail drill-down works
- [x] Payments monitoring works
- [x] Commission snapshot works
- [x] Withdrawal queue works
- [x] Disputes queue works
- [x] Dispute detail with evidence trail works
- [x] Resolve / dismiss / escalate works
- [x] Categories management works
- [x] Platform settings work
- [x] Reports & analytics work
- [x] Export works
- [x] Notifications show with unread badges
- [x] Audit trail viewer works
- [x] Design tokens applied everywhere
