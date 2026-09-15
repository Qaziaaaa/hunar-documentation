# HUNAR --- MODULE 1

# MASTER OPENCODE AI IMPLEMENTATION PROMPTS

> **Purpose:** This file contains copy-paste-ready master prompts for
> every member assigned to Module 1 --- Accounts, Users & Verification.
>
> **Important:** Each member must use only the prompt under their own
> name. The prompts intentionally enforce the ownership boundaries
> defined in `task contribution.md`.

------------------------------------------------------------------------

# 0. PROJECT-WIDE INSTRUCTIONS --- READ BEFORE ANY MEMBER PROMPT

You are implementing **Module 1 of HUNAR**, a skilled-worker/service
marketplace platform.

Module 1 covers: - Authentication and OTP - JWT access/refresh
sessions - Role-based access control - Users and customer profiles -
Worker profiles - Worker KYC/verification - Account
activation/suspension - Customer frontend - Worker frontend - Shared
frontend API/auth infrastructure - Security, rate limiting, uploads,
OpenAPI contracts, and Module 1 integration tests

## 0.1 Team ownership

There are five developers:

  -----------------------------------------------------------------------
  Member            Role              Partner           Ownership
  ----------------- ----------------- ----------------- -----------------
  **HAKIM ULLAH**   Backend           Abdullah +        H1--H8: auth,
                                      Shehzad           OTP, tokens,
                                                        RBAC, users,
                                                        customers

  **SHAFQAT ULLAH** Backend           Faizan            W1--W7: worker
                                                        profiles, KYC,
                                                        availability,
                                                        suspension

  **ABDULLAH**      Frontend          Hakim Ullah       A1--A8: landing,
                                                        signup, login,
                                                        OTP, API client

  **SHEHZAD**       Frontend          Hakim Ullah       S1--S4: customer
                                                        dashboard and
                                                        profile

  **FAIZAN**        Frontend          Shafqat Ullah     F1--F6: worker
                                                        onboarding,
                                                        dashboard, public
                                                        profile
  -----------------------------------------------------------------------

### Absolute ownership rules

-   Backend developers do **not** write frontend code.
-   Frontend developers do **not** write backend code.
-   A frontend developer calls only the APIs belonging to their backend
    partner.
-   A backend developer implements only the APIs assigned to that
    backend owner.
-   Never duplicate another member's service, controller, schema, upload
    system, API client, or authentication logic.
-   If a required dependency belongs to another member, do not implement
    it yourself. Document the dependency and coordinate with the owner.
-   Do not silently change another member's contract.
-   Do not invent API payloads when an OpenAPI contract exists.
-   Do not hard-code backend response structures when generated
    TypeScript types are available.
-   Keep changes focused on the assigned scope.
-   Before changing a shared file, inspect its ownership and current
    implementation first.

## 0.2 Fixed partner teams

### Team A --- Customer Experience

-   **Hakim Ullah** = backend
-   **Abdullah** = frontend
-   **Shehzad** = frontend

Abdullah and Shehzad consume Hakim's APIs only: - `/api/v1/auth/*` -
`/api/v1/users/me`

### Team B --- Worker Experience

-   **Shafqat Ullah** = backend
-   **Faizan** = frontend

Faizan consumes Shafqat's worker APIs only: - `/api/v1/users/worker/*` -
`/api/v1/workers/*` - worker-related endpoints explicitly assigned to
Shafqat

## 0.3 API versioning

Use the fixed base prefix:

``` text
/api/v1
```

Do not create unversioned alternatives unless the existing project
architecture already requires them.

## 0.4 Error contract

All Module 1 APIs must use one consistent error envelope.

Expected categories:

``` text
400 — validation/business-rule error
401 — unauthenticated/invalid/expired token
403 — authenticated but forbidden/wrong role
429 — rate limited
```

Do not create a different error response shape for one endpoint.

If the existing project already defines a global error structure, reuse
it instead of creating a second one.

## 0.5 Security baseline

Never: - log passwords - log OTP values - log access tokens - log
refresh tokens - log CNIC numbers or CNIC document contents - trust a
client-supplied role for authorization - accept another user's ID as
proof of ownership - commit secrets - hard-code API keys - place
credentials in source code - return private worker/customer fields from
public endpoints

Use: - DTO validation - environment variables - secure token/session
handling - server-side authorization - ownership checks - safe logging -
rate limits - appropriate upload validation

## 0.6 Design baseline

The Module 1 source requirements specify:

-   Primary teal: `#0F8B8D`
-   Pending: Orange
-   Verified: Teal
-   Active: Teal
-   Completed: Green
-   Cancelled/Error: Red
-   Touch targets: at least `44px`
-   Clear empty states
-   Clear error messages
-   Never leave a screen blank
-   Prefer one primary action per screen

If the existing application already has a shared design-token system,
use the project's existing token abstraction while preserving the Module
1 visual requirements.

## 0.7 Shared frontend architecture

The shared frontend infrastructure belongs to **Abdullah**: - API
client - authentication store - route guards - generated API types
integration

Shehzad and Faizan must reuse that infrastructure rather than creating
separate HTTP clients.

## 0.8 Database ownership

`schema.prisma` is shared and must be edited sequentially.

-   Hakim owns:
    -   `users`
    -   `customer_profiles`
-   Shafqat owns:
    -   `worker_profiles`

Do not overwrite another developer's Prisma changes.

## 0.9 OpenAPI-first rule

Backend owners must publish their OpenAPI slices before frontend
implementation depends on them.

Frontend developers should: 1. inspect the OpenAPI contract, 2.
generate/import TypeScript types, 3. use those types in API calls, 4.
avoid manually guessing request/response shapes.

## 0.10 Existing project rule

Before writing code:

1.  Inspect the repository.
2.  Identify the current frontend/backend framework and package manager.
3.  Inspect existing directory structure.
4.  Inspect existing Prisma schema.
5.  Inspect environment/configuration files.
6.  Inspect existing shared utilities.
7.  Inspect existing lint/test configuration.
8.  Inspect existing auth, API, UI, and design-token code.
9.  Reuse existing architecture where compatible.
10. Do not replace working project architecture merely because you
    prefer a different pattern.

