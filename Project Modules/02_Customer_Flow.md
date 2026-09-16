# HUNAR — Module 2: Full Customer Flow (A to Z)

## Purpose of this document
This module explains the **complete customer journey** inside HUNAR — from the moment a customer has a home problem all the way through posting a job, comparing workers, approving repair, paying, and reviewing. Every screen, status, and rule is described exactly as required. No extra features are added, and no required feature is missing.

The customer is a **homeowner or tenant** with a problem to fix (a leaking tap, dead electrical socket, broken AC, etc.) who wants to find a nearby skilled worker.

---

## 1. Roles & Access Model
Exactly three roles exist. This module covers **Customer**.

| Role | Own Dashboard |
|---|---|
| **Customer** | Customer Dashboard |
| Worker | Worker Dashboard |
| Admin | Admin Dashboard |

Dashboards are role-specific and separate.

---

## 2. Customer Account Lifecycle (Big Picture)

```
1. Sign Up → 2. Verify Phone → 3. Customer Dashboard
→ 4. Post a Job → 5. Receive Worker Offers → 6. Compare & Pick a Worker
→ 7. Negotiate Visit Charge → 8. Confirm Visit → 9. Track Worker
→ 10. Receive Inspection → 11. Approve Repair → 12. Pay → 13. Review → Repeat
```

---

## 3. Step A — Registration & Login

### 3.1 Sign Up (First Time)
1. Customer opens HUNAR web app.
2. Clicks **"Sign Up as Customer"**.
3. Enters **phone number** (Pakistani mobile, e.g. `03xx-xxxxxxx`).
4. Clicks **"Get OTP"**.
5. A 6-digit **OTP** is sent via SMS.

**OTP rules (same systemwide):**
- Valid for **5 minutes**.
- New OTP may be requested at most once every **15 minutes** per phone.
- Max **3 failed attempts** before the OTP is invalidated and a new one is needed.
- Request rate is throttled to stop abuse.

6. Customer enters the OTP (correct) → continues.
7. Customer creates a **password** (bcrypt-hashed).
8. Account created with role = **CUSTOMER**.

### 3.2 Login (Returning)
1. Phone number + password.
2. Server issues **access token (15 min)** + **refresh token (30 days)**.
3. Land on **Customer Dashboard**.

### 3.3 First Profile Setup (light, optional but encouraged)
- Name, phone (pre-filled), optional profile photo.
- Optional default location (home city/town).
- Unlike workers, **no document verification or admin approval** is needed for a customer.

---

## 4. Step B — Customer Dashboard

The customer's home screen.

### 4.1 Layout (top to bottom)
- **Header:** App name (HUNAR), search bar (jobs / categories), notifications bell with unread badge, profile avatar.
- **Hero / quick action:** Large **"Post a Job"** button (primary CTA, teal).
- **Sections:**
  - **Active Jobs** — jobs in progress or awaiting worker.
  - **Upcoming Visits** — confirmed visits with date/time/pending.
  - **Pending Offers** — offers waiting on the customer's decision.
  - **Recent Jobs** — completed job history (tap → reopen details/review).
  - **Total Spent** stats card (Rs.).

### 4.2 Main Navigation

| Item | Purpose |
|---|---|
| Dashboard | Home |
| Post a Job | New service request wizard |
| My Jobs | All jobs with statuses |
| Offers | Offers across all jobs |
| Upcoming Visits | Scheduled visits |
| Payments | Payment history |
| Reviews | My reviews |
| Notifications | Alerts |
| Profile / Settings | Account |

---

## 5. Step C — Post a Job (the service request wizard)

This is the heart of the customer flow. It is a **guided multi-step wizard**. Each step must be completed before moving to the next; the customer can go back and edit.

**Step 1 — Service**
- Choose the **service category**: Electrician, Plumber, AC Technician, Carpenter, Painter, Mechanic (whatever categories the admin has enabled).
- Category icons/colors are shown.

