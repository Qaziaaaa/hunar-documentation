# ER Diagram — Fixora (Home Services Platform)

**Author:** Shafqat Ullah  
**Document Type:** Entity-Relationship Diagram  
**Version:** 3.0  
**Date:** September 2, 2026  
**Status:** Draft — Pending Team Review

> **Note:** This models the database for the **Fixora** stack (**PostgreSQL + PostGIS**). The "tables/columns" map to PostgreSQL **relational tables**. Arrays and nested objects (e.g., `skills[]`, `images[]`, `negotiation_history`) are stored as PostgreSQL array / JSONB types.

---

## 1. Overview

This document defines all entities, their attributes, and relationships for the Fixora (Home Services Platform) database, implemented with **PostgreSQL + PostGIS** (via Prisma/TypeORM in NestJS).

---

## 2. ER Diagram (Text Representation)

```
┌─────────────────┐       ┌─────────────────┐
│      USER        │       │ WORKER_PROFILE   │
│─────────────────│       │─────────────────│
│ id (PK)         │──1:1──│ user_id (PK,FK) │
│ phone           │       │ skills[]        │
│ email           │       │ experience_years│
│ name            │       │ bio             │
│ role            │       │ hourly_rate     │
│ avatar_url      │       │ is_verified     │
│ latitude        │       │ rating_avg      │
│ longitude       │       │ total_jobs      │
│ is_active       │       │ is_available    │
│ is_verified     │       │ service_radius  │
│ created_at      │       │ verified_at     │
│ updated_at      │       │ created_at      │
└────────┬────────┘       └─────────────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│CUSTOMER_PROFILE  │
│─────────────────│
│ user_id (PK,FK) │
│ default_address │
│ total_jobsPosted│
│ created_at      │
└─────────────────┘

┌─────────────────┐       ┌─────────────────────┐
│SERVICE_CATEGORY  │       │  SERVICE_REQUEST     │
│─────────────────│       │  (Job / Listing)     │
│ id (PK)         │──1:N──│─────────────────────│
│ name            │       │ id (PK)             │
│ name_urdu       │       │ customer_id (FK)    │
│ icon_url        │       │ category_id (FK)    │
│ parent_id (FK)  │       │ title               │
│ is_active       │       │ description         │
│ sort_order      │       │ voice_note_url      │
│ created_at      │       │ images[]            │
└─────────────────┘       │ latitude            │
                          │ longitude           │
                          │ address             │
                          │ city                │
                          │ area                │
                          │ status              │
                          │ urgency             │
                          │ estimated_budget    │
                          │ created_at          │
                          │ updated_at          │
                          └──────────┬──────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │ 1:N            │ 1:1            │ 1:N
                    ▼                ▼                ▼
          ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐
          │  JOB_OFFER   │  │    VISIT     │  │ REPAIR_ESTIMATE  │
          │─────────────│  │──────────────│  │──────────────────│
          │ id (PK)     │  │ id (PK)      │  │ id (PK)          │
          │ job_id (FK) │  │ job_id (FK)  │  │ visit_id (FK)    │
          │ worker_id   │  │ worker_id(FK)│  │ worker_id (FK)   │
          │ visit_charge│  │ scheduled_   │  │ description      │
          │ message     │  │   date       │  │ amount           │
          │ status      │  │ actual_date  │  │ items_breakdown[]│
          │ created_at  │  │ status       │  │ status           │
          │ updated_at  │  │ notes        │  │ negotiation_     │
          └─────────────┘  │ created_at   │  │   history[]      │
                           └──────────────┘  │ created_at       │
                                             └──────────────────┘
                                                    │
                                                    │ 1:N
                                                    ▼
                                          ┌──────────────────┐
                                          │   PAYMENT         │
                                          │──────────────────│
                                          │ id (PK)          │
                                          │ job_id (FK)      │
                                          │ customer_id (FK) │
                                          │ worker_id (FK)   │
                                          │ amount           │
                                          │ platform_fee     │
                                          │ worker_payout    │
                                          │ method           │
                                          │ status           │
                                          │ gateway_ref      │
                                          │ paid_at          │
                                          │ created_at       │
                                          └──────────────────┘

┌─────────────────┐
│     REVIEW       │
│─────────────────│
│ id (PK)         │
│ job_id (FK)     │
│ reviewer_id(FK) │
│ reviewee_id(FK) │
│ rating (1-5)    │
│ comment         │
│ images[]        │
│ created_at      │
└─────────────────┘

┌─────────────────┐       ┌──────────────────┐
│  NOTIFICATION    │       │   CONVERSATION    │
│─────────────────│       │──────────────────│
│ id (PK)         │       │ id (PK)          │
│ user_id (FK)    │       │ job_id (FK)      │
│ type            │       │ customer_id (FK) │
│ title           │       │ worker_id (FK)   │
│ body            │       │ last_message     │
│ data (JSON)     │       │ last_message_at  │
│ is_read         │       │ created_at       │
│ channel         │       └────────┬─────────┘
│ sent_at         │                │ 1:N
│ created_at      │                ▼
└─────────────────┘       ┌──────────────────┐
                          │     MESSAGE       │
                          │──────────────────│
                          │ id (PK)          │
                          │ conversation_id  │
                          │ sender_id (FK)   │
                          │ text             │
                          │ image_url        │
                          │ voice_url        │
                          │ is_read          │
                          │ created_at       │
                          └──────────────────┘

┌─────────────────┐       ┌──────────────────┐
│   DISPUTE        │       │    LOCATION      │
│─────────────────│       │   (Log Table)    │
│ id (PK)         │       │──────────────────│
│ job_id (FK)     │       │ id (PK)          │
│ filed_by (FK)   │       │ user_id (FK)     │
│ reason          │       │ latitude         │
│ description     │       │ longitude        │
│ status          │       │ recorded_at      │
│ resolved_by(FK) │       └──────────────────┘
│ resolution      │
│ created_at      │
│ resolved_at     │
└─────────────────┘
```

