# ER Diagram — Home Services Platform (MERN Web)

**Author:** Shafqat Ullah  
**Document Type:** Entity-Relationship Diagram  
**Version:** 2.0  
**Date:** September 2, 2026  
**Status:** Draft — Pending Team Review

> **Note:** This models the database for a **MERN-stack website** (MongoDB). The "tables/columns" below map to MongoDB **collections** and **document fields**. MongoDB uses flexible JSON documents, so arrays and nested objects (e.g., `skills[]`, `images[]`, `negotiation_history`) are stored natively.

---

## 1. Overview

This document defines all entities, their attributes, and relationships for the Home Services Platform database, implemented with **MongoDB + Mongoose**.

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

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| phone | String | UNIQUE, NOT NULL | Phone number (E.164 format) |
| email | String | UNIQUE, nullable | Email address |
| name | String | NOT NULL | Full name |
| role | String (enum) | NOT NULL | `customer`, `worker`, `admin`, `super_admin` |
| avatar_url | String | nullable | Profile picture URL |
| location | GeoJSON Point | nullable | Last known location `{ type:"Point", coordinates:[lng,lat] }` |
| is_active | Boolean | DEFAULT true | Account active status |
| is_verified | Boolean | DEFAULT false | Phone verified |
| push_sub | Object | nullable | Web Push subscription (endpoint + keys) |
| last_login_at | Date | | Last login timestamp |
| created_at | Date | NOT NULL | Account creation |
| updated_at | Date | NOT NULL | Last update |

**Indexes:**
- `phone` (unique)
- `role`
- `location` — GeoJSON `2dsphere` index for geo queries
- `is_active`

---

### 3.2 WorkerProfile

Extended profile for workers with skills and availability.

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| user_id | ObjectId | PK (ref User) | References user |
| skills | Array<String> | NOT NULL | Array of skill/category IDs |
| experience_years | Number | DEFAULT 0 | Years of experience |
| bio | String | nullable | Worker bio/description |
| hourly_rate | Number | nullable | Preferred hourly rate |
| is_verified | Boolean | DEFAULT false | Admin-verified status |
| verification_doc_url | String | nullable | ID document URL |
| rating_avg | Number | DEFAULT 0 | Average rating |
| total_jobs | Number | DEFAULT 0 | Completed jobs count |
| is_available | Boolean | DEFAULT true | Currently accepting jobs |
| service_radius_km | Number | DEFAULT 10 | Max distance willing to travel |
| verified_at | Date | nullable | When verified by admin |
| created_at | Date | NOT NULL | Profile creation |
| updated_at | Date | NOT NULL | Last update |

**Indexes:**
- `skills`
- `is_verified`
- `is_available`
- `rating_avg` (desc)

---

### 3.3 CustomerProfile

Extended profile for customers.

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| user_id | ObjectId | PK (ref User) | References user |
| default_address | String | nullable | Preferred address |
| total_jobs_posted | Number | DEFAULT 0 | Total jobs created |
| created_at | Date | NOT NULL | Profile creation |
| updated_at | Date | NOT NULL | Last update |

---

### 3.4 ServiceCategory

Categories of services offered on the platform.

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| name | String | NOT NULL | Category name (English) |
| name_urdu | String | nullable | Category name (Urdu) |
| description | String | nullable | Category description |
| icon_url | String | nullable | Category icon |
| parent_id | ObjectId | ref self, nullable | Parent category (for sub-categories) |
| is_active | Boolean | DEFAULT true | Category active |
| sort_order | Number | DEFAULT 0 | Display order |
| created_at | Date | NOT NULL | Creation time |

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

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| customer_id | ObjectId | ref User, NOT NULL | Customer who posted |
| category_id | ObjectId | ref ServiceCategory, NOT NULL | Service type |
| title | String | NOT NULL | Job title |
| description | String | nullable | Detailed description |
| voice_note_url | String | nullable | Voice note URL |
| images | Array<String> | DEFAULT [] | Array of image URLs |
| location | GeoJSON Point | NOT NULL | Job location `{ type:"Point", coordinates:[lng,lat] }` |
| address | String | NOT NULL | Full address |
| city | String | NOT NULL | City name |
| area | String | nullable | Area / locality |
| status | String (enum) | NOT NULL | Job status (see state machine) |
| urgency | String (enum) | DEFAULT 'normal' | `low`, `normal`, `high`, `emergency` |
| estimated_budget | Number | nullable | Customer's budget estimate |
| selected_worker_id | ObjectId | ref User, nullable | Worker selected by customer |
| created_at | Date | NOT NULL | Job creation |
| updated_at | Date | NOT NULL | Last update |
| completed_at | Date | nullable | Completion timestamp |
| cancelled_at | Date | nullable | Cancellation timestamp |

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
- `location` — GeoJSON `2dsphere` index (nearby worker matching)
- `created_at` (desc)
- `{ city, area }`

