# Fixora — Payment & Worker Wallet Research and Flow

**Document type:** Product / System Flow Documentation  
**Date:** 2026-09-07  
**Scope:** Worker wallet, commission deduction, top-up, online/offline eligibility, withdrawal, Fixora revenue recording

---

## 1. Business Model

Fixora ka revenue source **sirf worker ki visiting charge par 10% commission** hai.

Customer ke service/job payment ko Fixora wallet mein hold karne ka model is flow ka part nahi hai.

### Example

- Visiting charge = Rs.500
- Fixora commission = 10%
- Commission = Rs.50
- Worker wallet se Rs.50 deduct hoga
- Fixora ke revenue ledger mein Rs.50 record hoga

---

## 2. Core Wallet Rules

| Rule | Decision |
|---|---|
| Worker signup par initial balance | Rs.0 |
| Wallet top-up methods | Easypaisa, JazzCash, Bank Transfer |
| Commission | Visiting charge ka 10% |
| Commission trigger | Worker `Arrived` press kare |
| Online threshold | Balance >= -Rs.500 |
| Offline threshold | Balance < -Rs.500 |
| Minimum withdrawal | Rs.100 |
| Withdrawal | Balance se zyada allowed nahi |
| Withdrawal approval | Automatic payout; manual admin approval nahi |
| Worker payout methods | Easypaisa, JazzCash, Bank Transfer |

---

## 3. High-Level Wallet Flow

```text
Worker Signup
      ↓
Wallet = Rs.0
      ↓
Top-up
(Easypaisa / JazzCash / Bank Transfer)
      ↓
Wallet Balance
      ↓
Worker Available for Jobs
      ↓
Customer Booking
      ↓
Worker Reaches Customer
      ↓
Worker Presses ARRIVED
      ↓
Visiting Charge × 10%
      ↓
Commission Deduct from Worker Wallet
      ↓
Wallet Balance Update
      ↓
Fixora Revenue Ledger Entry
      ↓
Check Wallet Threshold
      ↓
Balance >= -500 → Online
Balance < -500 → Offline
      ↓
Worker Can Top-up / Withdraw
```

---

## 4. Step-by-Step Flow

### Step 1 — Worker Signup

Worker Fixora par account create karta hai.

**Initial wallet balance:** `Rs.0`

Worker ko signup ke waqt free wallet credit nahi milega.

---

### Step 2 — Wallet Top-up

Worker apne wallet mein funds add karta hai.

Supported channels:

- Easypaisa
- JazzCash
- Bank Transfer

Example:

```text
Rs.0 → Rs.500
```

Top-up successful hone ke baad internal wallet balance update hoga.

> Important: payment provider ka successful confirmation milne ke baad hi wallet credit karna chahiye. Sirf client-side success screen dekh kar balance credit nahi karna.

---

### Step 3 — Online Eligibility

Worker ki availability wallet threshold se linked hai.

**Exact rule:**

```text
Balance >= -500  → Online
Balance <  -500  → Offline
```

Examples:

| Balance | Status |
|---:|---|
| Rs.500 | Online |
| Rs.0 | Online |
| -Rs.100 | Online |
| -Rs.499 | Online |
| -Rs.500 | Online |
| -Rs.501 | Offline |
| -Rs.605 | Offline |

`-500` boundary **allowed** hai.

---

### Step 4 — Worker Job

Online worker ko customer booking mil sakti hai.

Commission is stage par deduct nahi hoti.

---

### Step 5 — Arrived Event

Worker customer ke location par pohanchta hai aur app mein **Arrived** press karta hai.

Yahi commission ka trigger point hai.

```text
Arrived = Commission Trigger
```

---

### Step 6 — 10% Commission Calculation

Commission **wallet balance par nahi**, **visiting charge par** calculate hoti hai.

### Formula

```text
Commission = Visiting Charge × 10%
```

Examples:

- Rs.500 → Rs.50 commission
- Rs.800 → Rs.80 commission
- Rs.1,000 → Rs.100 commission

---