---

## 3. Entity Definitions

### 3.1 User

The core authentication and identity entity.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| phone | TEXT | UNIQUE, NOT NULL | Phone NUMERIC (E.164 format) |
| email | TEXT | UNIQUE, nullable | Email address |
| name | TEXT | NOT NULL | Full name |
| role | TEXT (enum) | NOT NULL | `customer`, `worker`, `admin`, `super_admin` |
| avatar_url | TEXT | nullable | Profile picture URL |
| location | POINT (PostGIS) | nullable | Last known location `{ type:"Point", coordinates:[lng,lat] }` |
| is_active | BOOLEAN | DEFAULT true | Account active status |
| is_verified | BOOLEAN | DEFAULT false | Phone verified |
| push_sub | JSONB | nullable | FCM token / push subscription (endpoint + keys) |
| last_login_at | TIMESTAMPTZ | | Last login timestamp |
| created_at | TIMESTAMPTZ | NOT NULL | Account creation |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |

**Indexes:**
- `phone` (unique)
- `role`
- `location` — PostGIS GiST index for geo queries
- `is_active`

---

### 3.2 WorkerProfile

Extended profile for workers with skills and availability.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| user_id | UUID | PK (ref User) | References user |
| skills | Array<TEXT> | NOT NULL | Array of skill/category IDs |
| experience_years | NUMERIC | DEFAULT 0 | Years of experience |
| bio | TEXT | nullable | Worker bio/description |
| hourly_rate | NUMERIC | nullable | Preferred hourly rate |
| is_verified | BOOLEAN | DEFAULT false | Admin-verified status |
| verification_doc_url | TEXT | nullable | ID document URL |
| rating_avg | NUMERIC | DEFAULT 0 | Average rating |
| total_jobs | NUMERIC | DEFAULT 0 | Completed jobs count |
| is_available | BOOLEAN | DEFAULT true | Currently accepting jobs |
| service_radius_km | NUMERIC | DEFAULT 10 | Max distance willing to travel |
| verified_at | TIMESTAMPTZ | nullable | When verified by admin |
| created_at | TIMESTAMPTZ | NOT NULL | Profile creation |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |

**Indexes:**
- `skills`
- `is_verified`
- `is_available`
- `rating_avg` (desc)

---

### 3.3 CustomerProfile

Extended profile for customers.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| user_id | UUID | PK (ref User) | References user |
| default_address | TEXT | nullable | Preferred address |
| total_jobs_posted | NUMERIC | DEFAULT 0 | Total jobs created |
| created_at | TIMESTAMPTZ | NOT NULL | Profile creation |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |

---

### 3.4 ServiceCategory

Categories of services offered on the platform.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| name | TEXT | NOT NULL | Category name (English) |
| name_urdu | TEXT | nullable | Category name (Urdu) |
| description | TEXT | nullable | Category description |
| icon_url | TEXT | nullable | Category icon |
| parent_id | UUID | ref self, nullable | Parent category (for sub-categories) |
| is_active | BOOLEAN | DEFAULT true | Category active |
| sort_order | NUMERIC | DEFAULT 0 | Display order |
| created_at | TIMESTAMPTZ | NOT NULL | Creation time |

