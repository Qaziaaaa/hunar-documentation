# Technology Recommendations — Home Services Platform (MERN Web)

**Author:** Shafqat Ullah  
**Document Type:** Technology Stack Recommendations  
**Version:** 2.0  
**Date:** September 2, 2026  
**Status:** Draft — Pending Team Review

> **Note:** This is a **MERN-stack website** (MongoDB, Express.js, React, Node.js). There is **no mobile app**.

---

## 1. Overview

This document recommends the complete technology stack for the Home Services Platform — a **MERN-stack web application** — with justifications, alternatives considered, and risk assessment.

---

## 2. Technology Stack Summary

| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Node.js | 20 LTS |
| **Language** | TypeScript | 5.x |
| **Backend Framework** | Express.js | 4.x |
| **API Style** | REST (+ WebSocket) | — |
| **Database** | MongoDB | 7.x |
| **ODM** | Mongoose | 8.x |
| **Cache / Queue** | Redis | 7.x |
| **Frontend** | React.js (SPA) | 18+ |
| **Build Tool** | Vite | 5.x |
| **State Management** | Redux Toolkit + React Query | — |
| **UI Library** | Tailwind CSS + Material-UI (MUI) | — |
| **Real-time** | Socket.IO | 4.x |
| **File Storage** | AWS S3 (or Cloudinary / Multer-local) | — |
| **Auth** | JWT + OTP | — |
| **Web Push Notifications** | Web Push API / Service Workers | — |
| **SMS** | Twilio / Local Provider | — |
| **Maps** | Google Maps JavaScript API / Leaflet | — |
| **Payment Gateways** | JazzCash, Easypaisa, Stripe | — |
| **Containerization** | Docker | — |
| **Orchestration** | Docker Compose (dev) / ECS (prod) | — |
| **CI/CD** | GitHub Actions | — |
| **Monitoring** | CloudWatch / Sentry | — |

---

## 3. Backend Technology

### 3.1 Runtime: Node.js 20 LTS

| Criteria | Assessment |
|---|---|
| Performance | Excellent I/O performance for API servers |
| Ecosystem | Largest package ecosystem (npm) |
| TypeScript | First-class support |
| Real-time | Native WebSocket support, Socket.IO |
| Team Skill | Assumed familiarity |
| Scalability | Horizontal scaling via clustering / containers |

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|---|---|---|---|
| Python (FastAPI/Django) | Great for ML, mature | Slower for real-time, GIL | ❌ |
| Go | Very fast, compiled | Smaller ecosystem, steeper learning | ❌ |
| Java (Spring Boot) | Enterprise-grade, fast | Heavy, verbose, slower dev | ❌ |
| Elixir (Phoenix) | Best for real-time | Small ecosystem, learning curve | ❌ |

### 3.2 Framework: Express.js

| Criteria | Assessment |
|---|---|
| Maturity | Battle-tested, huge community |
| Flexibility | Minimal opinions, full control |
| Middleware | Rich middleware ecosystem |
| TypeScript | Good support with @types |

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|---|---|---|---|
| NestJS | Structure, DI, decorators | Learning curve, heavy | ⚠️ Consider for future |
| Fastify | 2x faster than Express | Smaller ecosystem | ⚠️ Good option |
| Koa | Modern, async/await | Less middleware | ❌ |

> **Recommendation:** Start with Express.js for simplicity. If team grows, migrate to NestJS for better structure.

---

## 4. Database Technology

### 4.1 Primary: MongoDB 7 + Geospatial Indexes

| Criteria | Assessment |
|---|---|
| Document Model | Flexible schema, ideal for varied job/worker data |
| Geospatial | Native `2dsphere` indexes, `$near` / `$geoNear` queries |
| Scalability | Horizontal scaling via sharding |
| JSON | Native JSON storage (BSON) |
| Full-text | Basic text search built-in (`$text`) |
| Aggregation | Powerful aggregation pipeline |
| Cloud | MongoDB Atlas (managed) |
| Cost | Free tier + open source |

> **MERN alignment:** MongoDB is the "M" in MERN and pairs naturally with Node.js/Express and JavaScript objects (via Mongoose ODM), keeping a single language (JavaScript/TypeScript) across the stack.

### 4.2 Cache: Redis 7

| Criteria | Assessment |
|---|---|
| Speed | Sub-millisecond latency |
| Data Structures | Strings, Hashes, Sets, Sorted Sets, Geo |
| TTL | Native key expiration |
| Pub/Sub | Built-in, used for Socket.IO adapter |
| Sessions | Ideal for session storage |

**Use Cases in Platform:**