### Step 7 — Worker Wallet Deduction

Calculated commission worker ke wallet se deduct hoti hai.

Example:

```text
Old Balance = Rs.100
Commission  = Rs.80
New Balance = Rs.20
```

Negative balance allowed hai.

Example:

```text
Old Balance = -Rs.480
Commission  = Rs.50
New Balance = -Rs.530
```

---

### Step 8 — Fixora Revenue Ledger

Worker wallet se jo commission deduct hoti hai, uska corresponding financial record Fixora ke internal ledger mein create hoga.

Example:

```text
Booking: #123
Worker: Worker A
Visiting Charge: Rs.500
Commission Rate: 10%
Commission: Rs.50
Worker Wallet: -450 → -500
Fixora Revenue Ledger: +Rs.50
Event: Arrived
```

### Ledger ka purpose

Digital ledger **actual bank/wallet account nahi hai**. Ye database mein financial record hota hai.

Is se Fixora ko pata rahega:

- paisa kis worker se aya
- kis booking se aya
- kitni commission deduct hui
- kis date/time par hui
- worker wallet ka old/new balance kya tha
- total platform revenue kitna hai

Ledger ko reconciliation, dispute handling aur audit trail ke liye use kiya ja sakta hai.

---

## 5. Offline Trigger After Commission

Commission deduct hone ke baad wallet threshold dobara check hoga.

Example:

```text
Before Arrived: -Rs.480
Commission:      Rs.50
After Arrived:  -Rs.530
```

Since:

```text
-530 < -500
```

Worker **offline** ho jayega.

Important sequence:

```text
Arrived
  ↓
Commission Deduct
  ↓
Balance Update
  ↓
Online/Offline Re-check
```

Worker ko offline hone ke baad **new orders nahi milenge**.

---

## 6. How a Worker Becomes Online Again

Offline worker ka balance `-500` se neeche hota hai.

Usay wallet ko `-500` ya us se upar lana hoga.

Example:

```text
Current = -530
Top-up  = Rs.30
New     = -500
Status  = Online
```

Another example:

```text
Current = -530
Top-up  = Rs.20
New     = -510
Status  = Offline
```

---

## 7. Withdrawal Flow

Worker wallet se withdrawal request kar sakta hai.

### Conditions

```text
Withdrawal amount >= Rs.100
AND
Withdrawal amount <= available wallet balance
```

Examples:

| Wallet Balance | Withdrawal Request | Result |
|---:|---:|---|
| Rs.80 | Rs.100 | Reject — balance insufficient |
| Rs.300 | Rs.50 | Reject — below minimum |
| Rs.300 | Rs.100 | Allow |
| Rs.300 | Rs.300 | Allow |
| Rs.150 | Rs.150 | Allow |

### Withdrawal example

```text
Wallet = Rs.300
Withdrawal = Rs.200

Rs.300 → Rs.100
```

Payout worker ke selected destination par automatically initiate hoga:

- Easypaisa
- JazzCash
- Bank Transfer

---

## 8. Payment Architecture — 3 Separate Layers

Fixora ke payment system ko teen layers mein sochna chahiye:

### A. External Payment Provider

Actual money movement yahan hoti hai.

Examples:

- Easypaisa
- JazzCash
- Bank / Raast-enabled provider

### B. Fixora Wallet

Worker ka internal spendable/withdrawable balance.

Examples:

```text
Worker A = Rs.500
Worker B = -Rs.250
```

### C. Fixora Ledger

Har financial event ka immutable-style record / transaction history.

Examples:

```text
TOP_UP
COMMISSION_DEBIT
WITHDRAWAL
WITHDRAWAL_REVERSAL
REFUND / ADJUSTMENT (if needed)
```

**Simple rule:**

> Provider moves money. Wallet shows worker balance. Ledger explains every balance change.

---

## 9. Recommended Provider Strategy

### Worker Top-up

Initial product design:

```text
Worker
  ↓
Easypaisa / JazzCash / Bank
  ↓
Payment Confirmation
  ↓
Fixora Wallet Credit
```

