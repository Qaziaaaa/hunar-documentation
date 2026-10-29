# Implementation Plan: Immediate / Urgent Jobs Real-Time Flow

## Goal Description
Enhance the immediate/urgent job flow for both **Workers** and **Customers** in WorkerFIX:
1. **Worker Persona**: When a technician sends an offer for an urgent/immediate job, display a dedicated fixed screen for **50 seconds** featuring a smoothly reducing progress bar (with **no numeric timer**). If accepted by the customer during this window, the worker transitions directly to the accepted job/visit details; otherwise, it closes cleanly after 50 seconds.
2. **Customer Persona**: When a customer posts an immediate job (`scheduleType === "asap"`), transition after Step 4 directly into a fixed **"Searching for Technician"** live matching screen. Incoming technician offers appear on this screen in real time with an instant **"Accept"** button.
3. **Core Analysis**: Answer and verify the user's key question: *"will it disturb or change recent flow ????"*

---

## Flow Analysis: Will it Disturb or Change the Recent Flow?

> [!NOTE]
> **Conclusion: No, it will NOT disturb or break the existing flow.**
> The implementation is designed to be **strictly conditional and purely additive**.

Here is how both flows behave side-by-side:

| Flow Phase | Normal / Scheduled Jobs (`scheduleType: "scheduled"`) | Immediate / Urgent Jobs (`scheduleType: "asap"` / `isUrgent`) |
| :--- | :--- | :--- |
| **Customer Step 4 Submission** | Shows existing `JobPostedSuccessModal` with link to `/customer/jobs`. **(100% Unchanged)** | Replaces static modal with live `ImmediateJobSearchingScreen`. Displays active radar + incoming technician offers in real time. |
| **Customer Navigation** | Navigates to `/customer/jobs` to review bids at their leisure. | Can accept an offer immediately on-screen, or click *"View in My Jobs"* / *"Exit"* at any time to fallback to `/customer/jobs`. |
| **Worker Submitting Offer** | Normal jobs in `JobRequestModal` submit offer and close modal in 250ms as before. **(100% Unchanged)** | Urgent jobs trigger `UrgentBidCountdownModal`: a 50s fixed waiting screen with a shrinking progress line (no numeric timer). |
| **Backend & Database** | Uses existing `/jobs` and `/jobs/:jobId/offers` REST endpoints and Prisma models. | Uses identical endpoints and existing Socket.io events (`job:offer`, `job:offer:accepted`). Zero schema changes needed. |

---

## User Review Required

> [!IMPORTANT]
> **50-Second Countdown Display**: As explicitly requested, **no numeric timer digits** (e.g. `49s`, `00:48`) will appear on the worker's screen. The remaining time will be represented solely by an elegant, smoothly diminishing horizontal progress line.
>
> **Exit & Dismissibility**: Both screens provide clear escape hatches (*"Minimize / View in My Jobs"* for customers, and *"Dismiss / Cancel"* for workers) so no user is ever locked in.
>
> **Real-Time Connectivity**: The screens will use a dual-sync strategy: **Socket.io events** for sub-second updates, paired with a lightweight **2.5s HTTP polling fallback** to ensure 100% reliability even if WebSockets reconnect.

---

## Proposed Changes

```
hunar-frontend/src/
├── features/
│   ├── post-job/
│   │   ├── components/
│   │   │   ├── immediate-job-searching-screen.tsx     [NEW]  Customer live search & bids view
│   │   │   ├── post-job-wizard.tsx                   [MODIFY] Conditionally mount live search on ASAP
│   ├── worker-dashboard/
│   │   ├── components/
│   │   │   ├── urgent-bid-countdown-modal.tsx        [NEW]  50-second fixed screen with progress line
│   │   │   ├── job-request-modal.tsx                 [MODIFY] Trigger countdown modal on urgent offer
│   │   │   ├── index.ts                              [MODIFY] Export new modal
```

---

### Component 1: Worker Urgent Offer 50-Second Screen

#### [NEW] `hunar-frontend/src/features/worker-dashboard/components/urgent-bid-countdown-modal.tsx`
- **Purpose**: A fixed overlay screen that appears when a worker sends an offer for an urgent job.
- **Key Features**:
  - `TOTAL_DURATION = 50000` (50 seconds).
  - Progress bar width: `(remainingMs / TOTAL_DURATION) * 100%`, smoothly animated with CSS transition.
  - **No numbers or countdown text**: Only visual progress bar.
  - Heading: *"Urgent Offer Submitted"* / *"فوری پیشکش بھیج دی گئی"*.
  - Subtext: *"Waiting for customer response..."* / *"کسٹمر کے قبول کرنے کا انتظار ہے..."*.
  - Job details chip: Category icon, area name, quoted visit charge (`Rs. {charge}`).
  - Live pulse animation (radar sweep rings).
  - Listens for Socket.io `JOB_EVENTS.jobOfferAccepted` + polls `offersService.getMyOffers()` or job status every 2.5s.
  - If accepted: turns emerald green with success chime/icon and button to *"Open Job Details"*.
  - If 50 seconds lapse without acceptance: notifies worker and automatically closes, returning worker to feed.

