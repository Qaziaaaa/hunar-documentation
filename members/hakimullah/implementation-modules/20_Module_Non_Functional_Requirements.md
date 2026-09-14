# Module 20 — Non-Functional Requirements

## 1. What this module is

Non-functional requirements describe **how well** the platform works, not what it does.
They are the quality standards every module must meet.

| Quality | Simple meaning | Business reason |
|---|---|---|
| Performance | Fast pages and requests | Slow pages lose users |
| Usability | Easy without training | Our users are everyday people |
| Responsive | Works on mobile/tablet/desktop | Most users will be on phones |
| Reliability | Works correctly, no lost data | Money + trust cannot afford mistakes |
| Availability | The platform stays up | Downtime blocks business |
| Scalability | Can grow without rewrites | Success means more users |
| Maintainability | Easy to change and understand | Small team, growing features |
| Accessibility | Usable by people with disabilities | Inclusive + often required |
| Observability | We can see what is happening | Find and fix problems fast |
| Localization-ready | Designed for Urdu/regional use | Pakistani market (later) |

## 2. Performance targets

Guidelines (final targets confirmed during design):

- Common API requests respond within ~500 ms normally (payment provider calls excluded).
- Pages load quickly on a normal connection; lists lazy-load; heavy images use the
  small variant (Module 15).
- No unnecessary repeated requests from the UI (avoid cascading API calls).
- Search/matching results are paginated (Module 16).

## 3. Usability standards

- The core customer flow is understandable with **no explanation**:
  post a job → get offers → pick → track → pay.
- Every screen has one clear primary action; secondary actions are visually quieter.
- Every form field has a label; errors explain how to fix them.
- Empty screens guide the user to the next step ("No offers yet — share your job"). 
- Statuses are shown with plain words and colors consistently (see Module 9 timeline).
- Confirmation before destructive actions (cancel, delete, logout).
- Buttons/touch targets have comfortable minimum sizes (≥44px on mobile).

## 4. Responsive standards

- Mobile-first design: the app must feel native on a phone.
- Tablet: single column where natural; desktop: multi-column with a max comfortable width.
- Bottom navigation (Home, Search, Post, Messages, Profile) on mobile.
- No hover-only interactions on touch devices.

## 5. Reliability standards

- The core state machine is the source of truth; illegal transitions are rejected.
- Critical multi-step operations run inside transactions (all-or-nothing).
- Duplicate submissions never create duplicates (Module 19).
- Money operations fail safe and are idempotent (Module 10).
- Jobs/records are never silently deleted — soft states keep history.

## 6. Availability and deployment standards

(Full detail in Module 22; here are the targets.)

- Health checks exist so we can tell "is the service alive?" at a glance.
- The platform is recoverable: databases have backups; uploads can be restored.
- Environment-separated configuration (dev / test / production).
- Monitoring detects failures and alerts the team.

## 7. Scalability standards

- Adding a new category, worker, or customer does not require a redesign.
- The modular monolith (concept) allows a hot module to be split out later if needed.
- Database queries avoid fetching more than needed; indexes support the hot paths
  (identity, job discovery, booking participants, payment references).

## 8. Maintainability standards

- One concept has one name across modules (job, offer, booking, estimate, payment).
- Modules have clear boundaries and defined entry points.
- Code is organized by feature/module (see each module's structure), not by file type spaghetti.
- New developers can start contributing after reading the Overview + module docs.
- Automated tests allow safe refactoring.

## 9. Accessibility standards

- Keyboard-friendly controls.
- Readable contrast for text on backgrounds.
- Labels on all form fields and inputs.
- Clear validation and error messages.
- Focus states are visible.
- Alternative text for meaningful images (Logo, icons as appropriate).

## 10. Observability standards

- We can see: request failures, important workflow events, payment events, critical admin actions.
- Correlation: a request/action can be traced across logs.
- Logs avoid storing unnecessary sensitive information (Module 19).
- Basic dashboards: error rate, response time, traffic, active users, active jobs.

## 11. Localization-ready (design-time only, Urdu later)

- Text is not hard-coded into layouts where avoidable — message/UI copy is centralized
  so Urdu can be added later.
- Currency is Pakistani Rupees (Rs.) throughout.
- Phone numbers are Pakistani format.

## 12. Cross-check list per release

- [ ] Common API responses meet the ~500 ms guideline on test data.
- [ ] Core customer flow is walkable on a phone with no assistance.
- [ ] All pages render on mobile, tablet, and desktop sizes.
- [ ] No illegal state transitions are possible (tested).
- [ ] Health check + monitoring are active.
- [ ] Backups verified restorable.
- [ ] New fields/concepts follow the one-name rule.
- [ ] Accessibility basics pass a quick review.
- [ ] UI copy is centralized.

## 13. Definition of done

- [ ] Performance targets are measured by tests/tools, not just claimed.
- [ ] Responsive layouts are checked across the three device classes.
- [ ] Reliability rules are proven by Module 21 tests (transactions, idempotency).
- [ ] Monitoring and health checks run in all environments.
- [ ] UI copy is centralized and Urdu-ready structure is in place.
- [ ] Accessibility quick-checks pass.