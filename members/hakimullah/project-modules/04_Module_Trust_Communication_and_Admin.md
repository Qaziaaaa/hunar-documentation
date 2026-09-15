# Module 4 — Trust, Communication & Administration

## Purpose of This Module
Everything that builds trust and keeps the platform safe and running — reviews & ratings, real-time chat, multi-channel notifications, disputes & support, the full admin panel, plus every **cross-cutting** concern: security, performance, usability, i18n, PWA, testing, deployment, monitoring, and coding standards.

**Covers requirements:** FR-16 (ratings/reviews), FR-17 (customer–worker chat), FR-13 (admin controls), FR-14 (suspend/deactivate — reviewed here, applied in Module 1), the SRS admin/audit & security items, plus all non-functional requirements (NFRs) from SRS §7, the tech-recommendation NFRs, and the design/l10n/PWA requirements from the frontend stack doc.

**Depends on:** Module 1 (users/roles), Module 2 (job events to react to), Module 3 (payments/disputes money-hold).

---

## 1. Reviews & Ratings (FR-16)

### 1.1 When reviews are possible
- Only after a job is **completed and paid**.
- **Both parties review each other** (dual review) — worker rates the customer too.
- Available for **7 days** after completion; verified within that window.
- One review per person per job (`UNIQUE(job_id, reviewer_id)`); duplicates rejected.

### 1.2 Review content
| Field | Notes |
|---|---|
| job_id | FK |
| reviewer_id / reviewee_id | FK users |
| rating | INTEGER **1–5** (DB stores integers; UI may display half-stars) |
| comment | Optional text |
| images | Optional photo evidence |
| is_visible | Boolean; hidden if flagged |
| created_at | |

### 1.3 Rating recalculation
- On each new review: recalculate `worker_profiles.rating_avg` and increment `rating_count`.
- Also maintain `total_jobs`, **positive feedback percentage**, and completed-jobs counter on the public profile.
- Ranking of workers in Module 2 sorts by rating → review count → completed jobs.

### 1.4 Review tags (optional enhancement)
Worker-rated customer tags: "Courteous", "Prompt Payment", "Accurate Description". Customer-rated worker quality tags also supported.

### 1.5 Moderation
- Reviews are public by default.
- Anyone can **flag** (`/reviews/:id/flag`) an inappropriate review.
- Flagged reviews are **hidden until admin resolves**.
- Reviews are immutable once submitted (no editing).

---

## 2. Chat & Messaging (FR-17)

### 2.1 Lifecycle
- A conversation **is created automatically when an offer is accepted** (1 conversation per job: `UNIQUE(job_id)`).
- Participants: customer + worker only. Realtime via **Socket.IO**.

### 2.2 Message types
| Type | Notes |
|---|---|
| Text | Plain text |
| Image | Uploaded via file service |
| Voice note | wavesurfer.js recorder (frontend), OGG/M4A/WAV ≤ 10 MB |

### 2.3 Socket events
| Event | Direction | Payload |
|---|---|---|
| `chat:join` | Client → Server | `{ conversationId }` |
| `chat:message` | Server → Client | `{ conversationId, message }` |
| `chat:typing` / `chat:stopTyping` | Both | `{ conversationId }` |
| `chat:read` | Client → Server | `{ conversationId, messageId }` |

### 2.4 Read/unread & history
- Unread count per conversation → **badge** on sidebar/chat list.
- Messages stored in PostgreSQL (`messages` table, indexed by `conversation_id` + `created_at`), paginated history; optional sync to Elasticsearch.
- **Privacy benefit vs SMS/raw phone:** numbers stay hidden until both sides are matched; chat history is preserved inside the platform.

### 2.5 Chat downtime backup
If the WebSocket is down: fall back to long-polling (Socket.IO handles this), and message history remains available via REST once connectivity returns.

---

## 3. Notifications

### 3.1 Channels
| Channel | Used for | Tech |
|---|---|---|
| **Push** | Background alerts when app inactive | FCM via `firebase-admin`; subscribe workers to **city/category topics**; batch push for new-job alerts |
| **In-App** | Everything real-time; stored in DB (bell icon, unread count) | Socket.IO + PostgreSQL `notifications` |
| **SMS** | OTP, critical account alerts | Twilio / local Pakistani provider |
| **Email** | Welcome, receipts (future) | Provider of choice |