**Pre-seeded categories:**
- Electrical (Electrician)
- Plumbing (Plumber)
- AC / Refrigeration
- Carpentry
- Painting
- Cleaning
- Masonry
- Pest Control
- General Handyman

---

### 3.5 ServiceRequest (Job)

The core job listing created by a customer.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| customer_id | UUID | ref User, NOT NULL | Customer who posted |
| category_id | UUID | ref ServiceCategory, NOT NULL | Service type |
| title | TEXT | NOT NULL | Job title |
| description | TEXT | nullable | Detailed description |
| voice_note_url | TEXT | nullable | Voice note URL |
| images | Array<TEXT> | DEFAULT [] | Array of image URLs |
| location | POINT (PostGIS) | NOT NULL | Job location `{ type:"Point", coordinates:[lng,lat] }` |
| address | TEXT | NOT NULL | Full address |
| city | TEXT | NOT NULL | City name |
| area | TEXT | nullable | Area / locality |
| status | TEXT (enum) | NOT NULL | Job status (see state machine) |
| urgency | TEXT (enum) | DEFAULT 'normal' | `low`, `normal`, `high`, `emergency` |
| estimated_budget | NUMERIC | nullable | Customer's budget estimate |
| selected_worker_id | UUID | ref User, nullable | Worker selected by customer |
| created_at | TIMESTAMPTZ | NOT NULL | Job creation |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| completed_at | TIMESTAMPTZ | nullable | Completion timestamp |
| cancelled_at | TIMESTAMPTZ | nullable | Cancellation timestamp |

**Job Status Enum:**
```
open → offers_received → offer_accepted → worker_assigned
→ visit_scheduled → visit_completed → inspection_done
→ repair_negotiating → repair_approved → in_progress
→ completed → paid → reviewed

cancelled (from any active state)
disputed (from in_progress or completed)
```

**Indexes:**
- `customer_id`
- `category_id`
- `status`
- `location` — PostGIS GiST index (nearby worker matching)
- `created_at` (desc)
- `{ city, area }`

---

### 3.6 JobOffer

Offers made by workers for a specific job.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| job_id | UUID | ref ServiceRequest, NOT NULL | Target job |
| worker_id | UUID | ref User, NOT NULL | Offering worker |
| visit_charge | NUMERIC | NOT NULL | Proposed visit/inspection fee |
| message | TEXT | nullable | Message to customer |
| estimated_repair_cost | NUMERIC | nullable | Rough repair estimate |
| status | TEXT (enum) | NOT NULL | `pending`, `accepted`, `rejected`, `withdrawn` |
| created_at | TIMESTAMPTZ | NOT NULL | Offer creation |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |

**Constraints:**
- Compound unique `{ job_id, worker_id }` — one offer per worker per job

**Indexes:**
- `job_id`
- `worker_id`
- `status`

---

### 3.7 Visit

Scheduled visit/inspection after offer acceptance.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| job_id | UUID | ref ServiceRequest, NOT NULL | Related job |
| worker_id | UUID | ref User, NOT NULL | Visiting worker |
| offer_id | UUID | ref JobOffer, NOT NULL | Accepted offer |
| scheduled_date | TIMESTAMPTZ | NOT NULL | Planned visit date/time |
| actual_date | TIMESTAMPTZ | nullable | Actual visit time |
| status | TEXT (enum) | NOT NULL | `scheduled`, `in_progress`, `completed`, `cancelled`, `no_show` |
| visit_notes | TEXT | nullable | Worker's notes after inspection |
| images | Array<TEXT> | DEFAULT [] | Inspection images |
| created_at | TIMESTAMPTZ | NOT NULL | Creation |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |

**Indexes:**
- `job_id`
- `worker_id`
- `scheduled_date`
- `status`

---

### 3.8 RepairEstimate

Repair cost estimate and negotiation after inspection.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| visit_id | UUID | ref Visit, NOT NULL | Related visit |
| worker_id | UUID | ref User, NOT NULL | Estimating worker |
| description | TEXT | NOT NULL | Repair description |
| amount | NUMERIC | NOT NULL | Proposed amount |
| items_breakdown | JSONB | DEFAULT [] | Itemized cost breakdown |
| status | TEXT (enum) | NOT NULL | `proposed`, `countered`, `accepted`, `rejected` |
| negotiation_history | JSONB | DEFAULT [] | Array of counter-offers |
| created_at | TIMESTAMPTZ | NOT NULL | Creation |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |

**negotiation_history format:**
```json
[
  { "by": "customer|worker", "amount": 5000, "note": "...", "at": "2026-..." },
  { "by": "customer|worker", "amount": 4500, "note": "...", "at": "2026-..." }
]
```

