# Database Design Proposal — Fixora (PostgreSQL + PostGIS)

**Author:** Shafqat Ullah  
**Document Type:** Database Design Proposal  
**Version:** 3.0  
**Date:** September 2, 2026  
**Status:** Draft — Pending Team Review

> **Note:** This aligns with the team-approved **Fixora stack**: **PostgreSQL + PostGIS** as the primary database, with **Redis** for cache/fast data. The database is relational — tables and columns below map directly to the ER diagram and the NestJS backend modules.

---

## 1. Overview

This document proposes the complete PostgreSQL database design including schema, indexing strategy, PostGIS geospatial setup, partitioning, backup, and performance considerations for Fixora (Home Services Platform).

---

## 2. Database Technology Selection

| Criteria | **PostgreSQL + PostGIS** | MongoDB | MySQL |
|---|---|---|---|
| ACID Compliance | ✅ Full | ✅ (limited) | ✅ Full |
| Geospatial (GIS) | ✅ PostGIS (best) | ⚠️ Basic | ⚠️ Basic |
| JSON Support | ✅ JSONB (indexed) | ✅ Native | ⚠️ JSON |
| Full-text Search | ✅ Built-in | ⚠️ Basic | ✅ Built-in |
| Complex Joins / Relations | ✅ Excellent | ❌ Limited | ✅ Good |
| Referential Integrity (FK) | ✅ Strong | ❌ Weak | ✅ Strong |
| Maturity / Ecosystem | ✅ Excellent | ✅ Good | ✅ Excellent |
| Cost | ✅ Free | ✅ Free | ✅ Free |

### Decision: PostgreSQL + PostGIS

**Reasons:**
- **Strong relationships** — Fixora data is highly connected: `User → Job → Worker → Payment → Review`. PostgreSQL enforces referential integrity with foreign keys.
- **PostGIS** — best-in-class geospatial for nearby-worker matching (`ST_DWithin`).
- **JSONB** — stores flexible data (negotiation_history, items_breakdown, skills[]).
- **ACID** — reliable transactions for payments and disputes.
- **Team-approved** — the Fixora stack explicitly chose PostgreSQL + PostGIS.

---

## 3. Additional Data Stores

| Store | Purpose | Why |
|---|---|---|
| **Redis** | Session cache, OTP storage, rate limiting, Socket.IO adapter, real-time pub/sub | Speed, TTL support, pub/sub |
| **Elasticsearch (optional)** | Advanced search, full-text + geo combined | Only if search complexity grows |
| **S3 / MinIO** | Image, voice note, document file storage | Scalable, CDN-integrated |

---

## 4. Schema Design (SQL)

### 4.1 Table: users

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(20) NOT NULL UNIQUE,
    email           VARCHAR(255) UNIQUE,
    name            VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'customer'
                    CHECK (role IN ('customer', 'worker', 'admin', 'super_admin')),
    avatar_url      TEXT,
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    fcm_token       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_location ON users(latitude, longitude);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
```

### 4.2 Table: worker_profiles

```sql
CREATE TABLE worker_profiles (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    skills              TEXT[] NOT NULL DEFAULT '{}',
    experience_years    INTEGER DEFAULT 0,
    bio                 TEXT,
    hourly_rate         DECIMAL(10, 2),
    is_verified         BOOLEAN DEFAULT false,
    verification_doc_url TEXT,
    rating_avg          DECIMAL(3, 2) DEFAULT 0.00,
    rating_count        INTEGER DEFAULT 0,
    total_jobs          INTEGER DEFAULT 0,
    total_earnings      DECIMAL(12, 2) DEFAULT 0.00,
    is_available        BOOLEAN DEFAULT true,
    service_radius_km   INTEGER DEFAULT 10,
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wp_skills ON worker_profiles USING GIN(skills);
CREATE INDEX idx_wp_verified ON worker_profiles(is_verified) WHERE is_verified = true;
CREATE INDEX idx_wp_available ON worker_profiles(is_available) WHERE is_available = true;
CREATE INDEX idx_wp_rating ON worker_profiles(rating_avg DESC);
```

### 4.3 Table: customer_profiles

```sql
CREATE TABLE customer_profiles (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_address     TEXT,
    default_latitude    DECIMAL(10, 8),
    default_longitude   DECIMAL(11, 8),
    total_jobs_posted   INTEGER DEFAULT 0,
    total_spent         DECIMAL(12, 2) DEFAULT 0.00,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.4 Table: service_categories

```sql
CREATE TABLE service_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    name_urdu       VARCHAR(100),
    description     TEXT,
    icon_url        TEXT,
    parent_id       UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT true,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.5 Table: service_requests (Jobs)

```sql
CREATE TABLE service_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         UUID NOT NULL REFERENCES users(id),
    category_id         UUID NOT NULL REFERENCES service_categories(id),
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    voice_note_url      TEXT,
    images              TEXT[] DEFAULT '{}',
    latitude            DECIMAL(10, 8) NOT NULL,
    longitude           DECIMAL(11, 8) NOT NULL,
    address             TEXT NOT NULL,
    city                VARCHAR(100) NOT NULL,
    area                VARCHAR(100),
    status              VARCHAR(30) NOT NULL DEFAULT 'open'
                        CHECK (status IN (
                            'open','offers_received','offer_accepted','worker_assigned',
                            'visit_scheduled','visit_in_progress','visit_completed',
                            'inspection_done','repair_negotiating','repair_approved',
                            'in_progress','completed','paid','reviewed','cancelled','disputed'
                        )),
    urgency             VARCHAR(20) DEFAULT 'normal'
                        CHECK (urgency IN ('low','normal','high','emergency')),
    estimated_budget    DECIMAL(10, 2),
    selected_worker_id  UUID REFERENCES users(id),
    cancel_reason       TEXT,
    cancelled_at        TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PostGIS geometry column for geospatial queries
ALTER TABLE service_requests ADD COLUMN location GEOMETRY(POINT, 4326);
UPDATE service_requests SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);
CREATE INDEX idx_sr_location_gist ON service_requests USING GIST(location);

CREATE INDEX idx_sr_customer ON service_requests(customer_id);
CREATE INDEX idx_sr_category ON service_requests(category_id);
CREATE INDEX idx_sr_status ON service_requests(status);
CREATE INDEX idx_sr_city_area ON service_requests(city, area);
CREATE INDEX idx_sr_created ON service_requests(created_at DESC);
```

### 4.6 Table: job_offers

```sql
CREATE TABLE job_offers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id                  UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    worker_id               UUID NOT NULL REFERENCES users(id),
    visit_charge            DECIMAL(10, 2) NOT NULL,
    message                 TEXT,
    estimated_repair_cost   DECIMAL(10, 2),
    status                  VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','accepted','rejected','withdrawn')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(job_id, worker_id)
);

