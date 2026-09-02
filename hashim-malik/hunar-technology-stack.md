# Fixora Technology Stack

## What are we building?

Fixora is a home-services marketplace where customers can find verified professionals such as plumbers, electricians, AC technicians, carpenters, etc.

The stack is chosen to solve Fixora's actual needs: user accounts, jobs, nearby-worker matching, real-time updates, notifications, maps, files, and payments.

---

## 1. Frontend — Next.js

**What is it?**  
A React framework used to build the part of Fixora that users see.

**Why use it?**

Fixora will have many screens:

- Home page
- Login/Register
- Customer dashboard
- Create Job
- Worker profile
- Job tracking
- Payment pages
- Admin dashboard

Next.js gives us a proper structure for these pages and React-based UI.

**Simple idea:**

> Next.js = What the user sees.

---

## 2. TypeScript

**What is it?**  
JavaScript with types.

**Why use it?**

Fixora will have lots of data such as users, jobs, payments, workers and reviews. TypeScript helps catch many mistakes early and makes the code easier to understand and maintain.

**Simple idea:**

> TypeScript = Safety for our code.

---

## 3. Tailwind CSS

**What is it?**  
A CSS framework for building UI quickly with utility classes.

**Why use it?**

We need a consistent design across many screens:

- Colors
- Spacing
- Buttons
- Cards
- Responsive layouts

Tailwind makes this faster and keeps the UI consistent.

**Simple idea:**

> Tailwind = Fast and consistent styling.

---

## 4. Backend — NestJS

**What is it?**  
A Node.js backend framework built with TypeScript.

**Why use it?**

The backend will handle Fixora's business logic:

- Authentication
- Users
- Jobs
- Worker matching
- Payments
- Reviews
- Notifications
- Disputes
- Admin operations

NestJS lets us organize these into clear modules.

Example:

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

**Simple idea:**

> NestJS = The brain of Fixora.

---

## 5. PostgreSQL

**What is it?**  
A relational database.

**Why use it?**

Fixora has data that is strongly connected:

```text
User → Job → Worker → Payment → Review
```

PostgreSQL is good for storing this structured data and keeping relationships reliable.

It will store things like:

- Users
- Workers
- Jobs
- Offers
- Payments
- Reviews
- Disputes
- Notifications

**Simple idea:**

> PostgreSQL = Main database / source of truth.

---

## 6. PostGIS

**What is it?**  
A PostgreSQL extension for location and geographic queries.

**Why use it?**

Location is one of Fixora's core features.

When a customer needs a plumber, we need to find:

```text
Plumber
+ Verified
+ Available
+ Nearby
```

PostGIS helps us efficiently search for workers within a certain distance.

**Simple idea:**

> PostGIS = Finds nearby workers.

---

## 7. Redis

**What is it?**  
A very fast in-memory data store.

**Why use it?**

Some information is temporary or needs very fast access.

Examples:

- Rate limiting
- Temporary state
- Worker availability
- Caching
- Background jobs
- OTP-related temporary data

Redis is not our main database. PostgreSQL remains the main source of truth.

**Simple idea:**

> Redis = Fast temporary storage and support system.

---

## 8. WebSocket / Socket.IO

**What is it?**  
Technology for real-time communication between the browser/app and server.

**Why use it?**

Fixora needs instant updates.

Example:

```text
Customer posts job
        ↓
Matching finds workers
        ↓
Worker gets update
        ↓
Worker sends offer
        ↓
Customer gets offer instantly
```

No page refresh should be required.

It can also handle:

- Job status changes
- Offer updates
- Worker arrival updates
- Chat/message updates

**Simple idea:**

> Socket.IO = Instant updates inside the app.

---

## 9. Firebase Cloud Messaging (FCM)

**What is it?**  
A push-notification service.

**Why use it?**

A worker may not have the Fixora screen open.

For example:

```text
Customer posts job
        ↓
Worker is away from app
        ↓
Push notification arrives
        ↓
Worker opens Fixora
```

Useful notifications include:

- New nearby job
- Customer accepted offer
- Job reminder
- Payment update
- New review

**Simple idea:**

> FCM = Push notifications.

---

## 10. S3-Compatible Object Storage

**What is it?**  
Storage made for files such as images and audio.

**Why use it?**

Customers may upload:

- Photos of a broken pipe
- AC photos
- Voice descriptions
- Other files

We should not put large files directly inside PostgreSQL.

Instead:

```text
Image / Audio
      ↓
Object Storage

Database
      ↓
Stores file metadata/reference
```

**Simple idea:**

> S3 storage = Where photos and audio are stored.

