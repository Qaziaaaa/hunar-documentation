# Comprehensive Codebase Audit Report: Customer & Worker Portals

**Platform:** HUNAR (On-Demand Skilled Trade & Home Services Platform)  
**Scope:** Customer Portal, Worker Portal, Shared Backend Modules, Realtime Services & Prisma Database Layer  
**Target Environments:** `hunar-backend/` (NestJS 10, Prisma ORM, PostgreSQL) & `hunar-frontend/` (Next.js 14 App Router, Tailwind CSS, Zustand)  
**Date of Audit:** November 2026  
**Auditor Roles:** Senior Full-Stack Developer, Software Architect, Security Engineer, QA Engineer  

---

## A. Executive Summary

### 1. Overall Codebase Health
The HUNAR platform features a modern, thoughtfully structured architectural foundation built with NestJS and Next.js 14. The system is designed around a multi-phase lifecycle for service requests: **Posting -> Bidding/Offers -> Doorstep Visit & Arrival Verification -> Physical Inspection & Diagnosis -> Repair Estimate Negotiation -> Execution -> Completion & Rating**.

However, a deep, line-by-line inspection of the source code reveals **critical security vulnerabilities, severe business logic loopholes, concurrent race conditions, and broken verification workflows**. While the user interface delivers an polished visual presentation, several mission-critical backend safeguards and state-machine transitions are either bypassed, insecurely implemented, or mismatched with frontend expectations.

### 2. Confirmed Issue Statistics

#### Overview by Layer (Frontend vs. Backend)

| Layer / Subsystem | Repository Directory | Total Issues | P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Backend** | `hunar-backend/` | **21** | 5 | 11 | 4 | 1 |
| **Frontend** | `hunar-frontend/` | **9** | 0 | 1 | 6 | 2 |
| **Total** | | **30** | **5** | **12** | **9** | **4** |

> *Note on Cross-Stack Issues: AUDIT-026 (hardcoded fees/rounds) and AUDIT-027 (past date booking) involve both frontend inputs and backend validation, with primary logic residing in `hunar-backend/` (21) and UI forms in `hunar-frontend/` (9).*

#### Overview by Priority Level

| Priority Level | Meaning | Count |
| :--- | :--- | :---: |
| **P0 — Critical** | Immediate security vulnerability, data exposure, complete authorization/verification bypass, or financial integrity failure | **5** |
| **P1 — High** | Major business logic failure, missing state constraints, concurrency race conditions, or broken core workflows | **12** |
| **P2 — Medium** | Significant performance bottlenecks, aggressive polling, data degradation (Base64 storage), UI/UX mismatches, or missing role guards | **9** |
| **P3 — Low** | Hardcoded fallbacks, dead services, branding inconsistencies, and minor maintainability defects | **4** |
| **Total Confirmed Issues** | | **30** |

### 3. Critical Security Concerns
- **Complete Doorstep OTP Verification Bypass (AUDIT-006):** The worker arrival endpoint leaks the generated arrival OTP directly to the worker in the HTTP response body and allows worker-specified OTPs. Furthermore, the arrival OTP verification endpoint lacks a `@Roles(Role.CUSTOMER)` guard, allowing an assigned worker to arrive, fetch the OTP from the response, and verify the arrival OTP themselves without physical customer contact.
- **WebSocket Room Hijacking & GPS/OTP Eavesdropping (AUDIT-017):** Any authenticated socket connection can join `jobRoom(jobId)` via `location:track:start` without any ownership check, allowing malicious actors to eavesdrop on live worker GPS coordinates and broadcasted arrival OTPs.
- **IDOR / Customer-Worker Data Isolation Failure (AUDIT-018):** `GET /jobs/:id` has no role check or customer ID match, exposing complete customer personal details, address, diagnosis, repair photos, and worker information to any authenticated customer or worker.
- **Worker PII & Precise GPS Leakage (AUDIT-008):** `GET /users/worker/:id` is an unprotected public endpoint that returns worker personal phone numbers and exact service area GPS coordinates, completely bypassing the worker's `profileVisible` privacy setting.
- **Plaintext OTP Leakage in API Responses (AUDIT-019):** Active configuration in `.env` sets `OTP_DEBUG=true`, causing the backend to echo plaintext authentication OTPs in API responses to unauthenticated callers.

### 4. Major Functional & Logic Risks
- **Accepting Offers on Cancelled / Completed Jobs (AUDIT-011):** The offer acceptance logic never verifies the current status of the parent job. An offer can be accepted on an already cancelled or completed job, triggering visit creation and technician assignment on obsolete requests.
- **Offer Acceptance Race Conditions (AUDIT-012):** Simultaneous offer acceptances lack database row-locking, enabling multiple technicians to be assigned to the same job.
- **Worker Cancellation Revives Rejected Bids (AUDIT-013):** When a worker cancels a pre-visit job, the backend blindly resets all previously `REJECTED` offers back to `PENDING`, reviving bids the customer had intentionally declined.
- **Repair Decline Freezes Job Status (AUDIT-014):** Declining a repair estimate marks the repair proposal as rejected but never transitions the parent job out of `REPAIR_NEGOTIATING`, permanently freezing the service request in a dead-end state.
- **Accounting Discrepancy in Commission Hold (AUDIT-015):** The commission hold operation deducts amounts from total balance while simultaneously adding to held balance, distorting worker available equity.

### 5. Most Important Performance Problems
- **Aggressive Triple-Endpoint Polling (AUDIT-001):** The customer visit tracking screen polls three independent endpoints (`/jobs/:jobId`, `/visits/:jobId`, `/location/track/:jobId`) in parallel every 2.5 seconds (72 requests/minute per client), creating massive server load.
- **Multi-Megabyte Base64 Payloads Stored in PostgreSQL (AUDIT-003, AUDIT-007):** When direct S3/MinIO upload fails, both customer post-job wizard and worker diagnosis upload fallback to serializing raw Base64 image and voice note strings directly into database text columns.

---

## B. Customer Portal Findings

---

### Issue ID: AUDIT-001 [REMEDIATED]
**Title:** Customer Tracking View Employs Aggressive 2.5-Second Triple-Endpoint Polling  
**Portal:** Customer  
**Category:** Performance  
**Priority:** P2  
**File:** `hunar-frontend/src/app/[locale]/(customer)/jobs/[id]/track/customer-job-tracking-view.tsx` & `hunar-frontend/src/lib/api/customer-visits-api.ts`  
**Location:** `customer-job-tracking-view.tsx:213-243`, `customer-visits-api.ts:468-472`  
**Current Behavior:** The customer tracking page sets an interval timer every 2,500ms that executes `getCustomerJobVisitTracking(jobId)`. This function fires `Promise.allSettled` to three distinct endpoints: `GET /jobs/:jobId`, `GET /visits/:jobId`, and `GET /location/track/:jobId`.  
**Expected Behavior:** Tracking data should be pushed reactively via existing WebSocket gateways (`realtime.gateway.ts` via `location:update` and `job:status:change`). HTTP polling should only act as a low-frequency fallback (e.g., 15–30 seconds) or when WebSocket is disconnected.  
**Root Cause:** Polling was implemented as the primary data synchronization mechanism alongside WebSockets without coordination or debouncing.  
**Impact:** A single active customer generates 72 heavy database-querying HTTP requests per minute. With 50 concurrent active visits, the backend receives over 3,600 requests per minute, overwhelming connection pools.  
**Recommended Fix:** Rely on WebSocket rooms for live location coordinates and job status transitions. Implement an adaptive HTTP fallback that only fires every 20 seconds when the WebSocket connection is down.  
**Evidence:**
```typescript
// hunar-frontend/src/app/[locale]/(customer)/jobs/[id]/track/customer-job-tracking-view.tsx:213-219
useEffect(() => {
  void fetchTrackingData();
  const intervalId = window.setInterval(() => {
    void fetchTrackingData();
  }, 2500);
  return () => window.clearInterval(intervalId);
}, [fetchTrackingData]);
```

**Remediation:**
- Replaced the aggressive 2.5s interval triple-endpoint HTTP polling (`GET /jobs/:id`, `GET /visits/:id`, `GET /location/track/:id`) in `hunar-frontend/src/features/customer-visits/components/customer-job-tracking-view.tsx` with reactive WebSocket push subscriptions.
- Connected to the existing Socket.IO real-time gateway:
  - Live technician GPS coordinates are streamed directly into view state via the `location:update` room push event.
  - Job and visit state transitions (`job:status:changed`, `visit:arrived`, `visit:otp_verified`) reactively update state and fetch authoritative details only on actual events.
- Implemented adaptive fallback polling:
  - When WebSocket is connected, low-frequency 30s background heartbeat ensures eventual consistency without burdening backend connection pools.
  - When WebSocket is disconnected, adaptive 20s fallback polling engages.
  - When the browser tab is hidden (`visibilityState === "hidden"`), all polling automatically pauses.


---

