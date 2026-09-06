# Fixora — Payment & Commission Flow

## 1. Business Model

Fixora has **one source of earning**:

> **Worker visiting charges par 10% commission.**

Customer se Fixora ki koi separate service commission is flow mein nahi li ja rahi.

### Example
- Visiting Charge = Rs. 500
- Fixora Commission = 10%
- Fixora Revenue = Rs. 50
- Worker Wallet Deduction = Rs. 50

---

## 2. Worker Wallet Availability Rule

Worker ka wallet balance uski online/offline availability determine karta hai.

### Online

`Wallet Balance >= -500`

Examples:
- Rs. 500 → Online
- Rs. 0 → Online
- Rs. -100 → Online
- Rs. -499 → Online
- Rs. -500 → Online

### Offline

`Wallet Balance < -500`

Examples:
- Rs. -501 → Offline
- Rs. -550 → Offline
- Rs. -600 → Offline

---

## 3. Main Payment / Commission Flow

```text
Customer ko worker ki zaroorat
        ↓
System online workers show karega
        ↓
Customer online worker ko book karega
        ↓
Worker customer ki location par jayega
        ↓
Worker location par pohanchta hai
        ↓
Worker app mein "Arrive" press karta hai
        ↓
Visiting Charge ka 10% calculate hota hai
        ↓
10% worker ke wallet se deduct hota hai
        ↓
Fixora ke revenue/ledger mein 10% record hota hai
        ↓
Agar balance < -500 ho gaya
        ↓
Worker Offline
```

---

## 4. Step-by-Step Explanation

### Step 1 — Customer ko worker ki zaroorat hoti hai

Customer ko koi service issue hota hai, for example:
- Pipe leakage
- Electric issue
- AC problem
- Carpentry work

Customer Fixora par relevant worker search karta hai.

### Step 2 — Online workers filter honge

System worker ka wallet balance check karega.

Rule:

`Balance >= -500 → Online`

`Balance < -500 → Offline`

Sirf **online workers** customer ko booking ke liye available honge.

### Step 3 — Customer worker book karta hai

Customer available/online worker ko select karke booking karta hai.

Worker ko booking/order receive hota hai.

### Step 4 — Worker customer ki location par jata hai

Worker accepted booking ke according customer ke provided location par travel karta hai.

Is stage par **10% commission abhi deduct nahi hoti**.

### Step 5 — Worker "Arrive" press karta hai

Jab worker customer ki desired location par pohanchta hai, app mein **Arrive** button available hoga.

Worker `Arrive` press karta hai.

**Ye commission trigger event hai.**

### Step 6 — 10% commission calculate hoti hai

`Commission = Visiting Charge × 10%`

Example:

`Rs. 800 × 10% = Rs. 80`

### Step 7 — Worker wallet se commission deduct hoti hai

Example:

Worker wallet = `Rs. 100`

Commission = `Rs. 80`

New wallet = `Rs. 20`

Another example:

Worker wallet = `-480`

Commission = `Rs. 50`

New wallet = `-530`

Since `-530 < -500`, worker offline ho jayega.

### Step 8 — Fixora revenue record hota hai

Worker se deduct hone wali 10% commission Fixora ki earning hai.

Example:

`Visiting Charge = Rs. 500`

`10% Commission = Rs. 50`

Worker Wallet:

`Old Balance - Rs. 50 = New Balance`

Fixora:

`+ Rs. 50 Revenue`

> Actual settlement/payment-provider implementation provider ke supported merchant/payout APIs aur business onboarding par depend karegi. Internal system mein transaction ka ledger record maintain karna chahiye.

---

## 5. Important Business Rule

### Fixora ka single revenue source

**Worker → Visiting Charge → 10% Commission → Fixora**

Is flow mein:
- Customer se separate platform commission nahi.
- Worker ki service fee ka percentage nahi.
- Product/service sale commission nahi.
- **Only visiting charge ka 10%.**

---

## 6. Worked Examples

### Example A — Positive Balance

- Worker Wallet = Rs. 500
- Visiting Charge = Rs. 1,000
- Commission = Rs. 100

New Balance:

`500 - 100 = Rs. 400`

Status:

`400 >= -500 → Online`

### Example B — Balance Near Limit

- Worker Wallet = -480
- Visiting Charge = Rs. 500
- Commission = Rs. 50

New Balance:

`-480 - 50 = -530`

Status:

`-530 < -500 → Offline`

### Example C — Exactly -500

- Worker Wallet = -500
- Visiting Charge = Rs. 1,000
- Commission = Rs. 100

New Balance:

`-500 - 100 = -600`

Status:

`-600 < -500 → Offline`

---

## 7. Revenue Calculation

`Fixora Revenue = Visiting Charge × 0.10`

| Visiting Charge | 10% Fixora Revenue |
|---:|---:|
| Rs. 300 | Rs. 30 |
| Rs. 500 | Rs. 50 |
| Rs. 800 | Rs. 80 |
| Rs. 1,000 | Rs. 100 |
| Rs. 2,000 | Rs. 200 |

---

## 8. Wallet & Revenue Separation

### Worker Wallet
Worker ka balance:
- Top-up
- Commission deductions
- Withdrawals
- Online/offline eligibility

### Fixora Revenue
Fixora ki earning:
- Har successful `Arrive` event par visiting charge ka 10%

Internal database mein har commission transaction ka record rakhna chahiye:
- Worker ID
- Booking ID
- Visiting charge
- Commission percentage
- Commission amount
- Previous wallet balance
- New wallet balance
- Transaction status
- Timestamp

---

## 9. Payment Infrastructure Research

Pakistan mein digital merchant payments ke liye Raast P2M QR, alias, IBAN aur Request-to-Pay jaise channels available hain through regulated entities. SBP ne Raast P2M ko merchant/business payment acceptance ke liye launch kiya hai.

JazzCash Business online payment collection aur merchant APIs offer karta hai, aur business solutions mein payment acceptance aur disbursement capabilities bhi hain.

Easypaisa ka Merchant Portal online payments, QR integration aur payment links provide karta hai.

**Important:** Final provider/API selection development se pehle official onboarding, API documentation, merchant requirements, settlement rules, payout support, transaction limits, fees/MDR, refunds aur compliance requirements verify karke karni hogi.

---

## 10. Final Flow

```text
CUSTOMER
   ↓
Needs Worker
   ↓
ONLINE WORKERS
(Balance >= -500)
   ↓
BOOK WORKER
   ↓
WORKER TRAVELS
   ↓
WORKER ARRIVES
   ↓
PRESS "ARRIVE"
   ↓
VISITING CHARGE × 10%
   ↓
WORKER WALLET - COMMISSION
   ↓
FIXORA REVENUE + COMMISSION
   ↓
UPDATE WALLET BALANCE
   ↓
Balance < -500?
   ├── YES → OFFLINE
   └── NO  → REMAINS ONLINE
```

---

## 11. Core Rules — Quick Reference

| Rule | Decision |
|---|---|
| Initial worker wallet | Rs. 0 |
| Wallet top-up | Easypaisa / JazzCash / Bank Transfer |
| Online condition | Balance >= -500 |
| Offline condition | Balance < -500 |
| Commission trigger | Worker presses `Arrive` |
| Commission | 10% of visiting charge |
| Revenue source | Worker visiting charge commission only |
| Customer platform commission | None in this model |
| Worker wallet can go negative | Yes |
| Minimum allowed online balance | -500 |
