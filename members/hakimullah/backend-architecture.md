# HUNAR Backend Architecture — Complete Guide

## What is HUNAR?

HUNAR is like a magic marketplace on the internet where people who need help with home repairs (customers) can find people who know how to fix things (workers). An admin watches over everything to make sure it runs smoothly.

Think of it like a restaurant:
- **Customers** are the people who come to eat
- **Workers** are the chefs who cook the food
- **Admin** is the manager who runs the restaurant

---

## The Three Main People

### 1. The Customer (Person Who Needs Help)

**What they do:**
- They have a broken AC, a leaky pipe, or need electrical work
- They come to HUNAR to find someone who can help
- They pick what kind of help they need
- They search for workers near them
- They send a request saying "I need help!"
- They wait for workers to respond
- They pick the best worker
- They pay for the work
- They leave a review

**Think of it this way:**
> "I need help → I find someone → I ask them → They come → They fix it → I pay → I say thanks"

### 2. The Worker (Person Who Fixes Things)

**What they do:**
- They know how to fix things (electricity, plumbing, AC, etc.)
- They create a profile showing their skills
- They tell HUNAR what services they offer
- They see requests from customers
- They say "Yes, I can help!" or "No, sorry"
- They go to the customer's home
- They fix the problem
- They get paid

**Think of it this way:**
> "I have skills → I show them → Customers find me → I help them → I get paid"

### 3. The Admin (Person Who Manages Everything)

**What they do:**
- They watch over the whole platform
- They make sure workers are real and trustworthy
- They help when there are problems
- They keep track of how many jobs are happening
- They make sure everyone follows the rules

**Think of it this way:**
> "I keep everything safe → I check workers → I solve problems → I watch the numbers"

---

## How the Backend Works (The Brain of HUNAR)

The backend is like the brain of a robot. It tells everything what to do. When you click a button on the website, the backend is the thing that makes it happen.

### The Main Brain Box (NestJS Backend)

The backend is built with something called **NestJS**. Think of NestJS as a really smart organizer that keeps all the different jobs organized.

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE BRAIN BOX (Backend)                       │
│                                                                   │
│   Inside the brain box, there are 14 smaller boxes:             │
│                                                                   │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│   │  AUTH BOX   │ │  JOBS BOX   │ │  USERS BOX  │             │
│   │             │ │             │ │             │             │
│   │ Keeps track │ │ Keeps track │ │ Keeps track │             │
│   │ of who you  │ │ of all the  │ │ of all the  │             │
│   │ are         │ │ jobs        │ │ people      │             │
│   └─────────────┘ └─────────────┘ └─────────────┘             │
│                                                                   │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│   │ PAYMENTS    │ │  CHAT BOX   │ │ REVIEWS BOX │             │
│   │ BOX         │ │             │ │             │             │
│   │             │ │ Lets people │ │ Lets people │             │
│   │ Handles     │ │ talk to     │ │ rate each   │             │
│   │ money       │ │ each other  │ │ other       │             │
│   └─────────────┘ └─────────────┘ └─────────────┘             │
│                                                                   │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│   │ NOTIF BOX   │ │ SEARCH BOX  │ │  ADMIN BOX  │             │
│   │             │ │             │ │             │             │
│   │ Sends alerts│ │ Helps you   │ │ Admin tools │             │
│   │ and messages│ │ find things │ │             │             │
│   └─────────────┘ └─────────────┘ └─────────────┘             │
│                                                                   │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│   │ LOCATION    │ │ FILE UPLOAD │ │  OFFERS BOX │             │
│   │ BOX         │ │ BOX         │ │             │             │
│   │             │ │             │ │ Workers send│             │
│   │ Finds people│ │ Stores      │ │ offers to   │             │
│   │ nearby      │ │ photos      │ │ customers   │             │
│   └─────────────┘ └─────────────┘ └─────────────┘             │
│                                                                   │
│   ┌─────────────┐ ┌─────────────┐                               │
│   │ VISITS BOX  │ │ REPAIR BOX  │                               │
│   │             │ │             │                               │
│   │ Schedules   │ │ Estimates   │                               │
│   │ visits      │ │ repair cost │                               │
│   └─────────────┘ └─────────────┘                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Wallet System (How Money Works)

