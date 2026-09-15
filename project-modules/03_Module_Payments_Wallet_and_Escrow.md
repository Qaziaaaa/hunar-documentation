# Module 3 — Payments, Wallet & Escrow

## Purpose of This Module
Everything about money — how a customer pays for completed work, how workers hold/spend/withdraw a wallet balance, how the platform earns commission, what is escrowed and when, and the financial ledger that records every rupee movement.

**Covers requirement:** FR-18 (support online payments). It consolidates: the **finalized Fixora payment & wallet model** (Hashim's research, 10% of visit charge), the **escrow design** from the backend architecture & Shafqat's module design (15% of total), the payment ledger, provider strategy (JazzCash/Easypaisa/card/cash), and every payment-related risk from `platform-questions-and-risks.md`.

> ⚠️ This module documents **both models** because the team referred to both. Model A is the one marked **finalized**; Model B is the **reviewed design**. Builders must confirm with the team which applies before implementation (see §9 Decision gate).

---

## 1. The Two Models at a Glance

| Aspect | Model A — Finalized (Hashim / Fixora flow) | Model B — Reviewed design (backend arch / Shafqat) |
|---|---|---|
| Revenue source | Worker visiting charge only | Total job/repair amount |
| Commission | **10% of the visit charge** | **15% of total** (configurable per category) |
| Commission trigger | Worker presses **Arrive** | Automatic at payout after payment |
| Deducted from | **Worker wallet** | **Customer payment (escrow)** before worker payout |
| Customer payment hold | **None** (customer pays cash/digital directly; no platform hold) | **Escrow 24h** (refund protection) after customer pays gateway |
| Worker payout | Wallet is credited on service; withdraw any time (min Rs. 100) | After **24-hour review window**, daily batch payout |
| Refund window | Not applicable (no hold) | 24 hours after payment |
| Offline rule | Wallet < **-500** → worker offline | Model B wallet still uses **-500** availability gate |
| Escrow/regulatory risk | Minimal (no custody of customer funds) | Must use a **compliant provider**, never Fixora's own bank account |

**Business rules both models share:**
- **Worker wallet starts at Rs. 0** (no free signup credit).
- Wallet top-up methods: **Easypaisa, JazzCash, Bank Transfer**.
- **Online if balance >= -Rs.500; offline if < -Rs.500** (−500 allowed).
- Wallet **can go negative**.
- **Minimum withdrawal Rs. 100; withdrawal ≤ available balance; automatic (no admin approval).**
- Payment success is **verified via backend/provider webhook**, never the frontend.
- Every money movement has a **ledger record** — wallet balance alone is never the source of truth.

---

## 2. Model A in Detail — Worker Wallet & 10% Visit-Charge Commission (FINALIZED)

### 2.1 The main flow
```text
Worker signs up → Wallet = Rs. 0
  → Top-up (Easypaisa / JazzCash / Bank) → wallet credited after PROVIDER CONFIRMS success
  → Worker Online (balance >= -500)
  → Customer books the online worker
  → Worker reaches the customer location
  → Worker presses "Arrive"        ← COMMISSION TRIGGER (exactly one allowed per booking)
  → Commission = Visiting Charge × 10%
  → Deducted from worker's wallet
  → Fixora revenue ledger: + commission
  → Re-check threshold:
      balance >= -500 → Online
      balance <  -500 → Offline (new orders stop coming)
```

### 2.2 Worked examples
| Wallet before | Visit charge | Commission (10%) | Wallet after | Status |
|---:|---:|---:|---:|---|
| Rs. 500 | Rs. 1,000 | Rs. 100 | Rs. 400 | Online |
| Rs. 0 | Rs. 500 | Rs. 50 | -Rs. 50 | Online |
| -Rs. 480 | Rs. 500 | Rs. 50 | -Rs. 530 | **Offline** |
| -Rs. 500 | Rs. 1,000 | Rs. 100 | -Rs. 600 | **Offline** |
| -Rs. 100 | Rs. 800 | Rs. 80 | -Rs. 180 | Online |

Revenue table:
| Visit charge | Fixora revenue (10%) |
|---:|---:|
| Rs. 300 | Rs. 30 |
| Rs. 500 | Rs. 50 |
| Rs. 800 | Rs. 80 |
| Rs. 1,000 | Rs. 100 |
| Rs. 2,000 | Rs. 200 |

### 2.3 Online/offline boundary (exact)
```
Balance >= -500 → ONLINE    (Rs. 500, Rs. 0, -Rs. 100, -Rs. 499, -Rs. 500)
Balance <  -500 → OFFLINE   (-Rs. 501, -Rs. 605, …)
```
Coming back online: top up enough so balance returns to >= -500 (e.g. -530 + Rs. 30 = -500 → Online).

### 2.4 Wallet top-up
1. Worker requests top-up (Easypaisa / JazzCash / Bank Transfer).
2. Gateway processes the payment.
3. **Gateway webhook confirms success first** → only then: create ledger entry → credit wallet.
4. Never credit from the client-side success screen alone.

### 2.5 Wallet withdrawal
```
Request withdrawal
  → Amount >= Rs. 100?        NO → "Minimum withdrawal is Rs. 100"
  → Amount <= wallet balance?  NO → "Insufficient balance"
  → YES → auto-payout to selected destination (Easypaisa / JazzCash / Bank)
  → Ledger: WITHDRAWAL; wallet debited
```
Examples: Rs.80/request Rs.100 → reject; Rs.300/request Rs.50 → reject; Rs.300/request Rs.300 → allow.

Withdrawal statuses: `REQUESTED → PROCESSING → SUCCESS / FAILED / REVERSED`. If a payout fails/reverses, funds return to the wallet (`WITHDRAWAL_REVERSAL`).

### 2.6 Cash payments (Model A)
Customer can pay the worker **cash on delivery**. The **10% commission is still deducted from the worker wallet** on the `Arrive` event — cash or digital, the commission is the same. (Worker may also record "Confirm Cash Received" for bookkeeping.)

### 2.7 Critical implementation control — Arrived idempotency
Same booking must be charged **exactly once**:
```
Arrived click #1 → commission deducted (record per booking/event)
Arrived click #2 → ignored (idempotent key in Redis)
Arrived click #3 → ignored
```

---

## 3. Model B in Detail — Escrow + 15% (REVIEWED DESIGN)

### 3.1 Flow
```
Job completed (Module 2)
  → Customer pays FULL amount via JazzCash / Easypaisa / card / cash
  → Gateway webhook confirms → payment status = completed
  → Platform holds funds in ESCROW for 24 hours (refund protection)
  → No dispute in 24h:
       commission (15%) deducted automatically
       worker receives 85% (payout batch / wallet credit)
       job → paid
  → Dispute filed within 24h:
       funds held pending admin resolution (Module 4)
```

### 3.2 Commission math
```
Total repair amount:      Rs. 10,000
Platform commission (15%): Rs.  1,500
Worker payout (85%):       Rs.  8,500
```
Commission **configurable per category** (default 15%) — changed only by Super Admin (Module 4).

### 3.3 Payouts
- Worker payouts processed **daily (batch)** via BullMQ queue.
- Refund window = **24 hours** after payment.
- Compliance note from tech recommendations: escrow/custody/settlement/KYC/payouts have regulatory requirements — the final design must use a **compliant provider** and proper legal/regulatory review. Fixora must **never hold customer money in its own bank account**.

---

## 4. Payment Methods (both models)

| Method | Notes |
|---|---|
| **JazzCash** | Primary payload rail |
| **Easypaisa** | Secondary |
| **Card** (debit/credit) | Via Stripe or equivalent |
| **Cash** | Worker collects; commission handling per model (A: wallet deduct; B: nominal/ledger) |
| Wallet balance (customer credit feature) | Optional later |

### Payment state machine
`pending → processing → completed / failed / refunded` (cancelled also possible pre-completion).

### Provide-safe rules (SRS FR-07)
- Payment info stored **separately** from job/booking status.
- Transaction reference returned by the provider is stored (`gateway_ref`).
- Payment status verified from **backend + provider records only**.
- Duplicate provider callbacks **must not** double-record or double-transition (idempotent webhook handling).
- Webhook signature verified on every callback.

---

## 5. Payment Gateway Layer

### 5.1 Abstraction
```
gateway.interface.ts
├── jazzcash.gateway.ts
├── easypaisa.gateway.ts
└── stripe.gateway.ts
```

### 5.2 Webhooks
```
POST /api/v1/webhooks/payment/:gateway
  → verify signature
  → update payment status (idempotent)
  → update ledger
  → trigger commission settlement (Model B) / record commission (Model A)
  → notify customer + worker (Module 4)
```

### 5.3 Pakistan provider landscape (from Hashim's research)
- **Raast P2M** (SBP): QR, alias, IBAN, Request-to-Pay — for business payment acceptance via a bank/PSP.
- **JazzCash Business/Corporate:** merchant API, online payment, corporate disbursement/payout.
- **Easypaisa:** merchant portal/online gateway, corporate onboarding, **Bulk Disbursement API**.
- Providers above are **not chosen yet** — see open items.

### 5.4 Provider onboarding checklist (must finalize before production)
- [ ] Merchant/corporate onboarding requirements
- [ ] API access & credentials process
- [ ] Webhook/callback + signature verification
- [ ] Settlement timing & fees (MDR)
- [ ] Transaction limits
- [ ] Refund / reversal handling
- [ ] Payout / disbursement API support
- [ ] Failed-payout handling
- [ ] Reconciliation process (provider statements ↔ Fixora ledger)
- [ ] Compliance / KYC / AML for Fixora's final structure

---

## 6. Data Model

### 6.1 `payments` (Payment Ledger — exists in DB design)
| Column | Notes |
|---|---|
| id | UUID PK |
| job_id | FK service_requests |
| customer_id / worker_id | FK users |
| amount | Total |
| platform_fee | Commission |
| worker_payout | Worker's share |
| method | jazzcash / easypaisa / stripe / cash / card (CHECK) |
| status | pending / processing / completed / failed / refunded |
| gateway_ref | Provider reference |
| gateway_response | JSONB raw payload |
| paid_at / refunded_at | |
| created_at / updated_at | |

### 6.2 Wallet tables (Model A — must be ADDED to DB schema)
The finalized wallet model requires tables that the current database design does not yet define. **Add:**

`wallets`
| Column | Notes |
|---|---|
| user_id | UUID PK/FK → worker |
| balance | DECIMAL(12,2) default 0 |
| min_online_balance | Config, default -500 |
| updated_at | |

`wallet_ledger` (transaction log)
| Column | Notes |
|---|---|
| id | UUID PK |
| worker_id | FK |
| booking_id / job_id | FK |
| type | `TOP_UP` / `COMMISSION_DEBIT` / `WITHDRAWAL` / `WITHDRAWAL_REVERSAL` / `REFUND` / `ADJUSTMENT` |
| visiting_charge | |
| commission_rate | |
| commission_amount | |
| prev_balance | |
| new_balance | |
| status | SUCCESS / PENDING / FAILED |
| gateway_ref | |
| timestamp | |

> Ledger purposes: **reconciliation, dispute handling, audit trail, revenue reporting.** The ledger is a database record, **not** a bank account.

### 6.3 Redis keys
| Key | Use |
|---|---|
| `arrived:commission:{bookingId}` | Idempotency — block double commission |
| `wallet:topup/{ref}` | Pending top-up verification |
| publish counters for revenue | Cached aggregates |

---

## 7. Backend Endpoints (NestJS `src/modules/payments/`)

| Function | Method | Endpoint |
|---|---|---|
| initiatePayment | POST | `/api/v1/payments/initiate` |
| paymentWebhook | POST | `/api/v1/webhooks/payment/:gateway` |
| getPaymentStatus | GET | `/api/v1/payments/:id/status` |
| getMyPayments | GET | `/api/v1/payments/my` |
| requestRefund | POST | `/api/v1/payments/:id/refund` |
| processPayout | POST | `/api/v1/admin/payouts/process` (Model B batch) |
| walletGet | GET | `/api/v1/wallet` |
| walletTopup | POST | `/api/v1/wallet/topup` |
| walletWithdraw | POST | `/api/v1/wallet/withdraw` |
| walletTransactions | GET | `/api/v1/wallet/transactions` |
| adminLedger | GET | `/api/v1/admin/ledger` |

Background jobs: daily payout batch (BullMQ), scheduled cleanup, reconciliation worker.

---

## 8. Screens (Frontend)

### Customer
| Screen | Content |
|---|---|
| Payment | Job + worker summary, **Total** (Navy bold), Pay with (Cash / JazzCash / Easypaisa / Card), "🔒 Secure Payment", **[Pay Now]** teal full-width; success & failure states; retry on error |
| Payment history | Past payments, statuses, receipts |

### Worker
| Screen | Content |
|---|---|
| Wallet | Balance card, **Top-up**, **Withdraw**, transaction list (ledger), online/offline status + reason |
| Earnings | Earnings history, pending payouts, reviews summary |
| Top-up | Amount + method (Easypaisa/JazzCash/Bank) |
| Withdrawal | Amount entry with validation toasts ("Minimum Rs. 100", "Insufficient balance") |
| Confirm Cash Received | For cash jobs (Model A bookkeeping) |

### Admin (tools in Module 4, data here)
| Screen | Content |
|---|---|
| Revenue dashboard | Total commission, top-up & withdrawal volumes |
| Ledger | Filterable all-transactions view |
| Payout processing | Pending payout batch (Model B) |

---

## 9. Decision Gate (record before implementation)
Confirm with the team:
1. **Which model?** A (finalized, wallet-only, no escrow) or B (reviewed, escrow, 15%) — Module 3 supports both; the wallet tables (§6.2) are needed for Model A; the escrow/hold flow for Model B.
2. If Model B: which **compliant escrow/custody provider**, and legal/regulatory review sign-off.
3. Which provider is primary for **top-ups** and for **payouts**; exact onboarding steps.
4. Open business rules (see §10).
5. Whether "minimum online balance" and "commission %" are per-category configurable (they are flagged configurable).

---

## 10. Open Risks & Questions (from platform-questions-and-risks.md — payment & financial)
| # | Question | Recommended handling |
|---|---|---|
| 1 | Worker arrives, customer cancels on the spot — is the Rs. commission refundable? | **Open.** Decide refund policy; track repeated occurrences |
| 2 | Worker arrives, problem different than described — who absorbs cost? | **Open.** Repeated "wrong scope" cases → admin review |
| 3 | Worker arrives but can't fix it — loses commission + travel | **Open.** Fairness decision; possible re-inspection rules |
| 5 | Worker+customer deal offline to skip commission | Model A business rule mitigates via wallet gate; value + support + records reduce bypass (SRS rule 11) |
| 9 | Customer refuses to pay after work done | Escrow (Model B) protects; in Model A: dispute + worker protection rules |
| 11 | Gateway downtime | Retry + recorded `failed` state + user notifications; never silently lose a job |
| 13 | Platform holds money then goes bankrupt (Model B) | Use compliant provider, never own bank account (tech recommendations) |
| 15 | Commission change later | Configurable %, communicated; Super Admin only |
| Wallet top-up refund if a worker never gets a job and quits | **Open** — define refund policy before launch (SRS/payment research flagged) |

---

## 11. Acceptance Criteria (MVP)
- [ ] Customer can pay (digital or cash) a completed job and see `paid` state.
- [ ] Payment success/failure both surface with correct UI; failed payments can retry.
- [ ] Worker wallet opens at Rs. 0 and can be topped up (Easypaisa/JazzCash/Bank) only after provider confirmation (Model A).
- [ ] `Arrive` deducts exactly one 10% commission per booking (idempotency verified by test).
- [ ] Wallet threshold flips online/offline correctly at exactly -500 and new orders stop when offline.
- [ ] Worker withdraws Rs. 100+ (≤ balance) and gets auto-payout; reversal returns funds.
- [ ] Every money movement has a ledger entry; platform revenue is calculable from the ledger.
- [ ] Duplicate webhook callbacks do not double-record (Model B).
- [ ] Payment state comes only from backend/provider records, never the frontend.