# Module 14 — Location and Maps

## 1. What this module is

This module handles every use of **location** in the platform:

- storing where a job is (Module 04),
- storing where a worker serves (service area) and their location (Module 02),
- measuring **distance** between customer and worker,
- enabling **nearby matching** (Module 05) via distance search,
- selecting a location on a map,
- showing direction/navigation after a worker is confirmed.

Location is both a convenience (maps) and a core business rule (only nearby workers match).

## 2. Why we build it

- Customers want a worker who can actually reach them.
- Workers do not want jobs 50 km away.
- Distance is one of the most trusted ranking signals in the offer comparison (Module 06).
- Privacy matters: the customer's **exact address must be protected** until they choose a worker.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Picks a location on a map when posting; sees distances |
| Worker | Sets a service area; (optionally) shares live location; sees job distances |
| System | Runs distance checks for matching and display |
| Admin | Reads location data for support/analytics (respecting privacy) |

## 4. Main screens / features

- **Map picker** — customer taps where the job is, or searches an address.
- **Distance display** — "2 km away" on worker cards and offer cards.
- **Service-area editor (worker)** — worker marks the area/radius they cover.
- **Directions** — after confirmation, the worker can open directions to the address.
- **Privacy-aware reveal** — the exact pin/address is shown only after a worker is selected.

## 5. Data this module stores

| Field | Meaning |
|---|---|
| Stored location | Coordinates (latitude/longitude) + address text/neighborhood |
| Service area | Worker's center + radius they cover |
| Privacy level | Whether the location is approximate (pre-selection) or exact (post-selection) |

## 6. The privacy model (important)

```
Customer posts job
   │
   ▼   stored: neighborhood / approximate area (public to matched workers)
   │
   ├── workers see: approximate area + distance
   │
   ▼   customer selects an offer → booking confirmed
   │
   ▼   exact address revealed ONLY to the confirmed worker (and support)
```

Rules from the feasibility research:

- Before selection: workers see the general area/city and distance — enough to decide.
- After selection: the confirmed worker sees the full exact address for the visit.
- Private location data is only accessible to authorized people, for as long as needed.

## 7. Main workflows

### Workflow A — Customer sets job location

1. Customer opens the job form (Module 04).
2. Customer searches an address or taps the map.
3. The chosen place is saved as coordinates + address text.
4. Privacy level is `approximate` for public matching.

### Workflow B — Worker sets a service area

1. Worker opens profile settings (Module 02).
2. Worker marks their city area and/or a delivery radius.
3. The system stores the center + radius.
4. Matching uses this area going forward.

### Workflow C — Distance check in matching

1. A window of matching runs (Module 05).
2. For each candidate worker, the system computes the distance between the worker's
   service area and the job location.
3. Workers beyond the configured radius are excluded (or deprioritized).
4. The same distance appears on customer-facing cards.

### Workflow D — Exact address reveal

1. The booking is confirmed (Module 07).
2. The exact address becomes visible to the confirmed worker (in the job/booking details).
3. The worker can open directions from the booking screen.

## 8. Business rules (the system MUST)

1. Every job stores a location; a job without a usable location cannot be posted.
2. Distance is calculated from real coordinates — never guessed from text.
3. The exact address is hidden until a worker is selected/confirmed.
4. The address revealing is tied to the booking state (Module 07/09), enforced by the server.
5. Only the confirmed worker and support see the exact address while the booking is active.
6. Workers control their service area; the platform can expand the radius in steps when few workers found.
7. The customer's location persists only as long as needed (privacy/retention).
8. Location precision is capped at a sensible level for public values (city/neighborhood).
9. Wrong/illegible location → the customer is asked to confirm before posting.

## 9. Edge cases the system must handle safely

- GPS is inaccurate → customer confirms the pin; approximate display may differ slightly.
- Customer denies location permission → manual map picking still works.
- Worker has no service area set → treated as outside radius; prompt to set it (Module 02).
- Address text and coordinates disagree → the coordinates win; text is shown as a label.
- Radius has no workers → stepped expansion, then a clear empty state.
- Two locations are very close (same building) → both treated as inside; no issue.
- Exact address becomes available after selection → verified in tests that pre-selection hides it (privacy regression test).

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 02 Profiles & Verification | Service area and (optional) live location live on the worker profile |
| 04 Job Posting | Job location entry |
| 05 Discovery & Matching | Radius/distance matching engine |
| 06 Offers & Negotiation | Distance shown on offer cards |
| 07 Bookings & Scheduling | Confirmed booking reveals the exact address |
| 09 Execution & Completion | Arrival tracking can use coordinates/timestamps (fraud control) |
| 10 Payments & Wallet | (Model B) arriving-verification ties into commission trigger |
| 17 Admin Operations | Location data used inside support with privacy |
| 18 Disputes & Support | "Worker went to the right place or not" evidence |

## 11. Definition of done

- [ ] Customer can set a job location via map or address search.
- [ ] Worker can set a service area with center + radius.
- [ ] Distance is computed and shown on worker and offer cards.
- [ ] Matching excludes (or deprioritizes) workers outside the radius.
- [ ] **The exact address is hidden before selection and revealed after confirmation** (verified by tests).
- [ ] Directions open from a confirmed booking.
- [ ] Privacy rules are enforced by the server, not only hidden UI.
- [ ] Module 21 tests cover distance math, radius boundaries, and the pre/post-selection privacy switch.