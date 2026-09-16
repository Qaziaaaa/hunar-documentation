# HUNAR MVP — Complete Worker Workflow Specification (A to Z)

**Target Audience:** Product Designers, UI/UX Engineers, Frontend & Backend Developers  
**Purpose:** Blueprint to design and implement the skilled worker experience and state transitions in the Hunar MVP.  
**Platform Roles:** Skilled Worker (Service Provider), Customer, Admin  

---

## 1. Core Principles & Golden Rules

1. **Passwordless Access:** Phone number + SMS OTP verification only.
2. **Proximity & Skill Matching:** Workers only receive notifications and jobs that match their registered trades and geographic radius.
3. **Two-Stage Pricing Architecture:**
   - **Stage 1 (Visit Fee):** Paid/agreed for coming to inspect and diagnose the issue.
   - **Stage 2 (Repair Fee):** Diagnosed on-site, negotiated with itemized parts/labor breakdown, and explicitly approved before any physical repair begins.
4. **No Unapproved Work:** The worker is strictly prohibited from beginning repairs until the customer confirms the agreed repair price.
5. **Transparency & Audit Trail:** Every status change, chat message, inspection image, and price counter-offer is logged.

---

## 2. Worker Lifecycle State Machine

```
[ Worker Profile Approved ]
            │
            ▼
     [ Nearby Job Posted ]
            │
            ▼ (Worker views job & submits visit quote)
      [ Offer Submitted ]
            │
   ┌────────┴──────────────────────────────┐
   │ (Customer counters visit fee)         │ (Customer accepts visit fee)
   ▼                                       ▼
[ Visit Negotiation ] ──────────► [ Visit Scheduled & Confirmed ]
                                           │
                                           ▼ (Worker taps "Start Visit")
                                  [ Worker On The Way ]
                                           │
                                           ▼ (Worker taps "I've Arrived")
                                  [ Visit In Progress ]
                                           │
                                           ▼ (Inspection done + repair quote sent)
                                  [ Repair Negotiating ]
                                           │
                                           ▼ (Customer approves final repair price)
                                  [ Repair Approved ]
                                           │
                                           ▼ (Worker taps "Start Repair")
                                  [ Repair In Progress ]
                                           │
                                           ▼ (Worker taps "Mark Complete")
                                   [ Job Completed ]
                                           │
                                           ▼ (Customer pays via Gateway / Cash)
                                     [ Job Paid ]
                                           │
                                           ▼ (Mutual 1-5 Star Reviews)
                                   [ Closed / Reviewed ]
```

---

## 3. Step-by-Step Worker Flow (Screens, Actions & Logic)

---

### Step 1: Registration & Onboarding
* **Screen:** Worker Sign Up & Profile Setup
* **Worker Actions:**
  1. Enters mobile phone number → enters 6-digit SMS OTP.
  2. Selects account role: **"I am a Skilled Worker"**.
  3. Fills in core profile:
     - Full Name & Profile Picture.
     - Skill Categories (e.g., Plumber, Electrician, Carpenter, AC Technician).
     - Years of experience & brief bio.
     - Service radius / coverage areas (GPS pin + radius or city sector).
     - Default baseline visit charge (e.g., Rs. 300).
  4. Submits Identity Verification (KYC):
     - Front & back photo of National ID (CNIC).
     - Optional trade licenses, certificates, or portfolio photos.
* **System Logic:**
  - Account is created in `pending_verification` state.
  - Admin reviews credentials. Once approved, status changes to `verified`.
  - Worker toggles availability switch to **Online / Ready for Jobs**.

---

### Step 2: Receiving Jobs & Discovery
* **Screen:** Worker Dashboard / "Nearby Jobs"
* **Trigger:** Customer posts a service request within the worker's trade category and service area.
* **Notification Delivered:**
  - **Push Notification:** *"New Plumbing request in F-10, Islamabad (2.1 km away)"*.
  - **In-App Notification Bell:** Updates badge counter.
* **Job Card Details Displayed:**
  - Service Category & Problem Title (e.g., "Leaking Main Water Valve").
  - Customer description & audio voice note player.
  - Attached photos of the issue.
  - Distance & general location pin (approximate area, exact street hidden until visit confirmed).
  - Customer's preferred visit time window & urgency tag (e.g., "Urgent - Today").
* **Worker Actions:**
  - Tap **"View Job Details"** or dismiss/ignore.

---

### Step 3: Responding & Submitting an Offer
* **Screen:** Job Proposal Modal / Sheet
* **Worker Actions:**
  1. Reviews the problem description and images.
  2. Inputs **Visit Charge** (e.g., Rs. 300).
  3. Inputs optional initial estimated repair range (e.g., "Estimate Rs. 1,500 – Rs. 2,500 pending inspection").
  4. Adds a short note/proposal (e.g., "Licensed plumber with 8 years experience. Can arrive today at 4 PM.").
  5. Taps **"Send Offer"**.
* **System Logic:**
  - Only **one offer** per worker per job.
  - Worker can withdraw the offer while still in `pending` status.
  - Job card state on worker dashboard updates to **"Offer Sent — Awaiting Customer Decision"**.

---

### Step 4: Selection, Visit Negotiation & Chat
* **Screen:** Active Job Details & Real-Time Chat
* **Scenario A (Direct Accept):**
  - Customer selects this worker's offer.
  - Job status moves to `visit_scheduled`.