---

### 3.6 JobOffer

Offers made by workers for a specific job.

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| job_id | ObjectId | ref ServiceRequest, NOT NULL | Target job |
| worker_id | ObjectId | ref User, NOT NULL | Offering worker |
| visit_charge | Number | NOT NULL | Proposed visit/inspection fee |
| message | String | nullable | Message to customer |
| estimated_repair_cost | Number | nullable | Rough repair estimate |
| status | String (enum) | NOT NULL | `pending`, `accepted`, `rejected`, `withdrawn` |
| created_at | Date | NOT NULL | Offer creation |
| updated_at | Date | NOT NULL | Last update |

**Constraints:**
- Compound unique `{ job_id, worker_id }` — one offer per worker per job

**Indexes:**
- `job_id`
- `worker_id`
- `status`

---

### 3.7 Visit

Scheduled visit/inspection after offer acceptance.

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| job_id | ObjectId | ref ServiceRequest, NOT NULL | Related job |
| worker_id | ObjectId | ref User, NOT NULL | Visiting worker |
| offer_id | ObjectId | ref JobOffer, NOT NULL | Accepted offer |
| scheduled_date | Date | NOT NULL | Planned visit date/time |
| actual_date | Date | nullable | Actual visit time |
| status | String (enum) | NOT NULL | `scheduled`, `in_progress`, `completed`, `cancelled`, `no_show` |
| visit_notes | String | nullable | Worker's notes after inspection |
| images | Array<String> | DEFAULT [] | Inspection images |
| created_at | Date | NOT NULL | Creation |
| updated_at | Date | NOT NULL | Last update |

**Indexes:**
- `job_id`
- `worker_id`
- `scheduled_date`
- `status`

---

### 3.8 RepairEstimate

Repair cost estimate and negotiation after inspection.

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| visit_id | ObjectId | ref Visit, NOT NULL | Related visit |
| worker_id | ObjectId | ref User, NOT NULL | Estimating worker |
| description | String | NOT NULL | Repair description |
| amount | Number | NOT NULL | Proposed amount |
| items_breakdown | Array<Object> | DEFAULT [] | Itemized cost breakdown |
| status | String (enum) | NOT NULL | `proposed`, `countered`, `accepted`, `rejected` |
| negotiation_history | Array<Object> | DEFAULT [] | Array of counter-offers |
| created_at | Date | NOT NULL | Creation |
| updated_at | Date | NOT NULL | Last update |

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

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| job_id | ObjectId | ref ServiceRequest, NOT NULL | Related job |
| customer_id | ObjectId | ref User, NOT NULL | Payer |
| worker_id | ObjectId | ref User, NOT NULL | Payee |
| amount | Number | NOT NULL | Total amount |
| platform_fee | Number | NOT NULL | Platform commission |
| worker_payout | Number | NOT NULL | Worker's share |
| method | String (enum) | NOT NULL | `jazzcash`, `easypaisa`, `stripe`, `cash`, `card` |
| status | String (enum) | NOT NULL | `pending`, `processing`, `completed`, `failed`, `refunded` |
| gateway_ref | String | nullable | Payment gateway reference |
| gateway_response | Object | nullable | Raw gateway response |
| paid_at | Date | nullable | Payment completion time |
| refunded_at | Date | nullable | Refund time |
| created_at | Date | NOT NULL | Record creation |
| updated_at | Date | NOT NULL | Last update |

