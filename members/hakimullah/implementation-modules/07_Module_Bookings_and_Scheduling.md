# Module 07 — Bookings and Scheduling

## 1. What this module is

This module **locks in the deal**: when a customer selects a worker's offer, a
**booking** is created, and a **visit time** is agreed.

A booking is the official agreement between the customer and the worker:
- which job,
- which worker,
- the agreed visit charge,
- when the visit will happen.

From this point on, the job is "booked" and the two sides move through execution
together (Modules 08 and 09).

## 2. Why we build it

Before a booking exists, everything is just interest. A booking is what makes the
marketplace real:

- it protects the customer (the worker has committed to come),
- it protects the worker (the job is no longer a free-for-all),
- it fixes the agreed price,
- it gives both sides a shared record (which disputes and support need later).

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Confirms the selected offer, schedules the visit, sees the booking |
| Worker | Confirms the booking, sees the schedule |
| Admin | Monitors bookings and resolves booking-related complaints |
| System | Creates and enforces one booking per job |

## 4. Main screens / features

### Customer
- **Booking confirmation screen** — shows the selected worker, agreed visit charge,
  chosen date/time, then "Confirm booking".
- **Scheduled visits** — upcoming visits with date/time and worker contact.
- **My bookings** — list with status (from Module 09 timelines).

### Worker
- **Booking confirmation screen** — accepts the customer's scheduled time or proposes an alternative.
- **My schedule** — upcoming bookings list.
- **Reschedule request** — either side can propose moving the visit time (with the other side's approval).

### Both
- **Booking detail screen** — shared timeline of the booking status.

## 5. Data this module stores

| Field | Meaning |
|---|---|
| Booking ID | Unique identifier |
| Job | The job (Module 04) |
| Offer | The selected offer (Module 06) |
| Customer | From the job's owner |
| Worker | From the selected offer |
| Agreed visit charge | From the offer (single source of truth) |
| Scheduled time | Agreed visit date/time |
| Status | pending / confirmed / in_progress / completed / cancelled / disputed |
| Timestamps | Created/updated; history of status changes |

## 6. Main workflows

### Workflow A — Booking created from a selected offer

1. Customer selects an offer (Module 06).
2. The server performs a **transaction-safe check**:
   - the job exists and is still eligible,
   - no other booking is already confirmed for this job.
3. A booking is created in state `pending` with the agreed visit charge.
4. The job moves to `offer_accepted`.
5. The customer and worker are notified (Module 13).
6. A chat conversation for this booking is created (Module 12).
7. The scheduled visit time is proposed (customer picks a time or "worker proposes").

### Workflow B — Confirming the visit time

1. Customer (or worker) proposes a visit date/time.
2. The other side accepts or proposes an alternative.
3. When both accept, the booking becomes `confirmed` and the time is locked.
4. Reminders are scheduled (Module 13 — e.g. 24h before).

### Workflow C — Rescheduling

1. Either side requests a new time.
2. The other side must accept the new time before it takes effect.
3. The change is recorded in the booking history.

### Workflow D — Cancellation before work starts

1. Cancellation before the visit needs agreement (or a fair rule) — see Module 09 rules.
2. The booking becomes `cancelled`; the job is released or closed accordingly.
3. Any participants, chat, and reminders are closed.
4. No payment is collected (Module 10).

## 7. States and status changes

**Booking status:**

```
pending ──► confirmed ──► in_progress ──► completed
   │            │              │
   │            │              └──► disputed (Module 18)
   └──► cancelled              └──► refunded/completed handling (Module 10)

Terminal states: completed, cancelled, disputed
```

**Job state changes driven by this module:**

```
offer_accepted ──► visit_scheduled (when visit time is confirmed)
```

## 8. Business rules (the system MUST)

1. Exactly **one** confirmed booking per job is allowed at any time.
2. A booking can only be created from a `selected` offer.
3. A booking cannot be created if the job is cancelled, completed, or already has a confirmed booking.
4. Only the customer who owns the job (and system rules) can trigger booking creation.
5. The agreed visit charge comes from the offer — the customer cannot silently change it here.
6. A visit time must be in the future; checking the rules is the server's job.
7. Rescheduling requires both sides to agree (one-sided time changes are not allowed).
8. Cancellation before work is tracked and follows the cancellation rules (fair uses, refund rules from Module 10).
9. Every status change is recorded so both sides have a timeline.
10. A worker cannot be double-booked at the same time if the platform decides to enforce this; the rule is: confirm against overlapping confirmed bookings and ask for a different time.

## 9. Edge cases the system must handle safely

- Customer and worker both click "confirm" at the same moment → one booking, never two.
- Customer tries to book a second worker while the first booking is pending → rejected.
- Worker accepts a time and then a customer requests a conflict → reschedule path with approval.
- Visit time passes without status change → reminders and overdue handling (Module 09).
- Cancellation at the last minute → clear flows + possible dispute (Module 18).
- Booking for a job whose category was deactivated → historical booking still works.
- Worker is suspended after booking (Module 17) → special handling: contact admin, reschedule or cancel.

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 04 Job Posting | The job that the booking belongs to |
| 06 Offers & Negotiation | Booking is created only from a selected offer; charge is fixed |
| 08 Visits & Estimates | The confirmed booking becomes the scheduled visit |
| 09 Execution & Completion | Booking status advances through execution |
| 10 Payments & Wallet | Amount and eligibility for payment come from the booking |
| 11 Reviews & Ratings | Reviews require a completed booking |
| 12 Chat & Messaging | A conversation is auto-created per booking |
| 13 Notifications | Confirmation, reminders, reschedule events |
| 18 Disputes & Support | Disputes reference the booking |

## 11. Definition of done

- [ ] Selecting an offer creates exactly one pending booking.
- [ ] The visit time is agreed (propose → accept) and becomes confirmed.
- [ ] A second booking on the same job is impossible, even under simultaneous requests.
- [ ] Only the job owner can create the booking.
- [ ] The visit charge shown equals the selected offer's charge.
- [ ] Rescheduling requires both sides' agreement and is recorded.
- [ ] Cancellation before work follows the rules and closes related records (chat, reminders) cleanly.
- [ ] Both sides see a clear booking timeline.
- [ ] Module 21 tests cover double-booking races, time agreement flow, and cancellation.