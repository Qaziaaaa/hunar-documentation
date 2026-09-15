# Module 2 — Jobs, Matching & the Service Lifecycle

## Purpose of This Module
Everything from "I need a service" to "the job is done" — service categories, posting a job, worker discovery & matching, offers & negotiation, visits & inspection, repair estimates & approval, job completion, cancellation, and the full job state machine.

**Covers requirements:** FR-04 (manage categories), FR-05 (search/filter workers), FR-06 (display worker profile info), FR-07 (create service request), FR-08 (store job details), FR-09 (show new requests to workers), FR-10 (accept/reject requests), FR-11 (maintain request statuses), FR-12 (customer sees status/history), FR-15 (record important request actions). Also the entire SRS job/quote/booking core, the worker workflow MVP (two-stage pricing), and the location/search design.

**Depends on:** Module 1 (accounts/roles), Module 4 (notifications on every state change), Module 3 (payment triggers at completion).

---

## 1. Service Categories (the Catalog)

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR(100) | English |
| name_urdu | VARCHAR(100) | Urdu label |
| description | TEXT | |
| icon_url | TEXT | Category icon |
| parent_id | UUID self-FK | Sub-categories supported |
| is_active | BOOLEAN | Soft-disable |
| sort_order | INTEGER | Display order |
| created_at | TIMESTAMPTZ | |

**Pre-seeded categories (seed data):**
| # | Name | Urdu |
|---|---|---|
| 1 | Electrical | الیکٹریکل |
| 2 | Plumbing | پلمبرنگ |
| 3 | AC & Refrigeration | ای سی اور ریفریجریٹر |
| 4 | Carpentry | لکڑ کا کام |
| 5 | Painting | پینٹنگ |
| 6 | Cleaning | صفائی |
| 7 | Masonry | دھاتی |
| 8 | Pest Control | کیڑے مار دوا |
| 9 | General Handyman | عمومی مہارت |

Admin CRUD (in Module 4 tools): create, edit, disable (soft delete — existing jobs keep their category reference).

---

## 2. Posting a Job (Customer)

### 2.1 Job Fields (FR-07, FR-08)
| Field | Notes |
|---|---|
| Category | Required, from catalog |
| Title | e.g. "AC not cooling" |
| Description | Details of the problem |
| Images (up to several) | Photos of the issue; uploaded via S3 (Module uploads) |
| Voice note | Optional 10s audio description (wavesurfer.js recorder) |
| Location | Picked on map (pin) + address text; lat/lng stored with PostGIS |
| Preferred Visit Time | Date/time window |
| Budget | Estimated range, e.g. "Rs. 2,000–3,000" (`estimated_budget`) |
| Urgency | `low` / `normal` / `high` / `emergency` — default `normal` |

### 2.2 Posting UX
Two accepted designs exist in the docs — pick per final design decision:
1. **One scrollable card** ("Post a New Job": category, title, desc, budget min/max, location, photo upload, urgency chips, [Post Job] button) — prompt.md.
2. **Multi-step wizard** (Service → Problem → Media → Location → Preferred visit → Review & Post) — design-prompt.md.

Either way the POST creates a job in state `open` with a **unique job ID**, stores the record, and returns a confirmation like *"Your job is posted. We are finding workers near you."*

### 2.3 Job Editing & Cancellation (FR-04 / SRS)
- Customer can **edit** a job when allowed (still `open`, no accepted offer).
- Customer can **cancel** a job when allowed — **before work starts** (i.e. from `open` → `repair_approved` inclusive). Cancellation requires reason + confirmation modal.
  - Workers with pending offers are notified "job cancelled".
  - The job record is **soft-deleted** (kept for history/analytics), `cancelled_at` set, `cancel_reason` stored.
- Rule from SRS: after cancellation, **no new quotes/offers accepted** and workflow actions restricted.

---

## 3. Worker Discovery & Matching (FR-05, FR-06, FR-09)

### 3.1 Customer side — Search & Filter Workers
Filters: **skill/category, rating, distance, experience, availability, verified**.
Worker cards show: photo, name, profession + city, rating + review count, Verified badge, distance ("📍 2 km away"), and CTA to view profile.