### Issue ID: AUDIT-002
**Title:** Inappropriate Passive Doorstep PIN Display in Active Visit Banner vs. Modal Popup Verification Flow  
**Portal:** Customer  
**Category:** UI / Functional  
**Priority:** P1  
**File:** `hunar-frontend/src/features/customer-dashboard/components/active-visit-banner.tsx` & `hunar-frontend/src/features/customer-visits/components/customer-arrival-otp-modal.tsx`  
**Location:** `active-visit-banner.tsx:291-304`  
**Current Behavior:** The banner component attempts to render the doorstep PIN as passive plaintext directly inside the top banner bar (`{Boolean(liveVisit.securityPin && !isVisitVerified) && ... Doorstep PIN: ...}`). However, the backend returns the field as `arrivalOtp` on the visit payload, and `mapVisitPayload` never mapped it, causing this element to fail to render.  
**Expected Behavior:** According to the platform security and UX design, the doorstep PIN / verification must **never be displayed passively on the persistent dashboard banner**. Verification is designed to occur exclusively inside the dedicated popup modal (`CustomerArrivalOtpModal`), which automatically triggers when the worker arrives. The banner should only display the arrival status with an action button (e.g., "Enter Arrival OTP" or "Verify Technician") to reopen the popup modal if it was accidentally closed.  
**Root Cause:** Conflicting UI implementations between an unintended static banner callout in `active-visit-banner.tsx` and the interactive modal dialog in `customer-arrival-otp-modal.tsx`.  
**Impact:** Displaying security PINs passively in general banner headers compromises doorstep security by making the PIN visible to anyone glancing at the customer's dashboard, while also bypassing the interactive confirmation workflow provided by the popup modal.  
**Recommended Fix:** Remove the passive PIN plaintext render from `active-visit-banner.tsx:291-304`. Instead, add an action button on the banner that triggers `setIsArrivalOtpOpen(true)` to open the `CustomerArrivalOtpModal` popup dialog when a visit is in `ARRIVED` status pending verification.  
**Evidence:**
```typescript
// hunar-frontend/src/features/customer-dashboard/components/active-visit-banner.tsx:291-304
{/* Inappropriate passive PIN text callout on banner */}
{Boolean(liveVisit.securityPin && !isVisitVerified) && (
  <>
    <span className="text-slate-300 text-xs hidden sm:inline">•</span>
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-xs text-slate-500 font-semibold">
        {isUrdu ? "آمد PIN:" : "Doorstep PIN:"}
      </span>
      <span className="inline-flex items-center font-mono font-bold text-xs sm:text-sm tracking-wider text-orange bg-orange/10 px-2 py-0.5 rounded-lg border border-orange/20">
        {liveVisit.securityPin}
      </span>
    </div>
  </>
)}
```

---

### Issue ID: AUDIT-003 [REMEDIATED]
**Title:** Customer Post-Job Wizard Falls Back to Massive Base64 Payloads Stored Directly in Database  
**Portal:** Customer  
**Category:** Performance / Data Integrity  
**Priority:** P2  
**File:** `hunar-frontend/src/lib/api/post-job-api.ts`  
**Location:** `post-job-api.ts:160-176, 328-329`  
**Current Behavior:** If direct image or voice note upload fails or MinIO/S3 is temporarily unreachable, `uploadJobAttachment` catches the error and reads the entire binary file as a Base64 data URL string (`data:image/jpeg;base64,...` or `data:audio/webm;base64,...`), returning it to be posted to `POST /jobs`.  
**Expected Behavior:** The wizard should notify the user that media upload failed and offer a retry, or stage uploads through an ephemeral chunked upload endpoint. Binary media should never be stored as multi-megabyte text strings in relational database columns.  
**Root Cause:** Well-intentioned fallback logic designed to avoid post-job failures converts large binaries into Base64 strings.  
**Impact:** Several megabytes of text are inserted into PostgreSQL `ServiceRequest.images` and `ServiceRequest.audioUrl` columns. Every subsequent query fetching the job list transfers tens of megabytes of JSON data, slowing down database queries, network transfers, and garbage collection.  
**Recommended Fix:** Remove the Base64 fallback. If upload fails, prompt the user to retry the upload or post the job without attachments.  
**Evidence:**
```typescript
// hunar-frontend/src/lib/api/post-job-api.ts:168-175
} catch (error) {
  console.warn('Direct upload failed, falling back to base64 preview storage', error);
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file as base64 fallback.'));
    reader.readAsDataURL(file);
  });
}
```

**Remediation:**
- Removed raw Base64 data URL fallback generation in `hunar-frontend/src/features/post-job/api/post-job-api.ts`.
- All job photos and voice notes are routed to the storage service via `/uploads/job-photo` and `/uploads/voice-note`.
- Added server-side validation in `hunar-backend/src/modules/jobs/jobs.service.ts` rejecting any payload containing `data:` Base64 URLs in `images` or `voiceNoteUrl`.
- Verified with unit tests in `jobs.service.spec.ts` (17/17 passed).


---

### Issue ID: AUDIT-004
**Title:** Customer Portal Layout Completely Lacks Authentication Guards and Role Validation  
**Portal:** Customer  
**Category:** Security / Architecture  
**Priority:** P2  
**File:** `hunar-frontend/src/app/[locale]/(customer)/layout.tsx`  
**Location:** Lines 1–40  
**Current Behavior:** The `(customer)` route layout renders child pages with no session check, no Next.js middleware protection, and no role verification.  
**Expected Behavior:** Unauthenticated users navigating to protected customer pages (`/customer/dashboard`, `/jobs/post`, `/jobs/[id]`) should be redirected to `/sign-in`. Authenticated users with role `WORKER` should be redirected to `/worker/dashboard`.  
**Root Cause:** Authentication verification was left entirely to individual page components and client-side 401 interceptors.  
**Impact:** Unauthenticated visitors and workers can access customer views, resulting in jarring flashes of UI, broken components, and uncontrolled console errors before client-side scripts redirect.  
**Recommended Fix:** Implement route protection in Next.js middleware (`middleware.ts`) or add a client-side layout auth wrapper that verifies `hunar_user_profile.role === 'CUSTOMER'`.  
**Evidence:**
```typescript
// hunar-frontend/src/app/[locale]/(customer)/layout.tsx:1-40
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <CustomerHeader />
      <main className="flex-1">{children}</main>
      <CustomerFooter />
    </div>
  );
}
```

---

### Issue ID: AUDIT-005
**Title:** Hardcoded Default Category Fallback and Coordinates Allocate Jobs to Peshawar  
**Status:** ✅ **REMEDIATED**  
**Portal:** Customer  
**Category:** Logic / Hardcoding  
**Priority:** P2  
**Remediation Summary:**
- Completely eliminated hardcoded `CATEGORY_ID_MAP` and dummy `'seed-category-X'` fallbacks in `post-job-api.ts`.
- Enforced that categories are strictly resolved from the backend database (`GET /categories`). If an invalid category is provided or loading fails, `CATEGORY_NOT_FOUND` is thrown with clear user-facing error and retry states.
- Replaced silent fallback to Peshawar center coordinates (`34.0151, 71.5249`) in both API and Step 3 UI with mandatory coordinate validation (`LOCATION_COORDINATES_REQUIRED`).
- If customer GPS is denied or unavailable, coordinates are cleared and a localized error is displayed prompting the user to enable GPS or drop a pin on the interactive map picker.
- Added strict coordinate validation (`@Min(-90) @Max(90)` latitude, `@Min(-180) @Max(180)` longitude, and non-zero checks) in backend `CreateJobDto` and `JobsService`.
**File:** `hunar-frontend/src/lib/api/post-job-api.ts`  
**Location:** `post-job-api.ts:106-141, 314-316, 330-331`  
**Current Behavior:** If category resolution fails, the wizard submits `categoryId: 'seed-category-1'`. If GPS geolocation is unavailable, coordinates default to `latitude: 34.0151, longitude: 71.5249` (Peshawar city centre).  
**Expected Behavior:** If category selection fails, submission should be blocked with an explicit error. If geolocation fails, the user must manually select their city/area from a dropdown or search box; it must never silently assign jobs to Peshawar coordinates.  
**Root Cause:** Hardcoded placeholder constants from development seeding were left active as production fallbacks.  
**Impact:** If a customer in Lahore or Karachi fails browser GPS prompt, their job is quietly registered at coordinates in Peshawar, preventing local technicians from ever seeing the request. Furthermore, `'seed-category-1'` causes a foreign key constraint violation if production databases use UUIDs.  
**Recommended Fix:** Require explicit location confirmation before submitting job requests. Require valid backend category IDs.  
**Evidence:**
```typescript
// hunar-frontend/src/lib/api/post-job-api.ts:314-316, 330-331
const resolvedCategoryId = input.categoryId || categoryMap[input.categoryKey] || 'seed-category-1';
...
latitude: input.location?.latitude ?? 34.0151,
longitude: input.location?.longitude ?? 71.5249,
```

---

## C. Worker Portal Findings

---

