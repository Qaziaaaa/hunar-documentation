# Module 10 — Payments, Wallet and Commission

## 1. What this module is

This module handles all **money-related** work:

- collecting payment from the customer safely when the job is done,
- holding/controlling the money (protected payment / escrow concept),
- recording every money movement in a **ledger** (a financial record book),
- calculating and collecting the **platform commission**,
- the **worker wallet** (a running balance of earnings, top-ups, and deductions),
- worker **payouts/withdrawals**.

**Critical principle:** the platform's own payment code never handles card/payment
secrets directly — a trusted **payment provider** does the actual money movement.
The platform keeps a clean internal ledger of every financial event, and the final
payment state always comes from the provider + server, never from the web page.

> ⚠️ The exact commission model is a **business decision**. This document describes
> both models researched by the team and lists what must be finalized. The technology
> is decided separately (this doc deliberately names no products).

## 2. Why we build it

- Trust: the customer only pays when the work is done.
- Safety: money is protected and disputes are possible.
- Revenue: the commission is the platform's business model.
- Clarity: a ledger makes every rupee explainable (audit, disputes, analytics).
- Motivation: workers know exactly what they earn.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Pays for a completed job; sees payment status and receipt |
| Worker | Sees earnings; top-ups; withdraws balance |
| Admin | Monitors payments, revenue, payouts; resolves payment issues |
| Payment provider | Executes the actual money transfer; sends confirmations (webhooks) |
| System | Records ledger entries, enforces money rules |

## 4. Main screens / features

### Customer
- **Payment screen** — shows job + worker + total (approved repair estimate, Module 08),
  payment method choice, "Pay" button, and a secure confirmation by the provider.
- **Payment history** — receipts per booking with status.

### Worker
- **Earnings dashboard** — current wallet balance, recent transactions.
- **Top-up screen** — add funds to the wallet through supported channels.
- **Withdrawal screen** — request payout to a saved account/app; shows status.

### Admin
- **Payments overview** — all transactions, statuses, revenue.
- **Payout monitoring** — bank/provider payout runs and failures.

## 5. The two money models researched (business decision needed)

### Model A — "Transaction commission on the repair amount" (from backend architecture notes)
- Customer pays the agreed repair amount after completion.
- Platform keeps a **percent** (e.g. 15% — configurable) as commission.
- The rest is paid to the worker.
- Example: job Rs. 10,000 → platform Rs. 1,500 → worker Rs. 8,500.

### Model B — "Visit-charge commission + worker wallet" (from payment/wallet research)
- The worker has a **wallet** that starts at Rs. 0.
- When the worker presses **"Arrived"**, a commission of **X% of the visit charge**
  is deducted from the worker's wallet (research example used 10%).
- Example: visit charge Rs. 500 → commission Rs. 50 deducted from the wallet.
- The wallet balance decides worker availability:
  - balance ≥ threshold (e.g. -Rs. 500) → worker online,
  - balance < threshold → worker offline.
- Workers can top up, and withdraw (min Rs. 100) when balance allows.
- Every deduction/top-up/withdrawal creates a ledger entry.

### Whatever model is finalized, these things MUST exist:
- a **ledger** with an entry for every money event (amount, type, who, booking, before/after balance, timestamp),
- **provider-confirmed status** before money movement is trusted,
- **idempotency** (arrival commission can never be charged twice; payment never processed twice),
- a clear **refund/void** path when cancellation or disputes require it,
- clear payout statuses for workers.

## 6. Data this module stores (conceptual)

| Data | Meaning |
|---|---|
| Payment | Booking reference, amount, currency, provider reference, status, timestamps |
| Ledger entry | Type (PAYMENT, COMMISSION, TOP_UP, WITHDRAWAL, REFUND, ADJUSTMENT), amount, balance before/after, related booking, timestamp |
| Wallet | Worker reference, current balance |
| Withdrawal | Worker, amount, method, status, provider reference |
| Commission setting | Rate + which booking/visit it applies to (configurable by admin) |

## 7. Main workflows

### Workflow A — Customer pays (Model A style: pay-after-completion)

1. Job is `completed` (Module 09) and the customer confirms.
2. Customer opens the payment screen → total is the approved repair amount.
3. Customer chooses a method → the provider starts the payment.
4. The provider returns a status; the platform records a payment of state `pending`.
5. The provider confirms (webhook → server verification, including duplicate-callback protection).
6. The payment becomes `paid`; the job becomes `paid`.
7. The platform creates ledger entries: customer payment, platform commission, worker payout hold.
8. Payout to the worker happens per the payout rules (e.g. after a short review window).

### Workflow B — Worker wallet top-up (Model B)

1. Worker requests a top-up amount.
2. Provider processes the payment; only **after provider confirmation** is the wallet credited.
3. A ledger entry records the top-up.
4. The wallet balance updates; online/offline status is re-calculated.

### Workflow C — Arrival commission (Model B, idempotent)

