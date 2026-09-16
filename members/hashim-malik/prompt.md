# HUNAR — MASTER DESIGN & BUILD PROMPT

## READ THIS BEFORE EVERYTHING

You are building **HUNAR** — a home-services marketplace that connects customers with nearby skilled professionals (electricians, plumbers, AC technicians, carpenters, painters, mechanics).

This is NOT a design exercise. This is NOT a static mockup.

This is a **fully interactive, psychologically addictive, stop-scrolling product experience** that makes users feel trust, excitement, and compulsion to keep using the platform.

Every pixel, every animation, every color, every transition must serve one purpose: **make the user never want to leave.**

---

# PART 1 — PSYCHOLOGICAL DESIGN FOUNDATION

## The Human Brain While Using a Website

Every decision a user makes on your platform is driven by **four psychological forces**:

### 1. DOPAMINE (Desire & Reward)

The user's brain releases dopamine when they:

- See something beautiful for the first time (hero section)
- Discover something unexpected (animated stats, live job counters)
- Complete an action and see instant feedback (posting a job, getting an offer)
- Receive social proof (worker ratings, "247 jobs completed")

**Application:**

- Every screen must have a **micro-reward** — a small animation, a satisfying transition, a confirmation toast that feels good
- When a customer posts a job, the confirmation must feel like an **achievement** — not just text, but a celebration animation
- When offers arrive, they should **slide in with animation** so the user feels the excitement of receiving something
- Dashboard numbers should **count up with animation** when the page loads — don't just show static numbers

### 2. TRUST (Safety & Credibility)

The user must feel safe within **0.5 seconds** of landing on any page.

**Application:**

