# HUNAR — Project Implementation Overview (Master Document)

> **Read this file first.** It is the big picture of the entire HUNAR platform.
> It explains what the project is, who uses it, what workflow the users follow,
> what modules we are building, how the modules connect to each other,
> what data the project stores, and the rules every part of the project must follow.
>
> This document intentionally **does not** decide the technology stack.
> The technology will be chosen separately, after this documentation is final.

---

# Part 1 — The Project

## 1.1 What is HUNAR in one sentence

HUNAR is an online marketplace (a website) where **customers** who need home repair
and maintenance services can find and hire **skilled workers**, follow the job from
start to finish, and pay safely — while an **admin** keeps the platform safe and organized.

Simple version:

> "Find the right skilled worker. Send a request. Manage the job clearly."

## 1.2 The problem we are solving

In places like Peshawar, people usually find workers through friends, contacts, or
repeated phone calls. That is slow and uncertain. Workers, on the other hand, may have
excellent skills but no reliable way to get customers.

We are building a structured marketplace to fix both sides:

- Customers get a fast, trustworthy way to find, compare, and hire workers.
- Workers get a digital source of real job requests.

## 1.3 The three users (roles)

| Role | Who | What they want to do |
|---|---|---|
| **Customer** | A person who needs a service (e.g. AC not cooling, leaky pipe) | Find a worker, request a service, track the job, pay, review |
| **Skilled Worker** | A professional (plumber, electrician, AC technician, carpenter, painter, etc.) | Show their skills, get relevant jobs, send offers, do the work, get paid |
| **Admin** | Team or staff member who operates the platform | Verify workers, manage users and categories, monitor jobs and payments, handle disputes, see statistics |

There is also a mentioned **Super Admin** concept in planning documents — an admin who can
also change platform-wide settings such as commission rates. We treat Super Admin as an
extension of the Admin role with a few extra permissions.

## 1.4 The core workflow (the spine of the product)

Everything in this project exists to make this flow work smoothly:

```
Register → Discover → Request → Respond → Track → Complete
```

In a richer form, the complete happy path is:

1. A **customer** registers and logs in.
2. A **worker** registers, builds a profile, and gets verified by the admin.
3. The **customer** posts a job (describes the problem, adds photos, location, budget).
4. **Eligible workers** (verified, available, nearby, matching the category) see the job.
5. **Workers** send offers with a **visit charge** and an ETA (time they can arrive).
6. The **customer** compares offers and selects a worker.
7. A **booking** is created with a scheduled visit time.
8. The **worker** arrives, inspects the problem, and gives a **repair estimate**.
9. The **customer** approves (or negotiates) the repair estimate.
10. The **worker** performs the repair and marks the job **completed**.
11. The **customer** pays through the platform (escrow / protected payment).
12. The platform takes its **commission** and the rest goes to the **worker**.
13. Both sides can leave **reviews and ratings**.
14. If anything goes wrong, the **admin** helps resolve the **dispute**.

## 1.5 What is in the first release (MVP scope)

We build the core marketplace first and validate real demand. The MVP includes:

- Customer and worker registration/login with phone-based verification (OTP).
- Worker profiles, skills, service area, availability.
- Service categories.
- Job creation with description, photos, location, budget, schedule.
- Job discovery: search, filter, nearby matching.
- Worker offers (visit charge + note + ETA).
- Offer comparison and selection by the customer.
- Booking and scheduling of visits.
- Visit, inspection, and repair estimate (two-stage pricing).
- Job execution status (arrived, in progress, completed).
- Protected payments, wallet, commission, and payout concepts.
- Reviews and ratings.
- Customer-worker chat.
- Notifications (push, SMS, in-app).
- Admin panel (verification, users, categories, jobs, payments, disputes, stats).
- Basic dispute resolution and help center.

## 1.6 What is intentionally NOT in the first release

| Not in MVP | Why |
|---|---|
| Advanced AI matching / AI diagnosis | Not needed to prove the core flow |
| Full e-commerce / materials marketplace | Adds huge complexity |
| Subscriptions and loyalty programs | Can be added after validation |
| Multi-city expansion | Start in one city and validate |
| Voice-to-text transcription | Voice recording is enough for now |
| Complex analytics | Basic statistics are enough for MVP |
| Advanced fraud detection | Use layered basic controls first |

---

# Part 2 — The Module Map

