# HUNAR PROJECT — TASK CONTRIBUTION FILE
## MODULE 1 — FULL WORKER FLOW

**Source document:** `Project Modules/01_Worker_Flow.md` (read this file first — it is the requirement source of truth).

**Purpose of this file:** Module 1 (Full Worker Flow) is divided here into clear, equal parts and assigned to the 5 developers on the team. Every requirement from Module 1 is covered exactly once. **Nothing is removed and nothing extra is added.**

---

## TEAM ROSTER (MODULE 1)

| # | Developer | Role | Works On |
|---|---|---|---|
| 1 | **Abdullah** | Frontend Developer | App foundation, auth screens, profile setup, dashboard shell |
| 2 | **Shahzad** | Frontend Developer | Job discovery, offers, visit & inspection screens |
| 3 | **Faizan** | Frontend Developer | Repair, earnings, reviews, chat, notifications, profile & settings |
| 4 | **Hakim Ullah** | Backend Developer | Auth, worker account, verification, files, chat, notifications, wallet (inactive) |
| 5 | **Shafqat Ullah** | Backend Developer | Jobs, matching, offers, visits, repair, commission, reviews |

---

## HOW TO READ THIS FILE

This file has **5 separate workspaces**, one for each developer. Find YOUR NAME below.

Each workspace is separated by a **big thick line**. Read ONLY your own section. If you do not see your name above a section, that work is NOT yours.

Inside every workspace you will see, in order:

1. **YOUR NAME** and your team role.
2. **YOUR OVERVIEW** — one or two lines telling you, in general, what you will build (e.g., "You will build authentication and authorization").
3. **YOUR TASK LIST** — every specific feature assigned to you, numbered.
4. **RULES YOU MUST FOLLOW** — the exact project requirements that explain how each task must behave.
5. **DONE? CHECKLIST** — how to know your task is finished.

---

## REQUIREMENT COVERAGE MAP (PROOF THAT NOTHING IS MISSING)

Every section of `01_Worker_Flow.md` is assigned below. If a line is empty under "Owner", that means no owner needed (it is background explanation only, not a build task).

| Module 1 Section | What it covers | Owner (Frontend) | Owner (Backend) |
|---|---|---|---|
| 3.1 Sign Up + OTP | Phone, OTP rules, password | Abdullah | Hakim Ullah |
| 3.2 Login + Tokens | Access/refresh token | Abdullah | Hakim Ullah |
| 3.3 Profile Setup Wizard | 6 onboarding steps | Abdullah | Hakim Ullah |
| 4 Verification result screen | Status shown to worker | Abdullah | Hakim Ullah |
| 5.1 Dashboard shell | Header, toggle, stats, nav | Abdullah | Hakim Ullah (data) |
| 5.2 Nearby Jobs Feed + Filters | Job cards + filters | Shahzad | Shafqat Ullah |
| 6 Job Details screen | Full job request view | Shahzad | Shafqat Ullah |
| 7 Send Visit Offer + counter | Offer + negotiation UI | Shahzad | Shafqat Ullah |
| 8 Active Job & Pre-Visit | Active job screen | Shahzad | Shafqat Ullah |
| 9 Visit + Inspection | Start/arrive/inspect | Shahzad | Shafqat Ullah |
| 10 Repair Negotiation | Approve/counter repair | Faizan | Shafqat Ullah |
| 11 Perform & Complete Repair | Start/complete repair | Faizan | Shafqat Ullah |
| 12 + 13 Earnings & Commission | Wallet top-up via screenshot + auto commission | Faizan | Shafqat Ullah (commission) + Hakim (wallet-active) |
| 14 Reviews & Rating | Rating display | Faizan | Shafqat Ullah |
| 15 Chat | One-to-one messaging | Faizan | Hakim Ullah |
| 16 Notifications | Notification list + badges | Faizan | Hakim Ullah |
| 17 Profile & Settings | Public profile + settings | Faizan | Hakim Ullah |
| 18 Cancellation & Edge Cases | Cancel + empty states | Faizan | Shafqat Ullah (state) |
| 20 Design & UX Conventions | Colors, tokens, status colors | ALL frontend | — (design system) |

**Every line of Module 1 is owned. No requirement is unassigned. No extra feature is added.**

---



###############################################################################
###############################################################################
###############################################################################



# DEVELOPER 1 — ABDULLAH (FRONTEND DEVELOPER)

## YOUR OVERVIEW

> Abdullah, you will build the **foundation of the Worker app**: the project setup in Next.js, the design system (colors, buttons, badges), the **registration & login screens**, the **profile setup wizard**, the **verification result screen**, and the **worker dashboard shell** with its header, online/offline toggle, statistics cards, and main navigation.

In simple words: you build the **entry point and home base** of the worker experience. If the worker cannot sign up, log in, or see the dashboard nicely, the rest of the app is useless.

---

## YOUR TASK LIST (IN DETAIL)

### Task 1 — Project Foundation (Next.js)

**Build:** Set up the frontend as a Next.js application with TypeScript, Tailwind CSS, and shadcn/ui.

**Requirements from the project:**
- Frontend stack = Next.js + TypeScript + Tailwind CSS + shadcn/ui.
- Use React Hook Form + zod for forms and validation.
- Background/smooth data fetching via TanStack Query.
- Real-time updates connected with Socket.IO client (you only set the connection up; the actual messaging screens belong to a teammate).
- Language support ready for English and Urdu (i18n) because the app must support Urdu (Section 17.2).

**Done?** The project runs, uses the approved stack, and the design tokens below are applied.

---

### Task 2 — Design System & Visual Tokens

**Build:** Apply the HUNAR design system to every screen you make.