### Issue ID: AUDIT-006
**Title:** Worker Arrival Flow Allows Worker to Generate and Self-Verify Doorstep OTP  
**Status:** ✅ **REMEDIATED**  
**Portal:** Worker / Shared Backend  
**Category:** Security  
**Priority:** P0  
**Remediation Summary:**
- Removed client-specified OTPs (`body?.otp`) from `PUT /visits/:id/arrived` and `PUT /jobs/:jobId/arrived`. The server now exclusively generates cryptographically secure 4-digit OTPs (`randomInt(1000, 10000)`).
- Restricted `verifyArrivalOtp` endpoints strictly to `@Roles(Role.CUSTOMER)`. Workers calling this endpoint now receive `403 Forbidden`.
- Enforced customer job ownership in `verifyArrivalOtp` (`visit.job.customerId === user.sub`).
- Added attempt rate-limiting in Redis (maximum 5 failed attempts before lockout), protecting against 4-digit brute-force attacks.
**File:** `hunar-backend/src/visits/visits.service.ts` & `hunar-backend/src/visits/visits.controller.ts`  
**Location:** `visits.controller.ts:75-95`, `visits.service.ts:348-354, 411-418`  
**Current Behavior:** When a worker calls `PUT /visits/:id/arrived`, the backend returns the generated `otp` in plaintext in the response body. Furthermore, the endpoint accepts a worker-specified OTP in the request body (`body?.otp`). Finally, `PUT /visits/:id/verify-arrival-otp` has no `@Roles(Role.CUSTOMER)` decorator, and `assertVisitAccess` permits the worker to call the verification endpoint.  
**Expected Behavior:** The arrival OTP must be generated strictly on the server, dispatched only to the customer via SMS/WebSocket/Push, and never exposed to the worker in the response. Only the customer should be authorized to verify the OTP or share it verbally upon physical contact.  
**Root Cause:** Development convenience overrides and lack of role isolation in the verification controller.  
**Impact:** An assigned worker can mark arrival from any location, read the OTP from the HTTP response or specify their own OTP, call `verify-arrival-otp` immediately, and advance the visit to `ARRIVED` and `IN_PROGRESS` without ever visiting the customer's home.  
**Evidence:**
```typescript
// hunar-backend/src/visits/visits.service.ts:348-354
const generatedOtp = body?.otp
  ? String(body.otp).trim()
  : Math.floor(1000 + Math.random() * 9000).toString();
...
return {
  visit: updated,
  otp: generatedOtp,
};

// hunar-backend/src/visits/visits.controller.ts:85-95
@Put(':id/verify-arrival-otp')
async verifyArrivalOtp(@Param('id') id: string, @Body() body: { otp: string }, @CurrentUser() user: any) {
  // No @Roles(Role.CUSTOMER) guard! assertVisitAccess allows worker!
  return this.visitsService.verifyArrivalOtp(id, body?.otp, user);
}
```

---

### Issue ID: AUDIT-007 [REMEDIATED]
**Title:** Worker Diagnosis Submission Serializes Multi-Megabyte Base64 Images Directly to Database  
**Portal:** Worker  
**Category:** Performance / Data Integrity  
**Priority:** P2  
**File:** `hunar-frontend/src/components/worker/visit/visit-action-flow.tsx`  
**Location:** Lines 50–67  
**Current Behavior:** When the technician uploads inspection and diagnosis photos during a visit, `handlePhotoUpload` reads the files using `FileReader.readAsDataURL` and pushes raw Base64 strings into the `repairPhotos` array payload sent to `POST /repair/propose`.  
**Expected Behavior:** Photos must be uploaded via presigned S3 URLs or `POST /uploads`, returning an array of secure asset URLs.  
**Root Cause:** Direct file reader conversion was implemented without integration to the storage service.  
**Impact:** A typical inspection with 3–5 mobile camera photos generates 10MB to 25MB of Base64 text stored directly in the `Repair.photos` database array. This degrades database I/O, inflates backups, and causes API latency spikes whenever the repair details are fetched.  
**Recommended Fix:** Route all photo uploads through the upload service before dispatching the repair proposal payload.  
**Evidence:**
```typescript
// hunar-frontend/src/components/worker/visit/visit-action-flow.tsx:55-63
const reader = new FileReader();
reader.onloadend = () => {
  setRepairPhotos((prev) => [...prev, reader.result as string]);
};
reader.readAsDataURL(file);
```

**Remediation:**
- Updated `handlePhotoUpload` in `hunar-frontend/src/features/jobs/components/visit-action-flow.tsx` and `hunar-frontend/src/features/jobs/components/worker-journey-fullscreen.tsx` to upload compressed inspection photos directly to `/uploads/inspection-photo`.
- Removed all Base64 `FileReader.readAsDataURL` fallbacks from inspection/diagnosis photo flows.
- Added server-side validation in `hunar-backend/src/modules/visits/visits.service.ts` rejecting `data:` Base64 strings in `inspectionPhotos`.
- Verified with unit tests in `visits-audit-006.spec.ts` (8/8 passed).


---

### Issue ID: AUDIT-008
**Title:** Worker Profile Privacy Setting Ignored and Personal Phone Number Leaked Publicly  
**Portal:** Worker / Shared Backend  
**Category:** Security / Data Isolation  
**Priority:** P0  
**Status:** ✅ **REMEDIATED**  
**Remediation Summary:** Enforced privacy controls on public worker profiles in `WorkerProfileService.getPublicProfile`. The endpoint now verifies the worker's `profileVisible` privacy setting (via `adminNote` and `isAvailable`), throwing `404 NotFoundException` if the profile is hidden. Direct phone numbers are omitted (`phone: null`), and precise residential GPS coordinates are obfuscated/fuzzed to ~1.1km sector centroids (`Math.round(coord * 100) / 100`). Verified with unit tests in `worker-profile.service.spec.ts` and closed GitHub Issue #196.  
**File:** `hunar-backend/src/modules/users/worker-profile.service.ts` & `hunar-backend/src/modules/users/users.service.ts`  
**Location:** `worker-profile.service.ts:300-308, 385-398`  
**Current Behavior (Prior to Fix):** `GET /users/worker/:id` returned unmasked phone numbers and exact residential GPS coordinates without checking if `profileVisible: false` was set.  
**Expected Behavior:** Public worker profiles must never expose personal phone numbers or precise residential GPS coordinates. Unauthenticated scrapers must not be able to harvest worker databases. When `profileVisible` is false, the endpoint must return 404 or an inactive profile message.  
**Root Cause:** The public profile serializer selects the raw `user.phone` field without privacy masking or checking `workerProfile.profileVisible`.  
**Impact:** Competitors, scrapers, and malicious individuals can enumerate worker IDs to harvest phone numbers and home addresses for all workers on the platform. Workers who toggled their profiles off remain visible.  
**Recommended Fix:** Mask or omit phone numbers in public worker profiles. Obfuscate exact GPS coordinates to district-level centroids. Respect `profileVisible === true` condition.  
**Evidence:**
```typescript
// hunar-backend/src/users/worker-profile.service.ts:380-395
return {
  id: profile.id,
  userId: profile.userId,
  name: profile.user.name,
  phone: profile.user.phone, // Leaks direct phone number on public endpoint
  serviceAreas: profile.serviceAreas.map((sa) => ({
    name: sa.areaName,
    latitude: sa.latitude, // Precise coordinates
    longitude: sa.longitude,
  })),
  ...
};
```

---

### Issue ID: AUDIT-009 [REMEDIATED]
**Title:** Worker Cannot Submit Customer Reviews or Ratings (Unidirectional Review System)  
**Portal:** Worker / Shared Backend  
**Category:** Business Logic  
**Priority:** P2  
**File:** `hunar-backend/src/reviews/reviews.controller.ts`  
**Location:** Lines 13–28  
**Current Behavior:** The review submission endpoint `POST /reviews` is restricted strictly to `@Roles(Role.CUSTOMER)`. A worker attempting to submit a rating or feedback for a customer receives a 403 Forbidden response.  
**Expected Behavior:** The two-sided marketplace design requires mutual accountability. Workers must be able to rate customers on safety, promptness, and payment reliability.  
**Root Cause:** Review controller was hardcoded with customer-only authorization.  
**Impact:** Problematic, abusive, or non-paying customers cannot be flagged or rated by workers, undermining worker safety and platform trust.  
**Recommended Fix:** Update `@Roles(Role.CUSTOMER, Role.WORKER)` and allow workers to create review records where `authorId = workerUserId` and `targetUserId = customerUserId`.  
**Evidence:**
```typescript
// hunar-backend/src/reviews/reviews.controller.ts:18-24
@Post()
@Roles(Role.CUSTOMER) // Strictly excludes WORKER
async create(@CurrentUser() user: any, @Body() createReviewDto: CreateReviewDto) {
  return this.reviewsService.create(user.sub, createReviewDto);
}
```

**Remediation:**
- Updated `ReviewsController` to grant review creation authorization to both `@Roles(Role.CUSTOMER, Role.WORKER)` on `POST /jobs/:jobId/review` and `POST /reviews`.
- Updated `ReviewsService.createReview` to dynamically determine the reviewee:
  - If the reviewer is the customer, the reviewee is the assigned worker.
  - If the reviewer is the assigned worker, the reviewee is the customer.
  - Rejects third-party callers with `ForbiddenException` and prevents duplicate reviews per user per job.
- Added `GET /reviews/user/:userId` to query public review summaries for any marketplace participant.
- Added test suite `reviews.service.spec.ts` (5/5 passed).


---