* **Scenario B (Visit Charge Negotiation):**
  - Customer sends counter-offer (e.g., "Can you come for Rs. 250?").
  - Worker sees interactive counter banner:
    - Button: **Accept Rs. 250**
    - Button: **Counter-Offer** (enters e.g. Rs. 280)
    - Button: **Decline**
  - Once both agree, the visit fee becomes locked.
* **In-App Collaboration Features:**
  - Customer's exact address and phone contact are now revealed.
  - Built-in real-time chat (Socket.IO) opens: exchange text, pictures, or voice notes.
  - Scheduled appointment appears in worker’s **"Upcoming Visits"** calendar.

---

### Step 5: Travel & On-Site Inspection
* **Screen:** Active Job Progress Tracker
* **Stage A — Departure:**
  - Worker taps **"Start Visit"** (Status: `worker_on_the_way`).
  - Customer sees live tracking and notification: *"Worker is heading to your location."*
* **Stage B — Arrival:**
  - Worker arrives at premises and taps **"I've Arrived"** (Status: `visit_in_progress`).
* **Stage C — Inspection:**
  - Worker diagnoses the physical fault.
  - Worker taps **"Start Inspection"** and enters:
    - Diagnostic summary (e.g., "Cracked 1-inch PVC elbow joint behind wall").
    - Inspection photos (e.g., photo of cracked pipe).
    - Itemized repair estimate:
      - Parts/Materials: Rs. 1,200
      - Labor/Service: Rs. 1,500
      - Inspection/Visit: Rs. 285
      - **Total Estimated Cost:** Rs. 2,985
  - Worker taps **"Submit Inspection"**.

---

### Step 6: Repair Price Negotiation & Customer Approval
* **Screen:** Repair Quotation Breakdown
* **Customer Options:**
  - **Approve Estimate:** Agrees to the total amount.
  - **Counter-Offer / Bargain:** Suggests a lower price (max 5 rounds of negotiation).
* **Worker Response:**
  - If countered, worker can accept or counter back.
  - Once customer taps **"Approve Repair"**, status becomes `repair_approved`.
* **Safety Lock:** The app warns the worker: *"Do not commence work until customer has approved the repair price."*

---

### Step 7: Repair Execution & Completion
* **Screen:** Active Job — Work in Progress
* **Worker Actions:**
  1. Worker taps **"Start Repair"** (Status: `in_progress`).
  2. Executes physical service/installation.
  3. Worker takes final "After" photos demonstrating resolved issue.
  4. Worker taps **"Mark Repair Complete"** (Status: `completed`).
* **Customer View:**
  - Prompted that work is finished with an invoice breakdown for payment.

---

### Step 8: Payment & Platform Commission
* **Screen:** Payment Summary & Payout Tracker
* **Payment Settlement:**
  - Total Bill: Rs. 2,985.
  - Payment Method:
    - **Digital (JazzCash, Easypaisa, Debit/Credit Card):** Customer pays via app. Held in 24-hour safety escrow before disbursement.
    - **Cash:** Customer hands cash to worker. Worker clicks **"Confirm Cash Received"**.
* **Financial Split:**
  - Example: Platform Commission 15% (Rs. 448).
  - Worker Net Payout: 85% (Rs. 2,537).
  - Commission ledger updates in worker's **"Earnings"** tab.

---

### Step 9: Reviews & Profile Reputation
* **Screen:** Job Review & Feedback
* **Actions:**
  - Worker rates the customer (1 to 5 Stars + optional tags: e.g., "Courteous", "Prompt Payment", "Accurate Description").
  - Customer rates the worker (1 to 5 Stars + text review + quality tags).
* **Reputation Updates:**
  - Worker's public profile recalculated: average star rating, total completed jobs counter, positive feedback percentage.
  - Job archives under **"Completed Jobs"**.

---

## 4. Edge Cases & Exception Handling

| Edge Case | Worker Experience & Resolution |
|---|---|
| **Customer Cancels before Visit** | Notification sent to worker. If worker was already "On the way", cancellation terms may grant nominal travel compensation. |
| **Customer Cancels after Inspection** | If customer rejects repair price and cancels, customer still pays the agreed **Visit/Inspection fee** to the worker. |
| **Customer No-Show / Unreachable** | Worker reports "Customer Unavailable" after waiting 15 minutes. Admin logs incident and protects worker's cancellation rating. |
| **Dispute / Unfinished Work** | If customer raises a dispute, job moves to `disputed`. Admin reviews chat history, inspection images, and repair photos to release funds fairly. |
| **Scope Expansion On-Site** | If unexpected damage is discovered mid-repair, worker submits an **"Add-on / Variation Quote"** requiring customer in-app approval before continuing. |

---

## 5. UI Screen Checklist for Worker MVP

1. **Worker Onboarding:**
   - Phone Login with OTP input.
   - Profile setup (Skills multi-select, Bio, ID upload, Service radius map).
2. **Dashboard:**
   - Online/Offline toggle switch.
   - Quick stats (Today's Earnings, Active Jobs count, Rating score).
   - "Nearby Jobs" feed with distance, urgency badges, and filter tabs.
3. **Job Details & Offer Screen:**
   - Customer problem description, audio clip, and photos.
   - Visit fee input field + counter-offer dialog.
4. **Visit & Inspection Flow:**
   - Travel status buttons ("Start Visit" → "I've Arrived").
   - Inspection form (Upload diagnostic photos, itemize parts + labor costs).
5. **Repair Tracker:**
   - Status indicators (`repair_approved` → `in_progress` → `completed`).
   - "Start Repair" and "Mark Complete" primary CTAs.
6. **Earnings & History:**
   - Payout balance, earnings history, and completed job archive.
   - Customer review cards.