**Requirements from the project (Section 20):**
- Headings/trust elements: **Navy #123B5D**
- Primary action buttons: **Teal #0F8B8D** (e.g., "Send Offer", "Start Visit", "Complete")
- Ratings/attention/alerts: **Orange #F59E0B**
- Background **#F8FAFC**, cards **white** with subtle shadows
- Text: dark **#172033**; secondary text **#64748B**
- Success (paid/verified/approved): **Green #16A34A**
- Error (rejected/cancelled/offline): **Red #DC2626**
- Status colors: Pending = Orange, Accepted/Active = Teal, In Progress = Navy, Completed/Paid = Green, Cancelled/Rejected = Red
- Verified badge = teal checkmark beside a verified worker's name
- All money shown with "Rs." and Pakistani number formatting

**Done?** A single design token file exists and your screens all use these exact values.

---

### Task 3 — Sign Up as Worker (phone + OTP + password)

**Build:** The "Sign Up as Worker" screen flow.

**Requirements from the project (Section 3.1):**
- Worker opens the app and clicks **"Sign Up as Worker"**.
- Worker enters a **phone number** (Pakistani mobile, e.g. `03xx-xxxxxxx`).
- Worker clicks **"Get OTP"**.
- A 6-digit OTP is sent by SMS.
- OTP rules that must be enforced/displayed:
  - OTP valid for **5 minutes**.
  - A phone number can request a new OTP at most once every **15 minutes**.
  - Maximum **3 failed attempts**; after 3 wrong attempts the OTP is invalidated and a new one is required.
  - Repeated requests are rate-limited.
- After correct OTP, worker creates a **password**.
- Account is created with role = **WORKER**.

**Done?** A user can enter a phone, receive OTP, re-request after 15 minutes, fails after 3 wrong attempts, creates a password, and lands in the worker area.

---

### Task 4 — Login (Returning Worker)

**Build:** The login screen with phone + password.

**Requirements from the project (Section 3.2):**
- Worker enters **phone number + password**.
- Server verifies and issues:
  - **Access token** (JWT) — valid **15 minutes**.
  - **Refresh token** — valid **30 days** (used silently to get a new access token when the old one expires).
- On success the worker lands on the **Worker Dashboard**.
- Your app must store tokens correctly and silently refresh the access token when it expires (no extra login prompt).

**Done?** Login works, tokens are stored safely, and the session stays alive for 30 days without logging in again.

---

### Task 5 — First-Time Profile Setup Wizard (6 steps)

**Build:** The mandatory onboarding wizard a worker must finish before seeing jobs.

**Requirements from the project (Section 3.3) — the 6 steps, in order:**

- **Step 1 — Personal Details:** full name, profile photo (uploaded and auto-compressed), phone is pre-filled from signup (NOT editable here).
- **Step 2 — Skills / Services:** worker selects one or more categories (Electrician, Plumber, AC Technician, Carpenter, Painter, Mechanic — and any other category enabled by admin). These control which jobs the worker sees.
- **Step 3 — Experience:** years of experience (e.g., 0–50) + a short bio.
- **Step 4 — Service Areas:** worker sets areas/towns they work in (neighborhood of Peshawar). Location stored as coordinates + readable address.
- **Step 5 — Verification Documents:** CNIC / valid ID front and back photos (required) + optional trade certificate. Documents stored as original + compressed versions.
- **Step 6 — Review & Submit:** worker reviews everything, then submits the profile for **admin verification**.

**Important:** No wallet setup is needed at this step. Every worker gets a wallet automatically starting at Rs. 0 — the wallet needs no signup configuration (Section 3.3 note + Section 12).

**Done?** A new worker can complete all 6 steps in order, go back to edit, and submit for verification.

---

### Task 6 — Verification Result Screen

**Build:** The screen telling the worker the outcome of admin verification.

**Requirements from the project (Section 4):**
- **Approved** → profile becomes verified; the **teal verified badge** appears on the profile; the worker can now see jobs, send offers, take visits, and get paid.
- **Rejected** → worker sees the reason, must fix/change details, and re-submit. They cannot work until approved.
- **Request Changes** → admin notes what to change; worker edits and re-submits.

**Done?** The worker can see their current verification status and act on it.

---

### Task 7 — Worker Dashboard Shell

**Build:** The worker's home screen structure (the frame around the content).

**Requirements from the project (Section 5.1):**
- **Header:** App name (HUNAR), search bar, notifications bell with **unread count badge**, profile avatar.
- **Status banner:** **online/offline toggle**. A worker must be **online** to receive new job offers and appear in search results. This is a manual switch, BUT the worker is automatically forced **offline** when the wallet balance drops below **−500 Rs.** (Section 12.6).
- **Key statistics cards:** Active Jobs (count), Total Earnings (Rs.), Rating (e.g., 4.8 stars).
- **"Nearby Jobs" list area** — a placeholder region where the jobs feed (built by a teammate, Shahzad) will be displayed.
- **Main navigation:** Dashboard | Jobs | Earnings | Chat | Profile.

**Done?** The dashboard renders with header, toggle, stat cards, and navigation; the toggle actually changes the worker online/offline status via the backend.

---

## RULES YOU MUST FOLLOW (acc. to project requirements)

1. **Roles are separate.** Worker dashboard is NOT the Customer dashboard. Never reuse one with different labels (Section 1).
2. **One role per account.** A user registers as ONE role only.
3. **OTP rules are strict** (5 min valid, 15 min re-request, 3 attempts max). Never loosen them.
4. **Tokens:** access = 15 min, refresh = 30 days. Keep silent refresh working.
5. **Design tokens:** always use the exact colors listed. Never invent new colors.
6. **No wallet setup** appears at signup or in the wizard. The wallet is auto-created at Rs. 0 (Section 12.5).
7. **Online/offline is a manual toggle**, but wallet balance auto-forces the worker offline below **−500 Rs.**
8. All money displayed with "Rs." and Pakistani number formatting.

---

## DONE? CHECKLIST (Abdullah)

- [ ] Next.js + TypeScript + Tailwind + shadcn/ui project runs
- [ ] Design tokens applied (Navy/Teal/Orange/Green/Red/Gray)
- [ ] Sign up with phone → OTP → password → role WORKER
- [ ] Login with token refresh (15 min / 30 days)
- [ ] 6-step profile wizard complete
- [ ] Verification result screen (approved/rejected/request-changes)
- [ ] Dashboard shell with header, toggle, stats, navigation