### Where Does the Money Go?

Imagine you have a piggy bank. When you put money in, it stays there until you take it out. HUNAR works the same way, but with digital money.

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE WALLET SYSTEM                             │
│                                                                   │
│   STEP 1: Customer Pays                                          │
│   ┌──────────────────────────────────────────────────────┐      │
│   │                                                        │      │
│   │  Customer's Wallet ──▶ Platform's Wallet              │      │
│   │                                                        │      │
│   │  💰 Rs. 1000 goes in                                 │      │
│   │                                                        │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                   │
│   STEP 2: Platform Takes Its Share                               │
│   ┌──────────────────────────────────────────────────────┐      │
│   │                                                        │      │
│   │  Platform keeps 15% (Rs. 150)                        │      │
│   │                                                        │      │
│   │  Rs. 1000 ──▶ Rs. 150 (Platform) + Rs. 850 (Worker) │      │
│   │                                                        │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                   │
│   STEP 3: Worker Gets Paid                                       │
│   ┌──────────────────────────────────────────────────────┐      │
│   │                                                        │      │
│   │  Platform's Wallet ──▶ Worker's Wallet               │      │
│   │                                                        │      │
│   │  💰 Rs. 850 goes to the worker                       │      │
│   │                                                        │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Payment Methods

You can pay using:
- **JazzCash** - A phone app for money
- **Easypaisa** - Another phone app for money
- **Card** - Credit or debit card
- **Cash** - Pay with cash when the worker comes

### When Does the Worker Get Paid?

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT TIMING                                │
│                                                                   │
│   Job Done ──▶ Payment Held ──▶ 24 Hours Wait ──▶ Worker Paid  │
│                                                                   │
│   Why wait 24 hours? So if the customer has a problem,          │
│   they can report it before the money is sent.                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Customer Journey (Step by Step)

Let's follow a customer named **Ahmed** who needs his AC fixed:

### Step 1: Ahmed Signs Up

```
┌─────────────────────────────────────────────────────────────────┐
│                    AHMED SIGNS UP                                │
│                                                                   │
│   Ahmed opens HUNAR website                                     │
│         │                                                        │
│         ▼                                                        │
│   He types his phone number                                     │
│         │                                                        │
│         ▼                                                        │
│   HUNAR sends a code to his phone (OTP)                         │
│         │                                                        │
│         ▼                                                        │
│   Ahmed types the code                                          │
│         │                                                        │
│         ▼                                                        │
│   HUNAR says "Welcome, Ahmed!"                                  │
│         │                                                        │
│         ▼                                                        │
│   Ahmed picks "I Need a Service"                                │
│         │                                                        │
│         ▼                                                        │
│   He's inside! 🎉                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2: Ahmed Picks What He Needs

```
┌─────────────────────────────────────────────────────────────────┐
│                    AHMED PICKS SERVICE                           │
│                                                                   │
│   Ahmed sees a list of services:                                │
│                                                                   │
│   ⚡ Electrical    🔧 Plumbing    ❄ AC Repair                  │
│   🪚 Carpentry     🎨 Painting   🔩 General Fix                │
│                                                                   │
│   Ahmed clicks "❄ AC Repair"                                    │
│         │                                                        │
│         ▼                                                        │
│   HUNAR shows workers who fix ACs                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3: Ahmed Finds a Worker

