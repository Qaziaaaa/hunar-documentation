# MODULE 1 — TASK CONTRIBUTION PLAN
### (Accounts, Users & Verification)

> **HOW TO READ THIS FILE:**
> In the sections below, the **OWNER'S NAME IS WRITTEN IN VERY BIG LETTERS** at the top of every member's work area.
> All tasks under that big name belong to **that member only** — nobody else touches them.

---

## 1. QUICK REFERENCE — WHO DOES WHAT

| # | MEMBER | Role | Their Partner | Tasks |
|---|---|---|---|---|
| 1 | **HAKIM ULLAH** | Backend Developer | **ABDULLAH + SHEHZAD** (frontend) | H1 – H8 · Auth, OTP, tokens, RBAC, `users`, customers |
| 2 | **SHAFQAT ULLAH** | Backend Developer | **FAIZAN** (frontend) | W1 – W7 · Worker profiles, KYC, availability, suspend |
| 3 | **ABDULLAH** | Frontend Developer | **HAKIM ULLAH** (backend) | A1 – A8 · Landing, signup, login, OTP, API client |
| 4 | **SHEHZAD** | Frontend Developer | **HAKIM ULLAH** (backend) | S1 – S4 · Customer dashboard & profile |
| 5 | **FAIZAN** | Frontend Developer | **SHAFQAT ULLAH** (backend) | F1 – F6 · Worker onboarding, dashboard, profile |

> ⭐ The column **"Their Partner"** tells you which backend or frontend developer each member works with.

---

## 2. PARTNERSHIP AGREEMENT (READ THIS FIRST)

The 5 members are split into **2 partner-teams**. The pairing is FIXED and never changes:

```
╔══════════════════════════════════════════════════════════════════╗
║ TEAM A — CUSTOMER EXPERIENCE                                     ║
║                                                                  ║
║   ABDULLAH (frontend)  ──backend──►  HAKIM ULLAH                 ║
║   SHEHZAD  (frontend)  ──backend──►  HAKIM ULLAH                 ║
║                                                                  ║
║   ➜ ABDULLAH and SHEHZAD build their screens on                  ║
║     HAKIM ULLAH's APIs ONLY (/auth/* , /users/me).               ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║ TEAM B — WORKER EXPERIENCE                                       ║
║                                                                  ║
║   FAIZAN (frontend)  ──backend──►  SHAFQAT ULLAH                 ║
║                                                                  ║
║   ➜ FAIZAN builds his screens on                                 ║
║     SHAFQAT ULLAH's APIs ONLY (/users/worker* , /workers/…).     ║
╚══════════════════════════════════════════════════════════════════╝
```

**Rules every member must follow:**

| Rule | Applies to |
|---|---|
| Call only your partner's endpoints | Frontend members |
| Build only the APIs your frontend partner consumes | Backend members |
| Never do the other backend developer's endpoints | Both backends |
| Need an endpoint you don't have? Ask YOUR OWN backend partner | Frontend members |
| Never write backend code | Frontend members |
| Never write frontend code | Backend members |

---

## 3. REQUIREMENT COVERAGE MAP (proves nothing is missing)

Every rule and screen of Module 1 is listed below with its owner. ✅ = fully assigned.

