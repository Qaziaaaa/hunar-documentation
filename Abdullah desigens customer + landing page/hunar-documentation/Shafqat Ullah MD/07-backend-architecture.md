# Full Backend Architecture — Fixora (Home Services Platform)

**Author:** Shafqat Ullah  
**Document Type:** Backend Architecture (Implementation Blueprint)  
**Version:** 1.0  
**Date:** September 3, 2026  
**Status:** Draft — Pending Team Review

> **Purpose:** This document is the **single implementation reference** for the Fixora backend. It translates the system architecture, database design, ER diagram, backend modules, and technology decisions into a concrete project structure, API contract, middleware pipeline, event system, and deployment plan. Every developer working on the backend should start here.

> **Stack:** NestJS (TypeScript) Modular Monolith + PostgreSQL/PostGIS + Redis + Socket.IO + FCM + S3 + Prisma ORM

---

## Table of Contents

1. [Project Folder Structure](#1-project-folder-structure)
2. [Configuration Management](#2-configuration-management)
3. [Request Lifecycle & Middleware Pipeline](#3-request-lifecycle--middleware-pipeline)
4. [Authentication Flow](#4-authentication-flow)
5. [Role-Based Access Control](#5-role-based-access-control)
6. [Complete API Reference](#6-complete-api-reference)
7. [Job State Machine](#7-job-state-machine)
8. [Inter-Module Event System](#8-inter-module-event-system)
9. [Socket.IO Real-Time Specification](#9-socketio-real-time-specification)
10. [Background Jobs & Queues](#10-background-jobs--queues)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Logging & Observability](#12-logging--observability)
13. [Testing Strategy](#13-testing-strategy)
14. [Docker & Local Development](#14-docker--local-development)
15. [CI/CD Pipeline](#15-cicd-pipeline)
16. [Environment Strategy](#16-environment-strategy)
17. [API Response Conventions](#17-api-response-conventions)
18. [Security Checklist](#18-security-checklist)
19. [File Naming Conventions](#19-file-naming-conventions)
20. [Development Workflow](#20-development-workflow)

---

## 1. Project Folder Structure

```
fixora-backend/
│
├── prisma/
│   ├── schema.prisma              ← All tables, enums, relations
│   ├── seed.ts                    ← Service categories + admin seed
│   └── migrations/                ← Auto-generated migration files
│
├── src/
│   ├── main.ts                    ← Bootstrap, CORS, pipes, prefix
│   ├── app.module.ts              ← Root module (imports all modules)
│   │
│   ├── config/
│   │   ├── app.config.ts          ← PORT, API_PREFIX, CORS
│   │   ├── database.config.ts     ← DATABASE_URL
│   │   ├── redis.config.ts        ← REDIS_HOST, PORT, PASSWORD
│   │   ├── jwt.config.ts          ← JWT_SECRET, EXPIRY, REFRESH
│   │   ├── sms.config.ts          ← Twilio credentials
│   │   ├── s3.config.ts           ← AWS S3 credentials
│   │   ├── fcm.config.ts          ← Firebase credentials
│   │   ├── payment.config.ts      ← JazzCash / Easypaisa / Stripe
│   │   └── maps.config.ts         ← Google Maps / Mapbox key
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts       ← Global Prisma module
│   │   └── prisma.service.ts      ← PrismaClient lifecycle
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts       ← Validates JWT + session
│   │   │   └── roles.guard.ts          ← Checks role permissions
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts      ← @Roles('worker')
│   │   │   ├── current-user.decorator.ts  ← @CurrentUser() param
│   │   │   └── public.decorator.ts     ← @Public() skip auth
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts  ← Wrap response in { success, data, meta }
│   │   │   ├── logging.interceptor.ts    ← Request/response logging
│   │   │   └── timeout.interceptor.ts    ← 30s request timeout
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts ← Catch-all error handler
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts        ← class-validator global pipe
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts          ← All Redis operations
│   │   ├── event-bus/
│   │   │   ├── event-bus.module.ts
│   │   │   └── event-bus.service.ts      ← Typed EventEmitter wrapper
│   │   ├── helpers/
│   │   │   ├── otp.generator.ts          ← Generate 6-digit OTP
│   │   │   ├── phone.util.ts             ← E.164 formatting
│   │   │   ├── slug.util.ts
│   │   │   └── pagination.util.ts        ← Offset/limit helper
│   │   └── types/
│   │       ├── jwt-payload.interface.ts  ← { sub, phone, role }
│   │       ├── api-response.interface.ts ← Standard API response
│   │       └── pagination.interface.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts        ← /auth/*
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.validation.ts        ← DTOs
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts       ← Passport JWT strategy
│   │   │   └── __tests__/
│   │   │       ├── auth.service.spec.ts
│   │   │       └── auth.controller.spec.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts       ← /users/*
│   │   │   ├── users.service.ts
│   │   │   ├── users.validation.ts       ← DTOs
│   │   │   ├── worker-profile.service.ts
│   │   │   ├── customer-profile.service.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── jobs/
│   │   │   ├── jobs.module.ts
│   │   │   ├── jobs.controller.ts        ← /jobs/*
│   │   │   ├── jobs.service.ts
│   │   │   ├── jobs.validation.ts
│   │   │   ├── jobs.state-machine.ts     ← State transitions
│   │   │   ├── jobs.events.ts            ← Event emitters
│   │   │   └── __tests__/
│   │   │
│   │   ├── offers/
│   │   │   ├── offers.module.ts
│   │   │   ├── offers.controller.ts      ← /jobs/:jobId/offers, /offers/*
│   │   │   ├── offers.service.ts
│   │   │   ├── offers.validation.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── visits/
│   │   │   ├── visits.module.ts
│   │   │   ├── visits.controller.ts      ← /visits/*
│   │   │   ├── visits.service.ts
│   │   │   ├── visits.validation.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── repair/
│   │   │   ├── repair.module.ts
│   │   │   ├── repair.controller.ts      ← /visits/:id/estimate, /repairs/*
│   │   │   ├── repair.service.ts
│   │   │   ├── repair.validation.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts    ← /payments/*, /webhooks/*
│   │   │   ├── payments.service.ts
│   │   │   ├── payments.validation.ts
│   │   │   ├── ledger.service.ts         ← Internal ledger logic
│   │   │   ├── gateways/
│   │   │   │   ├── gateway.interface.ts  ← Abstract gateway contract
│   │   │   │   ├── jazzcash.gateway.ts
│   │   │   │   ├── easypaisa.gateway.ts
│   │   │   │   └── stripe.gateway.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── reviews/
│   │   │   ├── reviews.module.ts
│   │   │   ├── reviews.controller.ts     ← /jobs/:id/review, /users/:id/reviews
│   │   │   ├── reviews.service.ts
│   │   │   ├── reviews.validation.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── chat/
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts        ← /chat/*
│   │   │   ├── chat.service.ts
│   │   │   ├── chat.gateway.ts           ← Socket.IO event handlers
│   │   │   └── __tests__/
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts  ← /notifications/*
│   │   │   ├── notifications.service.ts     ← Multi-channel sender
│   │   │   ├── firebase.service.ts          ← FCM wrapper
│   │   │   ├── sms.service.ts               ← Twilio wrapper
│   │   │   ├── templates/
│   │   │   │   ├── job-alert.template.ts
│   │   │   │   ├── offer-received.template.ts
│   │   │   │   ├── otp.template.ts
│   │   │   │   └── payment.template.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── location/
│   │   │   ├── location.module.ts
│   │   │   ├── location.service.ts       ← PostGIS queries
│   │   │   ├── geocoding.service.ts      ← Address ↔ coordinates
│   │   │   └── __tests__/
│   │   │
│   │   ├── uploads/
│   │   │   ├── uploads.module.ts
│   │   │   ├── uploads.controller.ts     ← /uploads/*
│   │   │   ├── uploads.service.ts        ← S3 pre-signed URLs
│   │   │   ├── processors/
│   │   │   │   ├── image.processor.ts    ← Sharp resize
│   │   │   │   └── voice.processor.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── search/
│   │   │   ├── search.module.ts
│   │   │   ├── search.service.ts         ← PostgreSQL FTS
│   │   │   └── __tests__/
│   │   │
│   │   └── admin/
│   │       ├── admin.module.ts
│   │       ├── admin.controller.ts       ← /admin/*
│   │       ├── admin.service.ts
│   │       ├── admin.validation.ts
│   │       ├── admin.middleware.ts        ← Extra admin checks
│   │       └── __tests__/
│   │
│   └── health/
│       ├── health.module.ts
│       └── health.controller.ts          ← GET /health
│
├── test/
│   ├── jest-e2e.json
│   └── app.e2e-spec.ts
│
├── docker/
│   ├── Dockerfile                       ← Multi-stage build
│   ├── Dockerfile.dev                   ← Dev with hot-reload
│   └── nginx.conf                       ← Reverse proxy config
│
├── .env.example
├── .env.development
├── .env.staging
├── .env.production
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml
├── docker-compose.dev.yml
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
└── README.md
```

---

## 2. Configuration Management

All environment variables are loaded through `@nestjs/config` with typed config files. No `process.env` calls scattered across the codebase.

### 2.1 Environment Files

| File | Purpose |
|---|---|
| `.env.example` | Template — committed to git |
| `.env.development` | Local dev values |
| `.env.staging` | Pre-production |
| `.env.production` | Live values (never committed) |

### 2.2 Config Files Pattern

Each config file follows the same pattern:

```typescript
// src/config/jwt.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  accessExpiration: process.env.JWT_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
}));
```

### 2.3 Required Environment Variables

| Category | Variable | Default | Required |
|---|---|---|---|
| **App** | `NODE_ENV` | `development` | Yes |
| | `PORT` | `3000` | No |
| | `API_PREFIX` | `api/v1` | No |
| **Database** | `DATABASE_URL` | — | Yes |
| **Redis** | `REDIS_HOST` | `localhost` | No |
| | `REDIS_PORT` | `6379` | No |
| | `REDIS_PASSWORD` | — | No |
| **JWT** | `JWT_SECRET` | — | Yes |
| | `JWT_EXPIRATION` | `15m` | No |
| | `JWT_REFRESH_SECRET` | — | Yes |
| | `JWT_REFRESH_EXPIRATION` | `30d` | No |
| **OTP** | `OTP_EXPIRY_MINUTES` | `5` | No |
| | `OTP_MAX_RETRIES` | `3` | No |
| **SMS** | `TWILIO_ACCOUNT_SID` | — | For OTP |
| | `TWILIO_AUTH_TOKEN` | — | For OTP |
| | `TWILIO_PHONE_NUMBER` | — | For OTP |
| **S3** | `AWS_REGION` | `ap-south-1` | No |
| | `AWS_ACCESS_KEY_ID` | — | For uploads |
| | `AWS_SECRET_ACCESS_KEY` | — | For uploads |
| | `AWS_S3_BUCKET` | `fixora-uploads` | No |
| **FCM** | `FIREBASE_PROJECT_ID` | — | For push |
| | `FIREBASE_PRIVATE_KEY` | — | For push |
| | `FIREBASE_CLIENT_EMAIL` | — | For push |
| **Payments** | `JAZZCASH_MERCHANT_ID` | — | For payments |
| | `JAZZCASH_PASSWORD` | — | For payments |
| | `STRIPE_SECRET_KEY` | — | For payments |
| **Maps** | `GOOGLE_MAPS_API_KEY` | — | For geocoding |

---

## 3. Request Lifecycle & Middleware Pipeline

Every HTTP request passes through this pipeline in order:

```
Client Request
     │
     ▼
┌─────────────────────────────┐
│  1. CORS Middleware          │  ← Allow trusted origins
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  2. Rate Limiter Middleware  │  ← Per-IP / per-user limits
│     (Redis-backed)          │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  3. Request Logger           │  ← Method, URL, timestamp, user
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  4. JwtAuthGuard             │  ← Extract & verify JWT
│     (skip if @Public())     │     Load user from Redis session
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  5. RolesGuard               │  ← Check @Roles('worker') etc.
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  6. ValidationPipe           │  ← class-validator DTO check
│     (whitelist + transform) │     Reject unknown fields
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  7. Controller Handler       │  ← Route-specific logic
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  8. TransformInterceptor     │  ← Wrap in { success, data, meta }
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  9. GlobalExceptionFilter    │  ← Catch unhandled errors
└─────────────┬───────────────┘
              │
              ▼
       Client Response
```

### 3.1 Middleware Registration (app.module.ts)

```typescript
// Applied globally in main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // Strip unknown properties
  forbidNonWhitelisted: true, // Throw on unknown properties
  transform: true,            // Auto-transform to DTO types
  transformOptions: {
    enableImplicitConversion: true,
  },
}));

app.useGlobalFilters(new GlobalExceptionFilter());
app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());
app.useGlobalGuards(new JwtAuthGuard(), new RolesGuard());
```

### 3.2 Rate Limiting Rules

| Endpoint Pattern | Limit | Window | Storage |
|---|---|---|---|
| `POST /auth/otp/send` | 3 requests | 5 min | Redis `rate:otp:{phone}` |
| `POST /auth/otp/verify` | 5 requests | 5 min | Redis `rate:verify:{phone}` |
| `POST /jobs` | 5 requests | 1 hour | Redis `rate:job:{userId}` |
| `POST /uploads/*` | 10 requests | 1 min | Redis `rate:upload:{userId}` |
| `POST /chat/*` | 30 requests | 1 min | Redis `rate:chat:{userId}` |
| All other endpoints | 100 requests | 1 min | Redis `rate:{ip}` |

---

## 4. Authentication Flow

### 4.1 OTP + JWT Token Flow

```
┌──────────┐                          ┌──────────┐
│  Client  │                          │  Server  │
└────┬─────┘                          └────┬─────┘
     │                                     │
     │  POST /auth/otp/send               │
     │  { phone: "+923001234567" }         │
     │────────────────────────────────────►│
     │                                     │── Generate 6-digit OTP
     │                                     │── Store in Redis (key: otp:+923001234567, TTL: 5min)
     │                                     │── Send via Twilio SMS
     │  { success: true, message: "OTP sent" }│
     │◄────────────────────────────────────│
     │                                     │
     │  POST /auth/otp/verify             │
     │  { phone: "+923001234567",          │
     │    otp: "482910" }                  │
     │────────────────────────────────────►│
     │                                     │── Read OTP from Redis
     │                                     │── Compare (constant-time)
     │                                     │── Delete OTP from Redis
     │                                     │── Find or create User
     │                                     │── Generate JWT (sub, phone, role)
     │                                     │── Generate Refresh Token
     │                                     │── Store refresh in Redis (30 days)
     │                                     │── Create session in Redis
     │  { success, data: {                │
     │      accessToken,                   │
     │      refreshToken,                  │
     │      user: { id, name, role }       │
     │  }}                                 │
     │◄────────────────────────────────────│
     │                                     │
     │  POST /auth/token/refresh          │
     │  { refreshToken }                   │
     │────────────────────────────────────►│
     │                                     │── Verify refresh token exists in Redis
     │                                     │── Delete old refresh (rotation)
     │                                     │── Issue new access + refresh pair
     │  { accessToken, refreshToken }      │
     │◄────────────────────────────────────│
```

### 4.2 Token Specifications

| Token | Algorithm | Payload | Lifetime | Storage |
|---|---|---|---|---|
| Access Token | HS256 | `{ sub, phone, role, iat }` | 15 min | Memory (JS variable) |
| Refresh Token | UUID v4 | Random string | 30 days | HTTP-only secure cookie or secure storage |

### 4.3 Session Tracking

Every authenticated user has a Redis session:

```
Key:   session:{userId}
Value: JSON { socketId, lastActive, deviceId }
TTL:   30 days (refreshed on each request)
```

When `logout` is called → session deleted from Redis → all existing JWTs become invalid on next use.

### 4.4 OTP Rules

| Rule | Value |
|---|---|
| OTP length | 6 digits |
| OTP expiry | 5 minutes |
| Max resend per phone | 3 per 15 minutes |
| Max verify attempts | 5 per OTP |
| Lockout after failure | 15 minutes |

---

## 5. Role-Based Access Control

### 5.1 Role Hierarchy

```
super_admin > admin > worker > customer
```

### 5.2 Endpoint Protection Matrix

| Endpoint | Customer | Worker | Admin | Super Admin | Public |
|---|---|---|---|---|---|
| `POST /auth/otp/send` | — | — | — | — | ✅ |
| `POST /auth/otp/verify` | — | — | — | — | ✅ |
| `GET /users/me` | ✅ | ✅ | ✅ | ✅ | — |
| `PUT /users/me` | ✅ | ✅ | ✅ | ✅ | — |
| `PUT /users/worker/me` | — | ✅ | — | — | — |
| `PUT /users/worker/availability` | — | ✅ | — | — | — |
| `PUT /users/location` | — | ✅ | — | — | — |
| `GET /users/worker/:id` | ✅ | ✅ | ✅ | ✅ | — |
| `POST /jobs` | ✅ | — | — | — | — |
| `GET /jobs/my` | ✅ | — | — | — | — |
| `GET /jobs/available` | — | ✅ | — | — | — |
| `GET /jobs/:id` | ✅ | ✅ | ✅ | ✅ | — |
| `PUT /jobs/:id/status` | ✅ | ✅ | ✅ | ✅ | — |
| `POST /jobs/:jobId/offers` | — | ✅ | — | — | — |
| `GET /jobs/:jobId/offers` | ✅ | — | ✅ | ✅ | — |
| `PUT /offers/:id/accept` | ✅ | — | — | — | — |
| `PUT /offers/:id/reject` | ✅ | — | — | — | — |
| `PUT /offers/:id/withdraw` | — | ✅ | — | — | — |
| `POST /visits` | — | ✅ | — | — | — |
| `PUT /visits/:id/status` | — | ✅ | — | — | — |
| `POST /visits/:id/estimate` | — | ✅ | — | — | — |
| `PUT /repairs/:id/accept` | ✅ | — | — | — | — |
| `PUT /repairs/:id/counter` | ✅ | — | — | — | — |
| `POST /payments/initiate` | ✅ | — | — | — | — |
| `GET /payments/my` | ✅ | ✅ | — | — | — |
| `POST /jobs/:jobId/review` | ✅ | ✅ | — | — | — |
| `GET /chat/conversations` | ✅ | ✅ | — | — | — |
| `GET /notifications` | ✅ | ✅ | ✅ | ✅ | — |
| `GET /admin/dashboard` | — | — | ✅ | ✅ | — |
| `PUT /admin/verifications/:id` | — | — | ✅ | ✅ | — |
| `PUT /admin/users/:id/toggle` | — | — | ✅ | ✅ | — |
| `PUT /admin/settings/*` | — | — | — | ✅ | — |

---

## 6. Complete API Reference

All endpoints are prefixed with `/api/v1`.

### 6.1 Auth Module (`/auth`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/auth/otp/send` | No | — | Send OTP to phone |
| `POST` | `/auth/otp/verify` | No | — | Verify OTP, return tokens |
| `POST` | `/auth/register` | Yes | Any | Complete registration (name, role) |
| `POST` | `/auth/token/refresh` | No | — | Refresh access token |
| `POST` | `/auth/logout` | Yes | Any | Invalidate session + refresh |

### 6.2 Users Module (`/users`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/users/me` | Yes | Any | Get own profile |
| `PUT` | `/users/me` | Yes | Any | Update name, avatar, email |
| `PUT` | `/users/location` | Yes | Worker | Update GPS coordinates |
| `PUT` | `/users/worker/me` | Yes | Worker | Update worker profile (skills, bio, rate) |
| `PUT` | `/users/worker/availability` | Yes | Worker | Toggle online/offline |
| `GET` | `/users/worker/:id` | Yes | Any | Get public worker profile |
| `GET` | `/users/:id/reviews` | Yes | Any | Get reviews for a user |
| `POST` | `/admin/workers/:id/verify` | Yes | Admin | Verify worker |

### 6.3 Jobs Module (`/jobs`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/jobs` | Yes | Customer | Create service request |
| `GET` | `/jobs/my` | Yes | Customer | List own jobs |
| `GET` | `/jobs/available` | Yes | Worker | Nearby open jobs |
| `GET` | `/jobs/:id` | Yes | Any | Get job details |
| `PUT` | `/jobs/:id/status` | Yes | Any | Advance job state |
| `PUT` | `/jobs/:id/cancel` | Yes | Customer | Cancel job |
| `PUT` | `/jobs/:id/images` | Yes | Customer | Add/remove images |

**Create Job Request:**

```json
{
  "categoryId": "uuid",
  "title": "Leaking kitchen pipe",
  "description": "Water dripping from under-sink pipe since morning",
  "latitude": 33.6844,
  "longitude": 73.0479,
  "address": "House 12, Street 5, F-8/2",
  "city": "Islamabad",
  "area": "F-8",
  "urgency": "high",
  "estimatedBudget": 3000,
  "images": ["url1", "url2"],
  "voiceNoteUrl": "url"
}
```

### 6.4 Offers Module (`/offers`, `/jobs/:jobId/offers`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/jobs/:jobId/offers` | Yes | Worker | Submit offer |
| `GET` | `/jobs/:jobId/offers` | Yes | Customer | List offers for job |
| `GET` | `/offers/my` | Yes | Worker | List own offers |
| `PUT` | `/offers/:id/accept` | Yes | Customer | Accept offer |
| `PUT` | `/offers/:id/reject` | Yes | Customer | Reject offer |
| `PUT` | `/offers/:id/withdraw` | Yes | Worker | Withdraw offer |

**Submit Offer Request:**

```json
{
  "visitCharge": 500,
  "estimatedRepairCost": 2500,
  "message": "I am a licensed plumber with 8 years experience. Can reach in 30 min."
}
```

### 6.5 Visits Module (`/visits`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/visits` | Yes | Worker | Schedule visit (auto after offer accept) |
| `GET` | `/visits/:id` | Yes | Any | Get visit details |
| `PUT` | `/visits/:id/status` | Yes | Worker | Update status (in_progress, completed) |
| `PUT` | `/visits/:id/inspection` | Yes | Worker | Add inspection notes + images |
| `GET` | `/visits/upcoming` | Yes | Worker | Worker's upcoming visits |
| `PUT` | `/visits/:id/reschedule` | Yes | Worker | Change visit date |

### 6.6 Repair Estimate Module (`/repairs`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/visits/:visitId/estimate` | Yes | Worker | Submit repair estimate |
| `GET` | `/repairs/:id` | Yes | Any | Get current estimate |
| `PUT` | `/repairs/:id/counter` | Yes | Customer | Submit counter-offer |
| `PUT` | `/repairs/:id/accept` | Yes | Customer | Approve repair price |
| `PUT` | `/repairs/:id/reject` | Yes | Customer | Reject (cancel or re-negotiate) |

**Create Estimate Request:**

```json
{
  "description": "Replace damaged pipe section + labor",
  "amount": 3500,
  "itemsBreakdown": [
    { "item": "PVC Pipe (2 inch, 3ft)", "cost": 800 },
    { "item": "Coupling + Elbow", "cost": 400 },
    { "item": "Labor", "cost": 2300 }
  ]
}
```

### 6.7 Payments Module (`/payments`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/payments/initiate` | Yes | Customer | Start payment for completed job |
| `POST` | `/webhooks/payment/:gateway` | No | — | Gateway webhook callback |
| `GET` | `/payments/:id/status` | Yes | Any | Check payment status |
| `GET` | `/payments/my` | Yes | Any | User's payment history |
| `POST` | `/payments/:id/refund` | Yes | Customer | Request refund (24h window) |
| `POST` | `/admin/payouts/process` | Yes | Admin | Process worker payouts |

**Initiate Payment Request:**

```json
{
  "jobId": "uuid",
  "method": "jazzcash"
}
```

### 6.8 Reviews Module (`/reviews`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/jobs/:jobId/review` | Yes | Customer/Worker | Submit review |
| `GET` | `/jobs/:jobId/reviews` | Yes | Any | Get reviews for a job |
| `GET` | `/users/:id/reviews` | Yes | Any | Get reviews for a user |
| `POST` | `/reviews/:id/flag` | Yes | Any | Flag inappropriate review |

**Submit Review Request:**

```json
{
  "rating": 5,
  "comment": "Excellent work! Fixed the pipe quickly and cleanly.",
  "images": ["url1"]
}
```

### 6.9 Chat Module (`/chat`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/chat/conversations` | Yes | Any | List user's conversations |
| `GET` | `/chat/:convId/messages` | Yes | Any | Get message history (paginated) |
| `POST` | `/chat/:convId/messages` | Yes | Any | Send text/image/voice message |
| `PUT` | `/chat/:convId/read` | Yes | Any | Mark messages as read |

### 6.10 Notifications Module (`/notifications`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/notifications` | Yes | Any | List notifications (paginated) |
| `PUT` | `/notifications/:id/read` | Yes | Any | Mark single notification read |
| `PUT` | `/notifications/read-all` | Yes | Any | Mark all as read |
| `GET` | `/notifications/unread-count` | Yes | Any | Get unread count |

### 6.11 Uploads Module (`/uploads`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/uploads/image` | Yes | Any | Upload + resize image |
| `POST` | `/uploads/voice` | Yes | Any | Upload voice note |
| `POST` | `/uploads/document` | Yes | Any | Upload ID document |
| `GET` | `/uploads/:key/url` | Yes | Any | Get pre-signed download URL |
| `DELETE` | `/uploads/:key` | Yes | Any | Delete uploaded file |

**File Limits:**

| Type | Formats | Max Size | Processing |
|---|---|---|---|
| Images | JPEG, PNG, WebP | 5 MB | 3 variants (150px, 600px, 1200px) |
| Voice | OGG, M4A, WAV | 10 MB | Store original |
| Documents | PDF, JPG, PNG | 5 MB | Store original |

### 6.12 Search Module (`/search`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/search/jobs` | Yes | Any | Full-text search jobs |
| `GET` | `/search/workers` | Yes | Any | Search workers by skill + location |

### 6.13 Admin Module (`/admin`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/admin/dashboard` | Yes | Admin | Stats: jobs, users, revenue |
| `GET` | `/admin/users` | Yes | Admin | List all users (filterable) |
| `GET` | `/admin/users/:id` | Yes | Admin | Get user details |
| `PUT` | `/admin/users/:id/toggle` | Yes | Admin | Activate/deactivate user |
| `GET` | `/admin/verifications/pending` | Yes | Admin | Pending worker verifications |
| `PUT` | `/admin/verifications/:userId` | Yes | Admin | Approve/reject worker |
| `GET` | `/admin/disputes` | Yes | Admin | List all disputes |
| `PUT` | `/admin/disputes/:id/resolve` | Yes | Admin | Resolve a dispute |
| `PUT` | `/admin/settings/commission` | Yes | Super Admin | Update commission rate |
| `GET` | `/admin/analytics` | Yes | Admin | Platform analytics |

### 6.14 Health Module

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Returns `{ status: "ok", db: "ok", redis: "ok" }` |

---

## 7. Job State Machine

### 7.1 State Diagram

```
                         ┌────────────┐
                         │    open     │
                         └─────┬──────┘
                               │ Worker submits first offer
                         ┌─────▼──────┐
                         │offers_received│
                         └─────┬──────┘
                               │ Customer accepts an offer
                         ┌─────▼──────┐
                         │offer_accepted│
                         └─────┬──────┘
                               │ Worker assigned (auto)
                         ┌─────▼──────┐
                         │worker_assigned│
                         └─────┬──────┘
                               │ Visit scheduled
                         ┌─────▼──────┐
                         │visit_scheduled│
                         └─────┬──────┘
                               │ Worker confirms arrival
                         ┌─────▼────────┐
                         │visit_in_progress│
                         └─────┬────────┘
                               │ Inspection done
                         ┌─────▼────────┐
                         │visit_completed│
                         └─────┬────────┘
                               │ Worker submits estimate
                         ┌─────▼────────────┐
                         │repair_negotiating  │
                         └─────┬────────────┘
                               │ Customer approves
                         ┌─────▼──────────┐
                         │ repair_approved  │
                         └─────┬──────────┘
                               │ Worker begins repair
                         ┌─────▼──────────┐
                         │   in_progress    │
                         └─────┬──────────┘
                               │ Work done
                         ┌─────▼──────────┐
                         │    completed     │
                         └─────┬──────────┘
                               │ Payment confirmed
                         ┌─────▼──────────┐
                         │      paid        │
                         └─────┬──────────┘
                               │ Review submitted
                         ┌─────▼──────────┐
                         │    reviewed      │
                         └─────────────────┘

    ┌───────────────────────────────────────────────────┐
    │  cancelled (from: open → worker_assigned)          │
    │  disputed  (from: in_progress, completed)          │
    └───────────────────────────────────────────────────┘
```

### 7.2 Valid State Transitions

```typescript
const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  open:                ['offers_received', 'cancelled'],
  offers_received:     ['offer_accepted', 'cancelled'],
  offer_accepted:      ['worker_assigned', 'cancelled'],
  worker_assigned:     ['visit_scheduled', 'cancelled'],
  visit_scheduled:     ['visit_in_progress', 'cancelled'],
  visit_in_progress:   ['visit_completed', 'cancelled'],
  visit_completed:     ['repair_negotiating', 'cancelled'],
  repair_negotiating:  ['repair_approved', 'cancelled'],
  repair_approved:     ['in_progress', 'cancelled'],
  in_progress:         ['completed', 'disputed'],
  completed:           ['paid', 'disputed'],
  paid:                ['reviewed'],
  reviewed:            [],
  cancelled:           [],
  disputed:            [],
};
```

### 7.3 Who Can Trigger Each Transition

| Transition | Triggered By |
|---|---|
| `open → offers_received` | System (auto when first offer submitted) |
| `offers_received → offer_accepted` | Customer |
| `offer_accepted → worker_assigned` | System (auto) |
| `worker_assigned → visit_scheduled` | Worker |
| `visit_scheduled → visit_in_progress` | Worker |
| `visit_in_progress → visit_completed` | Worker |
| `visit_completed → repair_negotiating` | Worker (submits estimate) |
| `repair_negotiating → repair_approved` | Customer |
| `repair_approved → in_progress` | Worker |
| `in_progress → completed` | Worker |
| `completed → paid` | System (on payment webhook) |
| `paid → reviewed` | Customer or Worker |
| Any active → `cancelled` | Customer |
| `in_progress`, `completed` → `disputed` | Customer or Worker |

---

## 8. Inter-Module Event System

Modules communicate through an internal event bus (NestJS `EventEmitter2`). No direct service-to-service calls between modules unless they share the same domain.

### 8.1 Event Catalog

| Event | Emitted By | Consumed By | Payload |
|---|---|---|---|
| `job.created` | Jobs | Notifications, Search, Location | `Job` object |
| `job.statusChanged` | Jobs | Notifications, Chat | `{ jobId, oldStatus, newStatus }` |
| `job.cancelled` | Jobs | Notifications, Visits | `{ jobId, reason }` |
| `offer.submitted` | Offers | Notifications | `{ offer, job }` |
| `offer.accepted` | Offers | Jobs, Visits, Chat, Notifications | `{ offer, job }` |
| `offer.rejected` | Offers | Notifications | `{ offer, workerId }` |
| `visit.scheduled` | Visits | Notifications | `{ visit, job }` |
| `visit.completed` | Visits | Repair, Notifications | `{ visit, job }` |
| `visit.noShow` | Visits | Notifications, Jobs | `{ visit, workerId }` |
| `repair.proposed` | Repair | Notifications | `{ estimate, job }` |
| `repair.approved` | Repair | Jobs, Notifications | `{ estimate, job }` |
| `repair.counterOffered` | Repair | Notifications | `{ estimate, job }` |
| `payment.completed` | Payments | Jobs, Reviews, Notifications | `{ payment, job }` |
| `payment.failed` | Payments | Notifications | `{ payment, error }` |
| `review.submitted` | Reviews | Users, Notifications | `{ review, job }` |
| `dispute.opened` | Admin | Notifications, Jobs | `{ dispute, job }` |
| `dispute.resolved` | Admin | Notifications, Payments | `{ dispute, resolution }` |
| `worker.verified` | Admin | Notifications | `{ workerId }` |
| `worker.locationUpdated` | Location | Chat, Jobs | `{ userId, lat, lng }` |

### 8.2 Event Bus Implementation

```typescript
// src/common/event-bus/event-bus.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Typed events interface
interface FixoraEvents {
  'job.created': { jobId: string; customerId: string; categoryId: string; lat: number; lng: number };
  'job.statusChanged': { jobId: string; oldStatus: string; newStatus: string };
  'offer.submitted': { offerId: string; jobId: string; workerId: string };
  'offer.accepted': { offerId: string; jobId: string; workerId: string; customerId: string };
  'payment.completed': { paymentId: string; jobId: string; amount: number };
  // ... all events typed here
}

@Injectable()
export class EventBusService {
  constructor(private eventEmitter: EventEmitter2) {}

  emit<K extends keyof FixoraEvents>(event: K, data: FixoraEvents[K]): void {
    this.eventEmitter.emit(event, data);
  }

  on<K extends keyof FixoraEvents>(event: K, handler: (data: FixoraEvents[K]) => void | Promise<void>): void {
    this.eventEmitter.on(event, handler);
  }
}
```

### 8.3 Event Flow Example: Job Created

```
Customer POSTs /jobs
     │
     ▼
JobsController.createJob()
     │
     ├─► JobsService.createJob()
     │     ├─► Save to PostgreSQL
     │     └─► Emit 'job.created'
     │
     ├─► NotificationService (on 'job.created')
     │     ├─► Find nearby workers (PostGIS query)
     │     ├─► Send push notification (FCM) to each
     │     └─► Store in-app notifications
     │
     ├─► SearchService (on 'job.created')
     │     └─► Index job in search (PostgreSQL FTS)
     │
     └─► Socket.IO broadcast
           └─► Notify connected workers in same city
```

---

## 9. Socket.IO Real-Time Specification

### 9.1 Namespace Structure

| Namespace | Purpose | Authentication |
|---|---|---|
| `/` | General (job updates, notifications) | JWT required |
| `/chat` | Messaging | JWT required |
| `/location` | Worker location tracking | JWT required |

### 9.2 Connection Flow

```
Client connects with JWT
     │
     ▼
Socket.IO middleware
     │── Extract token from handshake.auth.token
     │── Verify JWT
     │── Load user session from Redis
     │── Attach user to socket.data
     │
     ▼
Join user-specific room: user:{userId}
     │
     ▼
Join role-specific room: workers:{city} or customers:{city}
```

### 9.3 Event Catalog

**Client → Server:**

| Event | Namespace | Payload | Description |
|---|---|---|---|
| `chat:join` | `/chat` | `{ conversationId }` | Join chat room |
| `chat:message` | `/chat` | `{ conversationId, text?, image?, voice? }` | Send message |
| `chat:typing` | `/chat` | `{ conversationId }` | Typing indicator |
| `chat:stopTyping` | `/chat` | `{ conversationId }` | Stop typing |
| `chat:read` | `/chat` | `{ conversationId, messageId }` | Mark read |
| `location:update` | `/location` | `{ latitude, longitude }` | Worker location |
| `location:track:start` | `/location` | `{ jobId }` | Start tracking for visit |
| `location:track:stop` | `/location` | `{ jobId }` | Stop tracking |
| `job:subscribe` | `/` | `{ jobId }` | Subscribe to job updates |

**Server → Client:**

| Event | Namespace | Payload | Description |
|---|---|---|---|
| `job:new` | `/` | `{ job }` | New job in worker's area |
| `job:offer` | `/` | `{ offer, job }` | New offer on customer's job |
| `job:offer:accepted` | `/` | `{ offer }` | Customer accepted offer |
| `job:status:changed` | `/` | `{ jobId, oldStatus, newStatus }` | Job state update |
| `job:cancelled` | `/` | `{ jobId }` | Job cancelled |
| `chat:message` | `/chat` | `{ conversationId, message }` | New message |
| `chat:typing` | `/chat` | `{ conversationId, userId }` | Typing indicator |
| `chat:read` | `/chat` | `{ conversationId, messageId }` | Read receipt |
| `location:worker` | `/location` | `{ userId, latitude, longitude }` | Worker location update |
| `notification:new` | `/` | `{ notification }` | In-app notification |

### 9.4 Connection Management

```typescript
// Redis adapter for multi-instance support
// In chat.gateway.ts

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  async handleConnection(socket: Socket) {
    const token = socket.handshake.auth.token;
    const user = await this.authService.verifySocketToken(token);
    if (!user) return socket.disconnect();

    socket.data.user = user;
    await this.redisService.setSocketUser(socket.id, user.sub);
    socket.join(`user:${user.sub}`);
  }

  async handleDisconnect(socket: Socket) {
    await this.redisService.removeSocketMapping(socket.id);
  }
}
```

---

## 10. Background Jobs & Queues

### 10.1 Queue Definitions

Using **Bull** (Redis-backed) for background job processing.

| Queue | Purpose | Concurrency | Retries |
|---|---|---|---|
| `notifications` | Send push/SMS notifications | 5 | 3 |
| `file-processing` | Resize images, process voice | 3 | 2 |
| `payments` | Process payment webhooks | 3 | 5 |
| `payouts` | Daily worker payout batch | 1 | 3 |
| `search-indexing` | Index jobs/workers in search | 3 | 2 |
| `location-cleanup` | Delete old location records (>90 days) | 1 | 1 |
| `analytics` | Aggregate daily analytics | 1 | 2 |

### 10.2 Example: Notification Queue

```typescript
// Producing (in notification.service.ts)
@Processor('notifications')
export class NotificationsProcessor {
  @Process('send-push')
  async handleSendPush(job: Job<{ userId: string; title: string; body: string; data: any }>) {
    const { userId, title, body, data } = job.data;
    const fcmToken = await this.usersService.getFcmToken(userId);
    if (fcmToken) {
      await this.firebaseService.sendPush(fcmToken, title, body, data);
    }
  }

  @Process('send-sms')
  async handleSendSms(job: Job<{ phone: string; message: string }>) {
    await this.smsService.send(job.data.phone, job.data.message);
  }
}

// Emitting
await this.notificationsQueue.add('send-push', {
  userId: workerId,
  title: 'New Job Nearby!',
  body: `Plumbing job in ${area}`,
  data: { jobId, type: 'job.new' },
});
```

### 10.3 Scheduled Tasks

| Task | Schedule | Description |
|---|---|---|
| `cleanup-location` | Daily 3:00 AM | Delete location records older than 90 days |
| `process-payouts` | Daily 6:00 AM | Batch process worker payouts |
| `aggregate-analytics` | Daily 1:00 AM | Calculate daily stats |
| `clean-expired-otp` | Every 15 min | Remove expired OTPs from Redis |
| `refresh-cache` | Every 5 min | Refresh popular search caches |
| `visit-reminder` | Every hour | Send reminders for visits in next 24h |

---

## 11. Error Handling Strategy

### 11.1 Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "JOB_NOT_FOUND",
    "message": "The requested job does not exist",
    "details": {}
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-09-03T10:00:00.000Z"
  }
}
```

### 11.2 Error Code Catalog

| Code | HTTP Status | Module | Description |
|---|---|---|---|
| `AUTH_OTP_EXPIRED` | 400 | Auth | OTP has expired (5 min) |
| `AUTH_OTP_INVALID` | 400 | Auth | Wrong OTP entered |
| `AUTH_OTP_MAX_RETRIES` | 429 | Auth | Too many OTP attempts |
| `AUTH_TOKEN_EXPIRED` | 401 | Auth | JWT expired |
| `AUTH_SESSION_EXPIRED` | 401 | Auth | Session no longer in Redis |
| `USER_NOT_FOUND` | 404 | Users | User does not exist |
| `USER_UNAUTHORIZED` | 403 | Users | Insufficient permissions |
| `USER_ALREADY_EXISTS` | 409 | Auth | Phone already registered |
| `JOB_NOT_FOUND` | 404 | Jobs | Job does not exist |
| `JOB_INVALID_STATE` | 400 | Jobs | Cannot transition from current state |
| `JOB_UNAUTHORIZED` | 403 | Jobs | Not the job owner/worker |
| `JOB_CANCELLED` | 400 | Jobs | Job already cancelled |
| `OFFER_DUPLICATE` | 409 | Offers | Worker already made offer for this job |
| `OFFER_NOT_FOUND` | 404 | Offers | Offer does not exist |
| `OFFER_ALREADY_ACCEPTED` | 400 | Offers | Another offer already accepted |
| `VISIT_NOT_FOUND` | 404 | Visits | Visit does not exist |
| `VISIT_INVALID_STATUS` | 400 | Visits | Cannot update to this status |
| `REPAIR_MAX_NEGOTIATIONS` | 400 | Repair | Maximum 5 negotiation rounds reached |
| `PAYMENT_FAILED` | 402 | Payments | Payment processing failed |
| `PAYMENT_NOT_FOUND` | 404 | Payments | Payment record not found |
| `PAYMENT_REFUND_WINDOW` | 400 | Payments | Refund window expired (24h) |
| `REVIEW_ALREADY_EXISTS` | 409 | Reviews | Already reviewed this job |
| `REVIEW_WINDOW_EXPIRED` | 400 | Reviews | Review window expired (7 days) |
| `FILE_TOO_LARGE` | 413 | Uploads | File exceeds size limit |
| `FILE_INVALID_TYPE` | 400 | Uploads | File type not allowed |
| `RATE_LIMITED` | 429 | Global | Too many requests |
| `VALIDATION_ERROR` | 400 | Global | Request body validation failed |
| `NOT_FOUND` | 404 | Global | Resource not found |
| `INTERNAL_ERROR` | 500 | Global | Unexpected server error |

### 11.3 Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const requestId = uuid();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      // Extract code/message from custom exceptions or class-validator
    } else if (exception instanceof PrismaClientKnownRequestError) {
      // Handle Prisma errors (unique constraint, not found, etc.)
    }

    // Log to monitoring service (Sentry)
    this.sentryService.captureException(exception, { requestId, userId: request.user?.sub });

    response.status(status).json({
      success: false,
      error: { code, message, details },
      meta: { requestId, timestamp: new Date().toISOString() },
    });
  }
}
```

---

## 12. Logging & Observability

### 12.1 Log Levels

| Level | Usage |
|---|---|
| `error` | Unhandled exceptions, database failures, payment errors |
| `warn` | Rate limit hits, deprecated API usage, failed validations |
| `info` | Request logs, job state changes, payment completions |
| `debug` | SQL queries (dev only), Redis operations, event emissions |

### 12.2 Structured Log Format

```json
{
  "level": "info",
  "timestamp": "2026-09-03T10:00:00.000Z",
  "requestId": "req_abc123",
  "userId": "uuid",
  "method": "POST",
  "path": "/api/v1/jobs",
  "statusCode": 201,
  "duration": 45,
  "message": "Job created successfully",
  "context": "JobsController"
}
```

### 12.3 Monitoring Stack

| Tool | Purpose | Environment |
|---|---|---|
| **Sentry** | Error tracking + alerting | All |
| **CloudWatch / Datadog** | Metrics, dashboards, alarms | Production |
| **Prometheus + Grafana** | Custom metrics (job count, revenue, active users) | Production |
| **ELK Stack** | Centralized log search | Production |
| **PagerDuty** | On-call alerting | Production |

---

## 13. Testing Strategy

### 13.1 Test Pyramid

```
           ┌───────────┐
           │  E2E (5%) │  ← Full API tests (supertest)
           └─────┬─────┘
                 │
         ┌───────┴────────┐
         │ Integration     │  ← Module tests with real DB/Redis
         │ (25%)           │     (Testcontainers or Docker)
         └───────┬─────────┘
                 │
     ┌───────────┴───────────────┐
     │  Unit Tests (70%)          │  ← Service logic, state machine,
     │                            │     validators, helpers
     └────────────────────────────┘
```

### 13.2 What to Test Per Module

| Module | Unit Tests | Integration Tests | E2E Tests |
|---|---|---|---|
| Auth | OTP generation, JWT signing, token refresh | OTP flow with Redis | Full login/register flow |
| Users | Profile updates, worker validation | Profile CRUD with DB | Profile API |
| Jobs | State machine transitions, validation | Job CRUD with DB | Create → Complete flow |
| Offers | Accept/reject logic, duplicate check | Offer CRUD with DB | Offer → Accept flow |
| Payments | Commission calculation, ledger entries | Payment with mock gateway | Payment webhook flow |
| Reviews | Rating recalculation, validation | Review with DB | Submit review flow |
| Chat | Message creation, read receipts | Chat with Socket.IO | Real-time messaging |
| Notifications | Template rendering, channel routing | Notification with mock FCM | Push notification delivery |

### 13.3 Test Commands

```bash
npm run test              # Run all unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # End-to-end tests
```

### 13.4 Test Configuration

```typescript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['**/*.service.ts', '**/*.controller.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

---

## 14. Docker & Local Development

### 14.1 docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  # PostgreSQL + PostGIS
  postgres:
    image: postgis/postgis:16-3.4
    container_name: fixora-db
    ports:
      - '5432:5432'
    environment:
      POSTGRES_DB: fixora_db
      POSTGRES_USER: fixora
      POSTGRES_PASSWORD: fixora_secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fixora -d fixora_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: fixora-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # MinIO (S3-compatible local storage)
  minio:
    image: minio/minio:latest
    container_name: fixora-minio
    ports:
      - '9000:9000'
      - '9001:9001'
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  # Backend (NestJS)
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
    container_name: fixora-backend
    ports:
      - '3000:3000'
    volumes:
      - ./src:/app/src
      - ./prisma:/app/prisma
    env_file:
      - .env.development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npm run start:dev

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 14.2 Dockerfile (Production)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/main"]
```

### 14.3 Quick Start Commands

```bash
# Clone and start
git clone <repo>
cd fixora-backend
cp .env.example .env.development
docker-compose -f docker-compose.yml up -d
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Backend running at http://localhost:3000
# API available at http://localhost:3000/api/v1
# MinIO console at http://localhost:9001
```

---

## 15. CI/CD Pipeline

### 15.1 Pipeline Stages

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐
│  Push/  │───►│  Lint +  │───►│  Unit   │───►│ Build + │───►│  Deploy  │
│  PR     │    │  Type    │    │  Tests  │    │ Docker  │    │          │
│         │    │  Check   │    │         │    │  Push   │    │          │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └──────────┘
                                                   │
                                           ┌───────┴───────┐
                                           │               │
                                      ┌────▼────┐    ┌────▼────┐
                                      │ Staging │    │   Prod  │
                                      └─────────┘    └─────────┘
```

### 15.2 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_DB: fixora_test
          POSTGRES_USER: fixora
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
      - run: npm run lint
      - run: npm run test:cov
      - run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://fixora:test@localhost:5432/fixora_test
          REDIS_URL: redis://localhost:6379

  build-and-deploy:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t fixora-backend .
      - run: docker push registry/fixora-backend:latest
      - name: Deploy to production
        run: ssh deploy@server "cd /app && docker-compose pull && docker-compose up -d"
```

---

## 16. Environment Strategy

| Environment | Database | Redis | Storage | Purpose |
|---|---|---|---|---|
| **Development** | Local Docker (PostGIS) | Local Docker | MinIO | Local dev |
| **Test** | Testcontainers / Docker | Testcontainers | Mock S3 | Automated tests |
| **Staging** | AWS RDS (PostGIS) | ElastiCache | AWS S3 | Pre-production testing |
| **Production** | AWS RDS Multi-AZ (PostGIS) | ElastiCache Cluster | AWS S3 + CloudFront | Live platform |

### 16.1 Database Migration Strategy

```bash
# Development
npx prisma migrate dev --name add_worker_location

# Staging (after merge to develop)
npx prisma migrate deploy

# Production (after release)
npx prisma migrate deploy
```

**Rules:**
1. Never run `prisma db push` on production
2. Always preview migrations before deploying: `npx prisma migrate diff`
3. Seed data is for development only
4. Production migrations must be backward-compatible (no breaking column drops without data migration first)

---

## 17. API Response Conventions

### 17.1 Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Leaking kitchen pipe",
    "status": "open"
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-09-03T10:00:00.000Z"
  }
}
```

### 17.2 Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-09-03T10:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### 17.3 Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "phone",
      "message": "Phone must be in E.164 format"
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-09-03T10:00:00.000Z"
  }
}
```

### 17.4 Pagination Parameters

| Parameter | Default | Max | Description |
|---|---|---|---|
| `page` | `1` | — | Page number (1-indexed) |
| `limit` | `20` | `100` | Items per page |
| `sortBy` | `created_at` | — | Sort field |
| `sortOrder` | `desc` | — | `asc` or `desc` |
| `search` | — | — | Full-text search query |
| `status` | — | — | Filter by status |
| `city` | — | — | Filter by city |

---

## 18. Security Checklist

### 18.1 Application Security

| Item | Implementation |
|---|---|
| HTTPS everywhere | TLS 1.3, HSTS header |
| CORS whitelist | Only allowed origins |
| Rate limiting | Per-IP + per-user per-endpoint |
| Input validation | class-validator + whitelist mode |
| SQL injection prevention | Prisma ORM (parameterized queries) |
| XSS prevention | Output encoding + CSP headers |
| CSRF protection | SameSite cookies + CSRF tokens |
| File upload validation | Type + size + magic bytes |
| JWT in memory only | Never localStorage |
| Refresh token rotation | New token on each use |
| Password/OTP brute force | Rate limiting + lockout |
| Sensitive data encryption | AES-256 at rest |
| Audit logging | All admin + payment actions |

### 18.2 Infrastructure Security

| Item | Implementation |
|---|---|
| VPC isolation | Private subnets for DB/Redis |
| Security groups | Minimal port exposure |
| WAF | OWASP top 10 rules |
| DDoS protection | AWS Shield / CloudFlare |
| Secret management | AWS Secrets Manager / environment variables |
| Container scanning | Trivy in CI pipeline |
| Dependency scanning | npm audit + Dependabot |

---

## 19. File Naming Conventions

### 19.1 General Rules

| Type | Convention | Example |
|---|---|---|
| NestJS modules | `*.module.ts` | `auth.module.ts` |
| Controllers | `*.controller.ts` | `auth.controller.ts` |
| Services | `*.service.ts` | `auth.service.ts` |
| DTOs / Validation | `*.validation.ts` | `auth.validation.ts` |
| Guards | `*.guard.ts` | `jwt-auth.guard.ts` |
| Interceptors | `*.interceptor.ts` | `transform.interceptor.ts` |
| Filters | `*.filter.ts` | `global-exception.filter.ts` |
| Decorators | `*.decorator.ts` | `roles.decorator.ts` |
| Event handlers | `*.events.ts` | `jobs.events.ts` |
| Gateways | `*.gateway.ts` | `chat.gateway.ts` |
| Strategies | `*.strategy.ts` | `jwt.strategy.ts` |
| Tests | `*.spec.ts` | `auth.service.spec.ts` |
| E2E Tests | `*.e2e-spec.ts` | `app.e2e-spec.ts` |
| Config | `*.config.ts` | `jwt.config.ts` |
| Templates | `*.template.ts` | `otp.template.ts` |

### 19.2 NestJS Conventions

- One module per folder under `src/modules/`
- Controllers handle HTTP, services handle logic, DTOs handle validation
- Shared logic goes in `src/common/`
- No circular dependencies between modules
- Every service that crosses module boundaries must be imported via its module

---

## 20. Development Workflow

### 20.1 Branch Strategy

```
main              ← Production releases (protected)
  ├── develop     ← Integration branch (all features merge here)
  │     ├── feature/auth-module
  │     ├── feature/jobs-state-machine
  │     ├── feature/payments-jazzcash
  │     └── feature/chat-socketio
  └── hotfix/critical-payment-bug
```

### 20.2 Feature Development Flow

```
1. Create branch from develop:     git checkout -b feature/jobs-module develop
2. Implement module (controller, service, DTOs, tests)
3. Write unit tests (80%+ coverage for service layer)
4. Write integration tests for DB operations
5. Run lint:                       npm run lint
6. Run tests:                      npm run test
7. Run typecheck:                  npx tsc --noEmit
8. Create PR to develop
9. CI runs (lint + test + build)
10. Code review by team lead
11. Merge to develop
12. Deploy to staging
13. QA verification
14. Release to production
```

### 20.3 Code Review Checklist

- [ ] TypeScript strict mode — no `any` types
- [ ] DTO validation on all inputs
- [ ] RBAC check on all endpoints
- [ ] Unit tests for service logic
- [ ] No secrets in code or commit history
- [ ] Database changes have migration
- [ ] Events emitted for cross-module state changes
- [ ] Error codes from the error catalog
- [ ] Pagination on list endpoints
- [ ] No N+1 queries (check with Prisma query logging)

---

## Appendix A: Module Dependency Matrix

| Module | Depends On | Used By |
|---|---|---|
| **Auth** | Redis, SMS, JWT | All modules (auth guard) |
| **Users** | Auth, File Upload | Jobs, Offers, Payments, Reviews |
| **Jobs** | Users, Location, Categories | Offers, Visits, Notifications |
| **Offers** | Jobs, Users, Notifications | Visits, Chat |
| **Visits** | Offers, Jobs, Notifications | Repair |
| **Repair** | Visits, Jobs, Notifications | Jobs, Payments |
| **Payments** | Jobs, Users, Gateways | Jobs, Notifications |
| **Reviews** | Jobs, Users | Users (rating update) |
| **Chat** | Users, File Upload | Notifications |
| **Notifications** | Redis, FCM, SMS | All modules (emitter) |
| **Location** | PostgreSQL+PostGIS, Redis | Jobs, Chat |
| **Uploads** | S3, Sharp | Users, Jobs, Reviews, Chat |
| **Search** | PostgreSQL FTS | Jobs |
| **Admin** | All modules (read access) | Notifications |

---

## Appendix B: Tech Stack Summary

```
Runtime:          Node.js 20 LTS
Framework:        NestJS 10 (TypeScript)
ORM:              Prisma 5
Database:         PostgreSQL 16 + PostGIS 3.4
Cache:            Redis 7
Real-time:        Socket.IO 4
Queue:            Bull (Redis)
Auth:             JWT (access + refresh) + OTP (Twilio)
Push:             Firebase Cloud Messaging (FCM)
Storage:          AWS S3 / MinIO
Maps:             Google Maps / Mapbox
Payments:         JazzCash / Easypaisa / Stripe
Testing:          Jest + Supertest
CI/CD:            GitHub Actions
Container:        Docker + Docker Compose
Monitoring:       Sentry + CloudWatch/Prometheus
```

---

*Document prepared by Shafqat Ullah — Pending review by Qazi Farhan Ahmad (Team Lead)*
