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

## 1. OVERALL PROJECT PROGRESS

```
TOTAL PROGRESS: ███░░░░░░░░░░░░░░░░░ 18%
```

| Area | Built | Remaining | Progress |
|------|-------|-----------|----------|
| **Shared (Landing + Infrastructure)** | 25 | 0 | ██████████ 100% |
| **Worker Flow (Frontend)** | 6 | 32 | ██░░░░░░░░ 16% |
| **Customer Flow (Frontend)** | 0 | 30 | ░░░░░░░░░░ 0% |
| **Auth + Admin (Frontend)** | 8 | 31 | ██░░░░░░░░ 21% |
| **Worker Flow (Backend)** | 0 | 47 | ░░░░░░░░░░ 0% (Paused) |
| **Customer Flow (Backend)** | 0 | 27 | ░░░░░░░░░░ 0% (Paused) |
| **Auth + Admin (Backend)** | 0 | 49 | ░░░░░░░░░░ 0% (Paused) |

---

## 2. TEAM & PAIRINGS

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

## 3. PER-DEV PROGRESS TRACKER

### Abdullah — Customer Flow Frontend
```
PROGRESS: ░░░░░░░░░░░░░░░░░░░░ 0%
```

| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth + Dashboard | 4 | 0 | 🔴 Not started |
| M2: Core Flow | 13 | 0 | 🔴 Not started |
| M3: Complete Flow | 13 | 0 | 🔴 Not started |
| **TOTAL** | **30** | **0** | **🔴 0%** |

**What's done:** Nothing yet
**What's next:** Customer auth (sign-up, sign-in, OTP)

---

### Shafqat Ullah — Customer Flow Backend
```
PROGRESS: ░░░░░░░░░░░░░░░░░░░░ 0% (PAUSED)
```

| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth APIs | 7 | 0 | ⏸️ Paused |
| M2: Job & Offer APIs | 9 | 0 | ⏸️ Paused |
| M3: Payment, Review & Notification APIs | 11 | 0 | ⏸️ Paused |
| **TOTAL** | **27** | **0** | **⏸️ 0%** |

**Blocked on:** Leader decision to start backend

---

### Shahzad — Worker Flow Frontend
```
PROGRESS: ██████░░░░░░░░░░░░░░ 31%
```

| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth + Onboarding + Dashboard | 12 | 10 | 🟢 83% |
| M2: Jobs + Offers + Visit | 12 | 2 | 🟡 17% |
| M3: Repair + Earnings + Chat + Profile | 14 | 0 | 🔴 0% |
| **TOTAL** | **38** | **12** | **🟡 32%** |

**What's done:**
- ✅ Worker sign-up (phone → OTP → password)
- ✅ Worker sign-in
- ✅ Onboarding wizard (6 steps: Personal, Skills, Experience, Areas, Documents, Review)
- ✅ Verification status screen (4 states)
- ✅ Dashboard shell (header, sidebar, mobile nav, toggle, stats)
- ✅ Job request feed with filtering
- ✅ Job request cards with image thumbnails
- ✅ Job request detail modal with "Send Offer" flow
- ✅ Voice player (compact + full with waveform)
- ✅ Radar search animation view

**What's next:** Job feed filters, job details screen, send visit offer

---

### Hakim Ullah — Worker Flow Backend
```
PROGRESS: ░░░░░░░░░░░░░░░░░░░░ 0% (PAUSED)
```

| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth + Onboarding + Profile | 16 | 0 | ⏸️ Paused |
| M2: Jobs + Offers + Visits + Inspection | 12 | 0 | ⏸️ Paused |
| M3: Repair + Wallet + Commission + Chat + Notifications | 19 | 0 | ⏸️ Paused |
| **TOTAL** | **47** | **0** | **⏸️ 0%** |

**Blocked on:** Leader decision to start backend

---

### Faizan — Auth Shared + Admin Dashboard Frontend
```
PROGRESS: ████░░░░░░░░░░░░░░░░ 20%
```

| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth Shared + Admin Login | 9 | 8 | 🟢 89% |
| M2: Dashboard + Users + Verifications | 14 | 0 | 🔴 0% |
| M3: Jobs + Payments + Disputes + Settings | 16 | 0 | 🔴 0% |
| **TOTAL** | **39** | **8** | **🟡 21%** |

**What's done:**
- ✅ Shared OTP input component
- ✅ Shared phone step component
- ✅ Shared password step component
- ✅ Shared auth shell (layout)
- ✅ Shared auth brand (logo + tagline)
- ✅ Shared auth top bar
- ✅ Shared auth trust footer
- ✅ Worker auth API integration

**What's next:** Admin sign-in screen, admin dashboard shell, KPI cards

---

### Hashim — Auth Shared + Admin Dashboard Backend
```
PROGRESS: ░░░░░░░░░░░░░░░░░░░░ 0% (PAUSED)
```

| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth Module (Shared) | 9 | 0 | ⏸️ Paused |
| M2: User Management + Verification APIs | 14 | 0 | ⏸️ Paused |
| M3: Jobs, Payments, Disputes, Categories, Settings, Reports | 26 | 0 | ⏸️ Paused |
| **TOTAL** | **49** | **0** | **⏸️ 0%** |