**Indexes:**
- `job_id`
- `customer_id`
- `worker_id`
- `status`
- `gateway_ref`

---

### 3.10 Review

Post-job reviews by customers and workers.

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| job_id | ObjectId | ref ServiceRequest, NOT NULL | Related job |
| reviewer_id | ObjectId | ref User, NOT NULL | Who wrote the review |
| reviewee_id | ObjectId | ref User, NOT NULL | Who is being reviewed |
| rating | Number | NOT NULL | 1-5 rating |
| comment | String | nullable | Review text |
| images | Array<String> | DEFAULT [] | Review images |
| is_visible | Boolean | DEFAULT true | Visibility flag |
| created_at | Date | NOT NULL | Review creation |

**Constraints:**
- Rating between 1 and 5
- Unique `{ job_id, reviewer_id }` — one review per person per job

**Indexes:**
- `job_id`
- `reviewee_id`
- `rating`

---

### 3.11 Notification

In-app and Web Push notification records.

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| user_id | ObjectId | ref User, NOT NULL | Recipient |
| type | String | NOT NULL | Notification type |
| title | String | NOT NULL | Notification title |
| body | String | NOT NULL | Notification body |
| data | Object | DEFAULT {} | Additional data (deep links, IDs) |
| channel | String (enum) | NOT NULL | `push`, `sms`, `in_app`, `email` |
| is_read | Boolean | DEFAULT false | Read status |
| sent_at | Date | NOT NULL | When sent |
| read_at | Date | nullable | When read |
| created_at | Date | NOT NULL | Record creation |

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

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| job_id | ObjectId | ref ServiceRequest, NOT NULL | Related job |
| customer_id | ObjectId | ref User, NOT NULL | Customer participant |
| worker_id | ObjectId | ref User, NOT NULL | Worker participant |
| last_message | String | nullable | Preview of last message |
| last_message_at | Date | nullable | Timestamp of last message |
| is_active | Boolean | DEFAULT true | Conversation active |
| created_at | Date | NOT NULL | Creation |

**Message:**

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| conversation_id | ObjectId | ref Conversation, NOT NULL | Parent conversation |
| sender_id | ObjectId | ref User, NOT NULL | Message sender |
| text | String | nullable | Message text |
| image_url | String | nullable | Attached image |
| voice_url | String | nullable | Voice message |
| is_read | Boolean | DEFAULT false | Read status |
| created_at | Date | NOT NULL | Message time |

**Indexes:**
- `conversation_id`
- `created_at` (desc)

---

### 3.13 Dispute

Dispute/complaint filed for a job.

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| job_id | ObjectId | ref ServiceRequest, NOT NULL | Related job |
| filed_by | ObjectId | ref User, NOT NULL | Who filed |
| reason | String | NOT NULL | Dispute reason |
| description | String | NOT NULL | Detailed description |
| evidence_urls | Array<String> | DEFAULT [] | Supporting evidence |
| status | String (enum) | NOT NULL | `open`, `under_review`, `resolved`, `escalated` |
| resolution | String | nullable | Resolution description |
| resolved_by | ObjectId | ref User, nullable | Admin who resolved |
| created_at | Date | NOT NULL | Filing time |
| resolved_at | Date | nullable | Resolution time |

---

### 3.14 Location (Tracking Log)

Historical location records for workers (for tracking during visits). In a web app, this is populated only when the worker is actively using the browser with location permission.

| Field | Mongo Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | PK | Unique identifier |
| user_id | ObjectId | ref User, NOT NULL | Worker being tracked |
| job_id | ObjectId | ref ServiceRequest, nullable | Active job being tracked for |
| location | GeoJSON Point | NOT NULL | `{ type:"Point", coordinates:[lng,lat] }` |
| accuracy | Number | nullable | GPS accuracy in meters |
| recorded_at | Date | NOT NULL | When recorded |

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
