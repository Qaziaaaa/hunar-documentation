# Module 06 — Offers and Negotiation

## 1. What this module is

This module handles the moment when a **worker proposes to take a job** and the
**customer chooses** who they want.

A worker sends an **offer** with:
- a **visit charge** (the fee for coming and inspecting),
- a note/message,
- an **ETA** (when they can arrive).

Multiple workers can send offers on one job. The customer compares the offers and
selects one. Once selected, workers are not locked out — the customer picks the one
they trust and like.

This module also supports **negotiation** so the customer and worker can agree on
the visit charge before anything is booked.

## 2. Why we build it

- Customers want **choice** (compare several workers, not just accept the first).
- Workers want the freedom to accept jobs they can do and decline ones they cannot.
- Fair, written pricing at this stage prevents disputes later.
- This reflects the market research: "customer posts the problem, workers compete
  with clear offers."

## 3. Who uses it

| Role | How they use it |
|---|---|
| Worker | Sends an offer on a matching, open job; can withdraw it |
| Customer | Views all offers, compares, negotiates, and selects one |
| Admin | Monitors offers and intervenes on complaints (via Module 17) |

## 4. Main screens / features

### Worker
- **Available job detail** with "Send Offer" form:
  - Your visit charge (Rs.)
  - Your note/message (optional)
  - ETA you can arrive (e.g. today 6 pm, or range)
  - estimated duration (optional)
- **My offers** list — status of each offer (pending / selected / rejected / withdrawn / inactive).
- **Withdraw offer** (only while `pending`).

### Customer
- **Job detail → Offers list** — a comparison card per offer showing:
  - worker photo, name, verified badge, rating, completed jobs, distance (Module 14)
  - visit charge, ETA, note
  - actions: Select / Negotiate / View profile
- **Negotiation view** — a short back-and-forth on the visit charge with message history.
- **Selected offer confirmation** — clearly shows the chosen price and worker before a booking is created (moves to Module 07).

## 5. Data this module stores

| Field | Meaning |
|---|---|
| Offer ID | Unique identifier |
| Job | The job the offer belongs to (Module 04) |
| Worker | Who offered (Module 01/02) |
| Visit charge | Proposed fee for visiting + inspecting |
| Note | Optional message |
| ETA | When the worker can arrive |
| Status | pending / selected / rejected / withdrawn / inactive |
| Negotiation history | Ordered list of amount + note + who + timestamp |
| Timestamps | Created/updated |

## 6. Main workflows

### Workflow A — Worker sends an offer

1. Worker opens a matched, open job (Module 05 → 04).
2. Worker enters visit charge, note, and ETA.
3. The server validates:
   - worker is verified and active,
   - worker matches the job category,
   - job is still open (not cancelled/booked),
   - worker has no existing pending offer on this job (one offer per worker per job).
4. The offer is saved as `pending`.
5. The job moves to `offers_received` (if not already).
6. The customer is notified (Module 13) and the offer appears in their list.

### Workflow B — Customer compares and selects

1. Customer views all offers, sorted by distance/rating/charge (customer can choose sort).
2. Customer opens the selected offer card → reads details → "Select this offer".
3. The server checks the job is still eligible (no other booking already confirmed).
4. The offer's status becomes `selected`; all other pending offers become `inactive`.
5. The chosen worker is notified.
6. The system proceeds to create the booking (Module 07).

### Workflow C — Negotiation (adjusting the visit charge)

1. Customer opens an offer → "Negotiate".
2. Customer proposes a new visit charge with a message.
3. Worker sees the counter-proposal and can accept, decline, or counter.
4. Each change appends to the negotiation history (max rounds limit).
5. When both agree, the displayed visit charge is updated and the customer can select.
6. Every negotiation step is recorded (evidence for later if needed).

### Workflow D — Withdraw / reject

- **Worker withdraws** their pending offer → status `withdrawn`.
- **Customer rejects** an offer explicitly → status `rejected` (optional; usually offers simply stay pending until one is selected).

## 7. States and status changes

**Offer states:**

```
pending ──► selected   (customer selects, only one per job)
pending ──► withdrawn  (worker removes it)
pending ──► inactive   (another offer was selected)
pending ──► rejected   (customer says no)
```

**Job state changes driven by this module:**

```
open ──► offers_received  (first offer arrives)
offers_received ──► offer_accepted  (selection made → Module 07)
```

## 8. Business rules (the system MUST)

1. Only verified, active workers who match the job's category can offer.
2. Only one **pending** offer per worker per job (a duplicate is rejected).
3. A worker cannot offer on a cancelled or already-booked job.
4. Only one offer can ever become `selected` for a job.
5. Selecting an offer automatically inactivates all other offers on that job.
6. Only the job's owner customer can select or negotiate an offer.
7. Negotiation rounds are limited (designation value, e.g. 5) to prevent infinite loops.
8. Every negotiation step is persisted (no silent changes to price).
9. Withdraw is allowed only while the offer is `pending`.
10. Offers cannot be changed after selection.
11. The visit charge shown to the customer is the same value used later for booking and payment (one source of truth).

## 9. Edge cases the system must handle safely

- Worker double-clicks "Send Offer" → only one offer record.
- Two customers try to select different offers on the same job — impossible: only the owner can select, and selection is protected against races.
- Worker sends an offer the exact moment the customer posts a cancellation → the offer is rejected (job no longer open).
- Customer wants to compare after selecting → selection is final; they can only proceed or cancel the booking (Module 07).
- Worker withdraws an offer after negotiation started → offer ends; history remains.
- Negotiation reaches the max rounds → the current proposal is the final one; customer accepts or the offer stays pending.
- ETA is in the past → validation asks for a future time.
- A second offer from the same worker after the first was rejected → allowed (one pending rule).

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 02 Profiles & Verification | Offer cards use profile, verification, rating |
| 03 Service Categories | Eligibility check uses category skills |
| 04 Job Posting | Offers attach to a job and change its state |
| 05 Discovery & Matching | Only matched workers can open the offer flow |
| 07 Bookings & Scheduling | Selected offer creates the booking |
| 10 Payments & Wallet | Visit charge flows into booking amount and commission |
| 12 Chat & Messaging | Customer and worker may chat before/after offers |
| 13 Notifications | Offer received / selected / withdrawn events |
| 17 Admin Operations | Admins review offers in disputes |
| 18 Disputes & Support | Negotiation history is dispute evidence |

## 11. Definition of done

- [ ] A verified matching worker can send an offer with visit charge, note, and ETA.
- [ ] A customer sees all offers on the job as comparison cards with all required signals.
- [ ] A customer can negotiate the visit charge (bounded rounds, full history saved).
- [ ] Selecting one offer makes it `selected` and all others `inactive`.
- [ ] Only one selected offer per job is enforced, even under rapid requests.
- [ ] One pending offer per worker per job is enforced.
- [ ] Workers can withdraw only pending offers.
- [ ] Offers are blocked on cancelled or booked jobs.
- [ ] Module 21 tests cover selection race, duplicates, negotiation limits, and eligibility.