# HUNAR PROJECT — MASTER TRACKER

## Purpose
Single source of truth for the entire HUNAR project. The leader (you) checks this file daily.

**RULE: Work counts for the person it is assigned to, regardless of who actually did it.**

---

## 1. OVERALL PROJECT PROGRESS

```
TOTAL PROGRESS: ████████████░░░░░░░░ 58%
```

| Area | Built | Remaining | Progress |
|------|-------|-----------|----------|
| Shared (Landing + Infrastructure) | 25 | 0 | 100% |
| Worker Flow (Frontend) | 12 | 26 | 32% |
| Customer Flow (Frontend) | 0 | 30 | 0% |
| Auth + Admin (Frontend) | 8 | 31 | 21% |
| Worker Flow (Backend) | 35 | 12 | 74% |
| Customer Flow (Backend) | 0 | 27 | 0% (Paused) |
| Auth + Admin (Backend) | 30 | 19 | 61% |

---

## 2. TEAM & PAIRINGS

| # | Developer | Role | Flow | Partner | Status |
|---|-----------|------|------|---------|--------|
| 1 | Abdullah | Frontend | Customer Flow (A-Z) | Shafqat Ullah | Active |
| 2 | Shafqat Ullah | Backend | Customer Flow (A-Z) | Abdullah | Paused |
| 3 | Shahzad | Frontend | Worker Flow (A-Z) | Hakim Ullah | Active |
| 4 | Hakim Ullah | Backend | Worker Flow (A-Z) | Shahzad | Active |
| 5 | Faizan | Frontend | Auth Shared + Admin Dashboard | Hashim | Active |
| 6 | Hashim | Backend | Auth Shared + Admin Dashboard | Faizan | Active |
| 7 | You (Leader) | QA / Manager | All Flows | - | Active |

---

## 3. PER-DEV PROGRESS

### Abdullah - Customer Flow Frontend
```
PROGRESS: ░░░░░░░░░░░░░░░░░░░░ 0%
```
| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth + Dashboard | 4 | 0 | Not started |
| M2: Core Flow | 13 | 0 | Not started |
| M3: Complete Flow | 13 | 0 | Not started |
| **TOTAL** | **30** | **0** | **0%** |

---

### Shafqat Ullah - Customer Flow Backend
```
PROGRESS: ░░░░░░░░░░░░░░░░░░░░ 0% (PAUSED)
```
| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth APIs | 7 | 0 | Paused |
| M2: Job and Offer APIs | 9 | 0 | Paused |
| M3: Payment, Review and Notification APIs | 11 | 0 | Paused |
| **TOTAL** | **27** | **0** | **0%** |

---

### Shahzad - Worker Flow Frontend
```
PROGRESS: ██████░░░░░░░░░░░░░░ 32%
```
| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth + Onboarding + Dashboard | 12 | 10 | 83% |
| M2: Jobs + Offers + Visit | 12 | 2 | 17% |
| M3: Repair + Earnings + Chat + Profile | 14 | 0 | 0% |
| **TOTAL** | **38** | **12** | **32%** |

Done: Worker sign-up, sign-in, onboarding wizard (6 steps), verification status (4 states), dashboard shell, job feed, job cards, job detail modal, voice player, radar search.

---

### Hakim Ullah - Worker Flow Backend
```
PROGRESS: ███████████████░░░░░ 74%
```
| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth + Onboarding + Profile | 16 | 16 | 100% |
| M2: Jobs + Offers + Visits + Inspection | 12 | 12 | 100% |
| M3: Repair + Wallet + Commission + Chat + Notifications | 19 | 7 | 37% |
| **TOTAL** | **47** | **35** | **74%** |

Done: Jobs, Offers, Visits, Repair, Commissions, Chat, Uploads, Reviews.
Not done: Payments, Location, Search.

---

### Faizan - Auth Shared + Admin Dashboard Frontend
```
PROGRESS: ████░░░░░░░░░░░░░░░░ 21%
```
| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth Shared + Admin Login | 9 | 8 | 89% |
| M2: Dashboard + Users + Verifications | 14 | 0 | 0% |
| M3: Jobs + Payments + Disputes + Settings | 16 | 0 | 0% |
| **TOTAL** | **39** | **8** | **21%** |

