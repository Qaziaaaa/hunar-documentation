# HUNAR / Fixora — The Whole Project in 4 Modules (A to Z)

## What This Folder Is

The complete HUNAR / Fixora project has been divided into **exactly 4 modules**. Nothing has been cut — every requirement, screen, flow, backend module, and technical concern from the project documentation is mapped to one of these modules below.

> Previous split had 20+ tiny modules. This split keeps the SAME full project coverage but in only **4 clean modules**, so every requirement stays and nothing is lost.

---

## The 4 Modules (Overview)

| Module | Name | Covers (in short) |
|---:|---|---|
| **M1** | Accounts, Users & Verification | Registration, OTP, login, roles (RBAC), customer profiles, worker profiles, admin verification, account status |
| **M2** | Jobs, Matching & the Service Lifecycle | Service categories, job posting, search/filters, nearby matching, offers & negotiation, visits, inspection, repair estimates & approval, job completion |
| **M3** | Payments, Wallet & Escrow | Online payment methods, escrow/holding, commission model, worker wallet (top-up/withdraw/online status), financial ledger, refunds |
| **M4** | Trust, Communication & Administration | Chat, reviews & ratings, notifications, disputes & support, admin panel & analytics, security, quality, deployment, ops |

---

## A to Z Coverage Map (nothing missing)

### A. Business & Product Foundation (Project Identity)

| Topic | Where it lives |
|---|---|
| Product vision, goals (PRD) | Project-wide; required by **M1–M4** |
| Business problem, opportunity, stakeholders (BRD) | Project-wide; required by **M1–M4** |
| Business model & revenue source (commission) | **M3** |
| MVP scope & out-of-scope features | **M1–M4** (each module states its MVP part) |
| Workflow & quality goals | **M1–M4** (quality section in each) |
| Deliverables | Final presentation summary (outside modules) |

### B. Everybody / Accounts (People)

| Requirement | Module |
|---|---|
| Customer & worker registration (`FR-01`) | **M1** |
| Login, logout, OTP, JWT, role enforcement (`FR-02`) — passwordless phone + OTP; admin uses email/password | **M1** |
| Create & update worker profiles (`FR-03`) | **M1** |
| Customer profiles & account settings | **M1** |
| Worker verification (admin approval, ID upload) | **M1** |
| Suspend / deactivate accounts (`FR-14`) | **M1** (action and tools in **M4**) |
| Admin: view & manage users and workers (`FR-13`) | **M4** (tools) |

### C. Services & Discovery

| Requirement | Module |
|---|---|
| Service categories, create/edit/disable (`FR-04`) — 9 pre-seeded (incl. Urdu names), parent/sub-categories | **M2** (catalog) / **M4** (admin management) |
| Search & filter workers (`FR-05`) | **M2** |
| Worker profile info display (`FR-06`) | **M2** |
| Nearby worker matching (PostGIS) | **M2** |

### D. The Job Journey (Core Lifecycle)

| Requirement | Module |
|---|---|
| Create a service request (multi-step) (`FR-07`) | **M2** |
| Store customer, worker, service, request data (`FR-08`) | **M2** (+ DB wherever required) |
| Show new requests to workers (`FR-09`) | **M2** |
| Accept / reject requests (offers) (`FR-10`) | **M2** |
| Request statuses & state machine (`FR-11`) | **M2** |
| Customer status/history (`FR-12`) | **M2** |
| Record important request actions/events (`FR-15`) | **M2** |
| Negotiation (visit charge + repair price, counter-offers) | **M2** |
| Visits, arrival, GPS/live location tracking, inspection | **M2** |
| Repair estimates & approval; job completion | **M2** |
| Emergency service requests | **M2** |

### E. Money

| Requirement | Module |
|---|---|
| Online payments (`FR-18`): JazzCash / Easypaisa / card / cash | **M3** |
| Escrow / holding of job payment | **M3** |
| Commission model (earning): 10% of visiting charge (finalized) and 15% of total escrow (reviewed design) | **M3** |
| Worker wallet: exercises incl. top-up, balance, online/offline threshold (–500), withdrawal (min Rs.100), auto-payout | **M3** |
| Financial ledger + `wallets` / `wallet_ledger` tables (proposed additions to DB schema) | **M3** |
| Refunds & payment-related disputes | **M3** (+ **M4** dispute tooling) |

### F. Communication & Trust

| Requirement | Module |
|---|---|
| Customer–worker chat (`FR-17`): real-time, text/images/voice | **M4** |
| Reviews & ratings (`FR-16`): post-job dual review, rating recalculation | **M4** |
| Notifications: push (FCM topics by city/category), in-app, SMS, email — 15 event types | **M4** |
| Disputes, complaints, support | **M4** |
| Report / flag users & reviews | **M4** |

### G. Admin & Operations

| Requirement | Module |
|---|---|
| Admin dashboard, platform stats / analytics / reports | **M4** |
| User, worker, category management; verification queue | **M4** |
| Dispute resolution tools | **M4** |
| Commission & settings configuration | **M4** |
| Audit trail of admin actions | **M4** |

### H. Technology & Quality (applies everywhere)

| Topic | Where it lives |
|---|---|
| Backend stack (NestJS modular monolith, PostgreSQL + PostGIS, Redis, Socket.IO, FCM, S3, JWT, BullMQ) | **M1–M4** (stack notes in each) |
| Frontend stack (Next.js, TypeScript, Tailwind, shadcn/ui, Zustand, React Query, Mapbox, PWA, i18n Urdu/English RTL) | **M1–M4** (notes in each) |
| Security: OTP, JWT, RBAC, rate limiting, validation, hashing | **M1** (auth) + **M4** (platform-wide) |
| File uploads & media (S3 pre-signed, images max 5MB, thumbnails via Sharp) | **M2** (job media) + **M1** (KYC docs) + **M3** (payment proofs) |
| Performance & scalability | **M4** |
| Testing & QA | **M4** |
| Deployment & operations, monitoring | **M4** |
| Coding standards (conventional commits, lint, PR review) | **M4** |
| Design system (colors, components, responsive, bilingual) | **M1–M4** (screens in each) |

---

## How the 4 Modules Map to the Old 22+ Modules

| Old module list | Now in |
|---|---|
| Authentication & Accounts / User Profiles & Verification | **M1** |
| Service Categories / Job Posting / Job Discovery & Matching / Offers & Negotiation / Bookings & Scheduling / Visits & Inspection / Job Execution & Completion / Search & Filtering | **M2** |
| Payments, Wallet & Commission | **M3** |
| Reviews & Ratings / Chat & Messaging / Notifications / Disputes & Support / Admin Operations / Admin | **M4** |
| Location & Maps / File Uploads & Media | **M2** (location in matching/jobs; uploads support M1–M4) |
| Security, Audit & Reliability / Non-Functional / Testing & QA / Deployment & Operations | **M4** |

---

## Master Workflow Across the 4 Modules

```
Register/Login (M1)
   → Choose service & find worker (M2)
   → Send request (M2)
   → Worker offers & negotiation (M2)
   → Visit, inspect, repair approval (M2)
   → Pay via wallet/escrow (M3)
   → Chat / review / notify (M4)
   → Admin monitors & resolves (M4)
```

**Core idea:** Find the right skilled worker. Send a request. Manage the job clearly. Pay and build trust.