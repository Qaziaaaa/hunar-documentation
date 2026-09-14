# Module 03 — Service Categories

## 1. What this module is

This module manages the **list of services** that exist on the platform:
plumbing, electrical, AC repair, carpentry, painting, and so on.

Everything in HUNAR revolves around categories:

- A **worker** chooses which categories they can work in (their skills).
- A **customer** chooses a category when posting a job.
- **Matching and search** use the category to connect the right workers and jobs.

Think of categories as the "sections" of the marketplace.

## 2. Why we build it

Without an organized category list:

- customers would describe services in their own words and workers would not know how to find the job,
- workers could claim skills that do not exist,
- matching and filtering would break,
- the admin could not control what services are offered.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Picks a category when posting a job; browses workers by category |
| Worker | Picks categories as their offered skills; receives jobs for those categories |
| Admin | Creates, edits, reorders, and deactivates categories |
| System | Uses categories everywhere: matching, search, notifications, statistics |

## 4. Main screens / features

- **Category picker** (customer, on job posting) — a clean grid/list of categories with icons.
- **Skills picker** (worker, in profuilding) — the worker selects the categories they can serve.
- **Category management screen** (admin) — create, rename, reorder, activate/deactivate.
- **Landing page category cards** — the public page shows the main categories.
- **Browse by category** — a list of workers or jobs for a chosen category (via Modules 05/16).

## 5. What each category contains (conceptually)

| Field | Meaning |
|---|---|
| Category ID | Unique identifier used by all other modules |
| Name | e.g. "Plumbing" |
| Description | Short explanation for customers |
| Icon / small image | Visual on cards |
| Order | Position in lists |
| Status | `active` or `inactive` |
| Commission rate override (optional) | Some categories may have a different commission; see Module 10 |
| Timestamps | Created/updated dates |

Initial seed categories proposed by the designs (final list decided by the team):

- Electrician
- Plumber
- AC / Cooling Technician
- Carpenter
- Painter
- Mechanic / Handyman
- (more can be added by admin)

## 6. Main workflows

### Workflow A — Admin creates/edits a category

1. Admin opens the category management screen (Module 17).
2. Admin creates or edits a category (name, description, icon, order).
3. The system checks required fields and that the name is not duplicated.
4. The category is saved as `active`.
5. The category is immediately available in all pickers and matching.

### Workflow B — Worker selects skills

1. Worker opens their profile editor (Module 02).
2. The system shows all `active` categories.
3. The worker selects the ones they can serve and saves.
4. From now on, matching (Module 05) considers these skills.

### Workflow C — Customer posts a job in a category

1. Customer opens job posting (Module 04).
2. The system shows `active` categories.
3. Customer picks one.
4. The job is created in that category.
5. Only workers offering that category are eligible to offer (Modules 05/06).

## 7. States and status changes

**Category status:**

```
active <─► inactive
```

Rules for `inactive`:
- Inactive categories no longer appear in customer/worker pickers.
- **Existing** jobs and worker skills in that category remain intact (historical data).
- Matching stops producing new jobs for an inactive category.

## 8. Business rules (the system MUST)

1. Every job must have exactly one primary category.
2. A worker's skills must reference existing, active categories.
3. Category names must be unique (case-insensitive).
4. Only an admin can create, edit, reorder, or deactivate categories.
5. Deactivating a category must not delete historical jobs, offers, or bookings.
6. Matching (Module 05) only uses active categories.
7. Any category can be marked as inactive safely — no workflow breaks for existing data.

## 9. Edge cases the system must handle safely

- Two admins create a category with the same name → the second one is rejected.
- A worker offers a category that was just deactivated → no new matching; existing offers stay.
- A job in a deactivated category → must still be viewable and manageable (history).
- Category list is empty (fresh setup) → the system seeds default categories or shows a clear empty state to admins.
- A category is deleted accidentally → we do not physically delete used categories; we deactivate instead.

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 02 Profiles & Verification | Worker skills = selected categories |
| 04 Job Posting | Job picks a category |
| 05 Discovery & Matching | The core matching condition is category overlap |
| 06 Offers & Negotiation | Only workers matching the job's category may offer |
| 13 Notifications | Category-aware job alerts ("New plumbing job near you") |
| 16 Search & Filtering | Category is a first-class filter |
| 17 Admin Operations | Category CRUD, activation, ordering |
| 10 Payments & Wallet | Optional per-category commission rates |

## 11. Definition of done

- [ ] Default seed categories exist and are shown on the landing page.
- [ ] Customer picks a category when posting a job.
- [ ] Worker selects their skill categories.
- [ ] Admin can create, edit, reorder, and deactivate categories.
- [ ] Deactivated categories stop appearing in pickers and matching but historical data is safe.
- [ ] Duplicate category names are rejected.
- [ ] Module 21 tests cover category lifecycle and deactivation safety.