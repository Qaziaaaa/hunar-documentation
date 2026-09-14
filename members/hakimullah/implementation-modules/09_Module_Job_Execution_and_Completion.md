# Module 09 — Job Execution and Completion

## 1. What this module is

This module owns the **job state machine** — the rules that control how a job moves
forward from "posted" to "done". It is the "clock" of the marketplace.

It drives:
- when the worker is allowed to start,
- arrival tracking,
- the repair phase (after approval — Module 08),
- marking the job **completed**,
- overdue/reminder behaviour,
- cancellation and dispute entry points.

## 2. Why we build it

A marketplace only works if everyone agrees on "what state is this job in right now".
Without a controlled state machine:
- two sides could think different things,
- someone could mark a job completed before payment,
- statuses could jump backwards,
- support would have no idea what happened and when.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Tracks the job, confirms completion, sees the timeline |
| Worker | Advances states: arrived → inspecting → repairing → done |
| Admin | Monitors, corrects stuck states, sees full history |
| System | Enforces the allowed transitions and triggers events |

## 4. Main screens / features

- **Job timeline (both sides)** — a visual step-by-step history:
  Posted → Offers → Selected → Scheduled → Arrived → Inspected → Estimate approved →
  In progress → Completed → Paid → Reviewed.
- **Worker action panel** — the action available right now (Arrive → Start repair →
  Complete).
- **Customer confirmation** — the customer confirms the work was done (where required by rules).
- **Overdue indicators** — missed visit times / unanswered actions highlighted.
- **Cancellation screen** — with the rule and reason selection, shown before it happens.

## 5. Data this module stores

| Field | Meaning |
|---|---|
| Job status | Current state of the job |
| Status history | Ordered list of every state change with who, when, optional reason |
| Event markers | Arrival time, repair start time, completion time |
| Cancellation record | Who cancelled, why, when, resolution path |

## 6. The full job state machine

This is the master list of job states (already introduced in the Overview):

```
draft            (optional internal stage before publishing)
open             (posted, waiting for offers)          Module 04
offers_received  (has at least one offer)              Module 06
offer_accepted   (an offer was selected)               Module 06 → 07
visit_scheduled  (visit time confirmed)                Module 07
visit_in_progress(worker arrived)                      Module 08 / this
visit_completed  (inspection done)                     Module 08
repair_negotiating(estimate waiting/countering)        Module 08
repair_approved  (customer approved the price)         Module 08
in_progress      (repair actually happening)           this module
completed        (work finished)                       this module
paid             (payment settled)                     Module 10
reviewed         (reviews submitted)                   Module 11

Terminal/alternate:
cancelled  (from any early state, by rules)
disputed   (from in_progress / completed / paid)       Module 18
```

### Allowed transitions recap

| From | To | Allowed when |
|---|---|---|
| open | offers_received | first offer arrives (Module 06) |
| offers_received | offer_accepted | customer selects an offer (Module 06) |
| offer_accepted | visit_scheduled | both sides confirm the visit time (Module 07) |
| visit_scheduled | visit_in_progress | worker presses Arrived (Module 08) |
| visit_in_progress | visit_completed | inspection notes recorded (Module 08) |
| visit_completed | repair_negotiating | estimate submitted (Module 08) |
| repair_negotiating | repair_approved | customer approves (Module 08) |
| repair_approved | in_progress | worker starts the repair (this module) |
| in_progress | completed | work finished (this module) |
| completed | paid | payment settled (Module 10) |
| paid | reviewed | reviews exist (Module 11) |
| early states | cancelled | rules in this module |
| in_progress/completed/paid | disputed | dispute opened (Module 18) |

**The server rejects any transition not in this table.** That is the heart of the module.

## 7. Main workflows

### Workflow A — Worker marks completion

1. The job is `in_progress` (repair approved, Module 08).
2. The worker finishes and presses **"Job Completed"**.
3. The server checks: job state is `in_progress`, worker is the assigned worker.
4. The job moves to `completed`.
5. The customer is notified and asked to confirm/verify (and then pay, Module 10).

### Workflow B — Customer confirms

1. The customer sees "Job completed — please confirm."
2. The customer confirms the work is done.
3. This unlocks payment (Module 10).
4. If the customer disagrees, they can raise a dispute (Module 18) within the rules.

### Workflow C — Overdue / reminders

1. A scheduled visit time passes without arrival → reminder sent.
2. An estimate waits unanswered too long → reminders.
3. Nothing is blocked forever — either action moves forward or it enters support (Module 18).

### Workflow D — Cancellation rules (fair cancellation)

Cancellation is a **rule-based** decision, not free-form. Example rules (fine-tuned by team):

- Cancelling before the visit → no payment; both sides freed.
- Cancelling after arrival / during repair → the agreed visit charge may still be due to the
  worker; a dispute path exists for disagreement.
- Repeated no-shows by a worker → tracked and affects reliability/reviews.
- The admin can cancel with a reason in special cases (Module 17/18).

## 8. Business rules (the system MUST)

1. The server is the only authority for state transitions (the screen cannot just change status).
2. Invalid transitions are rejected with a clear error.
3. Only the assigned worker can advance worker-owned transitions on this booking.
4. Only the customer can confirm completion (where required) and open a dispute.
5. Every transition is saved to the status history (audit + timeline).
6. Completion can only happen once money-eligibility rules are satisfied — no jumping to `paid`.
7. Cancellation requires a rule/ reason and is recorded; it never silently deletes data.
8. Overdue reminders are idempotent (no duplicate reminders for the same event).
9. The job cannot be edited (Module 04 rules) once it passes the booking stage.
10. Disputed jobs keep all history intact for support.

## 9. Edge cases the system must handle safely

- Worker marks completed and the customer never confirms → the system keeps the state visible and pays per payout rules; disputes are possible within the window.
- Both sides click conflicting actions at the same moment (cancel + complete) → the server applies one transition; the other is rejected with a clear message.
- A job stays stuck in `visit_scheduled` past the time → reminders + support path.
- Double "completed" clicks → one completion record only.
- Worker arrives but customer is not home → the worker marks arrived/no-show case; this is recorded and can become a dispute/support case.
- Customer wants to cancel after the worker arrived → follows cancellation rules; may involve the visit charge.
- Admin needs to fix a corrupted state → a logged, audited admin correction action (Module 17).

## 9b. Definition boundaries

This module defines the **rules and timeline**. The actual screens (timeline, action
buttons, reminders) are built here, but the *content* shown in each state is provided
by the other modules (offer data, estimate data, payment data).

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 04 Job Posting / 06 Offers / 07 Bookings / 08 Estimates | They create and use the states this module controls |
| 10 Payments & Wallet | Reads `completed`/`paid` states to control payment |
| 11 Reviews & Ratings | Reviews unlock after `paid`/`completed` |
| 13 Notifications | Every state change emits notifications |
| 17 Admin Operations | Admin fixes/stuck-job actions are audited here |
| 18 Disputes & Support | Disputes reopen/alter terminal states |

## 11. Definition of done

- [ ] The complete state machine is implemented on the server and rejects illegal transitions.
- [ ] The job timeline shows every historical state change with timestamps.
- [ ] Worker actions appear only when they are allowed (Arrived/Start/Complete).
- [ ] Customer confirmation unlocks payment.
- [ ] Overdue reminders are sent once, without duplicates.
- [ ] Cancellation follows the fair rules and is recorded with a reason.
- [ ] Completion cannot be reached without the required dependencies (estimate approved).
- [ ] Module 21 tests cover the whole transition map and every illegal jump.