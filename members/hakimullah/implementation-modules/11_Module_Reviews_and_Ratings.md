# Module 11 — Reviews and Ratings

## 1. What this module is

This module lets customers and workers **rate and review each other** after a
completed job.

- A rating is a number from 1 to 5 stars.
- A review adds optional comments.
- Reviews are shown on worker public profiles (Module 02) so future customers can
  judge quality.
- The worker's **average rating** is calculated from all reviews — and it is used in
  matching (Module 05) as a ranking signal.

## 2. Why we build it

Trust is the currency of a marketplace:

- good workers rise because of real proven work,
- customers can choose based on evidence, not guesswork,
- the platform can spot problems early (repeat bad reviews → support attention),
- a visible rating history improves quality for everyone.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Reviews the worker after a completed paid job |
| Worker | Reviews the customer (where allowed by rules); sees their own rating |
| Everyone | Reads reviews on public profiles |
| Admin | Flags and removes inappropriate reviews (Module 17) |
| System | Calculates average ratings for matching/search |

## 4. Main screens / features

- **Review form** (after completion) — 1–5 stars + comment (optional), for the other party.
- **Review history** — a person's reviews with dates and context (which job).
- **Public profile reviews section** — recent reviews + overall average.
- **Review eligibility notice** — "You can review after the job is paid/completed."
- **Flag content** — a link/button to report an inappropriate review (goes to admin).
- **Rating display** — average and count (e.g. "4.8 (120 reviews)").

## 5. Data this module stores

| Field | Meaning |
|---|---|
| Review | Booking reference, reviewer, reviewee, rating (1–5), comment, status |
| Rating summary | Worker reference, average rating, count (derived, stored for speed) |
| Flag record | Review reference, who flagged, why, status |

## 6. Main workflows

### Workflow A — Customer reviews a worker

1. Job reaches `paid` (Module 10) — the system marks the customer as eligible to review.
2. The customer opens the review prompt / profile → gives rating + optional comment.
3. The server validates eligibility:
   - booking is completed and paid,
   - the reviewer is the customer of the booking,
   - no duplicate review already exists for this booking → same side.
4. The review is saved.
5. The worker's average rating and review count are recalculated.
6. The review appears on the worker's public profile.

### Workflow B — Worker reviews the customer (where allowed)

Same pattern, with the worker as reviewer and the customer as reviewee.
The platform may choose to reveal worker reviews only after both reviews exist,
or hide customer ratings publicly — a product rule to finalize.

### Workflow C — Flagging an inappropriate review

1. Anyone flags a review (spam/abuse/off-topic).
2. The review goes to the admin queue (Module 17).
3. Admin decides: keep as-is, hide, or remove.
4. An audited decision is recorded.

## 7. States and status changes

**Review status:**

```
active ──► flagged ──► removed (admin)
           └──► cleared-for-use (admin review: keep)
```

## 8. Business rules (the system MUST)

1. A review is allowed **only after a completed, paid booking** — never earlier.
2. **No duplicate reviews**: one reviewer can review the receiving side once per booking.
3. Ratings are integers **1–5** (a 0 is not a valid rating; the UI may show half-stars but the stored value is 1–5).
4. The reviewer must be a participant in the booking (customer or worker).
5. A review submitted twice (double click/retry) → only one is created.
6. The average rating is **calculated** from stored reviews — never typed in by users.
7. Reviews can be flagged; removal decisions are admin-only and audited.
8. Workers cannot remove their own bad reviews; only admins can.
9. Review comments respect platform rules (no personal abuse); flagged content goes to admin.
10. A suspended user's old reviews stay visible unless removed by an admin (history preserved).

## 9. Edge cases the system must handle safely

- Customer tries to review before paying → rejected with "only after the job is paid".
- Both sides attempt to review the same moment → both allowed once each, no duplicates.
- Same reviewer double-submits → second request rejected as duplicate.
- Worker gets a 1-star rating after a misunderstanding → flag → admin reviews evidence (Module 18).
- Average rating math → stores count and average as derived fields; recalculation is deterministic.
- Review removed by admin → shown as count-consistent (removed reviews no longer count toward average).
- Review comments contain links/abuse → flagged automatically by simple rules; admin decides.

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 02 Profiles & Verification | Rating summary stored on the worker profile |
| 05 Discovery & Matching | Rating is a ranking signal |
| 07 Bookings / 08 Estimates | Review references the booking |
| 09 Execution & Completion | `paid` state unlocks reviews |
| 10 Payments & Wallet | Only paid jobs are reviewable |
| 13 Notifications | Both sides are notified when a review arrives |
| 17 Admin Operations | Flag queue and removal decisions |
| 18 Disputes & Support | Reviews can be used as context in a dispute |

## 11. Definition of done

- [ ] A customer can review a worker (1–5 + comment) only after a completed, paid booking.
- [ ] A worker can review a customer per the platform rule.
- [ ] No duplicate reviews per booking per side are possible.
- [ ] Average rating and review count are correct on public profiles.
- [ ] Reviews can be flagged and admin can hide/remove them with an audit record.
- [ ] Double-submission and invalid-rating cases are handled.
- [ ] Module 21 tests cover eligibility, duplicates, flagging, and rating math.