### 3.2 Customer view — Worker Profile (FR-06)
Header (photo, name, profession · city, Verified badge) → stats (⭐ rating, jobs done, years) → About → Services with prices → **[Book Now]** + **[Send Message]**.

### 3.3 Worker side — Nearby Jobs feed
Worker's "Available Jobs" list uses **matching** (not global browse):
- Match on: worker's **skill categories** (`skills && ARRAY[:categoryId]`), **service area/radius**, **verified** status (where required), **available** status.
- Ranked: **nearest first, best rating first**, within radius, capped (LIMIT 50).
- Job cards show: category + title, description + playable voice note, photos, distance + **approximate area pin** (exact street hidden until a visit is confirmed), preferred time window, urgency tag.

### 3.4 Nearby Worker Location Engine
- Job has `location GEOMETRY(POINT,4326)`; PostGIS GiST index.
- Worker locations cached in Redis: `worker:location:{userId}` updated every ~30s while the worker has the app open; geo-indexed at `nearby:workers:{city}`.
- Radius query via PostGIS `ST_DWithin` (see query in 9.3).
- Fallback: if Redis is down, read last-known location from DB (Module 4 availability rules).

### 3.5 Matching event flow
```
Customer posts job
  → Backend validates + stores job (state = open)
  → Search/Matching finds eligible nearby workers
  → Notifications (Module 4) pushes batch "New job near you!" to those workers
  → Workers open job details and decide to offer
```

---

## 4. Offers (FR-09, FR-10, FR-15)

### 4.1 Worker submits an offer
| Field | Notes |
|---|---|
| visit_charge | Required. The Stage-1 fee to come and inspect |
| estimated_repair_cost | Optional rough range ("Rs. 1,500–2,500 pending inspection") |
| message | Short note ("Licensed plumber, 8 yrs, can come 4 PM today") |

**Rules:**
- **One offer per worker per job** (`UNIQUE(job_id, worker_id)` → duplicate returns `OFFER_DUPLICATE` 409).
- Worker can **withdraw** only while offer status is `pending`.
- Customer gets a push + in-app "A worker sent you an offer!" notification.
- Job state flips `open → offers_received` on first offer.

### 4.2 Customer reviews & selects
Offer cards show: worker photo, name, profession, rating, Verified badge, **Visit / Work / Total** breakdown with the Total highlighted (Orange), **[Accept Offer]** + View profile.

### 4.3 Accepting / rejecting (FR-10)
- `PUT /offers/:id/accept` → offer status `accepted`, **all other pending offers auto-`rejected`**, job → `offer_accepted`.
- `PUT /offers/:id/reject` → offer `rejected`.
- **Only one active confirmed booking per job** (business rule; second selection rejected).

### 4.4 On acceptance, three things happen at once (FR-15)
1. Customer & worker are matched (`worker_assigned`).
2. A **chat room** is opened automatically (Module 4).
3. Customer's **exact address + phone** are revealed, and a **visit is scheduled** into the worker's Upcoming Visits.

---

## 5. Visit Negotiation (the "Two-Stage Pricing", Stage 1)

The platform uses **two-stage pricing**:

> **Stage 1 — Visit Fee:** paid/agreed for coming to inspect and diagnose.
> **Stage 2 — Repair Fee:** diagnosed on-site, negotiated with itemized parts/labor breakdown, and explicitly approved before any repair begins.

### 5.1 Visit-charge negotiation
When a customer counters the visit fee, the worker sees an interactive banner with three buttons:
- **Accept Rs. X** → visit fee locked at the agreed amount.
- **Counter-Offer** → worker enters a new amount.
- **Decline** → negotiation ends.

Every back-and-forth is stored (`negotiation_history` style JSON on visits/offers) so the whole conversation is visible later if there is a problem (FR-15/audit).

---

## 6. The Visit (scheduled, travel, arrival, inspection)

### 6.1 Scheduling
- Visit must be scheduled within **48 hours of offer acceptance** (configurable).
- Lives in the worker's **Upcoming Visits**; reschedule endpoint exists.

### 6.2 Visit statuses
`scheduled → in_progress → completed → cancelled / no_show`