```
┌─────────────────────────────────────────────────────────────────┐
│                    AHMED FINDS WORKER                            │
│                                                                   │
│   HUNAR shows Ahmed a list of AC workers near him:              │
│                                                                   │
│   ┌─────────────────────────────────────┐                      │
│   │ 👤 Ali Khan                          │                      │
│   │ ⭐ 4.8 (120 reviews)                │                      │
│   │ ✓ Verified                           │                      │
│   │ 📍 2 km away                         │                      │
│   └─────────────────────────────────────┘                      │
│                                                                   │
│   ┌─────────────────────────────────────┐                      │
│   │ 👤 Ahmed Raza                        │                      │
│   │ ⭐ 4.6 (89 reviews)                 │                      │
│   │ ✓ Verified                           │                      │
│   │ 📍 3 km away                         │                      │
│   └─────────────────────────────────────┘                      │
│                                                                   │
│   Ahmed clicks on Ali Khan's profile                           │
│         │                                                        │
│         ▼                                                        │
│   He sees Ali's skills, experience, and reviews                │
│         │                                                        │
│         ▼                                                        │
│   Ahmed clicks "Send Request"                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4: Ahmed Sends a Request

```
┌─────────────────────────────────────────────────────────────────┐
│                    AHMED SENDS REQUEST                           │
│                                                                   │
│   Ahmed fills out a simple form:                                │
│                                                                   │
│   Title: "AC not cooling"                                       │
│   Description: "My AC is making noise and not cooling"          │
│   Location: "Hayatabad, Peshawar"                               │
│   Budget: "Rs. 2000-3000"                                       │
│                                                                   │
│   He clicks "Post Job"                                          │
│         │                                                        │
│         ▼                                                        │
│   HUNAR sends the request to Ali Khan                           │
│         │                                                        │
│         ▼                                                        │
│   Ali gets a notification: "New job near you!"                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 5: Ali Responds

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALI RESPONDS                                  │
│                                                                   │
│   Ali sees Ahmed's request                                      │
│         │                                                        │
│         ▼                                                        │
│   Ali thinks "I can fix this!"                                  │
│         │                                                        │
│         ▼                                                        │
│   Ali sends an offer:                                           │
│   "Visit charge: Rs. 500"                                       │
│   "Repair cost: Rs. 2500"                                       │
│   "I can come tomorrow at 10am"                                 │
│         │                                                        │
│         ▼                                                        │
│   Ahmed gets a notification: "Ali sent you an offer!"           │
│         │                                                        │
│         ▼                                                        │
│   Ahmed sees the offer and clicks "Accept"                      │
│         │                                                        │
│         ▼                                                        │
│   HUNAR says "Great! Ali will come tomorrow at 10am"           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6: Ali Does the Work

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALI DOES THE WORK                             │
│                                                                   │
│   Tomorrow at 10am...                                           │
│         │                                                        │
│         ▼                                                        │
│   Ali goes to Ahmed's house                                     │
│         │                                                        │
│         ▼                                                        │
│   Ali checks the AC                                             │
│         │                                                        │
│         ▼                                                        │
│   Ali finds the problem: "The gas is low"                       │
│         │                                                        │
│         ▼                                                        │
│   Ali fixes it by adding gas                                    │
│         │                                                        │
│         ▼                                                        │
│   Ali tests it - AC works! ✅                                   │
│         │                                                        │
│         ▼                                                        │
│   Ali clicks "Job Complete" in HUNAR                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 7: Ahmed Pays and Rates

