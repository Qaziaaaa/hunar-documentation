# Hunar Flow Charts — Simple & Easy Edition

**Author:** Shafqat Ullah  
**Document Type:** Simple Flow Charts (Easy to Understand)  
**Version:** 1.0  
**Date:** September 3, 2026  
**Status:** Draft — Pending Team Review

> **Purpose:** This is the **super-simple version** of the Hunar flow charts. No hard words. No long confusing diagrams. Just **short steps**, **simple pictures**, and **one-page explanations** for each flow. If you are new to Hunar, start here.

---

## How to Read These Charts

Each flow looks like this:

```
[ START ]
    │
    ▼
  STEP 1   ← What happens first
    │
    ▼
  STEP 2   ← What happens next
    │
    ▼
  STEP 3   ← And so on...
    │
    ▼
 [ END ]
```

**The arrow (▼) just means "then this happens next."**

---

## Table of Contents

1. [How You Log In](#1-how-you-log-in)
2. [How You Sign Up](#2-how-you-sign-up)
3. [How a Customer Posts a Job](#3-how-a-customer-posts-a-job)
4. [How Workers See New Jobs](#4-how-workers-see-new-jobs)
5. [How a Worker Sends an Offer](#5-how-a-worker-sends-an-offer)
6. [How a Customer Picks a Worker](#6-how-a-customer-picks-a-worker)
7. [How the Worker Visits](#7-how-the-worker-visits)
8. [How the Price is Decided](#8-how-the-price-is-decided)
9. [How Payment Works](#9-how-payment-works)
10. [How Reviews Work](#10-how-reviews-work)
11. [How Chat Works](#11-how-chat-works)
12. [How Notifications Work](#12-how-notifications-work)
13. [How Photos are Uploaded](#13-how-photos-are-uploaded)
14. [The Whole Story in One Picture](#14-the-whole-story-in-one-picture)
15. [What can go wrong (and how we fix it)](#15-what-can-go-wrong-and-how-we-fix-it)

---

## The 3 People in hunar

Before we start, remember these 3 roles:

| Picture | Name | What They Do |
|---|---|---|
| 👤 | **Customer** | Needs help (fixes a pipe, repairs an AC) |
| 🛠️ | **Worker** | Gives help (plumber, electrician, carpenter) |
| 🏢 | **Admin** | Runs Hunar (checks workers, solves problems) |

---

## 1. How You Log In

**Real name:** Login with OTP
**Simple idea:** Prove it's really YOU with a secret code sent to your phone.

```
[ YOU OPEN Hunar ]
        │
        ▼
[ YOU TYPE YOUR PHONE NUMBER ]
        │
        ▼
[ Hunar SENDS A SECRET CODE TO YOUR PHONE ]
        │          (this code is called OTP)
       
[ YOU TYPE IN THE SECRET CODE ]
        │
        ▼
[ CORRECT? ]
    │         │
   YES        NO
    │         │
    ▼         ▼
[ YOU ARE      [ TRY AGAIN    ]
  LOGGED IN  ]   (careful, only
                  3 tries!)
```

### Why this is good
- No passwords to forget
- Only YOU can access your phone, so only you can log in
- The code disappears after 5 minutes (like a melting ice cube)

---

## 2. How You Sign Up

**Simple idea:** Hunar quickly asks who you are, so it can show you the right buttons.

```
[ YOU LOG IN WITH THE CODE ]
        │
        ▼
[ Hunar ASKS: "ARE YOU A CUSTOMER OR A WORKER?" ]
        │
        ▼
[ YOU CHOOSE ]
        │
        ├────────────► CUSTOMER
        │                  │
        │                  ▼
        │            [ You get a Customer
        │              account ]
        │
        └────────────► WORKER
                          │
                          ▼
                   [ You can add:
                     - What skills you have
                       (plumbing, electrical)
                     - How many years experience
                     - Show your ID card
                       for checking ]
```

---

## 3. How a Customer Posts a Job

**Simple idea:** Customer tells Hunar: "I have a problem. Can someone fix it?"

```
[ CUSTOMER TAPS "POST A JOB" ]
        │
        ▼
[ Customer writes:
  - WHAT is broken?  (my sink is leaking)
  - WHERE is it?     (picks location on map)
  - HOW URGENT?      (not urgent / very urgent)
  - Some PHOTOS      (photo of the leak)
  - About how MUCH?  (I can pay up to Rs 3,000) ]
        │
        ▼
[ Hunar SAVES THE JOB ]
        │
        ▼
[ Hunar TELLS NEARBY WORKERS: "A NEW JOB IS HERE!" ]
        │
        ▼
[ Job is now "OPEN" — waiting for workers ]
        │
        ▼
[ CUSTOMER SEES: "Your job is posted.
   We are finding workers near you." ]
```

---

## 4. How Workers See New Jobs

**Simple idea:** Hunar uses maps + location to tell the RIGHT workers nearby.

```
[ CUSTOMER POSTS A JOB: "My pipe is leaking" ]
        │
        ▼
[ Hunar LOOKS AT A MAP ]
        │
        ▼
[ Hunar FINDS PLUMBERS NEARBY ]
   ✓ who are close to the customer
   ✓ who are verified (trusted)
   ✓ who are available (not busy)
   ✓ who know plumbing
        │
        ▼
[ Hunar RANKS THEM ]
   1. Nearest first
   2. Best rating first
        │
        ▼
[ Hunar NOTIFIES THE TOP WORKERS:
   "New plumbing job near you!" ]
        │
        ▼
[ WORKER OPENS THE JOB AND READS IT ]
```

---

## 5. How a Worker Sends an Offer

**Simple idea:** Worker says to customer: "I can do it! I will charge this much to come check."

```
[ WORKER SEES THE JOB ]
        │
        ▼
[ WORKER READS: what's broken + where + photos ]
        │
        ▼
[ WORKER DECIDES: "I can do this!" ]
        │
        ▼
[ WORKER WRITES AN OFFER:
   - visit charge  (Rs 500 to come look)
   - rough cost    (repair might be Rs 2,500)
   - a message     ("I'm licensed, 8 years") ]
        │
        ▼
[ Hunar SAVES THE OFFER ]
        │
        ▼
[ Hunar TELLS THE CUSTOMER:
   "A worker sent you an offer!" ]
        │
        ▼
[ JOB CHANGES TO "OFFERS RECEIVED"
   (at least one worker is interested) ]
```

**Rule:** A worker can only send ONE offer per job.
**Rule:** Many workers can send offers to the same job.

---

## 6. How a Customer Picks a Worker

**Simple idea:** Customer picks the best worker, like choosing the best restaurant.

```
[ CUSTOMER SEES A LIST OF OFFERS ]
        │
[ Worker A: Rs 500 to visit, rated 4.8⭐ ]
[ Worker B: Rs 700 to visit, rated 4.5⭐ ]
[ Worker C: Rs 400 to visit, rated 3.9⭐ ]
        │
        ▼
[ CUSTOMER PICKS THE BEST ONE ]
        │
        ▼
[ Hunar DOES THREE THINGS AT ONCE ]
   __________________\_____/
   │                  │          │
   ▼                  ▼          ▼
[ OTHER              [ CUSTOMER   [ CHAT ROOM   ]
  OFFERS ]            CUSTOMER     IS OPEN so
  are auto-           & WORKER     they can talk
  rejected            MATCHED ]
        │
        ▼
[ CUSTOMER & WORKER ARE NOW TOGETHER ]
   - Job changes to "OFFER ACCEPTED"
   - A visit is scheduled
   - They can now chat
```

---

## 7. How the Worker Visits

**Simple idea:** The worker comes to the customer's home to look at the problem.

```
[ WORKER TRAVELS TO CUSTOMER ]
        │
        ▼
[ CUSTOMER WATCHES ON THE MAP ✔
   (they can see the worker coming) ]
        │
        ▼
[ WORKER ARRIVES -->
   taps "I'M HERE" ]
        │
        ▼
[ WORKER LOOKS AT THE PROBLEM ]
        │
        ▼
[ WORKER TAKES PHOTOS + WRITES NOTES:
   "Found a cracked pipe" ]
        │
        ▼
[ WORKER TAPS "DONE WITH INSPECTION" ]
        │
        ▼
[ JOB CHANGES TO "VISIT DONE" ]
        │
        ▼
[ Hunar tells customer:
   "Inspection complete. Price coming soon." ]
```

---

## 8. How the Price is Decided

**Simple idea:** Worker says the price. Customer agrees, disagrees, or negotiates (bargains).

```
[ WORKER GIVES A PRICE ]
   "To fix it will cost Rs 3,500"
        │
        ▼
[ CUSTOMER LOOKS AT PRICE ]
        │
        ├──────────────► HAPPY?
        │                   │
        │                   YES
        │                   │
        │                   ▼
        │            [ CUSTOMER SAYS "OK"
        │              → repair starts! ]
        │
        └──────────────► TOO HIGH?
                            │
                            ▼
                 [ CUSTOMER BARGAINS ]
                   "Can you do Rs 2,500?"
                            │
                            ▼
                 [ WORKER RESPONDS ]
                   "Ok, how about Rs 3,000?"
                            │
                            ▼
                 [ They go back and forth ]
                     (up to 5 times, then
                      you must decide)
                            │
                            ▼
                 [ AGREE? ]
                    │          │
                   YES        NO
                    │          │
                    ▼          ▼
             [ Repair    [ Say bye --
               starts ]    job cancelled ]
```

**Every back-and-forth is saved**, so we can see the whole conversation later if there's a problem.

---

## 9. How Payment Works

**Simple idea:** Customer pays for the finished work. Hunar takes a small share, worker gets the rest.

```
[ WORKER FINISHES THE JOB ]
        │
        ▼
[ CUSTOMER GETS: "Job is done! Please pay." ]
        │
        ▼
[ CUSTOMER CHOOSES HOW TO PAY ]
      - JazzCash
      - Easypaisa
      - Cash (hand it to the worker)
        │
        ▼
[ PAYMENT GOES THROUGH ]
        │
        ▼
[ Hunar SPLITS THE MONEY ]
   _______________________
   │          │          │
   ▼          ▼          ▼
[ CUSTOMER  [ Hunar    [ WORKER     ]
   pays      takes      gets the
   total     15%        rest (85%)  ]
   Rs3,000   Rs450      Rs2,550     ]
        │
        ▼
[ JOB CHANGES TO "PAID" ]
   (now customer & worker can leave reviews)
```

### Wait 24 hours
For the worker's money, Hunar waits **24 hours** before releasing it. This protects everyone — if there's a problem, it can be fixed before the money is sent.

---

## 10. How Reviews Work

**Simple idea:** After a job, both people rate each other ⭐ like rating a movie.

```
[ JOB IS PAID ]
        │
        ▼
[ CUSTOMER CAN RATE THE WORKER ]
   ⭐⭐⭐⭐⭐ 1 to 5 stars
   + write a comment
   + add photos
        │
        ▼
[ WORKER CAN ALSO RATE THE CUSTOMER ]
   (was the customer nice? on time?)
        │
        ▼
[ Hunar UPDATES THE AVERAGE RATING ]
   Worker had: 20 reviews, average 4.5
   New review:  5 stars
   New average: 4.6
        │
        ▼
[ JOB CHANGES TO "REVIEWED" → ALL DONE! 🎉 ]
```

**Rules:**
- You have **7 days** to leave a review
- One review per person per job
- Reviews help future customers choose better

---

## 11. How Chat Works

**Simple idea:** Customer and worker text each other instantly, like WhatsApp.

```
[ CUSTOMER AND WORKER ARE MATCHED ]
        │
        ▼
[ A CHAT BOX OPENS BETWEEN THEM ]
        │
        ▼
        CUSTOMER                       WORKER
        │                               │
        │  "When can you come?"         │
        │──────────────────────────────►│
        │                               │
        │                               │  "In 20 minutes 🙂"
        │◄──────────────────────────────│
        │                               │
        │  (typing... they see each     │
        │   other typing in real time   │
        │   — like WhatsApp!)           │
        │                               │
        ▼                               ▼
[ Messages also saved so history is not lost ]
```

**Why not just SMS or regular messages?**
- It's inside Hunar
- Both people verified
- History is saved
- No phone numbers shared until they want to

---

## 12. How Notifications Work

**Simple idea:** Hunar taps you on the shoulder when something important happens.

```
[ SOMETHING HAPPENS ]
      │
      ▼
[ Hunar DECIDES: WHO should know? ]
      │
      ▼
[ Hunar PICK THE BEST WAY TO TELL THEM ]
      │
  ┌───┴──────────────┬───────────────┐
  │                  │               │
  ▼                  ▼               ▼
[ PUSH             [ SMS (text      [ IN-APP
  NOTIFICATION ]    message) ]       (inside Hunar) ]
   pops up on        for OTPs,       shows up in the
   your screen       urgent stuff     notification bell
   even if Hunar
   is closed
```

### What triggers what

| When THIS happens | Hunar tells THIS person | By sending |
|---|---|---|
| New job nearby | Workers | Push + in-app |
| Worker sent offer | Customer | Push + in-app |
| Customer accepted | Worker | Push + in-app |
| Visit in 24 hours | Both | Push |
| Repair price sent | Customer | Push + in-app |
| Payment done | Both | Push + in-app |
| New review | The reviewed person | Push + in-app |
| Login code (OTP) | You | SMS |

---

## 13. How Photos are Uploaded

**Simple idea:** Customer takes a photo, Hunar keeps it safe and makes it the right size.

```
[ CUSTOMER TAKES A PHOTO OF THE LEAK ]
        │
        ▼
[ CUSTOMER TAPS "UPLOAD" ]
        │
        ▼
[ Hunar CHECKS THE PHOTO ]
   ✓ is it a picture? (not a virus/bad file)
   ✓ is it small enough? (under 5MB)
        │
        ▼
[ Hunar MAKES 3 SIZES ]
   - tiny (for thumbnails, loads fast)
   - medium (for normal viewing)
   - large (for zooming in)
        │
        ▼
[ Hunar SAVES THEM SAFELY IN STORAGE ]
   (like a photo album in the cloud)
        │
        ▼
[ WORKER SEES THE PHOTO ]
```

**Why 3 sizes?** Tiny photos load instantly on slow internet (important for Pakistan!).

---

## 14. The Whole Story in One Picture

The complete journey of one job — from start to finish:

```
  👤 CUSTOMER            🛠️ WORKER              🏢 SYSTEM
  ───────────            ──────────             ──────────
       │                      │                      │
  1. Posts a job       │                      │
   "Pipe leaking"       │                      │
       │                      │                      │
       │──────────────────────│─────────────────────►│
       │                      │                      │ 2. Finds nearby
       │                      │                      │    plumbers
       │                      │                      │
       │                      │◄─── "New job!" ──────│ 3. Notifies them
       │                      │                      │
       │                      │ 4. Sends offer      │
       │                      │  "Rs 500 to visit"   │
       │                      │─────────────────────►│
       │◄── "Offer!" ─────────│                      │ 5. Tells customer
       │                      │                      │
       │ 6. Picks a worker    │                      │
       │──────────────────────│─────────────────────►│ 7. Matches them,
       │                      │                      │    opens chat,
       │                      │                      │    schedules visit
       │                      │                      │
       │ 8. Worker visits     │                      │
       │◄─────────────────────│                      │ 9. Customer tracks
       │                      │                      │    on map
       │                      │                      │
       │                      │ 10. Inspects + gives │
       │                      │     price "Rs3,500" │
       │                      │─────────────────────►│ 11. Sends price
       │                      │                      │    to customer
       │◄── "Price is ..." ───│──────────────────────│
       │                      │                      │
       │ 12. Bargains to Rs3,000                    │
       │──────────────────────│─────────────────────►│ 13. Saves the deal
       │                      │                      │
       │ 14. Worker fixes it  │                      │
       │◄─────────────────────│                      │
       │                      │                      │
       │ 15. Pays Rs3,000     │                      │
       │──────────────────────│─────────────────────►│ 16. Splits money:
       │                      │                      │    Hunar Rs450,
       │                      │                      │    worker Rs2550
       │                      │                      │
       │ 17. Rates worker ⭐⭐⭐⭐⭐                  │ 18. Saves rating
       │──────────────────────│─────────────────────►│
       │                      │                      │
       └────────── ALL DONE! 🎉 ──────────────────────┘
```

---

## 15. What Can Go Wrong (and How We Fix It)

### A. Customer wants to cancel

```
[ JOB IS NOT DONE YET ]
        │
        ▼
[ CUSTOMER CANCELS ]
   "I found someone else, sorry"
        │
        ▼
[ Hunar:
   - says bye to waiting workers
   - closes the job safely
   - keeps the job record (nothing lost) ]
```

**You can only cancel** before the repair starts.

---

### B. Somebody is unhappy (Dispute)

```
[ Something went wrong ]
   "The worker didn't finish!"
   or "The customer didn't pay!"
        │
        ▼
[ THE ANGRY PERSON FILES A COMPLAINT ]
   + shows proof (photos, messages)
        │
        ▼
[ ADMIN (Hunar team) LOOKS AT IT ]
   - reads both sides
   - reads the chat history
   - looks at the photos
        │
        ▼
[ ADMIN DECIDES A FAIR ANSWER ]
   e.g. "Refund half to customer" or
        "Worker must finish the job"
        │
        ▼
[ BOTH PEOPLE ARE TOLD THE ANSWER ]
```

---

### C. Too many codes sent (Protection)

```
[ Someone tries to log in many times ]
   (maybe it's not you!)
        │
        ▼
[ Hunar STOPS THEM ]
   "Too many tries. Wait 15 minutes."
        │
        ▼
[ Your account is safe ]
```

---

### D. A worker is not trusted

```
[ Worker sends their ID card ]
        │
        ▼
[ ADMIN CHECKS THE ID ]
        │
        ▼
[ GOOD OK? ]──YES──► [ Worker is verified & can
   │                       take jobs ]
   │
   NO
   │
   ▼
[ Worker is told "not approved yet"
   - can still improve / re-apply ]
```

This is why customers can trust Hunar workers.

---

## Bonus: The Golden Rules of Hunar 💡

1. **No passwords** — only a secret code to your phone.
2. **Nearby first** — the closest good-rated worker gets the job.
3. **One offer each** — a worker can't spam the same job.
4. **Everything is saved** — job, chat, price talks, payments. Nothing disappears.
5. **Safe money** — Hunar holds money 24 hours to protect everyone.
6. **Star ratings** — good workers shine, bad workers get caught.
7. **Admins watch** — real people check workers and solve disputes.
8. **Works on slow internet** — photos are made tiny so they load fast.

---

*Document prepared by Shafqat Ullah — Pending review by Qazi Farhan Ahmad (Team Lead)*
