# Module 08 — Visits, Inspection and Repair Estimates

## 1. What this module is

This module handles the **second stage of pricing** — the most important idea in the
whole product.

Home repair prices are hard to predict from a written description alone. A plumber cannot
know the exact price of a hidden pipe problem before seeing it. So the product splits the
price into two stages:

- **Stage 1 (already handled by Module 06):** the customer and worker agree on a
  **visit charge** — what it costs for the worker to come and look.
- **Stage 2 (this module):** the worker comes, **inspects** the problem, and submits a
  **repair estimate** — the real price. The customer **approves** (or negotiates) it
  before any repair work starts.

This prevents the classic complaint: "the price changed after the worker arrived."
Here, that change is **expected, written down, and approved by the customer first**.

## 2. Why we build it

- It creates **trust** — no surprises after the visit.
- It is the competitive differentiator found in market research.
- It gives both sides a clear record: what was inspected, what was estimated, who approved what.
- It protects the worker too — they no longer promise a price without seeing the job.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Worker | Marks visit arrival, records inspection notes/photos, submits the repair estimate, negotiates |
| Customer | Sees inspection results, approves/negotiates/rejects the estimate |
| Admin | Reviews inspection and estimate evidence in disputes (Module 18) |

## 4. Main screens / features

### Worker
- **Visit arrive** action (moves booking to `in_progress`, see Module 09).
- **Inspection form** — notes + photos of what they found, optional cause summary.
- **Repair estimate form** — itemized breakdown:
  - parts cost
  - labour cost
  - other charges
  - **total**
  - short explanation / warranty note (optional)
- **Estimate status** — waiting consumer approval / approved / negotiated / rejected.

### Customer
- **Visit tracker** — worker arrived status (Module 09), ready to inspect.
- **Inspection summary** — what the worker found (notes + photos).
- **Estimate review screen** — itemized total + approve / reject / counter.
- **Negotiation view** — bounded rounds of counter-proposals, fully recorded.

## 5. Data this module stores

| Field | Meaning |
|---|---|
| Visit | Booking reference, scheduled time, arrival time, status, inspection notes, photos |
| Repair Estimate | Visit reference, itemized lines (parts/labour/other), total, status |
| Negotiation history | Ordered list: who, amount, note, timestamp, round number |
| Evidence | Photos/notes attached to inspection and estimate changes |

## 6. Main workflows

### Workflow A — Visit and inspection

1. The booking is `confirmed` with a scheduled time (Module 07).
2. The worker arrives and presses **"Arrived"**.
3. The booking moves to `in_progress` (Module 09 handles this transition).
4. The worker inspects the problem and records notes + photos.
5. The system requires inspection notes before continuing (no empty estimates).
6. The customer sees the inspection summary.

### Workflow B — Repair estimate

1. The worker submits an itemized repair estimate with a total.
2. The estimate is `pending_customer_approval`.
3. The customer reviews the itemized breakdown and total.
4. The customer can:
   - **Approve** → estimate is approved → repair may start (job → `repair_approved`, Module 09), or
   - **Counter/negotiate** → new amounts in a bounded loop, or
   - **Reject** → the booking may be repackaged/cancelled or a dispute raised (Module 18).

### Workflow C — Negotiation of the repair estimate

1. Either side proposes a new total (or per-line) with a note.
2. Each proposal is recorded with round number, amount, note, timestamp.
3. Rounds are limited (same rule as Module 06 negotiation).
4. When both agree, the approved amount becomes the fixed repair price.

## 7. States and status changes

**Repair estimate status:**

```
pending_customer_approval ──► approved
        │                        │
        ├──► negotiating ────────┘
        └──► rejected (customer refuses)
```

**Booking/job states driven by this module:**

```
confirmed ──► in_progress (worker arrived)
in_progress ──► visit_completed (inspection done)
visit_completed ──► repair_negotiating (estimate submitted)
repair_negotiating ──► repair_approved (customer approves)
```

## 8. Business rules (the system MUST)

1. The worker must record inspection notes (and ideally photos) before submitting an estimate.
2. The repair estimate is **required before any repair starts** — work may not begin without approval.
3. The repair price can be **higher or lower** than any earlier guess, but the customer must approve the final value in writing (recorded).
4. Every price change is visible and recorded — **no silent price changes**.
5. Negotiation rounds are limited (design value, e.g. 5 rounds) to guarantee closure.
6. Only the assigned worker can submit the estimate for the booking.
7. Only the customer of the booking can approve/reject/counter the estimate.
8. The approved repair total flows to payment (Module 10) as a single source of truth.
9. Photos and notes from inspection become evidence for disputes (Module 18).
10. If the customer rejects the estimate, the booking must be closed safely (cancel/resolve path), not left stuck.

## 9. Edge cases the system must handle safely

- Worker submits an estimate with zero or negative total → rejected by validation.
- Customer never responds to the estimate → after a time limit, reminders are sent; the system keeps the state clear, not stuck.
- Worker finds the problem is far worse than described → they must submit the estimate and get approval first — no work without approval.
- Worker wants to start work immediately (small jobs) → still must get approval; approval can be quick ("Approve now").
- Customer counters below cost → worker can decline and the flow ends; recorded either way.
- Negotiation loop → max rounds ends it; last accepted value sticks.
- Both sides approve different values by double click → server uses one recorded order of events; duplicate approval requests are ignored.
- Worker is suspended mid-estimate → admin resolves (Module 17/18).

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 07 Bookings & Scheduling | The visit/estimate belongs to a confirmed booking |
| 09 Execution & Completion | Drives job/booking state transitions (arrived, visit completed, repair approved) |
| 10 Payments & Wallet | The approved repair total becomes the payment amount |
| 11 Reviews & Ratings | Estimation fairness affects reviews |
| 13 Notifications | Estimate submitted / approved / countered events |
| 15 File Uploads & Media | Inspection photos and estimate attachments |
| 18 Disputes & Support | Full recorded audit trail of inspection + estimation = evidence |

## 11. Definition of done

- [ ] Worker marks "Arrived" and records inspection notes/photos.
- [ ] Worker submits an itemized repair estimate; it cannot be submitted without inspection notes.
- [ ] Customer sees the itemized estimate and can approve, counter, or reject.
- [ ] No repair work is possible before approval (state enforcement).
- [ ] Negotiation is bounded and fully recorded (who, amount, note, when).
- [ ] Approved total is a single source of truth for payment.
- [ ] Rejection of an estimate leads to a clean resolution path (cancel/dispute).
- [ ] Module 21 tests cover the estimate states, ordering, and no-work-without-approval rule.