---

### 3.9 Payment

Payment records for completed jobs.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| job_id | UUID | ref ServiceRequest, NOT NULL | Related job |
| customer_id | UUID | ref User, NOT NULL | Payer |
| worker_id | UUID | ref User, NOT NULL | Payee |
| amount | NUMERIC | NOT NULL | Total amount |
| platform_fee | NUMERIC | NOT NULL | Platform commission |
| worker_payout | NUMERIC | NOT NULL | Worker's share |
| method | TEXT (enum) | NOT NULL | `jazzcash`, `easypaisa`, `stripe`, `cash`, `card` |
| status | TEXT (enum) | NOT NULL | `pending`, `processing`, `completed`, `failed`, `refunded` |
| gateway_ref | TEXT | nullable | Payment gateway reference |
| gateway_response | JSONB | nullable | Raw gateway response |
| paid_at | TIMESTAMPTZ | nullable | Payment completion time |
| refunded_at | TIMESTAMPTZ | nullable | Refund time |
| created_at | TIMESTAMPTZ | NOT NULL | Record creation |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |

**Indexes:**
- `job_id`
- `customer_id`
- `worker_id`
- `status`
- `gateway_ref`

---

### 3.10 Review

Post-job reviews by customers and workers.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| job_id | UUID | ref ServiceRequest, NOT NULL | Related job |
| reviewer_id | UUID | ref User, NOT NULL | Who wrote the review |
| reviewee_id | UUID | ref User, NOT NULL | Who is being reviewed |
| rating | NUMERIC | NOT NULL | 1-5 rating |
| comment | TEXT | nullable | Review text |
| images | Array<TEXT> | DEFAULT [] | Review images |
| is_visible | BOOLEAN | DEFAULT true | Visibility flag |
| created_at | TIMESTAMPTZ | NOT NULL | Review creation |

**Constraints:**
- Rating between 1 and 5
- Unique `{ job_id, reviewer_id }` — one review per person per job

**Indexes:**
- `job_id`
- `reviewee_id`
- `rating`

---

### 3.11 Notification

In-app and FCM push notification records.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| user_id | UUID | ref User, NOT NULL | Recipient |
| type | TEXT | NOT NULL | Notification type |
| title | TEXT | NOT NULL | Notification title |
| body | TEXT | NOT NULL | Notification body |
| data | JSONB | DEFAULT {} | Additional data (deep links, IDs) |
| channel | TEXT (enum) | NOT NULL | `push`, `sms`, `in_app`, `email` |
| is_read | BOOLEAN | DEFAULT false | Read status |
| sent_at | TIMESTAMPTZ | NOT NULL | When sent |
| read_at | TIMESTAMPTZ | nullable | When read |
| created_at | TIMESTAMPTZ | NOT NULL | Record creation |

**Notification Types:**
- `job.new` — New job in area (for workers)
- `job.offer_received` — Worker sent offer (for customer)
- `job.offer_accepted` — Customer accepted offer (for worker)
- `job.offer_rejected` — Customer rejected offer (for worker)
- `visit.scheduled` — Visit date set
- `visit.reminder` — Visit reminder (24h before)
- `visit.completed` — Visit inspection done
- `repair.proposed` — Repair estimate sent
- `repair.negotiated` — Counter-offer received
- `repair.approved` — Customer approved repair
- `payment.completed` — Payment successful
- `review.received` — New review received
- `dispute.opened` — Dispute filed
- `dispute.resolved` — Dispute resolved
- `system.verification` — Verification status update

**Indexes:**
- `user_id`
- `is_read`
- `created_at` (desc)
- `type`

---

### 3.12 Conversation & Message

Chat between customer and worker for a specific job.

**Conversation:**

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| job_id | UUID | ref ServiceRequest, NOT NULL | Related job |
| customer_id | UUID | ref User, NOT NULL | Customer participant |
| worker_id | UUID | ref User, NOT NULL | Worker participant |
| last_message | TEXT | nullable | Preview of last message |
| last_message_at | TIMESTAMPTZ | nullable | Timestamp of last message |
| is_active | BOOLEAN | DEFAULT true | Conversation active |
| created_at | TIMESTAMPTZ | NOT NULL | Creation |

**Message:**

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| conversation_id | UUID | ref Conversation, NOT NULL | Parent conversation |
| sender_id | UUID | ref User, NOT NULL | Message sender |
| text | TEXT | nullable | Message text |
| image_url | TEXT | nullable | Attached image |
| voice_url | TEXT | nullable | Voice message |
| is_read | BOOLEAN | DEFAULT false | Read status |
| created_at | TIMESTAMPTZ | NOT NULL | Message time |

