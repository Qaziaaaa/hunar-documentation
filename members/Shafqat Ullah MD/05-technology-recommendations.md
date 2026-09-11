# Technology Recommendations — Fixora (Home Services Platform)

**Author:** Shafqat Ullah  
**Document Type:** Technology Stack Recommendations  
**Version:** 3.0  
**Date:** September 2, 2026  
**Status:** Draft — Pending Team Review

> **Note:** This document aligns with the team-approved **Fixora technology stack**: **Next.js + TypeScript + NestJS + PostgreSQL/PostGIS + Redis + Socket.IO + FCM + S3 + Maps + Payment Gateway/Ledger + Modular Monolith**. It is a **web application** (no separate mobile app).

---

## 1. Overview

This document recommends the complete technology stack for Fixora — a home-services marketplace where customers find verified professionals (plumbers, electricians, AC technicians, carpenters, etc.). Each technology is chosen to solve a specific Fixora problem, not just because it is popular.

---

## 2. Technology Stack Summary

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | Next.js (+ TypeScript) | 14+ |
| **Styling** | Tailwind CSS | 3.x |
| **Backend Framework** | NestJS (+ TypeScript) | 10+ |
| **Database** | PostgreSQL | 16 |
| **GIS Extension** | PostGIS | 3.4 |
| **Fast / Temporary Data** | Redis | 7.x |
| **Real-time** | Socket.IO | 4.x |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | — |
| **Media Storage** | S3-compatible Object Storage | — |
| **Maps** | Google Maps / Mapbox | — |
| **Payments** | Pakistan-compatible Payment Gateway | — |
| **Financial Records** | PostgreSQL Payment Ledger | — |
| **Architecture** | Modular Monolith | — |

---

## 3. Frontend Technology

### 3.1 Framework: Next.js

**What is it?** A React framework used to build the part of Fixora that users see.

**Why use it?** Fixora has many screens:
- Home page
- Login/Register
- Customer dashboard
- Create Job
- Worker profile
- Job tracking
- Payment pages
- Admin dashboard

Next.js gives a proper structure for these pages with React-based UI, Server-Side Rendering (SSR), and static generation.

| Criteria | Assessment |
|---|---|
| SSR/SSG | Fast initial loads, good SEO |
| App Router | Modern file-based routing |
| Server Components | Reduced client JS |
| API Routes | Backend endpoints in same app |
| Ecosystem | Huge React community |
| TypeScript | First-class support |

**Simple idea:** *Next.js = What the user sees.*

### 3.2 Language: TypeScript

**What is it?** JavaScript with types.

**Why use it?** Fixora has lots of data such as users, jobs, payments, workers, and reviews. TypeScript catches mistakes early and makes code easier to understand and maintain.

**Simple idea:** *TypeScript = Safety for our code.*

### 3.3 Styling: Tailwind CSS

**What is it?** A CSS framework for building UI quickly with utility classes.

**Why use it?** We need consistent design across many screens — colors, spacing, buttons, cards, and responsive layouts. Tailwind makes this faster and keeps the UI consistent.

**Simple idea:** *Tailwind = Fast and consistent styling.*

---

## 4. Backend Technology

### 4.1 Framework: NestJS

**What is it?** A Node.js backend framework built with TypeScript.

**Why use it?** The backend handles Fixora's business logic:
- Authentication
- Users
- Jobs
- Worker matching
- Payments
- Reviews
- Notifications
- Disputes
- Admin operations

NestJS organizes these into clear modules:

```text
Auth
Users
Jobs
Matching
Payments
Notifications
Reviews
Disputes
Admin
```

| Criteria | Assessment |
|---|---|
| Structure | Clear module boundaries (DI, decorators) |
| Type Safety | TypeScript-first |
| Scalability | Modular Monolith → microservices-ready |
| Testing | Built-in testing support |
| Ecosystem | Large, mature |

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|---|---|---|---|
| Express.js | Lightweight, simple | No structure, harder to scale | ❌ |
| Fastify | Fast | Smaller ecosystem | ❌ |
| Koa | Modern | Less mature | ❌ |

> **Decision:** NestJS gives Fixora a structured, maintainable backend ideal for a growing modular monolith.

**Simple idea:** *NestJS = The brain of Fixora.*

---

## 5. Database Technology

### 5.1 Primary: PostgreSQL 16 + PostGIS

**What is it?** PostgreSQL is a relational database; PostGIS is its extension for location/geographic queries.

**Why use it?** Fixora has strongly connected data:

```text
User → Job → Worker → Payment → Review
```

PostgreSQL stores structured data reliably with relationships.

PostGIS is critical for location — when a customer needs a plumber, we find:

```text
Plumber + Verified + Available + Nearby
```

| Criteria | Assessment |
|---|---|
| ACID | Full compliance |
| GIS | PostGIS — best-in-class geospatial |
| JSON | JSONB with indexing |
| Relationships | Strong foreign keys, joins |
| Maturity | 30+ years, battle-tested |
| Cost | Free (open source) |

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|---|---|---|---|
| MongoDB | Flexible schema | Weak joins/references, weaker geo | ❌ |
| MySQL | Mature | Weaker GIS | ❌ |
| Elasticsearch | Fast search | Not a primary DB | ❌ |