The project is built as a set of **modules**. A module is a clearly separated part of the
system with one main responsibility. Modules talk to each other through defined rules.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HUNAR MODULE MAP                              │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐   │
│  │ 01 Auth &        │   │ 02 Profiles &    │   │ 03 Service     │   │
│  │    Accounts      │   │    Verification   │   │    Categories  │   │
│  └──────────────────┘   └──────────────────┘   └────────────────┘   │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐   │
│  │ 04 Job Posting   │   │ 05 Discovery &   │   │ 06 Offers &    │   │
│  │                  │   │    Matching      │   │    Negotiation │   │
│  └──────────────────┘   └──────────────────┘   └────────────────┘   │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐   │
│  │ 07 Bookings &    │   │ 08 Visits &      │   │ 09 Execution & │   │
│  │    Scheduling    │   │    Estimates     │   │    Completion  │   │
│  └──────────────────┘   └──────────────────┘   └────────────────┘   │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐   │
│  │ 10 Payments &    │   │ 11 Reviews &     │   │ 12 Chat &      │   │
│  │    Wallet        │   │    Ratings       │   │    Messaging   │   │
│  └──────────────────┘   └──────────────────┘   └────────────────┘   │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐   │
│  │ 13 Notifications │   │ 14 Location &    │   │ 15 File        │   │
│  │                  │   │    Maps          │   │    Uploads     │   │
│  └──────────────────┘   └──────────────────┘   └────────────────┘   │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐   │
│  │ 16 Search &      │   │ 17 Admin         │   │ 18 Disputes &  │   │
│  │    Filtering     │   │    Operations    │   │    Support     │   │
│  └──────────────────┘   └──────────────────┘   └────────────────┘   │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐   │
│  │ 19 Security &    │   │ 20 Non-          │   │ 21 Testing &   │   │
│  │    Audit         │   │    Functional    │   │    QA          │   │
│  └──────────────────┘   └──────────────────┘   └────────────────┘   │
│                                                                      │
│  ┌──────────────────┐                                                │
│  │ 22 Deployment &  │                                                │
│  │    Operations    │                                                │
│  └──────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────┘
```

## 2.1 One-line meaning of every module

| # | Module | One-line meaning |
|---|---|---|
| 01 | Authentication & Accounts | Proving who the user is and managing login sessions and roles. |
| 02 | Profiles & Verification | The information that describes a customer or worker, and worker approval. |
| 03 | Service Categories | The organized list of services (plumbing, electrician, AC, etc.) and worker skills. |
| 04 | Job Posting | The customer describing their problem and creating a request. |
| 05 | Discovery & Matching | Showing the right job to the right workers and the right workers to the customer. |
| 06 | Offers & Negotiation | Workers proposing a visit charge and discussing it with the customer. |
| 07 | Bookings & Scheduling | Locking in a chosen worker and agreeing when the visit happens. |
| 08 | Visits & Estimates | The visit, inspection, and the repair price after inspection. |
| 09 | Execution & Completion | The job progressing: worker arrives, works, finishes, customer confirms. |
| 10 | Payments & Wallet | The safe handling of money, the wallet, commission, and payouts. |
| 11 | Reviews & Ratings | Customers and workers rating each other after a finished job. |
| 12 | Chat & Messaging | Customers and workers talking to each other inside the platform. |
| 13 | Notifications | The platform alerting users about important events. |
| 14 | Location & Maps | Distances, nearby search, location selection, and directions. |
| 15 | File Uploads & Media | Photos, voice notes, and documents uploaded safely. |
| 16 | Search & Filtering | Finding jobs or workers quickly with many filters. |
| 17 | Admin Operations | The admin panel: users, verification, jobs, payments, disputes, stats. |
| 18 | Disputes & Support | Handling complaints and helping users when things go wrong. |
| 19 | Security & Audit | The rules that keep the platform secure and record important actions. |
| 20 | Non-Functional Requirements | Performance, usability, accessibility, scalability, reliability. |
| 21 | Testing & QA | How every module is verified before release. |
| 22 | Deployment & Operations | Environments, launching the platform, monitoring, backups. |

Modules 19–22 are **cross-cutting**: they are not big features on their own, but every
other module must follow their rules.

---

# Part 3 — How The Modules Connect

## 3.1 Data flows between modules (the important arrows)

```
Auth (01) ──provides identity──► every other module
Profiles (02) ──worker info──► Discovery (05), Offers (06), Exec (09), Reviews (11)
Categories (03) ──used by──► Job Posting (04), Discovery (05), Search (16)
Job Posting (04) ──creates a job──► Discovery (05), Offers (06)
Offers (06) ──selected offer──► Bookings (07)
Bookings (07) ──scheduled visit──► Visits/Estimates (08)
Visits/Estimates (08) ──approved price──► Execution (09), Payments (10)
Execution (09) ──completed job──► Payments (10), Reviews (11)
Payments (10) ──paid job──► Reviews (11), Admin (17)
Chat (12) ──tied to a booking──► also used inside Offers (06) and Execution (09)
Notifications (13) ──sent on events from──► every workflow module
Location (14) ──used by──► Discovery (05), Job Posting (04), Execution (09)
File Uploads (15) ──used by──► Profiles (02), Job Posting (04), Chat (12), Admin (17)
Search (16) ──reads from──► Jobs (04), Workers (02), Categories (03)
Admin (17) ──reads/writes──► everything (with limits)
Disputes (18) ──references──► Bookings (07), Payments (10), Execution (09)
```

## 3.2 The most important rule about connections

A module should not reach into another module's private details without a defined path.

Example:

- The **Offers** module needs to know the job's category to know which workers may offer.
- It reads that information through a defined function, not by changing job data directly.
- The **Chat** conversation is only allowed between participants of a booking/offer.

This keeps the system easy to understand and change.

## 3.3 Shared building blocks

Some things are used by almost every module and should be built once and reused:

- **The identity of the current user** (who is logged in, what role they have).
- **Validation**: every incoming request is checked before doing work.
- **Error handling**: every failure is returned in one standard format.
- **Logging and audit** (handled by Module 19).
- **Notifications** (Module 13) — called on events, never duplicated.
- **File upload** (Module 15) — one place to save and serve files.
- **Location utilities** (Module 14) — one place to calculate distance.

---

# Part 4 — What Data The Project Stores (Conceptual)

The project stores several groups of information. The exact storage technology is
decided later; here we only list **what** must be remembered and **how the records
relate to each other**.

> Naming note for junior developers: the word "record" means one saved item, for example
> "one job", "one offer", "one user". Each record has a unique ID.

## 4.1 Core entities

| Entity | What it is | Most important fields (conceptually) |
|---|---|---|
| User | A person who can log in | ID, phone number, name, role (customer/worker/admin), status, timestamps |
| Customer Profile | Extra info about a customer | User reference, default location, photo, saved preferences |
| Worker Profile | Extra info about a worker | User reference, skills, bio, experience, service area, photo, rating, verification status |
| Verification Case | A request by a worker to be approved | Worker reference, submitted documents, status, admin notes, reviewed by/at |
| Service Category | A service people can request | Name, icon, description, status (active/inactive), ordering |
| Job | A customer's service request | Customer, category, title, description, photos, location, budget, schedule, urgency, status |
| Offer | A worker's proposal on a job | Job, worker, visit charge, note, ETA, status, timestamps |
| Booking | A confirmed selection of a worker | Job, offer, customer, worker, amount, visit time, status |
| Visit | The scheduled meeting for inspection | Booking, scheduled time, status, inspection notes, photos |
| Repair Estimate | The price for the actual repair | Visit, itemized breakdown, total, status, negotiation history |
| Payment | A money transaction | Booking, amount, method, provider reference, status, timestamps |
| Wallet Transaction | A change to a wallet balance | User, worker, type (top-up/commission/withdrawal/etc.), amount, balance before/after |
| Review | A rating after job completion | Booking, reviewer, reviewee, rating (1–5), comment, status |
| Conversation / Message | Chat between users | Participants, booking reference, messages with type and timestamp |
| Notification | An alert to a user | User, type, title, message, reference, read/unread |
| Dispute / Ticket | A complaint or problem | Reporting user, related booking/payment, description, status, resolution |
| Audit Log | A record of an important action | Actor, action, subject, details, timestamp |

## 4.2 How entities are related (the family tree)

```
User (role = customer) 1 ─── 0..n Customer Profile
User (role = worker)   1 ─── 0..1 Worker Profile
Worker Profile 1 ─── 0..n Skills (references Categories)
User (role = admin)  1 ─── 0..n verification decisions

