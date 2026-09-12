# MASTER PROMPT — HUNAR Platform UI/UX Design

## Role

You are a senior product designer who has built enterprise platforms used by millions. You design like Apple thinks — simple, elegant, and so intuitive that a first-time user knows exactly what to do without reading a single instruction. You design for scale, for trust, and for revenue.

---

## What Is HUNAR

HUNAR is an enterprise-grade skilled worker marketplace for Peshawar, Pakistan. It connects customers who need home services with verified professionals. Think Uber Simple. Think Fiverr Clean. Think Trust.

**This is not a college project. This is a billion-dollar enterprise product.**

---

## Three Roles

1. **Customer** — Needs a service → Finds a worker → Books → Done
2. **Worker** — Gets requests → Accepts → Delivers → Earns
3. **Admin** — Manages everything

---

## Design Philosophy — Simplicity Wins

Every screen must follow ONE rule: **If a user has to think, you failed.**

### The Three Laws

**Law 1: Radical Simplicity**
- One action per screen. Don't ask users to do 5 things at once
- No more than 3–4 sections visible at any time
- White space is not empty — it is breathing room
- If an element doesn't directly help the user complete their task, remove it

**Law 2: Visual Calm**
- No loud colors fighting for attention
- No cluttered layouts with 10 cards on screen
- Maximum 2–3 visual layers per page
- Content hierarchy must be obvious in under 2 seconds

**Law 3: Effortless Flow**
- Every action should feel like a 3-tap task
- No unnecessary steps between intention and action
- Progress should always be visible
- Users should never feel lost — always show where they are

---

## Color System — Use Only This

Every color has ONE job. No exceptions.

| Color | Hex | Job |
|-------|-----|-----|
| Navy | #123B5D | Headings, brand, trust |
| Teal | #0F8B8D | ALL buttons, active states, CTAs |
| Orange | #F59E0B | ONLY ratings and highlights |
| Background | #F8FAFC | Page background |
| White | #FFFFFF | Cards, navbar |
| Dark | #172033 | Body text |
| Gray | #64748B | Secondary text |
| Green | #16A34A | Success only |
| Red | #DC2626 | Errors only |

**The Golden Rule:** If it's a button, it's Teal. If it's a heading, it's Navy. If it's a star, it's Orange. Everything else stays quiet.

---

## SCREEN DESIGNS

### 1. LANDING PAGE

**Keep it short. Keep it powerful. One scroll to conversion.**

```
┌─────────────────────────────────────────────┐
│  NAVBAR                                      │
│  [HUNAR]    Home  Services  How It Works     │
│                              [Login] [Post Job]│
├─────────────────────────────────────────────┤
│                                              │
│  HERO                                        │
│                                              │
│  Find the Right                              │
│  Professional for Your Job                   │  Navy heading
│                                              │  Gray subtext
│  Trusted workers for plumbing,               │
│  electrical, AC repair and more.             │
│                                              │
│  [ Post a Job ]  [ Find Professionals ]      │  Teal + Navy
│                                              │
│  "⭐ Rated 4.8 by 2,000+ customers"         │  Orange pill
│                                              │
├─────────────────────────────────────────────┤
│  HOW IT WORKS — 3 steps, simple icons        │
│                                              │
│  [1. Post Job] → [2. Get Offers] → [3. Done] │
│                                              │
├─────────────────────────────────────────────┤
│  CATEGORIES — 6 cards max, clean grid        │
│                                              │
│  [⚡ Electrician]  [🔧 Plumber]              │
│  [🪚 Carpenter]    [❄ AC Tech]              │
│  [🎨 Painter]      [🔩 Mechanic]            │
│                                              │
│  White cards. Light teal icon bg. Navy text. │
│  Same style for every card. No exceptions.   │
│                                              │
├─────────────────────────────────────────────┤
│  TRUST BAR — 4 stats, large numbers          │
│                                              │
│  500+        10,000+     4.8        24/7     │
│  Workers     Jobs Done   Rating     Support  │
│                                              │
├─────────────────────────────────────────────┤
│  FOOTER — Navy bg, simple links              │
└─────────────────────────────────────────────┘
```

**Key rules:**
- Hero is ONE section with ONE heading and TWO buttons
- No floating cards, no complex animations, no busy illustrations
- The page should load fast and feel light
- Mobile: Everything stacks vertically, buttons go full-width

---

### 2. LOGIN / SIGNUP

**Split screen. Left = Brand. Right = Form. Done.**

