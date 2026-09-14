# Module 05 — Job Discovery and Worker Matching

## 1. What this module is

This module connects **jobs to the right workers** and **workers to the right customers**.

It answers two questions:

1. **"Which workers should see this new job?"** — the job is matched to eligible workers.
2. **"Which workers should this customer see?"** — the customer browses/search results of workers.

Matching is not a random list. It uses several conditions to keep the list relevant.

## 2. Why we build it

- Workers do not want to see every job in the city — only ones they can actually do.
- Customers do not want to scroll through hundreds of irrelevant workers.
- The quality of the whole marketplace depends on showing the **right** match.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Sees matching workers; searches/browses workers |
| Worker | Receives matched job alerts; browses the available job feed |
| System | Runs matching whenever a job is created |

## 4. Main screens / features

- **Available jobs feed (worker)** — a feed of open jobs matched to the worker, sorted by distance and freshness.
- **New job alerts** — when a job matches, the worker gets a notification (Module 13).
- **Worker browsing (customer)** — lists of workers filtered by category, area, etc., with distance, rating, verification, jobs completed (using Module 02 data).
- **Empty states** — "No matching workers yet", "No jobs near you".

## 5. The matching conditions

A job → worker match requires **all** of the following "hard" conditions:

1. **Role check**: the worker is a verified, active worker.
2. **Skill check**: the worker offers the job's category (Module 03).
3. **Availability check**: the worker's availability is `online`.
4. **Location check**: the worker's service area covers the job location within a distance radius (Module 14).
5. **Verification check**: verification status is `approved`.

After the hard filters, results are **ranked** (sorted) by helpful signals:

- Distance (closer first)
- Rating average (Module 11)
- Completed jobs count
- Fastest ETA / response history (if available)
- Professional experience

## 6. Data this module reads

It does not store much of its own data — it reads from other modules:

- Worker profile + skills + availability + verification (Module 02)
- Worker location / service area (Module 14)
- Jobs (Module 04)
- Ratings / completed jobs (Module 11)

Optionally the system caches the recent matching results to stay fast.

## 7. Main workflows

### Workflow A — New job triggers matching

1. Customer posts a job (Module 04).
2. The matching rule runs in the background:
   - find workers passing the five hard conditions for the job's category and location,
   - rank them by distance/rating/experience,
   - limit to a sensible number (e.g. nearest 20–50 workers).
3. Notifications are prepared for those workers (Module 13).
4. Workers see the job in their "Available Jobs" feed.

### Workflow B — Customer searches workers

1. Customer opens a category (or search, Module 16).
2. The system applies module 14 distance filters and module 02 profile signals.
3. Results show cards: photo, name, verified badge, rating, distance, completed jobs, and "view profile / send request" links.
4. The customer opens a profile (Module 02) and proceeds to offers (Module 06).

### Workflow C — Radius expansion fallback

If too few workers are found near the job, the system can optionally widen the radius
in steps to avoid showing an empty result, up to a maximum allowed distance.

## 8. Business rules (the system MUST)

1. Unverified workers never appear in customer-facing matching results.
2. Offline/unavailable workers never appear in matching results.
3. Workers are only matched to jobs whose category they offer.
4. Distance-based matching uses the job location and the worker's service area (Module 14).
5. Ranking is derived from real data (rating, jobs completed) — workers cannot fake these numbers.
6. A worker matching a job does **not** mean they will get the job; the customer chooses from offers.
7. Matching runs without blocking the customer (it is background work).
8. Results are limited to a sensible number to protect worker notification volume.

## 9. Edge cases the system must handle safely

- No workers found near the job → expand radius, then show a clear empty state.
- Worker goes offline just after a job alert → they can still see the job in history but are not newly matched while offline.
- Worker's availability toggled off mid-day → new matching stops immediately.
- Worker's category is filtering vs job category mismatch → never matched.
- Customer searches with a rare category → graceful "few workers, try another area/category".
- Two jobs created at the same exact moment → both are matched correctly, no overlaps lost.
- Worker location missing → treated as outside the radius; they should add a service area (Module 14).

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 02 Profiles & Verification | Skills, availability, verification are match inputs |
| 03 Service Categories | Category overlap is the primary match condition |
| 04 Job Posting | Jobs enter the matching pipeline |
| 13 Notifications | Matched workers are notified about new jobs |
| 14 Location & Maps | Distance and service-area filtering |
| 16 Search & Filtering | The same data powers browse and advanced search |
| 17 Admin Operations | Admins can inspect why matching happened/didn't for support |
| 10 Payments & Wallet | Wallet availability can force a worker offline (affects matching) |

## 11. Definition of done

- [ ] A new job reaches only eligible workers (verified, online, matching category, in area).
- [ ] Results are ranked by distance, rating, and completed jobs.
- [ ] Radius expansion works when few workers are found.
- [ ] Offline and unverified workers are excluded from matching.
- [ ] Workers see a clean "Available Jobs" feed.
- [ ] Customers can browse workers by category with distance shown.
- [ ] Matching is fast and non-blocking for the customer who posted.
- [ ] Module 21 tests cover: skill mismatch, radius edges, offline exclusion, unverified exclusion, empty states.