Customer 1 ─── 0..n Job
Job 1 ─── 0..n Offer
Job 1 ─── 0..1 Booking  (only one active booking per job)
Offer n ─── 0..1 Booking (selected offer)
Booking 1 ─── 0..1 Visit
Visit 1 ─── 0..1 Repair Estimate
Booking 1 ─── 0..1 Payment  (the main payment)
Worker 1 ─── 0..n Payment  (payouts)
Booking 1 ─── 0..2 Review  (customer→worker, worker→customer)
Booking 1 ─── 0..1 Conversation
Booking 1 ─── 0..n Dispute/Ticket
User 1 ─── 0..n Wallet transactions
User 1 ─── 0..n Notifications
```

## 4.3 Why relationships matter

Almost every feature depends on relationships:

- Only the customer who owns the job can cancel it.
- Only workers who match the job category may offer.
- Only one offer can become the selected offer.
- Only the participants of a booking can chat about it.
- A review is only allowed after a completed, paid booking.

**Golden rule:** the server decides who is allowed to do what — never trust the web page alone.

---

# Part 5 — The Job Lifecycle (State Model)

Every job passes through a controlled set of states. The system must enforce that a job
can ONLY move to a state that is allowed from its current state. This is called a
**state machine**.

## 5.1 Job states

```
created/open ──► offers_received ──► offer_accepted ──► visit_scheduled
      │               │                    │
      │               └── cancelled        ├──► visit_in_progress ──► visit_completed
      │                                    │
      │                                    └──► repair_approved ──► in_progress
      └──────── cancelled                                   │
                                                            ├──► completed ──► paid ──► reviewed
                                                            └──► disputed (also from completed)
