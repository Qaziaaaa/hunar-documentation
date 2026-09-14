# Module 16 — Search and Filtering

## 1. What this module is

This module lets users **find anything quickly**:

- customers find workers and see jobs they posted,
- workers find available jobs,
- admins find users, jobs, payments, disputes.

Search supports filters (category, area, status, date, price) and free-text search
("AC repair near Hayatabad"). It reads the same data as discovery (Module 05) but is
designed for **many queries from many different angles**.

## 2. Why we build it

- The marketplace grows; lists-of-everything stop working.
- Customers compare offers and workers — they need to filter and sort.
- Workers need to scan the jobs they can actually do.
- Admins need to find a specific record in seconds during support.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Finds workers by category/area/price/rating; finds their jobs by status |
| Worker | Finds available jobs by category/area/distance |
| Admin | Finds users/jobs/payments by many filters (Module 17 uses this) |
| System | Powers list pages everywhere |

## 4. Main screens / features

- **Worker search** — category, area/radius, min rating, verified-only, sort by distance/rating/jobs.
- **Job search (worker)** — category, area, urgency, posted recently, sort by distance/date.
- **My Jobs (customer)** — filter by status (active / offers / booked / finished / cancelled).
- **My Requests (worker)** — filter by status.
- **Admin search** — users/workers/jobs/payments/disputes with combined filters.
- **Free-text search** — matches titles, descriptions, names, categories.

## 5. Important considerations

- Search results must be **fast** (see Module 20 non-functional targets).
- Search respects **permissions** — a customer never sees someone else's private records through search.
- Search result counts are approximate-friendly; exact counts on huge lists are optional.
- Matches use the same "hard conditions" as matching when relevant (verified, online, category).

## 6. Main workflows

### Workflow A — Customer searches workers

1. Customer opens the workers page (or from a category card, Module 03).
2. Filters set: category, area, verified-only, min rating.
3. The list loads sorted by the chosen signal with distance/rating/jobs shown.
4. Customer taps a worker → profile (Module 02) → offer flow (Module 06).

### Workflow B — Worker finds available jobs

1. Worker opens "Available Jobs".
2. Filters set: category, radius, urgency, recency.
3. The list shows matching jobs with distance and offers count.
4. Worker opens a job → sends an offer (Module 06).

### Workflow C — Admin finds a record

1. Admin searches by phone/name/ID/status.
2. Results show matching users/jobs — with permission to view the detail safely.

## 7. Business rules (the system MUST)

1. Search must never expose data the current role cannot access (authorization inside search).
2. Category filter is a first-class filter everywhere workers/jobs are listed.
3. Sorting options are explicit and honest (distance, rating, date, price) — never hidden ranking tricks.
4. Results respect the worker active/verified conditions for customer-facing lists.
5. Free-text search is case-insensitive and tolerant of short words (e.g. "AC").
6. Results are paginated/limited; returned metadata says "showing 1–20 of N".

## 8. Edge cases the system must handle safely

- No results → clean empty state with "try another filter/area".
- Very common word ("repair") → returns ranked best matches, capped.
- Query with only spaces → treated as unspecified.
- Worker offline but filters "available-only" → excluded, as expected.
- Customer searches while a privacy block is active → private addresses never appear in results.
- Filter combination is impossible (verified + offline) → returns empty gracefully.
- Two admins search same query → consistent pagination.

## 9. Connections to other modules

| Module | How they connect |
|---|---|
| 02 Profiles & Verification | Worker search sources profile fields |
| 03 Service Categories | Category filtering |
| 04 Job Posting | Job search sources job data |
| 05 Discovery & Matching | Reuses the same data; matching feeds "available jobs" |
| 11 Reviews & Ratings | Rating filter and sort |
| 14 Location & Maps | Area/radius filters |
| 17 Admin Operations | Admin search lists |
| 18 Disputes & Support | Support finds records to attach cases |

## 10. Definition of done

- [ ] Customers can filter/sort workers by category, area, rating, verification.
- [ ] Workers can filter available jobs by category, radius, urgency, recency.
- [ ] Free-text search works on titles/descriptions/names with common-word tolerance.
- [ ] All search respects role permissions.
- [ ] Results are paginated with clear counts.
- [ ] Empty states guide the user to better filters.
- [ ] Module 21 tests cover authorization leakage, pagination, and filter combinations.