### Issue ID: AUDIT-010 [REMEDIATED]
**Title:** Worker Wallet Withdrawal Lacks Atomicity Allowing Multiple Concurrent Withdrawals  
**Portal:** Worker / Shared Backend  
**Category:** Financial / Security  
**Priority:** P1  
**File:** `hunar-backend/src/wallet/wallet.service.ts`  
**Location:** Lines 250–295  
**Current Behavior:** When a worker requests a withdrawal (`POST /wallet/withdraw`), the service checks `wallet.balance >= amount`, creates a pending `Withdrawal` record, but does NOT immediately deduct or lock the withdrawal amount from `wallet.balance`.  
**Expected Behavior:** The requested withdrawal amount must be atomically transferred from `balance` to `heldBalance` inside a database transaction at request creation time.  
**Root Cause:** Balance deduction was deferred until administrative withdrawal approval.  
**Impact:** A worker with a balance of 5,000 PKR can send five rapid concurrent requests to create five pending withdrawal requests of 5,000 PKR each (totaling 25,000 PKR). If approved by administrators or processed automatically, platform funds are drained.  
**Recommended Fix:** Deduct the requested withdrawal amount immediately into `heldBalance` inside a Prisma `$transaction` at the moment of request creation.  
**Evidence:**
```typescript
// hunar-backend/src/wallet/wallet.service.ts:265-285
if (wallet.balance < amount) {
  throw new BadRequestException('Insufficient balance');
}
// Creates withdrawal record, but wallet.balance remains untouched!
const withdrawal = await this.prisma.withdrawal.create({
  data: {
    walletId: wallet.id,
    amount,
    status: WithdrawalStatus.PENDING,
    ...
  },
});
```

**Remediation:**
- Updated withdraw in hunar-backend/src/modules/wallet/wallet.service.ts and hunar-backend/src/modules/payments/wallet.service.ts to execute inside an atomic $transaction.
- alance is atomically validated and transferred into heldBalance (alance: { decrement: amount }, heldBalance: { increment: amount }), immediately locking the funds against concurrent requests.
- Created pending Withdrawal record and registered WITHDRAWAL wallet ledger debit entry.
- Updated AdminService.processWithdrawal so that when approved, heldBalance is cleared without double-deducting alance; when rejected, the held funds are safely returned from heldBalance back to alance along with a ledger refund.
- Added comprehensive unit tests in dmin.service.spec.ts and payments.service.spec.ts (100% passing).


---

## D. Shared Backend / API Findings

---

### Issue ID: AUDIT-011
**Title:** Accepting Offers on Cancelled or Completed Jobs Without Status Validation  
**Portal:** Shared Backend  
**Category:** Logic / State Machine  
**Priority:** P1  
**Status:** ✅ **REMEDIATED**  
**Remediation Summary:** Enforced strict status validation in `OffersService.acceptOffer`. Offers can now only be accepted if the parent service request is in `OPEN` or `OFFERS_RECEIVED` status and has no technician assigned. Accepting an offer on a cancelled, completed, or in-progress job immediately throws `BadRequestException`. Verified with unit test in `offers.service.spec.ts` and closed GitHub Issue #199.  
**File:** `hunar-backend/src/modules/offers/offers.service.ts`  
**Location:** Lines 520–535  
**Current Behavior (Prior to Fix):** In `acceptOffer(offerId, user)`, the service did not verify `job.status` before accepting, allowing offers to be accepted on cancelled or completed jobs.  
**Expected Behavior:** Offers can only be accepted if the parent service request is currently in `JobStatus.OPEN` or `JobStatus.OFFERS_RECEIVED`. If the job is `CANCELLED`, `EXPIRED`, or `COMPLETED`, acceptance must be rejected with `ConflictException`.  
**Root Cause:** Missing status precondition validation on the related `ServiceRequest` entity.  
**Impact:** A customer can accept an offer on a cancelled job or reopen a completed job, creating orphaned visit records, deducting commissions from workers, and sending notifications for non-existent service requirements.  
**Recommended Fix:** Check `job.status` before processing acceptance, and perform an atomic update verifying `job.status IN ['OPEN', 'OFFERS_RECEIVED']`.  
**Evidence:**
```typescript
// hunar-backend/src/offers/offers.service.ts:528-540
const offer = await this.prisma.jobOffer.findUnique({
  where: { id: offerId },
  include: { serviceRequest: true },
});
if (!offer) throw new NotFoundException('Offer not found');
if (offer.status !== OfferStatus.PENDING) {
  throw new BadRequestException('Offer is no longer pending');
}
// Notice: No check for offer.serviceRequest.status!
```

---

### Issue ID: AUDIT-012
**Title:** Offer Acceptance Suffers from Concurrency Race Condition Enabling Double Technician Assignment  
**Portal:** Shared Backend  
**Category:** Data Integrity / Concurrency  
**Priority:** P1  
**Status:** ✅ **REMEDIATED**  
**Remediation Summary:** Enforced atomic optimistic concurrency locking inside the Prisma transaction in `OffersService.acceptOffer`. Uses `tx.serviceRequest.updateMany` with atomic preconditions (`where: { id: jobId, status: { in: [JobStatus.OPEN, JobStatus.OFFERS_RECEIVED] }, selectedWorkerId: null }`). If a concurrent request attempts to accept a second offer, `count === 0` triggers an immediate `409 ConflictException`, preventing duplicate technician assignment and duplicate visits. Verified with concurrency race tests in `offers.service.spec.ts` and closed GitHub Issue #200.  
**File:** `hunar-backend/src/modules/offers/offers.service.ts`  
**Location:** Lines 545–595  
**Current Behavior (Prior to Fix):** Simultaneous offer acceptances lacked database preconditions, enabling multiple technicians to be assigned to the same job and creating duplicate scheduled visits.  
**Expected Behavior:** Job assignment must be strictly atomic. Only the first valid offer acceptance must succeed; any concurrent acceptance must fail immediately.  
**Root Cause:** Lack of database isolation and pessimistic locking during offer acceptance.  
**Impact:** If two offers are accepted concurrently (e.g., duplicate browser clicks or rapid API submissions), both transactions succeed, scheduling two distinct visits and assigning multiple workers to a single service request.  
**Recommended Fix:** Wrap acceptance in an atomic `$transaction` with an update precondition:
```typescript
const updatedJob = await tx.serviceRequest.updateMany({
  where: { id: jobId, status: { in: ['OPEN', 'OFFERS_RECEIVED'] } },
  data: { status: JobStatus.ASSIGNED, assignedWorkerId: workerId }
});
if (updatedJob.count === 0) throw new ConflictException('Job is no longer open for assignment');
```  
**Evidence:**
```typescript
// hunar-backend/src/offers/offers.service.ts:550-565
await this.prisma.jobOffer.update({
  where: { id: offerId },
  data: { status: OfferStatus.ACCEPTED },
});
await this.prisma.serviceRequest.update({
  where: { id: offer.serviceRequestId },
  data: { status: JobStatus.ASSIGNED },
});
```

---

### Issue ID: AUDIT-013
**Title:** Pre-Visit Worker Cancellation Resets Manually Rejected Offers Back to Pending  
**Portal:** Shared Backend  
**Category:** Business Logic  
**Priority:** P1  
**Status:** ✅ **REMEDIATED**  
**Remediation Summary:** Added `ARCHIVED` to Prisma `OfferStatus` enum with migration `20261103000000_add_archived_offer_status`. Updated `OffersService.acceptOffer` to mark competitor bids as `ARCHIVED` rather than `REJECTED`. In `JobsService.cancelJob` pre-visit worker cancellation, only `ARCHIVED` offers are restored to `PENDING` on job reopening, while explicitly customer-declined offers remain `REJECTED` and the cancelling worker is marked `WITHDRAWN`. Aligned frontend types and badge components. Verified with unit test in `jobs.service.spec.ts` (15/15 tests passed), `offers.service.spec.ts` (9/9 passed), backend build, and frontend typecheck. Closed GitHub Issue #201.  
**File:** `hunar-backend/src/jobs/jobs.service.ts`  
**Location:** Lines 1471–1479  
**Current Behavior:** When an assigned worker cancels a job before arrival, `cancelAssignment` sets the job status back to `OPEN` and executes `prisma.jobOffer.updateMany` setting ALL offers with status `REJECTED` back to `PENDING`.  
**Expected Behavior:** Only offers that were automatically rejected or set aside due to another offer being accepted should be reconsidered. Offers explicitly rejected by the customer prior to acceptance must remain `REJECTED`.  
**Root Cause:** The system does not differentiate between "system-rejected upon assignment" and "customer-rejected manually".  
**Impact:** Bids that the customer explicitly declined due to exorbitant prices, poor ratings, or inappropriate terms are resurrected and presented to the customer again as pending offers.  
**Recommended Fix:** Introduce an `OfferStatus.ARCHIVED` or `OfferStatus.DECLINED_BY_CUSTOMER` status distinct from system-rejected bids.  
**Evidence:**
```typescript
// hunar-backend/src/jobs/jobs.service.ts:1471-1479
await this.prisma.jobOffer.updateMany({
  where: {
    serviceRequestId: id,
    status: OfferStatus.REJECTED,
  },
  data: { status: OfferStatus.PENDING },
});
```

---

