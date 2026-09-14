# Module 02 — User Profiles and Worker Verification

## 1. What this module is

This module manages the **information that describes a person** on HUNAR:

- the **customer's** basic information and default location,
- the **worker's** professional profile (photo, bio, skills, experience, service area),
- the **verification** process where an admin checks a worker and approves them,
- account settings shared by everyone.

A profile is not just decoration: it is what makes a customer trust a worker and
what lets the discovery module (Module 05) decide which workers are relevant.

## 2. Why we build it

- A customer needs to understand a worker before hiring them (who, what skills, how far, how trusted).
- A worker needs to present themselves properly to get jobs.
- The admin needs a reliable way to confirm that a worker is real and safe (verification).
- The system needs a default location to show relevant workers and receive jobs.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Creates/edits own profile, sets default location |
| Worker | Creates/edits professional profile, submits verification documents |
| Admin | Reviews and approves/rejects worker verification |
| Other users (public read) | Anyone can view a worker's public profile |
| System | Reads profiles for matching, notifications, reviews |

## 4. Main screens / features

### Customer side
- **Customer profile / account settings** — name, phone, email, photo, default area.
- **Viewing own activity** — jobs, payments, reviews are shown by other modules; this module hosts the profile shell.

### Worker side
- **Worker profile editor** — photo, display name, bio, years of experience, hourly/visit rate ideas, service area, availability toggle.
- **Skills & services picker** — the worker selects which service categories/skills they offer (see Module 03).
- **Verification submission screen** — uploads identity document/trade document and submits for review.
- **Verification status display** — shows pending / approved / rejected with a clear reason if rejected.
- **Public worker profile page** (seen by customers) — photo, name, verified badge, rating, completed jobs, skills, distance, reviews, and action buttons (Send Offer / Chat) that connect to other modules.

### Admin side
- **Verification queue** — list of pending worker submissions (see Module 17; this module provides the data and the approve/reject action).

## 5. Data this module stores

| Data | Notes |
|---|---|
| Customer Profile | User reference, name, phone, email, default location, photo reference |
| Worker Profile | User reference, photo, bio, years of experience, services/skills, service area, availability, rating summary, jobs completed count, verification status |
| Verification Case | Worker reference, submitted documents (references to Module 15), status, admin notes, reviewed by, reviewed at |
| Saved login/preferences | Settings per user (notification preferences, language) |

## 6. Main workflows

### Workflow A — Worker builds a profile

1. Worker logs in (Module 01) → the system sees `worker` role → asks to complete the profile.
2. Worker fills: photo, name, bio, experience.
3. Worker picks services/skills from the category list (Module 03).
4. Worker sets service area (Module 14) and availability.
5. Worker saves. Profile is saved but **not yet approved**.

### Workflow B — Worker requests verification

1. Worker clicks "Get verified".
2. Worker uploads required documents (Module 15) — for example an identity document.
3. Worker submits the verification case.
4. Status becomes `pending`.
5. Admin reviews (Module 17) → approves or rejects with a reason.
6. On approval, the profile shows a **verified badge** and becomes eligible for job matching.
7. The worker is notified (Module 13).

### Workflow C — Customer views a worker's public profile

1. Customer opens the worker profile page.
2. The page shows public fields: photo, name, verified badge, rating, completed jobs, skills, service area, distance (Module 14), reviews (Module 11).
3. The page offers actions that lead to other modules: "Send Offer" (job-related), "Chat" (Module 12).

## 7. States and status changes

**Worker verification status:**

```
not_submitted ──► pending ──► approved
                       │
                       └──► rejected ──► (worker can resubmit with changes)
```

**Availability (worker):**

```
online (available)  <─►  offline (not available)
```

Availability can be toggled by the worker, and can also be affected by the wallet rule
in Module 10 (a worker whose balance falls too low becomes automatically offline).

## 8. Business rules (the system MUST)

1. Only the owner of a profile can edit it (customer edits customer, worker edits worker).
2. Public profile fields must be viewable by logged-in users; exact private fields
   (documents, payment details) are never public.
3. A worker is not shown in customer-facing matching results until verified
   (Module 05 uses verification status).
4. A verification submission cannot be marked approved without an admin decision.
5. Rejected verification includes a clear reason to the worker.
6. A worker can only offer services that exist in the category list (Module 03).
7. One user = one customer profile; one user = one worker profile when role is worker.
8. Availability exists per worker and is shown in matching results.
9. Profile photos and documents are handled securely by Module 15 (file uploads).
10. Rating and completed-jobs numbers are not typed in by the worker — they are
    calculated by Module 11 and shown read-only.

## 9. Edge cases the system must handle safely

- Worker tries to edit another worker's profile → rejected by the server.
- Worker submits verification twice → only one active case; duplicates merged or blocked.
- Admin rejects, worker fixes and resubmits → a new review cycle starts cleanly.
- Worker is suspended (Module 17) → profile stays saved but the worker cannot act;
  their verified badge behavior is re-checked before matching.
- Worker changes skills after verification → verification stays valid but the new skill
  additions are reviewed separately if required.
- Customer opens a worker profile while the worker is offline → still visible, just not matching.
- Document uploads are too big / wrong type → rejected with a clear message (Module 15).
- The same phone used for a worker and a customer account → not allowed (Module 01).

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 01 Auth & Accounts | Profiles belong to authenticated users; account status limits access |
| 03 Service Categories | Worker skills reference the category list |
| 04 Job Posting | Customer's default location pre-fills job location |
| 05 Discovery & Matching | Uses skill, service area, availability, verification to match jobs |
| 06 Offers & Negotiation | Only verified workers may offer on matching jobs |
| 09 Execution & Completion | Worker "arrived"/"completed" actions require the worker profile to be active |
| 10 Payments & Wallet | Requires worker profile (and later wallet) for payouts and commission |
| 11 Reviews & Ratings | Reviews appear on the public profile; rating average is stored here |
| 12 Chat | Walking into a conversation uses both users' names/photos |
| 14 Location & Maps | Stores/reads service area and coordinates |
| 15 File Uploads & Media | Stores and serves profile photos and verification documents |
| 17 Admin Operations | Provides the verification queue and approve/reject actions |
| 18 Disputes & Support | Profiles are referenced when a complaint is filed |

## 11. Definition of done

- [ ] A customer can create and edit their profile.
- [ ] A worker can build a full professional profile (photo, bio, skills, service area, availability).
- [ ] The public worker profile page shows all required public fields and no private ones.
- [ ] A worker can submit verification documents; status becomes `pending`.
- [ ] An admin can approve or reject a verification case with a reason.
- [ ] Only verified workers appear in customer-facing matching results.
- [ ] Rating and completed job counts are shown read-only (calculated, not typed).
- [ ] Only the owner can edit their profile; the server rejects foreign edits.
- [ ] Module 21 tests cover verification lifecycle and permission controls.