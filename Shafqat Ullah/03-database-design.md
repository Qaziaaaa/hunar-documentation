# Database Design Proposal — Home Services Platform

**Author:** Shafqat Ullah  
**Document Type:** Database Design Proposal  
**Version:** 1.0  
**Date:** September 1, 2026  
**Status:** Draft — Pending Team Review

---

## 1. Overview

This document proposes the complete database design including technology choice, schema design, indexing strategy, partitioning, backup, and performance considerations.

---

## 2. Database Technology Selection

| Criteria | PostgreSQL | MySQL | MongoDB |
|---|---|---|---|
| ACID Compliance | ✅ Full | ✅ Full | ❌ Limited |
| Geospatial (GIS) | ✅ PostGIS (best) | ⚠️ Basic | ⚠️ Basic |
| JSON Support | ✅ JSONB (indexed) | ⚠️ JSON | ✅ Native |
| Full-text Search | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| Complex Joins | ✅ Excellent | ✅ Good | ❌ Limited |
| Maturity / Ecosystem | ✅ Excellent | ✅ Excellent | ✅ Good |
| Scalability (Read) | ✅ Replicas | ✅ Replicas | ✅ Native |
| Schema Migrations | ✅ Strong tooling | ✅ Good tooling | ⚠️ Flexible but risky |

### Decision: PostgreSQL + PostGIS

**Reasons:**
- PostGIS is the industry standard for geospatial queries
- Native JSONB for flexible data (e.g., negotiation history, item breakdowns)
- Strong data integrity with foreign keys and constraints
- Excellent ecosystem (Prisma, TypeORM, Knex.js)
- Multi-AZ support on AWS RDS for high availability

---

## 3. Additional Data Stores

| Store | Purpose | Why |
|---|---|---|
| **Redis** | Session cache, OTP storage, rate limiting, Socket.IO adapter, real-time pub/sub | Speed, TTL support, pub/sub |
| **Elasticsearch** | Advanced job search, worker search, full-text + geo combined queries | Complex search beyond PostGIS |
| **AWS S3 / MinIO** | Image, voice note, document file storage | Scalable, CDN-integrated |

---

## 4. Schema Design

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
    password_hash   VARCHAR(255),  -- optional, for email login
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
    verification_notes  TEXT,
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

CREATE INDEX idx_sc_parent ON service_categories(parent_id);
CREATE INDEX idx_sc_active ON service_categories(is_active) WHERE is_active = true;
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
                            'open',
                            'offers_received',
                            'offer_accepted',
                            'worker_assigned',
                            'visit_scheduled',
                            'visit_in_progress',
                            'visit_completed',
                            'inspection_done',
                            'repair_negotiating',
                            'repair_approved',
                            'in_progress',
                            'completed',
                            'paid',
                            'reviewed',
                            'cancelled',
                            'disputed'
                        )),
    urgency             VARCHAR(20) DEFAULT 'normal'
                        CHECK (urgency IN ('low', 'normal', 'high', 'emergency')),
    estimated_budget    DECIMAL(10, 2),
    selected_worker_id  UUID REFERENCES users(id),
    cancel_reason       TEXT,
    cancelled_by        UUID REFERENCES users(id),
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
CREATE INDEX idx_sr_urgency ON service_requests(urgency);
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
                            CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(job_id, worker_id)
);

CREATE INDEX idx_jo_job ON job_offers(job_id);
CREATE INDEX idx_jo_worker ON job_offers(worker_id);
CREATE INDEX idx_jo_status ON job_offers(status);
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
                    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    visit_notes     TEXT,
    images          TEXT[] DEFAULT '{}',
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_v_job ON visits(job_id);
CREATE INDEX idx_v_worker ON visits(worker_id);
CREATE INDEX idx_v_scheduled ON visits(scheduled_date);
CREATE INDEX idx_v_status ON visits(status);
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
                            CHECK (status IN ('proposed', 'countered', 'accepted', 'rejected')),
    negotiation_history     JSONB DEFAULT '[]',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_re_visit ON repair_estimates(visit_id);