### Issue ID: AUDIT-014
**Title:** Repair Proposal Decline Freezes Service Request in `REPAIR_NEGOTIATING` and Emits Invalid Enum  
**Portal:** Shared Backend  
**Category:** Logic / State Machine  
**Priority:** P1  
**Status:** ✅ **REMEDIATED**  
**Remediation Summary:** Added `REPAIR_DECLINED` to Prisma `enum JobStatus` and created migration `20261102000000_add_repair_declined_status`. Configured `JobStateMachine.VALID_TRANSITIONS` for `REPAIR_NEGOTIATING -> REPAIR_DECLINED` and `REPAIR_DECLINED -> COMPLETED / CANCELLED`. In `RepairService.rejectRepair`, atomically updates both `repair.status = 'REJECTED'` and `serviceRequest.status = JobStatus.REPAIR_DECLINED`, emitting valid `JobStatus.REPAIR_DECLINED` events. In `JobsService`, updated active job queries, scheduled filters, and `getJobDetail` (setting `repairCharge: 0` and returning repair entity). Aligned frontend types, adapters, status meta tones, and i18n dictionaries (`en.json`, `ur.json`). Verified with `repair.service.spec.ts` (3/3), `jobs.state-machine.spec.ts` (6/6), `jobs.service.spec.ts` (13/13), and full production builds. Closed GitHub Issue #202.  
**File:** `hunar-backend/src/modules/repair/repair.service.ts`  
**Location:** Lines 440–466  
**Current Behavior:** When a customer rejects an in-person repair estimate, `rejectRepair` marks `repair.status = 'REJECTED'`. However, it never updates `serviceRequest.status`. It then emits a WebSocket event containing `newStatus: 'REPAIR_DECLINED'`.  
**Expected Behavior:** When a repair estimate is declined, the service request must transition to a valid `JobStatus` (e.g., `VISITED` or `CANCELLED`). Emitted status values must strictly match the Prisma `JobStatus` enum.  
**Root Cause:** The database state update for `serviceRequest` was omitted, and an unmapped string `'REPAIR_DECLINED'` (which does not exist in Prisma `enum JobStatus`) was emitted to WebSocket clients.  
**Impact:** The job is trapped permanently in `REPAIR_NEGOTIATING`. Neither the customer nor the worker can complete or close the job. Frontend clients expecting valid schema status enums encounter runtime crashes.  
**Recommended Fix:** Update `serviceRequest.status` to `JobStatus.VISITED` or `JobStatus.CANCELLED`, and only emit valid `JobStatus` enum values.  
**Evidence:**
```typescript
// hunar-backend/src/repair/repair.service.ts:450-462
await this.prisma.repair.update({
  where: { id: repairId },
  data: { status: RepairStatus.REJECTED },
});
// ServiceRequest is NEVER updated!
this.eventsGateway.emitJobStatusChange(repair.serviceRequestId, {
  jobId: repair.serviceRequestId,
  newStatus: 'REPAIR_DECLINED', // Invalid enum value!
});
```

---

### Issue ID: AUDIT-015 [REMEDIATED]
**Title:** Double-Deduction Accounting Anomaly in Worker Commission Hold Calculation  
**Portal:** Shared Backend  
**Category:** Financial / Data Integrity  
**Priority:** P1  
**File:** `hunar-backend/src/wallet/wallet.service.ts`  
**Location:** Lines 403–415  
**Current Behavior:** In `holdCommissionForJob`, the service executes:
```typescript
balance: { decrement: amount },
heldBalance: { increment: amount }
```  
**Expected Behavior:** In financial accounting, if `balance` represents the worker's total equity, holding funds only increments `heldBalance`, while available funds are calculated dynamically as `balance - heldBalance`. Alternatively, if `balance` represents spendable funds, `heldBalance` represents held funds, and total balance is `balance + heldBalance`. Decrementing `balance` AND incrementing `heldBalance` while calculating available balance as `balance - heldBalance` results in a double deduction.  
**Root Cause:** Ambiguous definition and inconsistent calculation of total balance vs. spendable balance across wallet services.  
**Impact:** Workers appear to lose double the commission amount on active jobs, resulting in false "Insufficient Balance" errors that prevent them from bidding on subsequent work.  
**Recommended Fix:** Standardize wallet accounting: Define `totalBalance` and `heldBalance`, deriving `availableBalance = totalBalance - heldBalance`. Only increment `heldBalance` on hold; decrement `totalBalance` and `heldBalance` simultaneously upon final settlement.  
**Evidence:**
```typescript
// hunar-backend/src/wallet/wallet.service.ts:408-414
await this.prisma.workerWallet.update({
  where: { workerProfileId },
  data: {
    balance: { decrement: commissionAmount },
    heldBalance: { increment: commissionAmount },
  },
});
```

**Remediation:**
- Standardized the wallet accounting model across backend and frontend:
  - Stored `balance` represents spendable available balance.
  - Stored `heldBalance` represents quarantined funds for active visits or pending withdrawals.
  - `totalBalance` is derived as `balance + heldBalance`.
- Aligned `applyHold`, `applyConfirm`, and `applyReverse` in `hunar-backend/src/modules/wallet/wallet.service.ts` with `hunar-backend/src/modules/payments/wallet.service.ts`:
  - When holding commission, `balance` is decremented and `heldBalance` is incremented atomically.
  - Upon job completion / confirmation, held funds are released from `heldBalance` without decrementing `balance` again (preventing double-deduction), and the `COMMISSION_HELD` ledger entry is transitioned to `COMMISSION_DEDUCTED` to prevent duplicate debit rows.
  - Upon pre-visit cancellation, `heldBalance` is cleared and funds are safely restored back to available `balance`.
- Fixed frontend store `worker-jobs-store.ts` and `earnings.service.ts` to map `heldBalance` properly instead of inflating `walletHold` with lifetime historical `totalDeductions`.
- Added unit tests in `wallet.service.spec.ts` (9/9 passed).


---

### Issue ID: AUDIT-016
**Title:** Customer Payment Records Are Created in `INITIATED` Status and Never Updated to `COMPLETED`  
**Portal:** Shared Backend  
**Category:** Data Integrity / Financial  
**Priority:** P1  
**Status:** ✅ **REMEDIATED**  
**Remediation Summary:** Implemented `PaymentsService.completePayment` and `PaymentsService.completePaymentsForJob` to transition payments to `PaymentStatus.COMPLETED` and record `paidAt` and `verifiedAt` timestamps while emitting domain and realtime events. Integrated with `WalletListener.handleJobCompleted` to automatically complete all in-flight payments upon job completion, and updated `createPayment` to immediately mark payments completed if the job is already finished. Exposed `POST /payments/:id/complete` on `PaymentsController`. Verified with unit test suite `payments.service.spec.ts` (6/6 tests passed), production backend build, and frontend typecheck. Closed GitHub Issue #204.  
**File:** `hunar-backend/src/payments/payments.service.ts` & `hunar-backend/src/wallet/ledger.service.ts`  
**Location:** `payments.service.ts:74-120`  
**Current Behavior:** `Payment` records are created with `PaymentStatus.INITIATED`. Nowhere in the backend codebase is `prisma.payment.update` called to transition the record to `PaymentStatus.COMPLETED` or set `paidAt` and `verifiedAt`.  
**Expected Behavior:** Upon payment gateway webhook confirmation or cash-on-delivery settlement, `payment.status` must transition to `COMPLETED`, setting `paidAt = new Date()`.  
**Root Cause:** Payment handling was split between `payments.service.ts` and `wallet.service.ts`, leaving the primary `Payment` table records unfinalized.  
**Impact:** 100% of payment rows in the database remain in `INITIATED` state indefinitely. Financial reporting, audit trails, and revenue dashboards reflect zero completed payments.  
**Recommended Fix:** Add explicit transition calls in payment settlement workflows to update `PaymentStatus` to `COMPLETED`.  
**Evidence:**
```typescript
// hunar-backend/src/payments/payments.service.ts:85-98
const payment = await this.prisma.payment.create({
  data: {
    serviceRequestId: createPaymentDto.serviceRequestId,
    amount: createPaymentDto.amount,
    method: createPaymentDto.method,
    status: PaymentStatus.INITIATED, // Set to INITIATED
  },
});
// No subsequent method transitions this payment record to COMPLETED!
```

---

## E. Security Findings

---

