# Major Backend Modules — Fixora (Home Services Platform)

**Author:** Shafqat Ullah  
**Document Type:** Backend Module Design  
**Version:** 3.0  
**Date:** September 2, 2026  
**Status:** Draft — Pending Team Review

> **Note:** This aligns with the team-approved **Fixora stack**: **NestJS** (TypeScript) modular monolith with **PostgreSQL + PostGIS** (via Prisma), **Redis**, **Socket.IO**, and **Firebase Cloud Messaging (FCM)** for push notifications. It is a **web application**.

---

## 1. Overview

This document defines all major backend modules, their responsibilities, internal structure, key functions, and inter-module communication for Fixora — built as a **NestJS modular monolith** with **PostgreSQL**.

---

## 2. Module Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     MODULAR MONOLITH                             │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  1. Auth        │  │  2. Users      │  │  3. Jobs       │    │
│  │     Module      │  │     Module     │  │     Module     │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  4. Offers      │  │  5. Visits     │  │  6. Repair     │    │
│  │     Module      │  │     Module     │  │     Module     │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  7. Payments    │  │  8. Reviews    │  │  9. Chat       │    │
│  │     Module      │  │     Module     │  │     Module     │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ 10. Notif.     │  │ 11. Location   │  │ 12. File       │    │
│  │     Module      │  │     Module     │  │     Upload     │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │ 13. Search/    │  │ 14. Admin      │                         │
│  │  Matching      │  │     Module     │                         │
│  └────────────────┘  └────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Module Details

---

### MODULE 1: Auth Module

**Path:** `src/modules/auth/`

**Responsibility:** User authentication, OTP generation/verification, JWT token management.

```
src/modules/auth/
├── auth.controller.ts
├── auth.service.ts
├── auth.validation.ts
├── auth.middleware.ts
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `sendOTP` | POST | `/auth/otp/send` | Generate and send OTP to phone |
| `verifyOTP` | POST | `/auth/otp/verify` | Verify OTP, return JWT + refresh |
| `refreshToken` | POST | `/auth/token/refresh` | Refresh access token |
| `logout` | POST | `/auth/logout` | Invalidate refresh token |
| `registerUser` | POST | `/auth/register` | Complete registration with name/role |

**Dependencies:**
- Redis (OTP storage with TTL)
- SMS Gateway (Twilio / local provider)
- JWT Library (jsonwebtoken)

**Key Decisions:**
- OTP expires in 5 minutes
- Max 3 OTP resend attempts per phone per 15 minutes
- JWT access token: 15 min lifetime
- Refresh token: 30 days, stored in Redis
- Refresh token rotation on each use

---

### MODULE 2: Users Module

**Path:** `src/modules/users/`

**Responsibility:** User profile management, worker profiles, customer profiles, verification.

```
src/modules/users/
├── users.controller.ts
├── users.service.ts
├── users.validation.ts
├── workerProfile.service.ts
├── customerProfile.service.ts
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `getProfile` | GET | `/users/me` | Get current user profile |
| `updateProfile` | PUT | `/users/me` | Update name, avatar, etc. |
| `getWorkerProfile` | GET | `/users/worker/:id` | Get worker public profile |
| `updateWorkerProfile` | PUT | `/users/worker/me` | Update worker skills, bio, rate |
| `updateLocation` | PUT | `/users/location` | Update current GPS location |
| `verifyWorker` | POST | `/admin/workers/:id/verify` | Admin: verify worker |
| `toggleAvailability` | PUT | `/users/worker/availability` | Worker: toggle online/offline |

**Key Decisions:**
- Worker verification requires admin approval
- Location updated via separate lightweight endpoint (frequent calls)
- Worker skills stored as array of category IDs

---

### MODULE 3: Jobs (Service Requests) Module

**Path:** `src/modules/jobs/`

**Responsibility:** Job creation, status management, state machine, job listing.

