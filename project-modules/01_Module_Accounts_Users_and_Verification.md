# Module 1 — Accounts, Users & Verification

## Purpose of This Module
Everything about the people on the platform — how they become accounts, how they get in, how their customer/worker/admin profiles are built, how a worker gets verified, and how an account can be suspended or restored.

**Covers requirements:** FR-01 (register customers & workers), FR-02 (login/logout & enforce roles), FR-03 (create/update worker profiles), FR-14 (suspend/deactivate accounts — action is performed here, tools live in Module 4), plus a large part of the SRS: FR-01 Authentication, FR-02 Customer Profile, FR-03 Worker Profile & Verification.

**Used by:** All other modules (every screen assumes a logged-in, role-correct user).

---

## 1. The Four Roles (RBAC)

| Role | Permissions | Cannot |
|---|---|---|
| **Customer** | Register/login, manage own profile, post/ edit jobs, view offers, negotiate, accept an offer, pay, review, chat with selected worker | Approve workers, access admin, see other users' private data, change financial records |
| **Worker** | Register/login, build & edit profile, add skills & services, set service area & availability, submit verification docs, see relevant jobs, send offer, negotiate, run visits, complete jobs, chat, review, wallet operations | Admin controls, private customer payment details beyond status, complete another worker's booking, quote on jobs they're not eligible for |
| **Admin** | Secure admin login, manage customers & workers, review & verify workers, monitor jobs/bookings/payments, handle flags & disputes, suspend accounts, configure platform, view audit | — (all admin actions that matter are logged) |
| **Super Admin** | Everything in Admin, **plus** commission rate, system config, maintenance mode | — |

Rules:
- Every API call is checked **server-side** for role (RBAC guard via JWT + Passport strategy).
- A customer-only endpoint rejects a worker token and vice-versa; admin endpoints reject non-admin tokens.
- **The frontend is never the source of truth for authorization** — all decisions happen in the backend.

---

## 2. Authentication

### 2.1 Primary Login: Passwordless Phone + OTP (per platform rule: "No passwords")
```
User opens HUNAR
  → Types phone number (E.164, e.g. 03xx-xxxxxxx)
  → System generates 6-digit OTP, stores in Redis with TTL 5 minutes
  → OTP sent by SMS (Twilio or local Pakistani provider)
  → User types OTP
  → Verified?
       YES → user picks role on first login ("I Need a Service" / "I'm a Professional")
       NO  → "Wrong code. Try again." (max 5 attempts)
  → JWT access + refresh tokens issued
```

### 2.2 Admin Login
Admin uses **username/email + password** on the separate admin panel. Passwords hashed with **bcrypt**. Admin login also rate-limited.

### 2.3 OTP Limits (Redis-backed)
| Action | Limit |
|---|---|
| OTP send (resend) | Max **3** per phone per 15 minutes |
| OTP verify | Max **5** attempts per 5 minutes |
| New OTP invalidates the previous one | Always (idempotent by phone) |

Exceeding limits → block with "Too many tries. Wait 15 minutes." (rate-limit protection for the account).

### 2.4 Token Strategy (JWT)
| Token | Lifetime | Storage | Behavior |
|---|---|---|---|
| Access token | 15 minutes | Client secure memory | Sent on every protected request |
| Refresh token | 30 days | Redis `session:{userId}` | Rotated on every use |
| Logout | — | — | Invalidates the refresh token |

- OTP codes and refresh tokens live in **Redis** — never in the main database.
- Every protected request verifies the JWT; a missing/expired/invalid token returns `401` and the client re-authenticates.

---

## 3. Account & Profile Data Model (PostgreSQL)

### 3.1 `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| phone | VARCHAR(20) UNIQUE | E.164, required |
| email | VARCHAR(255) UNIQUE | Optional for customers/workers; required for admin |
| name | VARCHAR(100) NOT NULL | |
| role | VARCHAR(20) | `customer` / `worker` / `admin` / `super_admin` (CHECK constraint) |
| avatar_url | TEXT | Profile photo |
| latitude / longitude | DECIMAL | Last known location |
| fcm_token | TEXT | Push subscription for FCM (also `push_sub` JSONB) |
| is_active | BOOLEAN default true | Suspended = false |
| is_verified | BOOLEAN default false | Phone verified |
| last_login_at | TIMESTAMPTZ | |
| created_at / updated_at | TIMESTAMPTZ | |

Indexes: `phone`, `role`, `location (lat,lng)`, `is_active WHERE is_active = true`.

### 3.2 `customer_profiles`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID PK / FK | ON DELETE CASCADE |
| default_address | TEXT | Saved default location |
| default_latitude / default_longitude | DECIMAL | |
| total_jobs_posted | INTEGER | Increments on job creation |
| total_spent | DECIMAL(12,2) | Increments on payment |
| created_at / updated_at | TIMESTAMPTZ | |