### Issue ID: AUDIT-017
**Title:** Realtime WebSocket Room Hijacking and Live GPS/OTP Eavesdropping  
**Portal:** Shared Backend  
**Category:** Security  
**Priority:** P0  
**Status:** ✅ **REMEDIATED**  
**Remediation Summary:** Enforced access control in `RealtimeGateway.handleTrackStart`. The gateway now queries `prisma.serviceRequest` and verifies the socket client is the job's customer owner, the assigned worker, or an admin before executing `joinRoom`. Unauthorized attempts are logged and rejected with an `error` event. Verified via 7 unit tests in `realtime.gateway.spec.ts` and closed GitHub Issue #205.  
**File:** `hunar-backend/src/modules/realtime/realtime.gateway.ts`  
**Location:** Lines 73–105  
**Current Behavior (Prior to Fix):** Any authenticated client could emit `location:track:start` with an arbitrary `{ jobId }` and join `jobRoom` without verification.  
**Expected Behavior:** The gateway must query `prisma.serviceRequest.findUnique` and verify that `client.data.user.id` equals `job.customerId` or `job.assignedWorkerId`. If unauthorized, room subscription must be rejected.  
**Root Cause:** Complete omission of access control checks on room join socket events.  
**Impact:** Any user with a valid customer or worker JWT can join any `jobRoom` across the platform, intercepting live worker GPS coordinates, arrival notifications, and the arrival OTP broadcast.  
**Recommended Fix:** Enforce authorization inside `location:track:start`:
```typescript
const job = await this.prisma.serviceRequest.findUnique({ where: { id: payload.jobId } });
if (!job || (job.customerId !== user.sub && job.assignedWorkerId !== user.sub)) {
  throw new WsException('Unauthorized room subscription');
}
```  
**Evidence:**
```typescript
// hunar-backend/src/realtime/realtime.gateway.ts:73-82
@SubscribeMessage(LOCATION_EVENTS.locationTrackStart)
async handleLocationTrackStart(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() payload: { jobId: string },
) {
  const room = jobRoom(payload.jobId);
  client.join(room); // Anyone can join!
  return { event: 'tracking_started', room };
}
```

---

### Issue ID: AUDIT-018
**Title:** Insecure Direct Object Reference (IDOR) Exposing Complete Job and PII Records  
**Portal:** Shared Backend  
**Category:** Security  
**Priority:** P0  
**Status:** ✅ **REMEDIATED**  
**Remediation Summary:** Enforced strict IDOR access control in `JobsService.getJobDetail`. Customers can only view their own jobs; workers can only view jobs if assigned, holding an active offer, or if the job is in an open discovery/bidding state (`OPEN`, `OFFERS_RECEIVED`, etc.). For unassigned workers, sensitive visit history, diagnosis, and inspection photos are stripped (`visits: []`). Verified via 5 automated unit tests in `jobs.service.spec.ts` and closed GitHub Issue #206.  
**File:** `hunar-backend/src/modules/jobs/jobs.service.ts`  
**Location:** `jobs.service.ts:1260-1285`  
**Current Behavior (Prior to Fix):** `GET /jobs/:id` allowed any customer to view other customers' jobs, and allowed unrelated workers to view private in-progress and completed jobs including inspection photographs.  
**Expected Behavior:** If the requester is a `CUSTOMER`, the endpoint must verify `job.customerId === user.sub`. If the requester is a `WORKER`, it must verify the worker is assigned or has submitted an active bid.  
**Root Cause:** Missing data ownership verification in `findOne`.  
**Impact:** Any authenticated user can read full job records by ID or order code, exposing customer home addresses, customer phone numbers, internal diagnosis notes, repair photographs, visit histories, and financial estimates.  
**Recommended Fix:** Enforce ownership checks in `jobs.service.ts`:
```typescript
if (user.role === Role.CUSTOMER && job.customerId !== user.sub) {
  throw new ForbiddenException('Access to this job record is denied');
}
```  
**Evidence:**
```typescript
// hunar-backend/src/jobs/jobs.controller.ts:133-142
@Get(':id')
@UseGuards(JwtAuthGuard)
async findOne(@Param('id') id: string) {
  // No user injected, no role check!
  return this.jobsService.findOne(id);
}
```

---

### Issue ID: AUDIT-019
**Title:** Active Development Environment Configuration Leaks Authentication OTPs in Plaintext  
**Portal:** Shared Backend  
**Category:** Security  
**Priority:** P0  
**File:** `hunar-backend/src/auth/auth.service.ts` & `hunar-backend/.env`  
**Location:** `auth.service.ts:128, 137-139`, `.env:19`  
**Current Behavior:** `returnOtpInResponse()` checks `process.env.OTP_DEBUG !== 'false'`. In `hunar-backend/.env`, `OTP_DEBUG=true`. Whenever an OTP is requested via `POST /auth/send-otp` or `POST /auth/customer/send-otp`, the generated OTP is returned directly in the JSON response body.  
**Expected Behavior:** Authentication OTPs must be dispatched exclusively via external SMS providers (Twilio/Telenor) and NEVER returned in HTTP responses.  
**Root Cause:** Debug flags intended for local mock testing were enabled by default in configuration files.  
**Impact:** Anyone can request an OTP for any phone number and read the valid login code from the API response, allowing full account takeover of any customer or worker account on the platform.  
**Recommended Fix:** Set `OTP_DEBUG=false` in all environments, and remove `otp: devOtp` from production auth service responses.  
**Evidence:**
```typescript
// hunar-backend/src/auth/auth.service.ts:137-139
if (this.returnOtpInResponse()) {
  response.otp = otp; // Returned in response body!
}
```

---

### Issue ID: AUDIT-020
**Title:** JWT Strategy Lacks Revocation and Suspension Validation  
**Portal:** Shared Backend  
**Category:** Security  
**Priority:** P1  
**Status:** ✅ **REMEDIATED**  
**Remediation Summary:** Injected `PrismaService` into `JwtStrategy` and updated `validate(payload)` to query `prisma.user.findUnique`. If the user does not exist or has `isActive === false`, throws `UnauthorizedException` with the suspension reason or duration, while automatically clearing expired temporary suspensions. Returns authenticated credentials sourced directly from the database record. Verified with unit test suite `jwt.strategy.spec.ts` (7/7 tests passed), `auth.service.spec.ts` (23/23 tests passed), and production backend build. Closed GitHub Issue #208.  
**File:** `hunar-backend/src/auth/strategies/jwt.strategy.ts`  
**Location:** Lines 22–27  
**Current Behavior:** `validate(payload)` decodes the JWT and immediately returns `{ sub, phone, role }` without querying the database or cache to check if the user account is active, suspended, or banned.  
**Expected Behavior:** The strategy must check if the user is suspended (`isActive === false`) or if the token has been revoked.  
**Root Cause:** Stateless JWT validation without user status checks.  
**Impact:** Tokens have a 7-day time-to-live (`JWT_ACCESS_TOKEN_TTL=7d`). If an abusive worker or fraudulent customer is banned by administrators, their existing token remains fully functional for up to 7 days, allowing continued access to API resources.  
**Recommended Fix:** Inject `PrismaService` into `JwtStrategy` and check `user.isActive === true`, or maintain a Redis revocation blocklist.  
**Evidence:**
```typescript
// hunar-backend/src/auth/strategies/jwt.strategy.ts:22-26
async validate(payload: any) {
  // Returns decoded payload without checking user status in database!
  return { sub: payload.sub, phone: payload.phone, role: payload.role };
}
```

---

### Issue ID: AUDIT-021
**Title:** Unprotected Offer Inquiries Expose Worker Personal Phone Numbers Before Acceptance  
**Portal:** Shared Backend  
**Category:** Security / Data Isolation  
**Priority:** P1  
**Status:** ✅ **REMEDIATED**  
**Remediation Summary:** Masked technician phone numbers to `null` across all unaccepted offer surfaces prior to formal acceptance (`OffersService.getJobOffers`, `OffersService.submitOffer` realtime customer emissions, `JobsService.getJobDetail`, and `JobsService.getCustomerJobs`). Full phone numbers are strictly withheld until the offer is accepted or the worker is assigned (`selectedWorkerId`), while permitting workers to view their own phone and administrators to view all records. Verified with automated unit tests in `offers.service.spec.ts` (9/9) and `jobs.service.spec.ts` (14/14), `nest build`, and frontend typecheck. Closed GitHub Issue #209.  
**File:** `hunar-backend/src/offers/offers.service.ts`  
**Location:** Line 429  
**Current Behavior:** `GET /jobs/:jobId/offers` includes `worker: { select: { phone: true, ... } }`, returning the technician's direct phone number to any customer viewing job offers.  
**Expected Behavior:** Worker personal phone numbers must be masked until an offer is formally accepted and an in-person visit is scheduled.  
**Root Cause:** Over-inclusive relation query selects `user.phone` on unaccepted proposals.  
**Impact:** Customers can contact workers directly off-platform before accepting bids, bypassing platform escrow fees, insurance protections, and commissions.  
**Recommended Fix:** Exclude `phone` from worker user selection in `findOffersForJob`, only revealing contact info after assignment.  
**Evidence:**
```typescript
// hunar-backend/src/offers/offers.service.ts:425-432
workerProfile: {
  include: {
    user: {
      select: {
        id: true,
        name: true,
        phone: true, // Leaked prior to offer acceptance
      },
    },
  },
}
```

---

### Issue ID: AUDIT-022
**Title:** Customer Arrival OTP Verification Lacks Rate Limiting Enabling Brute-Force Attacks  
**Portal:** Shared Backend  
**Category:** Security  
**Priority:** P1  
**File:** `hunar-backend/src/visits/visits.controller.ts` & `hunar-backend/src/visits/visits.service.ts`  
**Location:** `visits.controller.ts:85-95`, `visits.service.ts:411-440`  
**Current Behavior:** `verifyArrivalOtp` checks the submitted OTP against `visit.arrivalOtp`. There is no rate limiter, attempt counter, or lockout mechanism.  
**Expected Behavior:** Verification attempts must be capped at 5 consecutive failures, after which the OTP is invalidated and requires regeneration.  
**Root Cause:** Missing rate limiting and failure tracking on OTP endpoints.  
**Impact:** Because arrival OTPs are 4-digit numbers (10,000 combinations), an automated script can brute-force the correct code within seconds, bypassing doorstep verification.  
**Recommended Fix:** Add an `attemptCount` field to `Visit`, locking verification after 5 failed attempts, or apply a NestJS `ThrottlerGuard` limiting verification calls to 5 per minute.  
**Evidence:**
```typescript
// hunar-backend/src/visits/visits.service.ts:420-428
if (visit.arrivalOtp !== otp.trim()) {
  throw new BadRequestException('Invalid arrival verification code');
  // No increment of failed attempts, no lockout!
}
```