If a requirement conflicts with an existing project convention, preserve
the established architecture where possible and implement the
requirement within it.

## 0.11 Implementation quality

Write production-oriented code: - TypeScript strictness where enabled -
small focused services - DTO validation - meaningful names - no
unnecessary duplication - no giant controllers/components - reusable
utilities - predictable error handling - tests for important business
rules - no dead code - no TODOs for core assigned functionality - no
fake success responses in production paths

## 0.12 Definition of Done

Every member must finish with:

-   assigned tasks implemented
-   own API contract/slice up to date
-   only own files/scope changed, except explicitly coordinated shared
    files
-   lint passes
-   relevant tests pass
-   no secrets committed
-   partner-team E2E flow works
-   no regression in the other team
-   no unauthorized endpoints or screens implemented
-   Module 1 acceptance behavior demonstrable end-to-end

------------------------------------------------------------------------

# 1. HAKIM ULLAH --- BACKEND MASTER PROMPT

## Assigned Tasks

You are **HAKIM ULLAH**, Backend Developer for Team A.

Your frontend partners are: - **ABDULLAH** - **SHEHZAD**

You own:

-   **H1** --- `users` table
-   **H2** --- `customer_profiles` table
-   **H3** --- OTP service in Redis
-   **H4** --- JWT, admin login, RBAC
-   **H5** --- `/users/me`
-   **H6** --- customer/worker avatar upload
-   **H7** --- rate limits and account security
-   **H8** --- OpenAPI auth/users slice, delivered first

Your APIs are consumed by **Abdullah and Shehzad only**.

### Your strict out-of-scope items

Do NOT implement: - `worker_profiles` - worker KYC - worker
availability - worker location endpoint - worker document uploads -
admin user toggle implementation - worker APIs - customer frontend -
worker frontend - landing page - login UI - OTP UI

Those belong to Shafqat, Abdullah, Shehzad, Faizan, or Module 4 as
defined by the task plan.

------------------------------------------------------------------------

## 1.1 First phase --- repository reconnaissance

Before changing anything, inspect:

``` text
backend package.json
src/
prisma/
schema.prisma
.env
.env.example
Docker configuration if present
Redis configuration
existing modules
existing guards
existing strategies
existing global pipes
existing exception filters
existing logger
existing tests
existing Swagger/OpenAPI setup
```

Determine: - NestJS version - Prisma version - database provider - Redis
library - JWT library - upload library - object storage integration -
whether `nestjs-pino` already exists - whether there is already an auth
module - whether configuration is centralized - whether API prefix is
already `/api/v1`

Do not recreate functionality that already exists.

------------------------------------------------------------------------

# H1 --- USERS TABLE

Implement the `users` model according to Module 1.

Required fields:

``` text
id UUID primary key
phone VARCHAR(20) UNIQUE, E.164
email VARCHAR(255) UNIQUE, optional for normal users, required for admin
name VARCHAR(100)
role = customer | worker | admin | super_admin
avatar_url
latitude
longitude
fcm_token
push_sub JSONB
is_active BOOLEAN default true
is_verified BOOLEAN default false
last_login_at
created_at
updated_at
```

Requirements:

-   UUID primary key.
-   Phone must be unique.
-   Email must be unique.
-   Role must be constrained to the supported roles.
-   `is_active` defaults to `true`.
-   `is_verified` defaults to `false`.
-   timestamps must be maintained correctly.
-   use appropriate nullable fields.
-   preserve numeric precision for coordinates.
-   use a JSON-compatible database type for `push_sub` where supported.

Indexes:

``` text
phone
role
(latitude, longitude)
partial index for active users where supported by the database
```

Before modifying the schema: - inspect existing models - inspect
existing migration history - avoid destructive changes - preserve
compatibility with existing data

Generate the migration using the repository's normal Prisma workflow.

Test: - user creation - duplicate phone - duplicate email - valid
roles - default active/verified behavior

------------------------------------------------------------------------

# H2 --- CUSTOMER PROFILES

Implement `customer_profiles`.

Required:

``` text
user_id PK + FK to users
default_address
default_latitude
default_longitude
total_jobs_posted
total_spent DECIMAL(12,2)
created_at
updated_at
```

Requirements:

-   one-to-one relation with `users`
-   deleting a user should cascade to their customer profile according
    to the source requirement
-   avoid creating a customer profile for worker/admin accounts unless
    the business rule explicitly requires it
-   initialize counters safely
-   preserve monetary precision

Provide service methods for future counter updates, for example:

``` text
incrementTotalJobsPosted(...)
incrementTotalSpent(...)
```

These are service-level extension points for later modules.

Do not implement Module 2/3 job or wallet logic.

------------------------------------------------------------------------

# H3 --- OTP SERVICE WITH REDIS

Implement passwordless phone authentication.

## OTP generation

`sendOTP(phone)` must:

1.  Normalize/validate phone as E.164.
2.  Verify that the phone is valid.
3.  Enforce send rate limit:
    -   maximum **3 OTP sends per 15 minutes per phone**
4.  Generate a cryptographically appropriate 6-digit OTP.
5.  Store it in Redis using:

``` text
otp:{phone}
```

with:

``` text
TTL = 5 minutes
```

6.  A newly generated OTP invalidates the previous OTP.
7.  Send the OTP through the configured SMS provider.
8.  Never log the OTP.
9.  Return only a safe success response.

Expected response:

``` json
{
  "sent": true
}
```

## OTP verification

`verifyOTP(phone, otp)` must:

1.  Validate phone and OTP format.
2.  Retrieve the OTP from Redis.
3.  Enforce maximum **5 attempts within 5 minutes**.
4.  Reject expired OTPs.
5.  Reject incorrect OTPs with the standard error message:

``` text
Wrong code. Try again.
```

6.  On excessive attempts, return the correct rate-limit/business error.
7.  On success:
    -   delete/invalidate the OTP
    -   resolve/create the user as required
    -   issue access + refresh tokens
    -   determine whether this is a new user
    -   respect the selected role flow where applicable