```
src/modules/jobs/
├── jobs.controller.ts
├── jobs.service.ts
├── jobs.validation.ts
├── jobs.stateMachine.ts
├── jobs.events.ts
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `createJob` | POST | `/jobs` | Create new service request |
| `getJob` | GET | `/jobs/:id` | Get job details |
| `getMyJobs` | GET | `/jobs/my` | Get customer's jobs |
| `getAvailableJobs` | GET | `/jobs/available` | Get nearby open jobs (worker) |
| `updateJobStatus` | PUT | `/jobs/:id/status` | Advance job state |
| `cancelJob` | PUT | `/jobs/:id/cancel` | Cancel job |
| `updateJobImages` | PUT | `/jobs/:id/images` | Add/remove job images |

**Job State Machine:**

```
                          ┌──────────────┐
                          │     open     │
                          └──────┬───────┘
                                 │ offers received
                          ┌──────▼───────┐
                          │offers_received│
                          └──────┬───────┘
                                 │ customer accepts offer
                          ┌──────▼───────┐
                          │offer_accepted │
                          └──────┬───────┘
                                 │ worker assigned
                          ┌──────▼───────┐
                          │worker_assigned│
                          └──────┬───────┘
                                 │ visit scheduled
                          ┌──────▼────────┐
                          │visit_scheduled │
                          └──────┬────────┘
                                 │ worker arrives
                          ┌──────▼──────────┐
                          │visit_in_progress │
                          └──────┬──────────┘
                                 │ inspection done
                          ┌──────▼──────────┐
                          │  visit_completed │
                          └──────┬──────────┘
                                 │ estimate provided
                          ┌──────▼────────────┐
                          │repair_negotiating  │
                          └──────┬────────────┘
                                 │ customer approves
                          ┌──────▼──────────┐
                          │ repair_approved  │
                          └──────┬──────────┘
                                 │ work begins
                          ┌──────▼──────────┐
                          │   in_progress    │
                          └──────┬──────────┘
                                 │ work done
                          ┌──────▼──────────┐
                          │    completed     │
                          └──────┬──────────┘
                                 │ payment
                          ┌──────▼──────────┐
                          │      paid        │
                          └──────┬──────────┘
                                 │ review
                          ┌──────▼──────────┐
                          │    reviewed      │
                          └─────────────────┘

         ┌─────────────────────────────────────────────────┐
         │  cancelled (from: open → repair_approved)        │
         │  disputed  (from: in_progress, completed)        │
         └─────────────────────────────────────────────────┘
```

**Key Decisions:**
- State transitions are enforced by the state machine
- Only certain roles can trigger specific transitions
- Every state change emits an event (for notifications, real-time updates)
- Cancelled jobs are soft-deleted (data preserved)

---

### MODULE 4: Offers Module

**Path:** `src/modules/offers/`

**Responsibility:** Worker offer submission, customer acceptance/rejection, offer management.

```
src/modules/offers/
├── offers.controller.ts
├── offers.service.ts
├── offers.validation.ts
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `submitOffer` | POST | `/jobs/:jobId/offers` | Worker submits visit charge offer |
| `getJobOffers` | GET | `/jobs/:jobId/offers` | Customer: list all offers for job |
| `getMyOffers` | GET | `/offers/my` | Worker: list own offers |
| `acceptOffer` | PUT | `/offers/:id/accept` | Customer: accept a specific offer |
| `rejectOffer` | PUT | `/offers/:id/reject` | Customer: reject an offer |
| `withdrawOffer` | PUT | `/offers/:id/withdraw` | Worker: withdraw own offer |

**Key Decisions:**
- One offer per worker per job (enforced by unique constraint)
- Accepting an offer auto-rejects other pending offers for the job
- Worker can withdraw offer only if status is `pending`
- Offer includes both visit charge and estimated repair cost

---

### MODULE 5: Visits Module

**Path:** `src/modules/visits/`

**Responsibility:** Visit scheduling, tracking, completion, inspection notes.

