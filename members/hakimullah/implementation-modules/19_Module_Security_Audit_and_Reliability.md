# Module 19 — Security, Audit and Reliability

## 1. What this module is

This module is the **rulebook every other module must follow**. It defines how the
platform stays secure, honest, and durable. It is not a single feature — it is a set
of enforced practices applied across the whole system.

## 2. Why we build it

- A marketplace handles private data (addresses, phone numbers), money, and user trust.
- Security failures here would destroy the entire product.
- The feasibility research flagged these as highest-risk: authentication, authorization,
  locations privacy, file uploads, and payments.

## 3. The security layers

Think of a castle with several walls:

| Layer | What it protects | Examples |
|---|---|---|
| Network | Who can reach the platform | HTTPS everywhere, firewalls |
| Authentication | Proving identity | Phone OTP, secure sessions/tokens (Module 01) |
| Authorization | Limits per role | Server-side role checks on every protected action |
| Input validation | Bad data never enters | Every request checked before use |
| Data protection | Values secured at rest & in transit | Secrecy-encryption, masking, no plain-text secrets |
| Rate limiting | Stopping abuse | Limits on OTP, login, job creation, messages |
| Audit | Knowing who did what | Immutable-style logs of important actions |
| Privacy | Least data, least access | Location/address staged disclosure (Module 14) |

## 4. Non-negotiable security rules

### 4.1 Authentication & sessions
1. Every protected request must be identified (Module 01).
2. Sessions/tokens expire and can be invalidated.
3. Suspended accounts cannot act.

### 4.2 Authorization (the most important)
1. **The server** decides who can do what — never the web page.
2. Every endpoint checks the role and ownership before performing the action.
3. Ownership checks: only the job owner edits the job; only booking participants see its data.

### 4.3 Validation
1. All paths validate: body, query, and URL parameters.
2. Validation happens **before** business logic runs.
3. Validation errors are clear codes + friendly messages (no internal details).

### 4.4 Secrets and sensitive data
1. Passwords/codes/tokens are never stored or logged in plain text.
2. Payment card data is never stored by the platform (provider-only).
3. Logs never contain passwords, tokens, or unnecessary payment details.
4. Sensitive displays are masked (e.g. account numbers) in admin views.

### 4.5 Rate limiting
- Sensitive endpoints (login, OTP, registration, verification submit, payment start,
  messages) get stricter limits.
- General APIs get reasonable limits.
- Limits are per-account and per-connection where useful.

### 4.6 File uploads
- Type validated by content, size limited, safe filenames, private access control
  (detailed in Module 15).

### 4.7 Payment
- Provider confirmations are verified by signature; idempotency everywhere
  (detailed in Module 10).

## 5. Audit logging

### What must be logged

| Category | Examples |
|---|---|
| Authentication | Login success/failure, OTP requests, logout |
| Verification | Worker approved/rejected, reason |
| Job lifecycle | Create, cancel, every status change |
| Booking | Created, confirmed, rescheduled, cancelled |
| Payment | Created, paid, failed, refunded, payout status |
| Wallet | Top-up, commission, withdrawal, reversal |
| Reviews | Submitted, flagged, removed |
| Admin actions | Suspension, corrections, settings changes, dispute decisions |
| Disputes | Opened, resolved, escalated |

### How audit logs behave

1. Each entry: who (actor), what (action), what object (type + ID), when, and extra metadata.
2. They are append-only in practice — existing entries are not edited or deleted.
3. No unnecessary sensitive data (no passwords/tokens/full card numbers).
4. Logs are searchable by support for investigations.
5. Failure to write an audit entry for a money action should prevent that action from completing (safety over speed for payments).

## 6. Reliability principles

1. **State transitions are validated** — illegal changes are rejected (Module 09).
2. **Idempotency** — duplicate requests never create duplicates (jobs, offers, bookings, payments, reviews, notifications). Implementation is by a stable request key (e.g. an idempotency key sent by the client OR uniqueness constraints on natural keys).
3. **Transactions** — multi-record operations (e.g. booking + conversation + notification) succeed or fail together.
4. **Retries-safe** — retried failed requests do not corrupt state.
5. **Fail-safe money** — if an audit log write fails during payment, payment does not silently complete.

## 7. Error handling standard

Every module returns errors in one shape:

```
success: false
code: VERB_SUBJECT (e.g. JOB_NOT_FOUND, OFFER_DUPLICATE, PAYMENT_FAILED)
message: human-readable
details: optional
```

- The web UI maps codes to friendly messages.
- Debug details (stack traces) appear only in developer logs, never in user responses.

## 8. Check-list for every module before release (cross-cutting acceptance)

- [ ] Authentication enforced on all protected endpoints.
- [ ] Server-side role + ownership checks on every sensitive action.
- [ ] All inputs validated before logic.
- [ ] No secrets in logs/responses (reviewed in code review).
- [ ] Rate limits configured for sensitive endpoints.
- [ ] Sensitive admin displays are masked.
- [ ] Money actions: idempotent + audited + provider-verified.
- [ ] File uploads: type/size/access rules applied.
- [ ] Location reveals only per the staged privacy model.
- [ ] Errors in the standard format; no stack traces exposed.

## 9. Edge cases and drills the team should run

- Brute-force test on login/OTP → blocked by limits.
- Fake role change attempt (customer pretending to be admin) → rejected server-side.
- Duplicate submission storm on job creation → one job.
- Two different offers selected at once → one booking.
- Payment callback replay → ignored.
- Upload of a disguised executable → rejected.
- Log review → no plain-text secrets.

## 10. Connections to other modules

Every module implements the rules in this document. Especially:

- Module 01 (auth), 10 (payments), 14 (privacy), 15 (files) enforce the concrete rules.
- Module 17 (admin) uses audit logs.
- Module 21 (testing) proves the rules.
- Module 22 (deployment) enforces operational security (HTTPS, secrets in environment).

## 11. Definition of done

- [ ] All rules in sections 4–7 are implemented as shared infrastructure and used by every module.
- [ ] Sensitive endpoints are rate-limited.
- [ ] Audit logs cover all listed categories and are append-only in practice.
- [ ] Idempotency and transaction rules are proven by tests.
- [ ] A security review checklist passes before each release.
- [ ] Module 21 has negative test suites (unauthorized access, illegal transitions, duplicates, replays).