```tsx
// Key state & progress mechanics:
const TOTAL_MS = 50000;
const [elapsedMs, setElapsedMs] = useState(0);

useEffect(() => {
  const start = performance.now();
  const interval = setInterval(() => {
    const elapsed = performance.now() - start;
    if (elapsed >= TOTAL_MS) {
      setElapsedMs(TOTAL_MS);
      clearInterval(interval);
      handleTimeout();
    } else {
      setElapsedMs(elapsed);
    }
  }, 100);
  return () => clearInterval(interval);
}, []);

const progressPercent = Math.max(0, 100 - (elapsedMs / TOTAL_MS) * 100);

// Rendering the progress line WITHOUT numeric timer:
<div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
  <div 
    className="h-full bg-gradient-to-r from-[#0F8B8D] to-[#123B5D] transition-all duration-100 ease-linear"
    style={{ width: `${progressPercent}%` }}
  />
</div>
```

---

#### [MODIFY] `hunar-frontend/src/features/worker-dashboard/components/job-request-modal.tsx`
- When worker clicks "Send Offer":
  - Check `isUrgent`.
  - If `isUrgent` is true: after `submitWorkerOffer()` succeeds, instead of closing after 250ms, open `UrgentBidCountdownModal`.
  - If `isUrgent` is false: retain the current quick-confirm and close flow (preserving standard scheduled jobs flow).

---

### Component 2: Customer Post-Step-4 Fixed Searching Screen

#### [NEW] `hunar-frontend/src/features/post-job/components/immediate-job-searching-screen.tsx`
- **Purpose**: Replaces the static modal for immediate jobs after Step 4, presenting an active searching screen with real-time incoming offers.
- **Key Features**:
  - Full-page fixed backdrop overlay (`fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col`).
  - **Searching Radar Header**: Animated radar ring with pulsating beacon and live message:
    *"Broadcasting your request to verified technicians in {area}..."*
  - **Live Offers Feed**:
    - Listens to `getSocket()` for `JOB_EVENTS.jobOffer` targeting `jobId`.
    - Polling fallback: calls `getJobOffers(jobId)` every 2.5s to ensure offers are never missed.
    - As technicians bid, their cards slide in smoothly:
      - Worker photo, name, rating, verified badge, experience.
      - Proposed visit fee (`Rs. {fee}`).
      - **"Accept & Book Technician"** button.
  - **Direct Acceptance**:
    - Clicking "Accept" calls `acceptWorkerOffer(jobId, offer.id)`.
    - Upon success, displays the generated Security PIN and immediately redirects to `/customer/jobs/${jobId}/tracking` (or `/customer/jobs/${jobId}`).
  - **Safe Exit**:
    - *"View in My Jobs"* link in the header/footer allowing the customer to leave the screen at any moment and view the job in their standard jobs hub.

---

#### [MODIFY] `hunar-frontend/src/features/post-job/components/post-job-wizard.tsx`
- In `handleSubmitJob()`:
  - When `createJob()` succeeds:
    - If `formData.scheduleType === "asap"`: set `postedJobId(res.id)` and set `showImmediateSearchScreen(true)`.
    - If `formData.scheduleType === "scheduled"`: show `JobPostedSuccessModal` as usual.
  - Render `ImmediateJobSearchingScreen` when `showImmediateSearchScreen && postedJobId`.

---

## Verification Plan

### Automated Type & Build Verification
```bash
# 1. Type check the entire frontend codebase
npm run --prefix hunar-frontend typecheck

# 2. Build check to verify Next.js bundle compilation
npm run --prefix hunar-frontend build
```

### Manual Verification Flow

#### Flow 1: Worker Persona (Urgent Job Offer)
1. Sign in as a Worker.
2. Open the Worker Dashboard. Find an urgent/immediate job card (with red/orange urgent badge).
3. Click to open `JobRequestModal` and click **"Send Offer"**.
4. Verify the **Fixed Urgent Offer Screen** opens immediately:
   - Verify the top progress line steadily shrinks from 100% to 0%.
   - **Verify there is NO numeric timer / countdown digits anywhere on the screen.**
   - Verify customer name, job category, and quoted fee are clearly displayed.
5. Let the screen reach 50 seconds: verify it handles timeout cleanly and returns to dashboard.
6. Submit another offer and have the customer accept it: verify the screen transitions to accepted status and navigates to the job.

#### Flow 2: Customer Persona (Immediate Job Post)
1. Sign in as a Customer and click **"Post a Job"**.
2. Complete Step 1 (Category) and Step 2 (Details).
3. In Step 3 (Location & Schedule), select **"⚡ ASAP / Immediate"**.
4. Proceed to Step 4 (Review) and click **"Post Job Now"**.
5. Verify that instead of the old static modal, the **Fixed Searching Screen** appears:
   - Displays active radar animation: *"Searching for nearby technicians in {area}..."*
6. In a second window (Worker), send an offer for this job.
7. Verify the offer appears on the customer's searching screen immediately.
8. Click **"Accept & Book"**: verify offer is accepted, PIN is activated, and customer is routed to job tracking.

#### Flow 3: Regression Verification (Normal / Scheduled Job)
1. Post a job with **"Schedule for later"** (date and time slot).
2. Submit in Step 4.
3. Verify that the **standard flow** is completely preserved (`JobPostedSuccessModal` opens, linking to `/customer/jobs`).
4. As worker, send an offer to this scheduled job: verify it submits normally without the 50s urgent screen.