> **Decision:** PostgreSQL + PostGIS = **Main database / source of truth.**

### 5.2 Cache / Fast Data: Redis 7

**What is it?** A very fast in-memory data store.

**Why use it?** Some information is temporary or needs very fast access:
- Rate limiting
- Temporary state
- Worker availability
- Caching
- Background jobs
- OTP-related temporary data

Redis is **not** the main database — PostgreSQL remains the source of truth.

**Use Cases in Platform:**

| Use Case | Redis Feature |
|---|---|
| OTP storage | String + TTL (5 min) |
| JWT refresh tokens | String + TTL (30 days) |
| Rate limiting | String + TTL (1 min) |
| Socket.IO scaling | Redis Adapter (pub/sub) |
| Worker online status | String + TTL (heartbeat) |
| Nearby workers cache | GEO radius query |
| Job offer count cache | Sorted Set |

**Simple idea:** *Redis = Fast temporary storage and support system.*

---

## 6. Real-Time Communication

### Socket.IO

**What is it?** Technology for real-time communication between the browser/app and server.

**Why use it?** Fixora needs instant updates — e.g., when a customer posts a job:

```text
Customer posts job → Matching finds workers → Worker gets update → Worker sends offer → Customer gets offer instantly
```

No page refresh required. It also handles job status changes, offer updates, worker arrival updates, and chat/message updates.

**Simple idea:** *Socket.IO = Instant updates inside the app.*

| Criteria | Assessment |
|---|---|
| Fallback | Long-polling if WebSocket fails |
| Rooms | Job-specific channels |
| Broadcasting | Efficient distribution |
| Redis Adapter | Multi-instance support |
| Namespaces | Chat, jobs, etc. |

---

## 7. Push Notifications

### Firebase Cloud Messaging (FCM)

**What is it?** A push-notification service.

**Why use it?** A worker may not have the Fixora screen open:

```text
Customer posts job → Worker is away from app → Push notification arrives → Worker opens Fixora
```

Useful notifications: new nearby job, customer accepted offer, job reminder, payment update, new review.

**Simple idea:** *FCM = Push notifications.*

| Criteria | Assessment |
|---|---|
| Cost | Free |
| Platforms | All browsers + devices |
| Topics | Subscribe workers to city/category |
| Payload | Custom deep-link data |
| Integration | `firebase-admin` (NestJS) |

---

## 8. Media Storage

### S3-Compatible Object Storage

**What is it?** Storage made for files such as images and audio.

**Why use it?** Customers upload photos of a broken pipe, AC photos, and voice descriptions. Large files should **not** go directly into PostgreSQL.

```text
Image/Audio → Object Storage
Database → Stores file metadata/reference
```

| Option | Use |
|---|---|
| AWS S3 | Production |
| MinIO | Self-hosted / S3-compatible |
| R2 (Cloudflare) | Cost-friendly alternative |

**Simple idea:** *S3 storage = Where photos and audio are stored.*

---

## 9. Maps & Location

### Google Maps or Mapbox

**What is it?** Mapping and location services.

**Why use it?** Fixora needs location selection, worker distance, maps, directions, and service-area information.

```text
Customer posts job → Location saved → Nearby workers found → Worker gets directions
```

| Criteria | Google Maps | Mapbox |
|---|---|---|
| Coverage (Pakistan) | ✅ Excellent | ✅ Good |
| Pricing | $200 free credit | 50K free loads |
| Customization | Good | Better |
| Directions | Excellent | Good |

> **Decision:** We will choose between Google Maps and Mapbox after comparing price, coverage, geocoding, directions, and product needs.

**Simple idea:** *Maps = Location, distance, and directions.*

---

## 10. Payments

### 10.1 Payment Gateway

**What is it?** A service that processes online payments.

**Why use it?** Customers need to pay for services through a secure payment system.

```text
Customer pays → Payment Gateway → Job/payment status → Worker payout → Platform commission
```

**Important compliance note:** We should not assume Fixora can simply hold customer money itself. Escrow, custody, settlement, KYC, and payouts can have regulatory requirements. The final design must use a **compliant provider** and proper **legal/regulatory review**.

| Provider | Coverage | Notes |
|---|---|---|
| JazzCash (Primary) | Pakistan | Largest mobile wallet |
| Easypaisa (Secondary) | Pakistan | Second largest |
| Stripe | International | Cards + global methods |

**Simple idea:** *Payment Gateway = Processes payments.*

### 10.2 Payment Ledger

**What is it?** A record of all money-related events inside our system.

**Why use it?** Even when an external provider handles the actual payment, Fixora still needs clear internal records:

```text
Job: #123
Customer payment: 5000
Worker amount: 4500
Platform commission: 500
Status: Completed
```

It tracks payment status, references, worker payout, commission, refunds, and disputes. Stored in PostgreSQL.

