# ABDULLAH — CUSTOMER FLOW FRONTEND (A to Z)

## Status: 🟢 ACTIVE — 83% (VERIFIED 2026-09-22)

**Verified (build passes, routes wired to backend) — 25/30 done (83%)**
- M1 4/4: sign-up, sign-in, dashboard shell, dashboard content (all wired to APIs)
- M2 13/13: post-a-job wizard (4 steps incl. map picker + voice note), job detail, offers hub, worker offer cards, worker profile modal, select worker, counter offer, upcoming visits, live tracking — DONE
- M3 8/13: inspection report view, approve/counter estimate, repair progress, job completion — DONE. Payments (3), reviews (2) NOT done yet.
- **Your M3 payments + reviews are unblocked** — Shafqat's backend is resumed and payments/wallet backends exist.

## Your Role
Frontend Developer — Full Customer Flow

## Your Partner
**Shafqat Ullah** (Backend) — You coordinate on API contracts. He builds the APIs, you build the UI.

## Your Flow
The complete customer journey: sign up → post a job → receive offers → compare workers → negotiate → track worker → review inspection → approve repair → pay → review.

## Source Documents
- `Project Modules/02_Customer_Flow.md` — Full requirements
- `Abdullah desigens customer + landing page/` — HTML prototypes (your design reference)

---

## MILESTONES

### M1: Auth + Dashboard (Foundation)

| # | Task | Route | Status |
|---|------|-------|--------|
| 1 | Customer sign-up (phone → OTP → password) | `(auth)/customer/sign-up/` | 🔴 |
| 2 | Customer sign-in | `(auth)/customer/sign-in/` | 🔴 |
| 3 | Customer dashboard shell (header, nav, stats) | `(customer)/customer/dashboard/` | 🔴 |
| 4 | Dashboard content (active jobs, upcoming visits, recent jobs, total spent) | `(customer)/customer/dashboard/` | 🔴 |

**M1 Deliverable:** Customer can sign up, sign in, and see their dashboard.

---

### M2: Core Flow (Post-a-Job → Offers → Tracking)

| # | Task | Route | Status |
|---|------|-------|--------|
| 5 | Post-a-job wizard Step 1 — Service category | `(customer)/customer/post-job/` | 🔴 |
| 6 | Post-a-job wizard Step 2 — Problem (title + description) | `(customer)/customer/post-job/step-2` | 🔴 |
| 7 | Post-a-job wizard Step 3 — Media (photos + voice note) | `(customer)/customer/post-job/step-3` | 🔴 |
| 8 | Post-a-job wizard Step 4 — Location (address + map) | `(customer)/customer/post-job/step-4` | 🔴 |
| 9 | Post-a-job wizard Step 5 — Preferred visit time | `(customer)/customer/post-job/step-5` | 🔴 |
| 10 | Post-a-job wizard Step 6 — Review & post | `(customer)/customer/post-job/step-6` | 🔴 |
| 11 | Job detail — Receiving offers view | `(customer)/customer/job/[id]/` | 🔴 |
| 12 | Worker offer cards (name, rating, verified badge, visit charge) | `(customer)/customer/job/[id]/` | 🔴 |
| 13 | Worker profile modal (full profile view) | Modal | 🔴 |
| 14 | Accept offer + confirmation dialog | `(customer)/customer/job/[id]/` | 🔴 |
| 15 | Counter offer / negotiate visit charge | Modal | 🔴 |
| 16 | Upcoming visits list | `(customer)/customer/visits/` | 🔴 |
| 17 | Live worker tracking (map + status timeline) | `(customer)/customer/job/[id]/tracking/` | 🔴 |

**M2 Deliverable:** Customer can post a job, receive offers, pick a worker, and track them.

---

### M3: Complete Flow (Inspection → Payment → Reviews)

| # | Task | Route | Status |
|---|------|-------|--------|
| 18 | Inspection report view (diagnosis, repair plan, estimate, photos) | `(customer)/customer/job/[id]/inspection/` | 🔴 |
| 19 | Approve / counter repair estimate | `(customer)/customer/job/[id]/inspection/` | 🔴 |
| 20 | Repair progress view | `(customer)/customer/job/[id]/repair/` | 🔴 |
| 21 | Job completion confirmation | `(customer)/customer/job/[id]/complete/` | 🔴 |
| 22 | Payment screen (demo wallet / cash / card) | `(customer)/customer/payments/` | 🔴 |
| 23 | Payment success state | `(customer)/customer/payments/success/` | 🔴 |
| 24 | Payment history | `(customer)/customer/payments/history/` | 🔴 |
| 25 | Review prompt + star rating + written review | `(customer)/customer/job/[id]/review/` | 🔴 |
| 26 | My reviews list | `(customer)/customer/reviews/` | 🔴 |
| 27 | Chat with worker (text + images, real-time) | `(customer)/customer/chat/` | 🔴 |
| 28 | Notifications panel + unread badges | `(customer)/customer/notifications/` | 🔴 |
| 29 | Profile (name, phone, photo, location) | `(customer)/customer/profile/` | 🔴 |
| 30 | Settings (password, notifications, language, delete/logout) | `(customer)/customer/settings/` | 🔴 |

**M3 Deliverable:** Full customer flow working end-to-end.

---

## WHAT YOU NEED FROM YOUR PARTNER (Shafqat)

| When | What You Need |
|------|---------------|
| M1 | Customer auth APIs (OTP, signup, login, tokens) |
| M2 | Job posting APIs, offer APIs, job detail APIs |
| M3 | Payment APIs, review APIs, chat APIs, notification APIs |

---

## WHAT YOU'RE BLOCKED ON

| Blocker | Resolution |
|---------|------------|
| Backend paused | Build with mock data, integrate later |
| No API contracts yet | Define endpoints with Shafqat before M2 |

---

## RULES TO FOLLOW

1. **Use mock data** for all screens until backend is ready.
2. **Use design tokens** — Navy `#123B5D`, Teal `#0F8B8D`, Orange `#F59E0B`, Green `#16A34A`, Red `#DC2626`.
3. **Follow HTML prototypes** in `Abdullah desigens customer + landing page/`.
4. **One offer per job** — enforce in UI.
5. **Bounded negotiation** — show round counter.
6. **Price locking** — agreed prices cannot change silently.
7. **Voice note player** — must be playable in job/offer details.
8. **Progress timeline** — show on job detail (momentum design).
9. **All money shown as "Rs."** with Pakistani formatting.
10. **No features outside this file.** Only build what's listed.

---

## DONE CHECKLIST

- [ ] Customer can sign up (phone → OTP → password)
- [ ] Customer can sign in
- [ ] Dashboard shows active jobs, upcoming visits, recent jobs, total spent
- [ ] Post-a-job wizard works (6 steps)
- [ ] Job detail shows offers from workers
- [ ] Customer can accept or counter offers
- [ ] Live worker tracking works
- [ ] Inspection report is viewable
- [ ] Repair estimate can be approved or countered
- [ ] Payment screen works
- [ ] Review can be submitted
- [ ] Chat works (text + images)
- [ ] Notifications show with unread badges
- [ ] Profile and settings work
- [ ] Design tokens applied everywhere