| Use Case | Redis Feature |
|---|---|
| OTP storage | String + TTL (5 min) |
| JWT refresh tokens | String + TTL (30 days) |
| Rate limiting | String + TTL (1 min) |
| Socket.IO scaling | Redis Adapter (pub/sub) |
| Worker online status | String + TTL (heartbeat) |
| Nearby workers cache | GEO radius query |
| Job offer count cache | Sorted Set |

### 4.3 Search

| Option | Assessment |
|---|---|
| MongoDB `$text` index | Built-in basic full-text search — enough for MVP |
| MongoDB geospatial (`2dsphere`) | Nearby worker matching directly in MongoDB |
| MongoDB Atlas Search | Full-text search (Lucene-based) when needed |
| Elasticsearch | Optional — only if advanced search/analytics required later |

> **Recommendation:** Start with MongoDB's built-in `$text` index and `2dsphere` geospatial queries for MVP. Add MongoDB Atlas Search or Elasticsearch only when search complexity grows.

---

## 5. Frontend Technology

### 5.1 Customer + Worker Web UI: React.js (SPA)

| Criteria | Assessment |
|---|---|
| Single codebase | One React SPA serves customers, workers, and admin |
| MERN alignment | React is the "R" in MERN — JavaScript everywhere |
| Build tool | Vite for fast dev + build |
| Routing | React Router for SPA navigation |
| State | Redux Toolkit + React Query (server state) |
| Real-time | Socket.IO client for live job updates |
| Maps | Leaflet / @react-google-maps/api |
| File upload | Axios + Multer / pre-signed S3 URLs |
| Geolocation | Browser Geolocation API |
| Web Push | Service Workers + Web Push API |

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|---|---|---|---|
| Next.js | SSR/SSG, SEO | Heavier than SPA, more complex | ⚠️ Use if SEO critical |
| Vue.js | Simple, readable | Smaller ecosystem than React | ❌ |
| Angular | Batteries-included | Steeper learning curve | ❌ |

> **Recommendation:** Use **React.js (Vite SPA)** for the full marketplace website. This keeps the stack uniformly MERN (JavaScript/TypeScript across frontend and backend), simplifying development and hiring.

### 5.2 Admin Dashboard

Use the same React.js app with a role-based admin section, or a separate React (Vite) app sharing the backend.

| Aspect | Decision |
|---|---|
| Framework | React.js (Vite SPA) |
| UI | Tailwind CSS + Material-UI (MUI) |
| State | Redux Toolkit + React Query |
| Charts | Recharts |
| Maps | Leaflet / Google Maps JS API |

---

## 6. ODM: Mongoose

| Criteria | Assessment |
|---|---|
| Type Safety | Works with TypeScript schema typing |
| Schema | Flexible JSON schema for documents |
| Middleware | Hooks for validation, hashing, etc. |
| Population | Reference / populate across collections |
| Queries | Chainable query builder |
| MongoDB | First-class support |

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|---|---|---|---|
| Prisma (MongoDB) | Type-safe, migrations | Modern/relational style, less native | ⚠️ |
| MongoDB native driver | Lightweight, no abstraction | More boilerplate | ⚠️ |
| TypeORM (Mongo) | Decorators | Less reliable for Mongo | ❌ |

> **Recommendation:** Use **Mongoose** — the standard, mature ODM for MongoDB + Express.

---

## 7. Authentication

### 7.1 Strategy: OTP + JWT

| Component | Technology |
|---|---|
| OTP Generation | Custom (6-digit, random) |
| OTP Delivery | SMS (Twilio / local) |
| OTP Storage | Redis (5 min TTL) |
| Access Token | JWT (RS256) — 15 min lifetime |
| Refresh Token | Opaque token — 30 days, Redis |

### 7.2 JWT Libraries

| Library | Why |
|---|---|
| `jsonwebtoken` | Most popular, well-tested |
| `jose` | Modern, edge-runtime compatible |

---

## 8. Real-Time Communication

### Socket.IO

| Criteria | Assessment |
|---|---|
| Fallback | Long-polling if WebSocket fails |
| Rooms | Perfect for job-specific channels |
| Broadcasting | Efficient event distribution |
| Redis Adapter | Multi-instance support |
| Namespaces | Separate channels for chat, jobs, etc. |

---

## 9. File Storage

### 9.1 AWS S3 (Production)

| Criteria | Assessment |
|---|---|
| Durability | 99.999999999% |
| Scalability | Unlimited |
| CDN | CloudFront integration |
| Cost | Pay per use (very cheap) |
| Pre-signed URLs | Direct client upload |
| Lifecycle | Auto-archiving to Glacier |

