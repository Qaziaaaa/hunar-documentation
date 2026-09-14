# Module 01 — Authentication and Accounts

## 1. What this module is

This module handles **proving who a user is** and **keeping them logged in**.

When a person first comes to HUNAR, they do not exist in the system. This module:
- gives them an account,
- verifies their phone number,
- lets them log in and out,
- remembers which role they are (customer, worker, or admin),
- protects every other part of the system from users who are not logged in.

Think of it as the **lock and key** of the whole platform.

## 2. Why we build it

Without accounts we cannot:
- know who posted a job,
- know which offers belong to which worker,
- protect private data (addresses, payments),
- let customers see only their own jobs,
- let workers see only relevant jobs,
- let admins control anything.

Every other module depends on Module 01 to answer one question:
> "Who is calling me, and is this person allowed to do this?"

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Registers with phone, logs in/out, changes account settings |
| Worker | Registers with phone (professional path), logs in/out, changes account settings |
| Admin | Has a separate admin login path, logs in/out |
| System | Uses the login status to protect all other features |

## 4. Main screens / features

- **Landing page** (public) — the entry point with login / sign-up buttons.
- **Sign-up screen** — user enters phone number → receives a code → enters code.
  After the code, the user picks their path:
  - "I need a service" (customer) or "I'm a professional" (worker).
- **Login screen** — returning user logs in with phone, or email + password (optional design), and gets a code / password check.
- **Forgot password / account recovery** — a safe way to recover access using the verified phone number.
- **Logout** — ends the session.
- **Session expiry handling** — when the login expires, the user is taken back to login without losing their place (friendly message).
- **Role separation** — after login, customers go to the customer area, workers to the worker area.

## 5. Additions that depend on this module

- **OTP (One-Time Password)** — a short numeric code sent by SMS to the phone number.
  The user must enter it to prove they own the phone.
- **Rate-limiting codes** — the user cannot request codes endlessly.
  Example rules (they will be fine-tuned during design):
  - a code expires after about 5 minutes,
  - a limited number of resend attempts per phone per short time window,
  - a limited number of wrong attempts before the user must wait.
- **Session tokens** — after login the system gives the browser a secret "pass"
  (access token) used for every request, plus a longer-lived refresh token so
  the user stays logged in comfortably but not forever.
- **Account status** — an account can be `active`, `suspended`, or `deactivated`.
  Module 17 (Admin) can suspend accounts; this module makes suspended accounts unable to log in.

## 6. Data this module stores

| Data | Notes |
|---|---|
| User | Unique ID, phone number, email (optional), name, role, status, timestamps |
| Phone verification record | Phone, code (safely stored), expiry, number of attempts |
| Session/token record | Token reference, user, expiry, revocation state |
| Audit entries | Login, logout, verification, suspension events (see Module 19) |

All sensitive values (codes, tokens, passwords) are stored **only in safe form
(hashed/encrypted)** — never in plain text.

## 7. Main workflows

### Workflow A — New user signs up

1. User opens the sign-up screen and enters a phone number.
2. The server checks if the phone already exists.
   - If it exists → tell the user their account already exists and offer login.
   - If it does not exist → continue.
3. The server generates a one-time code and sends it by SMS.
4. The user enters the code.
5. The server checks the code (correct? not expired? not used too many times?).
6. If valid → the user picks their role (customer or worker) and is marked as
   the new role for a fresh account.
7. A session is created; the user lands on the right area.
8. If the role is **worker**, they are guided to Module 02 (profile + verification).

### Workflow B — Returning user logs in

1. User enters their phone number (and/or email + password).
2. The server verifies the identity:
   - password login → check stored password; or
   - OTP login → send a code and verify it.
3. The server checks the account is `active`.
4. If accepted → session is created → user enters their area.
5. All failed attempts are limited and logged.

### Workflow C — Session protection (used by all modules)

1. The user performs some action (e.g. opens "My Jobs").
2. The server receives the request with the user's token.
3. If the token is missing → error `NOT_LOGGED_IN`.
4. If the token is expired or invalid → error with a safe "please log in again".
5. If the token is valid → the server knows the user ID and role → proceeds.

### Workflow D — Logout and expiry

1. User clicks logout (or session expires).
2. The server makes the session/token invalid.
3. The browser clears the saved login information.
4. The user is redirected to the public landing page.

## 8. States and status changes

**Account status:**

```
active ──► suspended (by admin, Module 17)
active ──► deactivated (user request)
suspended ──► active (restored by admin)
```

**Blocking rules:**

- A suspended account cannot log in or perform protected actions.
- Suspension does not delete data; it only blocks access.

## 9. Business rules (the system MUST)

1. Must verify the phone number before creating a full account.
2. Must reject duplicate phone numbers clearly: "This phone is already registered."
3. Must prevent more than the allowed number of code sends and attempts.
4. Must expire codes after a short time.
5. Must never store or return raw code values, passwords, or tokens in logs or responses.
6. Must enforce roles: customers cannot access worker screens and vice versa;
   only admins access the admin area.
7. Must log important authentication events (login, OTP request, suspension) for audit.
8. Must always re-check the session on the server for every protected request.
9. Suspended users must be prevented from protected actions immediately.
10. A user who forgets their password must be able to recover the account only
    through the verified phone (no insecure backdoors).

## 10. Edge cases the system must handle safely

- **Duplicate registration**: same phone tries again → shown a clear message, no duplicate account created.
- **Wrong code repeatedly**: after a limit, new attempts blocked with a waiting time.
- **Expired code**: user must request a new code.
- **Code abuse**: a phone requesting many codes quickly → requests limited.
- **Expired session**: user is logged out safely, no data loss, clear message.
- **Suspended user tries to log in**: login refused with an understandable message.
- **Two people with the same phone**: impossible — phone is unique per account.
- **Network retry during registration**: a double tap must not create two accounts.
- **User closes the browser mid-sign-up**: no half-created account that blocks later registration.

## 11. Connections to other modules

| Module | How they connect |
|---|---|
| 02 Profiles & Verification | Uses the logged-in user to create profiles; worker verification changes account status |
| 03–16 (all features) | Read the current user's identity and role |
| 17 Admin Operations | Admins manage accounts (suspend, reactivate) through this module's rules |
| 13 Notifications | Sends the OTP by SMS; sends security alerts |
| 19 Security & Audit | Provides rate limiting, logging, and safe storage rules |

## 12. Definition of done

- [ ] A new customer can register with phone + OTP and reach the customer area.
- [ ] A new worker can register and is guided to build their profile.
- [ ] A returning user can log in.
- [ ] A user can log out, and an expired session cannot be used.
- [ ] Roles are enforced: customer, worker, and admin areas are separated.
- [ ] Suspended accounts cannot log in.
- [ ] Duplicate phone numbers are rejected clearly.
- [ ] Code resend/attempt limits work and expire codes.
- [ ] All login/OTP endpoints are rate-limited.
- [ ] Audit entries exist for login, logout, OTP, and suspension.
- [ ] No raw secrets appear in logs or responses (verified by review).
- [ ] Module 21 automated tests cover all workflows above.

*Build order note: this module is built first because everything else trusts it.*