```
┌─────────────────────────────────────────────────────────────────┐
│                    AHMED PAYS AND RATES                          │
│                                                                   │
│   Ahmed gets a notification: "Job complete! Time to pay"        │
│         │                                                        │
│         ▼                                                        │
│   Ahmed opens HUNAR and sees:                                   │
│   "Total: Rs. 3000"                                             │
│         │                                                        │
│         ▼                                                        │
│   Ahmed picks JazzCash and clicks "Pay"                         │
│         │                                                        │
│         ▼                                                        │
│   Money goes to HUNAR's wallet                                  │
│         │                                                        │
│         ▼                                                        │
│   After 24 hours, Ali gets Rs. 2550 (85% of Rs. 3000)         │
│   HUNAR keeps Rs. 450 (15% commission)                          │
│         │                                                        │
│         ▼                                                        │
│   Ahmed rates Ali: ⭐⭐⭐⭐⭐ "Great work!"                      │
│         │                                                        │
│         ▼                                                        │
│   Ali rates Ahmed: ⭐⭐⭐⭐⭐ "Nice customer!"                   │
│         │                                                        │
│         ▼                                                        │
│   DONE! 🎉                                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Worker Journey (Step by Step)

Let's follow a worker named **Ali** who wants to earn money fixing ACs:

### Step 1: Ali Signs Up

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALI SIGNS UP                                  │
│                                                                   │
│   Ali opens HUNAR website                                       │
│         │                                                        │
│         ▼                                                        │
│   He types his phone number                                     │
│         │                                                        │
│         ▼                                                        │
│   HUNAR sends a code to his phone                               │
│         │                                                        │
│         ▼                                                        │
│   Ali types the code                                            │
│         │                                                        │
│         ▼                                                        │
│   Ali picks "I'm a Professional"                                │
│         │                                                        │
│         ▼                                                        │
│   He's inside! 🎉                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2: Ali Builds His Profile

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALI BUILDS PROFILE                            │
│                                                                   │
│   Ali fills out his profile:                                    │
│                                                                   │
│   Name: "Ali Khan"                                              │
│   Skills: "AC Repair, Fridge Repair"                            │
│   Experience: "5 years"                                         │
│   Bio: "I fix ACs and fridges. Fast and reliable."             │
│   Location: "Hayatabad, Peshawar"                               │
│   Rate: "Rs. 500 visit charge"                                  │
│                                                                   │
│   Ali uploads his photo                                         │
│         │                                                        │
│         ▼                                                        │
│   Ali waits for admin to verify him                             │
│         │                                                        │
│         ▼                                                        │
│   Admin checks Ali's information                                │
│         │                                                        │
│         ▼                                                        │
│   Admin says "Ali is verified!" ✓                               │
│         │                                                        │
│         ▼                                                        │
│   Now customers can see Ali's profile                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3: Ali Gets Requests

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALI GETS REQUESTS                             │
│                                                                   │
│   Ali is working and gets a notification:                      │
│   "New job near you! AC repair in Hayatabad"                   │
│         │                                                        │
│         ▼                                                        │
│   Ali clicks to see the details                                 │
│         │                                                        │
│         ▼                                                        │
│   He sees Ahmed's request                                       │
│         │                                                        │
│         ▼                                                        │
│   Ali thinks "I can do this!"                                   │
│         │                                                        │
│         ▼                                                        │
│   Ali sends his offer                                           │
│         │                                                        │
│         ▼                                                        │
│   Ahmed accepts! 🎉                                             │
│         │                                                        │
│         ▼                                                        │
│   Ali goes to fix the AC                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4: Ali Gets Paid

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALI GETS PAID                                 │
│                                                                   │
│   After fixing the AC, Ali clicks "Job Complete"                │
│         │                                                        │
│         ▼                                                        │
│   Ahmed pays Rs. 3000 through HUNAR                             │
│         │                                                        │
│         ▼                                                        │
│   HUNAR holds the money for 24 hours                            │
│         │                                                        │
│         ▼                                                        │
│   After 24 hours, HUNAR sends Rs. 2550 to Ali                  │
│         │                                                        │
│         ▼                                                        │
│   Ali sees in his wallet: "You earned Rs. 2550!"               │
│         │                                                        │
│         ▼                                                        │
│   Ali can take this money to his bank account                  │
│         │                                                        │
│         ▼                                                        │
│   Ali is happy! 😊                                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Admin Journey (Step by Step)

Let's follow an admin named **Sara** who manages HUNAR:

### Step 1: Sara Logs In

```
┌─────────────────────────────────────────────────────────────────┐
│                    SARA LOGS IN                                  │
│                                                                   │
│   Sara opens the admin panel                                    │
│         │                                                        │
│         ▼                                                        │
│   She types her admin username and password                     │
│         │                                                        │
│         ▼                                                        │
│   She's inside the admin dashboard! 🎉                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2: Sara Sees Everything