8.  Update login metadata safely.
9.  Never expose the stored OTP.

Expected success shape:

``` json
{
  "accessToken": "...",
  "refreshToken": "...",
  "isNewUser": true
}
```

Do not place secrets or sensitive values in logs.

## Redis key design

Keep OTP keys separate from sessions and rate limits:

``` text
otp:{phone}
ratelimit:otp:send:{phone}
ratelimit:otp:verify:{phone}
```

If the existing Redis abstraction uses another naming convention,
preserve the project's namespace strategy while retaining semantic
separation.

## SMS provider

Create an abstraction around the SMS provider.

Do not hard-code Twilio credentials or a Pakistani provider credential.

Use environment configuration.

The implementation should allow a local/test provider or mock in
automated tests without sending real SMS.

------------------------------------------------------------------------

# H4 --- JWT + ADMIN LOGIN + RBAC

Implement authentication and authorization.

## Access token

Requirements:

``` text
lifetime = 15 minutes
```

Include only necessary claims, such as:

``` text
sub
role
```

Do not put sensitive profile information into the token.

## Refresh token

Requirements:

``` text
lifetime = 30 days
```

Store the server-side refresh session in Redis:

``` text
session:{userId}
```

Rotate refresh tokens on use.

A used/invalidated refresh token must not remain reusable.

Logout must invalidate the session.

If the project needs multiple sessions per user, adapt the key structure
safely rather than weakening rotation.

## Strategies

Implement/reuse:

``` text
JwtStrategy
RefreshStrategy
```

Use NestJS guards consistently.

## RolesGuard

Implement:

``` text
RolesGuard
@Roles(...)
```

The authorization decision must happen on the server.

Example:

``` text
customer endpoint + worker token => 403
worker endpoint + customer token => 403
unauthenticated request => 401
```

Never trust:

``` json
{
  "role": "admin"
}
```

from a frontend request as proof of authorization.

The authenticated user/role must come from the validated server-side
token/session and database state where appropriate.

## Admin login

Implement API-only admin authentication:

-   email
-   bcrypt password
-   minimum password rules
-   only `admin` and `super_admin`
-   seed at least one appropriate admin/super-admin account according to
    the repository's safe seeding process
-   never store plaintext passwords

Do not implement admin frontend UI.

## Suspended account

If:

``` text
is_active = false
```

the account must not be allowed to authenticate normally.

This must be enforced server-side.

------------------------------------------------------------------------

# H5 --- `/users/me`

Implement:

``` http
GET /api/v1/users/me
```

Response should contain: - authenticated user's safe profile -
`customerProfile` when applicable

Do not expose: - password hashes - internal secrets - refresh-token
state - private Redis data - security-sensitive internals

Implement:

``` http
PUT /api/v1/users/me
```

Accepted fields:

``` text
name?
avatar_url?
email?
default_address?
default_lat?
default_lng?
```

Behavior:

-   ownership is always based on the authenticated user
-   never accept an arbitrary user ID to update someone else's profile
-   update customer profile location/address fields when relevant
-   validate all fields
-   handle duplicate email clearly
-   enforce correct role/scope
-   return `401` for invalid/missing auth
-   return `403` when authenticated but not authorized for the requested
    scope

Ensure the endpoint is usable by Shehzad's customer profile screen.

------------------------------------------------------------------------

# H6 --- AVATAR UPLOAD

You own the **only avatar upload** in Module 1.

Scope: - customer avatar - worker avatar

Do NOT implement worker KYC document upload here.

Use:

``` text
multer
sharp
S3 or MinIO presigned upload/storage
```

Requirements:

-   validate MIME/type
-   validate file size
-   safely process images
-   generate thumbnails:

``` text
150px
600px
1200px
```

-   prevent unsupported image formats
-   do not trust client file extension alone
-   avoid memory abuse
-   use safe temporary storage/streaming where appropriate
-   limit upload activity to **10 uploads/minute**
-   return a safe avatar URL/reference
-   do not expose storage credentials
-   do not log private upload metadata unnecessarily

If the repository already has a storage abstraction, reuse it.

------------------------------------------------------------------------

# H7 --- RATE LIMITS + SECURITY

Implement:

``` text
OTP send: 3 / 15 min / phone
OTP verify: 5 / 5 min
General API: 100 / 1 min / IP
Sensitive registration: appropriate additional protection
Avatar upload: 10 / 1 min
```

Use Redis where appropriate.

Security requirements:

-   bcrypt for admin passwords only
-   DTO validation using `class-validator` if that is the project
    convention
-   environment variables for secrets
-   `.env.example` with placeholders only
-   `nestjs-pino` or existing structured logger
-   never log:
    -   password
    -   OTP
    -   access token
    -   refresh token
    -   CNIC
    -   sensitive document data
-   never trust client roles
-   validate ownership
-   block inactive accounts
-   consistent 400/401/403/429 behavior

Review authentication flows for: - brute-force resistance - replay
resistance - token rotation - expired token handling - refresh-token
invalidation - duplicate registration - account suspension

------------------------------------------------------------------------

# H8 --- OPENAPI SLICE FIRST

This task must be treated as an early deliverable because Abdullah and
Shehzad build against your contract.

Publish the OpenAPI slice for:

``` text
/auth
/users
```

At minimum document:

``` http
POST /api/v1/auth/otp/send
POST /api/v1/auth/otp/verify
POST /api/v1/auth/register
POST /api/v1/auth/token/refresh
POST /api/v1/auth/logout
GET  /api/v1/users/me
PUT  /api/v1/users/me
```

Document: - request bodies - response bodies - authentication
requirements - role requirements - status codes - validation errors -
401 - 403 - 429

Generated TypeScript types must be consumable by Abdullah, Shehzad, and
the shared frontend infrastructure.

Do not invent a second API contract.

------------------------------------------------------------------------

## Hakim --- required endpoint contract