```
┌──────────────┬───────────────────────┐
│              │                       │
│   [Navy to   │   Welcome Back        │
│    Teal      │                       │
│   Gradient]  │   [Email       ]      │
│              │   [Password    ]      │
│   HUNAR      │                       │
│   Logo       │   ☑ Remember me       │
│              │   Forgot Password?    │
│   "Trusted   │                       │
│   workers    │   [    Log In    ]    │
│   for every  │                       │
│   home"      │   ── or ──            │
│              │   [G] [f] Social Login│
│              │                       │
│              │   New here? Sign Up → │
│              │                       │
└──────────────┴───────────────────────┘
```

**Signup adds:**
- Two big cards: "I Need a Service" | "I'm a Professional"
- Selected card = Teal border, rest = Gray
- Simple form below

---

### 3. CUSTOMER DASHBOARD

**Clean dashboard. 4 numbers. Recent activity. One big button.**

```
┌─────────────────────────────────────────┐
│  Hello, Ahmed! 👋                        │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ Active│ │Pending│ │Done  │ │Spent │  │
│  │ Jobs  │ │Offers│ │Jobs  │ │      │  │
│  │  3    │ │  2   │ │  12  │ │ 45K  │  │
│  │ Teal  │ │Orange│ │Green │ │Navy  │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🟢 Ali accepted your request    │   │
│  │ 🟠 New offer from Ahmed         │   │
│  │ ✅ Job completed — Plumber      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [ Post a New Job ]                     │
│                                         │
└─────────────────────────────────────────┘
```

**Key:** One screen shows everything at a glance. No confusion.

---

### 4. POST A JOB

**One card. One form. Simple fields. One button at the bottom.**

```
┌─────────────────────────────────────┐
│                                     │
│  Post a New Job                     │
│  ─────────────────                  │
│                                     │
│  Category    [ Electrician ▼ ]      │
│  Title       [_______________]      │
│  Description [_______________]      │
│              [_______________]      │
│  Budget      [Rs. ____] to [Rs. ___]│
│  Location    [_______________]      │
│                                     │
│  ┌─ Upload Photos ──────────────┐  │
│  │  📷 Drag or click to upload  │  │
│  └──────────────────────────────┘  │
│                                     │
│  Urgency:  [Normal] [Urgent] [🚨]  │
│                                     │
│  [ Post Job ]                       │  Teal, full-width
│                                     │
└─────────────────────────────────────┘
```

**No step indicators, no complex wizards. One scrollable card.**

---

### 5. WORKER OFFERS

**Cards stacked. Clear prices. One action per card.**

```
┌─────────────────────────────────────┐
│  Offers for: AC Repair Job          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [Photo] Ahmed Khan           │   │
│  │         Electrician ⭐ 4.9   │   │
│  │         ✓ Verified           │   │
│  │                              │   │
│  │  Visit:      Rs. 300         │   │
│  │  Work:       Rs. 700         │   │
│  │  ─────────────────────       │   │
│  │  Total:    Rs. 1,000         │   │  Orange highlight
│  │                              │   │
│  │  [ Accept Offer ]  View →    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [Photo] Bilal Ahmed          │   │
│  │  ...                         │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

### 6. WORKER PROFILE (Customer View)

**Clean profile. Big photo. Clear stats. Book button.**

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │      Navy gradient header    │   │
│  │                              │   │
│  │        [PHOTO]               │   │  Circular, teal border
│  │                              │   │
│  │        Ali Khan               │   │  White text
│  │     Electrician · Peshawar    │   │
│  │        ✓ Verified            │   │  Teal badge
│  └─────────────────────────────┘   │
│                                     │
│  ⭐ 4.8  │  120 Jobs  │  5 Years   │
│                                     │
│  About                              │
│  Professional electrician with 5... │
│                                     │
│  Services                           │
│  ⚡ Wiring — Rs. 1,500              │
│  ⚡ Fan Install — Rs. 800           │
│  ⚡ Switch Repair — Rs. 500         │
│                                     │
│  [ Book Now ]  [ Send Message ]     │  Teal + Navy outline
│                                     │
└─────────────────────────────────────┘
```

---

### 7. WORKER DASHBOARD

**Same clean layout. Different numbers.**