```
┌─────────────────────────────────────────────────────────────────┐
│                    SARA'S DASHBOARD                              │
│                                                                   │
│   Sara sees a big dashboard with numbers:                       │
│                                                                   │
│   ┌─────────────────────────────────────┐                      │
│   │  📊 PLATFORM STATS                  │                      │
│   │                                      │                      │
│   │  Total Users: 500                   │                      │
│   │  Total Workers: 200                 │                      │
│   │  Active Jobs: 50                    │                      │
│   │  Completed Jobs: 1000               │                      │
│   │  Total Revenue: Rs. 500,000         │                      │
│   └─────────────────────────────────────┘                      │
│                                                                   │
│   Sara also sees:                                               │
│   - Pending worker verifications (3 waiting)                   │
│   - Active disputes (1 problem to solve)                        │
│   - Recent activity (latest jobs and payments)                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3: Sara Verifies Workers

```
┌─────────────────────────────────────────────────────────────────┐
│                    SARA VERIFIES WORKERS                         │
│                                                                   │
│   Sara clicks "Pending Verifications"                          │
│         │                                                        │
│         ▼                                                        │
│   She sees 3 workers waiting to be verified:                   │
│                                                                   │
│   ┌─────────────────────────────────────┐                      │
│   │ 👤 Ali Khan - AC Repair             │                      │
│   │ 📄 ID Card uploaded                 │                      │
│   │ ✅ Approve   ❌ Reject              │                      │
│   └─────────────────────────────────────┘                      │
│                                                                   │
│   Sara clicks "Approve" for Ali                                │
│         │                                                        │
│         ▼                                                        │
│   Ali is now verified! ✓                                        │
│         │                                                        │
│         ▼                                                        │
│   Ali gets a notification: "You're verified!"                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4: Sara Solves Problems

