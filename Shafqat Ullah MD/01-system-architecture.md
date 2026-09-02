# System Architecture — Home Services Platform (MERN Web)

**Author:** Shafqat Ullah  
**Document Type:** System Architecture Design  
**Version:** 2.0  
**Date:** September 2, 2026  
**Status:** Draft — Pending Team Review

---

## 1. Overview

This document defines the overall system architecture for the Home Services Platform — a **MERN-stack website** (MongoDB, Express.js, React, Node.js) that connects customers who need home repair/maintenance services with verified workers (electricians, plumbers, AC technicians, handymen, etc.). This is a **web application — no mobile app**.

---

## 2. Architecture Principles

| Principle | Description |
|---|---|
| **Scalability** | Horizontal scaling via stateless services and container orchestration |
| **Availability** | 99.9% uptime target, redundancy at every critical layer |
| **Security** | Defense in depth — encryption at rest/transit, RBAC, rate limiting |
| **Separation of Concerns** | Clear boundaries between frontend, backend, storage, and infrastructure |
| **Offline Resilience** | Critical flows (job posting, worker offers) must handle intermittent connectivity |
| **Localization** | Designed for Pakistani market — Urdu support, local payment gateways, low-bandwidth optimization |

---

## 3. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                              │
│                                                                     │
│    ┌──────────────────────────────────────────────────────────────┐ │
│    │                    React.js Web Application (SPA)             │ │
│    │                    (Customer + Worker + Admin)                │ │
│    │                    Vite + React Router + Redux Toolkit        │ │
│    │                    Tailwind CSS + Material-UI                 │ │
│    └─────────────────────────────┬────────────────────────────────┘ │
│                                  │                                  │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY / LOAD BALANCER                  │
│                                                                     │
│              (Nginx / AWS API Gateway / Cloudflare)                 │
│                                                                     │
│  - Rate Limiting        - SSL Termination                          │
│  - Request Routing      - CORS Handling                             │
│  - Authentication Check - Request Validation                        │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                            │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   Node.js / Express Backend                    │ │
│  │                                                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │ │
│  │  │  Auth    │ │   Jobs   │ │  Users   │ │   Payments       │  │ │
│  │  │  Module  │ │  Module  │ │  Module  │ │   Module         │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │ │
│  │  │  Chat    │ │  Review  │ │ Notif.   │ │   Location       │  │ │
│  │  │  Module  │ │  Module  │ │ Module   │ │   Module         │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │ │
│  │  │  File    │ │ Search/  │ │ Admin    │                       │ │
│  │  │  Upload  │ │ Matching │ │ Module   │                       │ │
│  │  │  Module  │ │ Module   │ │          │                       │ │
│  │  └──────────┘ └──────────┘ └──────────┘                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                  WebSocket Server (Socket.IO)                  │ │
│  │                                                                │ │
│  │  - Real-time job notifications                                  │ │
│  │  - Chat / messaging between customer & worker                  │ │
│  │  - Live location tracking during visit                         │ │
│  │  - Offer/counter-offer real-time updates                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   MongoDB    │  │    Redis     │  │  MongoDB Atlas Search /   │  │
│  │ (Primary DB) │  │  (Cache +    │  │  Elasticsearch (optional) │  │
│  │  + GeoJSON   │  │   Sessions + │  │  (Full-text + Geospatial) │  │
│  │  2dsphere    │  │   Pub/Sub)   │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       STORAGE LAYER                                 │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   AWS S3 /   │  │  CloudFront  │  │   Backup Storage         │  │
│  │   Cloudinary │  │  / BunnyCDN  │  │   (S3 Glacier / Local)   │  │
│  │              │  │  (CDN)       │  │                          │  │
│  │  - Images    │  │              │  │                          │  │
│  │  - Voice     │  │              │  │                          │  │
│  │  - Documents │  │              │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                │
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────────┐  │
│  │  Web Push   │ │  SMS       │ │  Payment   │ │  Maps           │  │
│  │  (Service   │ │  Gateway   │ │  Gateway   │ │  (Google Maps   │  │
│  │  Workers)   │ │  (Twilio / │ │  (Stripe / │ │   / Leaflet)    │  │
│  │             │ │  Local PK) │ │  JazzCash /│ │                 │  │
│  │             │ │            │ │  Easypaisa)│ │                 │  │
│  └────────────┘ └────────────┘ └────────────┘ └─────────────────┘  │
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                      │
│  │  OTP       │ │  Email     │ │  Voice-to- │                      │
│  │  Service   │ │  Service   │ │  Text (STT) │                      │
│  │  (Twilio / │ │  (SendGrid │ │  (Google   │                      │
│  │  local)    │ │  / Mailgun)│ │  Speech)   │                      │
│  └────────────┘ └────────────┘ └────────────┘                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Backend Architecture