---

## 11. Google Maps or Mapbox

**What is it?**  
Mapping and location services.

**Why use it?**

Fixora needs:

- Location selection
- Worker distance
- Maps
- Directions
- Service-area information

Example:

```text
Customer posts job
        ↓
Location saved
        ↓
Nearby workers found
        ↓
Worker gets directions
```

We will choose between Google Maps and Mapbox after comparing price, coverage, geocoding, directions and product needs.

**Simple idea:**

> Maps = Location, distance and directions.

---

## 12. Payment Gateway

**What is it?**  
A service that processes online payments.

**Why use it?**

Fixora needs customers to pay for services through a secure payment system.

Basic flow:

```text
Customer pays
      ↓
Payment Gateway
      ↓
Job / payment status
      ↓
Worker payout process
      ↓
Platform commission
```

**Important:**

We should not assume that Fixora can simply hold customer money itself. Escrow, custody, settlement, KYC and payouts can have regulatory requirements. The final design should use a compliant provider and proper legal/regulatory review.

**Simple idea:**

> Payment Gateway = Processes payments.

---

## 13. Payment Ledger

**What is it?**  
A record of all money-related events inside our system.

**Why use it?**

Even when an external payment provider handles the actual payment, Fixora still needs clear internal records.

Example:

```text
Job: #123
Customer payment: 5000
Worker amount: 4500
Platform commission: 500
Status: Completed
```

It helps track:

- Payment status
- Payment references
- Worker payout
- Commission
- Refunds
- Disputes

**Simple idea:**

> Payment Ledger = Our financial record book.

---

## 14. Modular Monolith

**What is it?**  
One backend application divided into clear internal modules.

Example:

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

**Why use it?**

We are building an MVP. Starting with microservices would add unnecessary complexity.

A modular monolith gives us:

- Simpler development
- Easier deployment
- Easier debugging
- Less infrastructure
- Clear code organization

Later, a large module can be separated into its own service if the product grows enough.

**Simple idea:**

> Modular Monolith = Simple now, scalable later.

---

# How Everything Works Together

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

# Complete Stack in One Place

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

# One-Line Explanation of Every Technology

| Technology           | Simple Meaning                                  |
| -------------------- | ----------------------------------------------- |
| Next.js              | Builds the user interface                       |
| TypeScript           | Makes JavaScript safer and easier to maintain   |
| Tailwind CSS         | Styles the interface quickly and consistently   |
| NestJS               | Runs backend business logic                     |
| PostgreSQL           | Stores the main application data                |
| PostGIS              | Finds workers by location/distance              |
| Redis                | Handles fast temporary data and support tasks   |
| Socket.IO            | Sends real-time updates                         |
| FCM                  | Sends push notifications                        |
| S3 Storage           | Stores images and audio                         |
| Google Maps / Mapbox | Handles maps and directions                     |
| Payment Gateway      | Processes online payments                       |
| Payment Ledger       | Records financial events                        |
| Modular Monolith     | Keeps the MVP architecture simple and organized |

---

# Example: Customer Needs a Plumber

```text
1. Customer opens Fixora
        ↓
2. Next.js shows the form
        ↓
3. Customer posts a plumber job
        ↓
4. NestJS receives the request
        ↓
5. PostgreSQL stores the job
        ↓
6. PostGIS finds nearby verified plumbers
        ↓
7. Socket.IO / FCM notify workers
        ↓
8. Worker sends visit charge + ETA
        ↓
9. Customer accepts
        ↓
10. Payment Gateway processes payment
        ↓
11. Job is completed
        ↓
12. Payment Ledger records the final transaction
        ↓
13. Customer leaves a review
```

---

## Final Principle

We are not choosing these technologies just because they are popular.

Each technology solves a specific Fixora problem:

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

# Technologies pricing status

## Free-10

**Next.js**

**TypeScript**

**Tailwind CSS**

**NestJS**

**PostgreSQL**

**PostGIS**

**Socket.IO**

**Firebase Cloud Messaging**

**Payment Ledger**

**Modular Monolith**

##### Software/license cost: generally $0

## Hybrid-3

**Redis**

**S3-Compatible Storage**

**Google Maps / Mapbox**

###### At initial stage its free

## Paid-1

**Payment Gateway**

##### It depends on per transaction, and also, if users and cost will be increasing than payment of this platform is also increasing

###### Note: Development

→ Almost entirely FREE

Initial MVP
→ Mostly FREE / Free Tier

Growing Users
→ Hybrid + usage-based costs

Large Scale
→ Paid infrastructure + transaction costs