CREATE INDEX idx_jo_job ON job_offers(job_id);
CREATE INDEX idx_jo_worker ON job_offers(worker_id);
```

### 4.7 Table: visits

```sql
CREATE TABLE visits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES service_requests(id),
    worker_id       UUID NOT NULL REFERENCES users(id),
    offer_id        UUID NOT NULL REFERENCES job_offers(id),
    scheduled_date  TIMESTAMPTZ NOT NULL,
    actual_date     TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','in_progress','completed','cancelled','no_show')),
    visit_notes     TEXT,
    images          TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.8 Table: repair_estimates

```sql
CREATE TABLE repair_estimates (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id                UUID NOT NULL REFERENCES visits(id),
    worker_id               UUID NOT NULL REFERENCES users(id),
    description             TEXT NOT NULL,
    amount                  DECIMAL(10, 2) NOT NULL,
    items_breakdown         JSONB DEFAULT '[]',
    status                  VARCHAR(20) NOT NULL DEFAULT 'proposed'
                            CHECK (status IN ('proposed','countered','accepted','rejected')),
    negotiation_history     JSONB DEFAULT '[]',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.9 Table: payments (Payment Ledger)

```sql
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES service_requests(id),
    customer_id     UUID NOT NULL REFERENCES users(id),
    worker_id       UUID NOT NULL REFERENCES users(id),
    amount          DECIMAL(10, 2) NOT NULL,
    platform_fee    DECIMAL(10, 2) NOT NULL,
    worker_payout   DECIMAL(10, 2) NOT NULL,
    method          VARCHAR(30) NOT NULL
                    CHECK (method IN ('jazzcash','easypaisa','stripe','cash','card')),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed','refunded')),
    gateway_ref     VARCHAR(255),
    gateway_response JSONB,
    paid_at         TIMESTAMPTZ,
    refunded_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pay_job ON payments(job_id);
CREATE INDEX idx_pay_status ON payments(status);
CREATE INDEX idx_pay_gateway_ref ON payments(gateway_ref);
```

> **Note:** This `payments` table is Fixora's **Payment Ledger** stored in PostgreSQL.

### 4.10 Table: reviews

```sql
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES service_requests(id),
    reviewer_id     UUID NOT NULL REFERENCES users(id),
    reviewee_id     UUID NOT NULL REFERENCES users(id),
    rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    images          TEXT[] DEFAULT '{}',
    is_visible      BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(job_id, reviewer_id)
);

CREATE INDEX idx_rv_job ON reviews(job_id);
CREATE INDEX idx_rv_reviewee ON reviews(reviewee_id);
```

### 4.11 Table: notifications

```sql
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    body            TEXT NOT NULL,
    data            JSONB DEFAULT '{}',
    channel         VARCHAR(20) NOT NULL
                    CHECK (channel IN ('push','sms','in_app','email')),
    is_read         BOOLEAN DEFAULT false,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_n_user ON notifications(user_id);