---



###############################################################################
###############################################################################
###############################################################################



# DEVELOPER 2 — SHAHZAD (FRONTEND DEVELOPER)

## YOUR OVERVIEW

> Shahzad, you will build the **working heart of the worker side**: the **Nearby Jobs feed** with filters, the **Job Details screen**, the **Send Visit Offer** screen with counter-offer handling, the **Active Job / Pre-Visit** screen, and all the **Visit + Inspection** screens (Start Visit, I've Arrived, Start Inspection, Submit Inspection).

In simple words: you build everything from **"a worker finds a job"** to **"the worker finishes inspecting the problem on site."**

---

## YOUR TASK LIST (IN DETAIL)

### Task 1 — Nearby Jobs Feed (Dashboard content)

**Build:** The list of open job requests shown in the dashboard's "Nearby Jobs" area.

**Requirements from the project (Section 5.2):**
- The feed shows open job requests that match the worker's **selected skills + service areas** within a visible radius.
- Each job card shows:
  - **Category** (e.g., "Electrician")
  - **Problem summary** (short description)
  - **Location** (area/town + distance in km)
  - **Posted time** (e.g., "2 minutes ago")
  - **Preferred visit time** (if the customer specified one)
  - **Media indicator** — shows if the job has photos / voice note attached
  - **Price badge** — the customer's suggested visit charge (if provided)

**Done?** The worker sees correctly matched, nicely formatted job cards with all the information above.

---

### Task 2 — Job Feed Filters

**Build:** Filter controls on the Jobs feed.

**Requirements from the project (Section 5.2):**
- Filter by **category / skill**
- Filter by **distance / area**
- Filter by **visit-charge range (Rs.)**
- Filter by **posted time** (fresh first)
- Filter by **job type** (show only jobs without offers yet; hide far jobs)
- Show "fresh first" ordering by default.

**Done?** Every filter above works and combines with the others.

---

### Task 3 — Job Details Screen

**Build:** The full job request view that opens when a worker taps a job card.

**Requirements from the project (Section 6):**
- Category & title
- Full problem description
- All media (photos + voice note — voice must be playable)
- Full address + map pin
- Preferred visit window (date + time)
- Customer-suggested visit charge (if any)
- Posted time
- A primary **"Send Visit Offer"** button.

**Done?** The worker can see everything about the job and reach the offer screen.

---

### Task 4 — Send Visit Offer Screen

**Build:** The screen where a worker submits their offer.

**Requirements from the project (Section 7):**
- Worker enters:
  - **Visit charge (Rs.)** — the price to come and inspect.
  - **Short message** to the customer (optional, e.g., "I can fix leaking pipes, will bring tools").
- Worker submits the offer.

**Rules:**
- A worker can send offers on **multiple jobs**, but **only ONE offer per job**.
- The visit charge is where the platform earns its 10% commission (Section 12.2).

**Done?** A worker can submit an offer with charge + optional message, and cannot send a second offer for the same job.

---

### Task 5 — Offer Lifecycle Statuses (worker view)

**Build:** Display the status of every offer a worker has sent.

**Requirements from the project (Section 7):**
- **Offer Sent** — waiting for customer.
- **Customer Viewing** — customer opened this offer's detail screen.
- **Counter Offer Received** — customer replied with a different visit charge; worker can accept or counter again.
- **Accepted** — customer chose this worker; job becomes **Active**.
- **Rejected** — another worker chosen, or the customer ended the job.
- **Closed / Assigned to another worker** — shown when another worker is chosen; this must appear in real time (via Socket.IO), without a page refresh.

**Done?** Every status has a clear visual state and updates live.

---

### Task 6 — Counter-Offer Handling (Worker Side)

**Build:** The UI for reacting to a customer's counter offer.

**Requirements from the project (Section 7):**
- When the customer counters, the worker can:
  - **Accept** the customer's price, OR
  - **Send their own new counter**.
- Negotiation can go back and forth for a **bounded number of rounds** (no infinite haggling).
- The final agreed visit charge is **locked** once the customer confirms.

**Done?** Worker can accept or counter, and the rounds end cleanly when a price is agreed.

---

### Task 7 — Active Job & Pre-Visit Screen

**Build:** The screen for an accepted job, before visiting.

**Requirements from the project (Section 8):**
- Show:
  - Customer name & rating
  - Full job details (problem, photos, voice, address + map)
  - **Agreed visit charge (Rs.)**
  - **Visit appointment** (preferred date & time)
  - **Status timeline** with a progress indicator showing the current position.
- Actions available:
  - **Start Visit**
  - **Message Customer** (opens chat)
  - **Call Customer** (if phone-sharing is enabled for the agreed window)
  - **Cancel Job** (with a reason).

**Done?** The worker sees the agreed job details and the correct action buttons for this stage.

---

### Task 8 — Visit Screens (Start Visit → Submit Inspection)

**Build:** The sequence of on-site action screens. Each button becomes active ONLY when the job is in the correct state (Section 9).

**8a. Start Visit**
- "Start Visit" → status becomes **visit_in_progress**.
- Live location tracking starts (worker's location shared with the customer while en route).
- Customer sees "Your worker is On The Way" with a live map.

**8b. I've Arrived**
- "I've Arrived" → status becomes **visit_completed**.
- Customer is notified "Worker has arrived".
- Commission note: the platform commission is **10% of the visiting charge**. When the worker clicks **"I've Arrived"**, the platform **holds (reserves)** the 10% commission from the worker's wallet. If the wallet balance is **insufficient**, the Arrive button is **disabled** and the worker sees a top-up warning: "Insufficient wallet balance. Please top up before arriving." The hold is finalized and deducted when the worker confirms the OTP sent to the customer (Section 12.3).

**8c. Start Inspection**
- "Start Inspection" → inspection begins; customer sees inspection is in progress.

**8d. Submit Inspection**
- Worker submits the inspection result with REQUIRED fields:
  - **Diagnosis** — what is wrong
  - **Repair plan** — what will be fixed
  - **Repair price estimate (Rs.)** — separate from the visit charge
  - **Photos** of the problem (inspection evidence)
  - **Estimated repair time** (e.g., 2 hours)
- After submission the job moves to the repair negotiation phase.

**Done?** The worker can walk the full visit sequence on-site, with each button appearing only when it is the correct time.

---

## RULES YOU MUST FOLLOW (acc. to project requirements)

1. **One offer per job.** Never allow a duplicate offer for the same job (Section 7).
2. **Bounded negotiation.** Counter-offers must stop after a fixed number of rounds (Section 7).
3. **Price locking.** The agreed visit charge is locked once the customer confirms; no silent change (Section 8).
4. **Realtime updates via Socket.IO.** Offer rejection/acceptance/new jobs appear instantly, not after a refresh (Section 7).
5. **Visit charge is the commission base.** 10% of the visiting charge belongs to HUNAR; the repair price is separate (Sections 7 & 12).
6. **State-driven buttons.** Visit buttons must appear only when the job's state allows them (Section 9).
7. **Inspection fields are REQUIRED:** diagnosis, repair plan, repair price estimate, photos, estimated repair time (Section 9.4).
8. Use the exact HUNAR design tokens for all screens.

---

## DONE? CHECKLIST (Shahzad)

- [ ] Nearby Jobs feed with job cards
- [ ] All 5 filters working
- [ ] Job details screen (photos + playable voice + map)
- [ ] Send Visit Offer (one offer per job)
- [ ] Offer statuses display live (sent/viewing/counter/accepted/rejected/closed)
- [ ] Counter-offer accept/counter-rounds
- [ ] Active Job & Pre-Visit screen
- [ ] Start Visit → I've Arrived → Start Inspection → Submit Inspection

---



###############################################################################
###############################################################################
###############################################################################



# DEVELOPER 3 — FAIZAN (FRONTEND DEVELOPER)

## YOUR OVERVIEW

> Faizan, you will build the **money + communication + account part** of the worker app: the **Repair Negotiation & Approval** screens, **Start/Complete Repair**, the **Earnings & Commission** screen (with the **active wallet**, top-up via screenshot proof, and auto commission deduction), the **Reviews** display, the **Chat** screen, the **Notifications** panel, the **Profile & Settings** screens, and all **Cancellation / edge-case** screens.

In simple words: you build everything after the inspection — **negotiating the repair price, finishing the job, getting paid, communicating, and managing the worker's own profile.**

---

## YOUR TASK LIST (IN DETAIL)

### Task 1 — Repair Negotiation & Approval (Worker Side)

**Build:** The screens where a worker responds to the customer on the repair price.

**Requirements from the project (Section 10):
- The repair price is negotiated **separately** from the visit charge.
- Worker submits an estimate (from inspection); the customer reviews it.
- On a counter offer, the worker can:
  - **Accept** the counter → repair price is locked.
  - **Reject / send their own counter** → negotiation continues for a bounded number of rounds.
- Once agreed, the **repair price is locked**. No silent changes.
- **Scope-change approval:** if the situation changes during the repair, the worker must submit a **revised estimate and get explicit re-approval** from the customer before charging more. This prevents "price changed after inspection" complaints.

**Done?** Worker can accept/reject/counter repair prices, sees a locked price, and can request an updated price only with explicit customer approval.

---

### Task 2 — Perform & Complete Repair

**Build:** The repair execution screens.

**Requirements from the project (Section 11):
- "Start Repair" → status **repair_in_progress**.
- Worker performs the repair.
- "Complete Repair" → status **completed**.
- Customer is then notified to confirm completion, pay, and review.

**Done?** The worker can start and complete a repair, and the completion state is clearly shown.

---

### Task 3 — Earnings & Commission Screen

**Build:** The Earnings tab that shows the worker's money and wallet.

**Requirements from the project (Section 13 — ACTIVE wallet mode):
- Show:
  - **Wallet balance** (current Rs. balance)
  - **Total earned** (gross from jobs)
  - **Total commission deducted** (10% of visit charges, auto-deducted from wallet)
  - **Held commission** (commission reserved after "I've Arrived", not yet deducted)
  - **Top-up section**:
    - Worker transfers money to the **given HUNAR top-up number** (Easypaisa / JazzCash / Bank Transfer).
    - Worker clicks **"I've Sent Payment"**, enters the amount, and **uploads the payment screenshot** as proof.
    - Screenshot is reviewed by HUNAR team on **WhatsApp +92 314 0837519**; once verified the wallet is credited.
    - Top-up status shown: **Pending / Approved / Rejected**.
  - **Transactions list** (chronological): job #, visit charge, repair charge, commission (10%), commission status (Held / Deducted / Reversed), date, wallet balance after change.

**Done?** The worker sees their wallet balance, earnings, commission, and can top up the wallet by sending money to the given number and uploading a screenshot proof.

---

### Task 4 — Reviews & Rating (Worker display)

**Build:** The worker's review section.

**Requirements from the project (Section 14):
- Rating = **1 to 5 stars** + optional written review (created by the customer after a completed/paid job).
- Show:
  - Overall **rating** (average of all ratings) on the profile and dashboard.
  - Individual reviews in the "Reviews" section of the worker's profile (visible to customers).
- A notification is pushed to the worker when a new review arrives.

**Done?** The worker can see their average rating and each individual review.

---

### Task 5 — Chat & Communication

**Build:** The one-to-one chat screen between worker and customer.

**Requirements from the project (Section 15):
- One-to-one chat with the customer of an **active/accepted** job through the Chat tab.
- Real-time via Socket.IO — messages appear instantly.
- Workers can send **text** messages; **image attachments** supported.
- Chat history stored per conversation.
- Chat is used for pre-visit questions, arrival updates, repair clarification — **never for off-platform payment**.

**Done?** The worker can chat in real time with the customer of an active job, including images.

---

### Task 6 — Notifications Panel

**Build:** The notifications screen + unread badge.

**Requirements from the project (Section 16):
- Show real-time push/in-app notifications for every meaningful event:
  - New matching job
  - Offer accepted
  - Offer rejected
  - Counter offer
  - Counter accepted
  - Visit window approaching
  - New message
  - Commission held ("Commission Rs. 50 held from your wallet for job #123. Complete OTP to finalize.")
  - Commission deducted ("Commission Rs. 50 deducted. Thank you for using HUNAR.")
  - Commission reversed ("Commission held Rs. 50 returned to your wallet.")
  - Insufficient balance ("Insufficient wallet balance. Top up to keep accepting visits — send money to the given number and upload your screenshot proof.")
  - Top-up approved ("Your wallet top-up of Rs. 500 has been verified and credited.")
  - Top-up rejected
  - Earnings recorded
  - New review
  - Verification result
- Each notification has an **unread badge** and clicking it opens the related screen.

**Done?** Notifications appear in real time, show unread badges, and navigate to the right screen when clicked.

---

### Task 7 — Worker Profile (Public) & Settings

**Build:** The public-facing profile + settings screens.

**Requirements from the project (Section 17):
**17.1 My Profile (what customers see):**
- Photo, name, **verified badge** (teal, only when admin verified)
- Overall rating + number of reviews
- Skills / categories
- Years of experience
- Bio
- Service areas
- Default visit charge (optional preset)
- Completed jobs count

**Edit allowed:** photo, bio, skills, experience, service areas, documents (re-verification needed if documents change).

**17.2 Settings:**
- Change password
- Notification preferences (turn off/on push types)
- Language (English/Urdu ready via i18n)
- Privacy (profile visibility toggles if provided)
- Account: delete / logout

**Done?** The worker's public profile is complete and editable, and every setting above works.

---

### Task 8 — Cancellation & Edge-Case Screens

**Build:** The UI for cancellations and unusual situations.

**Requirements from the project (Section 18):
- Worker cancels **before visit** → confirm and send; job returns to open status; no charge to worker.
- Worker cancels **after arrival** → must enter a reason; may affect reliability; admin can review.
- Customer cancels after acceptance → worker is notified; no work done, no repair fee.
- Worker never shows up → customer can report "No Show"; admin reviews.
- Commission not yet deducted → job commission held on arrive shows as "Held"; if the job is cancelled before OTP confirmation, the hold is reversed back to the worker's wallet.
- **No nearby jobs** → empty state on dashboard: "Check again later" + option to expand service area.

**Done?** Every cancellation shows the correct confirmation/reason flow and every empty state is friendly and clear.

---

## RULES YOU MUST FOLLOW (acc. to project requirements)

1. **Repair price is separate and locked** once agreed; scope changes need explicit re-approval (Section 10).
2. **Commission = 10% of the visit charge**, auto-deducted from the worker's wallet (hold on arrive, deduct on OTP confirmation) — shown clearly on the Earnings screen (Section 12).
3. **Wallet UI is ACTIVE.** Build the wallet balance display, top-up screen (send money to given number + upload screenshot proof), top-up status, and transactions list. Commission is auto-deducted from the wallet.
4. **Chat is for the active/accepted job only**, never for off-platform payment talk (Section 15).
5. **Single verified badge** = teal checkmark, only when admin-verified (Sections 4 & 17).
6. **Cancellation reasons are required** for post-arrival cancellations (Section 18).
7. Reviews are shown as **average rating + individual reviews** (Section 14).
8. Use the exact HUNAR design tokens everywhere.

---

## DONE? CHECKLIST (Faizan)

- [ ] Repair negotiation UI (accept / counter / locked price / scope-change approval)
- [ ] Start Repair → Complete Repair
- [ ] Earnings screen with wallet balance, commission auto-deduction, top-up via screenshot proof (+92 314 0837519 verification)
- [ ] Reviews display (average + individual)
- [ ] Chat screen (text + images, real-time)
- [ ] Notifications panel + unread badges
- [ ] Profile (public) + Settings (password/language/privacy/delete/logout)
- [ ] Cancellation & empty-state screens

---



###############################################################################
###############################################################################
###############################################################################



# DEVELOPER 4 — HAKIM ULLAH (BACKEND DEVELOPER)

## YOUR OVERVIEW

> Hakim Ullah, you will build the **worker account backbone**: the **Auth module** (OTP, password, tokens, role protection), the **Worker Profile module** (the 6-step onboarding data), the **Verification workflow**, **File Uploads** (photos & documents), the **Chat backend**, **Notifications backend**, and the **active Wallet system** (auto-created at Rs. 0, top-up via screenshot proof, and auto commission deduction to the platform wallet).

In simple words: you own everything about **who the worker is** and **how they communicate**, plus the future wallet.

---

## YOUR TASK LIST (IN DETAIL)

### Task 1 — Auth Module (Sign Up, OTP, Login, Tokens)

**Build:** Server-side registration and login for workers.

**Requirements from the project (Sections 3.1 & 3.2):
- Sign Up: worker shares a Pakistani **phone number** → server sends a **6-digit OTP**.
- OTP enforcement (Section 3.1):
  - Valid **5 minutes**.
  - Re-request at most once per **15 minutes** per phone.
  - Max **3 failed attempts**; after 3 wrong attempts invalidate the OTP.
  - **Rate-limit** repeated requests.
- Password created after OTP (stored as **bcrypt hash** — never plain text).
- Role = **WORKER** on the account.
- Login: verify phone + password → issue:
  - **Access token (JWT)** valid **15 minutes**.
  - **Refresh token** valid **30 days** (to mint new access tokens silently).
- Protect all worker routes with the WORKER role (a customer or admin token must be rejected).

**Done?** Worker registration/login works with strict OTP rules, hashed passwords, JWTs with the exact lifetimes, and role protection.

---

### Task 2 — Users / Worker Profile Module

**Build:** The backend API for the 6-step onboarding wizard.

**Requirements from the project (Section 3.3):
Support these fields (one API or several, but exactly these):
- Step 1: full name, profile photo, phone (pre-filled, not changeable here).
- Step 2: skills/categories (multiple; Electrician, Plumber, AC Technician, Carpenter, Painter, Mechanic + any admin-enabled category). Skills drive job matching.
- Step 3: years of experience + short bio.
- Step 4: service areas (coordinates + readable address; Mapbox geocoding, PostGIS storage).
- Step 5: verification documents (CNIC front/back required; optional certificate).
- Step 6: review & submit for admin verification.
- A worker cannot see jobs until the profile is complete AND verified (Section 4).

**Done?** All onboarding data can be saved/updated by a worker before verification.

---

### Task 3 — Worker Verification Workflow

**Build:** Backend support for the verification outcome.

**Requirements from the project (Section 4):
- Verification has **three outcomes**: Approved, Rejected (with reason), and Request Changes (with admin notes).
- **Approved** → worker can work (see jobs, send offers, take visits, get paid).
- **Rejected / Request Changes** → worker cannot work until fixed and re-submitted.
- Verification is a **human decision by admin** — but the worker-facing status/result API is yours. (The actual admin screen is in Module 3/Admin.)
- Editing identity documents puts the profile back to pending verification (Section 17.1).

**Done?** The worker receives the correct verification status and can re-submit when requested.

---

### Task 4 — File Upload Storage

**Build:** Upload handling for photos and documents.

**Requirements from the project (Sections 3.3 & 9.4):
- Profile photos, job photos, inspection photos, chat images, and worker documents (CNIC).
- Photos are **auto-compressed**; documents stored in **original + compressed versions**.
- Allowed file types validated.
- Storage uses the project's file backend (S3 in production / MinIO in development) per the tech stack.

**Done?** All file types upload reliably and are compressed/stored per the rules.

---

### Task 5 — Chat Backend

**Build:** The one-to-one chat between worker and customer.

**Requirements from the project (Section 15):
- Conversation + Message data model.
- Real-time delivery via Socket.IO.
- Text messages + image attachments.
- Chat exists for an **active/accepted job** only.
- Chat history stored per conversation.

**Done?** Messages send, receive, and appear in real time with images, scoped to active jobs.

---

### Task 6 — Notifications Backend

**Build:** Notification creation and real-time push.

**Requirements from the project (Section 16):
Generate and deliver the notification events:
- New matching job
- Offer accepted / rejected
- Counter offer / counter accepted
- Visit window approaching
- New message
- Commission held / deducted / reversed
- Insufficient balance top-up warning
- Top-up submitted / approved / rejected
- Earnings recorded
- New review
- Verification result
- Unread badge data for the UI.

**Done?** Every event above creates a notification that reaches the worker instantly with unread-tracking.

---

### Task 7 — Wallet System (ACTIVE — Manual Top-Up via Screenshot Proof)

**Build:** The wallet backend, fully coded and **ACTIVE** for all workers.

**Requirements from the project (Section 12.5 — active rules):**
- Every worker has a wallet starting at **Rs. 0**.
- Earnings credited to the wallet; platform commission auto-deducted when the customer confirms OTP.

**WALLET TOP-UP FLOW (Manual via Screenshot):**
- Worker wants to add money to their wallet → they transfer money (Easypaisa / JazzCash / Bank Transfer) to the **given HUNAR top-up phone number**.
- After sending payment, the worker takes a **screenshot** of the payment confirmation and **uploads it as proof** on the app.
- The screenshot is sent to the HUNAR team (on the same number / WhatsApp **+92 314 0837519**) for verification.
- Once the HUNAR admin **verifies** the screenshot, the wallet is **credited** with the top-up amount.
- Top-up statuses: **Pending** (screenshot uploaded, awaiting verification) → **Approved** (admin verified, amount credited) → **Rejected** (invalid screenshot, amount not credited).
- The worker sees their pending top-up status in the wallet screen.

**COMMISSION AUTO-DEDUCTION FLOW:**
- When the worker clicks **"I've Arrived"** at the job site, the platform **holds** (reserves) the 10% commission of the agreed visit charge from the worker's wallet.
- When the worker confirms the **OTP** (sent to the customer by the platform), the held commission is **finalized and deducted** from the worker's wallet.
- The deducted commission is **transferred to the platform's own wallet** (HUNAR platform wallet).
- If the worker's wallet balance is **insufficient** to cover the commission at the "Arrive" step, the worker is shown a warning: **"Insufficient wallet balance. Please top up before arriving."** The Arrive button is disabled until the wallet has enough balance.
- Wallet Ledger: every credit (top-up approved, earnings) and debit (commission hold, commission deduction, reversal) is **timestamped with balance after change**.
- **Idempotency:** all wallet movements are idempotent (double-tap cannot double-charge; Redis idempotency keys).

**ADDITIONAL WALLET RULES:**
- Online/offline is controlled by balance: worker goes **offline automatically** if wallet balance drops below **−500 Rs.** (Section 12.6).
- **Withdraw:** minimum **Rs. 100**, self-service/automatic payout (no manual admin approval).
- **Platform Wallet:** all deducted commissions are stored in a separate HUNAR platform wallet, tracked and viewable by admin.

**APIs to build:**
- `POST /wallet/topup` — worker uploads screenshot + amount + payment method details
- `GET /wallet/topup/status` — worker sees their pending/approved/rejected top-ups
- `GET /wallet/balance` — worker sees current wallet balance
- `GET /wallet/ledger` — full transaction history (credits, debits, timestamps, balances)
- `POST /wallet/hold-commission` — platform holds commission when worker arrives
- `POST /wallet/confirm-commission` — platform deducts commission on OTP confirmation
- `POST /wallet/reverse-commission` — reversal if job is cancelled before OTP
- `GET /platform-wallet/balance` — admin view of total collected commission
- `PUT /wallet/topup/:id/verify` — admin approves/rejects a top-up

**Done?** Wallet is active for all workers, top-up via screenshot proof works, commission is auto-held on arrive and auto-deducted on OTP confirmation, ledger tracks everything, and platform wallet stores all commission.

---

## RULES YOU MUST FOLLOW (acc. to project requirements)

1. **OTP rules are non-negotiable:** 5 minutes valid, 15 minutes re-request, 3 attempts, rate-limited.
2. **Passwords hashed with bcrypt only.**
3. **Token lifetimes:** access 15 min, refresh 30 days.
4. **Role separation:** WORKER routes reject CUSTOMER and ADMIN tokens.
5. **Verification is human-made**, never automatic.
6. **Wallet is ACTIVE.** Every worker has a wallet starting at Rs. 0. Commission is auto-deducted from the wallet on OTP confirmation.
7. **Wallet top-up is manual via screenshot proof.** Worker sends money to the given number, uploads screenshot, admin verifies, wallet credited.
8. **Commission hold on arrive, deduct on OTP.** If wallet balance is insufficient, Arrive button is disabled.
9. **All money movements idempotent** — ledger must track every credit/debit with timestamp and balance after change.
10. **Platform wallet** stores all deducted commissions separately.
11. Use the approved backend stack: NestJS modular monolith, Prisma, PostgreSQL/PostGIS, Redis, BullMQ, Socket.IO.

---

## DONE? CHECKLIST (Hakim Ullah)

- [ ] Auth: OTP (5min/15min/3 attempts) + bcrypt password + JWT (15min/30 days) + WORKER role guard
- [ ] Worker profile APIs (6 steps incl. skills + service areas + documents)
- [ ] Verification workflow (approved/rejected/request-changes + re-submit)
- [ ] File upload with compression (S3/MinIO)
- [ ] Chat backend (real-time + images)
- [ ] Notifications backend (all events + unread)
- [ ] Wallet module ACTIVE: Rs. 0 start, manual top-up via screenshot proof, commission hold on arrive, deduct on OTP confirm, platform wallet, ledger, idempotent

---



###############################################################################
###############################################################################
###############################################################################



# DEVELOPER 5 — SHAFQAT ULLAH (BACKEND DEVELOPER)

## YOUR OVERVIEW

> Shafqat Ullah, you will build the **marketplace engine** of the worker side: the **Jobs & Matching module** (nearby jobs in PostgreSQL/PostGIS), the **Offers module** (visit offers + bounded counter-offers + accept/reject), the **Visits module** (visit statuses + location tracking), the **Inspection + Repair module** (estimate, negotiation, locked price, scope-change approval), the **Commission tracking module** (10% of visit charge, held on arrive and auto-deducted to the platform wallet on OTP confirmation), and **Reviews** (rating + aggregation).

In simple words: you own everything that happens **between a job being out there and the worker getting paid for it**, plus reviews.

---

## YOUR TASK LIST (IN DETAIL)

### Task 1 — Jobs & Matching Module (Nearby Jobs)

**Build:** The API that returns the nearby job feed for a worker.

**Requirements from the project (Section 5.2):
- Return open job requests matching the worker's **skills + service areas** within a visible radius.
- Use PostGIS proximity matching:
  `ST_DWithin(worker_location, ST_MakePoint(:lng, :lat)::geography, :radius_meters)`
- Return for each job card: category, problem summary, location + distance (km), posted time, preferred visit time, media presence, customer's suggested visit charge.
- Support filters: category/skill, distance/area, visit-charge range, posted time, job type ("no offers yet / far jobs hidden").

**Done?** The jobs feed returns correct, distance-sorted, filterable results using PostGIS.

---

### Task 2 — Offers Module

**Build:** Send-offer + negotiation API.

**Requirements from the project (Section 7):
- A worker sends an offer with a **visit charge + optional message**.
- **Only ONE offer per job** per worker.
- Offer statuses: Offer Sent → Customer Viewing → Counter Offer Received → Accepted → Rejected.
- Counter-offers: customer counters; worker accepts or counters back; **bounded rounds** (no infinite haggling).
- On acceptance the agreed visit charge is **locked**.
- When a customer accepts one worker, all other workers on that job instantly see **"Closed / Assigned to another worker"** (real-time via Socket.IO).
- Emit the notification events (New offer, offer accepted/rejected) to the Notifications module.

**Done?** Offers are created once, negotiate within bounded rounds, lock the price, and notify everyone in real time.

---

### Task 3 — Visits Module (state machine + location)

**Build:** The visit state machine and location tracking.

**Requirements from the project (Section 9):
- Start Visit → **visit_in_progress** + begin **live location tracking** (worker location shared with the customer while en route, real-time).
- I've Arrived → **visit_completed** + notify "Worker has arrived".
- Start Inspection → inspection begins.
- The job state must drive which worker actions are allowed (buttons appear only when state permits).

**Done?** The visit transitions are enforced server-side, with live location feeds and state-gated actions.

---

### Task 4 — Inspection Submission API

**Build:** Save the inspection result.

**Requirements from the project (Section 9.4):
- Required fields: **Diagnosis**, **Repair plan**, **Repair price estimate (Rs.)**, **Photos**, **Estimated repair time**.
- After submission the job moves to the **repair negotiation** phase.

**Done?** Inspection data is saved completely and the job state moves to negotiation.

---

### Task 5 — Repair Module

**Build:** Repair negotiation and execution state.

**Requirements from the project (Sections 10 & 11):
- Estimate is separate from the visit charge.
- Customer can approve or counter; worker can accept or counter back; **bounded rounds**.
- Once agreed, the repair price is **locked** — no silent changes.
- **Scope-change approval:** a revised estimate mid-repair requires **explicit customer re-approval** before charging more.
- Start Repair → **repair_in_progress**; Complete Repair → **completed**.
- Emit events (repair approved, job completed) to Notifications and Reviews triggers.

**Done?** Repair price negotiation is bounded, price is locked, scope changes require re-approval, and states transition correctly.

---

### Task 6 — Commission Tracking Module (Wallet Auto-Deduction)

**Build:** Record the platform commission per job (10% of the visit charge), auto-deducted from the wallet.

**Requirements from the project (Section 12 — ACTIVE wallet mode):
- Commission = `VisitCharge × 10%`.
- Applies to the **visit charge only**, not the repair price.
- Flow:
  1. Worker clicks **"I've Arrived"** → commission is **held (reserved)** from the worker's wallet (via the Wallet module's hold API, coordinated with Hakim Ullah).
  2. Worker confirms the **OTP** sent to the customer → the held commission is **finalized and deducted** from the worker's wallet and **credited to the platform's wallet**.
  3. If the job is cancelled before OTP confirmation → the hold is **reversed** back to the worker's wallet.
- If the worker's wallet balance is not enough to cover the commission at the **Arrive** step → the Arrive button is disabled and the worker sees a top-up warning.
- Each job's commission is recorded with a status of **Held / Deducted / Reversed**.
- The Earnings screen shows: wallet balance, total earned, commission deducted (10%), per-job list (job #, visit charge, repair charge, commission, commission status, date).
- Earnings summary endpoints supply the Earnings screen data.

**Done?** Every completed visit holds 10% commission at arrive, deducts it on OTP confirmation to the platform wallet, and correct status is served to the Earnings screen.

---

### Task 7 — Reviews & Rating Module

**Build:** Review storage and rating aggregation.

**Requirements from the project (Section 14):
- After a completed/paid job, the customer submits **1–5 stars** + optional written review.
- Store each review against the worker.
- Return the worker's **overall average rating** and the **list of individual reviews**.
- Trigger the "New review" notification event.

**Done?** Reviews are stored, rating averages correctly, and the worker profile shows both.

---

## RULES YOU MUST FOLLOW (acc. to project requirements)

1. **PostGIS is used for distance matching** (`ST_DWithin`) — no manual distance scripts.
2. **One offer per job per worker**, strictly enforced server-side.
3. **Bounded negotiation** on visit AND repair prices — a round counter stops infinite haggling.
4. **Price locking:** agreed prices are locked; repair scope changes need explicit re-approval.
5. **Commission = 10% of the visit charge only.** Flow: hold on "Arrive" → deduct on OTP confirmation → credit to platform wallet. Reversed if job cancels before OTP.
6. **Wallet is ACTIVE:** commission is auto-deducted from the worker's wallet, NOT paid via bank + screenshot.
7. **Insufficient balance blocks arrival:** the Arrive button is disabled until the wallet can cover the 10% commission.
8. **Realtime:** state changes emit notifications via Socket.IO (coordinate with the Notifications events list).
9. Use the approved backend stack: NestJS modular monolith, Prisma, PostgreSQL/PostGIS, Redis, BullMQ, Socket.IO.

---

## DONE? CHECKLIST (Shafqat Ullah)

- [ ] Jobs feed API with PostGIS `ST_DWithin` + all 5 filters
- [ ] Offers: send (one per job), counter (bounded), accept/reject, real-time close to others
- [ ] Visits: state machine + live location tracking
- [ ] Inspection submission (diagnosis, repair plan, estimate, photos, time)
- [ ] Repair: bounded negotiation, locked price, scope-change re-approval, complete
- [ ] Commission: 10% per visit charge, Held on arrive / Deducted on OTP / Reversed on cancel + Earnings data
- [ ] Reviews: store + average rating + list + notification trigger

---



###############################################################################
###############################################################################
###############################################################################



## FINAL CROSS-CHECK (TEAM LEAD / ALL DEVELOPERS)

Use this checklist before wrapping up Module 1. Every item below is a requirement from `01_Worker_Flow.md` — if any is unchecked, Module 1 is NOT finished.

- [ ] Sign Up as Worker (phone → OTP rules → password) — Abdullah + Hakim
- [ ] Login with 15-min access / 30-day refresh tokens — Abdullah + Hakim
- [ ] 6-step profile wizard (personal / skills / experience / service areas / documents / submit) — Abdullah + Hakim
- [ ] Verification result (approved / rejected / request changes) — Abdullah + Hakim
- [ ] Dashboard shell (header, online toggle, stats, navigation) — Abdullah + Hakim
- [ ] Nearby jobs feed + filters — Shahzad + Shafqat
- [ ] Job details (photos, voice, map) — Shahzad + Shafqat
- [ ] Send visit offer (one per job) + counter negotiation (bounded) — Shahzad + Shafqat
- [ ] Offer statuses + realtime close-to-others — Shahzad + Shafqat
- [ ] Active Job / Pre-Visit screen — Shahzad + Shafqat
- [ ] Visit sequence: Start / Arrived / Inspect / Submit (commission reminder card) — Shahzad + Shafqat
- [ ] Repair negotiation + locked price + scope-change approval — Faizan + Shafqat
- [ ] Start Repair / Complete Repair — Faizan + Shafqat
- [ ] Earnings screen: wallet balance, commission 10% auto-deducted, top-up via screenshot proof (+92 314 0837519) — Faizan + Shafqat
- [ ] Wallet system ACTIVE: Rs. 0 start, top-up via screenshot, commission hold on arrive, deduct on OTP confirm, platform wallet — Faizan (UI) + Hakim (backend)
- [ ] Reviews & rating display — Faizan + Shafqat
- [ ] Chat (text + images, realtime, active job only) — Faizan + Hakim
- [ ] Notifications (all events + unread badges) — Faizan + Hakim
- [ ] Profile & Settings (verified badge, edit, password, language, privacy, delete/logout) — Faizan + Hakim
- [ ] Cancellations & empty states (reasons for cancels, "no nearby jobs" empty state) — Faizan + Shafqat
- [ ] Design tokens applied on every screen (Navy/Teal/Orange/Green/Red/Gray, verified badge) — ALL frontend
- [ ] No features added that are NOT in Module 1 — ALL developers

**Module 1 is complete when every box above is ticked.**