# Comprehensive Remediation Plan: Customer & Worker Portals
**WorkerFix / Hunar Platform**  
- **Date Created / Last Updated:** October 24, 2026  
- **Remediation Status:** All 22 Audit & QA Issues Resolved (Tickets #121 – #133 Closed)  

This document provides an actionable remediation plan for each identified issue across the **Customer** and **Worker** portals of WorkerFIX / Hunar. Every problem includes the root cause, exact files and line numbers, step-by-step technical solution, and operational/business impact.

---

## Summary Matrix of Issues & Priorities

| # | Category | Issue | Severity | Target Area |
|---|---|---|---|---|
| 1 | Bug / Dead Code | Customer cannot submit reviews (`submitJobReview` dead code) | 🔴 High | Customer Portal / Reviews |
| 2 | Bug / Inaccuracy | Completed jobs ignore repair charges (only shows visit fee) | 🔴 High | Customer Portal / Jobs |
| 3 | Bug / Security | Customer password change & device sign-out are fake (no API) | 🔴 High | Customer Portal / Profile |
| 4 | Bug / State Loss | Customer notification preferences reset on refresh | 🟡 Medium | Customer Portal / Profile |
| 5 | Bug / Data Loss | Customer saved addresses stored only in browser `localStorage` | 🔴 High | Customer Portal / Profile |
| 6 | Bug / Logic | Case-sensitivity mismatch in `workerStore` causes silent update failures | 🔴 High | Worker Store / Realtime |
| 7 | Bug / State | Worker dashboard shows Rs. 0 earnings on cold start | 🟡 Medium | Worker Portal / Dashboard |
| 8 | UX / Layout | Secondary worker pages (`/reviews`, `/settings`) lack layout & sidebar | 🟡 Medium | Worker Portal / Layout |
| 9 | Bug / Media | Job photo upload falls back to local `blob:` URLs (breaks cross-device) | 🔴 High | Customer Portal / Post Job |
| 10 | Fake Element | Deceptive customer trust badges ("NADRA Verified", "98% Trust Score") | 🟡 Medium | Customer Portal / Profile |
| 11 | Fake Element | Fake radar nearby job signals in worker searching screen | 🟡 Medium | Worker Portal / Feed |
| 12 | Fake Element | Dummy helpline numbers and fake resolution stats in Help Center | 🟡 Medium | Customer Portal / Help |
| 13 | Fake / Legacy | Production `workerStore` contains leftover simulation methods | 🟢 Low | Worker Store |
| 14 | Architecture | Worker wallet has no Top-Up or Withdrawal UI (backend endpoints exist) | 🔴 High | Worker Portal / Wallet |
| 15 | UX / Nav | Mobile bottom nav bar missing Post Job (+), Messages, and Profile | 🟡 Medium | Customer Portal / Nav |
| 16 | Flexibility | Hardcoded 10 Peshawar locations restrict worker coverage expansion | 🟡 Medium | Worker Portal / Profile |
| 17 | Dead Code | Payment checkout API (`processJobPayment`) uninvoked | 🟡 Medium | Customer Portal / Checkout |

---

## 1. Critical Functional Bugs & Dead Code

### Problem 1: Customer Cannot Submit Reviews for Completed Jobs
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

### Problem 2: Completed Jobs Ignore Repair Charges (Displays Visit Fee Only)
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

### Problem 3: Customer Password Change & Device Sign-Out Are Non-Functional
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

### Problem 4: Case-Sensitivity Mismatch in `workerStore`
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

### Problem 5: Worker Dashboard Shows Rs. 0 Earnings on Cold Start
- **Location**:
  - [`worker-dashboard-shell.tsx:L381-384`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/worker-dashboard/components/worker-dashboard-shell.tsx#L381-L384)
  - [`stats-overview.tsx:L73`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/worker-dashboard/components/stats-overview.tsx#L73)
- **Root Cause**: `syncBackendProfile` only queries `/users/worker/me` and `listWorkerJobs()`. It does not retrieve financial summaries, retaining `prev.totalEarnings` (which starts at 0).
- **Solution**:
  1. In `syncBackendProfile` in [`worker-dashboard-shell.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/worker-dashboard/components/worker-dashboard-shell.tsx), add `getWalletSummary()` to `Promise.allSettled`.
  2. When fulfilled, update `totalEarnings: walletRes.value.totalEarnings`, `walletBalance: walletRes.value.currentBalance`, and `totalCommissionPaid: walletRes.value.totalDeductions`.
- **Impact**: Workers immediately see their true earnings and balance upon opening their dashboard.

---

### Problem 6: Secondary Worker Pages Lack Shell & Navigation
- **Location**:
  - [`worker/reviews/page.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/app/[locale]/(worker)/worker/reviews/page.tsx)
  - [`worker/settings/page.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/app/[locale]/(worker)/worker/settings/page.tsx)
  - [`worker/layout.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/app/[locale]/(worker)/worker/layout.tsx)
- **Root Cause**: Unlike `(customer)/layout.tsx` which wraps all customer pages, `(worker)/worker/layout.tsx` returns `<>{children}</>`. Pages like `/worker/reviews` and `/worker/settings` don't invoke `<WorkerDashboardShell>`, leaving the user on a bare page with no navigation.
- **Solution**:
  1. Refactor `WorkerDashboardShell` into a layout-level component in [`(worker)/worker/layout.tsx`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/app/[locale]/(worker)/worker/layout.tsx), or wrap `/reviews` and `/settings` inside `<WorkerDashboardShell>`.
  2. Ensure all worker sub-routes retain the desktop sidebar and mobile header.
- **Impact**: Consistent portal UX with no "trapped" screens lacking navigation.

---

### Problem 7: Photo Upload Fallback Uses Browser-Scoped `blob:` URLs
- **Location**:
  - [`post-job-api.ts:L148-154`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/post-job/api/post-job-api.ts#L148-L154)
- **Root Cause**: When `/uploads/job-photo` fails, the code falls back to `URL.createObjectURL(file)`. Because `blob:` URLs only exist in that browser's memory, technicians on other devices receive broken image links.
- **Solution**:
  1. If backend upload fails, fall back to Base64 data URI conversion via `FileReader` (similar to voice note handling in `resolveAudioForSubmission`), or display a clear user error: *"Photo upload failed. Please check your internet connection before posting."*
  2. Disallow raw `blob:` URLs from being sent in the `CreateJobPayload`.
- **Impact**: Eliminates broken images on technician job request cards.

---

## 2. Removing Fake Elements & Mock Data

### Problem 8: Fake Customer Profile Trust Score & Verification Claims
- **Location**:
  - [`customer-profile-view.tsx:L421-450`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/components/customer-profile-view.tsx#L421-L450)
- **Root Cause**: Hardcoded strings declare the user as "NADRA CNIC Verified", "Gold Member", and "98% Trust Score" regardless of user state.
- **Solution**:
  1. Replace static badges with dynamic checks against the user profile (`profile.isPhoneVerified`, `profile.isEmailVerified`).
  2. Display "Verified Phone" and "Member since [Year]" instead of unverified NADRA claims.
  3. Remove the hardcoded 98% trust score pill until an actual behavioral rating algorithm exists.
- **Impact**: Establishes honest product credibility without making false verification claims.

---

### Problem 9: Fake Radar Nearby Job Signals
- **Location**:
  - [`radar-search-view.tsx:L15-20`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/worker-dashboard/components/radar-search-view.tsx#L15-L20)
- **Root Cause**: `NEARBY_SIGNALS` cycles 4 hardcoded CSS coordinates (`top: 28%`, etc.) every 3 seconds to fake nearby activity.
- **Solution**:
  1. Connect the radar view to real count metrics: if `listNearbyJobs()` returns jobs, position markers based on their relative coordinates; otherwise, show a clean, elegant "Scanning for jobs in [City]..." pulse state with zero ghost signals.
  2. Replace static blinking dots with actual pending job indicators or a clean radar sweep without ghost blips.
- **Impact**: Workers are not misled into thinking jobs exist in areas where none have been posted.

---

### Problem 10: Fake Helpline Numbers and Resolution Statistics
- **Location**:
  - [`mock-help-data.ts:L218-230`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-help/data/mock-help-data.ts#L218-L230)
- **Root Cause**: Uses placeholder numbers (`091-5840000`, `+92 300 5559821`) and fake claims ("94% resolved same-day nationwide").
- **Solution**:
  1. Move support contact information to environment variables / platform config (`NEXT_PUBLIC_SUPPORT_PHONE`, `NEXT_PUBLIC_SUPPORT_WHATSAPP`, `NEXT_PUBLIC_SUPPORT_EMAIL`).
  2. Remove unsubstantiated statistical claims from the FAQ/help desk cards; replace with clear hours of operation and dispute SLA guidance.
- **Impact**: Customers reach real support channels when disputes or emergencies arise.

---

### Problem 11: Leftover Simulation Methods in `workerStore`
- **Location**:
  - [`worker-jobs-store.ts:L1147-1206`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/stores/worker-jobs-store.ts#L1147-L1206)
- **Root Cause**: Functions `simulateClosedAssigned`, `simulateCustomerViewing`, and `simulateCustomerCounter` are relics from early frontend prototyping.
- **Solution**:
  1. Remove all `simulate*` methods from `worker-jobs-store.ts`.
  2. Ensure all corresponding actions are driven strictly by incoming Socket.IO events (`job:statusChanged`, `offer:countered`).
- **Impact**: Reduces codebase bloat and prevents accidental triggering of simulated state changes.

---

## 3. Data Persistence & Architecture Enhancements

### Problem 12: Customer Saved Addresses Stored Only in Browser `localStorage`
- **Location**:
  - [`saved-addresses-storage.ts:L5-22`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/services/saved-addresses-storage.ts#L5-L22)
  - [`customer-profile-view.tsx:L103`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/components/customer-profile-view.tsx#L103)
- **Root Cause**: `getSavedAddresses()` and `saveSavedAddresses()` use `localStorage.getItem("hunar_customer_saved_addresses")` without database synchronization.
- **Solution**:
  1. Backend: Add `addresses` JSON column or `CustomerAddress` model to store customer addresses against `userId`. Provide `GET /users/me/addresses` and `POST /users/me/addresses`.
  2. Frontend: Update [`customer-profile-api.ts`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/api/customer-profile-api.ts) to query and persist addresses via the backend API.
  3. Retain `localStorage` only as a fast offline cache.
- **Impact**: Customers keep their saved home and office addresses when switching devices or logging in on mobile.

---

### Problem 13: Customer Notification Preferences Do Not Persist
- **Location**:
  - [`customer-profile-view.tsx:L253-258`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-profile/components/customer-profile-view.tsx#L253-L258)
- **Root Cause**: `handleUpdatePreferences()` updates only local component state without calling any API or saving to local storage.
- **Solution**:
  1. Wire preference changes to `http.put("/users/me/notification-preferences", updated)`.
  2. Backend updates preferences on the `User` record or user settings table.
- **Impact**: User notification preferences remain consistent across sessions.

---

### Problem 14: Worker Wallet Missing Top-Up & Withdrawal Actions
- **Location**:
  - [`worker/wallet/page.tsx:L81-124`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/app/[locale]/(worker)/worker/wallet/page.tsx#L81-L124)
- **Root Cause**: The backend already provides `POST /wallet/topup` and `POST /wallet/withdraw`, but the frontend wallet view is read-only.
- **Solution**:
  1. Add a **"Top Up Wallet"** button with a modal supporting JazzCash, EasyPaisa, or bank deposit proof submission (invoking `POST /wallet/topup`).
  2. Add a **"Withdraw Earnings"** button with a form for amount, bank name, and account/IBAN number (invoking `POST /wallet/withdraw`).
- **Impact**: Enables workers to pay required platform commission holds to unlock jobs and withdraw their earned revenue.

---

### Problem 15: Mobile Bottom Navigation Bar Missing Core Actions
- **Location**:
  - [`customer-bottom-nav.tsx:L24-37`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/features/customer-dashboard/components/customer-bottom-nav.tsx#L24-L37)
- **Root Cause**: The mobile navigation bar only contains **Home** and **Jobs**, omitting Post Job, Messages, and Profile.
- **Solution**:
  1. Update `CustomerBottomNav` items to:
     - **Home** (`/customer/dashboard`)
     - **Bookings** (`/customer/jobs`)
     - **+ Post Job** (Center highlighted action linking to `/customer/post-job`)
     - **Messages** (`/customer/chat`)
     - **Profile** (`/customer/profile`)
  2. Add dynamic unread count badge for Messages.
- **Impact**: Matches standard mobile marketplace patterns (e.g., Careem, Uber, Indrive), reducing friction for primary actions.

---

### Problem 16: Hardcoded 10 Peshawar Locations Limits Expansion
- **Location**:
  - [`worker/profile/page.tsx:L59-70`](file:///e:/Web%20DEV/HUNAR/Hunar/hunar-frontend/src/app/[locale]/(worker)/worker/profile/page.tsx#L59-L70)
- **Root Cause**: `PESHAWAR_LOCATIONS` is a static list of 10 areas hardcoded in the frontend.
- **Solution**:
  1. Fetch selectable areas from the backend (`GET /categories/service-areas` or Mapbox geocoding lookup).
  2. Allow workers to type and add custom coverage locations or search by neighborhood/sector.
- **Impact**: Prepares the platform for expansion to other cities (Islamabad, Rawalpindi, Lahore) and surrounding districts without frontend code changes.

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
        C1[10. Persist Customer Addresses in Backend]
        C2[11. Add Top-Up & Withdraw Modals in Worker Wallet]
        C3[12. Complete Mobile Bottom Nav Bar]
        C4[13. Wrap Secondary Worker Pages in Dashboard Shell]
    end

    Phase 1 --> Phase 2 --> Phase 3
```