### 4.1 Monolith vs Microservices Decision

**Recommendation: Modular Monolith (initially)**

| Factor | Monolith | Microservices |
|---|---|---|
| Team size (small) | Better fit | Overhead |
| MVP speed | Faster | Slower |
| Complexity | Lower | Higher |
| Future split | Possible | Already split |

> **Decision:** Start with a well-structured modular monolith. Each module communicates via internal interfaces. When scale demands, individual modules can be extracted into microservices.

### 4.2 Module Boundaries

```
┌─────────────────────────────────────────────────┐
│                MODULAR MONOLITH                  │
│                                                  │
│  ┌─────────────┐    ┌─────────────┐             │
│  │     Auth     │    │    Jobs     │             │
│  │   Module     │◄──►│   Module    │             │
│  │             │    │             │             │
│  │ - Register  │    │ - Create    │             │
│  │ - Login     │    │ - Match     │             │
│  │ - OTP       │    │ - Negotiate │             │
│  │ - JWT       │    │ - State     │             │
│  │ - RBAC      │    │   Machine   │             │
│  └──────┬──────┘    └──────┬──────┘             │
│         │                  │                    │
│  ┌──────▼──────┐    ┌──────▼──────┐             │
│  │    Users    │    │   Payments  │             │
│  │   Module    │    │   Module    │             │
│  │             │    │             │             │
│  │ - Profile   │    │ - Charge    │             │
│  │ - Customer  │    │ - Commission│             │
│  │ - Worker    │    │ - Refund    │             │
│  │ - Verify    │    │ - Ledger    │             │
│  └──────┬──────┘    └──────┬──────┘             │
│         │                  │                    │
│  ┌──────▼──────┐    ┌──────▼──────┐             │
│  │   Chat /    │    │   Reviews   │             │
│  │  Messaging  │    │   Module    │             │
│  │   Module    │    │             │             │
│  └─────────────┘    └─────────────┘             │
│                                                  │
│  ┌─────────────┐    ┌─────────────┐             │
│  │  Location   │    │  Notif.     │             │
│  │   Module    │    │  Module     │             │
│  │             │    │             │             │
│  │ - Geocoding │    │ - Push      │             │
│  │ - Nearby    │    │ - In-App    │             │
│  │ - Distance  │    │ - SMS       │             │
│  └─────────────┘    └─────────────┘             │
│                                                  │
│  ┌─────────────┐    ┌─────────────┐             │
│  │    File     │    │   Admin     │             │
│  │   Upload    │    │   Module    │             │
│  │   Module    │    │             │             │
│  └─────────────┘    └─────────────┘             │
└─────────────────────────────────────────────────┘
```

---

## 5. Frontend Architecture

### 5.1 Web Application (Customer + Worker + Admin)

A single **React.js SPA** (Vite) serving customers, workers, and admin via role-based routing.

| Aspect | Decision |
|---|---|
| **Framework** | React.js 18+ (Vite SPA) |
| **State Management** | Redux Toolkit + React Query |
| **Routing** | React Router |
| **Maps** | Leaflet / @react-google-maps/api |
| **Real-time** | Socket.IO client |
| **Web Push** | Service Workers + Web Push API |
| **UI Kit** | Tailwind CSS + Material-UI (MUI) |
| **Geolocation** | Browser Geolocation API |
| **File upload** | Axios + Multer / pre-signed S3 URLs