```
┌─────────────────────────────────────────────────────────────────┐
│                    SARA SOLVES PROBLEMS                          │
│                                                                   │
│   Sara sees a dispute: "Customer says work wasn't done right"  │
│         │                                                        │
│         ▼                                                        │
│   Sara reads the details:                                       │
│   - Customer: Ahmed                                             │
│   - Worker: Ali                                                 │
│   - Problem: "AC still not cooling"                             │
│         │                                                        │
│         ▼                                                        │
│   Sara contacts both Ahmed and Ali                              │
│         │                                                        │
│         ▼                                                        │
│   She finds out Ali needs to come back and fix it              │
│         │                                                        │
│         ▼                                                        │
│   Sara tells Ali to fix it or refund the money                 │
│         │                                                        │
│         ▼                                                        │
│   Ali comes back and fixes it properly                         │
│         │                                                        │
│         ▼                                                        │
│   Ahmed is happy! Problem solved! ✅                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Database (Where All Information is Stored)

The database is like a giant filing cabinet where HUNAR keeps all its information. It's called **PostgreSQL** and it's really good at keeping information organized.

### What's in the Database?

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE DATABASE (Filing Cabinet)                 │
│                                                                   │
│   📁 USERS FILE                                                 │
│   └─── Ahmed (Customer, phone: 0300-1234567)                   │
│   └─── Ali (Worker, phone: 0300-7654321)                       │
│   └─── Sara (Admin, phone: 0300-1111111)                       │
│                                                                   │
│   📁 WORKER PROFILES FILE                                       │
│   └─── Ali Khan: AC Repair, 5 years, ⭐ 4.8                   │
│   └─── Ahmed Raza: Plumbing, 3 years, ⭐ 4.6                  │
│                                                                   │
│   📁 JOBS FILE                                                  │
│   └─── Job #1: Ahmed needs AC repair, Rs. 3000, completed     │
│   └─── Job #2: Fatima needs plumber, Rs. 1500, in progress    │
│                                                                   │
│   📁 PAYMENTS FILE                                              │
│   └─── Payment #1: Ahmed paid Rs. 3000, completed             │
│   └─── Payment #2: Fatima paid Rs. 1500, pending              │
│                                                                   │
│   📁 REVIEWS FILE                                               │
│   └─── Ahmed rated Ali: ⭐⭐⭐⭐⭐ "Great work!"               │
│   └─── Fatima rated Ahmed: ⭐⭐⭐⭐ "Good service"             │
│                                                                   │
│   📁 MESSAGES FILE                                              │
│   └─── Ahmed: "When can you come?"                             │
│   └─── Ali: "Tomorrow at 10am"                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Why PostgreSQL?

PostgreSQL is like a super-smart librarian who:
- Never loses information
- Can find anything instantly
- Keeps everything organized
- Can handle millions of records
- Is free to use!

---

## Redis Cache (The Quick Memory)

Redis is like a sticky note pad that HUNAR uses for things it needs to remember quickly.

```
┌─────────────────────────────────────────────────────────────────┐
│                    REDIS (Quick Memory)                          │
│                                                                   │
│   📝 OTP CODES                                                  │
│   └─── Ahmed's code: 123456 (expires in 5 minutes)            │
│                                                                   │
│   📍 WORKER LOCATIONS                                           │
│   └─── Ali is at: lat 34.0, lng 71.5                           │
│                                                                   │
│   ⚡ USER SESSIONS                                              │
│   └─── Ahmed is logged in right now                            │
│                                                                   │
│   🚦 RATE LIMITS                                                │
│   └─── Ahmed sent 3 requests in 1 minute (okay!)              │
│   └─── Someone sent 100 requests (blocked!)                   │
│                                                                   │
│   🔌 ONLINE STATUS                                              │
│   └─── Ali is online (green dot)                               │
│   └─── Ahmed is offline (gray dot)                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Real-Time Chat (How People Talk)

When Ahmed and Ali need to talk, they use the chat feature. It's like WhatsApp, but inside HUNAR.