CREATE INDEX idx_re_status ON repair_estimates(status);
```

### 4.9 Table: payments

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
                    CHECK (method IN ('jazzcash', 'easypaisa', 'stripe', 'cash', 'card')),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    gateway_ref     VARCHAR(255),
    gateway_response JSONB,
    paid_at         TIMESTAMPTZ,
    refunded_at     TIMESTAMPTZ,
    refund_reason   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pay_job ON payments(job_id);
CREATE INDEX idx_pay_customer ON payments(customer_id);
CREATE INDEX idx_pay_worker ON payments(worker_id);
CREATE INDEX idx_pay_status ON payments(status);
CREATE INDEX idx_pay_gateway_ref ON payments(gateway_ref);
```

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
CREATE INDEX idx_rv_rating ON reviews(rating);
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
                    CHECK (channel IN ('push', 'sms', 'in_app', 'email')),
    is_read         BOOLEAN DEFAULT false,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_n_user ON notifications(user_id);
CREATE INDEX idx_n_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_n_created ON notifications(created_at DESC);
CREATE INDEX idx_n_type ON notifications(type);
```

### 4.12 Table: conversations

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

CREATE INDEX idx_conv_job ON conversations(job_id);
CREATE INDEX idx_conv_customer ON conversations(customer_id);
CREATE INDEX idx_conv_worker ON conversations(worker_id);
```

### 4.13 Table: messages

```sql
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

### 4.14 Table: disputes

```sql
CREATE TABLE disputes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES service_requests(id),
    filed_by        UUID NOT NULL REFERENCES users(id),
    reason          VARCHAR(100) NOT NULL,
    description     TEXT NOT NULL,
    evidence_urls   TEXT[] DEFAULT '{}',
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'under_review', 'resolved', 'escalated')),
    resolution      TEXT,
    resolved_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_disp_job ON disputes(job_id);
