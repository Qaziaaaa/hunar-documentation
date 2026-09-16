# HUNAR — Module 1: Full Worker Flow (A to Z)

## Purpose of this document
This module explains the **complete worker journey** inside the HUNAR platform — from the very first time a worker opens the app all the way to getting paid and receiving reviews. Every step, every screen, every status, and every rule is described exactly as required. No extra features are added, and no required feature is missing.

The worker is a **skilled professional** (electrician, plumber, AC technician, carpenter, painter, mechanic) who earns money by visiting customers, inspecting problems, and completing repairs.

---

## 1. Roles & Access Model

There are exactly **three** roles in HUNAR. A user registers as ONE role and never switches between them on the same account.

| Role | Who | Own Dashboard |
|---|---|---|
| **Customer** | Person who has a problem to fix | Customer Dashboard |
| **Worker** | Skilled professional who fixes problems | Worker Dashboard |
| **Admin** | Platform manager | Admin Dashboard |

This module covers the **Worker** role only. Each role has its own separate dashboard with its own layout, labels, and navigation. Dashboards are NOT shared or reused between roles.

---

## 2. Worker Account Lifecycle (Big Picture)

```
1. Sign Up → 2. Verify Phone → 3. Create Worker Profile → 4. Submit for Verification
→ 5. Admin Approves → 6. Worker Goes Online → 7. Find & Offer on Jobs
→ 8. Visit Job → 9. Inspect Problem → 10. Negotiate & Approve Repair
→ 11. Complete Repair → 12. Get Paid → 13. Receive Review → Repeat
```

---

## 3. Step A — Registration & Login

### 3.1 Sign Up (First Time)
1. Worker opens HUNAR web app.
2. Clicks **“Sign Up as Worker”**.
3. Enters their **phone number** (Pakistani mobile number, e.g. `03xx-xxxxxxx`).
4. Clicks **“Get OTP”**.
5. HUNAR sends a 6-digit **OTP code** to the phone via SMS.

**OTP rules (must always apply):**
- OTP is valid for **5 minutes** only.
- A phone number may request a new OTP at most once every **15 minutes** (rate limit).
- Maximum **3 failed attempts** to enter OTP per request. After 3 wrong attempts, the OTP is invalidated and the worker must request a new one (waiting for the 15-minute window).
- The system rate-limits repeated requests (a phone cannot hammer the OTP endpoint).

6. Worker enters the OTP. If correct, registration continues.
7. Worker creates a **password** (stored securely as a bcrypt hash).
8. Account is created with the role = **WORKER**.

### 3.2 Login (Returning User)
1. Worker opens the app.
2. Enters **phone number + password**.
3. Server verifies credentials with bcrypt, issues two tokens:
   - **Access token** (JSON Web Token) — valid **15 minutes**.
   - **Refresh token** — valid **30 days** (used to silently get a new access token when the old one expires).
4. Worker lands on the **Worker Dashboard**.

### 3.3 First-Time Profile Setup (Mandatory)
After first signup (before the worker can see jobs), the worker must complete the profile. This is an on-boarding wizard with these steps, in order:

**Step 1 — Personal Details**
- Full name
- Profile photo (uploaded; auto-compressed)
- Phone (pre-filled from signup, not editable here)

**Step 2 — Skills / Services** (the worker picks which service categories they offer)
- Electrician, Plumber, AC Technician, Carpenter, Painter, Mechanic (and any other category enabled by admin).
- Worker can select **multiple** skills.
- These skills control which job notifications/offers the worker sees. Category selection drives the matching algorithm.

**Step 3 — Experience**
- Years of experience (e.g., 0–50).
- Short bio describing what they do.

**Step 4 — Service Areas**
- Worker sets the areas/towns they work in (neighborhood of Peshawar; enables the location parameter so nearby jobs can be matched).
- Location is stored as coordinates (PostGIS) + a readable address; geocoded via Mapbox.

**Step 5 — Verification Documents (required)**
- CNIC / valid ID (front and back photos).
- Any trade certification/experience proof (optional but recommended).
- Documents are uploaded (original + compressed versions stored).

**Step 6 — Review & Submit**
- Worker reviews all entered info, then submits the profile for **admin verification**.

**Wallet note:** The wallet system is built into the product but is **NOT active yet** — it will be activated later after our meeting with the third-party wallet API provider. For now, the worker does NOT need a wallet to work (see §12).

