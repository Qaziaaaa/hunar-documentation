# 05 — Competitive Analysis & Product Gaps Report

## Executive conclusion

The market already proves demand for:

- Digital home-service booking
- Verified providers
- Provider comparison
- Customer reviews
- Bid/offer mechanisms
- Local service marketplaces
- Digital payments and protected payment concepts

The main gap is not another directory of workers.

The opportunity is to create a **transparent, negotiation-based repair marketplace** where the customer controls the job request and workers compete/offer based on the actual job, while the platform separates the **visit/inspection decision** from the **final repair-price decision**.

---

# 1. What should we copy?

## From inDrive

Copy:

- Customer/provider choice
- Negotiation
- Clear offers
- Provider freedom to accept/reject work

Do not copy the entire ride-hailing logic.

## From Mahir Company

Copy:

- Provider verification
- Local service categories
- Operational support
- Strong service-quality positioning

## From Airtasker

Copy:

- Customer posts a real task
- Providers make offers
- Customer compares offers
- Protected transaction concept
- Explicit price-change mechanism
- Evidence-based dispute handling

## From Taskrabbit

Copy:

- Identity verification
- Provider profile quality
- Clear pricing
- Cancellation rules
- Trust/support layer

## From Thumbtack

Copy:

- Profile comparison
- Reviews
- Simple customer decision-making
- Project discussion before hiring

---

# 2. What should we improve?

## A. Separate visit charge from repair charge

This is the most important product gap.

### Recommended model

`Customer posts job`
→ `Workers offer visit/inspection charge`
→ `Customer selects worker`
→ `Worker visits`
→ `Worker inspects`
→ `Worker submits repair estimate`
→ `Customer accepts/rejects/negotiates`
→ `Repair starts after approval`

Why?

A plumber/AC/electrician often cannot know the final repair cost from a short description alone. A single all-in bid can create disputes when hidden problems are discovered.

---

## B. Make price changes explicit

Existing marketplace reviews can reveal complaints when customers perceive that a displayed price does not match the price requested after inspection. Public Mahir reviews include examples of this concern. These are individual reports, not proof of a general company-wide pattern. [App Store reviews](https://apps.apple.com/pk/app/mahir-company-home-beauty/id1576178647?platform=iphone&see-all=reviews)

### Improvement

Every price change should have:

- Original agreed amount
- Reason for change
- New amount
- Customer approval
- Timestamp
- Worker identity

No silent/off-platform price changes.

---

## C. Make provider comparison richer than price

A cheap provider is not always the best provider.

Customer should compare:

- Offer price
- Visit charge
- Distance
- Expected arrival
- Rating
- Completed jobs
- Verification status
- Relevant skills
- Recent reviews

This follows the general comparison logic used by marketplace competitors. [Airtasker](https://support.airtasker.com/hc/en-us/articles/202402924-What-are-some-safety-tips-I-should-follow-after-posting-a-task) [Thumbtack](https://www.thumbtack.com/how-it-works)

---

## D. Improve job evidence

Customer requests should support:

- Text description
- Images
- Optional voice description
- Exact/selected location
- Preferred time
- Category
- Urgency

The goal is to reduce ambiguity before providers offer.

---

## E. Make accountability visible

After the job:

- Customer confirms completion
- Worker confirms completion
- Payment status becomes visible
- Review is requested
- Complaint/dispute can reference the exact booking, offer, estimate and evidence

---

# 3. What problems do existing platforms have?

## Problem 1 — Price ambiguity

Home-repair pricing is difficult because inspection can reveal additional work.

**Opportunity:** two-stage pricing: visit fee then approved repair estimate.

## Problem 2 — Quality can vary

A platform can verify identity without guaranteeing technical quality.

**Opportunity:** skill-specific profiles, job history, review quality and repeat-customer signals.

## Problem 3 — Customer support may become the last line of defense

Public reviews of Pakistani services show that customers may become dissatisfied when service quality or complaint handling does not meet expectations. Mahir reviews contain examples of complaints about service quality, pricing and support response. These should be treated as anecdotal signals. [Google Play](https://play.google.com/store/apps/details?id=com.mrmahir.customer)

**Opportunity:** capture the entire agreement inside the platform.

## Problem 4 — Marketplace choice can become overwhelming

Too many offers can create decision fatigue.

**Opportunity:** rank/summarize offers using transparent signals rather than only showing a long list.

## Problem 5 — Off-platform leakage

When customer and worker exchange phone numbers and agree privately, the platform may lose visibility and revenue.

**Opportunity:** keep offer, visit approval, estimate and payment history inside the platform.

---

# 4. What unique features can we provide?

## 1. Two-stage negotiation

**Stage 1:** Negotiate visit/inspection fee.

**Stage 2:** After inspection, negotiate repair estimate.

This is the clearest differentiator.

## 2. Offer comparison card

Every worker offer can show:

`Visit Fee | ETA | Distance | Rating | Verification | Jobs Completed`

This lets customers choose on value, not only price.

## 3. “Why this price changed?” evidence

If a repair estimate increases after inspection, worker must provide a reason and optional supporting image/note.

## 4. Fair-price history

Where enough marketplace data exists, show an internal reference such as:

`Typical visit fee in this area/category`

Do not promise an exact “correct” market price; present it as an informational range.

## 5. Job evidence timeline

Keep:

`Request → Offer → Acceptance → Visit → Estimate → Approval → Completion → Payment → Review`

This is useful for both trust and disputes.

## 6. Repeat-worker preference

Customers should be able to rehire a previously trusted worker.

## 7. Repair warranty / rework signal

For selected categories, the platform can support a clearly defined service guarantee or rework window later. This should be a later-stage feature, not a reason to delay MVP.

---

# 5. What should we NOT build?

## Do not build everything in MVP

Avoid turning the first release into a super-app.

Do not prioritize:

- Food delivery
- Ride-hailing
- Grocery delivery
- Large social network features
- Advanced AI diagnosis
- Complex loyalty programs
- Full subscription ecosystem
- Dozens of unrelated service categories
- Complex multi-vendor shopping

The competitive research suggests the core home-service transaction should be proven before expanding.

## Do not build a pure worker directory

A directory does not solve the problem of finding the right worker for a specific job.

## Do not make the cheapest bid automatically win

Price-only ranking can reduce quality and create a race to the bottom.

## Do not allow unrecorded price changes

This is likely to create disputes.

## Do not start with complex commission rules

A simple, understandable commercial model is preferable during validation.

---

# 6. Recommended competitive position

### Core proposition

> **A trusted local marketplace where customers post the actual problem, nearby verified workers make offers, the customer chooses the worker, the visit price is agreed first, and the repair price is approved after inspection.**

### Key differentiators

1. Negotiated visit charge
2. Separate repair estimate after inspection
3. Transparent offer comparison
4. Verified worker profile
5. In-platform agreement history
6. Evidence-backed price changes
7. Structured dispute evidence
8. Local Pakistan-first marketplace behavior

---

# 7. Final recommendation

The strongest competitive strategy is **not** to copy one competitor.

Instead combine:

**inDrive → negotiation + choice**  
**Mahir → local trust + verified providers**  
**Airtasker → job posting + offers + protected transaction + disputes**  
**Taskrabbit → verification + rules + support**  
**Thumbtack → profiles + reviews + comparison**

Then solve the home-repair-specific gap:

> **Visit first. Inspect. Estimate. Approve. Repair.**

That should become the defining transaction pattern of the product.

## Research status

This report is a competitive/product-gap analysis, not a final PRD, SRS, architecture or development specification. Final business rules should be confirmed by the team lead after team-wide review.
