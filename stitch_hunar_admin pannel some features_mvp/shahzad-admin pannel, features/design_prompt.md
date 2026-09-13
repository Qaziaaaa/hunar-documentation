# HUNAR — COMPLETE DESIGN PROMPT

Use this prompt to design (and build) the HUNAR home-services marketplace demo.

**Source of truth:** `prompt.md` (full flow + requirements) and `colors.md` (visual identity). Follow them exactly.

---

## 1. WHAT YOU ARE BUILDING

Design **HUNAR**, a two-sided marketplace that connects **customers** who need a service with **nearby skilled workers**.

This is NOT a static mockup. Every screen must be connected and interactive. **Actions must change application state** — what the customer does must be reflected on the worker side and vice-versa. Build the experience, not just the design.

### The core lifecycle (the heart of the app)
```
Customer creates problem
  → Workers send visit offers
  → Customer selects worker
  → Worker visits
  → Worker inspects problem
  → Repair price is negotiated
  → Customer approves repair
  → Worker completes repair
  → Customer pays
  → Customer reviews worker
```

### Two distinct roles — do NOT reuse one dashboard with different labels

**Customer:** Post a Problem → Find a Worker → Confirm Visit → Approve Repair → Pay

**Worker:** Find Jobs → Send Offer → Visit Customer → Inspect → Get Approval → Complete Job → Get Paid

---

## 2. DESIGN SYSTEM (apply everywhere — non-negotiable)

Use the palette and rules from `colors.md`. Summary:

| Color | Hex | Meaning / Use |
|---|---|---|
| Navy | `#123B5D` | Trust — logo, headings, important text, dashboard numbers |
| Teal | `#0F8B8D` | Action — primary buttons, post job, accept, active states, verified, links |
| Orange | `#F59E0B` | Attention — ratings/stars, offers, pending, highlights, emergency accents |
| Background | `#F8FAFC` | Main page background |
| White | `#FFFFFF` | Cards, navbar, modals, forms |
| Dark | `#172033` | Body text |
| Gray | `#64748B` | Secondary text, placeholders |
| Green | `#16A34A` | Success — completed, approved, online |
| Red | `#DC2626` | Error — cancelled, rejected, delete |

### Rules
- **Navbar:** white background, navy HUNAR logo, navy/nav text, teal "Post a Job" button, navy-outline "Login". Do NOT make the entire navbar navy.
- **Primary action button = teal** (never orange for main buttons). Orange is for attention/offers/stars only.
- **Verified badge:** light-teal background `#E6F7F7` + teal text `#0F8B8D`, check icon.
- **Status colors (semantic):** Pending = Orange, Accepted/Active = Teal, In Progress = Navy, Completed/Paid = Green, Cancelled/Rejected = Red.
- **Stars/ratings:** always orange `#F59E0B`.
- **Chat:** my messages = teal, other = white, background `#F8FAFC`, text dark, send button teal. Avoid heavy navy bubbles.
- **Payment:** keep simple/trustworthy — total amount navy, methods white cards, selected method teal border, Pay button teal, success green.
- **Category cards:** all white with light-teal icon background + teal icon + navy name + gray description. Do NOT give each category its own color.
- **Focus states:** input border → teal on focus with light-teal focus ring.

### Typography & layout
- Font: **Inter** (weights 400–900).
- Clean, modern, trustworthy, responsive, consistent.
- Clear hierarchy, professional cards, status badges, progress indicators, good spacing, meaningful icons, clear CTAs, confirmation dialogs, toasts, loading states.
- Do NOT overcrowd screens.

---

## 3. PUBLIC / STARTING EXPERIENCE

A professional HUNAR **landing page** with:
- **Hero:** "Find the Right Professional for Your Job" — teal "Post a Job", white/navy "Find Professionals".
- Two paths: **Find a Professional** and **Join as a Worker**.
- **Login** and **Create Account** (role choice: Customer or Worker).
- Categories, featured professionals, how-it-works.

**Screens:** Landing, Services, Worker Directory, Worker Profile, Login, Register.

---

## 4. CUSTOMER FLOW (fully interactive)