---

## 4. Step B — Verification (Admin Review)

Before a worker can receive job offers or be seen by customers, an **admin must verify their profile and documents**.

| Verification Outcome | Result for Worker |
|---|---|
| **Approved** | Worker profile becomes **verified** (teal verified badge shown on their profile to customers). Worker can now see jobs, send offers, receive offers acceptance, take visits, and get paid. |
| **Rejected** | Profile is rejected. Worker sees the reason and must fix/change details, then re-submit for verification. They cannot work until approved. |
| **Request Changes** | Admin leaves notes; worker edits and re-submits. |

**Security note:** Worker verification is a human decision by admin — it is NOT automatic. This protects customers from unvetted workers. Documents and identity are reviewed carefully.

---

## 5. Step C — Worker Dashboard

The worker's home screen after login.

### 5.1 Dashboard Layout (top to bottom)
- **Header:** App name (HUNAR), search bar, notifications bell (unread count badge), profile avatar.
- **Status banner:** Worker's **online / offline** toggle. (A worker must be **online** to receive new job offers and appear in search results.)
- **Key statistics row (cards):**
  - Active Jobs (count)
  - Total Earnings (Rs.)
  - Rating (e.g., 4.8 ★)
- **"Nearby Jobs" list:** active job cards.
- **Main navigation (bottom/side):**

| Item | Purpose |
|---|---|
| Dashboard | Home / nearby jobs |
| Jobs | All job history & statuses |
| Earnings | Earnings & commission details |
| Chat | Messages with customers |
| Profile | Worker profile & settings |