### 6.3 Travel — Live Tracking
- Worker taps **"Start Visit"** → job `visit_in_progress` states / worker `worker_on_the_way` update.
- Customer sees the worker's **live location on a map + notification "Worker is heading to your location."** (30s GPS pings → `location_tracking` table).
- Worker taps **"I've Arrived"** → `arrived` / visit `in_progress`.

> ⚠️ **Arrival is a crit-escape in Module 3 too** — for the finalized commission model (10% of the visit charge) the **Arrive** press IS the commission trigger.

### 6.4 Inspection
Worker taps **"Start Inspection"** and enters:
- **Diagnostic summary** (e.g. "Cracked 1-inch PVC elbow joint behind wall").
- **Inspection photos**.
- **Itemized repair estimate**:
  - Parts/Materials: Rs. 1,200
  - Labor/Service: Rs. 1,500
  - Inspection/Visit: Rs. 285
  - **Total estimated cost:** Rs. 2,985
- Submits → job `visit_completed → inspection_done`; customer notified "Inspection complete. Price coming soon."

### 6.5 No-shows & arrival problems (edge cases)
| Edge case | Handling |
|---|---|
| Customer no-show / unreachable | Worker reports "Customer Unavailable" after waiting **15 minutes**; admin logs incident, protects worker's cancellation rating |
| Customer cancels on the spot at arrival | Visit fee commission already triggered in Model A → refund policy is a documented open question (see Module 3 risks) |
| Worker claims arrival without arriving | Event log + admin review; reliability scoring (no-show tracking for workers) |

---

## 7. Repair: Estimate, Negotiation & Approval (Stage 2)

### 7.1 Estimate
Worker's estimate: `description`, `amount`, `items_breakdown` (JSONB list of parts/labour/other), and `negotiation_history` (JSONB array of `{by, amount, note, timestamp}`).

### 7.2 Negotiation (FR-15 + worker workflow MVP)
- Customer can **Approve Estimate**, **Counter-Offer**, or **Reject** (`/repairs/:id/counter`, `/repairs/:id/accept`, `/repairs/:id/reject`).
- **Max 5 rounds of negotiation** (configurable). After the max, either accept the last offer or cancel.
- Behind the scenes every round is appended to `negotiation_history`.

Example history:
```
worker 8000  "Parts + labor for pipe replacement"   09-01 10:00
customer 6000  "Too high, can we reduce?"            09-01 10:30
worker 7000  "Final offer with discount"             09-01 11:00
```

### 7.3 Approval & the "safety lock"
- Customer taps **"Approve Repair"** → job `repair_approved`.
- **Safety lock:** the app warns the worker: *"Do not commence work until customer has approved the repair price."* Workers cannot start repairs before explicit approval (golden rule of the platform).

### 7.4 Repair execution
| Action | Job state |
|---|---|
| Worker taps **"Start Repair"** | `in_progress` |
| Worker performs the work, takes **"After" photos** | — |
| Worker taps **"Mark Repair Complete"** | `completed` |

### 7.5 Scope expansion on-site (variation quote)
If unexpected damage is discovered mid-repair, the worker submits an **"Add-on / Variation Quote"** that requires the customer's in-app approval **before continuing**. Without approval, no extra charge.

### 7.6 Total bill at completion
```
Visit/Inspection fee (agreed)
+ Repair fee (approved)
= TOTAL → shown in an invoice breakdown for payment (Module 3)
```

---

## 8. Job State Machine (FR-11)

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
                           │ payment (Module 3)
                    ┌──────▼──────────┐
                    │      paid        │
                    └──────┬──────────┘
                           │ review (Module 4)
                    ┌──────▼──────────┐
                    │    reviewed      │
                    └─────────────────┘

       cancelled ← from: open → repair_approved (customer cancel)
       disputed  ← from: in_progress or completed