``` http
POST /api/v1/auth/otp/send
Body: { phone }
Response: { sent: true }

POST /api/v1/auth/otp/verify
Body: { phone, otp, role? }
Response: { accessToken, refreshToken, isNewUser }

POST /api/v1/auth/register
Body: { name, role, email?, avatar? }
Response: { user }

POST /api/v1/auth/token/refresh
Body: { refreshToken }
Response: { accessToken, refreshToken }

POST /api/v1/auth/logout
Body: { refreshToken }
Response: 204

GET /api/v1/users/me
Auth: Bearer
Response: { user, customerProfile? }

PUT /api/v1/users/me
Auth: Bearer
Body: {
  name?,
  avatar_url?,
  email?,
  default_address?,
  default_lat?,
  default_lng?
}
Response: { user }
```

------------------------------------------------------------------------

## Hakim --- testing plan

Create/update tests for:

### Unit

-   OTP generation
-   OTP expiration
-   OTP replacement
-   OTP send rate limit
-   OTP verification attempt limit
-   JWT creation
-   refresh rotation
-   logout invalidation
-   role guard
-   suspended-user rejection
-   duplicate phone/email
-   customer profile update
-   upload validation

### Integration/E2E

At minimum prove:

``` text
register
→ OTP send
→ OTP verify
→ access token
→ GET /users/me
→ PUT /users/me
→ refresh
→ logout
→ refresh rejected
```

Also test:

``` text
invalid token → 401
wrong role → 403
too many OTP sends → 429
too many OTP attempts → 429
inactive account → authentication blocked
duplicate phone/email → clear validation/business error
```

------------------------------------------------------------------------

## Hakim --- handoff checklist

Before handing off to Abdullah and Shehzad:

-   OpenAPI `/auth` and `/users` is available.
-   Request/response types are stable.
-   Error envelope is documented.
-   JWT behavior is documented.
-   OTP limits are documented.
-   Refresh behavior is documented.
-   `/users/me` is tested.
-   Avatar contract is documented.
-   `.env.example` contains required placeholders.
-   No secrets are committed.
-   Prisma migration is clean.
-   Tests pass.
-   No worker implementation was added.

------------------------------------------------------------------------

# 2. ABDULLAH --- FRONTEND MASTER PROMPT

## Assigned Tasks

You are **ABDULLAH**, Frontend Developer for Team A.

Your backend partner is **HAKIM ULLAH**.

You own:

-   **A1** --- shared API client
-   **A2** --- Zustand auth store
-   **A3** --- route guards
-   **A4** --- landing page
-   **A5** --- signup role-choice
-   **A6** --- phone + OTP login
-   **A7** --- OTP verification
-   **A8** --- design rules

Your API source is **Hakim's OpenAPI contract only**.

You are also responsible for shared frontend infrastructure used by the
other frontends.

## Strictly out of scope

Do NOT implement: - backend code - worker APIs - Shafqat's endpoints -
customer dashboard internals - customer profile/settings internals -
worker dashboard - worker onboarding - worker public profile - admin UI

------------------------------------------------------------------------

## A1 --- SHARED API CLIENT

Inspect the existing frontend architecture first.

Create/reuse:

``` text
lib/api.ts
```

Requirements:

-   axios instance or the project's existing HTTP abstraction
-   base URL from environment variables
-   no hard-coded API URL
-   typed requests/responses
-   generated types from Hakim's OpenAPI slice
-   access token handling in secure in-memory state
-   automatic refresh flow
-   retry original request after successful refresh
-   if refresh fails:
    -   clear auth state
    -   redirect to login
    -   avoid infinite interceptor loops

Do not persist sensitive tokens unnecessarily.

The API client must be reusable by: - Abdullah - Shehzad - Faizan

Do not create multiple competing API clients.

------------------------------------------------------------------------

# A2 --- ZUSTAND AUTH STORE

Implement/reuse a central auth store.

State:

``` text
user
isAuthenticated
role
```

Actions:

``` text
login
logout
setUser
clearAuth
```

Requirements:

-   do not persist sensitive authentication data in localStorage unless
    the existing security architecture explicitly requires a safe
    alternative
-   keep state predictable
-   derive role from authenticated user/server response
-   never let the UI role selection become authorization proof
-   logout must call Hakim's logout endpoint when possible
-   clear local auth state after logout

------------------------------------------------------------------------

# A3 --- ROUTE GUARDS

Implement reusable:

``` text
RequireAuth
RequireRole("customer")
RequireRole("worker")
```

Behavior:

-   unauthenticated user → login
-   authenticated customer → customer routes
-   authenticated worker → worker routes
-   wrong role → safe unauthorized handling/redirect
-   prevent flash of protected content while auth state is loading

Do not implement backend authorization here; this is frontend navigation
protection only.

------------------------------------------------------------------------

# A4 --- LANDING PAGE

Build a polished, production-quality public landing page.

Required navbar:

``` text
Home
Services
How It Works
Login
Post Job
```

Hero: - strong HUNAR value proposition - two primary CTAs: -
`I Need a Service` - `I'm a Professional`

How it works:

``` text
Post Job
→ Get Offers
→ Done
```

Six service category cards: - placeholders are acceptable for Module 2
content - structure must be reusable for future real category data

Trust bar:

``` text
500+ workers
10,000+ jobs
4.8 rating
24/7 support
```

Footer.

Design goal: - one clear conversion journey - responsive -
mobile-first - visually trustworthy - accessible - not cluttered

Use the project design system and Module 1 primary teal:

``` text
#0F8B8D
```

------------------------------------------------------------------------

# A5 --- SIGNUP ROLE CHOICE

Create two prominent choices:

``` text
I Need a Service
I'm a Professional
```

Selected state: - teal border - clear visual feedback - accessible
keyboard/focus state

After role selection, collect required signup data and call Hakim's:

``` http
POST /api/v1/auth/register
```

Do not send unsupported fields.

Handle: - duplicate phone - duplicate email - validation errors - server
errors - loading state - success state

------------------------------------------------------------------------

# A6 --- LOGIN PHONE + OTP

Implement:

``` text
Phone entry
→ OTP send
→ OTP verification
```

Call:

``` http
POST /api/v1/auth/otp/send
POST /api/v1/auth/otp/verify
```

Phone must use E.164-compatible validation.

UI must show: - loading - validation errors - send success - resend
countdown - attempt information - rate-limit error

