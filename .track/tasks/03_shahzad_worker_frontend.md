# SHAHZAD — WORKER FLOW FRONTEND (A to Z)

## Status: 🟢 ACTIVE — 63% ✅ (VERIFIED 2026-09-22 — build passes, core flow wired to backend)

## Your Role
Frontend Developer — Full Worker Flow

## Your Partner
**Hakim Ullah** (Backend) — You coordinate on API contracts. He builds the APIs, you build the UI.

## Your Flow
The complete worker journey: sign up → onboarding → dashboard → find jobs → send offers → visit → inspect → repair → earn → chat → profile.

## Source Documents
- `Project Modules/01_Worker_Flow.md` — Full requirements
- `Abdullah desigens customer + landing page/hunar_worker_dashboard/` — HTML prototype
- `Abdullah desigens customer + landing page/direct_chat_negotiation_hunar/` — Chat prototype

---

## MILESTONES

### M1: Auth + Onboarding + Dashboard (Foundation)

| # | Task | Route | Status |
|---|------|-------|--------|
| 1 | Worker sign-up (phone → OTP → password) | `(auth)/worker/sign-up/` | ✅ Done |
| 2 | Worker sign-in | `(auth)/worker/sign-in/` | ✅ Done |
| 3 | Onboarding wizard — Step 1: Personal Details | `(worker)/worker/onboarding/` | ✅ Done |
| 4 | Onboarding wizard — Step 2: Skills | `(worker)/worker/onboarding/` | ✅ Done |
| 5 | Onboarding wizard — Step 3: Experience | `(worker)/worker/onboarding/` | ✅ Done |
| 6 | Onboarding wizard — Step 4: Service Areas | `(worker)/worker/onboarding/` | ✅ Done |
| 7 | Onboarding wizard — Step 5: Documents | `(worker)/worker/onboarding/` | ✅ Done |
| 8 | Onboarding wizard — Step 6: Review & Submit | `(worker)/worker/onboarding/` | ✅ Done |
| 9 | Verification status screen (pending/approved/rejected) | `(worker)/worker/verification/` | ✅ Done |
| 10 | Dashboard shell (header, sidebar, toggle, stats, nav) | `(worker)/worker/dashboard/` | ✅ Done |
| 11 | Dashboard content — Nearby Jobs feed | `(worker)/worker/dashboard/` | 🔴 |
| 12 | Dashboard content — Job cards with all fields | `(worker)/worker/dashboard/` | 🔴 |

**M1 Deliverable:** Worker can sign up, complete onboarding, see verification status, and view dashboard with nearby jobs.

---

### M2: Jobs + Offers + Visit (Core Flow)

| # | Task | Route | Status |
|---|------|-------|--------|
| 13 | Job feed filters (category, distance, charge, time, type) | `(worker)/worker/dashboard/` | 🔴 |
| 14 | Job details screen (full request view) | `(worker)/worker/job/[id]/` | 🔴 |
| 15 | Voice note player (playable in job details) | `(worker)/worker/job/[id]/` | 🔴 |
| 16 | Send visit offer (charge + message) | Modal | 🔴 |
| 17 | Offer lifecycle statuses (sent/viewing/counter/accepted/rejected) | `(worker)/worker/offers/` | 🔴 |
| 18 | Counter-offer handling (accept/counter/bounded rounds) | Modal | 🔴 |
| 19 | Active job / pre-visit screen | `(worker)/worker/jobs/[id]/` | 🔴 |
| 20 | Status timeline with progress indicator | `(worker)/worker/jobs/[id]/` | 🔴 |
| 21 | Start Visit button → live location sharing | `(worker)/worker/jobs/[id]/visit/` | 🔴 |
| 22 | I've Arrived button → commission hold | `(worker)/worker/jobs/[id]/visit/` | 🔴 |
| 23 | Start Inspection button | `(worker)/worker/jobs/[id]/inspection/` | 🔴 |
| 24 | Submit Inspection (diagnosis, plan, estimate, photos, time) | `(worker)/worker/jobs/[id]/inspection/submit/` | 🔴 |

**M2 Deliverable:** Worker can find jobs, send offers, handle counters, and complete the visit/inspection sequence.

---

### M3: Repair + Earnings + Chat + Profile (Complete Flow)