Done: Shared OTP, phone step, password step, auth shell, auth brand, auth top bar, auth trust footer, worker auth API integration.

---

### Hashim - Auth Shared + Admin Dashboard Backend
```
PROGRESS: ████████████░░░░░░░░ 61%
```
| Milestone | Tasks | Done | Status |
|-----------|-------|------|--------|
| M1: Auth Module (Shared) | 9 | 9 | 100% |
| M2: User Management + Verification APIs | 14 | 11 | 79% |
| M3: Jobs, Payments, Disputes, Categories, Settings, Reports | 26 | 10 | 38% |
| **TOTAL** | **49** | **30** | **61%** |

Done: Auth module (OTP, bcrypt, JWT, role guards, SMS), Admin verification (queue, approve/reject), Users module, Notifications module.
Not done: Admin main controller/service, Admin middleware, Customer profile service, Firebase, SMS for notifications.

---

## 4. FLOW STATUS MATRIX

| Flow | Frontend Dev | Backend Dev | M1 FE | M1 BE | M2 FE | M2 BE | M3 FE | M3 BE |
|------|-------------|-------------|-------|-------|-------|-------|-------|-------|
| Customer | Abdullah | Shafqat | 0% | Paused | 0% | Paused | 0% | Paused |
| Worker | Shahzad | Hakim | 83% | 100% | 17% | 100% | 0% | 37% |
| Auth+Admin | Faizan | Hashim | 89% | 100% | 0% | 79% | 0% | 38% |

---

## 5. DEPENDENCY MAP

### M1 (Auth must come first)
```
Faizan (Auth Components) -> Abdullah (Customer Auth)
                         -> Shahzad (Worker Auth)
Hashim (Auth APIs) -> Shafqat (Customer Auth APIs)
                   -> Hakim (Worker Auth APIs)
```

### M2 (Core flows are independent)
```
Abdullah (Customer UI) <-> Shafqat (Customer APIs)
Shahzad (Worker UI) <-> Hakim (Worker APIs)
Faizan (Admin UI) <-> Hashim (Admin APIs)
```

---

## 6. INVENTORY - WHAT IS BUILT

### Frontend
| Feature | Status | Counts For |
|---------|--------|------------|
| Landing page (15 components) | Done | Shared |
| Design tokens | Done | Shared |
| UI primitives (4) | Done | Shared |
| Shared components (3) | Done | Shared |
| Worker auth (sign-up/sign-in) | Done | Faizan |
| Worker onboarding (6 steps) | Done | Shahzad |
| Worker verification (4 states) | Done | Shahzad |
| Worker dashboard + job feed | Done | Shahzad |
| i18n (EN/UR) | Done | Shared |
| TanStack Query provider | Done | Shared |
| Socket.IO client | Done | Shared |
| API client | Done | Shared |

### Backend
| Module | Status | Counts For |
|--------|--------|------------|
| Auth (OTP, JWT, bcrypt, role guards) | Done | Hashim |
| Admin Verification | Done | Hashim |
| Users | Done | Hashim |
| Notifications | Done | Hashim |
| Jobs | Done | Hakim |
| Offers | Done | Hakim |
| Visits | Done | Hakim |
| Repair | Done | Hakim |
| Commissions | Done | Hakim |
| Chat | Done | Hakim |
| Uploads | Done | Hakim |
| Reviews | Done | Hakim |
| Payments | Empty | - |
| Location | Empty | - |
| Search | Empty | - |

---

## 7. RULES

1. Work counts for the person it is assigned to, regardless of who did it.
2. No overlap - each dev works only on their assigned flow.
3. No self-merge - all PRs go through leader review.
4. Mock data first - frontend builds with mock data until backend is ready.
5. Design tokens always - Navy, Teal, Orange, Green, Red, Gray.
6. API contracts first - frontend and backend partners agree on endpoints before building.
7. Milestone sign-off - leader approves before moving to next milestone.