| Module 1 part | Requirement / item | BACKEND owner | FRONTEND owner |
|---|---|---|---|
| §1 RBAC | Customer / Worker / Admin / Super Admin permissions + role checks | **HAKIM ULLAH** | ABDULLAH (role-choice UI) |
| §2.1 | Passwordless phone + OTP login | **HAKIM ULLAH** | **ABDULLAH** |
| §2.2 | Admin login (email + bcrypt password) | **HAKIM ULLAH** | (admin UI = Module 4) |
| §2.3 | OTP limits (3 sends/15 min, 5 tries/5 min) | **HAKIM ULLAH** | **ABDULLAH** |
| §2.4 | JWT access 15 min + refresh 30 days + rotation | **HAKIM ULLAH** | **ABDULLAH** |
| §3.1 | `users` table | **HAKIM ULLAH** | — |
| §3.2 | `customer_profiles` table | **HAKIM ULLAH** | **SHEHZAD** |
| §3.3 | `worker_profiles` table | **SHAFQAT ULLAH** | **FAIZAN** |
| §3.4 | Worker KYC verification | **SHAFQAT ULLAH** | **FAIZAN** |
| §4 | Account statuses + suspend/reactivate | **SHAFQAT ULLAH** | **FAIZAN** |
| §4.2 | Duplicate registration protection | **HAKIM ULLAH** | **ABDULLAH** |
| §5 | Landing / Signup / Login / OTP screens | — | **ABDULLAH** |
| §5 | Customer Dashboard / Profile screens | — | **SHEHZAD** |
| §5 | Worker Onboarding / Dashboard / Public Profile | — | **FAIZAN** |
| §5 | Design rules (teal #0F8B8D, badges, 44px, empty states) | — | ABDULLAH + SHEHZAD + FAIZAN |
| §6.1 | All 13 backend endpoints | HAKIM ULLAH + SHAFQAT ULLAH (see §6 table) | — |
| §6.2 | Redis / SMS / uploads / libraries | **HAKIM ULLAH** + **SHAFQAT ULLAH** | — |
| §6.3 | Rate limits | **HAKIM ULLAH** + **SHAFQAT ULLAH** | — |
| §7 | Security rules | **HAKIM ULLAH** + **SHAFQAT ULLAH** | ABDULLAH |
| §8 | Edge cases | HAKIM ULLAH + SHAFQAT ULLAH | ABDULLAH + SHEHZAD + FAIZAN |
| §9 | Acceptance criteria | covered in each member's checklist | covered in each member's checklist |

---

# ★★★  MEMBER WORK AREAS  ★★★
### Every big name below = "ALL TASKS UNDER THIS NAME BELONG TO THIS MEMBER"

---

══════════════════════════════════════════════════════════════════════

#  HAKIM ULLAH

### BACKEND DEVELOPER  ·  Partner of **ABDULLAH & SHEHZAD** (frontend)
### ➜ Delivers every backend API that Abdullah's and Shehzad's screens call.
### ➜ Used by ABDULLAH (landing/login/OTP) + SHEHZAD (dashboard/profile). NOT used by Faizan.

#### TASKS OF HAKIM ULLAH

- [ ] **TASK H1 — `users` table (Prisma migration)** · OWNER: **HAKIM ULLAH**
  - Columns per Module 1 §3.1: `id UUID PK`, `phone VARCHAR(20) UNIQUE (E.164)`, `email VARCHAR(255) UNIQUE (optional; required for admin)`, `name VARCHAR(100)`, `role` (`customer/worker/admin/super_admin` CHECK), `avatar_url`, `latitude/longitude`, `fcm_token`, `push_sub JSONB`, `is_active BOOL default true`, `is_verified BOOL default false`, `last_login_at`, timestamps.
  - Indexes: `phone`, `role`, `(latitude, longitude)`, partial `is_active WHERE is_active = true`.
- [ ] **TASK H2 — `customer_profiles` table** · OWNER: **HAKIM ULLAH**
  - `user_id PK FK CASCADE`, `default_address`, `default_latitude/longitude`, `total_jobs_posted`, `total_spent DECIMAL(12,2)`, timestamps.
  - Provide counter-increment service methods (consumed by Module 2/3 later — stub callers now).
- [ ] **TASK H3 — OTP service in Redis (Module 1 §2.1, §2.3)** · OWNER: **HAKIM ULLAH**
  - `sendOTP`: 6-digit OTP → Redis `otp:{phone}` TTL 5 min, new OTP invalidates old, send SMS (Twilio/local Pakistani provider).
  - Limit: max **3 sends / 15 min per phone** → "Too many tries. Wait 15 minutes."
  - `verifyOTP`: max **5 attempts / 5 min** → wrong code "Wrong code. Try again." → success issues tokens + first-login role path.
- [ ] **TASK H4 — JWT + admin login + RBAC (Module 1 §2.2, §2.4)** · OWNER: **HAKIM ULLAH**
  - Access 15 min; refresh 30 days in Redis `session:{userId}`, rotated on use; logout invalidates.
  - `JwtStrategy`, `RefreshStrategy`, `RolesGuard`, `@Roles()`; server-side role checks; wrong role → `403`.
  - Admin login: email + password with **bcrypt**, min-password rules, admin/super_admin seeded. (Admin UI = Module 4; API only here.)
- [ ] **TASK H5 — Users service `/users/me`** · OWNER: **HAKIM ULLAH**
  - `GET /users/me` (own profile + `customerProfile?`), `PUT /users/me` (name, avatar_url, email, default address + lat/lng → `customer_profiles`). Ownership-checked; `401` bad token, `403` wrong scope.
- [ ] **TASK H6 — Avatar upload (customer + worker avatar)** · OWNER: **HAKIM ULLAH**
  - multer + sharp thumbnails (150/600/1200px) + S3/MinIO pre-signed; size/type validation; limit 10/1min. The ONLY upload Hakim handles.
- [ ] **TASK H7 — Rate limits + account security (Module 1 §6.3, §7)** · OWNER: **HAKIM ULLAH**
  - Limits: OTP send 3/15min, OTP verify 5/5min, general 100/1min/IP, registration sensitive-limit.
  - bcrypt for admin only; NEVER log passwords/tokens/phone; `class-validator` DTOs; `.env` + `.env.example`; `nestjs-pino`; never trust client role.
  - Suspended users (`is_active=false`) cannot log in (shared rule with Shafqat's toggle — see §7).
- [ ] **TASK H8 — OpenAPI slice (deliver FIRST)** · OWNER: **HAKIM ULLAH**
  - Publish `/openapi/auth` + `/openapi/users` before Abdullah/Shehzad start; generated TS types = the contract they build against.

#### API CONTRACT OF HAKIM ULLAH (fixed — Abdullah & Shehzad build on this)
```http
POST /api/v1/auth/otp/send        {phone}                         → {sent:true}
POST /api/v1/auth/otp/verify      {phone, otp, role?}             → {accessToken, refreshToken, isNewUser}
POST /api/v1/auth/register        {name, role, email?, avatar?}   → {user}
POST /api/v1/auth/token/refresh   {refreshToken}                  → {accessToken, refreshToken}
POST /api/v1/auth/logout          {refreshToken}                  → 204
GET  /api/v1/users/me             (Bearer)                        → {user, customerProfile?}
PUT  /api/v1/users/me             (Bearer) {name?, avatar_url?, email?,
                                            default_address?, default_lat?, default_lng?}  → {user}
```
Errors: `400` validation · `401` auth · `403` wrong role · `429` rate limited — same envelope everywhere.

#### ✖ OUT OF SCOPE FOR HAKIM ULLAH (he must NOT do these)
`worker_profiles`, worker KYC, availability, location endpoint, admin user toggle → all belong to **SHAFQAT ULLAH**.

---

══════════════════════════════════════════════════════════════════════

#  ABDULLAH

### FRONTEND DEVELOPER  ·  Partner (backend): **HAKIM ULLAH**
### ➜ Builds everything a visitor/customer does to join and sign in.
### ➜ Calls HAKIM ULLAH's endpoints ONLY. Never touches Shafqat's work.

#### TASKS OF ABDULLAH

- [ ] **TASK A1 — Shared API client (`lib/api.ts`)** · OWNER: **ABDULLAH**
  - axios instance, env base URL, access token in secure memory, auto-refresh interceptor (refresh → retry → 401 logout), TS types generated from Hakim's OpenAPI slice. **Used by all 3 frontends** — single HTTP layer for everyone.
- [ ] **TASK A2 — Auth store (Zustand)** · OWNER: **ABDULLAH**
  - `user`, `isAuthenticated`, `role`, login/logout actions; persists nothing sensitive.
- [ ] **TASK A3 — Route guards** · OWNER: **ABDULLAH**
  - `RequireAuth`, `RequireRole("customer")`, `RequireRole("worker")`; redirect unauthorized users.
- [ ] **TASK A4 — Landing page (public)** · OWNER: **ABDULLAH**
  - Navbar (Home / Services / How It Works / Login / Post Job), hero 2 CTAs ("I Need a Service" / "I'm a Professional"), how-it-works (Post Job → Get Offers → Done), 6 category cards (placeholder for M2), trust bar (500+ workers / 10,000+ jobs / 4.8 rating / 24/7 support), footer. One scroll to conversion.
- [ ] **TASK A5 — Signup role-choice screen** · OWNER: **ABDULLAH**
  - Two big cards **"I Need a Service"** / **"I'm a Professional"** (selected = teal border #0F8B8D) + form → calls Hakim's `register` with chosen role.
- [ ] **TASK A6 — Login (phone + OTP)** · OWNER: **ABDULLAH**
  - Phone entry (E.164) → OTP screen → Hakim's `otp/send` + `otp/verify`; resend timer (3/15 min), attempts counter (5/5 min), "Too many tries. Wait 15 minutes." on `429`.
- [ ] **TASK A7 — OTP Verify screen** · OWNER: **ABDULLAH**
  - 6-digit entry, auto-submit, wrong-code error, attempt tracking; route customers → Shehzad's Dashboard stub, workers → Faizan's Onboarding stub.
- [ ] **TASK A8 — Design rules on every Abdullah screen** · OWNER: **ABDULLAH**
  - 1 action per screen; max 1 primary button (Teal #0F8B8D); touch targets ≥44px; mobile bottom nav (Home, Search, Post, Messages, Profile); empty states + clear errors, never blank.

#### ✖ OUT OF SCOPE FOR ABDULLAH (he must NOT do these)
Customer dashboard/profile internals (**SHEHZAD**), worker screens (**FAIZAN**), any backend code, Shafqat's endpoints.

---

══════════════════════════════════════════════════════════════════════

#  SHEHZAD

### FRONTEND DEVELOPER  ·  Partner (backend): **HAKIM ULLAH**
### ➜ Builds the logged-in customer experience.
### ➜ Calls HAKIM ULLAH's `/users/me` endpoints ONLY.

#### TASKS OF SHEHZAD

- [ ] **TASK S1 — Customer Dashboard** · OWNER: **SHEHZAD**
  - Greeting header; 4 counters (Active Jobs, Pending Offers, Done Jobs, Spent — placeholder now, real data Module 2/3); recent activity (stub); **Post a New Job** primary button → Module 2 screen stub.
- [ ] **TASK S2 — Profile / Settings** · OWNER: **SHEHZAD**
  - Name (editable), phone (read-only), avatar upload (Hakim's upload), default saved location (via Hakim's `PUT /users/me` → `customer_profiles`), language toggle (Urdu/English), notification preferences (stored for Module 4).
  - Inline validation messages match Hakim's API exactly.
- [ ] **TASK S3 — Integration** · OWNER: **SHEHZAD**
  - Uses Abdullah's API client + auth store (no separate HTTP layer); redirect to login on `401`.
- [ ] **TASK S4 — Design rules on every Shehzad screen** · OWNER: **SHEHZAD**
  - Empty states ("No active jobs yet."), badges (Pending=Orange, Active=Teal, Completed=Green, Cancelled=Red), touch targets ≥44px.

#### ✖ OUT OF SCOPE FOR SHEHZAD (he must NOT do these)
Auth/landing screens (**ABDULLAH**), worker-facing screens (**FAIZAN**), any backend code.

---

══════════════════════════════════════════════════════════════════════

#  SHAFQAT ULLAH

### BACKEND DEVELOPER  ·  Partner of **FAIZAN** (frontend)
### ➜ Delivers every backend API that Faizan's screens call.
### ➜ Used by FAIZAN only. Abdullah & Shehzad never call these.

#### TASKS OF SHAFQAT ULLAH

- [ ] **TASK W1 — `worker_profiles` table (Prisma migration)** · OWNER: **SHAFQAT ULLAH**
  - Columns per Module 1 §3.3: `user_id PK FK`, `skills TEXT[]`, `experience_years`, `bio`, `hourly_rate`, `is_verified`, `verification_doc_url`, `rating_avg`, `rating_count`, `total_jobs`, `total_earnings`, `is_available default true`, `service_radius_km default 10`, `verified_at`, timestamps.
  - Indexes: skills **GIN**, partial `is_verified WHERE`, partial `is_available WHERE`, `rating_avg DESC`.
- [ ] **TASK W2 — Worker profile service** · OWNER: **SHAFQAT ULLAH**
  - `GET /users/worker/:id` — public view only (photo, name, profession, city, rating, jobs, years, about, services+rates). No private fields.
  - `PUT /users/worker/me` — update skills, bio, years, rate, radius, visit charge; only own record (ownership check).
- [ ] **TASK W3 — Availability + location** · OWNER: **SHAFQAT ULLAH**
  - `PUT /users/worker/availability` — Online/Offline; Redis heartbeat `worker:online:{userId}` (Module 3 wallet rule hooks here later).
  - `PUT /users/location` — 30s GPS heartbeat upsert (interface for Module 2 matching; matching logic itself = Module 2).
- [ ] **TASK W4 — KYC verification (Module 1 §3.4)** · OWNER: **SHAFQAT ULLAH**
  - `POST /workers/verification` — require **complete profile first** (skills, bio, radius, visit charge) else explain; accept CNIC front+back + optional licenses/certificates/portfolio; state → `pending_verification`.
  - Worker can edit + re-submit after rejection; admin sees updated documents.
- [ ] **TASK W5 — Admin verification + account actions (API only)** · OWNER: **SHAFQAT ULLAH**
  - `POST /admin/workers/:id/verify` — `approve | reject | request_changes` (+note); `pending_verification → verified` or back to pending; duplicate-CNIC flag (multiple-account protection).
  - `PUT /admin/users/:id/toggle` — suspend/reactivate, soft state, history preserved, never hard-delete; SRS 8.6 suspended-mid-job rule + notify hook for Module 4.
  - Admin screens = **Module 4** — here only the contracts.
- [ ] **TASK W6 — Uploads (worker documents only)** · OWNER: **SHAFQAT ULLAH**
  - multer + sharp + S3/MinIO for CNIC/portfolio; size/type limits; 10/1min. Separate from Hakim's avatar upload.
- [ ] **TASK W7 — Security** · OWNER: **SHAFQAT ULLAH**
  - `class-validator` DTOs; never log CNIC/phone; `.env` only; `nestjs-pino`; server-side ownership checks on worker routes.

#### API CONTRACT OF SHAFQAT ULLAH (fixed — Faizan builds on this)
```http
GET  /api/v1/users/worker/:id           → {profile, services, rating}
PUT  /api/v1/users/worker/me            {skills, bio, experience_years, hourly_rate, service_radius_km, visit_charge} → {profile}
PUT  /api/v1/users/worker/availability  {is_available} → {is_available}
PUT  /api/v1/users/location             {lat, lng} → 204
POST /api/v1/workers/verification       {cnic_front, cnic_back, licenses?[], portfolio?[]} → {status:"pending_verification"}
POST /api/v1/admin/workers/:id/verify   {decision:"approve"|"reject"|"request_changes", note?} → {state}
PUT  /api/v1/admin/users/:id/toggle     {is_active} → {state}
```
Errors use the same envelope as Hakim's slice (`400/401/403/429`).

#### ✖ OUT OF SCOPE FOR SHAFQAT ULLAH (he must NOT do these)
`users`/`customer_profiles` tables, OTP/auth/tokens, avatar upload, admin panel UI → belong to **HAKIM ULLAH** or Module 4.

---

══════════════════════════════════════════════════════════════════════

#  FAIZAN

### FRONTEND DEVELOPER  ·  Partner (backend): **SHAFQAT ULLAH**
### ➜ Builds the whole worker experience.
### ➜ Calls SHAFQAT ULLAH's endpoints ONLY. Never touches Hakim's APIs.

#### TASKS OF FAIZAN

- [ ] **TASK F1 — Worker Onboarding / Profile Setup** · OWNER: **FAIZAN**
  - After Abdullah's signup (role=worker): full name + photo, **skills multi-select**, years of experience, bio, **service radius map** (Mapbox pin + radius / city sector), baseline visit charge, CNIC front/back upload, optional licenses/portfolio (all via Shafqat's worker endpoints).
  - Completeness validation mirrors Shafqat's submit rules (skills, bio, radius, visit charge before KYC submit).
- [ ] **TASK F2 — Verification status UI** · OWNER: **FAIZAN**
  - Banner states `pending_verification → verified`; on `request_changes` show admin note, allow edit, re-submit.
- [ ] **TASK F3 — Worker Dashboard** · OWNER: **FAIZAN**
  - Greeting; 4 counters (Available Jobs, Pending Requests, Done Jobs, Earned — stubbed); **Availability toggle Online/Offline** wired to Shafqat's toggle API (show the Module 3 -500 wallet rule in copy); nearby jobs feed stub (Module 2).
- [ ] **TASK F4 — Public Worker Profile (customer-facing)** · OWNER: **FAIZAN**
  - Navy gradient header, circular photo teal border, name/role/city, **Verified badge**, ⭐ rating + jobs + years, About, Services with prices, **Book Now** + **Send Message** (stub). Data from Shafqat's `GET /users/worker/:id`.
- [ ] **TASK F5 — Location heartbeat** · OWNER: **FAIZAN**
  - Send `/users/location` every 30s while app open (worker side) via Abdullah's shared API client.
- [ ] **TASK F6 — Design rules on every Faizan screen** · OWNER: **FAIZAN**
  - Badges (Pending=Orange, Verified=Teal), touch targets ≥44px, empty states with next steps ("No pending requests yet. Set your availability to find jobs."), clear errors from Shafqat's API.

#### ✖ OUT OF SCOPE FOR FAIZAN (he must NOT do these)
Landing/login/OTP/customer screens (**ABDULLAH / SHEHZAD**), admin panel UI (**Module 4** — Shafqat's admin APIs are for the Module 4 admin frontend), any backend code.

---

## 6. API ENDPOINT OWNERSHIP — SINGLE SOURCE OF TRUTH

| Endpoint | OWNER | Built for partner |
|---|---|---|
| `POST /api/v1/auth/otp/send` | **HAKIM ULLAH** | Abdullah |
| `POST /api/v1/auth/otp/verify` | **HAKIM ULLAH** | Abdullah |
| `POST /api/v1/auth/register` | **HAKIM ULLAH** | Abdullah |
| `POST /api/v1/auth/token/refresh` | **HAKIM ULLAH** | Abdullah |
| `POST /api/v1/auth/logout` | **HAKIM ULLAH** | Abdullah |
| `GET /api/v1/users/me` | **HAKIM ULLAH** | Abdullah & Shehzad |
| `PUT /api/v1/users/me` | **HAKIM ULLAH** | Shehzad |
| `PUT /api/v1/users/location` | **SHAFQAT ULLAH** | Faizan (worker GPS heartbeat for Module 2) |
| `GET /api/v1/users/worker/:id` | **SHAFQAT ULLAH** | Faizan |
| `PUT /api/v1/users/worker/me` | **SHAFQAT ULLAH** | Faizan |
| `PUT /api/v1/users/worker/availability` | **SHAFQAT ULLAH** | Faizan |
| `POST /api/v1/workers/verification` | **SHAFQAT ULLAH** | Faizan |
| `POST /api/v1/admin/workers/:id/verify` | **SHAFQAT ULLAH** | (Module 4 admin frontend) |
| `PUT /api/v1/admin/users/:id/toggle` | **SHAFQAT ULLAH** | (Module 4 admin frontend) |

**Rules:**
- A frontend developer never consumes an endpoint not marked for his team.
- Both backends deliver their **OpenAPI slices FIRST** (Hakim: auth+`users/me`; Shafqat: worker+admin). All 3 frontends import generated TS types. No hard-coded payloads.

## 7. SHARED RESOURCES & ANTI-OVERLAP RULES

| Shared item | Owner | Rule |
|---|---|---|
| `Role` enum, JWT shape, error envelope | **HAKIM ULLAH** publishes | Both backends follow same envelope |
| Redis keys | HAKIM: `otp:*`, `session:*`, `ratelimit:*` · SHAFQAT: `worker:online:*` | Namespaced — no collisions |
| Avatar upload | **HAKIM ULLAH** | Worker avatar is just a user field; Faizan reads it via profile API |
| Worker-document upload | **SHAFQAT ULLAH** | CNIC/portfolio only |
| Prisma `schema.prisma` | one file, edited **one member at a time** | Hakim: `users`+`customer_profiles` · Shafqat: `worker_profiles`; sequential PRs, reviewed |
| OpenAPI spec file | merged from both slices | Frontend changes go through the owning backend member |
| Design tokens (teal #0F8B8D, badges, spacing) | shared by 3 frontends | one tokens file; no forking |

## 8. EDGE-CASE OWNERSHIP (Module 1 §8)

| Edge case | BACKEND owner | FRONTEND owner |
|---|---|---|
| Duplicate phone/email registration → rejected clearly | **HAKIM ULLAH** | ABDULLAH |
| Expired/invalid token → `401` re-login | **HAKIM ULLAH** | ABDULLAH (interceptor) |
| Worker re-applies after rejection | **SHAFQAT ULLAH** | FAIZAN |
| Worker suspended with active job (SRS 8.6) | **SHAFQAT ULLAH** | — |
| Admin verification bottleneck | **SHAFQAT ULLAH** (APIs) | (admin UI = Module 4) |
| Multiple accounts → OTP lock + CNIC flag | HAKIM (OTP) + SHAFQAT (CNIC) | FAIZAN |
| Account deactivated then data queried | SHAFQAT (toggle) + HAKIM (login block) | — |

## 9. INTEGRATION, TESTING & SIGN-OFF

### 9.1 Escalation / handoff matrix
| Problem found here | Report to |
|---|---|
| OTP / login / token / 401 / 403 on Abdullah–Shehzad screens | **HAKIM ULLAH** (their partner) |
| Worker profile / availability / KYC / toggle bugs on Faizan's screens | **SHAFQAT ULLAH** (his partner) |
| Visual mismatch inside Team A | Abdullah ⇄ Shehzad (shared client + tokens) |
| Visual mismatch on worker flow | Faizan (with Shafqat) |
| Anything not listed | Ask team lead — do NOT improvise into another's scope |

### 9.2 Partner-team E2E tests (proves each team works alone)
- [ ] **TEAM A E2E:** customer `register` → `otp/send` → `otp/verify` → Shehzad's Customer Dashboard → **Hakim's APIs only** (Abdullah client + Shehzad screen).
- [ ] **TEAM B E2E:** worker `register` (Team A login) → `updateWorkerProfile` → `submitVerification` → `admin/workers/:id/verify` approved → Verified badge on Faizan's Public Profile → **Shafqat's APIs only** (Faizan screens).
- [ ] No other FE↔BE pairing is part of Module 1 sign-off.

### 9.3 Definition of Done (every member)
- Own tasks 100% complete; own API contract / slice up to date.
- **Only own files touched** (verified before submitting).
- Lint + tests green; no secrets committed.
- Partner-team E2E passes; the other team's E2E is green too.
- All Module 1 §9 acceptance criteria demonstrable end-to-end.