| # | Task | Route | Status |
|---|------|-------|--------|
| 25 | Repair negotiation (accept/counter/locked price) | `(worker)/worker/jobs/[id]/repair/` | 🔴 |
| 26 | Scope-change approval (revised estimate) | `(worker)/worker/jobs/[id]/repair/` | 🔴 |
| 27 | Start Repair → Complete Repair | `(worker)/worker/jobs/[id]/repair/` | 🔴 |
| 28 | Earnings screen (wallet balance, commission, transactions) | `(worker)/worker/earnings/` | 🔴 |
| 29 | Wallet top-up (send money + upload screenshot proof) | `(worker)/worker/earnings/topup/` | 🔴 |
| 30 | Commission payment instructions | `(worker)/worker/earnings/` | 🔴 |
| 31 | Reviews display (average rating + individual reviews) | `(worker)/worker/profile/reviews/` | 🔴 |
| 32 | Chat with customer (text + images, real-time) | `(worker)/worker/chat/` | 🔴 |
| 33 | Notifications panel + unread badges | `(worker)/worker/notifications/` | 🔴 |
| 34 | Profile (public-facing: photo, name, verified badge, rating, skills, experience, bio, areas) | `(worker)/worker/profile/` | 🔴 |
| 35 | Edit profile (photo, bio, skills, experience, areas) | `(worker)/worker/profile/edit/` | 🔴 |
| 36 | Settings (password, notifications, language, privacy, delete/logout) | `(worker)/worker/settings/` | 🔴 |
| 37 | Cancellation screens (before visit, after arrival, with reason) | Modal | 🔴 |
| 38 | Empty states (no nearby jobs, no offers, etc.) | Various | 🔴 |

**M3 Deliverable:** Full worker flow working end-to-end.

---

## WHAT YOU NEED FROM YOUR PARTNER (Hakim)

| When | What You Need |
|------|---------------|
| M1 | Worker auth APIs, onboarding APIs, verification status APIs |
| M2 | Jobs feed API (PostGIS matching), offers API, visit state machine API |
| M3 | Inspection API, repair API, wallet API, commission API, chat API, notification APIs |

---

## WHAT YOU'RE BLOCKED ON

| Blocker | Resolution |
|---------|------------|
| Backend paused | Build with mock data, integrate later |
| No API contracts yet | Define endpoints with Hakim before M2 |

---

## RULES TO FOLLOW

1. **Use mock data** for all screens until backend is ready.
2. **Use design tokens** — Navy `#123B5D`, Teal `#0F8B8D`, Orange `#F59E0B`, Green `#16A34A`, Red `#DC2626`.
3. **Follow HTML prototype** for dashboard layout.
4. **One offer per job** — enforce in UI.
5. **Bounded negotiation** — show round counter.
6. **Price locking** — agreed prices cannot change silently.
7. **State-driven buttons** — visit buttons appear only when job state allows.
8. **Inspection fields are REQUIRED** — diagnosis, plan, estimate, photos, time.
9. **Commission = 10% of visit charge** — show clearly on earnings.
10. **Wallet top-up via screenshot proof** — upload flow must work.
11. **All money shown as "Rs."** with Pakistani formatting.
12. **Verified badge** = teal checkmark, only when admin-verified.
13. **Voice note player** — must be playable.
14. **No features outside this file.** Only build what's listed.

---

## DONE CHECKLIST

- [ ] Worker can sign up (phone → OTP → password)
- [ ] Worker can sign in
- [ ] 6-step onboarding wizard works
- [ ] Verification status screen shows correct state
- [ ] Dashboard shows nearby jobs with all card fields
- [ ] Job feed filters work (5 filters)
- [ ] Job details show full request (photos, voice, map)
- [ ] Worker can send visit offer (one per job)
- [ ] Offer statuses display live
- [ ] Counter-offer handling works (bounded rounds)
- [ ] Active job / pre-visit screen works
- [ ] Visit sequence: Start → Arrived → Inspect → Submit
- [ ] Repair negotiation works (accept/counter/locked price)
- [ ] Start Repair → Complete Repair works
- [ ] Earnings screen shows wallet, commission, transactions
- [ ] Wallet top-up via screenshot proof works
- [ ] Reviews display (average + individual)
- [ ] Chat works (text + images, real-time)
- [ ] Notifications show with unread badges
- [ ] Profile and settings work
- [ ] Cancellation screens work
- [ ] Empty states are friendly
- [ ] Design tokens applied everywhere