```
src/modules/visits/
├── visits.controller.ts
├── visits.service.ts
├── visits.validation.ts
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `scheduleVisit` | POST | `/visits` | Create visit after offer acceptance |
| `getVisit` | GET | `/visits/:id` | Get visit details |
| `updateVisitStatus` | PUT | `/visits/:id/status` | Worker: update visit status |
| `addInspectionNotes` | PUT | `/visits/:id/inspection` | Worker: add notes + images |
| `getUpcomingVisits` | GET | `/visits/upcoming` | Worker: upcoming scheduled visits |
| `rescheduleVisit` | PUT | `/visits/:id/reschedule` | Reschedule visit date |

**Key Decisions:**
- Visit must be scheduled within 48 hours of offer acceptance (configurable)
- Worker confirms arrival by updating status to `in_progress`
- Inspection notes required before advancing to repair negotiation
- No-show tracking for worker reliability scoring

---

### MODULE 6: Repair Estimate Module

**Path:** `src/modules/repair/`

**Responsibility:** Repair cost estimation, negotiation flow, approval.

```
src/modules/repair/
├── repair.controller.ts
├── repair.service.ts
├── repair.validation.ts
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `createEstimate` | POST | `/visits/:visitId/estimate` | Worker: submit repair estimate |
| `getEstimate` | GET | `/repairs/:id` | Get current estimate |
| `counterOffer` | PUT | `/repairs/:id/counter` | Customer: submit counter-offer |
| `acceptEstimate` | PUT | `/repairs/:id/accept` | Customer: approve final price |
| `rejectEstimate` | PUT | `/repairs/:id/reject` | Customer: reject (cancel or re-negotiate) |

**Negotiation History Format:**

```json
[
  {
    "by": "worker",
    "amount": 8000,
    "note": "Parts + labor for pipe replacement",
    "timestamp": "2026-09-01T10:00:00Z"
  },
  {
    "by": "customer",
    "amount": 6000,
    "note": "Too high, can we reduce?",
    "timestamp": "2026-09-01T10:30:00Z"
  },
  {
    "by": "worker",
    "amount": 7000,
    "note": "Final offer with discount",
    "timestamp": "2026-09-01T11:00:00Z"
  }
]
```

**Key Decisions:**
- Max 5 rounds of negotiation (configurable)
- After max rounds, either accept last offer or cancel
- Worker provides itemized breakdown (parts, labor, other)
- Customer must explicitly approve before repair begins

---

### MODULE 7: Payments Module

**Path:** `src/modules/payments/`

**Responsibility:** Payment processing, gateway integration, commission, payouts.

```
src/modules/payments/
├── payments.controller.ts
├── payments.service.ts
├── payments.validation.ts
├── gateways/
│   ├── jazzcash.gateway.ts
│   ├── easypaisa.gateway.ts
│   ├── stripe.gateway.ts
│   └── gateway.interface.ts
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `initiatePayment` | POST | `/payments/initiate` | Start payment for completed job |
| `paymentWebhook` | POST | `/webhooks/payment/:gateway` | Gateway callback |
| `getPaymentStatus` | GET | `/payments/:id/status` | Check payment status |
| `getMyPayments` | GET | `/payments/my` | User's payment history |
| `requestRefund` | POST | `/payments/:id/refund` | Request refund |
| `processPayout` | POST | `/admin/payouts/process` | Admin: process worker payouts |

**Commission Model:**

```
Total Repair Amount:       Rs. 10,000
Platform Commission (15%): Rs.  1,500
Worker Payout:             Rs.  8,500
```

**Payment Flow:**

```
1. Job completed → Payment initiated
2. Customer chooses payment method
3. Gateway processes payment
4. Webhook confirms payment
5. Platform holds funds in escrow
6. After review period (24h), funds released to worker
7. Platform commission deducted automatically
```

**Key Decisions:**
- Platform commission: configurable per category (default 15%)
- Support for cash payment (worker collects, platform still deducts commission)
- Worker payouts processed daily (batch)
- Refund window: 24 hours after payment
- Payment gateway abstraction for easy provider switching

---

### MODULE 8: Reviews Module

**Path:** `src/modules/reviews/`

**Responsibility:** Post-job reviews, rating calculation, review management.

```
src/modules/reviews/
├── reviews.controller.ts
├── reviews.service.ts
├── reviews.validation.ts
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `submitReview` | POST | `/jobs/:jobId/review` | Submit review for completed job |
| `getJobReviews` | GET | `/jobs/:jobId/reviews` | Get reviews for a job |
| `getUserReviews` | GET | `/users/:id/reviews` | Get reviews for a user |
| `flagReview` | POST | `/reviews/:id/flag` | Flag inappropriate review |

**Key Decisions:**
- Both customer and worker can review each other
- Review must be submitted within 7 days of job completion
- Rating is 1-5 integer (no half stars in DB; UI can show half stars)
- Worker's average rating recalculated on each new review (stored in worker_profiles)
- Reviews are public but can be flagged by admin

