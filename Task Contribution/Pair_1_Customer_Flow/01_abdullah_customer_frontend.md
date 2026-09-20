# ABDULLAH — CUSTOMER FLOW FRONTEND (A to Z)

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
| 1 | Customer sign-up (phone → OTP → password) | `(auth)/customer/sign-up/` | 🟢 Done |
| 2 | Customer sign-in | `(auth)/customer/sign-in/` | 🟢 Done |
| 3 | Customer dashboard shell (header, nav, stats) | `(customer)/customer/dashboard/` | 🟢 Done |
| 4 | Dashboard content (active jobs, upcoming visits, recent jobs, total spent) | `(customer)/customer/dashboard/` | 🟢 Done |

**M1 Deliverable:** Customer can sign up, sign in, and see their dashboard. (Completed)

---

### M2: Core Flow (Post-a-Job → Offers → Tracking)

| # | Task | Route | Status |
|---|------|-------|--------|
| 5 | Post-a-job wizard Step 1 — Service category | `(customer)/customer/post-job/` | 🟢 Done |
| 6 | Post-a-job wizard Step 2 — Problem (title + description) | `(customer)/customer/post-job/` | 🟢 Done |
| 7 | Post-a-job wizard Step 3 — Media (photos + voice note) | `(customer)/customer/post-job/` | 🟢 Done |
| 8 | Post-a-job wizard Step 4 — Location (address + map) | `(customer)/customer/post-job/` | 🟢 Done |
| 9 | Post-a-job wizard Step 5 — Preferred visit time | `(customer)/customer/post-job/` | 🟢 Done |
| 10 | Post-a-job wizard Step 6 — Review & post | `(customer)/customer/post-job/` | 🟢 Done |
| 11 | Job detail — Receiving offers view | `(customer)/customer/jobs/[id]/` | 🟢 Done |
| 12 | Worker offer cards (name, rating, verified badge, visit charge) | `(customer)/customer/jobs/[id]/` | 🟢 Done |
| 13 | Worker profile modal (full profile view) | Modal | 🟢 Done |
| 14 | Accept offer + confirmation dialog | `(customer)/customer/jobs/[id]/` | 🟢 Done |
| 15 | Counter offer / negotiate visit charge | Modal | 🟢 Done |
| 16 | Upcoming visits list | `(customer)/customer/visits/` | 🟢 Done |
| 17 | Live worker tracking (map + status timeline) | `(customer)/customer/visits/` | 🟢 Done |

**M2 Deliverable:** Customer can post a job, receive offers, pick a worker, and track them. (Completed)

---

### M3: Complete Flow (Inspection → Payment → Reviews)

| # | Task | Route | Status |
|---|------|-------|--------|
| 18 | Inspection report view (diagnosis, repair plan, estimate, photos) | `(customer)/customer/jobs/[id]/` | 🟢 Done |
| 19 | Approve / counter repair estimate | `(customer)/customer/jobs/[id]/` | 🟢 Done |
| 20 | Repair progress view | `(customer)/customer/jobs/[id]/` | 🟢 Done |
| 21 | Job completion confirmation | `(customer)/customer/jobs/[id]/complete/` | 🟢 Done |
| 22 | Payment screen (demo wallet / cash / card) | `(customer)/customer/jobs/[id]/complete/` | 🟢 Done |
| 23 | Payment success state | `(customer)/customer/jobs/[id]/complete/` | 🟢 Done |
| 24 | Payment history | `(customer)/customer/visits/` | 🟢 Done |
| 25 | Review prompt + star rating + written review | `(customer)/customer/jobs/[id]/complete/` | 🟢 Done |
| 26 | My reviews list | `(customer)/customer/jobs/[id]/complete/` | 🟢 Done |
| 27 | Chat with worker (text + images, real-time) | `(customer)/customer/visits/` | 🟢 Done |
| 28 | Notifications panel + unread badges | `(customer)/customer/dashboard/` | 🟢 Done |
| 29 | Profile (name, phone, photo, location) | `(customer)/customer/profile/` | 🟢 Done |
| 30 | Settings (password, notifications, language, delete/logout) | `(customer)/customer/profile/` | 🟢 Done |

**M3 Deliverable:** Full customer flow working end-to-end. (Completed)

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
