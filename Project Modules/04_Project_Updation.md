# HUNAR — Module 4: Project Updation (How HUNAR Grows & Changes)

## Purpose of this document
HUNAR is not finished at "version 1". This module defines **how the project is updated over time** — the current state, the process every updation must follow, the roadmap of future changes (from the project's own scope and research documents), and how new features affect the three flows described in Modules 1–3.

This module ensures future work adds **only** planned, justified features — nothing arbitrary — and keeps the app consistent with the HUNAR design system, the approved tech stack, and the core two-stage negotiation model.

---

## 1. Current State (What Is Built Today — Phase 1 MVP)

### 1.1 What the MVP covers (already in Modules 1–3)
- Customer: signup/login (OTP), post a job wizard, receive/live-view offers, compare workers, counter/negotiate visit charge, confirm visit, live-track worker, approve repair, pay (demo), review.
- Worker: signup/login, profile + verification, job feed, send/negotiate visit offers, perform visit & inspection, negotiate & complete repair, wallet with 10% visit-commission, top-up & withdraw (min Rs. 100, self-serve), reviews.
- Admin: secure login, KPI dashboard, worker verification, user management, job/payment monitoring, dispute resolution, category management, platform settings, audit trail.

### 1.2 Explicitly OUT of the MVP (documented scope boundaries)
The following are **documented as "not in the first release"** and are candidates for later updations (see Roadmap §5):
- Real-time **AI worker matching / smart recommendation engine**
- Full **payment gateway / escrow integration** (today payments are demo wallet / cash / card mock)
- **Large materials marketplace** (buying parts through HUNAR)
- **Subscription plans** (e.g., premium worker subscriptions)
- **Complex analytics / BI dashboards**
- **Multi-city / nationwide expansion** (today positioned for Peshawar)
- Heavy **round-the-clock super-app** scope (deliberately avoided)

**Design guardrail (from competitive research — "DO NOT BUILD"):** do not copy a super-app, do not add unrelated services, do not become a non-curated directory, and never make price the only ranking factor. Updations must respect this.

---

## 2. The Two-Stage Negotiation Model (UPDATION MUST NOT BREAK THIS)

The product's central differentiator is the **two-stage pricing**:
```
Visit charge (negotiated before the visit)  +  Repair estimate (after inspection, explicitly approved)
```
Every future updation must preserve, not weaken:
- Visit fee and repair estimate are **separate**.
- The agreed price is **locked**; more money requires an explicit scope-change approval.
- Negotiation is **bounded** (no infinite haggling).
- Customer has **provider choice** (never forced into one worker).
- Platform commission stays on the **visit charge** (10% default).

If an updation proposes changing these rules, it is not a small ticket — it requires a product decision and full re-validation across Modules 1–3.

---

## 3. The Updation Process (How a Change Is Made)

Every change to HUNAR — big or small — follows this flow. This keeps the codebase maintainable and the three flows consistent.

### 3.1 Standard workflow
1. **Capture** the change as a clear, small task (what/why/user impact).
2. **Check against the requirements**: does it add a new requirement the docs don't have, or break an existing one? If yes → raise with the team first.
3. **Update references**: mark the affected area in Modules 1–3 (this Module 4 is the living log).
4. **Code**: implement following the HUNAR coding standards (typed NestJS modules, DTO validation, Prisma migrations, tested services).
5. **Test**: unit + integration tests (jest/supertest) must pass before merge.
6. **Review**: pull-request review; no self-merge for significant changes.
7. **Deploy**: staging → verify → production. Use feature flags for risky features.
8. **Document**: update this Module + affected module docs the same release.

### 3.2 Coding standards every updation follows
- **Backend:** NestJS modular monolith; one module per domain (Auth, Users, Jobs, Offers, Visits, Repair, Payments, Wallet, Reviews, Chat, Notifications, Location, FileUpload, Search/Matching, Admin, Dispute). Prisma with PostgreSQL; no raw SQL outside migrations. Redis for cache/OTP/queues/idempotency; BullMQ for background jobs.
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui. State via Zustand; server data via TanStack Query; forms via react-hook-form + zod; realtime via Socket.IO client; i18n via next-intl (English/Urdu).
- **Design tokens:** never invent colors; use the system palette (Navy `#123B5D`, Teal `#0F8B8D`, Orange `#F59E0B`, Green `#16A34A`, Red `#DC2626`, Gray `#64748B`, Dark `#172033`, bg `#F8FAFC`, white cards).

### 3.3 Database changes
- Every schema change uses a **Prisma migration** (never in-place edits).
- Sensitive tables (payments, wallet ledger, disputes) keep audit fields; money-moving logic remains **idempotent** (Redis idempotency keys) to prevent double-charges.

### 3.4 Realtime / notification updates
- New events added to Notification module + Socket.IO channels; push via FCM stays consistent with the existing notification matrix in Modules 1–3.

### 3.5 Versioning & releases
- Semantic versioning (1.0.0, 1.1.0, 2.0.0).
- A major version (2.x) = breaking product change (e.g., switching payments to real gateway). A minor version = new feature. A patch = bug fix.
- Release notes + changelog kept alongside the modules.

---

## 4. Planned Updations (The Roadmap)

These come from the project's own scope documents, payment research, and competitive research. Each is described with **Phase, Why, What changes, Impact on Modules 1–3**.

### Phase 2 — Trust & Money hardening

**U1. Real payment gateway integration (JazzCash / Easypaisa / Stripe)**
- Why: MVP uses demo wallet/cash/card mock; real payments are the path to revenue & scale.
- What changes:
  - Customer "Proceed to Payment" → real redirect/gateway (in-app or hosted) → webhook confirms.
  - **Escrow/hold**: money held until the customer confirms completion, then released to worker (Airtasker-style protected payment).
  - Wallet top-up & withdrawals become real (Easypaisa/JazzCash/bank); automatic payout min Rs. 100 preserved.
  - Commission deduction on "Arrived" (10% of visit charge) is preserved exactly.
- Impact: Customer Module 2 §13, Worker Module 1 §11/12, Admin Module 3 §8 all gain real/moderated states; ledger grows `payment_gateway_txn` fields.

**U2. Refund & cancellation policy automation**
- Why: post-launch, cancellation/refund conflicts are the #1 dispute driver.
- What changes: templated, customer-friendly refund rules + automated partial/zero refund thresholds; admin can override with audit.
- Impact: adds Micro-states to cancellation in Modules 1–3 edge-case tables.

### Phase 3 — Smarter matching & experience

**U3. AI / smart worker matching (recommendation engine)**
- Why: "post a problem and get matched" reduces effort; better matching → higher completion.
- What changes: beyond skill + distance matching, suggest Top Matched workers based on rating, review sentiment, similar-job history, on-time rate. **Never** make price the only ranking factor (design guardrail).
- Impact: Worker Module 1 §5, Customer Module 2 §6 gain a "Suggested Workers" strip; requires data/messaging but no flow change.

**U4. Voice-to-text / Urdu language support**
- Why: Peshawar market includes low-literacy & Urdu-first users; voice notes already in the product.
- What changes: transcribe job voice notes into searchable text; full Urdu UI (i18n already planned); voice replies.
- Impact: Job wizard Step 3 (Module 2 §5) gains optional transcription; no product-rule change.

**U5. Gamification for workers (levels, badges, streaks)**
- Why: motivation & retention (psychological design: dopamine).
- What changes: profile badges (e.g., "Reliable", "5.0★", "100 jobs"), level thresholds, celebration moments.
- Impact: Worker profile/stats rows (Module 1); visible to customers as trust signals — must stay honest (no fake badges).

**U6. Chat upgrades (voice/video calls, translated chat)**
- Why: reduces miscommunication during negotiations.
- What changes: in-app call buttons after booking; translated messages between Urdu/English.
- Impact: Chat sections (Modules 1 §15, 2 §15) gain media/call controls; security & recording rules to be defined with Trust & Safety.

### Phase 4 — Scale & new revenue lines

**U7. Materials marketplace (parts & tools)**
- Why: customers often need parts (pipes, sockets, AC gas); bundling the worker's job + parts = better experience + revenue.
- What changes: worker adds parts to the repair estimate with prices; customer approves parts inside the same explicit approval screen (NOT a separate super-app).
- Impact: Repair estimate flow (Modules 1 §10, 2 §11) gains an optional line-item list; still one explicit approval → preserves the locked-price rule.

**U8. Worker subscriptions / verified-premium tiers**
- Why: recurring revenue + rewards for top workers.
- What changes: verified/premium workers get better visibility & lower commission per their plan; standard commission stays 10% default.
- Impact: Admin Module 3 §12 becomes per-plan; pricing reviewed by super-admin; must not hide bad reviews.

**U9. Advanced analytics & BI dashboard**
- Why: post-MVP ops decisions need deeper insights.
- What changes: funnels, cohort retention, category profitability, geo heatmaps; exports.
- Impact: Admin Module 3 §13 expands; no flow change.

**U10. Multi-city / nationwide rollout**
- Why: HUNAR is currently Peshawar-positioned.
- What changes: city settings, per-city categories & workers, localized service areas, language, and geofencing; worker radius settings adapt.
- Impact: Admin Module 3 §11 + customer wizard location step (Module 2 §5) become city-aware.

### Phase 5 — Platforms & robustness

**U11. Mobile apps (iOS / Android)**
- Why: reach; push-heavy model (FCM choices already made) is native-friendly.
- What changes: the web app is built PWA-ready (per tech stack); native apps wrap the same backend APIs; wallet & verification surfaces translated 1:1.
- Impact: no logic change — all flows reuse Modules 1–3 rules.

**U12. Offline-first & reliability mode**
- Why: unreliable connectivity in the local market.
- What changes: cached job lists, retry-safe actions, reconnect handling for Socket.IO, background refresh.
- Impact: all read surfaces become resilient; money actions remain strictly server-verified.

**U13. Insurance / worker safety & protection**
- Why: dangerous trades (AC, electrical); protects both sides and builds trust.
- What changes (future, gated by legal): opt-in per-job insurance toggle; incident report flow; admin/legal review queue.
- Impact: Admin Module 3 gains a "Safety" queue; job card gains an optional badge.

---

## 5. Roadmap at a Glance (Priority-Ordered)

| # | Updation | Phase | Primary impact |
|---|---|---|---|
| 1 | Real payment gateway + escrow | 2 | Money (all 3 flows) |
| 2 | Refund/cancellation automation | 2 | Trust |
| 3 | AI smart matching | 3 | Match quality |
| 4 | Urdu voice-to-text + i18n | 3 | Localization |
| 5 | Worker gamification | 3 | Retention |
| 6 | Chat voice/video/translation | 3 | Comms |
| 7 | Materials marketplace | 4 | Revenue |
| 8 | Worker subscriptions | 4 | Revenue |
| 9 | Advanced analytics/BI | 4 | Ops |
| 10 | Multi-city expansion | 4 | Scale |
| 11 | Mobile apps | 5 | Reach |
| 12 | Offline-first mode | 5 | Reliability |
| 13 | Insurance & safety | 5 | Trust (legal-gated) |

**Ordering rule:** trust & money (Phase 2) come BEFORE growth features (Phase 3+). Never add a Phase 3+ feature if Phase 2 money integrity is incomplete.

---

## 6. What HUNAR will NOT do (Anti-Updations)

These are written deliberately excluded; a future updation request proposing any of them must be rejected by default:
- **Super-app** scope (rides, groceries, beauty, etc. blended together) — competitive research explicitly says avoid.
- **Unrelated service categories** that dilute the home-repair focus.
- **Non-curated directory** (listing unverified workers just to increase count).
- **Cheapest-price-only** ranking (kills quality selection).
- **Ambiguous verbal price changes** — repair price changes always require explicit customer approval.
- **Falling back to MongoDB / abandoning PostgreSQL** — the relational design is a settled decision.

---

## 7. How an Updation Lands in the Docs

When any updation U1–U13 (or an approved new one) is built:

1. Add a dated entry at the end of this document (changelog style): *Date, version, what changed, which module docs were touched.*
2. Edit the affected module doc sections in place (Modules 1–3) so they describe the NEW behavior as the standard.
3. If the updation changes a rule (commission %, negotiation rounds, payment method), flag it with an "UPDATED (vX)" callout so it is easy to see what changed.
4. Keep the design tokens and the two-stage pricing narrative intact in all new text.

---

## 8. Changelog (Living Log — append here)

| Date | Version | Change | Modules touched |
|---|---|---|---|
| (to be appended on each release) | | | |

---

## 9. Summary

- HUNAR's MVP is defined and complete in Modules 1–3.
- Every updation must follow the standard change process (§3) and preserve the two-stage negotiation model (§2).
- The planned roadmap (U1–U13, §4) matures trust & payments first, then matching, then scale.
- Certain features are deliberately excluded (§6) and must not slip into the product.
- This Module 4 doubles as the team's changelog and decision record for all future work.