### 5.2 Nearby Jobs Feed
The worker sees a list of **open job requests** from nearby customers (matching the worker's selected skills + service areas within the visible radius).

Each job card shows:
- **Category** (e.g., "Electrician")
- **Problem summary** (short description)
- **Location** (area / town, distance in km)
- **Posted time** (e.g., "2 minutes ago")
- **Preferred visit time** (if customer specified)
- **Media indicator** — shows if the job has photos / voice note attached
- **Price badge** — the customer's **suggested visit charge** (if provided)

Filters available on the Jobs feed:
- By category / skill
- By distance / area
- By visit-charge range (Rs.)
- By posted time (fresh first)
- By job type (show only jobs without offers yet, far jobs hidden)

**Matching mechanism (backend):** The system finds nearby jobs using the PostGIS proximity query:
`ST_DWithin(worker_location, ST_MakePoint(:lng, :lat)::geography, :radius_meters)` — jobs within the worker's service radius are matched to the worker's skills.

---

## 6. Step D — Viewing a Job Details

Worker clicks a job card → **Job Detail screen** shows the full request:

- Category & title
- Full problem description
- All media (photos + voice note — voice can be played)
- Full address + map pin
- Preferred visit window (date + time)
- Customer-suggested visit charge (if any)
- Posted time
- **"Send Visit Offer"** button (primary action)

Open jobs are **visible to many nearby workers** — customers compare offers, so the worker must make their offer competitive.

---

## 7. Step E — Sending a Visit Offer

This is the core marketplace interaction. A visit offer is the price a worker charges **just to come and look** at the problem.

1. Worker taps **"Send Visit Offer"**.
2. Worker enters:
   - **Visit charge (Rs.)** — price to come and inspect (this is where the platform earns its commission, see Payment section).
   - **Short message** to the customer (optional, e.g., "I can fix leaking pipes, will bring tools").
3. Worker submits the offer.

**Offer lifecycle (statuses the worker sees):**

| Status | Meaning |
|---|---|
| **Offer Sent** | Offer submitted, waiting for customer. |
| **Customer Viewing** | Customer saw the detail screen of this offer. |
| **Counter Offer Received** | Customer replied with a different visit charge — worker can accept or counter again. |
| **Accepted** | Customer chose this worker. Job becomes **Active**. |
| **Rejected** | Another worker was chosen, or customer ended the job. |

**Rules:**
- A worker can send offers on multiple jobs, but **only one offer per job** is allowed.
- If the customer sends a counter offer, the worker decides: **Accept** the customer's price or **Send** their own new counter. The negotiation can go back and forth (a bounded number of rounds to prevent infinite haggling).
- The final agreed visit charge is locked in once the customer confirms the worker.
- When the customer accepts an offer, all other workers on the same job instantly see the job as **"Closed / Assigned to another worker"** (realtime update via WebSocket/Socket.IO).

**Realtime:** Workers survive page refresh via Socket.IO — offer rejections, acceptances, new nearby jobs, and chat messages arrive instantly as notifications.

---

## 8. Step F — Active Job & Pre-Visit

Once an offer is **accepted**, the job moves to the worker's **Active Jobs** list. The worker now sees:

- Customer name & rating
- Full job details (problem, photos, voice, address + map)
- **Agreed visit charge (Rs.)**
- **Visit appointment** (preferred date & time)
- **Status timeline** (current position shown with progress indicator)

**Actions available on the Active Job screen:**
- **Start Visit** (see Step G)
- **Message Customer** (chat opens)
- **Call Customer** (if phone-sharing is enabled for the agreed window)
- **Cancel Job** (with reason — see Cancellation rules §12)

---

## 9. Step G — The Visit (Worker on Site)

The visit is a fixed sequence of worker actions. Each button only becomes active when the job is in the correct state.

### 9.1 Start Visit
- Worker taps **"Start Visit"** → job status becomes **visit_in_progress**.
- System starts **live location tracking** (worker's location is shared with the customer while en route — Location tracking uses the realtime feed).
- Customer sees: **"Your worker is On The Way"** with live location on the map.

### 9.2 I've Arrived
- Worker taps **"I've Arrived"** → job status becomes **visit_completed**.
- Customer is notified: **"Worker has arrived"**.
- **Commission note (current mode):** The platform commission is **10% of the visiting charge**. With the wallet system inactive, the worker settles this commission into the **HUNAR platform bank account** and sends the payment screenshot to WhatsApp +92 3140837519 (see §12). An automatic wallet deduction will apply only later, once the wallet system is activated.

### 9.3 Start Inspection
- Worker taps **"Start Inspection"** → status becomes **inspection_done** workspace; worker examines the problem.
- The customer sees the inspection is in progress.

### 9.4 Submit Inspection
Worker reviews the problem and submits the inspection result. Required fields:
- **Diagnosis** — what is wrong.
- **Repair plan** — what will be fixed.
- **Repair price estimate (Rs.)** — how much the repair will cost (separate from the visit charge).
- **Photos** of the problem (added to the inspection evidence).
- **Estimated repair time** (e.g., 2 hours).

After submission the job moves to the **repair negotiation** phase: status becomes **repair_negotiating** (or repair_approved if there is no back-and-forth and customer approves directly).

---

## 10. Step H — Repair Negotiation & Approval

The repair price is **negotiated separately** from the visit charge.

1. Worker's submitted estimate goes to the customer for review.
2. Customer can:
   - **Approve** the estimate → job becomes **repair_approved / in_progress on start**.
   - **Counter** with a lower price → worker receives a counter offer.
3. Worker can:
   - **Accept** the counter → repair price is locked.
   - **Reject** / send their own counter → bounded negotiation continues until agreement.
4. Once agreed, the **repair price is locked**. No silent changes.
   - If the situation changes during the repair, the worker must **submit a revised estimate and get explicit re-approval** from the customer before charging more (scope-change approval). This prevents "price change after inspection" complaints.

---

## 11. Step I — Performing & Completing Repair

1. Customer approval received → worker taps **"Start Repair"** → status **repair_in_progress**.
2. Worker performs the repair.
3. Worker taps **"Complete Repair"** → status **completed**.
4. Customer is notified and asked to:
   - Confirm completion
   - Pay
   - Rate & review the worker

**Wire / demo payment:** In the interactive demo and MVP, the customer pays (demo wallet / cash / card mock), the job becomes **paid**, then **reviewed**.

---

## 12. Earnings & Commission (Payment Model — Current Mode)

**Important status update:** The **wallet system is built into the product but is NOT in use yet.** We are waiting for our meeting with the third-party provider for their wallet API. Until the wallet API is integrated, HUNAR receives its commission directly through the **HUNAR platform bank account**, and payments are verified manually via **WhatsApp payment screenshots**.

### 12.1 How the Worker Earns (Current Mode)
- When a customer pays (visit charge + repair charge as agreed), the worker receives the money directly from the customer (in cash, or however the two agree in the current demo/MVP).
- **HUNAR does not hold the worker's money** in a wallet for now.

### 12.2 HUNAR Platform Commission (10% of the Visiting Charge)
- The platform charges **10% commission on the worker's visiting charge**.
- Multiplication reference: `PlatformTake = VisitingCharge × 10%`.
- Commission applies to the **visit charge** (not the repair price).
- Example: Visit charge Rs. 500 → **Rs. 50** goes to HUNAR as commission.
- Commission rate is editable by **super-admin only** (platform control), but the product default = 10% — see Module 4.

### 12.3 How the Commission is Paid to HUNAR (Current Mode — NO Wallet)
1. The worker (or customer, as arranged) transfers the commission amount to the **HUNAR platform bank account**.
   - The HUNAR platform bank account number belongs to the HUNAR platform itself (this is the account through which we receive the commission).
2. After making the transfer, the payer must send the **payment screenshot on WhatsApp to HUNAR**: **+92 314 0837519**.
3. The HUNAR team verifies the screenshot and records the commission as received.

### 12.4 Commission Record Keeping (Current Mode)
- Each job's commission (10% of the agreed visit charge) is recorded against that job.
- The WhatsApp screenshot is the proof of payment and is used by admin to mark the commission as "received".
- Until the screenshot is received and verified, the commission is shown as **pending**.

### 12.5 The Wallet System (Planned — Will Be Activated Later)
The wallet system is already created in the product and will be **switched on after the third-party wallet API meeting**, so nothing is thrown away:
- When activated, every worker will have a **wallet**.
- **Wallet starts at Rs. 0** on signup.
- Earnings will be **credited to the wallet**, and the **platform commission auto-deducted** (see detailed planned rules below).

**Planned wallet rules (for reference when wallet becomes active):**
- **Online/offline status vs balance:** ONLINE when balance ≥ −500 Rs.; OFFLINE when balance is below −500 Rs. (until balance returns to ≥ −500).
- **Wallet Top-Up:** Easypaisa, JazzCash, Bank Transfer.
- **Withdraw:** minimum **Rs. 100**, self-service/automatic payout (no manual admin approval).
- **Wallet Ledger:** every credit/debit is recorded (timestamped, with type and balance after change).
- **Idempotency:** all wallet movements are idempotent (double-tap cannot double-charge; Redis keys).

### 12.6 Not a Wallet Rule to Keep Today
- In the current mode, worker online/offline is NOT controlled by a wallet balance. A worker is online/offline by their own toggle (Dashboard status banner).

---

## 13. Earnings Screen (Worker — Current Mode)

The **Earnings** tab shows:
- **Total earned** (gross from jobs)
- **Total commission due / paid to HUNAR** (10% of visit charges)
- **Pending commission** (jobs where the screenshot has not yet been sent)
- **Commission payment instructions card:**
  - **Bank Account:** HUNAR platform bank account
  - **After paying:** send the payment screenshot on **WhatsApp +92 314 0837519**
- **Transactions list** — chronological: job #, visit charge, repair charge, commission (10%), screenshot status (Pending / Received / Verified), date.

---

## 14. Reviews & Rating (Worker Receives)

### When a review is created
- After a job is **completed/paid**, the customer is shown a **review prompt**.
- The review consists of **star rating** (1–5) + optional written review.

### What the worker sees
- The worker's overall **rating** (average of all ratings) appears on their profile and dashboard.
- Individual reviews appear under **"Reviews"** in the worker's profile (visible to customers).
- A **review notification** is pushed to the worker when a new review arrives.

### Review effect
- Verified workers with good ratings and reviews are more visible in matches and build customer trust (trust-oriented design). The worker's rating is a key deciding factor when customers choose between offers.

---

## 15. Chat & Communication (Worker Side)

- **One-to-one chat** between the worker and the customer of an active/accepted job through the **Chat** tab.
- Real-time via Socket.IO; messages appear instantly.
- Workers can send **text** messages; image attachments supported.
- Chat history is stored per conversation (CONVERSATION + MESSAGE tables).
- Chat is used for pre-visit questions, arrival updates, repair clarification — never for off-platform payment.

---

## 16. Notifications (Worker Side)

Worker receives realtime push/in-app notifications for every meaningful event:

| Event | Notification example |
|---|---|
| New matching job | "New job: Leaking pipe in Hayatabad" |
| Offer accepted | "Customer accepted your offer! Job is active." |
| Offer rejected | "Your offer was not selected." |
| Counter offer | "Customer countered your offer: Rs. 400" |
| Counter accepted | "Counter accepted. Visit scheduled." |
| Visit window approaching | "Your visit starts in 30 minutes." |
| New message | "New message from customer." |
| Commission reminder | "Commission Rs. 50 is due. Pay to HUNAR bank account and send the screenshot on WhatsApp +92 314 0837519." |
| Commission verified | "Commission received. Thank you." |
| Earnings recorded | "Rs. 450 earned for job #123." |
| New review | "You received a 5-star review." |
| Verification result | "Your profile was verified/rejected." |

Each notification has an **unread badge** and clicking it opens the related screen.

---

## 17. Worker Profile & Settings

### 17.1 My Profile (Public-facing)
Displays what customers see:
- Photo, name, **verified badge** (teal, only when admin verified)
- Overall rating + number of reviews
- Skills / categories
- Years of experience
- Bio
- Service areas
- Default visit charge (optional preset)
- Completed jobs count

**Edit allowed:** photo, bio, skills, experience, service areas, documents (re-verification needed if docs change).

### 17.2 Settings
- Change password
- Notification preferences (turn on/off push types)
- Language (English/Urdu ready via i18n)
- Privacy (profile visibility toggles if provided)
- Account: delete / logout

---

## 18. Cancellation & Edge-Case Handling (Worker)

| Scenario | Behavior |
|---|---|
| Worker cancels before visit | Job returns to open status; other workers' offers remain valid; no charge to worker. |
| Worker cancels after arrival | Must enter a reason; may affect reliability; admin can review. |
| Customer cancels after acceptance | Worker is notified; no work done, no repair fee. Visit fee already earned rule applies per policy. |
| Worker never shows up | Customer can report "No Show"; admin reviews; affects worker reliability rating. |
| Commission not yet paid | Job's commission is marked "Pending"; HUNAR team follows up via WhatsApp until the payment screenshot is received. |
| No nearby jobs | Empty state on dashboard with "Check again later" + option to expand service area. |

---

## 19. Complete Worker Flow Summary (A to Z, one list)

| # | Step | Where |
|---|---|---|
| 1 | Sign up as Worker (phone + OTP + password) | Auth |
| 2 | Login / auto-login via refresh token | Auth |
| 3 | Complete profile wizard (name → photo → skills → experience → areas → documents) | Profile |
| 4 | Submit for admin verification | Admin |
| 5 | Go online (manual toggle — wallet threshold will apply only when wallet is activated) | Dashboard |
| 6 | See nearby matching jobs (feed + filters) | Dashboard |
| 7 | View job details (photos, voice, location, preferred time) | Job detail |
| 8 | Send visit offer (visit charge + message) | Offer |
| 9 | Handle counter offers / see acceptance | Offer |
| 10 | Start Visit → Arrived → Inspect → Submit inspection (repair estimate) | Visit |
| 11 | Negotiate repair price & get explicit approval | Repair |
| 12 | Start Repair → Complete Repair | Repair |
| 13 | Receive payment from customer (visit + repair) | Pay |
| 14 | Pay 10% commission to HUNAR bank account + send screenshot on WhatsApp +92 314 0837519 | Commission |
| 15 | Receive review + rating | Review |

---

## 20. Design & UX Conventions (Worker Surface)

Design token usage follows the HUNAR design system:
- **Headings/Trust elements:** Navy `#123B5D`
- **Primary actions (Send Offer, Start Visit, Complete):** Teal `#0F8B8D` buttons
- **Ratings/Attention (pending, alerts):** Orange `#F59E0B`
- **Background:** `#F8FAFC`; cards **white** with subtle shadows
- **Text:** Dark `#172033`; secondary Gray `#64748B`
- **Success (paid, verified, approved):** Green `#16A34A`
- **Error (rejected, cancelled, offline):** Red `#DC2626`
- **Status colors:** Pending = Orange; Accepted/Active = Teal; In Progress = Navy; Completed/Paid = Green; Cancelled/Rejected = Red
- **Verified badge:** teal checkmark beside the worker's name
- **Dopamine cues** (small celebration moments when a job is won/completed and when a review arrives) to keep the worker motivated.

All money values displayed with "Rs." and Pakistani number formatting.