---

### MODULE 9: Chat Module

**Path:** `src/modules/chat/`

**Responsibility:** Real-time messaging between customer and worker, message history.

```
src/modules/chat/
├── chat.controller.ts
├── chat.service.ts
├── chat.socket.ts      ← Socket.IO event handlers
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `getConversations` | GET | `/chat/conversations` | List user's conversations |
| `getMessages` | GET | `/chat/:convId/messages` | Get message history (paginated) |
| `sendMessage` | POST | `/chat/:convId/messages` | Send text/image/voice message |
| `markRead` | PUT | `/chat/:convId/read` | Mark messages as read |

**Socket Events:**

| Event | Direction | Payload |
|---|---|---|
| `chat:join` | Client → Server | `{ conversationId }` |
| `chat:message` | Server → Client | `{ conversationId, message }` |
| `chat:typing` | Client → Server | `{ conversationId }` |
| `chat:stopTyping` | Client → Server | `{ conversationId }` |
| `chat:read` | Client → Server | `{ conversationId, messageId }` |

**Key Decisions:**
- Conversation created automatically when offer is accepted
- Messages support text, image, and voice note
- Unread message count shown in UI badge
- Messages stored in PostgreSQL (`messages` table, indexed by `conversation_id`) + optionally synced to Elasticsearch

---

### MODULE 10: Notifications Module

**Path:** `src/modules/notifications/`

**Responsibility:** Multi-channel notification delivery (push, SMS, in-app, email).

```
src/modules/notifications/
├── notifications.controller.ts
├── notifications.service.ts
├── templates/
│   ├── job-alert.template.ts
│   ├── offer-received.template.ts
│   ├── otp.template.ts
│   └── ...
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `getNotifications` | GET | `/notifications` | List user's notifications |
| `markRead` | PUT | `/notifications/:id/read` | Mark single notification read |
| `markAllRead` | PUT | `/notifications/read-all` | Mark all as read |
| `getUnreadCount` | GET | `/notifications/unread-count` | Get unread count |

**Internal Functions (called by other modules):**

| Function | Trigger | Channel |
|---|---|---|
| `notifyNewJob(job)` | Job created | Push → nearby workers |
| `notifyOfferReceived(offer)` | Worker submits offer | Push + In-App → customer |
| `notifyOfferAccepted(offer)` | Customer accepts | Push + In-App → worker |
| `notifyVisitReminder(visit)` | 24h before visit | Push → both |
| `notifyPaymentComplete(payment)` | Payment confirmed | Push + In-App → both |
| `sendOTP(phone, otp)` | Auth request | SMS |

**Key Decisions:**
- Push notifications via **Firebase Cloud Messaging (FCM)** (`firebase-admin` npm package in NestJS)
- SMS via Twilio or local Pakistani provider
- In-app notifications stored in PostgreSQL (`notifications` table)
- Notification preferences per user (opt-out for promotional)
- Batch push for new job alerts (not individual sends)

---

### MODULE 11: Location Module

**Path:** `src/modules/location/`

**Responsibility:** Geolocation services, nearby worker matching, distance calculation.

```
src/modules/location/
├── location.service.ts
├── location.utils.ts
├── geocoding.service.ts
└── __tests__/
```

**Key Functions:**

| Function | Description |
|---|---|---|
| `findNearbyWorkers(lat, lng, radius, category)` | Find workers within radius using **PostGIS** `ST_DWithin` on GiST index |
| `calculateDistance(loc1, loc2)` | Haversine distance between two points |
| `geocodeAddress(address)` | Convert address to coordinates |
| `reverseGeocode(lat, lng)` | Convert coordinates to address |
| `updateWorkerLocation(userId, lat, lng)` | Update and cache worker location |
| `getWorkerLocation(userId)` | Get last known worker location |

**PostGIS Query Example:**

```sql
-- Find verified, available workers matching a category within radius
SELECT
    u.id, u.name, u.avatar_url,
    wp.rating_avg, wp.skills,
    ST_Distance(
        wp.location::geography,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
    ) AS distance_meters
FROM users u
JOIN worker_profiles wp ON wp.user_id = u.id
WHERE
    u.is_active = true
    AND wp.is_verified = true
    AND wp.is_available = true
    AND wp.skills && ARRAY[:categoryId]
    AND ST_DWithin(
        wp.location::geography,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
        :radiusMeters
    )
ORDER BY distance_meters ASC
LIMIT 50;
```

