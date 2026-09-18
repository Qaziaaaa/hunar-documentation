# HUNAR PROJECT — MASTER TRACKER

## Purpose
Single source of truth for the entire HUNAR project. The leader (you) checks this file daily. Every dev checks their own individual file for tasks.

---

## File Structure

```
Task Contribution/
├── MASTER_PROJECT_TRACKER.md              ← You (leader) check this
├── Pair_1_Customer_Flow/
│   ├── 01_abdullah_customer_frontend.md   ← Abdullah's tasks
│   └── 02_shafqat_customer_backend.md     ← Shafqat's tasks (paused)
├── Pair_2_Worker_Flow/
│   ├── 03_shahzad_worker_frontend.md      ← Shahzad's tasks
│   └── 04_hakim_worker_backend.md         ← Hakim's tasks (paused)
└── Pair_3_Auth_Admin_Flow/
    ├── 05_faizan_auth_admin_frontend.md   ← Faizan's tasks
    └── 06_hashim_auth_admin_backend.md    ← Hashim's tasks (paused)
```

---

## 1. Team & Pairings

| # | Developer | Role | Flow | Partner | Status |
|---|-----------|------|------|---------|--------|
| 1 | Abdullah | Frontend | Customer Flow (A-Z) | Shafqat Ullah | Active |
| 2 | Shafqat Ullah | Backend | Customer Flow (A-Z) | Abdullah | Paused |
| 3 | Shahzad | Frontend | Worker Flow (A-Z) | Hakim Ullah | Active |
| 4 | Hakim Ullah | Backend | Worker Flow (A-Z) | Shahzad | Paused |
| 5 | Faizan | Frontend | Auth Shared + Admin Dashboard | Hashim | Active |
| 6 | Hashim | Backend | Auth Shared + Admin Dashboard | Faizan | Paused |
| 7 | **You (Leader)** | QA / Manager | All Flows | — | Active |

---

## 2. Milestones Overview

| Milestone | Scope | Target |
|-----------|-------|--------|
| **M1** | Auth + Basic Setup (login, signup, role guards, dashboard shells) | — |
| **M2** | Core Flow (main screens + APIs, primary user journeys) | — |
| **M3** | Complete Flow (all screens, edge cases, polish, notifications) | — |

---

## 3. Flow Status Matrix

| Flow | Frontend Dev | Backend Dev | M1 Frontend | M1 Backend | M2 Frontend | M2 Backend | M3 Frontend | M3 Backend |
|------|-------------|-------------|-------------|------------|-------------|------------|-------------|------------|
| **Customer** | Abdullah | Shafqat Ullah | 🔴 Not started | 🔴 Paused | 🔴 Not started | 🔴 Paused | 🔴 Not started | 🔴 Paused |
| **Worker** | Shahzad | Hakim Ullah | 🔴 Not started | 🔴 Paused | 🔴 Not started | 🔴 Paused | 🔴 Not started | 🔴 Paused |
| **Auth + Admin** | Faizan | Hashim | 🟡 In progress | 🔴 Paused | 🔴 Not started | 🔴 Paused | 🔴 Not started | 🔴 Paused |

**Legend:**
- 🔴 Not started
- 🟡 In progress
- 🟢 Done
- ⏸️ Paused (waiting for backend)

---

## 4. Dependency Map

### M1 Dependencies (Auth must come first)
```
Faizan (Auth Components) ──→ Abdullah (Customer Auth)
                          ──→ Shahzad (Worker Auth)

Hashim (Auth APIs) ──→ Shafqat (Customer Auth APIs)
                    ──→ Hakim (Worker Auth APIs)
```

### M2 Dependencies (Core flows are independent)
```
Abdullah (Customer UI) ←──→ Shafqat (Customer APIs)
Shahzad (Worker UI) ←──→ Hakim (Worker APIs)
Faizan (Admin UI) ←──→ Hashim (Admin APIs)
```

### M3 Dependencies (Cross-flow features)
```
Chat: All frontend devs ←──→ All backend devs (Socket.IO)
Notifications: All frontend devs ←──→ All backend devs
```

---

## 5. Current Blockers

| Blocker | Affects | Status |
|---------|---------|--------|
| Backend paused | All backend devs | Waiting for leader decision |
| Auth components shared | Abdullah, Shahzad | Faizan building them |
| No API contracts yet | All frontend+backend pairs | Need to define endpoints |

---

## 6. What's Already Built (Inventory)

### Frontend (Next.js)
| Feature | Location | Status | Counts For |
|---------|----------|--------|------------|
| Landing page | `components/landing/*` | ✅ Done | — (shared) |
| Design tokens | `lib/design-tokens.ts` | ✅ Done | — (shared) |
| UI primitives | `components/ui/*` | ✅ Done | — (shared) |
| Worker auth (sign-up/sign-in) | `features/auth/*` | ✅ Done | Faizan |
| Worker onboarding wizard | `features/worker-onboarding/*` | ✅ Done | Shahzad |
| Worker verification | `features/worker-verification/*` | ✅ Done | Shahzad |
| Worker dashboard shell | `features/worker-dashboard/*` | ✅ Done | Shahzad |
| i18n setup | `i18n/*` | ✅ Done | — (shared) |
| TanStack Query provider | `components/providers/*` | ✅ Done | — (shared) |
| Socket.IO client | `lib/socket.ts` | ✅ Done | — (shared) |
| API client | `lib/api-client.ts` | ✅ Done | — (shared) |

### HTML Prototypes (Design Reference)
| Flow | Screens | Location |
|------|---------|----------|
| Admin | Dashboard, Jobs, Payments, Disputes, Tracker | `Abdullah desigens/*/hunar_admin_*` |
| Customer | Dashboard, Post-a-Job, Offers, Booking, Chat, Profile | `Abdullah desigens/*/hunar_customer_*` |
| Worker | Dashboard, Chat | `Abdullah desigens/*/hunar_worker_*` |

---

## 7. Daily Standup Log

| Date | Dev | Status | Blockers |
|------|-----|--------|----------|
| — | — | — | — |

---

## 8. Rules (Apply to Everyone)

1. **No overlap.** Each dev works only on their assigned flow.
2. **No self-merge.** All PRs go through leader review.
3. **Mock data first.** Frontend builds with mock data until backend is ready.
4. **Design tokens always.** Use Navy, Teal, Orange, Green, Red, Gray — never invent colors.
5. **API contracts first.** Frontend + backend partners agree on endpoints before building.
6. **Milestone sign-off.** Leader approves before moving to next milestone.
7. **Git discipline.** One branch per feature, descriptive commit messages.