1. **Register/Login** → customer enters their **Dashboard**.
2. **Create Job → Post a Job** — MULTI-STEP wizard:
   - Step 1 Service: choose category (AC Repair, Plumbing, Electrician, Carpenter, Appliance Repair, Painter, Cleaning, Other).
   - Step 2 Problem: title + detailed description.
   - Step 3 Media: upload/add multiple images, record voice (record → stop → preview → delete/re-record). Mock is fine but must behave realistically.
   - Step 4 Location: select/add location, show it clearly.
   - Step 5 Preferred visit: date/time picker.
   - Step 6 Review: show category, problem, description, images, voice, location, time, then **Post Job**.
   - Validate inline errors (e.g., "Please select a service category.").
3. **After posting** → real job created. Job Status = **Receiving Offers** showing: Job ID, problem, category, location, date, status, offer count (e.g., "3 Workers Interested").
4. **Worker offers** — demo workers respond (e.g., **Ali Khan** ⭐4.9, 245 jobs, Rs.300; **Hamza Electrician** ⭐4.7, 180 jobs, Rs.250; **Usman Services** ⭐4.8, 310 jobs, Rs.350). Each card: **View Profile** + **View Offer** + **Select Worker**.
5. **Worker profile** — photo, name, verified badge, rating, reviews, skills, experience, completed jobs, portfolio, service area, availability, visit charge. Return without losing job state.
6. **Select Worker** → confirmation modal ("You are selecting Ali Khan for this job") → **Confirm Selection** / **Cancel**. Status becomes **Visit Charge Negotiation**.
7. **Visit charge negotiation** — interactive counter-offers (e.g., Worker 300 → Customer 275 → Worker 300 → Customer 285 → Accepted). Once agreed → amount locked → **Visit Confirmed**.
8. **Visit confirmed** — worker, visit charge, date, time, location; **View Details** / **Cancel Visit** (with confirmation modal "Are you sure you want to cancel this visit?" Keep/Cancel).
9. **Track worker** — statuses driven by worker: **On The Way → Arrived → Inspection** (e.g., worker clicks "Start Visit" → customer sees "Worker is on the way"; "I've Arrived" → "Worker has arrived").
10. **Inspection result** — worker submits result (e.g., "AC capacitor is damaged"), required repair ("Replace capacitor"), estimate (Rs.700). Customer receives it.
11. **Repair price negotiation** — show Visit + Repair estimate + Total; **Approve** (Rs.700) or **Negotiate** (e.g., 700 → 600 → 650 → Agreed: 650). Worker can Accept/Counter/Reject.
12. **Approve repair** — Repair Agreement screen (Visit + Repair + Total) → **Approve Repair** → status **Repair Approved**.
13. **Repair in progress** — worker "Start Repair" → **Repair In Progress**; dashboard reflects immediately. Worker "Mark Repair Complete".
14. **Job complete** → **Proceed to Payment**.
15. **Payment** — **Total Payable** shown; options Demo Wallet / Cash / Card. **Pay Rs.935** → Payment Processing → Payment Successful → status **Paid** (handle "Payment failed. Please try again." error state too).
16. **Review** — "How was your experience?" star rating (5) + comment → **Submit Review** → review appears on worker profile; worker rating/count updates.

---

## 5. WORKER FLOW (equally functional)

- Register → Create Worker Profile → Select Skills → Add Experience → Add Service Areas → Upload Profile Picture → Verification → **Worker Dashboard**.
- **Dashboard / Nearby Jobs:** job cards with category, problem, location, distance, images, description, posted time, preferred visit time. Filters by category, distance, price, date, job type (filters must actually modify data).
- **Job details** → **Send Visit Offer** (enter Rs.300) → Submit. Customer sees it. Shared state updates.
- **Offer status:** Offer Sent / Customer Viewing / Counter Offer / Accepted / Rejected. Receive and respond to customer counter-offers.
- **Active Job:** customer info, problem, location, appointment, visit charge, status. Context-aware actions: Start Visit → I've Arrived → Start Inspection → Submit Inspection → Start Repair → Complete Repair (only the action valid for current status is shown).
- See confirmed appointment on dashboard. See payment completed. Receive customer review.

---

## 6. DASHBOARD (customer & worker)