CREATE INDEX idx_n_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_n_created ON notifications(created_at DESC);
```

### 4.12 Table: conversations & messages

```sql
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES service_requests(id),
    customer_id     UUID NOT NULL REFERENCES users(id),
    worker_id       UUID NOT NULL REFERENCES users(id),
    last_message    TEXT,
    last_message_at TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(job_id)
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    text            TEXT,
    image_url       TEXT,
    voice_url       TEXT,
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_msg_conv ON messages(conversation_id);
CREATE INDEX idx_msg_created ON messages(created_at DESC);
```

### 4.13 Table: disputes

```sql
CREATE TABLE disputes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES service_requests(id),
    filed_by        UUID NOT NULL REFERENCES users(id),
    reason          VARCHAR(100) NOT NULL,
    description     TEXT NOT NULL,
    evidence_urls   TEXT[] DEFAULT '{}',
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','under_review','resolved','escalated')),
    resolution      TEXT,
    resolved_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);
```

### 4.14 Table: location_tracking

```sql
CREATE TABLE location_tracking (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    job_id          UUID REFERENCES service_requests(id),
    latitude        DECIMAL(10, 8) NOT NULL,
    longitude       DECIMAL(11, 8) NOT NULL,
    accuracy        FLOAT,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

CREATE INDEX idx_lt_user ON location_tracking(user_id);
CREATE INDEX idx_lt_time ON location_tracking(recorded_at DESC);
```

---

## 5. Redis Data Structures

| Key Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `otp:{phone}` | String | 5 min | OTP verification |
| `session:{userId}` | Hash | 30 days | Active session data |
| `rate:{ip}:{endpoint}` | String | 1 min | Rate limiting counter |
| `job:offers:{jobId}` | Sorted Set | — | Cached offer count |
| `worker:online:{userId}` | String | 5 min (heartbeat) | Online status |
| `worker:location:{userId}` | Hash | — | Real-time worker location |
| `nearby:workers:{city}` | Geo | — | Worker geo-indexed locations |
| `socket:user:{userId}` | String | — | Socket connection mapping |

---

## 6. Indexing Strategy

1. **Index all foreign keys** — used in JOINs
2. **Index status columns** — filtered in WHERE clauses
3. **Index timestamp columns** — used in ORDER BY / range queries
4. **GIN indexes** — for arrays (`skills`) and JSONB
5. **GiST indexes** — for PostGIS geometry columns
6. **Partial indexes** — for boolean flags (`is_active`, `is_read`)

### Query Patterns → Indexes

| Query Pattern | Index Needed |
|---|---|
| "Find nearby jobs for worker" | GiST on `service_requests.location` |
| "Find workers with skill X in area" | GIN on `worker_profiles.skills` + location |
| "Get open jobs in city" | Composite on `(city, status, created_at)` |
| "Get offers for a job" | On `job_offers(job_id)` |
| "Unread notifications" | Partial on `notifications(user_id, created_at) WHERE is_read = false` |

---

## 7. PostGIS Nearby-Worker Query

```sql
SELECT
    u.id, u.name, u.avatar_url,
    wp.rating_avg, wp.skills,
    ST_Distance(
        wp.location::geography,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
    ) AS distance_meters
FROM users u
JOIN worker_profiles wp ON wp.user_id = u.id
WHERE
    u.is_active = true
    AND wp.is_verified = true
    AND wp.is_available = true
    AND wp.skills && ARRAY[:categoryId]
    AND ST_DWithin(
        wp.location::geography,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
        :radiusMeters
    )
ORDER BY distance_meters ASC
LIMIT 50;
```

---

## 8. Data Partitioning

| Table | Partition Key | Strategy | Reason |
|---|---|---|---|
| `location_tracking` | `recorded_at` | Monthly range | High volume, time-series |
| `notifications` | `created_at` | Monthly range | High volume |
| `messages` | `created_at` | Monthly range | High volume |

---

## 9. Backup & Recovery

| Strategy | Frequency | Retention |
|---|---|---|
| **RDS Automated Backups** | Daily | 30 days |
| **Transaction Log Shipping** | Continuous (5 min) | Point-in-time recovery |
| **Manual Snapshot** | Before major deployments | 7 days |
| **Cross-Region Backup** | Weekly | 90 days |

**Recovery Targets:** RPO < 5 min, RTO < 30 min.

---

## 10. ORM Choice (NestJS)

| ORM | Why |
|---|---|
| **Prisma** (recommended) | Type-safe, great migrations, TypeScript-first, PostGIS support |
| TypeORM | Decorator-based, mature |
| Knex.js | Lower-level SQL builder |

> **Recommendation:** Use **Prisma** with NestJS for type-safe PostgreSQL access.

---

## 11. Seed Data — Service Categories

```sql
INSERT INTO service_categories (name, name_urdu, sort_order) VALUES
('Electrical', 'الیکٹریکل', 1),
('Plumbing', 'پلمبرنگ', 2),
('AC & Refrigeration', 'ای سی اور ریفریجریٹر', 3),
('Carpentry', 'لکڑ کا کام', 4),
('Painting', 'پینٹنگ', 5),
('Cleaning', 'صفائی', 6),
('Masonry', 'دھاتی', 7),
('Pest Control', 'کیڑے مار دوا', 8),
('General Handyman', 'عمومی مہارت', 9);
```

---

*Document prepared by Shafqat Ullah — Pending review by Qazi Farhan Ahmad (Team Lead)*