### 3.3 `worker_profiles`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID PK / FK | 1 worker = 1 profile |
| skills | TEXT[] | Array of service-category IDs the worker provides |
| experience_years | INTEGER | |
| bio | TEXT | Short description |
| hourly_rate | DECIMAL(10,2) | Optional base rate |
| is_verified | BOOLEAN | Admin-approved (verified badge) |
| verification_doc_url | TEXT | ID document URL |
| rating_avg | DECIMAL(3,2) | Recalculated on each review (Module 4) |
| rating_count | INTEGER | |
| total_jobs | INTEGER | Completed jobs count |
| total_earnings | DECIMAL(12,2) | |
| is_available | BOOLEAN default true | Manual + wallet-driven (Module 3) |
| service_radius_km | INTEGER default 10 | Max distance willing to travel |
| verified_at | TIMESTAMPTZ | |
| created_at / updated_at | TIMESTAMPTZ | |

Indexes: `skills` GIN, `is_verified WHERE is_verified`, `is_available WHERE is_available`, `rating_avg DESC`.

### 3.4 Worker Verification (KYC)
A worker can be in one of these verification states:
`pending_verification → verified`  (or stays pending after rejection to resubmit)

Verification submission includes:
- **Identity:** Front & back photo of National ID (CNIC).
- **Optional proof of skill:** Trade licenses, certificates, portfolio photos.
- Profile must be complete (skills, bio, service radius, baseline visit charge) before submission is accepted.

Admin queue actions: **Approve** / **Reject** / **Request additional information or changes** (worker edits and re-submits).
Rejected workers keep their profile and can improve.

**Rule:** Only **eligible, verified, available** workers receive jobs that require a verified worker (nearby matching in Module 2 filters on `is_verified = true`).

---

## 4. Account Statuses & Suspension

| Status | Meaning | Effect |
|---|---|---|
| Active | Normal operation | Everything works |
| Pending verification | Worker joined, not yet approved | Cannot take verified-only jobs |
| Suspended / deactivated | Admin action (FR-14) | Blocked login, profile hidden, no new jobs/offers; **history preserved** |
| Reactivated | Admin restores | Returns to active |

### 4.1 Suspension Rules
- Admin suspends via `PUT /admin/users/:id/toggle` (tool in Module 4, effect here).
- **Suspended mid-job:** if a worker becomes unverified, suspended or ineligible while bookings are active, the system must apply business rules and notify the affected user(s) and admin (SRS 8.6).
- Suspended accounts are **never hard-deleted** — data integrity and audit history rely on soft states.
- Flagged accounts: admin can mark "flag accounts" as part of dispute handling (Module 4).

### 4.2 Duplicate Registration Protection
| Attempt | Result |
|---|---|
| Register with an already-used `phone` | Reject with clear error |
| Register with an already-used `email` | Reject with clear error |
| Multiple accounts by one person (banned worker) | Mitigated by phone verification + OTP; admin flagging of duplicate ID submissions in verification queue |

---

## 5. Screens (Frontend)

### Public / Auth
| Screen | Key content |
|---|---|
| Landing page | Navbar (Home / Services / How It Works / Login / Post Job), hero with 2 CTAs, How-it-works (Post Job → Get Offers → Done), 6 category cards, trust bar (500+ workers, 10,000+ jobs, 4.8 rating, 24/7 support), footer. One scroll to conversion. |
| Signup (role choice) | Two big cards: **"I Need a Service"** / **"I'm a Professional"** (selected = teal border). Simple form below. |
| Login | Split screen: brand gradient left, form right (email/password for admin; phone+OTP for users), "Forgot password?", social login placeholder. |
| OTP Verify | 6-digit code entry; resend timer; attempts counter. |

### Customer
| Screen | Key content |
|---|---|
| Customer Dashboard | Greeting, 4 counters (Active Jobs, Pending Offers, Done Jobs, Spent), recent activity feed, **Post a New Job** primary button. |
| Profile / Settings | Name, phone, avatar, default saved location, language (Urdu/English), notification preferences, change password (admin-style users), security. |

### Worker
| Screen | Key content |
|---|---|
| Onboarding / Profile Setup | Phone + OTP, role selection, full name + photo, **skills multi-select**, years of experience, bio, **service radius map (GPS pin + radius or city sector)**, baseline visit charge, CNIC front/back upload, optional licenses/portfolio. |
| Worker Dashboard | Greeting, 4 counters (Available Jobs, Pending Requests, Done Jobs, Earned), **Availability toggle (Online/Offline)**, new requests feed, nearby jobs. |
| Public Worker Profile (customer view) | Navy gradient header, circular photo with teal border, name/role/city, Verified badge, ⭐ rating + job count + years, About, Services list with prices, **Book Now** + **Send Message** buttons. |