### 9.2 MinIO (Development / Self-hosted)

| Criteria | Assessment |
|---|---|
| S3 Compatible | Drop-in replacement |
| Self-hosted | No cloud dependency |
| Free | Open source |
| Docker | Easy local setup |

---

## 10. Maps & Location

### Google Maps Platform

| Service | Usage |
|---|---|
| Maps JavaScript API | Display maps in admin dashboard |
| Places API | Address autocomplete |
| Geocoding API | Address ↔ coordinates |
| Directions API | Route calculation |
| Distance Matrix API | Distance/time between points |

**Cost Estimate:**
- $200/month free credit
- ~$5 per 1,000 geocoding requests
- ~$5 per 1,000 distance matrix requests

### Alternative: Mapbox

| Criteria | Google Maps | Mapbox |
|---|---|---|
| Coverage (Pakistan) | ✅ Excellent | ✅ Good |
| Pricing | $200 free credit | 50K free loads |
| Customization | Good | Better |
| Direction | Excellent | Good |

---

## 11. Payment Gateways

### 11.1 JazzCash (Primary — Pakistan)

| Criteria | Assessment |
|---|---|
| Coverage | Largest mobile wallet in Pakistan |
| API | REST API with merchant integration |
| Methods | Mobile account, CNIC transfer |
| Settlement | 1-2 business days |

### 11.2 Easypaisa (Secondary — Pakistan)

| Criteria | Assessment |
|---|---|
| Coverage | Second largest in Pakistan |
| API | Available with merchant integration |
| Methods | Mobile account, CNIC |

### 11.3 Stripe (International / Card Payments)

| Criteria | Assessment |
|---|---|
| Coverage | Global, cards + local methods |
| API | Excellent developer experience |
| Pakistan | Available (limited) |
| Use case | Credit/debit card payments |

> **Recommendation:** Start with JazzCash + Easypaisa (covers 80% of Pakistani users). Add Stripe later for card payments.

---

## 12. Web Push Notifications

### Web Push API + Service Workers

| Criteria | Assessment |
|---|---|
| Cost | Free (browser native) |
| Platforms | All desktop browsers (Chrome, Firefox, Edge) |
| Background | Works when tab is closed / in background |
| Topics | Subscribe workers to city/category via `PushManager` |
| Payload | Custom data payload for deep linking |
| Library | `web-push` (Node.js) for server-side sending |

> **Recommendation:** Use the **Web Push API** with Service Workers for browser notifications, and **`web-push`** npm package on the Express backend. This is the web-native equivalent of FCM and requires no mobile platform setup.

---

## 13. SMS Gateway

| Provider | Coverage in Pakistan | Cost | API Quality |
|---|---|---|---|
| **Twilio** | ✅ Global | ~$0.05/SMS | Excellent |
| **SMS Gateway Center** | ✅ Pakistan | ~PKR 0.50/SMS | Basic |
| **Ufone/PTCL Bulk** | ✅ Pakistan | ~PKR 0.30/SMS | Basic |
| **Vonage (Nexmo)** | ✅ Global | ~$0.04/SMS | Good |

> **Recommendation:** Start with Twilio for reliability. Switch to local provider when volume justifies.

---

## 14. Image Processing

### Sharp (Node.js)

| Criteria | Assessment |
|---|---|
| Speed | Fastest Node.js image processor |
| Formats | JPEG, PNG, WebP, AVIF |
| Operations | Resize, crop, watermark, format convert |
| Memory | Efficient streaming |
| CDN | Pre-process before S3 upload |

---

## 15. DevOps & Infrastructure

### 15.1 Containerization: Docker