Requirements from backend contract:

``` text
3 OTP sends / 15 minutes
5 verification attempts / 5 minutes
OTP TTL = 5 minutes
```

For HTTP 429 show the user-friendly message:

``` text
Too many tries. Wait 15 minutes.
```

Do not expose internal Redis details.

------------------------------------------------------------------------

# A7 --- OTP VERIFY SCREEN

Build a polished six-digit OTP interface.

Requirements: - six individual inputs or a secure equivalent -
auto-focus - auto-advance - paste support - auto-submit when complete
where appropriate - wrong-code error - clear attempt feedback - resend
countdown - disabled resend while timer is active - accessible labels -
keyboard support - mobile-friendly

After successful authentication:

``` text
customer → Shehzad's customer dashboard stub
worker → Faizan's worker onboarding stub
```

Do not implement those destinations' internal features.

------------------------------------------------------------------------

# A8 --- DESIGN RULES

Apply consistently:

-   primary action uses teal `#0F8B8D`
-   minimum touch target `44px`
-   one primary action per screen
-   clear empty states
-   clear validation errors
-   no blank/loading dead screens
-   responsive layout
-   keyboard accessible
-   visible focus states
-   semantic HTML where appropriate
-   good contrast
-   sensible loading skeletons/spinners
-   mobile bottom navigation structure where the authenticated
    experience needs it:

``` text
Home
Search
Post
Messages
Profile
```

Create/reuse shared design tokens rather than duplicating magic values.

------------------------------------------------------------------------

## Abdullah --- shared integration rules

Because your API client/auth store are shared:

1.  Make them generic and documented.
2.  Avoid Team A-only assumptions inside reusable infrastructure.
3.  Do not make Faizan dependent on customer-specific code.
4.  Coordinate breaking changes with Shehzad and Faizan.
5.  Prefer generated API types.
6.  Do not duplicate API logic in page components.

------------------------------------------------------------------------

## Abdullah --- testing

Test:

``` text
API client
refresh interceptor
failed refresh
auth store
route guard
role guard
landing navigation
signup role selection
OTP input
OTP resend timer
429 handling
successful customer login
successful worker login
logout
```

Verify no infinite refresh loops.

------------------------------------------------------------------------

## Abdullah --- handoff

Deliver: - shared API client - shared auth store - route guards -
landing page - signup role-choice - login - OTP verification - design
tokens/components where appropriate - generated API type integration

Do not modify backend.

------------------------------------------------------------------------

# 3. SHEHZAD --- FRONTEND MASTER PROMPT

## Assigned Tasks

You are **SHEHZAD**, Frontend Developer for Team A.

Your backend partner is **HAKIM ULLAH**.

You own:

-   **S1** --- customer dashboard
-   **S2** --- customer profile/settings
-   **S3** --- integration
-   **S4** --- design rules

You use: - Abdullah's shared API client - Abdullah's auth store -
Hakim's `/users/me` APIs

## Strictly out of scope

Do NOT implement: - auth/landing screens - backend code - worker
screens - Shafqat APIs - your own HTTP client - duplicate auth store -
admin UI

------------------------------------------------------------------------

# S1 --- CUSTOMER DASHBOARD

Build a polished authenticated customer dashboard.

Required:

### Greeting header

Use the authenticated user's safe name.

### Four counters

``` text
Active Jobs
Pending Offers
Done Jobs
Spent
```

For Module 1 these may use placeholder/stub values because real job data
belongs to later modules.

Clearly structure them so later modules can replace stub data without
rewriting the page.

### Recent activity

Create a reusable recent-activity section with a clean empty state.

### Primary action

Prominent:

``` text
Post a New Job
```

This should route to a Module 2 placeholder/stub.

Do not implement Module 2 job creation.

------------------------------------------------------------------------

# S2 --- PROFILE / SETTINGS

Use Hakim's:

``` http
GET /api/v1/users/me
PUT /api/v1/users/me
```

Fields:

``` text
Name — editable
Phone — read-only
Avatar — editable/uploadable
Default saved location — editable
Language — Urdu / English
Notification preferences — UI/storage placeholder for Module 4
```

Profile update must call Hakim's endpoint.

Default location fields must map correctly:

``` text
default_address
default_lat
default_lng
```

Avatar upload must use Hakim's avatar capability.

Do not create a separate upload endpoint.

------------------------------------------------------------------------

## Profile validation

Match backend behavior.

Handle: - invalid name - invalid email - duplicate email - invalid
location - failed upload - network error - expired session -
unauthorized response

Error messages should be clear and user-facing.

Do not expose backend stack traces or raw internal errors.

------------------------------------------------------------------------

# S3 --- INTEGRATION

Use:

``` text
Abdullah's API client
Abdullah's auth store
Hakim's OpenAPI-generated types
```

Never create:

``` text
axios.create(...)
```

inside the customer dashboard if the shared API client already exists.

On:

``` text
401
```

use the shared refresh/login behavior.

Do not implement your own token refresh mechanism.

------------------------------------------------------------------------

# S4 --- DESIGN RULES

Customer screens must follow:

-   touch targets \>= 44px
-   clear empty states
-   clear loading states
-   clear errors
-   consistent spacing
-   accessible controls
-   responsive layout

Required status badge semantics:

``` text
Pending   = Orange
Active    = Teal
Completed = Green
Cancelled = Red
```

Required empty-state example:

``` text
No active jobs yet.
```

Every empty state should also explain what the user can do next when
appropriate.

------------------------------------------------------------------------

## Shehzad --- testing

Test:

``` text
authenticated dashboard render
user greeting
placeholder counters
empty activity state
Post a New Job stub navigation
GET /users/me
PUT /users/me
profile validation
phone read-only behavior
avatar upload integration
location update
401 handling
logout through shared auth
responsive layout
```

------------------------------------------------------------------------

## Shehzad --- handoff

Deliver only customer-facing frontend work.

Do not: - modify Hakim's backend - modify Shafqat's worker backend -
implement worker UI - implement auth infrastructure that belongs to
Abdullah

------------------------------------------------------------------------