```

Simplified set used across planning documents:

```
draft → open → offers_received → offer_accepted → visit_scheduled
      → visit_in_progress → visit_completed → repair_negotiating
      → repair_approved → in_progress → completed → paid → reviewed
cancelled (allowed from several early states)
disputed  (allowed from in_progress/completed/paid)
```

## 5.2 Rules that always apply to state changes

1. The state machine is enforced by the **server**, not just the screen.
2. Only specific roles can perform specific transitions (see each module).
3. Every state change can trigger events: notifications, real-time updates, ledger entries.
4. Cancelled or disputed jobs keep their data; they are never quietly deleted.

---

# Part 6 — The Complete User Journeys

## 6.1 Customer journey

```
1. Opens the platform (landing page).
2. Signs up with phone number (OTP verification) → chooses "I need a service".
3. Completes basic profile (name, phone, area).
4. Posts a job: category, title, description, photos, location, budget, schedule, urgency.
5. Sees matching workers and offers on the job page.
6. Compares offers (visit charge, ETA, rating, distance, verification, jobs completed).
7. Selects an offer → booking is created with a visit time.
8. Watches the job progress (worker assigned → scheduled → arrived → inspecting → repairing).
9. Receives the repair estimate after inspection → approves or negotiates.
10. Worker does the job → job marked completed.
11. Pays through the platform (protected payment/escrow).
12. Leaves a review; can start a dispute if something went wrong.
13. Receives notifications at every important step.
```

## 6.2 Worker journey

```
1. Signs up with phone number (OTP verification) → chooses "I'm a professional".
2. Builds a profile: photo, bio, skills, experience, service area, availability.
3. Submits verification documents → waits for admin approval.
4. Gets verified → starts receiving relevant nearby job notifications.
5. Reviews a job and sends an offer (visit charge + note + ETA).
6. If selected, confirms the booking and visit time.
7. Arrives at the location (presses "Arrived").
8. Inspects the problem and submits a repair estimate.
9. Negotiates price if the customer counters.
10. Performs the repair after approval and marks the job completed.
11. Gets paid after the protected payment is released.
12. Leaves a review for the customer; tracks earnings in the wallet.
```

## 6.3 Admin journey

```
1. Logs into the admin panel.
2. Sees the dashboard: numbers of users, workers, jobs, payments, revenue, pending items.
3. Reviews worker verification requests → approves or rejects.
4. Manages service categories (create, edit, deactivate).
5. Monitors users, jobs, bookings, and payments.
6. Handles complaints and disputes (reads evidence, contacts parties, resolves).
7. Suspends or reactivates accounts when needed.
8. Reviews audit logs for important actions.
9. Configures platform settings (commission rate, limits) if Super Admin.
```

---

# Part 7 — Global Design Rules Every Module Must Follow

## 7.1 Security rules (summary — full detail in Module 19)

- Every protected request must prove the user's identity.
- Every sensitive action must verify the user's role.
- Never trust data coming from the web page; validate everything on the server.
- Passwords and secrets are never stored or logged in plain text.
- Sensitive endpoints (login, OTP, job creation, messages) are rate-limited.
- Errors shown to users never leak internal details.
- Personal and location data is only visible to authorized people and only as long as needed.
- The exact customer address is revealed to a worker **only after selection/confirmation**.

## 7.2 Error and response rules

Every request returns a clear, consistent response. A failed request looks the same
everywhere:

```
An error has:
  - a code (machine-readable, e.g. JOB_NOT_FOUND)
  - a message (human-readable)
  - optional details