**Blocked on:** Leader decision to start backend

---

## 4. MILESTONE OVERVIEW

| Milestone | Scope | Frontend Target | Backend Target | Status |
|-----------|-------|-----------------|----------------|--------|
| **M1** | Auth + Basic Setup (login, signup, role guards, dashboard shells) | — | — | 🟡 In progress (Frontend) |
| **M2** | Core Flow (main screens + APIs, primary user journeys) | — | — | 🔴 Not started |
| **M3** | Complete Flow (all screens, edge cases, polish, notifications) | — | — | 🔴 Not started |

---

## 5. FLOW STATUS MATRIX

| Flow | Frontend Dev | Backend Dev | M1 Frontend | M1 Backend | M2 Frontend | M2 Backend | M3 Frontend | M3 Backend |
|------|-------------|-------------|-------------|------------|-------------|------------|-------------|------------|
| **Customer** | Abdullah | Shafqat Ullah | 🔴 0% | ⏸️ Paused | 🔴 0% | ⏸️ Paused | 🔴 0% | ⏸️ Paused |
| **Worker** | Shahzad | Hakim Ullah | 🟢 83% | ⏸️ Paused | 🟡 17% | ⏸️ Paused | 🔴 0% | ⏸️ Paused |
| **Auth + Admin** | Faizan | Hashim | 🟢 89% | ⏸️ Paused | 🔴 0% | ⏸️ Paused | 🔴 0% | ⏸️ Paused |

**Legend:**
- 🔴 Not started (0%)
- 🟡 In progress (1-99%)
- 🟢 Done (100%)
- ⏸️ Paused (waiting for backend)

---

## 6. DEPENDENCY MAP

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

## 7. WHAT'S ALREADY BUILT (INVENTORY)

### Frontend (Next.js)
| Feature | Location | Status | Counts For |
|---------|----------|--------|------------|
| Landing page (15 components) | `components/landing/*` | ✅ Done | — (shared) |
| Design tokens | `lib/design-tokens.ts` | ✅ Done | — (shared) |
| UI primitives (4 components) | `components/ui/*` | ✅ Done | — (shared) |
| Shared components (3) | `components/shared/*` | ✅ Done | — (shared) |
| Worker auth (sign-up/sign-in) | `features/auth/*` | ✅ Done | Faizan |
| Worker onboarding wizard (6 steps) | `features/worker-onboarding/*` | ✅ Done | Shahzad |
| Worker verification (4 states) | `features/worker-verification/*` | ✅ Done | Shahzad |
| Worker dashboard shell + content | `features/worker-dashboard/*` | ✅ Done | Shahzad |
| i18n setup (EN/UR) | `i18n/*` | ✅ Done | — (shared) |
| TanStack Query provider | `components/providers/*` | ✅ Done | — (shared) |
| Socket.IO client | `lib/socket.ts` | ✅ Done | — (shared) |
| API client with token storage | `lib/api-client.ts` | ✅ Done | — (shared) |

### HTML Prototypes (Design Reference)
| Flow | Screens | Location |
|------|---------|----------|
| Admin | Dashboard, Jobs, Payments, Disputes, Tracker | `Abdullah desigens/*/hunar_admin_*` |
| Customer | Dashboard, Post-a-Job (6 steps), Offers, Booking, Chat, Profile | `Abdullah desigens/*/hunar_customer_*` |
| Worker | Dashboard, Chat | `Abdullah desigens/*/hunar_worker_*` |

---

## 8. CURRENT BLOCKERS

| Blocker | Affects | Status |
|---------|---------|--------|
| Backend paused | All backend devs | Waiting for leader decision |
| No API contracts yet | All frontend+backend pairs | Need to define endpoints |
| Admin sign-in not built | Faizan | Next task for Faizan |
| Customer flow not started | Abdullah | Next task for Abdullah |

---

## 9. DAILY STANDUP LOG

| Date | Dev | Status | Blockers |
|------|-----|--------|----------|
| — | — | — | — |

---

## 10. RULES (Apply to Everyone)

1. **No overlap.** Each dev works only on their assigned flow.
2. **No self-merge.** All PRs go through leader review.
3. **Mock data first.** Frontend builds with mock data until backend is ready.
4. **Design tokens always.** Use Navy, Teal, Orange, Green, Red, Gray — never invent colors.
5. **API contracts first.** Frontend + backend partners agree on endpoints before building.
6. **Milestone sign-off.** Leader approves before moving to next milestone.
7. **Git discipline.** One branch per feature, descriptive commit messages.

---

## 11. HOW TO UPDATE THIS TRACKER

After each dev completes a task:
1. Update their individual file (e.g., `03_shahzad_worker_frontend.md`) — change `🔴` to `🟢`
2. Update this file — change the progress percentages
3. Update the status matrix
4. Commit and push

**Example:**
```markdown
# Before
| 13 | Job feed filters | `(worker)/worker/dashboard/` | 🔴 |

# After
| 13 | Job feed filters | `(worker)/worker/dashboard/` | 🟢 |
```