# 4. SHAFQAT ULLAH --- BACKEND MASTER PROMPT

## Assigned Tasks

You are **SHAFQAT ULLAH**, Backend Developer for Team B.

Your frontend partner is:

-   **FAIZAN**

You own:

-   **W1** --- worker profiles table
-   **W2** --- worker profile service
-   **W3** --- availability + location
-   **W4** --- KYC verification
-   **W5** --- admin verification/account actions API
-   **W6** --- worker document uploads
-   **W7** --- worker security

Faizan consumes your APIs.

## Strictly out of scope

Do NOT implement: - `users` table - `customer_profiles` - OTP -
authentication/token system - avatar upload - customer APIs - customer
frontend - admin panel UI - Module 4 frontend

Hakim owns shared auth and avatar infrastructure.

------------------------------------------------------------------------

# W1 --- WORKER PROFILES TABLE

Implement:

``` text
worker_profiles
```

Required:

``` text
user_id PK/FK
skills TEXT[]
experience_years
bio
hourly_rate
is_verified
verification_doc_url
rating_avg
rating_count
total_jobs
total_earnings
is_available default true
service_radius_km default 10
verified_at
created_at
updated_at
```

Indexes:

``` text
skills — GIN
partial index where is_verified
partial index where is_available
rating_avg DESC
```

Requirements:

-   one-to-one relation with worker user
-   appropriate foreign-key behavior
-   numeric precision for money
-   safe defaults
-   timestamps
-   no destructive migration
-   do not edit Hakim's models beyond the minimum relation required for
    a valid Prisma schema

Because `schema.prisma` is shared: - inspect current branch state -
preserve existing changes - coordinate sequential edits - never
overwrite another member's migration

------------------------------------------------------------------------

# W2 --- WORKER PROFILE SERVICE

Implement:

``` http
GET /api/v1/users/worker/:id
```

This is a **public profile** endpoint.

Return only safe public information:

``` text
photo
name
profession
city
rating
jobs
years
about
services + rates
```

Never return private data such as: - CNIC - verification documents -
private phone number - internal flags - security information - internal
admin notes

Implement:

``` http
PUT /api/v1/users/worker/me
```

Accepted fields:

``` text
skills
bio
experience_years
hourly_rate
service_radius_km
visit_charge
```

Ownership rule:

``` text
authenticated worker can update only their own worker profile
```

Do not accept another user's ID as an ownership override.

------------------------------------------------------------------------

# W3 --- AVAILABILITY + LOCATION

Implement:

``` http
PUT /api/v1/users/worker/availability
```

Body:

``` json
{
  "is_available": true
}
```

Update worker availability.

Maintain Redis heartbeat:

``` text
worker:online:{userId}
```

Use a TTL/heartbeat strategy that reflects the worker's online state.

Do not implement Module 3 wallet logic. Only leave the proper
integration hook/interface if the architecture requires it.

Implement:

``` http
PUT /api/v1/users/location
```

Body:

``` json
{
  "lat": 0,
  "lng": 0
}
```

Requirements: - validate latitude range - validate longitude range -
authenticated worker ownership - upsert latest worker location -
designed to receive a 30-second heartbeat from the worker frontend -
expose the data needed later for Module 2 matching - do not implement
matching logic

Return:

``` text
204
```

where required by the contract.

------------------------------------------------------------------------

# W4 --- WORKER KYC VERIFICATION

Implement:

``` http
POST /api/v1/workers/verification
```

Before allowing submission, verify that the worker profile is complete.

Required before KYC submission:

``` text
skills
bio
service radius
visit charge
```

If incomplete: - reject clearly - explain which required information is
missing

Accept: - CNIC front - CNIC back - optional licenses - optional
certificates - optional portfolio

Set state:

``` text
pending_verification
```

Worker must be able to: - edit profile after rejection - update
documents - resubmit

Admin must see the latest submitted documents.

Do not leak private documents through the public worker profile API.

------------------------------------------------------------------------

# W5 --- ADMIN VERIFICATION + ACCOUNT ACTIONS

Implement API contracts only.

## Verification

``` http
POST /api/v1/admin/workers/:id/verify
```

Body:

``` json
{
  "decision": "approve"
}
```

or:

``` json
{
  "decision": "reject",
  "note": "..."
}
```

or:

``` json
{
  "decision": "request_changes",
  "note": "..."
}
```

Supported decisions:

``` text
approve
reject
request_changes
```

State behavior:

``` text
pending_verification → verified
pending_verification → rejected/request changes
rejected/request_changes → pending_verification on valid resubmission
```

Add duplicate-CNIC protection/flagging.

Do not expose the actual CNIC value unnecessarily.

## User suspend/reactivate

Implement:

``` http
PUT /api/v1/admin/users/:id/toggle
```

Body:

``` json
{
  "is_active": false
}
```

Requirements: - soft state only - never hard delete the account -
preserve history/data - record appropriate state history if architecture
supports it - enforce admin/super-admin authorization - provide a hook
for Module 4 notifications - respect the SRS suspended-mid-job rule
without implementing Module 2 job logic

Admin UI belongs to Module 4. Do not build it.

------------------------------------------------------------------------

# W6 --- WORKER DOCUMENT UPLOADS

You own **worker documents only**.

Documents include: - CNIC front - CNIC back - licenses - certificates -
portfolio

Use:

``` text
multer
sharp where image processing is appropriate
S3/MinIO
```

Requirements: - file type validation - file size limits - safe
processing - 10 uploads/minute - no storage credentials in frontend - no
public exposure of private KYC documents - access-controlled retrieval -
safe object names/keys - avoid trusting extensions - protect against
oversized/malformed files

This is separate from Hakim's avatar upload.

------------------------------------------------------------------------

# W7 --- SECURITY

Use: - DTO validation - environment variables - structured logging -
ownership checks - role guards - rate limiting - secure upload handling

Never log: - CNIC - phone - private documents - tokens - passwords

Ensure worker endpoints enforce:

``` text
worker-only actions
admin-only actions
self-ownership
```

Do not rely on frontend route protection as authorization.

------------------------------------------------------------------------