### 3.2 Notification types (full list from ER design)
`job.new`, `job.offer_received`, `job.offer_accepted`, `job.offer_rejected`, `visit.scheduled`, `visit.reminder` (24h before), `visit.completed`, `repair.proposed`, `repair.negotiated`, `repair.approved`, `payment.completed`, `review.received`, `dispute.opened`, `dispute.resolved`, `system.verification`.

### 3.3 Rules
- Trigger→recipient→channel mapping is centralized in the Notifications module (`templates/`).
- **Idempotent** — retries must not create duplicates (SRS FR-09).
- Preferences: users can **opt out of promotional** notifications; OTP/security ones cannot be disabled.
- Endpoints: `GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all`, `GET /notifications/unread-count`.

---

## 4. Disputes & Support

### 4.1 When a dispute can be filed
Work not done properly • worker no-show • customer refuses to pay (after work) • property damage • wrong location provided • safety concerns • harassment.

### 4.2 Status machine
`open → under_review → resolved`  |  `escalated` (if unresolved / legal risk)

### 4.3 Process
1. Filers pick a reason + description (+ optional `evidence_urls`: photos, chat).
2. Admin notified; job moves to `disputed` (if still `in_progress`/`completed`).
3. Admin reviews chat history, inspection images, repair photos, both sides.
4. Admin decides: refund (partial/full/none), require worker to finish/fix, warn or suspend, or release funds.
5. Both parties notified; outcome logged for **audit**.
6. **SLA ambition:** keep resolution time bounded and visible to both sides (delay risk documented — long cases frustrate users and hold funds).

### 4.4 Money during dispute
- **Model B (escrow):** funds held until resolution (prevents premature payout).
- **Model A:** no customer hold; dispute concerns behavior/quality; resolution actions + protection rules apply to worker wallet/evaluation.

---

## 5. Admin Panel & Operations (FR-13, FR-14)

### 5.1 Dashboard metrics
Total users / workers • active jobs • completed jobs • total revenue • pending verifications • active disputes • recent activity (latest jobs, payments, registrations). All analytics **aggregated daily and cached**.

### 5.2 User & worker management
| Action | Notes |
|---|---|
| View all users (filterable, searchable) | By role, status, city, date |
| User detail | Profile + job history + reviews + payments |
| Suspend / deactivate / reactivate | FR-14; soft state; history preserved |
| Flag accounts | Companion to disputes |
| **Audit** | All critical admin actions logged with actor/action/entity/timestamp |

### 5.3 Verification queue (worker)
Pending list → view profile + ID docs → **Approve / Reject / Request changes** → worker notified (`system.verification`). (State changes apply in Module 1.)

### 5.4 Category management
Create / edit / disable service categories (soft delete; existing jobs keep references).

### 5.5 System & commission settings
| Setting | Required role |
|---|---|
| Commission rate (default 10% or 15%, per category optional) | Super Admin |
| Wallet online threshold (default -500) | Super Admin |
| OTP expiry, rate limits | Super Admin |
| Negotiation round limit (default 5) | Super Admin |
| Visit-scheduling window (default 48h) | Super Admin |
| Maintenance mode toggle | Super Admin |

### 5.6 Reports & analytics
Revenue over time • jobs by category • worker performance (completed jobs, avg rating, cancellation rate) • geographic heatmap • user growth.

---

## 6. Security (Platform-Wide)

| Layer | Measures |
|---|---|
| Network | VPC, security groups, WAF, DDoS protection, TLS 1.3/HTTPS everywhere |
| Authentication | OTP + JWT + refresh rotation; bcrypt for admin passwords |
| Rate limiting | `@nestjs/throttler`: OTP, login, registration, job posting, messaging, payment initiation, file upload |
| Data validation | `class-validator` DTOs before any logic; query/route-param validation; centralized error responses; no stack traces in prod |
| Authorization | Server-side RBAC on every route; private records ownership-checked (SRS FR — unauthorized private access → 403, no leakage) |
| Secrets | `.env` gitignored (`node_modules`, `dist`, `*.log` too); `.env.example` with placeholders; no API keys/passwords/tokens committed |
| File uploads | Type + size validation server-side, pre-signed S3 URLs, CDN serving, virus scan (optional) |
| Payments | Webhook signature verification; provider records as truth; no card credentials ever stored; idempotency keys |
| Logging | `nestjs-pino` + `pino`; **never log passwords, tokens, or unnecessary payment secrets** |
| Sensitive fields | Phone numbers/bank details protected; least-privilege DB roles |