**Step 2 — Problem**
- **Title** (short problem headline, e.g., "Leaking kitchen pipe").
- **Description** (details of the problem).

**Step 3 — Media**
- **Photos** — up to a fixed number of photos of the problem (uploaded, compressed).
- **Voice note** — optional voice description (recorded in-app) for customers who prefer speaking, especially in Urdu. Useful for low-literacy users.

**Step 4 — Location**
- Customer picks the **work address** (typed or map-picked).
- Address text + geocoded coordinates (Mapbox geocoding; stored for PostGIS distance matching).

**Step 5 — Preferred Visit Time**
- **Now/ASAP** or a **chosen date + time window**.

**Step 6 — Review & Post**
- Summary of service, problem, photos, voice, location, preferred visit time.
- **Optional:** suggested **visit charge** the customer is willing to pay (kickstarts negotiation).
- Customer taps **"Post Job"**.

**Result:** The job is **published** as an open request, visible to nearby matched workers. Status = **open**.

### Empty / First-Post Friction
- A first-time customer sees a short "how it works" hint the first time they post (reduce uncertainty).
- If the customer skips required fields, inline validation highlights what's missing (react-hook-form + zod).

---

## 6. Step D — Receiving Offers

After posting, the customer sees the **Job Detail / Receiving Offers** screen.

### 6.1 What the customer sees
- **Job ID** and title
- Category + description + photos + voice
- Location + preferred visit time
- **Status:** "Receiving Offers" (open)
- **Count of offers** received (e.g., "3 workers have made offers")
- The list of **worker offers**:

| Offer element | Shows |
|---|---|
| Worker name + **verified badge** (teal) | Trust signal |
| Worker **rating** (★) + review count | Quality signal |
| **Visit charge (Rs.)** | What it costs to come |
| Worker photo | Recognition |
| View Profile button | Full profile |
| **Accept** / negotiate action | Decision |

### 6.2 Realtime
- When a new offer arrives, the customer gets an instant toast + notification ("New offer from Abdul, Rs. 400").
- Offers update live (Socket.IO) without refreshing.

### 6.3 Empty states
- No offers yet: friendly state "Workers are viewing your job. We’ll notify you when offers arrive." with a share/refresh hint.

---

## 7. Step E — Comparing Workers (View Profile)

Customer taps **"View Profile"** on any offer → Worker Profile screen:

- Photo, name, **verified badge** (only if admin-verified)
- **Rating** (average stars) + **review count**
- **Reviews list** (what previous customers said — star + text)
- **Skills** (categories the worker offers)
- **Experience** (years) + bio
- **Completed jobs** count
- **Service areas**
- **Visit charge** (this worker's asking price)
- Cancellation/no-show history hints (reliability)

### 7.1 Decision support
The design gives the customer clear, comparable signals on every offer: price, rating, verification, reviews, distance. The **verified badge** and **rating** are shown right on the offer card ("above the fold") because trust is the #1 decision driver for home services.

---

## 8. Step F — Selecting a Worker & Visit Charge Negotiation

### 8.1 Accept an offer
Customer taps **"Accept"** on the best offer → confirmation dialog:
- Shows worker name, rating, visit charge.
- Confirms the customer accepts the worker for the **visit**.

When accepted:
- Selected worker's status → **Accepted** (active job).
- All other workers on the job instantly see **"Closed / assigned to another worker"**.
- Job status → **offer_accepted / worker_assigned**.

### 8.2 Counter / Negotiation
If the customer doesn't like the visit charge:
- Customer taps **"Counter Offer"** and enters their own visit charge.
- The worker can **accept** it or **counter back**.
- Bounded rounds of negotiation until agreement.
- When both agree, the **visit charge is locked**.

**Also possible:** customer sends a private message with the counter (reasonable context on why — e.g., "I'm 2 km away").

---

## 9. Step G — Visit Confirmed (Pre-Visit)

Once a worker is confirmed:
- Job moves to **Upcoming Visits**.
- **Visit card shows:** worker (name, photo, rating, verified), agreed visit charge (Rs.), date & time window, address, map.
- Actions:
  - **View Details** (job + worker)
  - **Cancel Visit** (before the visit — see §13 cancellation)
  - **Message Worker** (chat)
- Customer receives a notification when the visit window approaches: **"Your worker's visit is coming up."**

---

## 10. Step H — Tracking the Worker (Live)

During the visit, the customer sees a **live tracking** experience:

| Worker action | Customer sees |
|---|---|
| Worker taps "Start Visit" | **"Worker is On The Way"** + live location on the map (real-time). |
| Worker taps "I've Arrived" | **"Worker has arrived"** / "Worker is at your location" |
| Worker inspects | **"Worker is inspecting the problem"** |

The status timeline at the top of the job shows exactly where in the process things are (progress + momentum design).

---

## 11. Step I — Inspection & Repair Estimate

After the worker submits the inspection, the customer sees:

- **Diagnosis** (plain-language summary)
- **Repair plan** (what will be done)
- **Repair price estimate (Rs.)** — separate from the visit charge
- **Photos** captured by the worker as evidence
- **Estimated repair time**

### Customer's two options:
1. **Approve the repair estimate** (job → repair approved). Now available: "Repair approved".
2. **Counter / negotiate** — customer enters a different price; worker accepts or counters back; until agreement.

**Rules (important to the trust model):**
- The repair price is **separate** from the visit charge. The customer never pays an unexplained lump.
- Once accepted, the **price is locked**. If the worker needs more mid-repair, they must submit an **amended estimate** and wait for the customer to **approve it explicitly** before continuing at the higher price.
- The customer can reject the estimate entirely and end the job (only the agreed visit charge may apply).

---

## 12. Step J — Repair Progress & Completion

- Job status **repair_in_progress** → customer sees "Worker is performing the repair."
- Worker taps **"Complete Repair"** → job status **completed**.
- Customer is notified with a clear **"Job Completed!"** confirmation and the final bill:
  - Visit charge (Rs. X) — the agreed amount
  - Repair charge (Rs. Y) — the agreed amount
  - **Total (Rs.)**
- Customer confirms the job is done → proceeds to payment.

---

## 13. Step K — Payment

### 13.1 Where the customer pays
On the **Payment screen** after job completion. Options (interactive-demo/MVP payment modes):
- **Demo Wallet** (preloaded demo balance)
- **Cash** (mark as paid to worker)
- **Card** (mock/placeholder for the eventual gateway — see Module 4)

### 13.2 Payment flow
1. Customer taps **"Proceed to Payment"**.
2. Chooses a payment method.
3. Confirms.
4. **Success state** — green "Payment Successful" + order/job summary. (Dopamine moment: subtle celebration.)

### 13.3 What money goes where (customer view)
- **Visit charge** → worker (platform takes its 10% commission on this from the worker's wallet — the customer pays the agreed visit charge; commission does not change the customer's bill).
- **Repair charge** → worker in full (MVP).

### 13.4 Payment history
The **Payments** tab lists every past payment: job, worker, date, amount, method, status.

---

## 14. Step L — Review the Worker

- After payment, the customer is prompted to rate the worker.
- **Rating:** 1–5 stars.
- **Written review:** optional text ("Very clean work", "Arrived late but fixed it well").
- On submit:
  - Review is attached to the job + worker.
  - It appears on the worker's profile (visible to all).
  - Worker receives a notification.
- Job status → **reviewed** (complete).

The review is mandatory-ish by flow design (a review prompt appears and the job isn't fully "done" until rated; skipping is allowed but encouraged). The platform relies on ratings to build trust and to help the best workers surface.

---

## 15. Chat & Communication (Customer Side)

- One-to-one chat with the selected worker (only after/during active job).
- Instant messages via Socket.IO; image attachments supported.
- Used for pre-visit clarifications, arrival coordination, repair questions.

---

## 16. Notifications (Customer Side)

| Event | Notification example |
|---|---|
| Job posted | "Your job #1024 is now receiving offers." |
| New offer | "New offer received: Rs. 400 from Ahmed." |
| Multiple offers | "3 offers waiting for your decision." |
| Offer accepted | "You accepted Usman's offer." |
| Visit starting | "Usman is on the way." |
| Worker arrived | "Usman arrived at your location." |
| Inspection done | "Inspection report is ready to review." |
| Repair approved | "Repair price agreed: Rs. 1500." |
| Job completed | "Your repair is complete. Please pay and review." |
| Payment received | "Payment successful." |
| New message | "New message from Usman." |
| Visit reminder | "Visit scheduled in 1 hour." |
| Review reminder | "Don't forget to rate your worker." |

Notifications carry an **unread badge**; tapping opens the related screen.

---

## 17. Cancellation & Edge-Case Handling (Customer)

| Scenario | Behavior |
|---|---|
| Customer cancels before any worker accepts | Job returns to draft/deleted; no cost. |
| Customer cancels after offers but before accepting | Job closed; workers notified; nothing owes. |
| Customer cancels after accepting (before visit) | Worker notified; no charge (per cancellation policy; repeated abuse can be flagged by admin). |
| Customer cancels during repair | Must give reason; agreed work may be billed per policy; system + admin review. |
| Worker never shows | Customer can report **"No Show"**; admin investigates; affects worker, not customer. |
| Customer doesn't like the inspection | Can reject estimate → end job (visit charge may still be due per terms). |
| No offers ever come | Suggested actions: raise visit charge, add photos/voice, expand to nearby areas, re-post; support contact. |

---

## 18. Complete Customer Flow Summary (A to Z, one list)

| # | Step | Where |
|---|---|---|
| 1 | Sign up as Customer (phone + OTP + password) | Auth |
| 2 | Login / refresh-token auto-login | Auth |
| 3 | Land on Customer Dashboard | Dashboard |
| 4 | Post a Job wizard (service → problem → media → location → time → review) | Post a Job |
| 5 | Watch offers arrive live | Job detail |
| 6 | Compare workers (profile, rating, verified, reviews, price) | Offers |
| 7 | Negotiate visit charge (accept or counter) | Negotiation |
| 8 | Confirm visit → upcoming visits | Visit |
| 9 | Track worker live (on the way → arrived → inspecting) | Tracking |
| 10 | Review inspection (diagnosis + repair estimate) | Inspection |
| 11 | Approve or negotiate the repair price | Repair |
| 12 | Watch repair progress → completion | Repair |
| 13 | Pay (demo wallet / cash / card) → success | Payment |
| 14 | Rate & review the worker | Review |

---

## 19. Design & UX Conventions (Customer Surface)

- **Primary CTA (Post a Job/buttons):** Teal `#0F8B8D`
- **Headings & trust text:** Navy `#123B5D`
- **Ratings (★) and attention:** Orange `#F59E0B` (e.g., low-offer warnings, pending)
- **Background:** `#F8FAFC`; cards white
- **Body text:** Dark `#172033`; secondary Gray `#64748B`
- **Success states (paid, approved):** Green `#16A34A`
- **Error states (rejected, cancelled):** Red `#DC2626`
- **Status chips:** Pending = Orange; Accepted/Active = Teal; In Progress = Navy; Completed/Paid = Green; Cancelled = Red
- **Verified worker badge:** teal check next to the name (rendered in offer cards and profiles)
- **Voice note player** in job/offer details (for Urdu-speaking users)
- **Progress timeline** on job detail (momentum design installs trust as the job advances)
- All rupees shown as "Rs." with Pakistani formatting.