---

## 6. Authentication Architecture

```
┌──────────────┐                    ┌──────────────┐
│    Client    │                    │    Server    │
│              │                    │              │
│  Enter Phone │─── POST /auth ───►│              │
│              │    /otp/send       │  Generate OTP│
│              │                    │  Store in    │
│              │                    │  Redis (5min)│
│              │◄── OTP Sent ──────│              │
│              │                    │              │
│  Enter OTP   │─── POST /auth ───►│  Verify OTP  │
│              │    /otp/verify     │  from Redis  │
│              │                    │              │
│              │◄── JWT + Refresh ──│  Issue JWT   │
│              │    Token           │  + Refresh   │
│              │                    │              │
│  Authenticated│─── API Calls ───►│  Verify JWT  │
│  Requests    │    (Bearer)       │  Check RBAC  │
└──────────────┘                    └──────────────┘
```

### 6.1 Token Strategy

| Token | Lifetime | Storage |
|---|---|---|
| Access Token (JWT) | 15 minutes | Memory / Secure Store |
| Refresh Token | 30 days | Secure storage (Encrypted) |

### 6.2 Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| **Customer** | Create jobs, accept/reject offers, pay, review |
| **Worker** | View jobs, submit offers, update job status, receive payments |
| **Admin** | Full access, user management, disputes, analytics |
| **Super Admin** | Admin + system config, commission rates |

---

## 7. Real-Time Communication Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│ Customer │◄───►│  Socket.IO   │◄───►│  Worker  │
│  (Web)   │     │   Server     │     │  (Web)   │
└──────────┘     │              │     └──────────┘
                 │  - Rooms     │
                 │  - Events    │
                 │  - Redis     │
                 │    Adapter   │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │    Redis     │
                 │   Pub/Sub    │
                 │  (Multiple   │
                 │   Server     │
                 │   Instances) │
                 └──────────────┘
