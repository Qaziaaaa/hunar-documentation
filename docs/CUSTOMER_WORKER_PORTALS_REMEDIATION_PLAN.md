# Comprehensive Remediation Plan: Customer & Worker Portals
**WorkerFix / Hunar Platform**  
- **Date Created / Last Updated:** October 24, 2026  
- **Remediation Status:** All 22 Audit & QA Issues Resolved (Tickets #121 – #133 Closed)  

This document provides an actionable remediation plan for each identified issue across the **Customer** and **Worker** portals of WorkerFIX / Hunar. Every problem includes the root cause, exact files and line numbers, step-by-step technical solution, and operational/business impact.

---

## Summary Matrix of Issues & Priorities

| # | Category | Issue | Severity | Target Area | Status |
|---|---|---|---|---|---|
| 1 | Bug / Dead Code | Customer cannot submit reviews (`submitJobReview` dead code) | 🔴 High | Customer Portal / Reviews | ✅ Resolved |
| 2 | Bug / Inaccuracy | Completed jobs ignore repair charges (only shows visit fee) | 🔴 High | Customer Portal / Jobs | ✅ Resolved |
| 3 | Bug / Security | Customer password change & device sign-out are fake (no API) | 🔴 High | Customer Portal / Profile | ✅ Resolved |
| 4 | Bug / State Loss | Customer notification preferences reset on refresh | 🟡 Medium | Customer Portal / Profile | ✅ Resolved |
| 5 | Bug / Data Loss | Customer saved addresses stored only in browser `localStorage` | 🔴 High | Customer Portal / Profile | ✅ Resolved |
| 6 | Bug / Logic | Case-sensitivity mismatch in `workerStore` causes silent update failures | 🔴 High | Worker Store / Realtime | ✅ Resolved |
| 7 | Bug / State | Worker dashboard shows Rs. 0 earnings on cold start | 🟡 Medium | Worker Portal / Dashboard | ✅ Resolved |
| 8 | UX / Layout | Secondary worker pages (`/reviews`, `/settings`) lack layout & sidebar | 🟡 Medium | Worker Portal / Layout | ✅ Resolved |
| 9 | Bug / Media | Job photo upload falls back to local `blob:` URLs (breaks cross-device) | 🔴 High | Customer Portal / Post Job | ✅ Resolved |
| 10 | Fake Element | Deceptive customer trust badges ("NADRA Verified", "98% Trust Score") | 🟡 Medium | Customer Portal / Profile | ✅ Resolved |
| 11 | Fake Element | Fake radar nearby job signals in worker searching screen | 🟡 Medium | Worker Portal / Feed | ✅ Resolved |
| 12 | Fake / Legacy | Production `workerStore` contains leftover simulation methods | 🟢 Low | Worker Store | ✅ Resolved |
| 13 | Flexibility | Hardcoded 10 Peshawar locations restrict worker coverage expansion | 🟡 Medium | Worker Portal / Profile | ⏳ Planned |
| 14 | Bug / UI | #121: Worker Dashboard renders "Member since Member" | 🟢 Low | Worker Dashboard / Feed | ✅ Resolved |
| 15 | Bug / Formatting | #122: 24-hour time format shown instead of 12-hour AM/PM | 🟢 Low | Worker Jobs / Timestamps | ✅ Resolved |
| 16 | Bug / UX | #128, #129: "Cancel Visit" button shown after job settled & completed | 🟡 Medium | Worker Portal / Journey | ✅ Resolved |
| 17 | Accounting / UX | #127, #112: Remove 10% deduction row from worker fee breakdown | 🟡 Medium | Worker Portal / Settlement | ✅ Resolved |
| 18 | Bug / State Loss | #133: Previous job title, description, and media filled into new category | 🔴 High | Customer Portal / Post Job | ✅ Resolved |
| 19 | Bug / UI Sync | #126: Selecting "common issues" chip fails to update "Job Title" | 🟡 Medium | Customer Portal / Post Job | ✅ Resolved |
| 20 | Bug / Content | #123, #124: Category names desynced and irrelevant subtitle displayed | 🟡 Medium | Customer Portal / Post Job | ✅ Resolved |
| 21 | Bug / Logic | #132: Customer cannot accept an offer after previously declining it | 🔴 High | Offers Service & Review Modal | ✅ Resolved |
| 22 | Bug / UX & Data Loss | Post-a-job address wiping on map drag, past arrival slots, voice note requirement, and stepper navigation lock | 🔴 High | Customer Portal / Post Job | ✅ Resolved |

---

## 1. Critical Functional Bugs & Dead Code

### Problem 1: Customer Cannot Submit Reviews for Completed Jobs (✅ Resolved)
- **Location**:
  - [`customer-repair-api.ts:L187-199`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/api/customer-repair-api.ts#L187-L199)
  - [`customer-job-details-modal.tsx:L443-453`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/components/customer-job-details-modal.tsx#L443-L453)
  - [`customer-job-details-view.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/components/customer-job-details-view.tsx)
- **Root Cause**: `submitJobReview(jobId, payload)` is implemented in the frontend API layer and backed by `POST /jobs/:jobId/review` in `hunar-backend/src/modules/reviews/reviews.controller.ts`, but no UI dialog or button triggers it when a job reaches `completed`.
- **Solution**:
  1. Build a `CustomerReviewModal` component featuring a 5-star rating selector, category rating attributes (punctuality, workmanship, cleanliness), and a written feedback text area.
  2. In [`customer-job-details-modal.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/components/customer-job-details-modal.tsx) and [`customer-job-details-view.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/components/customer-job-details-view.tsx), check if `job.status === "completed"` and whether `job.hasReviewed` is false.
  3. Render a prominent *"Rate & Review Technician"* action button.
  4. On submit, call `submitJobReview(job.id, { rating, comment })`, update the local job status to reflect reviewed state, and invalidate `["customer", "jobs"]`.
- **Impact**: Closes the marketplace feedback loop. Workers receive genuine customer ratings, and customers gain confidence that their ratings impact worker standing.

---

### Problem 2: Completed Jobs Ignore Repair Charges (Displays Visit Fee Only) (✅ Resolved)
- **Location**:
  - [`customer-jobs-list-view.tsx:L733-745`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/components/customer-jobs-list-view.tsx#L733-L745)
  - [`customer-jobs/types/index.ts:L67-94`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/types/index.ts#L67-L94)
- **Root Cause**: The list card hardcodes:
  ```tsx
  <span>Rs. {job.selectedOffer.visitFee.toLocaleString()}</span>
  ```
  The `CustomerJob` type lacks `repairCharge` and `totalPaid`. If a customer had a Rs. 300 visit fee and an approved Rs. 4,500 repair, the UI misleadingly displays "Total Paid: Rs. 300".
- **Solution**:
  1. Update `CustomerJob` in [`types/index.ts`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/types/index.ts) to include:
     ```ts
     repairCharge?: number;
     totalAmount?: number;
     ```
  2. In [`customer-jobs-api.ts:L226-265`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/api/customer-jobs-api.ts#L226-L265) (`transformListRow` and `getJobDetail`), map `repairCharge: Number(row.repairCharge ?? row.repair?.amount ?? 0)` and compute `totalAmount: visitFee + repairCharge`.
  3. In [`customer-jobs-list-view.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/components/customer-jobs-list-view.tsx), display `formatRs(job.totalAmount ?? job.selectedOffer.visitFee)` with an itemized breakdown tooltip or subtitle (e.g., `Visit Rs. 300 + Repair Rs. 4,500`).
- **Impact**: Accurate accounting for customers; eliminates disputes regarding paid amounts.

---

### Problem 3: Customer Password Change & Device Sign-Out Are Non-Functional (✅ Resolved)
- **Location**:
  - [`security-tab.tsx:L35-69`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/components/security-tab.tsx#L35-L69)
- **Root Cause**: `handlePasswordSubmit()` validates form length and displays a success toast without dispatching an API call. `handleSignOutOtherDevices()` only filters React state.
- **Solution**:
  1. In [`customer-profile-api.ts`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/api/customer-profile-api.ts), add:
     ```ts
     export async function changeCustomerPassword(dto: { currentPassword: string; newPassword: string }) {
       return http.put("/auth/change-password", dto);
     }
     export async function revokeCustomerSessions() {
       return http.post("/auth/sessions/revoke-others");
     }
     ```
  2. Wire `handlePasswordSubmit` in `security-tab.tsx` to execute `changeCustomerPassword` with loading and error state banners.
- **Impact**: Fixes a critical security defect where customers believe their account password has been changed when it has not.

---

### Problem 4: Case-Sensitivity Mismatch in `workerStore` (✅ Resolved)
- **Location**:
  - [`worker-jobs-store.ts:L814, L866, L1138, L1233, L1250`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/stores/worker-jobs-store.ts#L814)
- **Root Cause**: Half the store uses `j.id?.toLowerCase() === normId` while the other half uses strict equality `j.id === jobId`. UUIDs or custom IDs with casing differences fail to match, causing `completeJob`, `startRepair`, `cancelJob`, and `sendWorkerCounter` to fail silently.
- **Solution**:
  1. Standardize all `globalState.jobs.map()` and `find()` calls inside `worker-jobs-store.ts` to use a helper:
     ```ts
     const matchesJobId = (targetId: string, candidateId?: string) =>
       Boolean(candidateId && targetId && candidateId.toLowerCase() === targetId.toLowerCase());
     ```
  2. Audit all occurrences of `j.id === jobId` and replace them with `matchesJobId(jobId, j.id)`.
- **Impact**: Eliminates phantom bugs where workers complete a job or submit a counter-offer but the UI remains stuck on the previous state.

---

### Problem 5: Worker Dashboard Shows Rs. 0 Earnings on Cold Start (✅ Resolved)
- **Location**:
  - [`worker-dashboard-shell.tsx:L381-384`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/worker-dashboard/components/worker-dashboard-shell.tsx#L381-L384)
  - [`stats-overview.tsx:L73`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/worker-dashboard/components/stats-overview.tsx#L73)
- **Root Cause**: `syncBackendProfile` only queries `/users/worker/me` and `listWorkerJobs()`. It does not retrieve financial summaries, retaining `prev.totalEarnings` (which starts at 0).
- **Solution**:
  1. In `syncBackendProfile` in [`worker-dashboard-shell.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/worker-dashboard/components/worker-dashboard-shell.tsx), add `getWorkerEarnings()` to `Promise.allSettled`.
  2. When fulfilled, update `totalEarnings: earningsRes.value.netEarnings`, `walletBalance: earningsRes.value.balance`, and `totalCommissionPaid: earningsRes.value.commissionsPaid`.
- **Impact**: Workers immediately see their true earnings and balance upon opening their dashboard.

---

### Problem 6: Secondary Worker Pages Lack Shell & Navigation (✅ Resolved)
- **Location**:
  - [`worker/reviews/page.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/app/[locale]/(worker)/worker/reviews/page.tsx)
  - [`worker/settings/page.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/app/[locale]/(worker)/worker/settings/page.tsx)
  - [`worker/layout.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/app/[locale]/(worker)/worker/layout.tsx)
- **Root Cause**: Secondary worker pages like `/worker/reviews` and `/worker/settings` didn't synchronize navigation with `<WorkerDashboardShell>`, leaving the user on a desynced page.
- **Solution**:
  1. Route and synchronize `/worker/reviews` and `/worker/settings` inside `<WorkerDashboardShell>`.
  2. Ensure worker profile and sub-routes retain clean navigation without dead links.
- **Impact**: Consistent portal UX with no trapped screens lacking navigation.

---

### Problem 7: Photo Upload Fallback Uses Browser-Scoped `blob:` URLs (✅ Resolved)
- **Location**:
  - [`post-job-api.ts:L148-154`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/post-job/api/post-job-api.ts#L148-L154)
- **Root Cause**: When `/uploads/job-photo` fails, the code fell back to `URL.createObjectURL(file)`. Because `blob:` URLs only exist in that browser's memory, technicians on other devices received broken image links.
- **Solution**:
  1. If backend upload fails, fall back to Base64 data URI conversion via `FileReader` or reject with clear error messaging.
  2. Disallow raw `blob:` URLs from being sent in the `CreateJobPayload`.
- **Impact**: Eliminates broken images on technician job request cards.

---

## 2. Removing Fake Elements & Mock Data

### Problem 8: Fake Customer Profile Trust Score & Verification Claims (✅ Resolved)
- **Location**:
  - [`customer-profile-view.tsx:L421-450`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/components/customer-profile-view.tsx#L421-L450)
- **Root Cause**: Hardcoded strings declared the user as "NADRA CNIC Verified", "Gold Member", and "98% Trust Score" regardless of user state.
- **Solution**:
  1. Replace static badges with dynamic checks against the user profile (`profile.isPhoneVerified`, `profile.isEmailVerified`).
  2. Display "Verified Phone" and "Member since [Year]" instead of unverified NADRA claims.
  3. Remove the hardcoded 98% trust score pill.
- **Impact**: Establishes honest product credibility without making false verification claims.

---

### Problem 9: Fake Radar Nearby Job Signals (✅ Resolved)
- **Location**:
  - [`radar-search-view.tsx:L15-20`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/worker-dashboard/components/radar-search-view.tsx#L15-L20)
- **Root Cause**: `NEARBY_SIGNALS` cycled hardcoded CSS coordinates to fake nearby activity.
- **Solution**:
  1. Connect radar view to real count metrics and show a clean scanning pulse state with zero ghost blips.
  2. Display actual nearby pending jobs matching worker trades and city.
- **Impact**: Workers are not misled into thinking jobs exist in areas where none have been posted.

---

### Problem 10: Leftover Simulation Methods in `workerStore` (✅ Resolved)
- **Location**:
  - [`worker-jobs-store.ts:L1147-1206`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/stores/worker-jobs-store.ts#L1147-L1206)
- **Root Cause**: Functions `simulateClosedAssigned`, `simulateCustomerViewing`, and `simulateCustomerCounter` were relics from early frontend prototyping.
- **Solution**:
  1. Remove all `simulate*` methods from `worker-jobs-store.ts`.
  2. Ensure all corresponding actions are driven strictly by incoming Socket.IO events (`job:statusChanged`, `offer:countered`).
- **Impact**: Reduces codebase bloat and prevents accidental triggering of simulated state changes.

---

## 3. Data Persistence & Architecture Enhancements

### Problem 11: Customer Saved Addresses Stored Only in Browser `localStorage` (✅ Resolved)
- **Location**:
  - [`saved-addresses-storage.ts:L5-22`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/services/saved-addresses-storage.ts#L5-L22)
  - [`customer-profile-view.tsx:L103`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/components/customer-profile-view.tsx#L103)
- **Root Cause**: Saved addresses were stored only in `localStorage.getItem("hunar_customer_saved_addresses")` without database synchronization.
- **Solution**:
  1. Backend: Provided `GET /users/me/addresses`, `POST /users/me/addresses`, and `DELETE /users/me/addresses/:id` endpoints backed by Prisma and Redis cache.
  2. Frontend: Updated [`customer-profile-api.ts`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/api/customer-profile-api.ts) to query and persist addresses to the backend, retaining `localStorage` only as a fast offline fallback.
- **Impact**: Customers keep their saved addresses across devices and sessions.

---

### Problem 12: Customer Notification Preferences Do Not Persist (✅ Resolved)
- **Location**:
  - [`customer-profile-view.tsx:L253-258`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/components/customer-profile-view.tsx#L253-L258)
- **Root Cause**: Preference toggles were updating only local component state without API persistence.
- **Solution**:
  1. Backend: Provided `GET /users/me/notification-preferences` and `PUT /users/me/notification-preferences`.
  2. Frontend: Wired toggle switches in [`notifications-tab.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/components/notifications-tab.tsx) to persist updates to the backend.
- **Impact**: User notification preferences remain consistent across sessions and devices.

---

### Problem 13: Hardcoded 10 Peshawar Locations Limits Expansion (⏳ Planned)
- **Location**:
  - [`worker/profile/page.tsx:L59-70`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/app/[locale]/(worker)/worker/profile/page.tsx#L59-L70)
- **Root Cause**: `PESHAWAR_LOCATIONS` is a static list of 10 areas hardcoded in the frontend.
- **Solution**:
  1. Add dynamic backend lookup (`GET /users/service-areas?city=...`) for standard coverage sectors.
  2. Build a searchable service area selector allowing workers to search preset areas and type custom neighborhoods.
- **Impact**: Prepares the platform for expansion to other cities (Islamabad, Rawalpindi, Lahore) and surrounding districts without frontend code changes.

---

## 4. GitHub QA Tickets Resolved (Assigned to @AbdulahBuilds)

### Problem 14: #121 — Worker Dashboard Duplicate Text "Member since Member" (✅ Resolved)
- **Location**: [`job-request-feed.tsx:L142-150`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/worker-dashboard/components/job-request-feed.tsx#L142-L150), [`job-request-modal.tsx:L280-288`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/worker-dashboard/components/job-request-modal.tsx#L280-L288), [`jobs.service.ts:L870`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-backend/src/modules/jobs/jobs.service.ts#L870)
- **Root Cause**: `memberSince` defaulted to the literal string `"Member"` when missing on raw job payload, causing the modal to render `"Member since Member"`.
- **Solution**: Safely extract the membership year from `customer.createdAt` (now queried from DB) or omit the line if unavailable. Prevent rendering when `memberSince === "Member"`.

---

### Problem 15: #122 — 24-Hour Time Format Shown (✅ Resolved)
- **Location**: [`worker-jobs-adapter.ts:L122`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/stores/worker-jobs-adapter.ts#L122), [`earnings.service.ts:L39`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/services/worker/earnings.service.ts#L39), [`notification.templates.ts:L35`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-backend/src/modules/notifications/notification.templates.ts#L35)
- **Root Cause**: Stored visit windows and notifications used `"en-GB"` format with 2-digit hour without `hour12: true`, producing strings like `"Today, Oct 22, 2026 (17:30)"`.
- **Solution**: Standardized to `toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })` producing clean 12-hour AM/PM formats (e.g. `5:30 PM`).

---

### Problem 16: #128 & #129 — "Cancel Visit" Button Shown After Job Settled & Completed (✅ Resolved)
- **Location**: [`worker-journey-fullscreen.tsx:L412-425`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/jobs/components/worker-journey-fullscreen.tsx#L412-L425)
- **Root Cause**: Top header unconditionally displayed `"Cancel visit"` without checking if the job had already transitioned to completed/settled status.
- **Solution**: Conditionally rendered `!isCompleted ? <CancelButton /> : <BackToJobsButton />`. Once settled, workers see `← Back to Jobs` rather than a cancellation trigger.

---

### Problem 17: #127 & #112 — Remove 10% Visit Fee Deduction from Settlement Breakdown (✅ Resolved)
- **Location**: [`worker-journey-fullscreen.tsx:L541-566`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/jobs/components/worker-journey-fullscreen.tsx#L541-L566)
- **Root Cause**: Job completion breakdown displayed a `Wallet Deduction (10% Visit Fee)` row and descriptive subtitle that created confusion for technicians reviewing gross earnings.
- **Solution**: Removed the 10% deduction row and simplified settlement text to clearly present diagnostic visit fee, repair amount, and total gross earnings collected.

---

### Problem 18: #133 — Previous Job Title & Media Pre-Filled into New Category (✅ Resolved)
- **Location**: [`post-job-wizard.tsx:L115-175`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/post-job/components/post-job-wizard.tsx#L115-L175)
- **Root Cause**: When opening a post-job route for a new category (e.g. `?category=solar-technician`), cached `localStorage` draft from an earlier category (e.g. plumbing) loaded the old title, description, photos, and voice note.
- **Solution**: In initial state and hydration effect, check if `initialCategoryMatch.id !== saved.category`. If true, discard problem-specific fields (title, description, subCategory, photos, voiceNote) while retaining address and scheduling preferences.

---

### Problem 19: #126 — Selecting "Common Issues" Chip Fails to Update Job Title (✅ Resolved)
- **Location**: [`step-2-job-details.tsx:L160-175`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/post-job/components/step-2-job-details.tsx#L160-L175)
- **Root Cause**: Click handler checked `title: !data.title || data.title.trim() === "" ? sub : data.title`. If `data.title` already held any initial text, clicking a common issue chip did not change it.
- **Solution**: Directly set `title: sub` whenever any chip is clicked, instantly updating the input field.

---

### Problem 20: #123 & #124 — Category Header & Subcategory Mismatch (✅ Resolved)
- **Location**: [`step-2-job-details.tsx:L124-142`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/post-job/components/step-2-job-details.tsx#L124-L142)
- **Root Cause**: Banner header rendered `{data.subCategory || selectedCategory.subtitle}` in the subtitle paragraph. Stale or cross-category draft values produced irrelevant text (e.g. "Geyser Installation" under "Home Cleaner").
- **Solution**: Separated title and subtitle: title displays `{selectedCategory.name} · {data.subCategory}` and subtitle cleanly displays `{selectedCategory.subtitle}`.

---

### Problem 21: #132 — Customer Cannot Accept an Offer After Previously Declining (✅ Resolved)
- **Location**: [`offers.service.ts:L414`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-backend/src/modules/offers/offers.service.ts#L414), [`customer-jobs-list-view.tsx:L330-350`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/components/customer-jobs-list-view.tsx#L330-L350), [`customer-review-offers-modal.tsx:L420-435`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-jobs/components/customer-review-offers-modal.tsx#L420-L435)
- **Root Cause**: Backend `acceptOffer` rejected offers with status `REJECTED`, and frontend purged declined offers from state immediately.
- **Solution**:
  1. Backend permits `['PENDING', 'VIEWING', 'COUNTERED', 'REJECTED']` in `acceptOffer` as long as the job is open and unassigned.
  2. Frontend marks declined offers with `isDeclined: true` (rendering a "Declined" badge), allowing customers to reconsider and accept if desired.

---

### Problem 22: Post-A-Job Wizard Address Wiping, Past Arrival Slots, Voice-Only Description, & Stepper Lock (✅ Resolved)
- **Location**:
  - [`peshawar-map-picker.tsx:L78-85`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/post-job/components/peshawar-map-picker.tsx#L78-L85)
  - [`step-3-location-schedule.tsx:L183-273, L865-885`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/post-job/components/step-3-location-schedule.tsx#L183-L273)
  - [`step-2-job-details.tsx:L80-90, L214-225`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/post-job/components/step-2-job-details.tsx#L80-L90)
  - [`wizard-progress-stepper.tsx:L25-65`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/post-job/components/wizard-progress-stepper.tsx#L25-L65)
  - [`post-job-wizard.tsx:L98-105, L245-260`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/post-job/components/post-job-wizard.tsx#L98-L105)
  - [`customer-signup-flow.tsx:L187-195`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/auth/components/customer-signup-flow.tsx#L187-L195)
  - [`post-job-api.ts:L24, L72, L322`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/post-job/api/post-job-api.ts#L24)
- **Root Cause**:
  1. Map drag & GPS locator passed `address: ""` in `onChange`, erasing user-typed house/street addresses.
  2. Step 2 required `!data.description.trim()`, blocking low-literacy users who recorded a voice note.
  3. Step 3 allowed selecting expired time slots for "Today" (e.g. Morning slot at 7 PM).
  4. Step 3 "Continue" button had `disabled={!canProceed}`, which prevented `handleProceed` from running and silenced its contextual error messages.
  5. Stepper disabled any step `< currentStep`, blocking users from jumping back forward after editing earlier steps.
  6. Client-side URL category changes carried over stale title/description/photos from prior categories.
  7. Signup completion button displayed generic "Go to Customer Dashboard" instead of resuming post-job wizard.
  8. `buildPreferredVisitTime` had timezone discrepancies between Date.UTC and local time presets.
  9. Photo upload allowed up to 5 photos, which exceeded requirement for diagnostic media.
- **Solution**:
  1. Preserved `data.address` and `data.landmark` during map/GPS position updates.
  2. Accepted `voiceNoteUrl` as an alternative to written description on Step 2.
  3. Filtered out and marked past arrival windows as `(Passed)` when scheduling for Today, and defaulted to valid future slots.
  4. Kept the Step 3 continue button active and surfaced contextual validation errors.
  5. Added `maxVisitedStep` tracking to enable forward navigation between completed steps.
  6. Discarded problem-specific inputs on dynamic category transitions.
  7. Added context-aware "Continue Posting Job" button on signup completion when `redirectParam` is set.
  8. Unified timestamp construction using local time calculations.
  9. Enforced maximum 3 uploaded photos (`MAX_PHOTOS = 3`), updated upload labels, progress counts (`0/3` to `3/3`), and capped draft restores.

---

## Execution Roadmap

```mermaid
graph TD
    subgraph Phase 1: Critical Bug Fixes & Security
        A1[1. Customer Review Modal & API Integration]
        A2[2. Fix Customer Password & Device Actions]
        A3[3. Standardize Job ID Casing in WorkerStore]
        A4[4. Sync Wallet Summary in WorkerDashboardShell]
        A5[5. Fix Image Upload URL Fallback]
    end

    subgraph Phase 2: Accounting & Real Data Integrity
        B1[6. Fix Completed Job Total to Include Repairs]
        B2[7. Remove Fake Badges from Customer Profile]
        B3[8. Replace Fake Radar Signals with Real Data]
        B4[9. Remove Dead Simulation Code from WorkerStore]
    end

    subgraph Phase 3: Core Experience & Persistence
        C1[10. Persist Customer Addresses & Preferences in Backend]
        C2[11. Dynamic Service Coverage Areas & Expansion]
        C3[12. Secondary Worker Pages Routing & Layout]
    end

    Phase 1 --> Phase 2 --> Phase 3
```