> Requires a **GiST** index on `worker_profiles.location` (PostGIS).

**Key Decisions:**
- Worker location cached in Redis for fast reads (2 min TTL)
- PostgreSQL **PostGIS** `ST_DWithin` / GiST index used for the radius query (team-approved stack)
- Elasticsearch used for combined text + geo search (optional)
- Location precision: ~100m (sufficient for city-level matching)
- Worker location updated every 30 seconds when active on the web app

---

### MODULE 12: File Upload Module

**Path:** `src/modules/uploads/`

**Responsibility:** File upload handling, image processing, voice note storage.

```
src/modules/uploads/
├── uploads.controller.ts
├── uploads.service.ts
├── processors/
│   ├── image.processor.ts
│   └── voice.processor.ts
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `uploadImage` | POST | `/uploads/image` | Upload and process image |
| `uploadVoice` | POST | `/uploads/voice` | Upload voice note |
| `uploadDocument` | POST | `/uploads/document` | Upload ID document |
| `getSignedUrl` | GET | `/uploads/:key/url` | Get pre-signed download URL |
| `deleteFile` | DELETE | `/uploads/:key` | Delete uploaded file |

**Image Processing Pipeline:**

```
Upload → Validate Type/Size → Virus Scan (optional)
  → Generate 3 variants:
    - thumbnail: 150x150
    - medium:    600x600
    - large:     1200x1200
  → Upload all variants to S3
  → Return URLs
```

**Supported Formats:**

| Type | Formats | Max Size |
|---|---|---|
| Images | JPEG, PNG, WebP | 5 MB |
| Voice | OGG, M4A, WAV | 10 MB |
| Documents | PDF, JPG, PNG | 5 MB |

**Key Decisions:**
- Pre-signed URLs for upload (client uploads directly to S3)
- Image resizing via Sharp (Node.js)
- File type validation on both client and server
- CDN (CloudFront) for serving files
- No file storage on application servers

---

### MODULE 13: Search / Matching Module

**Path:** `src/modules/search/`

**Responsibility:** Advanced job and worker search, PostgreSQL full-text / Elasticsearch integration.

```
src/modules/search/
├── search.service.ts
├── search.client.ts
├── indexers/
│   ├── job.indexer.ts
│   └── worker.indexer.ts
└── __tests__/
```

**Key Functions:**

| Function | Description |
|---|---|
| `searchJobs(filters)` | Search jobs by category, location, status, date |
| `searchWorkers(filters)` | Search workers by skill, location, rating, availability |
| `indexJob(job)` | Index/update job in Elasticsearch / PostgreSQL FTS |
| `indexWorker(worker)` | Index/update worker in Elasticsearch / PostgreSQL FTS |
| `removeFromIndex(type, id)` | Remove document from index |

**PostgreSQL Full-Text Search Example:**

```sql
-- Full-text search on open jobs (PostgreSQL tsvector + GIN index)
SELECT id, title, description, city, status,
       ts_rank(to_tsvector('english', title || ' ' || description), query) AS rank
FROM service_requests,
     plainto_tsquery('english', :query) AS query
WHERE to_tsvector('english', title || ' ' || description) @@ query
  AND status = 'open'
ORDER BY rank DESC
LIMIT 50;