## Shafqat --- API contract

``` http
GET /api/v1/users/worker/:id
Response: { profile, services, rating }

PUT /api/v1/users/worker/me
Body: {
  skills,
  bio,
  experience_years,
  hourly_rate,
  service_radius_km,
  visit_charge
}
Response: { profile }

PUT /api/v1/users/worker/availability
Body: { is_available }
Response: { is_available }

PUT /api/v1/users/location
Body: { lat, lng }
Response: 204

POST /api/v1/workers/verification
Body: {
  cnic_front,
  cnic_back,
  licenses?,
  portfolio?
}
Response: { status: "pending_verification" }

POST /api/v1/admin/workers/:id/verify
Body: {
  decision: "approve" | "reject" | "request_changes",
  note?
}
Response: { state }

PUT /api/v1/admin/users/:id/toggle
Body: { is_active }
Response: { state }
```

Errors:

``` text
400 / 401 / 403 / 429
```

Use the same envelope as Hakim's APIs.

------------------------------------------------------------------------

## Shafqat --- testing

Test:

### Worker profile

-   public safe response
-   own profile update
-   another worker's profile cannot be modified

### Availability

-   online
-   offline
-   Redis heartbeat
-   invalid availability input

### Location

-   valid coordinates
-   invalid latitude
-   invalid longitude
-   worker-only access

### KYC

-   incomplete profile rejected
-   complete profile submitted
-   duplicate CNIC flagged
-   rejected worker can resubmit
-   request changes with note
-   verified state

### Admin

-   non-admin rejected
-   admin approve
-   admin reject
-   admin request changes
-   suspend
-   reactivate
-   no hard delete

### Uploads

-   valid file
-   invalid MIME
-   oversized file
-   rate limit
-   private document access

------------------------------------------------------------------------

## Shafqat --- handoff

Before Faizan begins integration:

-   publish worker/admin OpenAPI slice
-   confirm request/response types
-   confirm verification state machine
-   confirm upload contract
-   confirm error envelope
-   confirm availability behavior
-   confirm location endpoint
-   confirm role requirements
-   confirm no Hakim-owned functionality was duplicated

------------------------------------------------------------------------

# 5. FAIZAN --- FRONTEND MASTER PROMPT

## Assigned Tasks

You are **FAIZAN**, Frontend Developer for Team B.

Your backend partner is:

-   **SHAFQAT ULLAH**

You own:

-   **F1** --- worker onboarding/profile setup
-   **F2** --- verification status UI
-   **F3** --- worker dashboard
-   **F4** --- public worker profile
-   **F5** --- location heartbeat
-   **F6** --- worker design rules

Your worker data must come from Shafqat's APIs.

## Strictly out of scope

Do NOT implement: - backend code - Hakim's auth backend - customer
screens - landing page - customer dashboard - admin panel UI - worker
backend APIs - duplicate API client

You may consume shared frontend infrastructure created by Abdullah.

------------------------------------------------------------------------

# F1 --- WORKER ONBOARDING / PROFILE SETUP

Worker flow begins after signup with:

``` text
role = worker
```

Build a complete onboarding experience.

Fields:

``` text
Full name
Photo
Skills — multi-select
Years of experience
Bio
Service radius
Baseline visit charge
CNIC front
CNIC back
Optional licenses
Optional certificates
Optional portfolio
```

Service radius: - use Mapbox or the project's existing map integration -
provide an understandable location/radius interaction - do not implement
backend matching - city/sector representation may be used where
appropriate

Use Shafqat's worker endpoints for worker-specific operations.

### Completeness

Before KYC submission, mirror backend requirements:

``` text
skills
bio
service radius
visit charge
```

If incomplete: - clearly identify missing fields - prevent confusing
submission behavior - guide the worker to complete the missing
information

Do not treat frontend validation as the only validation. Backend remains
authoritative.

------------------------------------------------------------------------

# F2 --- VERIFICATION STATUS UI

Display states:

``` text
pending_verification
verified
rejected/request_changes
```

For pending: - show clear progress/status message

For verified: - show prominent verified badge

For request changes: - show admin note - make edit action obvious -
allow worker to update and resubmit

Do not invent admin decisions.

Render exactly what the backend contract provides.

------------------------------------------------------------------------

# F3 --- WORKER DASHBOARD

Create:

``` text
Greeting
Available Jobs
Pending Requests
Done Jobs
Earned
```

Counters may be stubbed because job/wallet modules belong later.

## Availability

Create Online/Offline toggle.

Call:

``` http
PUT /api/v1/users/worker/availability
```

Show clear state feedback.

The dashboard copy should acknowledge the future Module 3 wallet rule:

``` text
Online availability is subject to the platform's wallet requirements.
```

Do not implement the wallet rule itself.

## Nearby jobs

Show a stub feed for Module 2.

Do not implement: - job matching - offers - wallet - booking

Use a clear empty state, for example:

``` text
No pending requests yet.
Set your availability to find jobs.
```

------------------------------------------------------------------------

# F4 --- PUBLIC WORKER PROFILE

Create a customer-facing public worker profile.

Required visual structure:

### Header

-   Navy gradient
-   circular worker photo
-   teal photo border

### Identity

-   name
-   role/profession
-   city
-   verified badge

### Metrics

-   rating
-   jobs
-   years of experience

### About

Worker bio.

### Services

Show services and prices.

### Actions

``` text
Book Now
Send Message
```

These may be stubs for later modules.

Data source:

``` http
GET /api/v1/users/worker/:id
```

Never fetch private KYC information.

------------------------------------------------------------------------

# F5 --- LOCATION HEARTBEAT

While the worker application is open and the worker is in the
appropriate authenticated state:

send:

``` http
PUT /api/v1/users/location
```

every:

``` text
30 seconds
```

Requirements: - use the shared API client - avoid multiple duplicate
intervals - stop the interval when the component/app lifecycle requires
it - handle permission denial - handle unavailable location - avoid
crashing the application - do not send invalid coordinates - do not
create a heartbeat when the worker is not authenticated/eligible - avoid
excessive calls due to React re-renders

Implement cleanup correctly.

