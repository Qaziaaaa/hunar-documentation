# Module 18 — Disputes and Support

## 1. What this module is

This module handles **when things go wrong**: a customer or worker is unhappy,
a complaint is filed, or a payment is contested. It provides:

- a clear way for users to **report a problem** linked to a real booking/transaction,
- a **ticket** that is tracked and escalated,
- an **evidence trail** (all the recorded data from Modules 06–12),
- an admin **resolution workflow** (including money holds/refunds via Module 10),
- a **help center** with FAQs and support contact.

## 2. Why we build it

- Trust requires a fair process when things go wrong.
- Public complaints about competitors are mostly about price confusion and weak support.
- A structured dispute process (with evidence) is exactly the advantage we build.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Opens a dispute, tracks it, communicates with admin |
| Worker | Responds to a dispute, supplies their side |
| Admin | Investigates, decides, applies outcome |
| System | Collects the evidence trail automatically |

## 4. Main screens / features

- **Report a problem (customer/worker)** — pick the booking, describe the issue,
  choose the type (worker no-show, poor work, wrong price, payment problem, etc.), attach evidence.
- **My tickets (user)** — status of open cases.
- **Admin dispute queue** — cases with priority, evidence, and actions.
- **Evidence viewer** — timeline of offer/estimate/chat/payment/status for the booking.
- **Resolution actions** — release payment, refund (full/partial), send a message, escalate.
- **Help center** — FAQ for common questions (how offers work, two-stage pricing, cancellation, payment).
- **Contact support** — form for issues that are not tied to a booking.

## 5. Data this module stores

| Field | Meaning |
|---|---|
| Dispute/Ticket | Reporter, related booking (optional), type, description, status, priority, timestamps |
| Evidence snapshot | Reference to the related records (offer history, estimate, chat, payment state) |
| Resolution | Decision, amount action (refund/release), reason, decided by, decided at |
| Support message | Messages between admin and the user(s) within the ticket |
| Help center content | FAQ entries (admin can publish) |

## 6. Main workflows

### Workflow A — Customer opens a dispute

1. Customer opens "Report a problem" from a booking detail.
2. They choose the issue type, describe it, and attach anything extra.
3. The system attaches an **evidence snapshot** automatically:
   - job/offer/estimate history,
   - relevant chat messages,
   - payment state.
4. The ticket is created in `open` and appears in the admin queue.
5. Payment-related funds are flagged/held per Module 10 rules (if already paid).

### Workflow B — Admin investigates

1. Admin opens the ticket → reads the evidence snapshot and both sides' messages.
2. Admin can message both parties to ask clarifying questions.
3. Admin decides:
   - **release payment** to the worker (dispute dismissed), or
   - **refund** to the customer (full or partial), or
   - **split** (agreed amount), or
   - **escalate** (needs management/legal).
4. Module 10 executes the money outcome idempotently (refund/release).
5. Both sides are notified; the ticket closes with a summary.

### Workflow C — No-show / poor work patterns

1. Data about no-shows and repeated disputes is recorded.
2. Admin can act on patterns (warning, suspension via Module 17).

## 7. States and status changes

**Ticket status:**

```
open ──► investigating ──► resolved
  │           │
  └──► auto-closed (no response) └──► escalated (needs management)

Closed tickets keep full history.
```

## 8. Business rules (the system MUST)

1. A dispute must reference a real, verifiable record when one exists (booking/payment).
2. Evidence is collected automatically and included with the ticket (not typed by hand).
3. Money outcomes are applied **only through Module 10** — never by direct admin editing.
4. Refunds/releases are idempotent (re-running the resolution does not double-act).
5. Both sides get to state their case; messages are stored.
6. The user who opened the dispute can see its status and outcomes.
7. Support can auto-close stale tickets after a defined no-response period.
8. Escalations are visible to management and audited.
9. Suspension decisions coming from disputes go through Module 17 and are audited.
10. The help center answers the most common questions proactively (reduces tickets).

## 9. Edge cases the system must handle safely

- Payment already released, then a dispute arrives → hold/reversal rules from Module 10 apply; admin sees "already paid" state.
- Both customer and worker open a dispute about the same booking → merged into one ticket.
- Ticket opened on a cancelled job → allowed for specific types; evidence still readable.
- Customer sends abuse in the dispute text → flagged/moderation rules apply.
- Admin applies a refund twice → the second run is rejected (idempotency).
- Dispute stays idle → auto-close after N days with a summary message.
- Worker or customer is suspended mid-ticket → ticket continues; parties still see the outcome.

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 06 Offers / 08 Estimates / 09 Execution | Evidence snapshots |
| 10 Payments & Wallet | Money holds, refunds, releases |
| 12 Chat & Messaging | Chat evidence and support messages |
| 13 Notifications | Ticket status changes |
| 15 File Uploads & Media | User/appeals evidence attachments |
| 17 Admin Operations | Queue, decisions, suspensions |
| 19 Security & Audit | Every admin decision is logged |
| 01 Auth & Accounts | Who may open/track/act on tickets |

## 11. Definition of done

- [ ] A user can open a dispute from a booking with type, details, and automatic evidence.
- [ ] The admin queue shows tickets with priority and evidence access.
- [ ] Admin can message both sides and decide: release, refund (full/partial), split, escalate.
- [ ] Money outcomes are applied idempotently through Module 10.
- [ ] Both sides are notified and can view ticket status and outcome.
- [ ] Merging of duplicate tickets for the same booking works.
- [ ] Stale tickets auto-close after the defined window.
- [ ] A help center with the main FAQs is available.
- [ ] Module 21 tests cover evidence collection, idempotent refunds, merging, and auto-close.