**Simple idea:** *Payment Ledger = Our financial record book.*

---

## 11. Architecture: Modular Monolith

**What is it?** One backend application divided into clear internal modules:

```text
Fixora Backend
│
├── Auth
├── Users
├── Workers
├── Jobs
├── Matching
├── Payments
├── Notifications
├── Reviews
├── Disputes
└── Admin
```

**Why use it?** We are building an MVP. Starting with microservices would add unnecessary complexity. A modular monolith gives:

- Simpler development
- Easier deployment
- Easier debugging
- Less infrastructure
- Clear code organization

Later, a large module can be separated into its own service if the product grows enough.

**Simple idea:** *Modular Monolith = Simple now, scalable later.*

---

## 12. How Everything Works Together

```text
                 CUSTOMER / WORKER
                         │
                         ▼
              Next.js + TypeScript
                         │
                         ▼
                    NestJS API
                    /         \
                   /           \
                  ▼             ▼
           PostgreSQL         Redis
               │
               ▼
             PostGIS
               │
               ▼
        Nearby Worker Matching

Other services:
Socket.IO  → Real-time updates
FCM        → Push notifications
S3         → Images / Audio
Maps       → Location / Directions
Payment    → Online payment processing
Ledger     → Financial records
Tailwind   → UI styling
```

---

## 13. Complete Stack in One Place

```text
Frontend
→ Next.js + TypeScript + Tailwind CSS

Backend
→ NestJS + TypeScript

Database
→ PostgreSQL + PostGIS

Fast / Temporary Data
→ Redis

Real-time
→ WebSocket / Socket.IO

Push Notifications
→ Firebase Cloud Messaging

Media Storage
→ S3-compatible Object Storage

Maps
→ Google Maps or Mapbox

Payments
→ Pakistan-compatible Payment Gateway

Financial Records
→ PostgreSQL Payment Ledger

Architecture
→ Modular Monolith
```

---

## 14. One-Line Explanation of Every Technology

| Technology | Simple Meaning |
|---|---|
| Next.js | Builds the user interface |
| TypeScript | Makes JavaScript safer and easier to maintain |
| Tailwind CSS | Styles the interface quickly and consistently |
| NestJS | Runs backend business logic |
| PostgreSQL | Stores the main application data |
| PostGIS | Finds workers by location/distance |
| Redis | Handles fast temporary data and support tasks |
| Socket.IO | Sends real-time updates |
| FCM | Sends push notifications |
| S3 Storage | Stores images and audio |
| Google Maps / Mapbox | Handles maps and directions |
| Payment Gateway | Processes online payments |
| Payment Ledger | Records financial events |
| Modular Monolith | Keeps the MVP architecture simple and organized |

---

## 15. Example: Customer Needs a Plumber

```text
1. Customer opens Fixora
2. Next.js shows the form
3. Customer posts a plumber job
4. NestJS receives the request
5. PostgreSQL stores the job
6. PostGIS finds nearby verified plumbers
7. Socket.IO / FCM notify workers
8. Worker sends visit charge + ETA
9. Customer accepts
10. Payment Gateway processes payment
11. Job is completed
12. Payment Ledger records the final transaction
13. Customer leaves a review
```

---

## 16. Final Principle

We are **not** choosing these technologies just because they are popular. Each technology solves a specific Fixora problem:

**Next.js** → UI  
**NestJS** → Business logic  
**PostgreSQL** → Main data  
**PostGIS** → Nearby workers  
**Redis** → Fast temporary operations  
**Socket.IO** → Real-time updates  
**FCM** → Push notifications  
**S3** → Images/audio  
**Maps** → Location/directions  
**Payment Gateway** → Payments  
**Ledger** → Financial records  
**Modular Monolith** → Manageable MVP architecture

---

## 17. Technologies Pricing Status

### Free (10)

| Technology | Cost |
|---|---|
| Next.js | $0 |
| TypeScript | $0 |
| Tailwind CSS | $0 |
| NestJS | $0 |
| PostgreSQL | Region-based (Neon free tier: 0.5 GB, autoscale 2 CU, 10 branches) |
| PostGIS | $0 |
| Socket.IO | $0 |
| Firebase Cloud Messaging | $0 |
| Payment Ledger | $0 |
| Modular Monolith | $0 |

### Hybrid (3)

| Technology | Notes |
|---|---|
| Redis | Free in dev; cost when managed (Upstash/Redis Cloud) |
| S3-Compatible Storage | Free local (MinIO); small cost in cloud |
| Google Maps / Mapbox | Free tier initially; usage-based after |

### Paid (1)

| Technology | Notes |
|---|---|
| Payment Gateway | Per-transaction fee; grows with users/cost |

### Cost By Stage

```text
Development   → Almost entirely FREE
Initial MVP   → Mostly FREE / Free Tier
Growing Users → Hybrid + usage-based costs
Large Scale   → Paid infrastructure + transaction costs
```

---

*Document prepared by Shafqat Ullah — Pending review by Qazi Farhan Ahmad (Team Lead)*