- The verified badge must be **green teal (#0F8B8D)** with a shield icon — this color must become synonymous with trust across the entire platform
- Worker profiles must show: photo, rating, verification badge, completed jobs count, and location — **all visible without scrolling**
- The color hierarchy must be consistent: Navy = Authority, Teal = Safe Action, Orange = Attention, Green = Success, Red = Danger
- Never use red or orange for primary actions — they create anxiety, not trust
- Use **white space generously** — cluttered designs feel unsafe and scammy
- Payment screens must feel **minimal and secure** — no distractions, no competing CTAs

### 3. URGENCY (FOMO & Scarcity)

The user must feel that **inaction has a cost.**

**Application:**

- Show **"3 workers viewing this job right now"** on active job cards
- Show **"Average response time: 12 minutes"** on the landing page
- On worker cards, show **"Last active: 2 minutes ago"** — creates immediacy
- When a job is posted, show a **live counter**: "Your job is visible to X nearby professionals"
- Show **"X workers nearby"** on the hero section with a pulsing dot animation
- Emergency services must have a **pulsing orange accent** — signals urgency without panic

### 4. PROGRESS (Momentum & Completion)

Humans are wired to complete things they start. **Show progress always.**

**Application:**

- Job creation must be a **multi-step progress bar** (Step 1 of 6) — users are 73% more likely to complete multi-step forms with visible progress
- The job status timeline must show **completed steps as green checkmarks** and upcoming steps as gray circles — creates a visual "pull" to complete
- Dashboard must show **"You're 3 steps away from completing this job"** type nudges
- Worker onboarding must show a **profile completion percentage** — "Your profile is 65% complete — add a photo to reach 80%"
- After each completed action, show a **brief confetti or checkmark animation** — reinforces completion

---

# PART 1B — THE DESIGN MINDSET THAT GRABS ATTENTION

## What Makes Users Stop Scrolling

A user's brain decides whether to stay or leave within **0.3 seconds**. Not 3 seconds. Not 1 second. **0.3 seconds.**

In that time, the brain answers three questions:

1. **What is this?** (Recognition)
2. **Is this for me?** (Relevance)
3. **What should I do?** (Action)

If any of these three questions has no clear answer in 0.3 seconds, the user scrolls away. The design has failed.

Instagram's designers mastered this. Not because they used fancy animations or bright colors. But because they understood **how the human eye moves across a screen** and **how the brain assigns importance to visual elements.**

You must apply the same thinking to every HUNAR screen.

---

## Principle 1: One Hero Element Per Screen

Every screen has exactly **ONE element** that is the most visually important. Everything else is supporting cast.

**What this means for HUNAR:**

On the landing page, the hero heading is the hero. Not the background. Not the illustration. Not the navigation. The heading.

On the worker profile, the worker's **face** is the hero. Not the name. Not the rating. Not the verified badge. The face. Humans are biologically wired to notice faces first. Use this.

On the job posting screen, the **progress bar** is the hero. It tells the user where they are and how far they have to go. Everything else supports this.

On the dashboard, the **active job card** is the hero. Not the stats. Not the sidebar. The thing that needs their attention right now.

**The Rule:** Before designing any screen, ask: "If the user sees only ONE thing on this screen, what should it be?" Design that thing first. Then add everything else around it, making sure nothing competes with it.

**How to make one element the hero:**

- Make it **larger** than everything else
- Give it **more white space** around it than anything else
- Use **higher contrast** — if everything is gray, make the hero Navy or Teal
- **Position** it where the eye naturally goes (top-center on desktop, center on mobile)
- **Animate** it differently — if everything fades in, let the hero scale in

---

## Principle 2: White Space Is Not Empty Space

Amateurs fill every pixel. Masters leave space.

White space is the most powerful tool in design. It does three things:

1. **Creates importance** — an element surrounded by space feels more important than an element surrounded by other elements
2. **Reduces cognitive load** — the brain processes fewer things at once, so each thing gets more attention
3. **Feels premium** — luxury brands use massive white space because it signals quality

**What this means for HUNAR:**

The hero section should have **at least 80px of breathing room** above and below the main content. Not 40px. Not 56px. **80px minimum.**

Worker profile photos should have **generous padding** around them — don't cram text right next to the face.

Dashboard stat cards should have **24px padding** inside and **16px gap** between them. Never 8px. Never 12px. The space between cards is as important as the cards themselves.

CTA buttons should have **32px of space** above them and **16px below**. The space above tells the eye "this is important, pay attention." The space below tells the eye "this is the end of this section."

**The Test:** If you remove an element and the screen still looks fine, that element might not need to exist. If you add white space and the screen looks better, you found the right amount.

---

## Principle 3: The Glance Test

Can a user understand the screen in **0.5 seconds** by just glancing at it?

If they need to read text to understand what the screen is about, the design has failed at visual communication.

**How to pass the Glance Test:**

- **Size** tells importance — the biggest thing on screen should be the most important
- **Color** tells action — the only colored element should be the thing to click
- **Position** tells priority — top-center is seen first, bottom-right is seen last
- **Contrast** tells focus — the highest contrast element gets attention first

**Apply to HUNAR:**

Landing page glance test:

- User sees: Big Navy heading → understands "this is about finding professionals"
- User sees: Teal button → understands "I should click this"
- Pass ✅

Worker profile glance test:

- User sees: Large face photo → understands "this is a person"
- User sees: Rating stars → understands "this person is good"
- User sees: Teal "Book Now" → understands "I can hire this person"
- Pass ✅

Dashboard glance test:

- User sees: Active job card with status badge → understands "I have something in progress"
- User sees: Orange pending badge → understands "something needs my attention"
- Pass ✅

**If any screen fails the Glance Test, redesign it until it passes.**

---

## Principle 4: The Eye Flow Path

The human eye follows a predictable path across a screen. Understanding this path lets you **control what the user sees first, second, and third.**

### The F-Pattern (For Text-Heavy Screens — Dashboard, Job Details)

```
┌─────────────────────────┐
│ ●●●●●●●●●●●●●●●●●●●●●●●● │  ← Eye starts here (top-left)
│ ●●●●●●●●●●●●●●●●        │  ← Scans right
│ ●●●●●●●●●●●●●            │  ← Drops down, scans shorter
│ ●●●●●●●●●●               │
│ ●●●●●●●                  │
│ ●●●●●●                   │
│ ●●●●                     │
│ ●●                       │
└─────────────────────────┘
```

**Apply to HUNAR Dashboard:**

- **Top-left**: Most important stat (Active Jobs)
- **Top-right**: Least important stat (Total Spent)
- **Below stats**: Active job cards (the eye naturally drops down after scanning stats)
- **Right side**: Secondary info (upcoming visits, recent activity)

### The Z-Pattern (For Visual Screens — Landing Page, Worker Profile)

```
┌─────────────────────────┐
│ ●●●●●●●●→→→→→→→→→●●●●●●●│  ← Eye: top-left to top-right
│                    ↓      │
│                    ↓      │  ← Eye: diagonal to bottom-left
│                    ↓      │
│ ●●●●●●●●→→→→→→→→→●●●●●●●│  ← Eye: bottom-left to bottom-right
└─────────────────────────┘
```

**Apply to HUNAR Landing Page:**

- **Top-left**: Logo (brand recognition)
- **Top-right**: Navigation + Login (secondary action)
- **Center**: Hero heading + CTA (the diagonal draws eye here)
- **Bottom-right**: "Find Professionals" (secondary CTA lands here naturally)

### The Center-Weight Pattern (For Mobile)

On mobile, the eye goes to the **center of the screen first**, then scans up and down.

**Apply to HUNAR Mobile:**

- **Center**: Primary action (Post a Job button, or active job card)
- **Above center**: Status information
- **Below center**: Secondary options
- **Never put important actions at the top corners** — they're the hardest places to reach and the last places the eye looks

---

## Principle 5: Contrast Creates Hierarchy

The most important visual tool in design is **contrast**. Not color contrast alone — contrast of size, weight, spacing, and animation.

**Types of contrast that create attention:**

| Contrast Type      | Example on HUNAR                                    | Effect                                |
| ------------------ | --------------------------------------------------- | ------------------------------------- |
| Size contrast      | Hero heading 48px vs body 16px                      | Heading feels 3x more important       |
| Weight contrast    | Bold heading vs regular body                        | Heading feels more authoritative      |
| Color contrast     | Teal button on white background                     | Button becomes the focal point        |
| Spacing contrast   | Element with 40px margin vs element with 8px margin | Spacious element feels premium        |
| Animation contrast | Animated element on static page                     | Animated element grabs all attention  |
| Shadow contrast    | Elevated card vs flat background                    | Card feels like it's "above" the page |

**Apply to HUNAR:**

On the landing page:

- The "Post a Job" button is the ONLY teal element in the hero section
- This single point of color makes the eye go straight to it
- If you made the secondary button teal too, the eye wouldn't know where to go
- **One color accent = one focal point = one clear action**

On worker cards:

- The worker's face is the largest element
- The name is the second largest
- The rating is the third (in orange for contrast)
- The "Book Now" button is the only teal element
- Everything else is gray or Navy — receding into the background

On the dashboard:

- Active job cards have a **colored left border** (teal for active, orange for pending)
- This single line of color makes the user's eye go to that card first
- Stats without color accents feel secondary — which is correct

---

## Principle 6: Emotional Imagery

Humans process images **60,000 faster than text.** A single photograph can create more emotional connection than 100 words of copy.

**What this means for HUNAR:**

### Worker Photos

- Must show **real faces** — not illustrations, not icons, not silhouettes
- Face should be **clearly visible** — no sunglasses, no distant shots
- Photo should have **warm, natural lighting** — not harsh flash, not dark shadows
- Worker should be **smiling or looking confident** — this creates trust
- Photo should be **cropped to show face + shoulders** — this is the most trustworthy framing (same as LinkedIn, same as passport photos — humans trust this framing instinctively)

### Portfolio Images

- Show **before/after** when possible — this is the most compelling visual proof
- Images should be **large** — small thumbnails don't create emotional impact
- **Full-width images** on desktop (within the card/container)
- On mobile, images should be **swipeable** — full-screen experience

### Category Icons

- Use **realistic illustrations**, not abstract icons
- An electrician icon should show a person with tools, not just a lightning bolt
- This creates **immediate recognition** — the brain processes "person with tools" faster than "abstract symbol"

### Hero Illustration/Photo

- Show a **real scene** — a professional working, a happy customer, a home being repaired
- The image should tell the story of HUNAR **without any text**
- If you remove all text from the hero, the image alone should communicate: "This platform connects you with workers"

---

## Principle 7: The Thumb Zone (Mobile Attention)

On mobile, **where you place an element determines whether it gets tapped.**

```
┌─────────────────────────┐
│     HARD TO REACH       │  ← Top corners: hardest to tap
│                         │
│  MEDIUM        MEDIUM   │  ← Upper area: requires stretching
│                         │
│  EASY          EASY     │  ← Center: natural thumb rest
│                         │
│  EASIEST ←→  EASIEST   │  ← Bottom-center: easiest to tap
│   [BOTTOM NAV]          │
└─────────────────────────┘
```

**Apply to HUNAR Mobile:**

- **Primary action** (Post a Job, Book Now, Send Offer): **Center-bottom area** — directly in the thumb's natural resting position
- **Secondary actions** (View Profile, Message): **Center area** — easy to reach
- **Tertiary actions** (Settings, Help, Back): **Top-left** — requires effort, which is fine for infrequent actions
- **Never put important CTAs in the top-right corner** — it's the hardest place to reach with one hand

**The 48px Rule:**
Every tappable element must be **at least 48px × 48px**. Not 40px. Not 44px. **48px.** This is not a suggestion — it's a biological requirement. The average adult fingertip is 10-14mm wide. On a 375px-wide screen, 48px = ~6.4mm, which is the minimum comfortable tap target.

**The 16px Gap Rule:**
Between any two tappable elements, there must be **at least 16px of space.** This prevents accidental taps — one of the most frustrating user experiences.

---

## Principle 8: Micro-Copy Creates Emotion Before Design Does

The words on the screen create emotion **before** the design does. A user reads "Submit" and feels nothing. A user reads "Get Help Now" and feels urgency and relief.

**Button Text Psychology:**

| Bad Text   | Better Text        | Why                                         |
| ---------- | ------------------ | ------------------------------------------- |
| Submit     | Post My Job        | Personal, action-oriented, specific         |
| Search     | Find Professionals | Benefit-focused, not task-focused           |
| Continue   | Next Step          | Implies progress, not just moving forward   |
| Cancel     | Go Back            | Less anxiety-inducing than "Cancel"         |
| Delete     | Remove             | Less scary, more reversible feeling         |
| Login      | Welcome Back       | Warm, personal, acknowledges return         |
| Register   | Join HUNAR         | Community, belonging, not just "signing up" |
| Send Offer | Offer My Services  | Worker feels empowered, not submissive      |
| Accept     | Hire Ali Khan      | Personal, makes the action feel significant |
| Pay Now    | Complete Payment   | Feels like finishing, not spending          |

**Helper Text Psychology:**

| Screen         | Bad Helper Text         | Better Helper Text                                                       |
| -------------- | ----------------------- | ------------------------------------------------------------------------ |
| Job creation   | "Enter description"     | "Describe what's broken — the more detail, the better offers you'll get" |
| Worker profile | "Add your bio"          | "Tell customers why they should choose you"                              |
| Payment        | "Select payment method" | "Your payment is protected until the job is complete"                    |
| Review         | "Rate this worker"      | "Your review helps other customers find great professionals"             |

**Error Text Psychology:**

| Bad Error            | Better Error                                        | Why                            |
| -------------------- | --------------------------------------------------- | ------------------------------ |
| "Invalid input"      | "This field needs a valid phone number"             | Tells user exactly what to fix |
| "Error occurred"     | "Something went wrong on our end — we're fixing it" | Takes blame away from user     |
| "Password too short" | "Your password needs at least 8 characters"         | Positive framing, not negative |
| "Required field"     | "We need this to find workers near you"             | Explains WHY it's required     |

---

## Principle 9: Visual Rhythm

A screen where everything is the same size and spacing feels **monotonous**. The eye gets bored and leaves.

A screen where elements vary in size, spacing, and visual weight creates **rhythm** — like music. The eye jumps from beat to beat, and each beat is satisfying.

**How to create rhythm on HUNAR screens:**

### Dashboard Rhythm

```
┌──────────────────────────────────────────────────┐
│  STAT CARD (large)  STAT CARD  STAT CARD  STAT   │  ← Beat 1: Quick scan
├──────────────────────────────────────────────────┤
│                                                  │
│  ACTIVE JOB CARD (large, prominent)              │  ← Beat 2: Main focus
│  Status badge · Worker name · Time               │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  Upcoming Visit (medium)                         │  ← Beat 3: Secondary
│  Worker · Date · Location                        │
│                                                  │
├──────────────────────────────────────────────────┤
│  Activity  Activity  Activity  Activity          │  ← Beat 4: Quick glance
│  Item      Item      Item      Item              │
└──────────────────────────────────────────────────┘
```

- Beat 1 (Stats): Quick, equal-weight scan
- Beat 2 (Active Job): Large, prominent, gets the most attention
- Beat 3 (Upcoming): Medium importance
- Beat 4 (Activity): Small, quick-scan items

The rhythm is: **Quick → Deep → Medium → Quick**. This matches how the eye naturally works — it starts fast, slows down for important content, then speeds up again.

### Landing Page Rhythm

```
Section 1: Hero — LARGE, dramatic, emotional (slow beat)
Section 2: How It Works — THREE equal cards (medium beat)
Section 3: Categories — GRID of cards (quick beat)
Section 4: Featured Workers — LARGE cards with faces (slow beat)
Section 5: Trust — FOUR equal pillars (medium beat)
Section 6: Stats — HUGE numbers (impact beat)
Section 7: Testimonials — ONE quote at a time (slow beat)
Section 8: CTA Banner — SINGLE large message (final beat)
```

The rhythm alternates between **slow** (emotional, large) and **fast** (informational, compact). This keeps the eye engaged throughout the entire page.

---

## Principle 10: The Invisible Design

The best design is the design **the user doesn't notice.**

When a user navigates HUNAR and everything feels natural — they know where to click, they understand what they're seeing, they never feel confused — that's invisible design. The UI disappears and only the **experience** remains.

**How to achieve invisible design:**

1. **Consistency** — if a teal button means "primary action" on one screen, it means the same thing on every screen. The user never has to re-learn.

2. **Predictability** — if swiping left reveals more options on one card, it works the same way on all cards. The user builds mental models and never breaks them.

3. **Minimal decisions** — each screen should present **one clear choice**, not five. The fewer decisions the user has to make, the faster they move through the flow.

4. **No surprises** — animations should feel natural, not unexpected. A button should respond in 0.2s, not 2s. A page should transition in 0.3s, not 0.05s. The timing should feel "right" — like it was always there.

5. **No friction** — if a user wants to do something, the path to do it should be as short as possible. Every extra tap, every extra scroll, every extra decision is friction. Remove it.

**The Test:** Watch someone use HUNAR without explaining anything. If they can complete the full flow (post job → get offers → hire worker → pay → review) without asking a single question, the design is invisible. That's the goal.

---

# PART 2 — THE HUNAR COLOR SYSTEM (STRICT — DO NOT DEVIATE)

Every color in this system is psychologically chosen. Follow it exactly.

## Color Palette

| Color         | Hex     | Psychological Role             | Where to Use                                                                          |
| ------------- | ------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| Navy          | #123B5D | Trust, Authority, Identity     | Logo, navbar text, headings, important text, professional identity, dashboard numbers |
| Teal          | #0F8B8D | Action, Safety, Progress       | Primary buttons, active states, verified badges, links, booking CTAs, accept actions  |
| Orange        | #F59E0B | Attention, Excitement, Urgency | Star ratings, offer highlights, pending status, emergency accents, attention-grabbers |
| Background    | #F8FAFC | Clean, Open, Breathing         | Main website background — never pure white for backgrounds                            |
| White         | #FFFFFF | Purity, Focus, Simplicity      | Cards, navbar, modals, forms, input fields                                            |
| Dark          | #172033 | Readability, Strength          | Body text                                                                             |
| Gray          | #64748B | Subtlety, Secondary            | Secondary text, placeholders, helper text, timestamps                                 |
| Success Green | #16A34A | Completion, Approval           | Completed jobs, approved states, online indicators, successful payments               |
| Error Red     | #DC2626 | Danger, Rejection              | Cancelled states, errors, delete actions, rejected offers                             |

## Color Psychology Rule — Memorize This

```
NAVY  = "This is HUNAR. This is trustworthy. This is professional."
TEAL  = "Take action now. This is safe. Click here."
ORANGE = "Look here. This is important. Pay attention."
GREEN = "You did it. Success. Complete."
RED   = "Warning. Danger. Something went wrong."
```

## Component-Level Color Application

### Navbar

- Background: **White (#FFFFFF)**
- Logo "HUNAR": **Navy (#123B5D)**
- Nav links: **Dark (#172033)**
- Active link: **Teal (#0F8B8D)** with a small teal underline indicator
- Login button: **Navy outline** — feels professional, not pushy
- Post a Job button: **Teal solid** — the primary action must always be teal
- On scroll: Add a **subtle shadow** (0 2px 8px rgba(0,0,0,0.06)) — creates depth and modernity

### Hero Section

- Background: **#F8FAFC** — clean and open
- Heading: **Navy (#123B5D)**, large, bold
- Subheading: **Gray (#64748B)**, readable, not too small
- Primary CTA ("Post a Job"): **Teal solid** with hover animation (slight scale + shadow)
- Secondary CTA ("Find Professionals"): **White background + Navy border** — less prominent but still visible
- Small highlight text: **Orange (#F59E0B)** — for social proof numbers like "500+ professionals"
- Hero illustration or image should use the **Navy-Teal-Orange** palette

### Category Cards

- Card background: **White**
- Icon container: **Light Teal background (#E6F7F7)**
- Icon: **Teal (#0F8B8D)**
- Category name: **Navy (#123B5D)**
- Description: **Gray (#64748B)**
- Hover state: **Teal border + slight lift (translateY(-4px) + shadow)**
- **DO NOT** give each category a different color — it creates visual chaos. Uniformity = professionalism

### Professional/Worker Cards

- Card: **White**
- Name: **Navy**
- Profession: **Gray**
- Rating stars: **Orange (#F59E0B)** — always orange, never teal for ratings
- Rating number: **Navy**
- Verified badge: **Light teal background + teal text** (#E6F7F7 bg + #0F8B8D text)
- Location icon + text: **Gray**
- Price: **Navy**, bold
- "Book Now" / "View Profile" button: **Teal solid**
- Card hover: **Subtle lift + teal border glow**

### Job Status Badges

| Status      | Background          | Text                  | Icon             |
| ----------- | ------------------- | --------------------- | ---------------- |
| Pending     | Orange bg (#FEF3C7) | Orange text (#D97706) | Clock            |
| Accepted    | Teal bg (#E6F7F7)   | Teal text (#0F8B8D)   | Check            |
| In Progress | Navy bg (#E8EDF2)   | Navy text (#123B5D)   | Gear             |
| Completed   | Green bg (#DCFCE7)  | Green text (#16A34A)  | Checkmark circle |
| Cancelled   | Red bg (#FEE2E2)    | Red text (#DC2626)    | X circle         |

### Reviews & Ratings

- Stars: **Orange (#F59E0B)** — never deviate, gold/orange is universally understood as ratings
- Rating number: **Navy**, bold
- Review text: **Gray**
- Reviewer name: **Dark**

### Dashboard Statistics Cards

| Stat                   | Icon Color | Accent             |
| ---------------------- | ---------- | ------------------ |
| Active Jobs            | Teal       | Teal left border   |
| Pending Offers         | Orange     | Orange left border |
| Completed Jobs         | Green      | Green left border  |
| Total Spent / Earnings | Navy       | Navy left border   |

### Payment Screen

- Total amount: **Navy**, large, bold
- Payment method cards: **White** with border
- Selected method: **Teal border**
- Pay button: **Teal solid** — never orange for payment
- Success state: **Green** with checkmark animation
- Keep this screen **extremely clean** — no competing elements, maximum trust

### Emergency Services

- Accent: **Orange** — stronger usage allowed here
- Icon background: **Light orange (#FEF3C7)**
- Icon: **Orange (#F59E0B)**
- **DO NOT** make the entire page orange — use orange as accent only

### Chat/Messages

- Your messages: **Teal background, white text**
- Other person's messages: **White background, dark text**
- Chat background: **#F8FAFC**
- Send button: **Teal**
- Avoid navy message bubbles — they become visually heavy at scale

### Forms & Inputs

- Labels: **Dark (#172033)**
- Placeholder: **Gray (#64748B)**
- Input border: **Light Gray (#E2E8F0)**
- Focused input: **Teal border (#0F8B8D)** with **light teal ring (#E6F7F7)**
- Error state: **Red border (#DC2626)** with red helper text
- Success state: **Green border (#16A34A)**

---

# PART 3 — STOP-SCROLLING VISUAL DESIGN

## First Impression Rule (0.5 Second Rule)

When a user opens HUNAR, within 0.5 seconds they must feel:

1. **This is professional** (clean layout, good typography, proper spacing)
2. **This is trustworthy** (Navy + Teal palette, verified badges, real numbers)
3. **This is for me** (clear value proposition, obvious next step)

## Hero Section — The Make-or-Break Screen

The hero section must:

- Have a **clear, bold heading** in Navy — no more than 8 words
- A **supporting subheading** in Gray — explain what HUNAR does in one sentence
- A **primary CTA button** in Teal — "Post a Job" or "Find a Professional"
- A **secondary CTA** — less prominent, White + Navy border
- **Social proof numbers** — "500+ Professionals", "10,000+ Jobs Completed", "4.8 Average Rating"
- An **illustration or animated visual** that shows the service concept
- The hero must have **generous padding** — at least 80px top/bottom
- Background must be **#F8FAFC** — never pure white, it's too harsh

### Hero Attention Hierarchy

The hero section is where the **Z-Pattern** or **center-weight pattern** applies. The user's eye must follow this exact path:

```
Step 1 → Eye lands on the HEADING (largest, highest contrast element)
Step 2 → Eye drops to SUBTITLE (smaller, gray — provides context)
Step 3 → Eye jumps to PRIMARY CTA (only teal element — magnetic pull)
Step 4 → Eye notices SOCIAL PROOF (numbers create credibility)
Step 5 → Eye wanders to HERO IMAGE (visual reinforcement)
```

**Why this order matters:**

- If the user sees the CTA before the heading, they don't know what they're clicking
- If the user sees the image before the heading, they might think it's a decorative site, not a service
- If the user sees social proof before the CTA, they might scroll past without acting
- The heading MUST be seen first — it answers "What is this?" in 0.3 seconds

**How to enforce this hierarchy:**

- Heading: **48-56px, weight 800, Navy** — this is the most visually heavy element
- Subheading: **18-20px, weight 400, Gray** — clearly subordinate to heading
- CTA: **Teal button** — the ONLY colored element in the hero section
- Social proof: **Orange numbers + Gray labels** — attention-grabbing but smaller
- Image: **Right side on desktop, below on mobile** — the eye naturally scans left-to-right, so the image comes last in the reading order

### The "Magnetic CTA" Effect

The primary CTA button should feel like it's **pulling the user toward it.** This is achieved through:

1. **Isolation** — no other teal element within 200px of the button
2. **Contrast** — teal on white background creates maximum color contrast
3. **Size** — button should be larger than surrounding text elements (14-16px font, 12-16px padding)
4. **Position** — center of the hero, or left-aligned with the heading (natural reading flow)
5. **Animation** — subtle pulse animation every 3-5 seconds (opacity 1.0 → 0.85 → 1.0, 2s duration) — this creates a subconscious "beating heart" effect that draws the eye
6. **Shadow** — slight drop shadow that intensifies on hover (0 4px 12px rgba(15,139,141,0.25)) — makes the button feel "elevated" above the page

### The "Social Proof Anchor"

Social proof numbers should be positioned **below the CTA but above the fold.** This creates an anchor:

- User sees heading → understands what HUNAR is
- User sees CTA → tempted to click
- User sees social proof → "500+ professionals, 4.8 rating" → trust increases → click likelihood doubles

**The psychology:** The brain needs **two confirmations** before taking action:

1. "This looks legitimate" (heading + design quality)
2. "Other people use this" (social proof numbers)

Both must be visible **without scrolling.** If the social proof is below the fold, the user might leave before seeing it.

### Hero Animation (Enhanced)

- The heading should **fade in from bottom** (0.6s ease)
- The subheading should **fade in 0.2s after** the heading
- The buttons should **fade in 0.2s after** the subheading
- The social proof numbers should **count up from 0** when visible
- The hero image should **fade in + scale from 0.95 to 1** (0.6s ease, 0.3s delay)
- The CTA button should have a **subtle pulse animation** that starts after the stagger sequence completes (3s delay, then repeats every 4s)
- This staggered animation creates a **cinematic entrance** — the user feels like the page is "welcoming" them

## Typography System

| Element         | Font            | Size    | Weight | Color       | Line Height |
| --------------- | --------------- | ------- | ------ | ----------- | ----------- |
| H1 (Hero)       | Inter / Poppins | 48-56px | 800    | Navy        | 1.1         |
| H2 (Section)    | Inter / Poppins | 32-36px | 700    | Navy        | 1.2         |
| H3 (Card title) | Inter / Poppins | 20-24px | 600    | Navy        | 1.3         |
| Body            | Inter           | 16px    | 400    | Dark        | 1.6         |
| Small / Label   | Inter           | 14px    | 500    | Gray        | 1.4         |
| Badge           | Inter           | 12px    | 600    | Teal/Orange | 1.0         |

**Rules:**

- Never use more than **2 font families** — one for headings (bold), one for body (clean)
- Font sizes must create **clear hierarchy** — the user's eye must naturally flow from heading → subheading → body → CTA
- Line height of 1.5-1.6 for body text — **readability is non-negotiable**
- Letter spacing: slightly tighter for headings (-0.02em), normal for body

## Spacing & Layout Rules

- **8px grid system** — all spacing must be multiples of 8 (8, 16, 24, 32, 48, 64, 80)
- Section padding: **64-80px vertical**, **24-32px horizontal**
- Card padding: **24px**
- Between cards: **16-24px**
- Max content width: **1200px** — centered
- **Never** cram elements together — white space is a feature, not wasted space
- The page must **breathe** — when in doubt, add more space

## Card Design System

All cards must follow this structure:

```
┌──────────────────────────┐
│  [Icon/Avatar]  [Badge]  │
│                          │
│  Title (Navy, 600)       │
│  Subtitle (Gray, 400)    │
│                          │
│  ─── divider ───         │
│                          │
│  Stats / Details         │
│                          │
│  [CTA Button - Teal]     │
└──────────────────────────┘
```

- Background: **White**
- Border: **1px solid #E2E8F0**
- Border radius: **12px** (modern, friendly — not sharp, not too round)
- Shadow (default): **none** or very subtle (0 1px 3px rgba(0,0,0,0.04))
- Shadow (hover): **0 8px 24px rgba(0,0,0,0.08)** — creates depth on interaction
- Transition: **all 0.3s ease** — smooth hover states
- Cards should **lift slightly** on hover (translateY(-2px) to -4px)

### Card Attention Architecture

Every card must have an **internal hierarchy** — not all elements inside a card are equal. The eye should enter the card at a specific point and exit at the CTA.

**Worker Card Internal Flow:**

```
Eye enters → FACE (largest element, human connection)
          → NAME (Navy, bold — confirms identity)
          → RATING (Orange — stands out against Navy/Gray)
          → VERIFIED BADGE (Teal — trust signal)
          → LOCATION (Gray — context)
          → PRICE (Navy, bold — decision factor)
          → CTA BUTTON (Teal — the exit point, the action)
```

**Job Card Internal Flow:**

```
Eye enters → STATUS BADGE (colored — tells you the state immediately)
          → JOB TITLE (Navy, bold — what is this about)
          → PROBLEM DESCRIPTION (Gray — context)
          → WORKER INFO (if assigned — who's doing it)
          → TIME/DATE (Gray — when is it happening)
          → CTA BUTTON (Teal — the action)
```

**Category Card Internal Flow:**

```
Eye enters → ICON (Teal, in light teal circle — visual anchor)
          → CATEGORY NAME (Navy — what service is this)
          → DESCRIPTION (Gray — what does this category include)
          → HOVER STATE (lift + teal border — confirms it's interactive)
```

### The "One Accent" Rule for Cards

Each card should have **exactly one accent color element** that draws the eye. This creates a focal point within the card.

- Worker card: **Orange rating stars** — the single color accent
- Job card: **Colored status badge** — the single color accent
- Category card: **Teal icon** — the single color accent
- Stat card: **Colored left border** — the single color accent

**If a card has multiple colored elements, the eye doesn't know where to look first.** One accent = clear hierarchy.

### Card Hover Psychology

When a user hovers over a card, the brain expects **feedback that confirms interactivity.** The hover effect should:

1. **Lift the card** (translateY(-4px)) — feels like it's "raising its hand" to be noticed
2. **Grow the shadow** — creates depth, the card feels "above" the page
3. **Shift the border** to light teal — subtle color change signals "this is active"
4. **Never change the card's internal content** on hover — the user should recognize the same card, just elevated

**The psychology:** The hover effect is a **micro-reward.** The user's brain interprets the lift as "I can interact with this" and the shadow as "this is real, it has depth." This makes the interface feel alive.

## Button Design System

### Primary Button (Teal)

```css
background: #0F8B8D
color: white
padding: 12px 28px
border-radius: 8px
font-weight: 600
font-size: 15px
transition: all 0.3s ease
hover: background #0D7A7C, transform translateY(-1px), box-shadow 0 4px 12px rgba(15,139,141,0.3)
active: transform translateY(0), box-shadow none
```

### Secondary Button (White + Navy)

```css
background: white
color: #123B5D
border: 2px solid #123B5D
padding: 12px 28px
border-radius: 8px
font-weight: 600
hover: background #123B5D, color white
```

### Ghost Button

```css
background: transparent
color: #0F8B8D
hover: background #E6F7F7
```

**Button Rules:**

- Only **ONE primary button** per screen — too many teal buttons dilute the action
- Primary CTA must be the **most visually prominent** element on the screen
- Button text must be **action-oriented**: "Post a Job" not "Submit", "Find Professionals" not "Search", "Book Now" not "Continue"
- Button padding must be generous — **minimum 12px vertical, 24px horizontal**
- Touch targets on mobile: **minimum 48px height**

## Icon System

- Use **one icon family** throughout (Lucide, Phosphor, or Heroicons)
- Icon size: **20px** for inline, **24px** for navigation, **32px** for feature highlights
- Icon color must match the context:
  - Teal icons for actions
  - Navy icons for identity/information
  - Orange icons for alerts/ratings
  - Gray icons for secondary information
- Icons must have **consistent stroke width** (1.5-2px)

---

# PART 4 — ANIMATION & MICRO-INTERACTIONS

## The Psychology of Animation

Animation is NOT decoration. Animation is **communication**. It tells the user:

- "Something happened" (feedback)
- "This is ready" (completion)
- "Look here" (attention)
- "You're moving forward" (progress)

## Required Animations

### Page Load Sequence

1. **Navbar** slides down from top (0.3s ease)
2. **Hero heading** fades in + slides up (0.5s ease, 0.1s delay)
3. **Hero subheading** fades in + slides up (0.5s ease, 0.3s delay)
4. **Hero buttons** fade in (0.4s ease, 0.5s delay)
5. **Hero image/illustration** fades in + scales from 0.95 to 1 (0.6s ease, 0.3s delay)
6. **Social proof numbers** count up from 0 to final value (1s, 0.7s delay)
7. **Category cards** stagger fade in from bottom (each 0.1s apart)

This creates a **cinematic, premium feel** — the user perceives the product as high-quality within the first 2 seconds.

### Button Interactions

- **Hover**: translateY(-1px) + box-shadow grows + background darkens slightly (0.3s)
- **Click**: translateY(0) + shadow reduces + slight scale(0.98) (0.1s)
- **Success**: Button text changes to checkmark icon + green background (0.3s)

### Card Interactions

- **Hover**: translateY(-4px) + shadow grows + border changes to light teal (0.3s)
- **Click**: Quick scale(0.98) then back (0.2s)

### Form Interactions

- **Input focus**: Border transitions from gray to teal (0.2s) + subtle glow ring appears
- **Input error**: Border transitions to red + shake animation (0.4s)
- **Input success**: Border transitions to green + small checkmark appears (0.3s)
- **Label**: Floats up when input is focused (0.2s)

### Notification Toast

- **Entry**: Slides in from top-right + fades in (0.4s ease)
- **Exit**: Slides out to right + fades out (0.3s ease)
- **Types**: Success (green accent), Error (red accent), Info (teal accent), Warning (orange accent)

### Job Status Transitions

When a job status changes:

1. Old badge **fades out** (0.2s)
2. Brief **pulse animation** on the status area (0.3s)
3. New badge **fades in + scales from 0.9 to 1** (0.3s)
4. A subtle **toast notification** confirms the change

### Offer Arrival Animation

When a new worker offer arrives:

1. The offer card **slides in from the right** (0.4s ease)
2. The **offer count** on the job page **increments with animation** (number scales up briefly)
3. A **subtle sound cue** (optional, can be a soft "ding")
4. The card has a **brief teal glow** that fades after 1 second

### Dashboard Number Animation

When the dashboard loads, all stat numbers **count up from 0**:

```
Active Jobs:     0 → 3  (0.8s)
Pending Offers:  0 → 5  (0.8s, 0.1s delay)
Completed Jobs:  0 → 47 (1.0s, 0.2s delay)
Total Spent:     0 → 12,450 (1.2s, 0.3s delay)
```

This creates a sense of **momentum and accomplishment**.

### Progress Bar (Job Creation)

- Each step completion triggers a **smooth fill animation** on the progress bar
- The bar color transitions from **Teal** (completed steps) to **Gray** (upcoming)
- Step numbers **pulse briefly** when completed
- A **confetti burst** (subtle, small particles) on final step completion

### Scroll Animations

- Content sections **fade in + slide up** when they enter the viewport (0.6s ease, triggered once)
- Category cards **stagger in** from bottom (0.1s apart)
- Stats sections **count up** when visible
- **DO NOT** animate everything — only the first appearance of each section. Repeated scroll animation is annoying.

## Animation Timing Guidelines

| Animation Type                   | Duration              | Easing      |
| -------------------------------- | --------------------- | ----------- |
| Micro-interaction (hover, click) | 0.2-0.3s              | ease        |
| Page transition                  | 0.3-0.4s              | ease-in-out |
| Element entrance                 | 0.4-0.6s              | ease-out    |
| Number counter                   | 0.8-1.2s              | ease-out    |
| Modal/popup                      | 0.3s                  | ease        |
| Toast notification               | 0.4s entry, 0.3s exit | ease        |
| Success celebration              | 0.6-0.8s              | ease        |

**Golden Rule**: If an animation makes the user wait, it's too slow. If an animation is so fast the user misses it, it's too fast. The sweet spot is **0.3-0.5s** for most interactions.

---

# PART 5 — LANDING PAGE DESIGN (STOP-SCROLLING)

## Section 1: Hero

- **Navy heading** (48-56px): "Find the Right Professional for Your Job"
- **Gray subheading** (18-20px): "Trusted workers for plumbing, electrical, AC repair and more."
- **Teal CTA**: "Post a Job"
- **White + Navy CTA**: "Find Professionals"
- **Social proof bar**: "500+ Professionals | 10,000+ Jobs | 4.8 Rating" with animated counters
- **Background**: #F8FAFC
- **Visual**: Illustration or photo showing a professional at work, positioned right side

## Section 2: How It Works (3 Steps)

- **Heading**: "How HUNAR Works" (Navy)
- **Three step cards** in a row:
  1. Icon (Teal) + "Post Your Job" + "Describe your problem in 30 seconds"
  2. Icon (Teal) + "Get Offers" + "Nearby professionals send you offers"
  3. Icon (Teal) + "Get It Fixed" + "Choose a pro, track the work, pay securely"
- **Connecting lines** between steps (teal, animated dash)
- Each card **stagger animates** on scroll

## Section 3: Popular Categories

- **Heading**: "Popular Services" (Navy)
- **Category cards grid** (3 columns on desktop, 2 on mobile):
  - Electrician, Plumber, Carpenter, AC Technician, Painter, Mechanic
  - Each card: White bg, Light Teal icon bg, Teal icon, Navy name, Gray description
  - Hover: lift + teal border
- **"View All Services"** link in Teal at bottom

## Section 4: Featured Professionals

- **Heading**: "Top-Rated Professionals" (Navy)
- **Horizontal scrollable cards** or grid:
  - Worker photo, name (Navy), profession (Gray), rating (Orange stars), verified badge (Teal), completed jobs, location
  - "View Profile" button (Teal)
- Show **4-6 workers** in the visible area
- **Subtle auto-scroll** on desktop (stops on hover) — creates "living" feel

## Section 5: Trust & Safety

- **Heading**: "Why Trust HUNAR?" (Navy)
- **Four trust pillars** (icon + text):
  1. ✓ Verified Professionals — "Every worker is background-checked"
  2. ⭐ Real Reviews — "Authentic ratings from real customers"
  3. 💰 Transparent Pricing — "No hidden charges, negotiate freely"
  4. 🔒 Secure Payments — "Pay only after job completion"

## Section 6: Stats Bar

- **Dark Navy background** (#172033) or **Teal background** (#0F8B8D)
- **Four large animated numbers**:
  - "500+" Professionals
  - "10,000+" Jobs Completed
  - "4.8" Average Rating
  - "50,000+" Happy Customers
- Numbers **count up** when section enters viewport

## Section 7: Testimonials

- **Heading**: "What Our Customers Say" (Navy)
- **Carousel of 3-4 testimonials**:
  - Quote text (Gray, italic)
  - Customer name (Navy)
  - Customer location (Gray)
  - Rating (Orange stars)
- Auto-rotating with manual dots

## Section 8: CTA Banner

- **Teal background** (#0F8B8D)
- **White text**: "Need a Professional? Post Your Job Now."
- **White button**: "Post a Job Now"
- **Subtle pattern** or gradient overlay for visual depth

## Section 9: Footer

- **Navy background** (#123B5D)
- **White text** links
- Logo, about, services, support, legal, social icons
- Clean, organized, not overwhelming

---

# PART 6 — DASHBOARD DESIGN

## The Dashboard Attention Principle

The dashboard is the **most-visited screen** in HUNAR. Users come here multiple times a day. It must feel:

- **Immediately useful** — the most important thing is visible in 0.5 seconds
- **Never overwhelming** — if it feels cluttered, the user will stop coming
- **Alive** — numbers, badges, and statuses should feel current and real

**The Dashboard's One Job:** Answer the user's most pressing question **within 0.5 seconds.**

- Customer's question: "What needs my attention right now?"
- Worker's question: "What jobs can I take right now?"

Everything on the dashboard must serve this question. If it doesn't, remove it.

### Dashboard Focal Point System

The dashboard must have a **clear visual focal point** — one area that gets the eye first.

**Customer Dashboard Focal Point: The "Action Required" Card**

```
┌─────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────┐  │
│  │  ⚠️  ACTION REQUIRED                         │  │  ← Focal point (Orange accent)
│  │                                               │  │
│  │  You have 3 pending offers for your           │  │
│  │  AC Repair job.                               │  │
│  │                                               │  │
│  │  [ View Offers → ]                            │  │  ← CTA (Teal)
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Stats: [Active: 3] [Pending: 5] [Done: 47] [₹: 12k]│
│                                                     │
│  Active Jobs:                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ Job 1   │ │ Job 2   │ │ Job 3   │              │
│  └─────────┘ └─────────┘ └─────────┘              │
└─────────────────────────────────────────────────────┘
```

The "Action Required" card is the **hero of the dashboard.** It's:

- The first thing the eye sees (top of content area, full width)
- The only element with an **orange or teal accent** that's large
- The only element with a **CTA button**
- Everything else is secondary

**Worker Dashboard Focal Point: The "New Jobs Near You" Card**

```
┌─────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────┐  │
│  │  🔥 NEW JOBS NEAR YOU                         │  │  ← Focal point (Orange accent)
│  │                                               │  │
│  │  5 new jobs posted in the last hour           │  │
│  │  within 3 km of your location.                │  │
│  │                                               │  │
│  │  [ Browse Jobs → ]                            │  │  ← CTA (Teal)
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Stats: [Available: 12] [Pending: 3] [Done: 312] [₹: 45k]│
│                                                     │
│  Nearby Jobs:                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ Job 1   │ │ Job 2   │ │ Job 3   │              │
│  └─────────┘ └─────────┘ └─────────┘              │
└─────────────────────────────────────────────────────┘
```

### Dashboard Eye Flow (F-Pattern)

The dashboard follows the **F-Pattern** because it's information-dense:

```
Step 1 → Eye scans the HERO CARD (top, full width — "Action Required" / "New Jobs")
Step 2 → Eye drops to STATS ROW (scans left-to-right: Active → Pending → Completed → Total)
Step 3 → Eye drops to ACTIVE JOBS section (scans job cards left-to-right)
Step 4 → Eye scans DOWN the job list (reads each card's details)
```

**This means:**

- The hero card must be at the **very top** of the content area
- Stats must be **directly below** the hero card
- Active jobs must be **below the stats**
- Secondary info (upcoming visits, activity feed) must be **below active jobs**

**Never put secondary information above the hero card.** The user's most pressing question must be answered first.

### Dashboard Spacing for Attention

The dashboard uses **tighter spacing** than the landing page because it's a **utility screen, not a marketing screen.** Users want to scan information quickly, not admire the design.

- Stats row gap: **12-16px** (tighter than 24px — these are small cards meant for quick scanning)
- Hero card to stats: **24px** (enough separation to distinguish sections)
- Stats to job cards: **24px**
- Job card gap: **12px** (tighter — users scan these quickly)
- Section headings: **24px top margin, 12px bottom margin**

**The principle:** On utility screens, **information density is more important than aesthetics.** The user is here to DO something, not admire the design.

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Active Jobs │ │  Pending    │ │ Completed   │ │ Total Spent │
│     03      │ │   Offers    │ │    Jobs     │ │  Rs. 12,450 │
│             │ │     05      │ │     47      │ │             │
│  [Teal      │ │  [Orange    │ │  [Green     │ │  [Navy      │
│   accent]   │ │   accent]   │ │   accent]   │ │   accent]   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

- Numbers **count up** on load
- Left border accent in respective color
- **White card, subtle shadow**

### Active Jobs Section

- **Heading**: "Active Jobs" (Navy)
- **Job cards** showing:
  - Job title (Navy)
  - Status badge (colored per status system)
  - Worker name + avatar (if assigned)
  - Last updated time (Gray)
  - "View Details" button (Teal ghost)
- **Empty state** if no active jobs: illustration + "No active jobs yet" + "Post Your First Job" CTA

### Upcoming Visits

- **Timeline-style cards**:
  - Worker avatar + name
  - Date + time (prominent)
  - Location
  - Status badge
- **Countdown feel** — "Tomorrow at 4:00 PM" or "In 2 hours"

### Recent Activity Feed

- **Vertical timeline** with dots and lines
- Each event: icon + description + timestamp
- Events: "Job posted", "3 offers received", "Worker selected", etc.

## Worker Dashboard

### Stats Row

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Available  │ │   Pending   │ │  Completed  │ │  Earnings   │
│    Jobs     │ │  Requests   │ │    Jobs     │ │ Rs. 45,200  │
│     12      │ │     03      │ │    312      │ │             │
│  [Teal]     │ │  [Orange]   │ │  [Green]    │ │  [Navy]     │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### Nearby Jobs Feed

- **Cards** with:
  - Category icon + name
  - Problem title (Navy)
  - Location + distance
  - Posted time ("2 min ago")
  - Preferred visit time
  - "Send Offer" button (Teal)
- **Distance indicator** with icon — "1.2 km away"
- Cards should feel **urgent** — recent jobs at top, with "NEW" badge for jobs posted within last hour

---

# PART 7 — JOB CREATION FLOW

## Multi-Step Form Design

### Progress Bar

- **Fixed at top** of the form area
- Shows: Step 1 of 6 → Step 2 of 6 → etc.
- **Teal fill** for completed steps, **Gray** for upcoming
- Step labels visible on desktop, numbers on mobile
- **Smooth animation** when transitioning between steps

### Step Transitions

- Current step **slides out to left** (0.3s)
- New step **slides in from right** (0.3s)
- Creates a sense of **forward momentum**

### Step 1: Service Category

- **Heading**: "What do you need help with?"
- **Grid of category cards** (2-3 columns)
- Each card: Icon + Category name
- **Selected state**: Teal border + light teal background + checkmark
- **Single selection** only

### Step 2: Problem Description

- **Heading**: "Describe your problem"
- **Problem title input**: Large, prominent
- **Description textarea**: Multi-line, with character count
- **Placeholder text** that guides: "Example: AC is running but not cooling properly since yesterday..."
- **Helper text** in Gray: "The more detail you provide, the better offers you'll receive"

### Step 3: Media Upload

- **Heading**: "Add photos or voice description"
- **Image upload zone**: Dashed border, Teal icon, "Drag photos here or click to upload"
- **Voice recorder button**: Large circular Teal button with microphone icon
  - Recording state: Pulsing red dot + timer
  - Recorded state: Audio waveform preview + play/delete buttons
- **Uploaded images grid**: Thumbnail previews with delete (X) buttons

### Step 4: Location

- **Heading**: "Where do you need the service?"
- **Map integration** or **location input** with autocomplete
- **Current location button**: Teal, with GPS icon
- **Saved locations** (if applicable)
- **Selected location display**: Address text + small map preview

### Step 5: Preferred Visit Time

- **Heading**: "When would you like the visit?"
- **Date picker**: Calendar-style, today highlighted
- **Time slot picker**: Grid of time slots (9 AM - 6 PM)
- **"ASAP" option**: Orange accent — "Get offers faster"

### Step 6: Review & Submit

- **Heading**: "Review your job posting"
- **Summary card** showing all entered information:
  - Category with icon
  - Problem title + description
  - Uploaded images (thumbnails)
  - Voice recording (play button)
  - Location
  - Preferred time
- **Edit buttons** next to each section (Teal ghost)
- **"Post Job" button**: Teal, large, prominent
- **Subtle animation** when button is clicked — loading spinner → success celebration

### Success State

- **Full-screen overlay** (not just a toast)
- **Large animated checkmark** (green, drawing animation)
- **Heading**: "Job Posted Successfully!"
- **Subheading**: "Your job is now visible to X nearby professionals"
- **Live counter**: "0 professionals have viewed your job" (increments in real-time)
- **CTA**: "View Job Status" (Teal) + "Back to Dashboard" (Navy ghost)

---

# PART 8 — WORKER PROFILE DESIGN

## Profile Header

```
┌──────────────────────────────────────────────────┐
│  [Large Avatar]   Ali Khan                       │
│                   Electrician                     │
│                   ✓ Verified                     │
│                   ⭐ 4.9 (127 reviews)           │
│                   📍 Peshawar                    │
│                   Member since Jan 2024          │
│                                                  │
│  [  Message  ]  [  Book Now  ]                   │
└──────────────────────────────────────────────────┘
```

- Avatar: **80-100px** circle
- Name: **Navy, 24px, 600**
- Profession: **Gray, 16px**
- Verified badge: **Teal shield icon + "Verified" text** on #E6F7F7 background
- Rating: **Orange stars** + rating number (Navy, bold)
- Location: **Gray with map pin icon**
- Action buttons: Message (Navy outline) + Book Now (Teal solid)

## Profile Sections

- **About**: Short bio (Gray text)
- **Skills**: Tag pills (Teal background, white text)
- **Experience**: Years + job count
- **Portfolio**: Image grid (3 columns, hover to enlarge)
- **Reviews**: Star distribution chart + individual reviews
- **Service Area**: Map showing coverage area
- **Availability**: Weekly schedule display

---

# PART 9 — NEGOTIATION UI

## Visit Charge Negotiation

### Layout

Split-screen feel (or stacked on mobile):

- **Left/Top**: Worker's offer card
- **Right/Bottom**: Customer's response area

### Worker Offer Card

```
┌─────────────────────────┐
│  Visit Charge Offer     │
│                         │
│  Ali Khan               │
│  ⭐ 4.9 · ✓ Verified   │
│                         │
│  Visit Charge: Rs. 300  │
│  (highlighted in Orange)│
│                         │
│  [Accept] [Counter]     │
└─────────────────────────┘
```

### Negotiation Chat

- **Timeline style** with alternating bubbles:
  - Worker: "My visit charge is Rs. 300" (White bubble, left)
  - Customer: "Can you do Rs. 275?" (Teal bubble, right)
  - Worker: "How about Rs. 290?" (White bubble, left)
  - Customer: "Deal at Rs. 285" (Teal bubble, right)
  - **AGREED** badge (Green) — "Visit charge agreed: Rs. 285"

### Counter Offer Input

- **Amount input**: Large, prominent, with Rs. prefix
- **"Send Counter Offer"** button: Teal
- **"Accept Original"** button: Navy outline
- **Quick amount suggestions**: "Rs. 250", "Rs. 275", "Rs. 300" — clickable pills

---

# PART 10 — MOBILE-FIRST RESPONSIVE DESIGN

## Breakpoints

- Mobile: 0-640px
- Tablet: 641-1024px
- Desktop: 1025px+

## Mobile Navigation

- **Bottom tab bar** (5 tabs max):
  - Home (House icon)
  - Jobs (Briefcase icon)
  - Post Job (Plus icon — Teal, elevated/larger)
  - Messages (Chat icon)
  - Profile (User icon)
- **Post Job button** must be the **most prominent** in the tab bar — larger, Teal, elevated

## Mobile-Specific Adjustments

- Hero heading: **32-36px** (not 48px)
- Section padding: **40px vertical** (not 80px)
- Cards: **Full width** with 16px horizontal padding
- Category grid: **2 columns**
- Worker cards: **Full width, stacked**
- Progress bar: **Compact, numbers only** (not labels)
- Forms: **Full width inputs**, larger touch targets (48px minimum)
- Modals: **Full screen** on mobile (not centered popups)

## Touch Interactions

- **Swipeable cards** for worker offers
- **Pull to refresh** on job feeds
- **Long press** for context menus (optional)
- **Tap feedback**: Brief scale(0.98) + ripple effect

---

# PART 11 — EMPTY STATES, LOADING STATES, ERROR STATES

## Empty States

Every empty state must have:

1. A **friendly illustration** (not just text)
2. A **helpful message** in Gray
3. A **clear CTA** in Teal

Examples:

- **No jobs**: "No active jobs yet" + illustration of empty clipboard + "Post Your First Job" button
- **No offers**: "Waiting for professionals to respond" + illustration of clock + "This usually takes 10-15 minutes"
- **No notifications**: "You're all caught up" + illustration of checkmark + nothing else
- **No reviews**: "Reviews appear after completing jobs" + illustration of stars

## Loading States

- **Skeleton screens** — not spinners. Show gray placeholder blocks that match the layout of the content
- **Pulse animation** on skeleton blocks
- **Never show a spinning loader** for more than 2 seconds — show a progress indication instead
- **Page transitions**: Brief loading bar at top (Teal, thin, animated)

## Error States

- **Inline errors**: Red text below the input field, red border on input
- **Toast errors**: Slide in from top-right, red accent, auto-dismiss after 5 seconds
- **Page errors**: Center-aligned, friendly message, illustration, "Try Again" button (Teal)
- **Network errors**: "Something went wrong" + "Check your connection and try again" + retry button
- **Never show technical error messages** to users — always human-friendly text

---

# PART 12 — PSYCHOLOGICAL TRIGGERS THROUGHOUT THE PLATFORM

## Social Proof Triggers

- "247 professionals online right now" — live counter in navbar
- "Ali completed 312 jobs this month" — on worker cards
- "4.9 stars from 127 reviews" — on worker profiles
- "Trusted by 50,000+ customers" — on landing page
- Worker photos with real faces — not stock images

## Loss Aversion Triggers

- "3 workers are viewing this job right now" — on active job cards
- "Job posted 2 minutes ago — 5 professionals already viewed it" — on job status
- "Last offer received 5 minutes ago" — creates urgency

## Commitment & Consistency

- Multi-step forms that show progress — users feel invested
- "Your profile is 65% complete" — drives completion
- "You're 1 step away from posting your first job" — near-completion motivation

## reciprocity

- "Free inspection" highlighted in Teal — give before asking
- "No booking fee" badge on worker cards
- "Free estimate" on worker profiles

## Anchoring

- Show **"Rs. 1,500"** crossed out next to **"Rs. 1,000"** on worker cards (if applicable)
- Show **"Average visit charge: Rs. 300"** before showing a specific worker's charge
- Show **"Premium workers start at Rs. 500"** to set a reference point

---

# PART 13 — TECHNICAL IMPLEMENTATION RULES

## Technology Stack

- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL + PostGIS
- **Real-time**: Socket.IO
- **Animations**: Framer Motion (React) or CSS animations
- **Icons**: Lucide React or Phosphor Icons (one family only)
- **Fonts**: Inter (body) + Poppins (headings) from Google Fonts

## Tailwind Configuration

```javascript
// Extend the Tailwind config with HUNAR colors
colors: {
  hunar: {
    navy: '#123B5D',
    teal: '#0F8B8D',
    'teal-light': '#E6F7F7',
    orange: '#F59E0B',
    'orange-light': '#FEF3C7',
    dark: '#172033',
    gray: '#64748B',
    background: '#F8FAFC',
    success: '#16A34A',
    'success-light': '#DCFCE7',
    error: '#DC2626',
    'error-light': '#FEE2E2',
  }
}
```

## Animation Library Rules

- Use **Framer Motion** for complex page transitions and scroll animations
- Use **CSS transitions** for simple hover states and micro-interactions
- Use **CSS keyframes** for loading animations and repetitive animations
- **Never use JavaScript for simple opacity/transform animations** — CSS is smoother

## Performance Rules

- **Lazy load** all images and below-the-fold content
- **Preload** hero images and fonts
- **Optimize** all images to WebP format
- **Minimize** initial JavaScript bundle
- **Use Next.js Image component** for automatic optimization
- **Target**: Lighthouse score > 90 on all metrics

---

# PART 14 — ACCESSIBILITY

- **Color contrast**: All text must meet WCAG AA standard (4.5:1 for normal text, 3:1 for large text)
- **Focus states**: All interactive elements must have visible focus rings (Teal outline)
- **Alt text**: All images must have descriptive alt text
- **Keyboard navigation**: All flows must be navigable with keyboard only
- **Screen reader labels**: All buttons and inputs must have proper aria-labels
- **Font size**: Minimum 14px for body text, 12px for helper text
- **Touch targets**: Minimum 48px x 48px for all interactive elements

---

# PART 15 — FINAL DESIGN CHECKLIST

Before any screen is considered complete, verify:

## Color Compliance

- [ ] Navy is used for trust elements (headings, identity, important text)
- [ ] Teal is used for actions (buttons, CTAs, active states, verified badges)
- [ ] Orange is used for attention (ratings, offers, pending, highlights)
- [ ] Green is used for success only (completed, approved, online)
- [ ] Red is used for danger only (errors, cancelled, rejected)
- [ ] White background is NEVER used for the main page background (#F8FAFC instead)

## Visual Hierarchy & Attention

- [ ] Every screen has ONE hero element that is the most visually prominent
- [ ] The hero element is the largest, most contrasting, or most colorful element
- [ ] No more than ONE accent color per card/component
- [ ] The CTA button is the only teal element in its visual vicinity
- [ ] White space around the primary element is larger than white space around secondary elements
- [ ] The screen passes the Glance Test (understood in 0.5 seconds)
- [ ] The eye flow path is clear (F-pattern for info-heavy, Z-pattern for visual screens)
- [ ] On mobile, primary CTAs are in the thumb zone (center-bottom)
- [ ] No competing focal points — the eye knows exactly where to go first

## Typography & Readability

- [ ] Typography hierarchy is clear (H1 > H2 > H3 > Body > Small)
- [ ] Font sizes create obvious visual weight differences
- [ ] Line height is 1.5-1.6 for body text
- [ ] Letter spacing is slightly tighter for headings (-0.02em)

## Spacing & Layout

- [ ] Spacing follows the 8px grid
- [ ] Hero section has at least 80px vertical padding
- [ ] Cards have consistent border-radius (12px), padding (24px), and shadow
- [ ] Element gaps create clear visual grouping
- [ ] No cramming — when in doubt, add more space

## Interaction Design

- [ ] Buttons have proper hover/active states
- [ ] Only ONE primary teal button per screen
- [ ] Card hover creates lift + shadow (translateY(-4px))
- [ ] All interactive elements provide visual feedback
- [ ] Touch targets are at least 48px
- [ ] 16px minimum gap between tappable elements

## Animation & Micro-interaction

- [ ] Animations are smooth (0.2-0.5s), not jarring
- [ ] Staggered entrance animations on page load
- [ ] Dashboard numbers count up on load
- [ ] CTA has subtle pulse animation (optional but recommended)
- [ ] Status transitions have fade-out → pulse → fade-in sequence

## Content & Copy

- [ ] Button text is action-oriented ("Post My Job" not "Submit")
- [ ] Helper text explains benefits, not just instructions
- [ ] Error messages tell users how to fix the problem
- [ ] Social proof is visible on key screens without scrolling

## State Design

- [ ] Empty states have illustrations and CTAs
- [ ] Loading states use skeletons, not spinners
- [ ] Error states are human-friendly
- [ ] Success states feel celebratory (animation, not just text)

## Mobile

- [ ] Mobile layout works at 375px width
- [ ] Bottom tab bar has max 5 items
- [ ] Primary action is in thumb zone
- [ ] Modals are full-screen on mobile
- [ ] Forms have full-width inputs with large touch targets

## Emotional Design

- [ ] Worker photos show real faces with warm lighting
- [ ] The landing page hero tells the HUNAR story without text
- [ ] The payment screen feels safe (minimal, clean, no competing elements)
- [ ] Success screens feel rewarding (celebration animation)
- [ ] The overall experience feels invisible — the user never has to think about the UI

---

# PART 16 — SCREEN-LEVEL ATTENTION ARCHITECTURE

## Every Screen Has a Job

Before designing any screen, write this sentence:

**"On this screen, the user should **\_\_\_\_** within 0.5 seconds."**

- Landing page: "...understand that HUNAR connects them with nearby professionals"
- Dashboard: "...see what needs their attention right now"
- Worker profile: "...trust this person and feel confident booking them"
- Job creation: "...know exactly what step they're on and what to do next"
- Negotiation: "...see the current offer and know their options"
- Payment: "...feel safe completing the transaction"
- Review: "...feel satisfied leaving feedback"

**If you can't fill in that blank, you don't understand the screen yet. Don't design it until you do.**

## The 3-Second Scroll Test

Every screen must pass this test:

1. **0-0.5 seconds**: User sees the **hero element** — knows what the screen is about
2. **0.5-1.5 seconds**: User sees the **primary action** — knows what to do
3. **1.5-3 seconds**: User sees **supporting context** — feels confident taking action

If the user needs more than 3 seconds to understand the screen and know what to do, the design is too complex.

**Apply this to every HUNAR screen:**

### Landing Page

- 0-0.5s: Hero heading → "Find the Right Professional"
- 0.5-1.5s: Teal CTA → "Post a Job" (the action)
- 1.5-3s: Social proof + categories + trust (the confidence builders)

### Worker Profile

- 0-0.5s: Worker's face → "This is a real person"
- 0.5-1.5s: Rating + verified badge + "Book Now" → "This person is good and I can hire them"
- 1.5-3s: Reviews + portfolio + skills → "This person has done good work before"

### Job Creation

- 0-0.5s: Progress bar → "I'm on step 2 of 6"
- 0.5-1.5s: Form heading → "Describe your problem"
- 1.5-3s: Input field + helper text → "I need to type what's wrong"

### Negotiation Screen

- 0-0.5s: Current offer amount → "They want Rs. 300"
- 0.5-1.5s: Accept/Counter buttons → "I can accept or negotiate"
- 1.5-3s: Chat history → "We've been going back and forth"

## The "One Glance" Rule

Every screen should communicate its purpose **in a single glance** — without reading any text.

**How to achieve this:**

- **Icon + color** communicates meaning faster than text
  - Orange badge = something needs attention
  - Green badge = success/completed
  - Teal button = take action
  - Gray text = secondary information
- **Layout pattern** communicates structure
  - Full-width card at top = most important thing
  - Grid of equal cards = multiple options
  - Timeline = sequential process
  - Split screen = comparison or dual context

**The test:** Squint your eyes until the screen is blurry. You should still be able to tell:

1. Where the most important element is (it should be the biggest/darkest/most colorful)
2. What action to take (the teal button should still be visible)
3. Whether something needs attention (colored badges should still pop)

If the blurry version of the screen looks like a uniform gray blob, the hierarchy is too weak.

## Screen Density Matrix

Not all screens should have the same information density. Some screens should be **sparse and emotional**, others should be **dense and functional.**

| Screen Type         | Density     | Purpose                               | Example                             |
| ------------------- | ----------- | ------------------------------------- | ----------------------------------- |
| Marketing (Landing) | LOW         | Emotion, trust, conversion            | Hero + 2 CTAs + social proof        |
| Onboarding          | LOW         | Reduce anxiety, guide step-by-step    | One question per screen             |
| Dashboard           | MEDIUM-HIGH | Quick scan, action-oriented           | Stats + cards + feeds               |
| Job Creation        | LOW-MEDIUM  | Focus, no distractions                | One form step at a time             |
| Worker Profile      | MEDIUM      | Trust building, information gathering | Photo + stats + portfolio + reviews |
| Negotiation         | LOW         | Focus on the deal, no clutter         | Current offer + 2 buttons           |
| Payment             | VERY LOW    | Maximum trust, zero distraction       | Amount + method + pay button        |
| Job Details/History | MEDIUM-HIGH | Timeline + context + actions          | Status timeline + details + CTA     |

**The principle:** Marketing screens are **wide open** — they need to create emotion. Utility screens are **denser** — they need to present information efficiently. Payment screens are **minimal** — they need to build trust through simplicity.

## The "Breathing Room" Gradient

As the user moves deeper into HUNAR, the screens should gradually become **more focused and less decorative.**

```
Landing Page:     WIDE OPEN (marketing, emotion, breathing room)
        ↓
Dashboard:        MODERATELY DENSE (utility, scan-friendly)
        ↓
Job Creation:     FOCUSED (one task at a time, minimal distractions)
        ↓
Negotiation:      TIGHT (all attention on the deal)
        ↓
Payment:          MINIMAL (maximum trust, zero noise)
        ↓
Success:          CELEBRATORY (release, reward, satisfaction)
```

This gradient mirrors the user's mental state:

- On the landing page, they're **curious and open** — give them space to explore
- On the dashboard, they're **purposeful and scanning** — give them information efficiently
- During job creation, they're **focused and committed** — remove all distractions
- During negotiation, they're **decisive and tense** — give them clarity
- During payment, they're **anxious and vulnerable** — give them trust
- After success, they're **relieved and satisfied** — celebrate with them

---

# THE ONE RULE THAT MATTERS MOST

**Every screen must make the user feel something.**

If the user feels nothing — the screen has failed.

- The hero must make them feel **excited** to use HUNAR
- The job posting must make them feel **confident** they'll find help
- The worker offers must make them feel **thrilled** by the response
- The negotiation must make them feel **empowered** and in control
- The payment must make them feel **safe** and respected
- The review must make them feel **satisfied** and heard

**Design is not about how things look. Design is about how things make people feel.**

**Build HUNAR so it makes people feel something they've never felt from a home-services platform before.**

---

# THE DESIGN PHILOSOPHY (Read This Last)

The greatest apps in the world — the ones people check hundreds of times a day — did not become addictive because of their features. They became addictive because their designers understood one thing:

**The user's attention is the most precious resource on the internet. Every pixel, every word, every animation competes for it. The design wins when it guides the user's eye to exactly where it needs to go, without them ever realizing they're being guided.**

Instagram doesn't force you to scroll. It makes you **want** to scroll. It places the most interesting content in the center of your vision, removes everything that competes with it, and delivers a small reward with every swipe.

Apply the same thinking to HUNAR:

**Attention is grabbed, not demanded.**
A user does not respond to "LOOK AT ME" flashing text. They respond to well-placed elements that naturally draw their eye. A single teal button on a clean white screen grabs more attention than ten colorful buttons scattered everywhere.

**Restraint is power.**
The fewer elements on a screen, the more each one matters. Remove everything that doesn't serve the screen's single purpose. If an element doesn't answer "What is this?" or "What do I do?" — remove it.

**Emotion comes before logic.**
The user doesn't think "this button is teal and well-positioned, I should click it." They think "this looks right, I feel good about this page." Design the feeling first. The logic follows.

**Attention is a conversation.**
Every screen talks to the user. The heading says "I'm here." The subheading says "Here's what I do." The button says "Here's what we can do together." If the screen talks too fast (too much content) or too slow (too little content), the user disconnects. Find the rhythm.

**The user's time is sacred.**
Every second a user spends trying to figure out a screen is a second they're not enjoying the product. Make every screen instantly understandable. Make every action instantly rewarding. Make every transition feel natural. When the user stops thinking about the interface, they start feeling the product.

---

# HUNAR — The Final Vision

HUNAR is not just a service marketplace. It's a platform that people **enjoy checking** — not just when they need a service, but because the experience of using it feels good.

The design makes people feel:

- **On the landing page:** "Wow, this looks professional. I can trust this."
- **While posting a job:** "This is easy. I feel in control. I'm making progress."
- **When offers arrive:** "People want to help me. This is exciting."
- **During negotiation:** "I'm in charge. I can decide what's fair."
- **After payment:** "That was simple and safe. I feel relieved."
- **After leaving a review:** "I've helped the next person. This feels good."

This is not achieved by one feature. It's achieved by **every pixel** working together toward one goal: making the user feel confident, in control, and satisfied.

**When you build HUNAR, remember: the design is the product. The user doesn't see code, features, or data. They see how it makes them feel. Make them feel amazing.**

---

_This prompt is the single source of truth for HUNAR's visual design, psychological triggers, attention mechanics, and interaction patterns. Every screen, every component, every animation must align with this document._