```

Rules:
- **State transitions are enforced by the backend state machine** — invalid transitions rejected (`JOB_INVALID_STATE`).
- Only certain roles can trigger specific transitions.
- Every state change **emits an event** → notifications + real-time dashboards (Module 4) and, where relevant, Module 3 triggers.
- Cancelled jobs are **soft-deleted** (data preserved).

---

## 9. Database & Search (This Module's Part)

### 9.1 Tables
- `service_categories` (see §1)
- `service_requests` (jobs) — full column set incl. `location GEOMETRY`, `status CHECK` list, `urgency`, `estimated_budget`, `selected_worker_id`, `cancel_reason`, `cancelled_at`, `completed_at`. PostGIS GiST on `location`; indexes on customer/category/status/(city,area)/created_at.
- `job_offers` — `visit_charge`, `estimated_repair_cost`, `message`, `status` (pending/accepted/rejected/withdrawn), `UNIQUE(job_id, worker_id)`.
- `visits` — `scheduled_date`, `actual_date`, `status` (scheduled/in_progress/completed/cancelled/no_show), `visit_notes`, `images[]`.
- `repair_estimates` — `description`, `amount`, `items_breakdown JSONB`, `status` (proposed/countered/accepted/rejected), `negotiation_history JSONB`.
- `location_tracking` — time-series GPS history, **monthly partitioned by `recorded_at`**, auto-clean >90 days.
- `job_images`, `job_timeline_events` — media + every important action captured (FR-15).

### 9.2 Redis keys used here
| Key | Purpose |
|---|---|
| `worker:location:{userId}` | Fast last-known location (30s heartbeat) |
| `nearby:workers:{city}` | Geo-indexed worker positions |
| `job:offers:{jobId}` | Cached offer count (Sorted Set) |
| Search result caches | 30s TTL |

### 9.3 Nearby-worker query (PostGIS)
```sql
SELECT u.id, u.name, u.avatar_url, wp.rating_avg, wp.skills,
       ST_Distance(wp.location::geography,
                   ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) AS distance_meters
FROM users u
JOIN worker_profiles wp ON wp.user_id = u.id
WHERE u.is_active = true
  AND wp.is_verified = true
  AND wp.is_available = true
  AND wp.skills && ARRAY[:categoryId]
  AND ST_DWithin(wp.location::geography,
                 ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                 :radiusMeters)