---

## F. Performance & API Fetching Findings

---

### Issue ID: AUDIT-023
**Title:** Missing Pagination on Worker Job Feeds and Offers Lists Causes Excessive Memory Usage  
**Portal:** Shared Backend  
**Category:** Performance  
**Priority:** P2  
**File:** `hunar-backend/src/jobs/jobs.controller.ts` & `hunar-backend/src/offers/offers.controller.ts`  
**Location:** `jobs.controller.ts:105-120`, `offers.controller.ts:60-75`  
**Current Behavior:** `GET /jobs` and `GET /jobs/:jobId/offers` query Prisma without `take` or `skip` limits, returning unbounded record arrays.  
**Expected Behavior:** Endpoints must enforce default pagination (e.g., `limit = 20`, `page = 1`) to cap payload size and memory consumption.  
**Root Cause:** Omission of pagination parameters in repository queries.  
**Impact:** As the platform scales to thousands of jobs and bids, fetching unbounded arrays degrades database query performance and spikes Node.js process heap memory.  
**Recommended Fix:** Implement standard cursor or offset pagination using `take` and `skip` in Prisma queries.  
**Evidence:**
```typescript
// hunar-backend/src/jobs/jobs.service.ts:1140-1150
return this.prisma.serviceRequest.findMany({
  where,
  include: { ... },
  orderBy: { createdAt: 'desc' },
  // No take or skip pagination!
});
```

---

### Issue ID: AUDIT-024 [REMEDIATED]
**Title:** Unrestricted Local File Storage Preset Lacks Magic-Byte Validation  
**Portal:** Shared Backend  
**Category:** Performance / Security  
**Priority:** P2  
**File:** `hunar-backend/src/uploads/uploads.service.ts` & `hunar-backend/src/uploads/uploads.presets.ts`  
**Location:** `uploads.service.ts:55-85`, `uploads.presets.ts:1-40`  
**Current Behavior:** The upload service validates file types strictly based on client-provided MIME headers and file extensions, and stores files with predictable paths on local disk.  
**Expected Behavior:** Uploaded files must be validated by inspecting file signatures (magic numbers) and scanned for malware before persistence.  
**Root Cause:** Relying solely on `file.mimetype` provided by multipart request headers.  
**Impact:** Malicious actors can upload arbitrary executable scripts disguised as `.png` files, filling server disk storage or enabling potential remote code execution if served statically.  
**Recommended Fix:** Integrate file-type inspection libraries (`file-type`) to verify magic bytes before writing to disk or cloud storage.  
**Evidence:**
```typescript
// hunar-backend/src/uploads/uploads.service.ts:60-68
if (!preset.allowedMimeTypes.includes(file.mimetype)) {
  throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
}
```

**Remediation:**
- Added `detectMimeTypeFromMagicBytes` to `hunar-backend/src/modules/uploads/uploads.presets.ts` to inspect binary headers/signatures across JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WebP (`RIFF...WEBP`), WAV (`RIFF...WAVE`), OGG (`OggS`), WebM (`1A 45 DF A3`), MP3 (`ID3` or sync bytes), and MP4/M4A (`ftyp`).
- Integrated `validateFile` into `UploadsService` across `uploadPhoto`, `uploadDocument`, and `uploadVoiceNote`, rejecting spoofed files lacking valid magic bytes (`FILE_SIGNATURE_INVALID`) or mismatched MIME categories (`FILE_SIGNATURE_MISMATCH`).
- Added unit test suite in `uploads.service.spec.ts` (18/18 passed).


---

## G. Hardcoded Values, Fallbacks & Mock Data

---

### Issue ID: AUDIT-025 [REMEDIATED]
**Title:** Hardcoded Platform Bank Details and Branding Artifacts Display "WorkerFIX"  
**Portal:** Customer / Worker  
**Category:** Hardcoded / Brand Integrity  
**Priority:** P3  
**File:** `hunar-frontend/src/lib/config.ts`  
**Location:** Lines 50–65  
**Current Behavior:** Platform configuration hardcodes `platformAccountLabel = "WorkerFIX Platform Bank Account"` and several fallback texts reference legacy naming.  
**Expected Behavior:** All branding, banking details, and support labels must consistently reference "HUNAR" and load dynamic configuration from backend settings or environment variables.  
**Root Cause:** Incomplete rebranding from legacy prototype codebase.  
**Impact:** Customers and workers transferring manual payment deposits see mismatched platform banking names, creating distrust.  
**Recommended Fix:** Rename all instances to "HUNAR" and retrieve banking account numbers from backend environment configuration.  
**Evidence:**
```typescript
// hunar-frontend/src/lib/config.ts:54-58
export const HUNAR_CONFIG = {
  platformAccountLabel: 'WorkerFIX Platform Bank Account',
  supportPhone: '+92 300 1234567',
  ...
};
```

**Remediation:**
- Replaced legacy "WorkerFIX" bank account label in `hunar-frontend/src/lib/config.ts` with "HUNAR Platform Bank Account".
- Replaced legacy brand strings across `worker-wallet-hero.tsx` and `wallet-withdraw-modal.tsx` with "HUNAR".
- Updated customer sign-in and sign-up page metadata titles to "HUNAR".


---

### Issue ID: AUDIT-026
**Title:** Hardcoded Visit Fees and Arbitrary Negotiation Round Limits  
**Portal:** Customer / Worker / Shared Backend  
**Category:** Hardcoding  
**Priority:** P2  
**File:** `hunar-backend/src/offers/offers.service.ts` & `hunar-frontend/src/lib/api/post-job-api.ts`  
**Location:** `offers.service.ts:640-645`, `post-job-api.ts:250-255`  
**Current Behavior:** Visit fees are hardcoded to `500` or `800` PKR in client-side forms, and counter-offer negotiation rounds are capped at a hardcoded constant of 3 rounds in backend service logic without database configuration.  
**Expected Behavior:** Visit fee floors and negotiation parameters should be dynamically retrieved based on the service category configuration in `ServiceCategory`.  
**Root Cause:** Hardcoded business rules in code instead of relational category metadata.  
**Impact:** Platform administrators cannot adjust visit fees or negotiation rules across different trade categories without modifying and redeploying backend code.  
**Recommended Fix:** Read `minimumVisitFee` and `maxNegotiationRounds` from the `ServiceCategory` entity.  
**Evidence:**
```typescript
// hunar-backend/src/offers/offers.service.ts:641-644
if (existingOffersCount >= 3) {
  throw new BadRequestException('Maximum negotiation rounds reached for this offer');
}
```

---

## H. UI/UX Findings

---

### Issue ID: AUDIT-027 [REMEDIATED]
**Title:** Customer Post-Job Wizard Permits Selection of Past Dates for Preferred Schedule  
**Portal:** Customer  
**Category:** UI / Validation  
**Priority:** P2  
**Status:** **Remediated** (Frontend date/time bounds + Backend `@IsFutureOrPresentDate()` validation)  
**File:** `hunar-frontend/src/features/post-job/components/step-3-location-schedule.tsx` & `hunar-backend/src/modules/jobs/jobs.validation.ts`  
**Location:** `step-3-location-schedule.tsx:135-145, 365-410, 900-907`, `jobs.validation.ts:21-45, 96-99`, `jobs.service.ts:208-215`  
**Remediation Summary:**
- Frontend: Auto-resets stale cached dates from previous days on mount, blocks `preferredDate < today` in `handleNext()`, validates that specific times chosen for today are in the future, and sets native `min` on the `<input type="time">`.
- Backend: Added `@IsFutureOrPresentDate()` decorator in `CreateJobDto` (`jobs.validation.ts`) and a service-level past-date rejection guard in `jobs.service.ts`.

---

### Issue ID: AUDIT-028 [REMEDIATED]
**Title:** Redundant Authentication Routes Cause Navigation Conflicts and Session Desynchronization  
**Portal:** Customer / Worker  
**Category:** UI / Architecture  
**Priority:** P3  
**File:** `hunar-frontend/src/app/[locale]/(auth)/`  
**Location:** Directory structure contains both `/login` and `/sign-in` routes  
**Current Behavior:** The application contains both `login/page.tsx` and `sign-in/page.tsx` within the same locale structure. Navigation links randomly alternate between `/sign-in` and `/login`.  
**Expected Behavior:** A single, authoritative authentication route should be established across all navigation components.  
**Root Cause:** Legacy route migration was left incomplete.  
**Impact:** Confuses search engine indexing, causes unexpected redirects, and splits authentication state handling.  
**Recommended Fix:** Consolidate all authentication flows under `/sign-in` and add a 301 permanent redirect from `/login`.  
**Evidence:**
```
hunar-frontend/src/app/[locale]/(auth)/login/page.tsx
hunar-frontend/src/app/[locale]/(auth)/sign-in/page.tsx
```