### Worker Withdrawal

```text
Worker
  ↓
Withdrawal Request
  ↓
Fixora checks amount + balance
  ↓
Provider / Bank payout
  ↓
Worker account
```

### Fixora Revenue

Fixora ki commission business-side account/settlement arrangement mein receive hogi. Internal ledger us revenue ko record karega.

**Recommended operational approach:** Fixora ke business funds ke liye formal business/bank settlement ko primary accounting destination rakhna, jabke Easypaisa/JazzCash ko supported collection/payout rails ke taur par use karna.

Final provider selection, merchant onboarding, settlement timing, transaction limits, payout APIs, fees and compliance requirements ko production se pehle provider ke current commercial/API agreement ke against verify karna hoga.

---

## 10. Current Pakistan Payment Research

### Easypaisa

Easypaisa ka corporate onboarding portal businesses ke liye:

- corporate current/savings account
- Easypaisa app se payment collection
- Bulk Disbursement API
- Online Payment Gateway

offer karta hai. Easypaisa ke mutabiq Bulk Disbursement API multiple recipients ko ek call mein funds disburse karne ke liye designed hai, aur online gateway real-time settlement aur transaction monitoring support karta hai.  
Source: https://registerbusiness.easypaisa.com.pk/

Easypaisa merchant payment portal integration guides bhi provide karta hai.  
Source: https://easypay.easypaisa.com.pk/

### JazzCash

JazzCash business onboarding aur merchant platform online payment gateway, Merchant API, mobile wallets/bank-account payment options aur corporate disbursement capabilities provide karta hai. JazzCash ke corporate disbursement material mein beneficiaries ko funds disburse karne aur real-time disbursement/reporting capabilities ka zikr hai.  
Sources:
- https://corporateonboarding.jazzcash.com.pk/register
- https://corporateonboarding.jazzcash.com.pk/payment-collections
- https://corporateonboarding.jazzcash.com.pk/online-payment

JazzCash ke merchant documentation mein payment API aur transaction references ke concepts bhi documented hain.  
Source: https://sandbox.jazzcash.com.pk/SandboxDocumentation/ApiReferences.html

### Raast

State Bank of Pakistan ke Raast P2M framework ke under businesses merchants digital payments accept kar sakte hain. Supported acceptance modes mein QR, Raast Alias, IBAN aur Request-to-Pay shamil hain. SBP ke mutabiq businesses Raast services apne bank ya payment service provider ke through enable kar sakte hain.  
Sources:
- https://www.sbp.org.pk/circulars/pspod-circular-no-04-of-2023
- https://www.sbp.org.pk/our-subsidiaries/raast/join-raast

Raast participation criteria 2025 mein SBP ne banks, EMIs, PSOs aur PSPs ke participation requirements define kiye.  
Source: https://www.sbp.org.pk/circulars/pspod-circular-no-01-of-2025

---

## 11. Critical Technical Rules for Implementation

Ye business flow hai; implementation mein kuch controls mandatory hone chahiye.

### 11.1 Arrived double-charge protection

Same booking par commission **sirf ek successful Arrived event** par deduct honi chahiye.

Problem avoid karni hai:

```text
Arrived click
Arrived click again
Arrived click again
```

Agar system ne har click par commission deduct kar di to worker ko multiple charges lagenge.

Isliye Arrived commission transaction ko unique booking/event ke sath idempotent rakhna chahiye.

### 11.2 Provider success before wallet credit

Top-up ke liye:

```text
Payment initiated
   ↓
Provider confirms success
   ↓
Verify transaction
   ↓
Create ledger entry
   ↓
Credit worker wallet
```

### 11.3 Withdrawal status tracking

Withdrawal ko at least conceptual states chahiye:

```text
REQUESTED
PROCESSING
SUCCESS
FAILED
REVERSED
```

Wallet se amount deduct karna aur provider payout status ko reconcile karna zaroori hai.

### 11.4 Negative balance

Worker wallet negative ho sakta hai, lekin business rule ke mutabiq online eligibility `-500` boundary se control hogi.