ORDER BY distance_meters ASC
LIMIT 50;
```
Requires **GiST index** on `worker_profiles.location`.

### 9.4 Text search
- PostgreSQL full-text (`tsvector` + GIN on generated `search_vector` column) for MVP; optional **Elasticsearch** for advanced faceted + text+geo search later (search results cached in Redis 30s).

---

## 10. Backend Endpoints (NestJS)

`src/modules/jobs`, `offers`, `visits`, `repair`, `location`, `search`, `uploads`, `categories`:

| Function | Method | Endpoint |
|---|---|---|
| createJob | POST | `/api/v1/jobs` |
| getJob | GET | `/api/v1/jobs/:id` |
| getMyJobs | GET | `/api/v1/jobs/my` |
| getAvailableJobs | GET | `/api/v1/jobs/available` (nearby open, worker) |
| updateJobStatus | PUT | `/api/v1/jobs/:id/status` |
| cancelJob | PUT | `/api/v1/jobs/:id/cancel` |
| updateJobImages | PUT | `/api/v1/jobs/:id/images` |
| searchJobs/searchWorkers | GET | `/api/v1/search/jobs`, `/api/v1/search/workers` |
| submitOffer | POST | `/api/v1/jobs/:jobId/offers` |
| getJobOffers | GET | `/api/v1/jobs/:jobId/offers` |
| getMyOffers | GET | `/api/v1/offers/my` |
| acceptOffer / rejectOffer | PUT | `/api/v1/offers/:id/accept` / `/api/v1/offers/:id/reject` |
| withdrawOffer | PUT | `/api/v1/offers/:id/withdraw` |
| scheduleVisit | POST | `/api/v1/visits` |
| updateVisitStatus | PUT | `/api/v1/visits/:id/status` |
| addInspectionNotes | PUT | `/api/v1/visits/:id/inspection` |
| getUpcomingVisits | GET | `/api/v1/visits/upcoming` |
| rescheduleVisit | PUT | `/api/v1/visits/:id/reschedule` |
| createEstimate | POST | `/api/v1/visits/:visitId/estimate` |
| counterOffer | PUT | `/api/v1/repairs/:id/counter` |
| acceptEstimate / rejectEstimate | PUT | `/api/v1/repairs/:id/accept` / `:id/reject` |
| findNearbyWorkers | GET | `/api/v1/location/nearby?lat&lng&radius&category` |
| updateWorkerLocation | PUT | `/api/v1/users/location` |
| uploadImage/voice/document | POST | `/api/v1/uploads/image` / `voice` / `document` |
| geocode/reverse | — | `/api/v1/location/geocode`, `/api/v1/location/reverse` |

**Inter-module events emitted here:** `job.created` (notify + index), `job.statusChanged`, `offer.submitted`, `offer.accepted` (open chat + schedule visit), `visit.completed` (trigger repair), `repair.approved` (job → in_progress), `payment.completed` (job → paid, allow reviews).

---

## 11. Frontend Screens (This Module)

### Customer
| Screen | Description |
|---|---|
| Dashboard | Active jobs, pending offers, upcoming visits, spent; "Post a New Job" |
| Post a Job (card or wizard) | Fields from §2.2; inline validation ("Please select a service category.") |
| Job Details + Timeline | Dynamic vertical timeline driven by job state |
| Worker Offers | Offer cards with Accept / View / Counter |
| Worker Profile (view) | §3.2 |
| Visit Negotiation | Counter-offer UI on visit fee |
| Live Tracking | Map, ETA, Arrived notification |
| Inspection Result | Diagnosis, itemized estimate, Approve / Counter / Reject |
| Repair Approval | Total = visit + repair; Approve button |
| My Jobs / History | Past + active jobs with status filters |
| **Emergency Service page** | ⚠️ orange-themed (only screen that breaks visual calm), big category tiles, "N workers available now", **Call Now** (pulsing orange) |

### Worker
| Screen | Description |
|---|---|
| Dashboard | Available jobs, pending requests, done, earned |
| Nearby Jobs | Job cards: category, title, desc, voice note player, photos, distance, urgency tag, preferred time |
| Job Details | Full problem + address window + offer form |
| Send Offer | Visit charge, estimated repair range, message |
| My Offers | Statuses: sent / viewed / countered / accepted / rejected / withdrawn |
| Upcoming Visits | Calendar/schedule; Start Visit action |
| Active Job Tracker | Start Visit → I've Arrived → Start Inspection (photos + breakdown) → Start Repair → Mark Complete |
| Completed Jobs | Archive with customer reviews |

### Frontend libraries for this module
`react-hook-form` + `zod` (job wizard), `@tanstack/react-query` (feeds/optimistic offers), `zustand` (draft wizard state), `mapbox-gl`/`react-map-gl` (pin, radius, live tracking), `socket.io-client` (live status), `wavesurfer.js` (voice notes), `browser-image-compression` (compress before upload), `sonner` (toasts on offers/status), `vaul` (bottom sheets for offering/countering).

---

## 12. Risks & Open Questions (from platform-questions-and-risks)
| Question | Where answered |
|---|---|
| Multiple workers arrive for one job → multiple fees | Model decisions in Module 3; cancellation/refund policy is open |
| Worker arrives, problem different than described | Documented as open business rule (Module 3 risks); visit fee still applies |
| Fake jobs wasting worker time | Admin flagging + dispute (Module 4); availability gate via wallet (-500) in Module 3 |
| Price gouging after arrival | Two-stage pricing prevents it: repair price must be approved before work |
| Wrong location provided | Location picker + exact address only revealed after visit confirmed; disputes handle discrepancies |

---

## 13. Acceptance Criteria (MVP)
- [ ] Customer posts a full job (fields §2.1) → state `open`, unique ID, confirmation shown.
- [ ] Only relevant, verified, available workers within radius receive/match the job (FR-09).
- [ ] Worker sends a visit offer; customer accepts, rejects, or counters; one offer per worker per job enforced.
- [ ] Accepting an offer auto-rejects the rest and opens the chat (Module 4).
- [ ] Visit scheduled → live tracking → arrival → inspection with itemized estimate (two-stage pricing).
- [ ] Repair negotiation works with max-5 rounds; approval locks the total; safety lock prevents unapproved work.
- [ ] Job progresses through the full state machine: open → … → reviewed, with invalid transitions rejected.
- [ ] Cancellation allowed only pre-repair-start; record preserved; workers notified.
- [ ] Every important action is logged (FR-15).
- [ ] Empty states ("No active jobs yet.") guide users on every list screen.