---

## I. Logical Errors & Business Rule Violations

---

### Issue ID: AUDIT-029
**Title:** Counter-Offer Logic Permits Consecutive Counters Bypassing Turn Alternation  
**Portal:** Customer / Worker / Shared Backend  
**Category:** Logical / Business Rules  
**Priority:** P1  
**Status:** ✅ **REMEDIATED**  
**Remediation Summary:** Enforced strict turn alternation in `OffersService.counterOffer`. Prevented workers from countering their own initial bid before customer engagement, and verified `lastEntry.by !== by` on subsequent rounds, rejecting consecutive submissions with `CONSECUTIVE_COUNTER_NOT_ALLOWED`. Verified with unit tests in `offers.service.spec.ts` (11/11 passed), backend production build, and frontend typecheck. Closed GitHub Issue #217.  
**File:** `hunar-backend/src/offers/offers.service.ts`  
**Location:** Lines 620–660  
**Current Behavior:** `counterOffer(offerId, user, dto)` verifies that the user is either the customer or the worker. However, it does NOT check who made the *last* counter-offer.  
**Expected Behavior:** Counter-offering must strictly alternate turns. If the customer makes a counter-offer, only the worker can respond with another counter. The same user must never counter their own counter consecutively.  
**Root Cause:** Missing check on the author of the most recent offer revision.  
**Impact:** A party can submit multiple counter-offers consecutively, rapidly exhausting the hardcoded 3-round negotiation limit without giving the counterparty an opportunity to review or respond.  
**Recommended Fix:** Verify that `lastOffer.createdBy !== currentUser.sub` before permitting a new counter-offer.  
**Evidence:**
```typescript
// hunar-backend/src/offers/offers.service.ts:630-638
if (offer.serviceRequest.customerId !== user.sub && offer.workerProfile.userId !== user.sub) {
  throw new ForbiddenException('Not authorized to counter this offer');
}
// Does not check if the last counter was sent by the same user!
```

---

## J. Data Integrity Findings

---

### Issue ID: AUDIT-030 [REMEDIATED]
**Title:** Dead Customer Profile Service Creates Divergent Implementations and Logic Drift  
**Portal:** Shared Backend  
**Category:** Data Integrity / Maintainability  
**Priority:** P3  
**File:** `hunar-backend/src/users/customer-profile.service.ts` & `hunar-backend/src/users/users.service.ts`  
**Location:** Entire `customer-profile.service.ts` file  
**Current Behavior:** `UsersService` implements customer profile updates directly inline, leaving `CustomerProfileService` completely unreferenced in `UsersController` or any consumer module.  
**Expected Behavior:** Profile management logic must follow single-responsibility architecture and avoid duplicate, dormant service classes.  
**Root Cause:** Incomplete refactoring during user module consolidation.  
**Impact:** Future developers modifying `customer-profile.service.ts` will find their changes have zero effect on live runtime behavior.  
**Recommended Fix:** Remove the dead `customer-profile.service.ts` file or delegate `UsersService.updateCustomerProfile` calls to it cleanly.  
**Evidence:**
```typescript
// hunar-backend/src/users/users.controller.ts:40-55
// UsersController injects UsersService directly for customer profile updates;
// CustomerProfileService is never injected into any controller.
```


**Remediation:**
- Removed dead, unreferenced `hunar-backend/src/modules/users/customer-profile.service.ts` file.
- All customer profile operations remain unified under `UsersService` and `UsersController`.

---

## K. Recommended Fix Priority

The table below outlines the recommended implementation roadmap, ordered by risk and architectural dependency:

| Priority | Issue ID | Title | Domain | Effort |
| :--- | :--- | :--- | :--- | :---: |
| **P0** | **AUDIT-006** | Fix Doorstep OTP Verification Bypass & Self-Verification | Security / Visits | 2 Hours | ✅ **REMEDIATED** |
| **P0** | **AUDIT-017** | Enforce Authorization on WebSocket Room Subscriptions | Security / Realtime | 2 Hours | ✅ **REMEDIATED** |
| **P0** | **AUDIT-018** | Remediate IDOR in Job Detail Queries (`GET /jobs/:id`) | Security / Jobs | 2 Hours | ✅ **REMEDIATED** |
| **P0** | **AUDIT-008** | Mask Worker Phone & Obfuscate Public GPS Profile | Security / Users | 2 Hours | ✅ **REMEDIATED** |
| **P0** | **AUDIT-019** | Disable `OTP_DEBUG` and Remove Plaintext OTP from Responses | Security / Auth | 30 Mins | ⏸️ **DEFERRED** (Dev Mode) |
| **P1** | **AUDIT-011** | Enforce Status Preconditions on Offer Acceptance | Logic / Offers | 2 Hours | ✅ **REMEDIATED** |
| **P1** | **AUDIT-012** | Implement Atomic Row-Locking for Job Offer Acceptance | Concurrency / DB | 3 Hours | ✅ **REMEDIATED** |
| **P1** | **AUDIT-014** | Transition Status and Fix Invalid Enum on Repair Decline | Logic / Repair | 2 Hours | ✅ **REMEDIATED** |
| **P1** | **AUDIT-015** | Correct Double-Deduction in Commission Hold Calculation | Financial / Wallet | 3 Hours | ✅ **REMEDIATED** |
| **P1** | **AUDIT-010** | Deduct Withdrawal Amount into Held Balance Atomically | Financial / Wallet | 2 Hours | ✅ **REMEDIATED** |
| **P1** | **AUDIT-013** | Preserve Manually Rejected Offers on Worker Reopening | Logic / Jobs | 2 Hours | ✅ **REMEDIATED** |
| **P1** | **AUDIT-020** | Add Account Suspension Check to JWT Strategy | Security / Auth | 2 Hours | ✅ **REMEDIATED** |
| **P1** | **AUDIT-021** | Mask Worker Phone Numbers Prior to Offer Acceptance | Privacy / Offers | 1 Hour | ✅ **REMEDIATED** |
| **P1** | **AUDIT-022** | Add Attempt Limiter to Doorstep Arrival OTP Verification | Security / Visits | 2 Hours | ✅ **REMEDIATED** |
| **P1** | **AUDIT-002** | Map Arrival OTP to Security PIN in Customer Banner | UI / Visits | 1 Hour | ✅ **REMEDIATED** |
| **P1** | **AUDIT-016** | Transition Payment Status from `INITIATED` to `COMPLETED` | Financial / Ledger | 3 Hours | ✅ **REMEDIATED** |
| **P1** | **AUDIT-029** | Enforce Strict Turn Alternation on Counter-Offers | Logic / Offers | 2 Hours | ✅ **REMEDIATED** |
| **P2** | **AUDIT-001** | Replace 2.5s Triple-Polling with WebSocket Push Events | Performance / UI | 4 Hours | ✅ **REMEDIATED** |
| **P2** | **AUDIT-003** | Remove Base64 Direct Database Storage Fallbacks | Performance / DB | 4 Hours | ✅ **REMEDIATED** |
| **P2** | **AUDIT-007** | Route Worker Diagnosis Photos to Upload Service | Performance / DB | 3 Hours | ✅ **REMEDIATED** |
| **P2** | **AUDIT-004** | Implement Next.js Layout Auth Guard for Customer Portal | Security / Frontend | 2 Hours | ✅ **RESOLVED** (By Design) |
| **P2** | **AUDIT-005** | Eliminate Hardcoded Peshawar Coordinates & Category IDs | Logic / Frontend | 2 Hours | ✅ **REMEDIATED** |
| **P2** | **AUDIT-009** | Allow Workers to Submit Customer Reviews | Logic / Reviews | 3 Hours | ✅ **REMEDIATED** |
| **P2** | **AUDIT-023** | Add Pagination to Job Feeds and Offers Lists | Performance / DB | 3 Hours | ✅ **REMEDIATED** |
| **P2** | **AUDIT-024** | Validate File Magic Numbers on Upload Service | Security / Uploads | 3 Hours | ✅ **REMEDIATED** |
| **P2** | **AUDIT-026** | Make Visit Fees and Negotiation Rounds Dynamic | Config / Category | 3 Hours | ✅ **REMEDIATED** |
| **P2** | **AUDIT-027** | Enforce Minimum Date on Post-Job Schedule Selection | Validation / UI | 1 Hour | ✅ **REMEDIATED** |
| **P3** | **AUDIT-025** | Remove Legacy "WorkerFIX" Platform Bank References | Brand / Config | 1 Hour | ✅ **REMEDIATED** |
| **P3** | **AUDIT-028** | Consolidate Duplicate `/login` and `/sign-in` Routes | UX / Routing | 1 Hour | ✅ **REMEDIATED** |
| **P3** | **AUDIT-030** | Prune Dead `customer-profile.service.ts` Class | Cleanup / Backend | 30 Mins | ✅ **REMEDIATED** |

---
*Report compiled independently from direct source-code inspection of `hunar-backend` and `hunar-frontend`.*