### Design System Notes (apply to all screens above)
- One action per screen; max 1 Primary button (Teal #0F8B8D).
- Status badges: Pending = Orange, Accepted/Active = Teal, Completed = Green, Cancelled = Red.
- Touch targets ≥ 44px; mobile bottom nav (Home, Search, Post, Messages, Profile).
- Empty states and clear error messages everywhere — never a blank screen.

---

## 6. Backend Module (NestJS `src/modules/auth/` + `src/modules/users/`)

### 6.1 Endpoints
| Function | Method | Endpoint | Description |
|---|---|---|---|
| `sendOTP` | POST | `/api/v1/auth/otp/send` | Generate + send OTP (SMS) |
| `verifyOTP` | POST | `/api/v1/auth/otp/verify` | Verify OTP → issue JWT + refresh |
| `registerUser` | POST | `/api/v1/auth/register` | Complete registration with name + role |
| `refreshToken` | POST | `/api/v1/auth/token/refresh` | Rotate refresh token |
| `logout` | POST | `/api/v1/auth/logout` | Invalidate refresh token |
| `getProfile` | GET | `/api/v1/users/me` | Current user |
| `updateProfile` | PUT | `/api/v1/users/me` | Name, avatar, email, settings |
| `getWorkerProfile` | GET | `/api/v1/users/worker/:id` | Public worker profile |
| `updateWorkerProfile` | PUT | `/api/v1/users/worker/me` | Skills, bio, rate, radius |
| `updateLocation` | PUT | `/api/v1/users/location` | Frequent lightweight GPS updates |
| `toggleAvailability` | PUT | `/api/v1/users/worker/availability` | Worker online/offline toggle |
| `submitVerification` | POST | `/api/v1/workers/verification` | Worker submits KYC documents |
| `verifyWorker` | POST | `/api/v1/admin/workers/:id/verify` | Admin: approve/reject/request changes |
| `toggleUserActive` | PUT | `/api/v1/admin/users/:id/toggle` | Admin: suspend/reactivate |

### 6.2 Internal Dependencies
- **Redis:** OTP storage, refresh sessions, rate-limiting counters, online-status heartbeat (`worker:online:{userId}`).
- **SMS Gateway:** Twilio / local Pakistani provider for OTP.
- **File Upload:** multer + sharp + S3/MinIO for avatar, CNIC images, portfolio.
- **Libraries used:** `@nestjs/config`, `@prisma/client`, `class-validator`, `class-transformer`, `bcrypt` (admin passwords), `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `ioredis`, `@nestjs/throttler`, `sharp`, multer, `firebase-admin` (push registration token stored for Module 4).

### 6.3 Rate Limits Applied Here
| Endpoint | Limit |
|---|---|
| OTP send | 3 / 15 min per phone |
| OTP verify | 5 / 5 min per phone |
| General API | 100 / 1 min per IP |
| File upload | 10 / 1 min |
| Registration | Rate-limited (sensitive endpoint) |

---

## 7. Security Notes Specific to Accounts
- **bcrypt** for any password (admin). Enforced minimum password rules.
- Passwords / tokens / phone numbers are **never logged**.
- `class-validator` DTOs validate every body input before business logic.
- JWT secret, SMS keys, DB URL live in `.env` only; `.env` is gitignored; provide `.env.example`.
- Role checks are server-side on every route; never trust client-supplied role.

---

## 8. Edge Cases
| Case | Handling |
|---|---|
| Duplicate phone/email registration | Rejected with understandable message |
| Expired / invalid token | `401`, force re-login |
| Worker re-applies after rejection | Can edit profile and re-submit; admin sees updated documents |
| Worker suspended with active job | Business rules applied + appropriate users/admin notified (SRS 8.6) |
| Admin verification bottleneck | Queue is a core admin screen; batching/prioritization by date; more than one admin recommended (Single-admin risk documented) |
| Worker creates multiple accounts | OTP ties account to phone; duplicate CNIC flagged in verification queue |
| Account deactivated then data queried | Soft state — historical jobs, reviews, payments still intact for audit |

---

## 9. Acceptance Criteria (MVP)
- [ ] Customer and worker can register and log in via phone + OTP.
- [ ] Role dashboards open correctly for customer/worker/admin after login.
- [ ] Worker can complete profile + submit CNIC verification and get `verified` badge after admin approval.
- [ ] Admin can approve/reject/request-changes on verification, and suspend/reactivate an account.
- [ ] Suspended accounts cannot log in; history stays intact.
- [ ] Duplicate phone/email registrations are rejected.
- [ ] OTP expires in 5 min; rate limits block spam.
- [ ] All protected endpoints reject bad/missing tokens with 401 and wrong-role access with 403. 