1. Worker presses "Arrived" (Module 08/09).
2. The server checks no commission is already recorded for this booking's arrival.
3. Commission = visit charge × rate → deducted from the wallet; platform revenue ledger +same amount.
4. The balance is re-checked against the threshold → possibly the worker goes offline.
5. The ledger stores old balance, new balance, amount, and booking reference.

### Workflow D — Worker withdrawal

1. Worker requests withdrawal with amount and destination (app/bank).
2. Checks: amount ≥ minimum, amount ≤ available balance.
3. Withdrawal enters `REQUESTED`.
4. Payout executes (provider/bank) → `SUCCESS` or `FAILED`.
5. On success, balance reduces and ledger records the payout. On failure, balance and state are corrected.

### Workflow E — Refund / dispute hold

1. A dispute (Module 18) is opened after payment.
2. The related funds are flagged/held per rules.
3. Resolution: release to worker or refund to customer (or split) — all in the ledger.

## 8. States and status changes

**Payment state:**

```
pending ──► paid
  │          │
  └──► failed   └──► refunded (from paid)
      cancelled  └──► disputed/hold (Module 18)
```

**Withdrawal state:**

```
REQUESTED ──► PROCESSING ──► SUCCESS
                              └──► REVERSED (if payout bounces)
              └──► FAILED (no balance change)
```

## 9. Business rules (the system MUST)

1. The payment provider's confirmation is the source of truth for payment success;
   the web page's "success screen" is never trusted.
2. Every money movement creates a ledger entry — the wallet balance alone is not the truth.
3. Money events are idempotent: the same event (arrival, payment callback, withdrawal) cannot create two entries.
4. Worker payouts only happen after the relevant completion/dispute rules are satisfied.
5. Customer addresses/payment methods/card details are never stored by the platform (only the provider does).
6. Refunds are recorded and reversible-safe; failed payouts have a defined correction path.
7. Negative worker balances (in Model B) are allowed by the wallet but online eligibility is controlled by the threshold.
8. All payment, commission, top-up and withdrawal data is visible to the admin; sensitive values are masked in logs.
9. If the commission model is per-category, the category (Module 03) supplies the rate.
10. Anything that touches money is logged for audit (Module 19).
11. The exact threshold, rate, minimums, and check that "arrival really happened" are configurable and validated with the team.

## 10. Edge cases the system must handle safely

- Payment provider is down → the customer sees a clear pending/failed state; no stuck money.
- Duplicate webhook callback → ignored; payment processed once.
- Worker presses "Arrived" twice → one commission charge only.
- Customer pays, then claims the work was wrong → the dispute hold path engages; no silent release.
- Payout fails after balance already reduced → the balance is reversed and the worker can re-request.
- Withdrawal below minimum or above balance → rejected with the exact reason.
- Double payment via network retry → one payment record; the second attempt is rejected or ignored.
- Commission rounding → consistent rounding rule for paisa amounts.
- Worker wallet balance precisely at the threshold → needs a documented boundary rule (>= allowed).
- Fraud attempt (user faking a provider callback) → signature verification rejects it.

## 11. Connections to other modules

| Module | How they connect |
|---|---|
| 07 Bookings / 08 Estimates | The amount paid comes from the approved repair estimate |
| 09 Execution & Completion | `completed` unlocks payment; `paid` follows payment |
| 11 Reviews & Ratings | Reviews require a completed+paid job |
| 17 Admin Operations | Payment monitoring, payout runs, settings |
| 18 Disputes & Support | Holds, refunds, and resolution flow from disputes |
| 19 Security & Audit | Webhook verification, audit logging |
| 05 Discovery & Matching | In Model B, wallet balance affects worker availability |

## 12. Open business decisions to finalize before building

1. Commission model: percent of repair amount OR percent of visit charge from the wallet.
2. Exact commission rate and whether any category is different.
3. Whether the customer pays before work (deposit/milestone) or after completion.
4. The review/hold window before worker payout.
5. Wallet thresholds, top-up channels, minimum withdrawal, payout channels.
6. How "Arrived" is verified as real (GPS/timestamps/photo) to prevent fraud.
7. Refund rules for: customer no-show, worker no-show, mid-work cancellation, poor workmanship.

> None of these decisions change the *module structure* above — they only change
> the numbers and one or two flows (Model A vs Model B wiring).

## 13. Definition of done

- [ ] Customer can pay for a completed job via a trusted provider; statuses are clear and server-verified.
- [ ] The ledger records every money event; every balance is explainable.
- [ ] Idempotency is proven for arrival commission, payment callbacks, and withdrawals.
- [ ] Worker wallet (if used) supports top-up, balance display, online/offline threshold, and withdrawal.
- [ ] Commission is calculated correctly and recorded as platform revenue.
- [ ] Refund and payout reversals leave correct ledger trails.
- [ ] No payment secrets are stored or logged by the platform.
- [ ] Module 21 tests cover: duplicate callbacks, double-arrival, failed payouts, threshold boundaries, rounding.