```

### 7.1 Key Real-Time Events

| Event | Direction | Description |
|---|---|---|
| `job:created` | Server → Workers | New job posted in area |
| `job:offer` | Worker → Customer | Worker sends visit charge offer |
| `job:offer:accepted` | Customer → Worker | Customer accepts offer |
| `job:status:changed` | Both ways | Job state update |
| `chat:message` | Both ways | New chat message |
| `payment:completed` | Server → Both | Payment confirmation |

---

## 8. Location / Geospatial Architecture

### 8.1 Nearby Worker Matching

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  Customer posts job with location                │
│         │                                        │
│         ▼                                        │
│  ┌──────────────┐                                │
│  │   MongoDB    │                                │
│  │ Geospatial   │                                │
│  │  Geo-query   │                                │
│  │              │                                │
│  │  $geoNear({  │                                │
│  │   near: job, │                                │
│  │   maxDistance│                                │
│  │   radius_km  │                                │
│  │  }) on       │                                │
│  │  2dsphere idx│                                │
│  └──────┬───────┘                                │
│         │                                        │
│         ▼                                        │
│  Return matching workers sorted by:             │
│  1. Distance                                    │
│  2. Rating                                      │
│  3. Availability                                │
│  4. Skill match                                 │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 8.2 Location Storage Options

| Option | Pros | Cons |
|---|---|---|
| **MongoDB GeoJSON (`2dsphere`)** | Native, integrated with MERN | — |
| **MongoDB Atlas Search** | Full-text + geo combined | Paid tier for advanced |
| **Google S2 / Uber H3** | Grid-based, efficient | Complexity |

**Recommendation:** MongoDB `2dsphere` geospatial index with `$geoNear`/`$near` for database queries. MongoDB Atlas Search only if advanced search/filtering is needed later.

---

## 9. File / Image / Voice Storage

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Client    │────►│   Backend    │────►│   AWS S3 /   │
│              │     │   (Multer /  │     │   Cloudinary │
│  Upload File │     │    Pre-signed│     │              │
│              │     │    URL)      │     │  Buckets:    │
│              │     │              │     │  - images/   │
│              │     │  - Validate  │     │  - voice/    │
│              │     │  - Resize    │     │  - docs/     │
│              │     │  - Generate  │     │  - avatar/   │
│              │     │    pre-sign  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 9.1 File Handling Strategy

| File Type | Max Size | Processing |
|---|---|---|
| Images (job) | 5MB | Resize to 3 variants (thumb, medium, large) |
| Profile photos | 2MB | Crop + resize to standard avatar sizes |
| Voice notes | 10MB | Store original + convert to waveform data |
| Documents (ID verification) | 5MB | Store original, extract metadata |

---

## 10. Payment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW                           │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌───────────────────┐   │
│  │ Customer │───►│ Payment  │───►│  Payment Gateway  │   │
│  │  (Web)   │    │  Service │    │  (JazzCash /      │   │
│  └──────────┘    │          │    │   Easypaisa /     │   │
│                  │  - Create│    │   Stripe)         │   │
│                  │  - Verify│    └────────┬──────────┘   │
│                  │  - Settle│             │              │
│                  └────┬─────┘             │              │
│                       │                   │              │
│                       ▼                   ▼              │
│                  ┌──────────┐    ┌───────────────────┐   │
│                  │ Escrow / │    │   Webhook from    │   │
│                  │ Holding  │    │   Gateway         │   │
│                  │ Account  │    │   (payment conf.) │   │
│                  └────┬─────┘    └───────────────────┘   │
│                       │                                  │
│                       ▼                                  │
│                  ┌──────────┐                            │
│                  │ Settle   │                            │
│                  │ - Worker │                            │
│                  │   payment│                            │
│                  │ - Platform│                           │
│                  │   commission│                         │
│                  └──────────┘                            │
└──────────────────────────────────────────────────────────┘
```

---

## 11. Notification Architecture

```
┌──────────────────────────────────────────────────┐
│              NOTIFICATION SERVICE                  │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │            Notification Router             │   │
│  │                                            │   │
│  │  Event → Determine Channel → Send          │   │
│  └───────┬─────────┬──────────┬───────────────┘   │
│          │         │          │                    │
│          ▼         ▼          ▼                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Web     │ │   SMS    │ │  In-App  │          │
│  │  Push    │ │ (Twilio) │ │ (Socket) │          │
│  │(Service  │ │          │ │          │          │
│  │ Workers) │ │          │ │          │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                    │
│  Channels per notification type:                   │
│  - Job alerts        → Push + In-App               │
│  - OTP               → SMS + Push                  │
│  - Payment           → Push + In-App               │
│  - Chat messages     → Push + In-App               │
│  - Promotional       → Push (opt-in only)          │
└──────────────────────────────────────────────────┘
```

---

## 12. Deployment Architecture