**Indexes:**
- `conversation_id`
- `created_at` (desc)

---

### 3.13 Dispute

Dispute/complaint filed for a job.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| job_id | UUID | ref ServiceRequest, NOT NULL | Related job |
| filed_by | UUID | ref User, NOT NULL | Who filed |
| reason | TEXT | NOT NULL | Dispute reason |
| description | TEXT | NOT NULL | Detailed description |
| evidence_urls | Array<TEXT> | DEFAULT [] | Supporting evidence |
| status | TEXT (enum) | NOT NULL | `open`, `under_review`, `resolved`, `escalated` |
| resolution | TEXT | nullable | Resolution description |
| resolved_by | UUID | ref User, nullable | Admin who resolved |
| created_at | TIMESTAMPTZ | NOT NULL | Filing time |
| resolved_at | TIMESTAMPTZ | nullable | Resolution time |

---

### 3.14 Location (Tracking Log)

Historical location records for workers (for tracking during visits). In a web app, this is populated only when the worker is actively using the browser with location permission.

| Field | SQL Type | Constraints | Description |
|---|---|---|---|
| _id | UUID | PK | Unique identifier |
| user_id | UUID | ref User, NOT NULL | Worker being tracked |
| job_id | UUID | ref ServiceRequest, nullable | Active job being tracked for |
| location | POINT (PostGIS) | NOT NULL | `{ type:"Point", coordinates:[lng,lat] }` |
| accuracy | NUMERIC | nullable | GPS accuracy in meters |
| recorded_at | TIMESTAMPTZ | NOT NULL | When recorded |

**Indexes:**
- `user_id`
- `job_id`
- `recorded_at` (desc)

> **Note:** This is a high-volume collection. Consider auto-deleting records older than 90 days.

---

## 4. Relationship Summary

| Relationship | Type | Description |
|---|---|---|
| User → WorkerProfile | 1:1 | One profile per worker user |
| User → CustomerProfile | 1:1 | One profile per customer user |
| ServiceCategory → ServiceRequest | 1:N | Category has many jobs |
| ServiceCategory → ServiceCategory | 1:N (self) | Parent → Sub-categories |
| User → ServiceRequest (as customer) | 1:N | Customer posts many jobs |
| ServiceRequest → JobOffer | 1:N | Job receives many offers |
| User → JobOffer (as worker) | 1:N | Worker makes many offers |
| ServiceRequest → Visit | 1:N | Job can have multiple visits |
| Visit → RepairEstimate | 1:N | Visit produces estimates |
| ServiceRequest → Payment | 1:1 | One payment per job |
| ServiceRequest → Review | 1:N | Multiple reviews per job |
| User → Review (as reviewer) | 1:N | User writes many reviews |
| User → Review (as reviewee) | 1:N | User receives many reviews |
| ServiceRequest → Conversation | 1:1 | One chat per job |
| Conversation → Message | 1:N | Many messages per conversation |
| ServiceRequest → Dispute | 0..1:1 | Optional dispute per job |
| User → Notification | 1:N | User receives many notifications |
| User → Location | 1:N | Worker location history |

---

## 5. Database Diagram (Simplified)

```
                        ┌──────────────────┐
                        │   User            │
                        └────────┬─────────┘
                    ┌────────────┼────────────────────┐
                    │            │                    │
             ┌──────▼──────┐ ┌──▼───────────┐ ┌─────▼──────────┐
             │WorkerProfile│ │CustomerProfile│ │   Notification  │
             └─────────────┘ └──────────────┘ └────────────────┘
                                       │
                                       │ posts
                                       ▼
┌────────────────┐    ┌─────────────────────────┐    ┌──────────────┐
│ServiceCategory │───►│    ServiceRequest        │◄───│   Location    │
└────────────────┘    │    (Job)                 │    │   (Tracking)  │
                      └────┬──────┬──────┬──────┘    └──────────────┘
                           │      │      │
              ┌────────────┘      │      └────────────┐
              │                   │                    │
       ┌──────▼──────┐    ┌──────▼──────┐    ┌───────▼──────┐
       │  JobOffer    │    │    Visit     │    │   Dispute    │
       └─────────────┘    └──────┬──────┘    └──────────────┘
                                 │
                          ┌──────▼──────┐
                          │RepairEstimate│
                          └─────────────┘

ServiceRequest ──────► Payment
ServiceRequest ──────► Review
ServiceRequest ──────► Conversation ───► Message
```

---

*Document prepared by Shafqat Ullah — Pending review by Qazi Farhan Ahmad (Team Lead)*