```dockerfile
# Development: Docker Compose
services:
  api:
    build: .
    ports: ["3000:3000"]
    depends_on: [mongodb, redis]
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongodata:/data/db]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### 15.2 CI/CD: GitHub Actions

```yaml
# Pipeline stages:
1. Lint (ESLint + Prettier)
2. Type Check (TypeScript)
3. Test (Jest)
4. Build (Docker image)
5. Push to ECR
6. Deploy to ECS (staging)
7. Integration tests
8. Deploy to ECS (production)
```

### 15.3 Infrastructure (AWS / MongoDB Atlas)

| Service | Usage |
|---|---|
| ECS Fargate | Backend container hosting (serverless) |
| MongoDB Atlas | Managed MongoDB database |
| ElastiCache Redis | Managed Redis |
| S3 | File storage |
| CloudFront | CDN |
| ALB | Load balancer |
| Route 53 | DNS |
| WAF | Web application firewall |
| CloudWatch | Logs + metrics |
| Secrets Manager | API keys, secrets |
| Vercel / Netlify | React frontend static hosting |

---

## 16. Development Tools

| Tool | Purpose |
|---|---|
| **VS Code** | IDE |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Jest** | Unit + integration testing |
| **Supertest** | API testing |
| **Docker Desktop** | Local containers |
| **Postman / Insomnia** | API development |
| **MongoDB Compass / Atlas** | Database browser |
| **GitHub** | Version control |

---

## 17. Package Dependencies (Backend)

### Core Dependencies

```json
{
  "express": "^4.18.0",
  "typescript": "^5.3.0",
  "mongoose": "^8.0.0",
  "socket.io": "^4.7.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "redis": "^4.6.0",
  "sharp": "^0.33.0",
  "axios": "^1.6.0",
  "multer": "^1.4.5-lts.1",
  "web-push": "^3.6.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.1.0",
  "express-validator": "^7.0.0",
  "winston": "^3.11.0",
  "dotenv": "^16.3.0",
  "uuid": "^9.0.0"
}
```

### Dev Dependencies

```json
{
  "@types/express": "^4.17.0",
  "@types/jsonwebtoken": "^9.0.0",
  "ts-node": "^10.9.0",
  "tsx": "^4.7.0",
  "jest": "^29.7.0",
  "@types/jest": "^29.5.0",
  "ts-jest": "^29.1.0",
  "supertest": "^6.3.0",
  "eslint": "^8.56.0",
  "@typescript-eslint/eslint-plugin": "^6.19.0",
  "prettier": "^3.2.0",
  "nodemon": "^3.0.0"
}
```

---

## 18. Cost Estimate (Monthly — Cloud)

### MVP / Early Stage

| Service | Configuration | Est. Cost |
|---|---|---|
| Backend (Render / Railway / ECS) | 1-2 instances, 0.5 vCPU, 1GB | $15-30 |
| MongoDB Atlas | M0 / M10 free-or-near-free tier | $0-10 |
| ElastiCache Redis | cache.t3.micro | $15 |
| S3 | 10GB storage | $1 |
| CloudFront | 50GB transfer | $5 |
| Vercel / Netlify (frontend) | Free tier | $0 |
| Route 53 | 1 hosted zone | $1 |
| CloudWatch | Basic monitoring | $5 |
| **SMS (Twilio)** | 1,000 SMS | $50 |
| **Google Maps** | Within free credit | $0 |
| **Web Push** | Free (browser native) | $0 |
| **Total** | | **~$90-120/month** |

### Growth Stage

| Service | Configuration | Est. Cost |
|---|---|---|
| Backend (ECS Fargate) | 4 tasks, 1 vCPU, 2GB | $120 |
| MongoDB Atlas | M20 (replicas) | $100 |
| ElastiCache Redis | cache.t3.small | $30 |
| S3 + CloudFront | 100GB + 500GB transfer | $25 |
| **SMS** | 10,000 SMS | $500 |
| **Total** | | **~$775/month** |

---

## 19. Technology Risk Assessment

| Technology | Risk | Mitigation |
|---|---|---|
| Node.js | Single-threaded CPU bottleneck | Offload heavy tasks to worker threads / queues |
| MongoDB | No strict schema | Use Mongoose schema validation |
| Redis | Single point of failure | Redis Sentinel / Cluster |
| Socket.IO | Scaling across instances | Redis adapter |
| S3 | Vendor lock-in | Cloudinary / local storage alternative |
| Web Push | Browser permission / support | Fallback to SMS + in-app Socket.IO |

---

## 20. Recommended MVP Tech Stack (Simplified — MERN Web)

For MVP, reduce complexity:

```
✅ Keep:        Node.js, TypeScript, Express, MongoDB, Mongoose, Redis
✅ Keep:        React (Vite SPA), Socket.IO
✅ Keep:        JWT + OTP Auth, Web Push API
⚠️ Optional:    Mongo Atlas Search (use $text + 2dsphere initially)
⚠️ Optional:    S3 (use Multer local storage initially)
❌ Skip:        Complex microservices, heavy monitoring
❌ Skip:        Multiple payment gateways (start with JazzCash only)
```

**MVP Infrastructure:**
- Single backend server (Render / Railway / ECS)
- MongoDB Atlas (free M0 tier) or local MongoDB
- Redis (single instance)
- S3 or Multer local storage for files
- Vercel / Netlify for React frontend
- Docker Compose for local dev

This keeps costs under $100/month during MVP phase.

---

*Document prepared by Shafqat Ullah — Pending review by Qazi Farhan Ahmad (Team Lead)*
