# Scalability Technologies — HUNAR Backend

This document lists all technologies used for scalability in the HUNAR platform.

## Core Architecture

| Technology | Purpose | Scalability Benefit |
|---|---|---|
| **NestJS (Modular Monolith)** | Backend framework | Clear module boundaries; easy migration to microservices later |
| **TypeScript** | Type-safe JavaScript | Catches errors at compile time; improves maintainability at scale |
| **Prisma ORM** | Database access layer | Connection pooling, type-safe queries, migration management |

## Database Layer

| Technology | Purpose | Scalability Benefit |
|---|---|---|
| **PostgreSQL 16** | Primary relational database | ACID compliance, strong relationships, JSONB support, mature |
| **PostGIS 3.4** | Geospatial extension | Efficient nearby worker matching using GiST indexes |

## Caching & Fast Data

| Technology | Purpose | Scalability Benefit |
|---|---|---|
| **Redis 7 (ioredis)** | In-memory data store | OTP storage, JWT refresh tokens, rate limiting, worker online status, nearby workers cache, Socket.IO pub/sub adapter |

## Real-Time Communication

| Technology | Purpose | Scalability Benefit |
|---|---|---|
| **Socket.IO 4.x** | WebSocket communication | Rooms/namespaces for job-specific channels, Redis adapter for horizontal scaling, long-polling fallback |

## Push Notifications

| Technology | Purpose | Scalability Benefit |
|---|---|---|
| **Firebase Cloud Messaging (FCM)** | Push notifications | Free, cross-platform, topic-based targeting for city/category subscriptions |

## Media Storage

| Technology | Purpose | Scalability Benefit |
|---|---|---|
| **S3-Compatible (MinIO dev / AWS S3 prod)** | Object storage | Offloads large files from DB; CDN-ready; horizontal scaling |

## Maps & Location

| Technology | Purpose | Scalability Benefit |
|---|---|---|
| **Mapbox** | Geocoding, maps, directions | 50K free loads/month; customizable; good Pakistan coverage |

## Payments

| Technology | Purpose | Scalability Benefit |
|---|---|---|
| **JazzCash / Easypaisa / Stripe** | Payment gateways | Pakistan-compatible; compliant providers handle KYC/settlement |
| **PostgreSQL Payment Ledger** | Financial records | Immutable audit trail; tracks commission, payouts, refunds |

## Infrastructure & DevOps

| Technology | Purpose | Scalability Benefit |
|---|---|---|
| **Docker / docker-compose** | Containerization | Consistent environments; easy deployment; orchestration-ready |
| **PostgreSQL Connection Pooling (Prisma)** | DB connection management | Handles concurrent connections efficiently |

## Module Structure (Scalability-Ready)

```
src/modules/
├── auth          # Authentication & authorization
├── users         # User management (customer/worker/admin)
├── jobs          # Service requests & matching
├── offers        # Job offers & negotiation
├── visits        # On-site visits & tracking
├── repair        # Repair proposals & revisions
├── payments      # Payment processing & gateways
├── wallet        # Worker wallet & commission ledger
├── commissions   # Platform commission tracking
├── notifications # FCM + in-app notifications
├── realtime      # Socket.IO gateway & events
├── chat          # Worker-customer messaging
├── reviews       # Ratings & reviews
├── disputes      # Dispute resolution
├── admin         # Admin operations & audit logs
├── location      # Geocoding & service areas
├── search        # Worker/job search
└── uploads       # File upload handling
```

## Scalability Patterns Implemented

1. **Event-Driven Architecture** — `@nestjs/event-emitter` for loose coupling
2. **Redis Adapter for Socket.IO** — Multi-instance real-time scaling
3. **Idempotency Keys** — Wallet ledger operations (Redis + unique DB constraint)
4. **Rate Limiting** — Redis-based (auth, API endpoints)
5. **Background Jobs** — `@nestjs/schedule` for cron tasks
6. **Health Checks** — Built-in NestJS termination signals
7. **Modular Monolith** — Independent modules, shared kernel minimal

## Environment Variables for Scaling

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10

# Redis (cluster-ready)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Socket.IO scaling
REDIS_ADAPTER_ENABLED=true

# Storage
STORAGE_DRIVER=s3  # or minio
AWS_REGION=ap-south-1

# Horizontal scaling
NODE_ENV=production
PORT=4000
```

## Running the Basic App

```bash
cd hunar-backend

# 1. Start dependencies (PostgreSQL + PostGIS + Redis + MinIO)
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run migrations
npm run prisma:migrate

# 5. Seed database
npm run prisma:seed

# 6. Start development server
npm run start:dev
```

## Key Scalability Metrics Targets

| Metric | Target |
|---|---|
| API Response Time (p95) | < 200ms |
| Real-time Latency | < 100ms |
| Concurrent WebSocket Connections | 10,000+ per instance |
| Database Connections | Pooled (max 20 per instance) |
| Redis Operations | < 5ms |
| Horizontal Scaling | Add NestJS instances behind load balancer |

---

*Generated from technology-recommendations.md and package.json*