### Security incident response
Documented plan for possible data breach (phone numbers, bank details) — legal liability + reputation protection per `platform-questions-and-risks.md` (#45).

---

## 7. Non-Functional Requirements (SRS §7 + design)

| Area | Target |
|---|---|
| **Performance** | Common API requests **~500ms** (provider latency excluded); pages respond fast; images delivered via CDN, thumbnails (150/600/1200px via Sharp); Redis caches hot reads; job posting <60s |
| **Availability** | 99.9% target; `GET /api/health` health checks; **Redis failover plan** — workers' online status falls back to DB heartbeat staleness, app still works |
| **Usability** | 3 design laws (Radical Simplicity, Visual Calm, Effortless Flow); max 1 Primary button/screen; no dead ends (every empty state has a next step) |
| **Responsive** | Mobile bottom nav (Home, Search, Post, Messages, Profile); tablet single column; desktop 2-column max-width 1200px; touch targets ≥44px; no hover on mobile |
| **Accessibility** | Keyboard-friendly (Radix/shadcn), readable contrast, labeled inputs, clear validation messages |
| **Localization** | `/en` + `/ur` routes (next-intl), auto `dir` rtl/ltr, language toggle + persisted cookie |
| **PWA** | Service worker offline shell, Add-to-Home-Screen prompt, works on slow internet (Pakistan) |
| **Reliability** | Idempotency for booking/payment/notification creation; state transitions backend-validated; soft-deletes preserve history |
| **Observability** | Request failures, workflow events, payment events, critical admin actions logged; structured logs |
| **Maintainability** | Modular monolith, consistent naming, centralized validation/error handling, documentation |

---

## 8. Testing & QA

| Type | Scope |
|---|---|
| **Unit** | Validation, permission rules, state transitions, pricing/fee calc, utilities |
| **API (Supertest)** | Register, login, auth, job create/update, offer submit/select, booking states, payment states, review creation |
| **Integration** | Full 10-step workflow: register customer → register worker → verify worker → create job → worker quotes → customer selects → booking → payment → completion → review |
| **Frontend** | Forms, protected routes, role-based UI, quote selection, status display, payment states, error handling |
| **Negative** | Unauthorized access, invalid transitions, duplicate requests, duplicate reviews, expired tokens, payment-callback replay, invalid webhook signatures |
| **Pilot acceptance** | Test accounts (customer/worker/admin) complete the whole journey end-to-end |

Stack: **Jest + Supertest + @faker-js/faker + @nestjs/testing**; seed scripts create test users/jobs/reviews.

---

## 9. Deployment, Environments & Operations

### 9.1 Environments
| Env | Purpose | Infra |
|---|---|---|
| Development | Local dev | Docker Compose: PostgreSQL + Redis + MinIO |
| Staging | Pre-production | Smaller cloud setup |
| Production | Live | Full, Multi-AZ |

### 9.2 Production shape
```
DNS → CDN/CloudFront → WAF → ALB → ECS/EC2 (NestJS)
                         ↓
              PostgreSQL RDS (Multi-AZ) + PostGIS
              Redis (ElastiCache)
              S3 object storage
              FCM · Socket.IO · Payment gateway webhooks
```

### 9.3 Operations
- Backups: RDS daily (30d), continuous transaction logs (RPO<5min, RTO<30min), snapshots before major deploys, cross-region weekly.
- Partitioning: `location_tracking`, `notifications`, `messages` monthly; auto-delete old location rows (>90 days).
- Monitoring: CloudWatch/Datadog (metrics+alarms), Sentry (errors), Prometheus+Grafana, PagerDuty on-call, ELK logs.
- CI: lint + tests + build on every PR before deploy.
- Secrets in env vars only; `.env` never committed.

### 9.4 Coding standards (repo discipline — see `CODING_STANDARDS.md`)
- Naming: camelCase vars/functions, PascalCase components/classes, UPPER_SNAKE case constants; kebab-case files/folders.
- **Conventional commits** (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`); branch naming `type/short-description`.
- Prettier (2 spaces, single quotes, semicolons) + ESLint; enforce on CI.
- PRs reviewed by ≥1 teammate, build/lint/test green, no secrets/debug leftovers.
- Comments explain **why**; remove commented-out code.

---

## 10. Backend Endpoints (This Module)

`src/modules/reviews`, `chat`, `notifications`, `disputes`, `admin`:

| Resource | Endpoints |
|---|---|
| Reviews | `POST /api/v1/jobs/:jobId/review` · `GET /api/v1/jobs/:jobId/reviews` · `GET /api/v1/users/:id/reviews` · `POST /api/v1/reviews/:id/flag` |
| Chat | `GET /api/v1/chat/conversations` · `GET /api/v1/chat/:convId/messages` · `POST /api/v1/chat/:convId/messages` · `PUT /api/v1/chat/:convId/read` |
| Notifications | `GET /api/v1/notifications` · `PUT /api/v1/notifications/:id/read` · `PUT /api/v1/notifications/read-all` · `GET /api/v1/notifications/unread-count` |
| Disputes | `POST /api/v1/disputes` · `GET /api/v1/disputes/:id` · `PUT /api/v1/disputes/:id/resolve` |
| Admin | `GET /api/v1/admin/dashboard` · `GET /api/v1/admin/users` · `PUT /api/v1/admin/users/:id/toggle` · `GET /api/v1/admin/verifications/pending` · `PUT /api/v1/admin/verifications/:userId` · `GET /api/v1/admin/disputes` · `PUT /api/v1/admin/settings/commission` · `GET /api/v1/admin/analytics` · `GET /api/v1/admin/ledger` |
| Health | `GET /api/v1/health` (DB connected check) |

Data tables: `reviews`, `conversations`, `messages`, `notifications` (partitioned), `disputes`. Admin queries aggregated + cached in Redis.

---

## 11. Frontend Screens (This Module)

### Customer & worker
| Screen | Description |
|---|---|
| Chat | WhatsApp-style: header (photo, name, 🟢 Online), teal own-bubbles / white other-bubbles, timestamps, voice player, image viewer |
| Reviews | Give rating + optional tags + photos; view my reviews and reviews on me |
| Notifications | List with unread styling; click navigates to the related record |

### Admin
| Screen | Description |
|---|---|
| Dashboard | Stats cards + recent activity + alert queues (verifications, disputes) |
| Users / Workers | Filterable tables, search, view detail, suspend/reactivate, flag |
| Verification queue | Approve / Reject / Request changes |
| Categories | Create/edit/disable |
| Disputes | List + detail with evidence, chat log, timeline; resolve with outcome + reason |
| Settings | Commission, thresholds, rate limits, maintenance toggle |
| Reports | Charts (revenue, category mix, worker performance, heatmap, growth) |
| Audit | Searchable log of critical admin actions |

---

## 12. Acceptance Criteria (MVP)
- [ ] Customer and worker exchange text/image/voice messages in real time with read indicators and unread badges.
- [ ] After a paid job both parties can review within 7 days; rating_avg updates; duplicates rejected.
- [ ] Flagged reviews are hidden until admin action.
- [ ] Every job event triggers a correct notification on the right channel; duplicates prevented.
- [ ] Admin sees dashboard stats, can verify or suspend users, resolve disputes, and view audit trail.
- [ ] All admin actions that matter are logged (actor/action/entity/time).
- [ ] Protected endpoints enforce auth + RBAC; private records are ownership-checked.
- [ ] Rate limits stop OTP/message/payment spam.
- [ ] Platform works mobile/tablet/desktop, is bilingual (en/ur with RTL), and PWA-offline usable.
- [ ] Health endpoint + monitoring surface failures; no secrets in logs.