```
┌──────────────────────────────────────────────────────┐
│                   CLOUD (AWS / GCP)                   │
│                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │  Route 53  │  │ CloudFront │  │  WAF           │  │
│  │  (DNS)     │──│  (CDN)     │──│  (Firewall)    │  │
│  └────────────┘  └────────────┘  └───────┬────────┘  │
│                                          │           │
│                                   ┌──────▼──────┐   │
│                                   │    ALB      │   │
│                                   │(Load Bal.)  │   │
│                                   └──────┬──────┘   │
│                                          │           │
│                    ┌─────────────────────┬┴┐          │
│                    │                     │ │          │
│               ┌────▼────┐          ┌────▼────┐      │
│               │  ECS /  │          │  ECS /  │      │
│               │  EC2    │          │  EC2    │      │
│               │Instance │          │Instance │      │
│               │   1     │          │   2     │      │
│               └────┬────┘          └────┬────┘      │
│                    │                     │           │
│                    └──────────┬──────────┘           │
│                               │                      │
│                    ┌──────────▼──────────┐           │
│                    │   ElastiCache       │           │
│                    │   (Redis)           │           │
│                    └─────────────────────┘           │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │        MongoDB Atlas (Replica Set)            │    │
│  │        + Read Replicas                        │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │           S3 (File Storage)                   │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │       CloudWatch + PagerDuty (Monitoring)    │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │        Vercel / Netlify (React Frontend)      │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

## 13. Security Architecture

### 13.1 Security Layers

| Layer | Measures |
|---|---|
| **Network** | VPC, Security Groups, WAF, DDoS protection |
| **Transport** | TLS 1.3 everywhere, HSTS |
| **Application** | Input validation, object/query filtering, RBAC, NoSQL injection protection (Mongoose sanitization) |
| **Data** | Encryption at rest (AES-256), sensitive field masking |
| **API** | Rate limiting, request signing, API key rotation |
| **File Upload** | Type validation, size limits, virus scanning |
| **Auth** | OTP + JWT, refresh token rotation, session management |

### 13.2 Rate Limiting Strategy

| Endpoint Type | Limit | Window |
|---|---|---|
| Auth (OTP send) | 3 req | 5 minutes |
| Auth (OTP verify) | 5 req | 5 minutes |
| General API | 100 req | 1 minute |
| File upload | 10 req | 1 minute |
| Job creation | 5 req | 1 hour |

---

## 14. Data Flow — Complete Job Lifecycle

```
Customer (Web)                 Backend                    Worker (Web)
     │                           │                           │
     │── Create Job ────────────►│                           │
     │                           │── Notify nearby workers ──►
     │                           │                           │
     │                           │◄── Worker sends offer ────│
     │◄── Offer notification ────│                           │
     │                           │                           │
     │── Accept offer ──────────►│                           │
     │                           │── Notify: accepted ───────►
     │                           │                           │
     │                           │◄── Worker confirms visit ─│
     │◄── Visit confirmed ───────│                           │
     │                           │                           │
     │                           │◄── Worker: inspection ────│
     │◄── Inspection report ─────│                           │
     │                           │                           │
     │── Accept repair price ───►│                           │
     │                           │── Notify: approved ───────►
     │                           │                           │
     │                           │◄── Worker: complete job ──│
     │                           │                           │
     │── Payment ───────────────►│                           │
     │                           │── Settle payment ─────────►
     │                           │                           │
     │── Leave review ──────────►│                           │
     │                           │── Notify: review ─────────►
```

---

## 15. Environment Strategy

| Environment | Purpose | Infrastructure |
|---|---|---|
| **Development** | Local development | Docker Compose |
| **Staging** | Pre-production testing | Smaller cloud setup |
| **Production** | Live platform | Full cloud setup (Multi-AZ) |

---

## 16. Monitoring & Observability

| Tool | Purpose |
|---|---|
| **CloudWatch / Datadog** | Metrics, logs, alarms |
| **Sentry** | Error tracking (backend + frontend) |
| **Prometheus + Grafana** | Custom metrics dashboards |
| **PagerDuty** | On-call alerting |
| **ELK Stack** | Centralized logging |

---

## 17. Summary of Key Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend style | Modular Monolith | Fast MVP, easy to split later |
| Database | MongoDB (+ 2dsphere geo) | MERN alignment, flexible, native geo supports |
| Cache / PubSub | Redis | Fast, versatile, Socket.IO adapter |
| Search | MongoDB $text / Atlas Search | Built-in full-text + geospatial |
| Real-time | Socket.IO | Proven, fallback support |
| File storage | AWS S3 / Cloudinary | Scalable, CDN integration |
| Frontend | React.js (Vite SPA) | MERN alignment, single codebase |
| Auth | OTP + JWT | Simple, Pakistan phone market |
| Web Push | Web Push API / Service Workers | Browser-native notifications |
| Payments | JazzCash / Easypaisa + Stripe | Local + international |

---

*Document prepared by Shafqat Ullah — Pending review by Qazi Farhan Ahmad (Team Lead)*