Do not implement server-side matching.

------------------------------------------------------------------------

# F6 --- DESIGN RULES

Apply consistently:

-   Pending badge = Orange
-   Verified badge = Teal
-   touch targets \>= 44px
-   clear empty states
-   clear errors
-   clear loading states
-   responsive layout
-   accessible forms
-   visible focus states
-   sensible validation
-   no blank states

The worker experience should feel: - professional - trustworthy -
simple - guided - suitable for users with different technical skill
levels

Avoid overwhelming workers with large forms on one screen when a
step-based onboarding flow would improve completion.

------------------------------------------------------------------------

## Faizan --- testing

Test:

``` text
worker onboarding
skills multi-select
profile completeness
KYC submission
pending state
request changes
re-submit
verified state
dashboard
availability toggle
nearby jobs empty state
public profile
verified badge
location heartbeat
permission denial
interval cleanup
API errors
401 handling
responsive/mobile UI
```

------------------------------------   my end point task------------------------------------

# 6. CROSS-TEAM E2E SIGN-OFF

## Team A E2E

The customer path must demonstrate:

``` text
Customer registration
→ OTP send
→ OTP verify
→ authentication
→ Customer Dashboard
→ GET /users/me
→ customer Profile
→ PUT /users/me
→ avatar update where applicable
→ logout
```

Only these backend endpoints are allowed for Team A:

``` text
Hakim's /auth/*
Hakim's /users/me
```

Abdullah's shared API client and Shehzad's customer UI must work
together.

------------------------------------------------------------------------

## Team B E2E

The worker path must demonstrate:

``` text
Worker registration
→ login/OTP through Team A authentication
→ worker profile setup
→ complete profile
→ KYC submission
→ pending verification
→ admin approval API
→ verified state
→ public worker profile
→ availability
→ location heartbeat
```

Worker-specific operations must use Shafqat's APIs.

Do not add unauthorized cross-team API calls.

------------------------------------------------------------------------

# 7. GIT / COLLABORATION RULES

Every member must:

1.  Work on their assigned branch.
2.  Pull/rebase carefully according to the team's Git workflow.
3.  Inspect changed files before committing.
4.  Avoid unrelated formatting changes.
5.  Avoid modifying another member's files.
6.  Never commit secrets.
7.  Write professional commit messages.
8.  Keep commits logically grouped.
9.  Explain integration dependencies in the PR.
10. Verify tests before pushing.

Before commit:

``` bash
git status
git diff --stat
git diff
```

Then run the project's relevant: - lint - typecheck - unit tests -
integration/E2E tests

Do not commit generated secrets, local `.env` files, or temporary debug
code.

------------------------------------------------------------------------

# 8. ANTI-OVERLAP CHECKLIST

Before completing any task, ask:

### Backend member

-   Is this endpoint explicitly mine?
-   Is this database model explicitly mine?
-   Am I accidentally implementing the other backend's feature?
-   Am I changing a shared contract without coordination?
-   Am I exposing private information?
-   Am I relying on client-side authorization?

### Frontend member

-   Is this screen explicitly mine?
-   Am I using my assigned backend partner?
-   Am I using the shared API client?
-   Am I duplicating authentication logic?
-   Am I accidentally implementing another member's screen?
-   Am I adding backend code?

If the answer indicates scope overlap, stop and follow the ownership
matrix.

------------------------------------end my project------------------------------------

# 9. FINAL ACCEPTANCE CHECKLIST

A Module 1 implementation is ready for sign-off only when:

-   [ ] H1--H8 completed by Hakim
-   [ ] W1--W7 completed by Shafqat
-   [ ] A1--A8 completed by Abdullah
-   [ ] S1--S4 completed by Shehzad
-   [ ] F1--F6 completed by Faizan
-   [ ] OpenAPI slices are available
-   [ ] Generated TypeScript types are consumed by frontends
-   [ ] Auth flow works
-   [ ] OTP limits work
-   [ ] JWT access token expires after 15 minutes
-   [ ] Refresh session lasts 30 days and rotates
-   [ ] Logout invalidates refresh session
-   [ ] RBAC returns 403 for wrong roles
-   [ ] Inactive users cannot authenticate
-   [ ] Customer profile works
-   [ ] Worker profile works
-   [ ] KYC workflow works
-   [ ] Admin verification API works
-   [ ] Suspend/reactivate API works
-   [ ] Avatar uploads work
-   [ ] Worker document uploads work
-   [ ] Worker availability works
-   [ ] Worker location heartbeat works
-   [ ] Rate limits work
-   [ ] Sensitive data is not logged
-   [ ] No secrets are committed
-   [ ] Lint passes
-   [ ] Type checking passes
-   [ ] Relevant tests pass
-   [ ] Team A E2E passes
-   [ ] Team B E2E passes
-   [ ] No unauthorized scope overlap exists

------------------------------------------------------------------------

# 10. IMPORTANT OPENCODE AI EXECUTION INSTRUCTION

When using any member prompt above, **do not immediately start coding
blindly**.

First:

1.  Inspect the repository.
2.  Identify the current architecture.
3.  Identify the exact files relevant to the assigned tasks.
4.  Compare existing implementation with this prompt.
5.  Create a short implementation plan.
6.  Identify dependencies and shared files.
7.  Check for existing work by other team members.
8.  Do not overwrite existing valid work.
9.  Implement incrementally.
10. Run tests/lint/type checks.
11. Review the final diff for scope violations.
12. Summarize:

-   what was implemented
-   files changed
-   APIs added/changed
-   migrations added
-   tests added
-   remaining integration dependencies
-   anything requiring partner/team-lead action

### Critical rule

**Do not fabricate missing project details.**

If the repository does not contain enough information to safely
implement a requirement, inspect the existing project
documentation/configuration first. If the requirement is genuinely
ambiguous and implementing it would risk breaking another member's scope
or contract, stop at the boundary, explain the ambiguity, and identify
exactly what needs confirmation.

### Final principle

Build only what belongs to your assigned owner scope, integrate through
the defined contracts, preserve the existing architecture, and leave the
repository in a state that another team member can safely continue from.