CREATE INDEX idx_disp_status ON disputes(status);
```

### 4.15 Table: location_tracking

```sql
CREATE TABLE location_tracking (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    job_id          UUID REFERENCES service_requests(id),
    latitude        DECIMAL(10, 8) NOT NULL,
    longitude       DECIMAL(11, 8) NOT NULL,
    accuracy        FLOAT,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lt_user ON location_tracking(user_id);
CREATE INDEX idx_lt_job ON location_tracking(job_id);
CREATE INDEX idx_lt_time ON location_tracking(recorded_at DESC);

-- Partition by month for performance
-- (Implementation: create partitioned table in production)
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
| `pubsub:job:{jobId}` | Channel | — | Real-time job updates |

---

## 6. Indexing Strategy

### 6.1 Principles

1. **Index all foreign keys** — FK columns used in JOINs
2. **Index status columns** — filtered in WHERE clauses
3. **Index timestamp columns** — used in ORDER BY and range queries
4. **GIN indexes** — for array columns (skills) and JSONB
5. **GiST indexes** — for PostGIS geometry columns
6. **Partial indexes** — for boolean flags with low cardinality (is_active, is_read)

### 6.2 Query Patterns → Indexes

| Query Pattern | Index Needed |
|---|---|
| "Find nearby jobs for worker" | GiST on `service_requests.location` |
| "Find workers with skill X in area" | GIN on `worker_profiles.skills` + location |
| "Get open jobs in city" | Composite on `(city, status, created_at)` |
| "Get offers for a job" | On `job_offers(job_id)` |
| "Unread notifications" | Partial on `notifications(user_id, created_at) WHERE is_read = false` |
| "Worker's active jobs" | On `service_requests(selected_worker_id, status)` |

---

## 7. Data Partitioning

### 7.1 Tables Requiring Partitioning

| Table | Partition Key | Strategy | Reason |
|---|---|---|---|
| `location_tracking` | `recorded_at` | Monthly range | High volume, time-series data |
| `notifications` | `created_at` | Monthly range | High volume, old data rarely accessed |
| `messages` | `created_at` | Monthly range | High volume for active conversations |

### 7.2 Partition Example (location_tracking)

```sql
CREATE TABLE location_tracking (
    ...
) PARTITION BY RANGE (recorded_at);

CREATE TABLE location_tracking_2026_09 PARTITION OF location_tracking
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE location_tracking_2026_10 PARTITION OF location_tracking
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
```

---

## 8. Backup & Recovery

| Strategy | Frequency | Retention |
|---|---|---|
| **RDS Automated Backups** | Daily | 30 days |
| **Transaction Log Shipping** | Continuous (5 min) | Point-in-time recovery |
| **Manual Snapshot** | Before major deployments | 7 days |
| **Cross-Region Backup** | Weekly | 90 days |

### Recovery Targets

| Metric | Target |
|---|---|
| **RPO (Recovery Point Objective)** | < 5 minutes |
| **RTO (Recovery Time Objective)** | < 30 minutes |

---

## 9. Performance Considerations

### 9.1 Connection Pooling

| Tool | Configuration |
|---|---|
| **PgBouncer** | Transaction pooling mode |
| **Max connections** | 100 (PgBouncer) → 20 (PostgreSQL) |
| **Idle timeout** | 300 seconds |

### 9.2 Query Optimization

| Technique | When to Use |
|---|---|
| **EXPLAIN ANALYZE** | Every new query during development |
| **Materialized Views** | Worker ratings aggregation, city-wise stats |
| **Read Replicas** | Separate read-heavy queries (search, analytics) |
| **Cursor Pagination** | Instead of OFFSET for large result sets |

### 9.3 Caching Strategy (Redis)

| Data | Cache Duration | Invalidation |
|---|---|---|
| User profile | 5 min | On profile update |
| Service categories | 1 hour | On admin change |
| Worker ratings | 10 min | On new review |
| Nearby workers (geo) | 2 min | On location update |
| Job offer count | Real-time | On new offer |

---

## 10. Migration Strategy

### 10.1 Tool: Prisma Migrate (recommended)

```
prisma/migrations/
├── 20260901_init/
│   └── migration.sql
├── 20260905_add_worker_profiles/
│   └── migration.sql
├── 20260910_add_payments/
│   └── migration.sql
└── ...
```

### 10.2 Migration Rules

1. Never modify production data in migrations without backup
2. All migrations must be reversible (up + down)
3. Test migrations on staging before production
4. Large data migrations run in background jobs
5. Schema changes use `ALTER TABLE` with minimal locking

---

## 11. Seed Data

### 11.1 Service Categories (seed script)

```sql
INSERT INTO service_categories (name, name_urdu, sort_order) VALUES
('Electrical', 'الیکٹریکل', 1),
('Plumbing', 'پلمبرنگ', 2),
('AC & Refrigeration', 'ای سی اور ریفریجریٹر', 3),
('Carpentry', 'لکڑ کا کام', 4),
('Painting', 'پینٹنگ', 5),
('Cleaning', 'صفائی', 6),
('Masonry', 'ritos', 7),
('Pest Control', 'کیڑے مار دوا', 8),
('General Handyman', 'عمومی مہارت', 9);
```

---

## 12. Estimated Storage

| Table | Estimated Rows (Year 1) | Avg Row Size | Storage |
|---|---|---|---|
| users | 50,000 | 500 B | 25 MB |
| worker_profiles | 20,000 | 800 B | 16 MB |
| service_requests | 100,000 | 2 KB | 200 MB |
| job_offers | 300,000 | 400 B | 120 MB |
| visits | 100,000 | 600 B | 60 MB |
| payments | 100,000 | 800 B | 80 MB |
| reviews | 80,000 | 500 B | 40 MB |
| notifications | 2,000,000 | 300 B | 600 MB |
| messages | 5,000,000 | 400 B | 2 GB |
| location_tracking | 50,000,000 | 200 B | 10 GB |
| **Total** | | | **~13 GB** |

> **Note:** With partitioning and archival of old data, active data will be much smaller.

---

*Document prepared by Shafqat Ullah — Pending review by Qazi Farhan Ahmad (Team Lead)*
