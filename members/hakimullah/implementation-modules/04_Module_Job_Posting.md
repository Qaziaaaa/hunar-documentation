# Module 04 — Job Posting

## 1. What this module is

This module lets a **customer describe a problem and create a request** for help —
a "job".

The job is the heart of the marketplace. Everything later (offers, booking, visit,
estimate, payment, review) hangs off one job.

Example job: "AC not cooling" — category AC, description with photos, location Hayatabad,
budget 2000–3000, urgent.

## 2. Why we build it

Customers need a simple, clear way to explain what they need so that:
- the right workers can find them,
- workers can decide quickly whether to make an offer,
- the customer can later compare offers and track everything.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Creates, views, edits, and cancels their own jobs |
| Worker | Reads job details (through this module's read features) to decide about offering |
| Admin | Monitors jobs and can act on problem jobs (via Module 17) |
| System | Uses job data for matching, search, notifications, analytics |

## 4. Main screens / features

### Customer
- **Post a Job screen** — one clear form:
  - Category (Module 03)
  - Title (short problem summary)
  - Description (details)
  - Photos (Module 15) — optional but encouraged
  - Voice note (Module 15) — optional
  - Location (Module 14) — map pick or address
  - Budget range (minimum–maximum, in Rs.)
  - Preferred schedule — when the customer wants the visit (date/time or ASAP)
  - Urgency — Normal / Urgent
- **My Jobs screen** — list of the customer's jobs with status.
- **Job detail screen**:
  - full details + photos/location,
  - dashboard of offers received (Module 06),
  - selected booking state (Module 07),
  - job status timeline (Module 09).

### Worker
- **Job detail (read-only) screen** — sees public job info to decide about offering. Implementation detail:
  the exact address is hidden until the worker is selected (Module 14 privacy rule).

### Admin
- Job list/detail screens for monitoring (Module 17).

## 5. Data this module stores

| Field | Meaning |
|---|---|
| Job ID | Unique identifier |
| Customer | Who created the job (from Module 01/02) |
| Category | From Module 03 |
| Title | Short summary |
| Description | Detailed problem |
| Media references | Photos / voice note (Module 15) |
| Location | Area coordinates + address text (Module 14) |
| Budget min / max | Customer's rough budget range |
| Preferred schedule | Desired visit time; can be "ASAP" |
| Urgency | Normal / Urgent |
| Status | The job lifecycle state (see below) |
| Timestamps | Created/updated |

## 6. Main workflows

### Workflow A — Customer posts a job

1. Customer is logged in (Module 01) → opens "Post a Job".
2. Customer fills the form; the system validates every field.
3. Customer reviews a summary and confirms (to avoid accidental posting).
4. The system creates the job in state `open`.
5. The system triggers:
   - a notification round to eligible workers (Module 13 + Module 05 matching),
   - indexing for search (Module 16).
6. The customer lands on the job detail screen and can watch offers arrive.

### Workflow B — Customer views/edits a job

1. Customer opens "My Jobs" → sees status list.
2. Customer can edit details **only while the job is still open and no accepted booking exists**.
3. Saving an edit keeps the job in the same state and re-notifies eligible workers if relevant.

### Workflow C — Customer cancels a job

1. Customer can cancel while the job is `open` or `offers_received` (before a booking).
2. Cancellation is confirmed (because it affects workers).
3. The job moves to `cancelled`.
4. Workers who offered are notified (Module 13).
5. No new offers are accepted; existing offers become inactive.

## 7. States and status changes

The full job lifecycle is managed by Module 09; this module owns its **creation** and
the early states:

```
draft(optional) ──► open ──► offers_received
     │                 │           │
     └──► cancelled    └──► cancelled
```

Rules:
- `open`: new job, no offers yet.
- `offers_received`: has at least one offer (Module 06).
- Any transition beyond here belongs to Modules 06, 07, 08, 09.
- **A job cannot be edited or cancelled after a booking is confirmed**, except cancel
  by agreed rules with the other side.

## 8. Business rules (the system MUST)

1. Only a logged-in, active **customer** can create a job.
2. Required fields: category, title, description, location, preferred schedule.
   Budget is recommended (helps workers) but may be optional.
3. A title/description cannot be empty or only whitespace.
4. Budget, if provided, must be valid (min <= max, positive numbers).
5. Urgency accepts only Normal or Urgent.
6. A job can be edited only by its owner and only before a booking is confirmed.
7. A job can be cancelled only by its owner (or admin with reason) and only before
   the work is completed.
8. Duplicate submission (double click / retry) must not create two jobs.
9. The exact address is hidden from workers until a worker is selected (privacy rule, Module 14).
10. Creating a job emits events to matching + notifications, without blocking the customer.

## 9. Edge cases the system must handle safely

- Customer posts with no photos → allowed; location and description carry the details.
- Customer puts "2500" in both budget boxes → the range is treated as a single value.
- Customer tries to edit after a booking is confirmed → blocked with a clear message.
- Customer cancels after offers but before selection → offers inactivated, workers notified.
- The same customer double-clicks "Post Job" → only one job created.
- Network drops after posting → the customer can refresh and see the created job;
  retry must not duplicate.
- Worker views a job but the exact address is hidden until selection → shown appropriately.
- Category becomes inactive after posting → job still works; matching just stops for it.

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 01 Auth & Accounts | Owner identity and role checks |
| 02 Profiles & Verification | Customer's saved default location pre-fills the form |
| 03 Service Categories | Job is created in a category |
| 05 Discovery & Matching | New job triggers matching of eligible workers |
| 06 Offers & Negotiation | Offers attach to this job |
| 07 Bookings & Scheduling | The selected offer/booking attaches to this job |
| 08 Visits & Estimates | Repair estimate is linked to the booking of this job |
| 09 Execution & Completion | Owns the job state machine progression |
| 13 Notifications | Notifies eligible workers about the new job |
| 14 Location & Maps | Job location storage and distance |
| 15 File Uploads & Media | Photos and voice notes |
| 16 Search & Filtering | New jobs get indexed for search |
| 17 Admin Operations | Admin monitoring/moderating jobs |

## 11. Definition of done

- [ ] A customer can post a full job (category, title, description, photos, location, budget, schedule, urgency).
- [ ] A job cannot be posted with empty required fields; validation messages are friendly.
- [ ] A customer can see "My Jobs" with clear statuses.
- [ ] A customer can edit a job before booking and cannot edit after booking.
- [ ] A customer can cancel a job before booking; workers are notified.
- [ ] Double-submission protection works (no duplicate jobs).
- [ ] A worker viewing a job sees all public details and not the exact address before selection.
- [ ] Module 21 tests cover creation, validation, edit, cancel, duplicates, and privacy.