**Customer:** Active Jobs, Upcoming Visits, Pending Offers, Recent Jobs, Total Spent.
**Worker:** Available/Nearby Jobs, Pending Requests, Completed Jobs, Earnings.

Stat accents: Active→Teal, Pending/Offers→Orange, Completed→Green, Total Spent/Earnings→Navy.

---

## 7. JOB DETAILS → DYNAMIC TIMELINE

A vertical timeline that updates as actions happen:
```
✓ Job Posted → ✓ Worker Selected → ✓ Visit Confirmed → ✓ Worker Arrived →
✓ Inspection Completed → ✓ Repair Price Agreed → ✓ Repair Approved →
● Repair In Progress → ○ Payment → ○ Review
```

---

## 8. NAVIGATION (every item must work)

**Customer sidebar/mobile:** Dashboard, Post a Job, My Jobs, Offers, Upcoming Visits, Payments, Reviews, Notifications, Profile, Settings.

**Worker sidebar/mobile:** Dashboard, Nearby Jobs, My Offers, Active Jobs, Upcoming Visits, Completed Jobs, Earnings, Reviews, Notifications, Profile, Settings.

---

## 9. SEARCH & FILTERS

- Workers filter jobs: category, distance, price, date, job type.
- Customers filter workers: skill, rating, distance, experience, availability.
- Filters must actually modify the displayed data.

---

## 10. EMPTY, ERROR & NOTIFICATION STATES

**Empty states** (never blank): No Jobs → "No active jobs yet." + "Post Your First Job"; No Offers → "We're waiting for professionals to respond."; No Nearby Jobs → "No jobs found in your service area."; No Notifications → "You're all caught up."; No Reviews → "Reviews will appear after completing jobs."

**Error states** (via inline validation, modals, or toasts): "Incorrect email or password." · "Please select a service category." · "Unable to access location." · "Please enter a valid visit charge." · "Payment failed. Please try again." · "Something went wrong. Please try again."

**Cancellation:** confirmation modal → "Are you sure you want to cancel this visit?" → Keep Visit / Cancel Visit → update status + reason.

**Notifications (clickable → navigate to screen):**
- Customer: "Ali Khan sent you a visit offer of Rs. 300." / "Ali Khan accepted your counter offer of Rs. 285." / "Ali Khan has arrived." / "Inspection report is ready." / "Repair price has been agreed." / "Job completed." / "Payment successful."
- Worker: "New nearby job available." / "Customer selected you." / "Customer sent a counter offer of Rs. 275." / "Customer approved the repair." / "Payment completed."

---

## 11. STATE TRANSITIONS (THE MOST IMPORTANT RULE)

Actions MUST change state:

| Before | After |
|---|---|
| Select Worker | Worker Selected |
| Waiting for Inspection | Inspection Available |
| Awaiting Approval | Repair Approved |
| Repair In Progress | Payment Pending |
| Payment Pending | Paid |
| Review Pending | Reviewed |

---

## 12. SCREEN INVENTORY

**Public:** Landing, Services, Worker Directory, Worker Profile, Login, Register.

**Customer:** Dashboard, Create Job, Job Details, Worker Offers, Worker Profile, Visit Negotiation, Visit Details, Inspection, Repair Negotiation, Repair Approval, Payment, Review, Job History, Notifications, Profile, Settings.

**Worker:** Dashboard, Profile Setup, Verification, Nearby Jobs, Job Details, Send Offer, My Offers, Negotiation, Upcoming Visits, Active Job, Inspection, Repair, Completion, Earnings, Reviews, Notifications, Profile, Settings.

---

## 13. FINAL ACCEPTANCE (the demo must pass BOTH journeys end-to-end)

**Customer:** Login → Post AC repair (description, images, voice, location) → receive 3 offers → open profile → select worker → negotiate visit charge → confirm visit → track worker → receive inspection → negotiate repair price → approve repair → track repair → payment → review.

**Worker:** Login → view nearby AC job → open job → send visit offer → receive counter offer → accept → see confirmed visit → start visit → mark arrived → inspect → submit inspection → receive repair negotiation → accept price → start repair → complete repair → see payment completed → receive review.

**If any major step ends in a static screen, the implementation is incomplete.**

**Do not optimize for the number of screens. Optimize for the quality and completeness of the user journey.**