A success response:
  - contains the requested data or a confirmation
```

The web page shows friendly messages based on the error code, and the server
never returns raw stack traces.

## 7.3 Duplicate protection (idempotency)

Many failures come from double clicks or network retries. The system must protect
critical operations so that **the same request twice does not create two records**:

- Creating a job.
- Submitting an offer.
- Selecting an offer / creating a booking.
- Processing a payment.
- Creating a review.
- Sending a notification.

## 7.4 Payment truth rule

The **final payment state always comes from the server and the payment provider**,
never from what the web page says happened.

## 7.5 Notification rules

- Notifications are event-driven and automatically triggered by business events.
- The same event must not create duplicate notifications.
- Users can read/mark notifications; critical ones also arrive by push/SMS.

## 7.6 Logging and audit rules

- Important actions are logged: logins, verification decisions, job state changes,
  payments, refunds, disputes, admin actions.
- Logs do not contain passwords, tokens, or unnecessary payment details.

## 7.7 Naming and code conventions (concepts)

- **Names are descriptive and consistent** across modules (e.g. "job", "offer", "booking").
- One concept has one name everywhere (Job = service request = the same thing).
- No comments required by these docs, but every public/reusable function must be
  understandable from its name and simple to read.

---

# Part 8 — Project Implementation Sequence

Modules are built in a logical order. The rule is: **build the spine first**.

## Phase 0 — Foundations (needed before and during everything)

- Module 19 Security & Audit (baseline: auth check, error format, logging, rate limits).
- Module 20 Non-Functional baseline (response time, usability, responsive layout).
- Module 21 Testing strategy and tools.
- Module 22 Deployment setup (dev environment).

## Phase 1 — Identity and data basics

- Module 01 Authentication & Accounts.
- Module 02 Profiles & Verification (customer + worker + admin verification).
- Module 03 Service Categories.

## Phase 2 — The core transaction spine

- Module 04 Job Posting.
- Module 05 Discovery & Matching.
- Module 06 Offers & Negotiation.
- Module 07 Bookings & Scheduling.
- Module 08 Visits & Estimates.
- Module 09 Execution & Completion.
- Module 10 Payments & Wallet.

This is the MVP heart: **post a job → get offers → book → visit → estimate → repair → pay**.

## Phase 3 — Trust and communication

- Module 11 Reviews & Ratings.
- Module 12 Chat & Messaging.
- Module 13 Notifications.
- Module 14 Location & Maps.
- Module 15 File Uploads & Media.
- Module 16 Search & Filtering.

## Phase 4 — Control and support

- Module 17 Admin Operations.
- Module 18 Disputes & Support.

## Phase 5 — Polish and release

- Complete Module 21 test suite.
- Complete Module 22 deployment for a pilot.
- Run a pilot acceptance test (customer, worker, admin test accounts).

---

# Part 9 — Definition of the Finished Project

The project is considered complete when the following can be demonstrated reliably:

1. A customer can register, log in, and post a real job (with photos, location, budget).
2. A verified, available, nearby worker matching the category receives/disovers the job.
3. The worker sends an offer (visit charge + ETA).
4. The customer compares and selects an offer.
5. A booking is created with a visit schedule.
6. The visit happens, the worker inspects and submits a repair estimate.
7. The customer approves (or negotiates) the estimate.
8. The work is performed and the job marked completed.
9. The customer pays safely through the platform.
10. The commission is recorded and the worker's payout is defined.
11. Both parties review each other.
12. Role and permission rules are enforced on the server.
13. Duplicate requests never create duplicate records.
14. Important admin actions are auditable.
15. Unauthorized users cannot access protected data.

---

# Part 10 — Final Summary

- HUNAR connects customers, workers, and admins in a home-services marketplace.
- The core workflow is: **Register → Discover → Request → Respond → Track → Complete**.
- The project is split into 22 modules, each with its own clean document.
- Every module file describes WHAT we build, not the technology.
- The two-stage pricing model (visit charge first, repair estimate later) is the
  defining product idea.
- Security, state control, duplicate protection, and audit are enforced by the server.
- The technology stack is decided separately after this documentation is agreed.

---

*Next step: read each module file in the folder as you start working on that module.*