```
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME CHAT                                │
│                                                                   │
│   Ahmed types: "Hi Ali, when can you come?"                    │
│         │                                                        │
│         ▼                                                        │
│   Message goes to Socket.IO Server                              │
│         │                                                        │
│         ▼                                                        │
│   Socket.IO sends it to Ali immediately                        │
│         │                                                        │
│         ▼                                                        │
│   Ali sees the message right away                               │
│         │                                                        │
│         ▼                                                        │
│   Ali types: "I can come tomorrow at 10am"                     │
│         │                                                        │
│         ▼                                                        │
│   Message goes back to Ahmed immediately                        │
│         │                                                        │
│         ▼                                                        │
│   Ahmed sees it right away                                       │
│                                                                   │
│   It's instant! No waiting! Like magic! ✨                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Notifications (How Users Get Alerts)

HUNAR can tell users about important things in three ways:

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION WAYS                             │
│                                                                   │
│   📱 PUSH NOTIFICATION                                          │
│   └─── A popup on your phone like "New job near you!"          │
│        Used for: New jobs, payment confirmations                │
│                                                                   │
│   💬 IN-APP MESSAGE                                             │
│   └──--- A message inside the HUNAR app                        │
│         Used for: Chat messages, status updates                 │
│                                                                   │
│   📨 SMS (Text Message)                                         │
│   └─── A regular text message to your phone                    │
│         Used for: OTP codes, important alerts                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security (How We Keep Everything Safe)

HUNAR has many layers of security, like a castle with multiple walls:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
│                                                                   │
│   🔒 LAYER 1: NETWORK                                           │
│   └─── Firewalls block bad people                              │
│        SSL certificates make the connection safe                │
│                                                                   │
│   🔐 LAYER 2: AUTHENTICATION                                    │
│   └─── You must prove who you are with phone OTP               │
│        Every action requires a special token (JWT)              │
│                                                                   │
│   🛡️ LAYER 3: RATE LIMITING                                     │
│   └─── You can't send too many requests at once                │
│        This stops spammers and hackers                         │
│                                                                   │
│   📝 LAYER 4: DATA VALIDATION                                   │
│   └──--- HUNAR checks all information before saving            │
│         Bad information is rejected                             │
│                                                                   │
│   🔑 LAYER 5: ROLE-BASED ACCESS                                 │
│   └─── Customer can only see customer things                   │
│        Worker can only see worker things                       │
│        Admin can see everything                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Storage (Where Photos Go)

When users upload photos, they go to a safe place called AWS S3 (like a cloud storage room).

```
┌─────────────────────────────────────────────────────────────────┐
│                    FILE STORAGE                                  │
│                                                                   │
│   User uploads a photo                                         │
│         │                                                        │
│         ▼                                                        │
│   HUNAR checks: Is it the right type? Is it too big?           │
│         │                                                        │
│         ▼                                                        │
│   HUNAR makes 3 copies:                                         │
│   └─── 🖼️ Small (thumbnail) - for lists                        │
│   └──--- 🖼️ Medium - for profile views                        │
│   └──--- 🖼️ Large - for full view                             │
│         │                                                        │
│         ▼                                                        │
│   All copies go to AWS S3 (cloud storage)                       │
│         │                                                        │
│         ▼                                                        │
│   HUNAR saves the links to the photos                          │
│         │                                                        │
│         ▼                                                        │
│   When someone views the photo, HUNAR shows it from AWS S3     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## How Everything Works Together

The most important thing to understand is how all the pieces work together. Here's the big picture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE COMPLETE PICTURE                           │
│                                                                   │
│   1. CUSTOMER opens HUNAR website                               │
│         │                                                        │
│         ▼                                                        │
│   2. WEBSITE sends request to BACKEND                           │
│         │                                                        │
│         ▼                                                        │
│   3. BACKEND checks with REDIS (is this person logged in?)     │
│         │                                                        │
│         ▼                                                        │
│   4. BACKEND talks to DATABASE (get the information)            │
│         │                                                        │
│         ▼                                                        │
│   5. BACKEND sends information back to WEBSITE                  │
│         │                                                        │
│         ▼                                                        │
│   6. WEBSITE shows the information to CUSTOMER                 │
│         │                                                        │
│         ▼                                                        │
│   7. CUSTOMER clicks a button                                   │
│         │                                                        │
│         ▼                                                        │
│   8. BACKEND does something (creates a job, sends notification) │
│         │                                                        │
│         ▼                                                        │
│   9. WORKER gets notified on their phone                       │
│         │                                                        │
│         ▼                                                        │
│   10. WORKER responds through the website                       │
│         │                                                        │
│         ▼                                                        │
│   11. BACKEND updates the DATABASE                              │
│         │                                                        │
│         ▼                                                        │
│   12. EVERYONE SEES THE UPDATE! 🎉                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

**HUNAR is a website that connects people who need help with people who can help.**

The backend is the brain that:
- Remembers who everyone is (Auth)
- Keeps track of all jobs (Jobs)
- Handles all the money (Payments)
- Lets people talk (Chat)
- Sends alerts (Notifications)
- Finds workers nearby (Location)
- Stores photos (File Upload)
- Lets admin manage everything (Admin)

The wallet system:
- Customer pays → Platform holds money → Platform takes 15% → Worker gets 85%

The whole flow:
1. Customer signs up
2. Customer finds a worker
3. Customer sends a request
4. Worker accepts
5. Worker does the work
6. Customer pays
7. Everyone is happy!

---

*This document explains the complete backend architecture of HUNAR in simple terms that anyone can understand.*