### 11.5 Financial records

Wallet balance ko akela source of truth nahi banana chahiye.

Har money movement ka transaction record hona chahiye:

```text
TOP_UP
COMMISSION_DEBIT
WITHDRAWAL
REVERSAL / ADJUSTMENT
```

---

## 12. Final Flow — One-Page Version

```text
                    WORKER SIGNUP
                         ↓
                     Wallet = 0
                         ↓
          ┌──────────────┴──────────────┐
          ↓                             ↓
       TOP-UP                        CHECK BALANCE
   EasyPaisa/JazzCash/Bank               ↓
          ↓                    Balance >= -500 ?
    Wallet Credit                       /      \
                                        YES      NO
                                         ↓        ↓
                                      ONLINE   OFFLINE
                                         ↓
                                   GET NEW JOB
                                         ↓
                                  REACH CUSTOMER
                                         ↓
                                      ARRIVED
                                         ↓
                           Visiting Charge × 10%
                                         ↓
                                Commission Deduct
                                         ↓
                               Wallet Balance Update
                                         ↓
                                 Revenue Ledger +
                                         ↓
                                Re-check Threshold
                                         ↓
                              < -500 → OFFLINE


                    WITHDRAWAL SIDE
                         ↓
                  Worker requests payout
                         ↓
                  Amount >= Rs.100 ?
                     /          \
                   NO            YES
                   ↓               ↓
                REJECT      Amount <= Balance ?
                                /          \
                              NO            YES
                              ↓               ↓
                           REJECT       Auto Payout
                                           ↓
                              EasyPaisa/JazzCash/Bank
```

---

## 13. Important Business Decisions Already Finalized

1. Worker wallet starts at **Rs.0**.
2. Worker top-up methods are **Easypaisa, JazzCash, Bank Transfer**.
3. Fixora commission is **10% of visiting charge**.
4. Commission is triggered when worker presses **Arrived**.
5. Commission is **not calculated from wallet balance**.
6. Worker remains eligible while balance is **>= -Rs.500**.
7. Worker becomes offline when balance is **< -Rs.500**.
8. Worker can withdraw only **Rs.100 or more**.
9. Withdrawal cannot exceed available balance.
10. Withdrawal is designed as **automatic**, not admin-approved.
11. Fixora should maintain an internal **financial ledger** for every wallet transaction.

---

## 14. Open Items for Production

The following should be finalized before actual integration:

- Which provider will be primary for worker top-ups?
- Which provider will be primary for worker payouts?
- Exact merchant/corporate onboarding requirements.
- Current provider API access and credentials process.
- Webhook/callback mechanism and signature verification.
- Settlement timing and fees.
- Transaction limits.
- Refund/reversal handling.
- Failed payout handling.
- Reconciliation process between provider statements and Fixora ledger.
- Compliance/KYC/AML requirements applicable to Fixora's final business structure.

These are **implementation/commercial decisions**, not changes to the business logic already agreed above.

---

## Sources

- State Bank of Pakistan — Raast Person to Merchant: https://www.sbp.org.pk/circulars/pspod-circular-no-04-of-2023
- State Bank of Pakistan — Joining Raast: https://www.sbp.org.pk/our-subsidiaries/raast/join-raast
- State Bank of Pakistan — Raast Participation Criteria: https://www.sbp.org.pk/circulars/pspod-circular-no-01-of-2025
- Easypaisa Corporate Onboarding: https://registerbusiness.easypaisa.com.pk/
- Easypaisa Merchant Payment Portal: https://easypay.easypaisa.com.pk/
- JazzCash Corporate Onboarding: https://corporateonboarding.jazzcash.com.pk/register
- JazzCash Payment Collections: https://corporateonboarding.jazzcash.com.pk/payment-collections
- JazzCash Online Payment: https://corporateonboarding.jazzcash.com.pk/online-payment
- JazzCash API References: https://sandbox.jazzcash.com.pk/SandboxDocumentation/ApiReferences.html
