# Module 21 — Testing and QA

## 1. What this module is

This module defines **how we prove the platform works**. Testing is not an afterthought —
it runs continuously during development and before every release.

Tests are split into levels. All of them together give confidence that the money,
the trust mechanisms, and the workflow are safe.

## 2. The testing pyramid (how tests are organized)

```
        / MANUAL /
       /---------/
      /  E2E     /    few, slow, entire journeys
     /-----------/
    /   API      /    many, fast, business rules
   /-------------/
  /    UNIT      /    lots, fastest, single functions
 /---------------/
```

## 3. Test levels in plain words

| Level | What we check | Example | Runs |
|---|---|---|---|
| Unit | One function/helper | "rounds the distance label to cleaner unit" | Every build (ms) |
| API/integration | Endpoints + business rules | "an unverified worker cannot send an offer" | Every build (seconds) |
| End-to-end (E2E) | Whole journeys through the UI | "customer posts job → worker offers → booking → completion" | Before releases / nightly |
| Manual/QA | Human judgment | "the empty state text is friendly" | Before releases |

## 4. What MUST be tested (living list per module)

### Common for every module
- Happy path of each workflow.
- Each business rule in "Section 9 / rules" of the module doc has a test.
- Each edge case in "edge cases" of the module doc has a test.

### The most critical test areas (where bugs cost money or trust)

| Area | Negative/safety tests required |
|---|---|
| Authentication | Wrong OTP, expired session, suspended login, brute force blocked |
| Authorization | Customer touches another user's job/offer/booking → rejected; role spoofing rejected |
| Job lifecycle | Illegal state transitions rejected (e.g. complete before estimate approval) |
| Offers/booking | Two offers selected → one booking; duplicate offer rejected |
| Payments (Module 10) | Idempotency (repeated request → one charge); provider signature verified; pending/expired holds; refund-reversal flows; a failed audit write blocks payment completion |
| Wallet/commission | Deduction math, payout release rules, thresholds |
| Reviews | One review per booking, review not counted before completion, flag and removal flow |
| Location privacy (Module 14) | Exact address NOT visible before selection; visible after selection; radius boundaries (in/out) |
| Files (Module 15) | Type/size rejection, disguised executables, private files denied to strangers |
| Disputes (Module 18) | Duplicate tickets merged; refunds applied once; auto-close |
| Notifications (Module 13) | Duplicate event → one notification; offline still has in-app copy |
| Admin (Module 17) | Non-admin blocked; simultaneous decisions → one result; audits complete |
| Reliability (Module 19) | Illegal transitions, replays, spoofed calls |

## 5. Test data strategy

- Realistic seed data: a standard set of categories, workers (verified/unverified),
  customers, jobs in each status, bookings, payments, and reviews.
- A distinct **test payment mode** that never touches real money (Module 10).
- Local, isolated environment for all automated tests.
- Never use production users' real phone numbers/addresses in tests.

## 6. Testing workflow during development

1. Write the behavior as a test first where practical (for rules that are clear).
2. Implement the module until its tests pass.
3. Run the full test suite before merging any change (no broken state merges).
4. Feature is "done" only when its tests + the cross-cutting checklist pass.

## 7. Release gates (before any user-facing deployment)

| Gate | Details |
|---|---|
| All automated tests pass | Unit + API + critical E2E |
| Security checklist passed | Module 19 section 8 review |
| Non-functional check passed | Module 20 section 12 review |
| Manual smoke of core journey | Post → offer → booking → payment flow one person click-tests |
| Rollback plan known | How to revert/recover (Module 22) |

## 8. Tracking quality

- Keep a simple scoreboard: tests passing, known open bugs, areas each module covered.
- New bugs found in production become regression tests (fixed once, stays fixed).

## 9. Definition of done

- [ ] Unit tests exist for core helpers (distance, pricing math, status logic, idempotency).
- [ ] Each module's rules and edge cases are covered by API tests.
- [ ] Critical money/trust/authorization areas have negative (attack/replay/duplicate) tests.
- [ ] One end-to-end journey test covers the complete customer-worker lifecycle.
- [ ] Realistic seed data exists; test payment mode is safe.
- [ ] Release gates are defined, documented, and followed.
- [ ] The test suite runs in the build pipeline automatically.