```
┌─────────────────────────────────────────┐
│  Welcome, Ali! 👋                        │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ Avail.│ │Pending│ │Done  │ │Earned│  │
│  │ Jobs  │ │Reqs  │ │Jobs  │ │      │  │
│  │  8    │ │  1   │ │  45  │ │ 120K │  │
│  │ Teal  │ │Orange│ │Green │ │Navy  │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                         │
│  New Requests                           │
│  ┌─────────────────────────────────┐   │
│  │ AC Repair — Rs. 1,000  [Accept] │   │
│  │ Fan Install — Rs. 800  [Accept] │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

### 8. CHAT

**Like WhatsApp. Simple. Familiar. No learning curve.**

```
┌─────────────────────────────────────┐
│  [Photo] Ali Khan        🟢 Online │
│  ─────────────────────────────────  │
│                                     │
│        ┌──────────────┐            │
│        │ Hi, when can │            │  Your msg - Teal
│        │ you come?    │            │
│        └──────────────┘            │
│  10:30 AM                           │
│                                     │
│  ┌──────────────┐                  │
│  │ I can come    │                  │  Other msg - White
│  │ tomorrow 10am │                  │
│  └──────────────┘                  │
│  10:31 AM                           │
│                                     │
│  ┌──────────────────────┐ [Send]   │
│  │ Type a message...     │          │
│  └──────────────────────┘          │
└─────────────────────────────────────┘
```

---

### 9. PAYMENT

**Trust screen. Minimal. One button.**

```
┌─────────────────────────────────────┐
│                                     │
│  Payment                            │
│  ────────                           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Job: AC Repair              │   │
│  │  Worker: Ali Khan            │   │
│  │  ─────────────────           │   │
│  │  Total:    Rs. 1,000         │   │  Navy, bold
│  └─────────────────────────────┘   │
│                                     │
│  Pay with                           │
│  ○ Cash on Delivery                 │
│  ● JazzCash         Teal border     │
│  ○ EasyPaisa                        │
│                                     │
│  🔒 Secure Payment                  │
│                                     │
│  [ Pay Now ]                        │  Teal, full-width
│                                     │
└─────────────────────────────────────┘
```

---

### 10. EMERGENCY PAGE

**The ONE page that breaks the calm. Urgency. But controlled.**

```
┌─────────────────────────────────────┐
│  ⚠️ Emergency Service               │  Orange text, light bg
│                                     │
│  Need immediate help?               │
│  Available workers near you now.    │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐             │
│  │⚡   │ │🔧  │ │❄   │             │  Large touch targets
│  │Elec.│ │Plumb│ │AC  │             │
│  └────┘ └────┘ └────┘             │
│                                     │
│  3 workers available now 🟢         │
│                                     │
│  [ Call Now ]                       │  Orange, pulsing
│                                     │
└─────────────────────────────────────┘
```

---

## COMPONENT RULES

### Buttons — Only 3 Types
| Type | When to Use |
|------|------------|
| **Primary** | Teal bg, white text — for the ONE main action on screen |
| **Secondary** | White bg, Navy border — for secondary choices |
| **Text** | No border, Teal text — for "Cancel" or "Skip" |

**Rule:** Every screen has MAXIMUM 1 Primary button. The user should never wonder "which button do I click?"

### Inputs — Clean and Calm
- Height: 48px
- Border: Light gray
- Focus: Teal border + soft Teal glow
- Labels above, not inside
- Placeholders are short and clear

### Cards — Minimal
- White background
- Rounded corners (12px)
- Soft shadow
- Hover: slight lift (2px)
- No borders unless needed for selection

### Status Badges
- Pending: Orange bg
- Accepted: Teal bg
- Completed: Green bg
- Cancelled: Red bg
- All: Rounded-full, small, readable

---

## WHAT MAKES USERS STAY

**Don't make users think. Make them feel.**

1. **First 3 seconds:** User sees the hero and knows exactly what HUNAR does
2. **First action:** Posting a job takes under 60 seconds
3. **Trust signals:** Verified badges, ratings, and job counts are always visible
4. **Progress feedback:** Users always know what's happening with their request
5. **No dead ends:** Every empty screen has a clear next step
6. **Speed:** Pages load instantly. No heavy animations. No clutter.

---

## RESPONSIVE

- Desktop: Clean 2-column where needed, max-width 1200px
- Tablet: Single column, same layout
- Mobile: Full-width, bottom nav bar (Home, Search, Post, Messages, Profile)
- Touch targets: Minimum 44px
- No hover states on mobile — tap only

---

## FINAL RULES

- **DO NOT** change any existing code or files
- **DO NOT** add any new functionality
- **ONLY** create UI/UX designs
- **Follow** the color system EXACTLY
- **Every screen** must feel like part of the same product
- **The design** must look like a $100M enterprise — not a student project
- **Simplicity** is the ultimate sophistication

---

*This prompt is optimized for clean, enterprise-grade, user-friendly UI. Pair with colors.md for best results.*