-- Generated column + GIN index for performance
ALTER TABLE service_requests
    ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS
        (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')))
    STORED;
CREATE INDEX idx_sr_search_gin ON service_requests USING GIN(search_vector);
```

> For more advanced relevance, faceted filtering, and combined text + geo queries, upgrade to **Elasticsearch** (optional).

**Key Decisions:**
- Start with PostgreSQL full-text (`tsvector`) + PostGIS for MVP
- Optionally upgrade to Elasticsearch for complex queries
- Search results cached in Redis (30 seconds TTL)
- Fallback to PostgreSQL queries if Elasticsearch unavailable

---

### MODULE 14: Admin Module

**Path:** `src/modules/admin/`

**Responsibility:** Admin dashboard APIs, user management, dispute resolution, analytics.

```
src/modules/admin/
├── admin.controller.ts
├── admin.service.ts
├── admin.middleware.ts   ← admin role check
└── __tests__/
```

**Key Functions:**

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `getDashboard` | GET | `/admin/dashboard` | Stats: jobs, users, revenue |
| `getUsers` | GET | `/admin/users` | List all users (filterable) |
| `getUserDetail` | GET | `/admin/users/:id` | Get user details |
| `toggleUserActive` | PUT | `/admin/users/:id/toggle` | Activate/deactivate user |
| `getWorkerVerifications` | GET | `/admin/verifications/pending` | Pending verifications |
| `verifyWorker` | PUT | `/admin/verifications/:userId` | Approve/reject worker |
| `getDisputes` | GET | `/admin/disputes` | List all disputes |
| `resolveDispute` | PUT | `/admin/disputes/:id/resolve` | Resolve a dispute |
| `updateCommission` | PUT | `/admin/settings/commission` | Update commission rate |
| `getAnalytics` | GET | `/admin/analytics` | Platform analytics |

**Key Decisions:**
- Admin routes protected by admin role middleware
- Super admin required for commission and system config changes
- All admin actions logged for audit trail
- Analytics aggregated daily and cached

---

## 4. Inter-Module Communication

### 4.1 Event-Driven Internal Events

| Event | Emitter | Consumer | Action |
|---|---|---|---|
| `job.created` | Jobs | Notifications, Search | Notify workers, index in Elasticsearch/FTS |
| `job.statusChanged` | Jobs | Notifications, Chat | Send status notifications |
| `offer.submitted` | Offers | Notifications | Notify customer |
| `offer.accepted` | Offers | Jobs, Visits, Notifications | Create conversation, schedule visit |
| `visit.completed` | Visits | Repair, Notifications | Trigger repair estimation |
| `repair.approved` | Repair | Jobs, Notifications | Job → in_progress |
| `payment.completed` | Payments | Jobs, Reviews, Notifications | Job → paid, allow reviews |
| `review.submitted` | Reviews | Users, Notifications | Update worker rating |

### 4.2 Event Bus Implementation

```typescript
// Using Node.js EventEmitter (simple) or custom event bus
class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, handler: Function) { ... }
  emit(event: string, data: any) { ... }
}

// Usage in modules:
eventBus.on('job.created', async (job) => {
  await notificationService.notifyNearbyWorkers(job);
  await searchService.indexJob(job);
});
```

---

## 5. API Versioning

All APIs prefixed with version:

```
/api/v1/jobs
/api/v1/auth/otp/send
/api/v1/users/me
```

---

## 6. Error Handling

Standardized error response format:

```json
{
  "success": false,
  "error": {
    "code": "JOB_NOT_FOUND",
    "message": "The requested job does not exist",
    "details": {}
  },
  "meta": {
    "requestId": "abc-123",
    "timestamp": "2026-09-01T10:00:00Z"
  }
}
```

**Error Codes:**

| Code | HTTP Status | Description |
|---|---|---|
| `AUTH_OTP_EXPIRED` | 400 | OTP expired |
| `AUTH_OTP_INVALID` | 400 | Wrong OTP |
| `USER_NOT_FOUND` | 404 | User not found |
| `USER_UNAUTHORIZED` | 403 | No permission |
| `JOB_NOT_FOUND` | 404 | Job not found |
| `JOB_INVALID_STATE` | 400 | Cannot transition from current state |
| `OFFER_DUPLICATE` | 409 | Worker already made offer |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## 7. Module Dependency Matrix

| Module | Depends On |
|---|---|---|
| Auth | Redis, SMS Gateway |
| Users | Auth, File Upload |
| Jobs | Users, Categories, Location |
| Offers | Jobs, Users, Notifications |
| Visits | Offers, Jobs, Notifications |
| Repair | Visits, Jobs, Notifications |
| Payments | Jobs, Users, Payment Gateways |
| Reviews | Jobs, Users |
| Chat | Users, File Upload |
| Notifications | Redis (pub/sub), FCM, SMS |
| Location | PostgreSQL + PostGIS, Redis |
| File Upload | S3, Sharp (image processing) |
| Search | PostgreSQL full-text / Elasticsearch |
| Admin | All modules (read access) |

---

*Document prepared by Shafqat Ullah — Pending review by Qazi Farhan Ahmad (Team Lead)*
