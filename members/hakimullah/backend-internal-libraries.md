# HUNAR Backend — Internal Libraries

All backend libraries used in our project, listed below.

---

## All Libraries (Quick List)

1. **@nestjs/config** — Reads settings from `.env` files
2. **@prisma/client** — Database operations (ORM)
3. **class-validator** — Checks user input
4. **class-transformer** — Converts input data to correct types
5. **@nestjs/common** — Error handling and responses (built-in NestJS)
6. **nestjs-pino** — Logs what happens in the app
7. **pino** — Fast logging engine
8. **pino-pretty** — Makes logs readable in development
9. **bcrypt** — Hashes passwords securely
10. **@nestjs/jwt** — Creates and verifies login tokens
11. **@nestjs/passport** — User verification strategy
12. **passport-jwt** — JWT token strategy for Passport
13. **ioredis** — Redis client (for cache, queue, OTP, idempotency)
14. **@nestjs/throttler** — Limits repeated requests (rate limiting)
15. **@nestjs/websockets** — WebSocket connections in NestJS
16. **socket.io** — Real-time two-way communication (chat, live updates)
17. **@nestjs/platform-socket.io** — Connects Socket.IO with NestJS
18. **multer** — Handles file uploads
19. **@nestjs/platform-express** — Connects Multer with NestJS
20. **sharp** — Resizes and processes images
21. **@aws-sdk/client-s3** — Stores files on AWS S3 (production)
22. **minio** — Stores files on MinIO (development)
23. **@mapbox/mapbox-sdk** — Converts address to coordinates (geocoding)
24. **firebase-admin** — Sends push notifications via FCM
25. **bullmq** — Background job queue (tasks run later)
26. **@nestjs/bullmq** — Connects BullMQ with NestJS
27. **@nestjs/testing** — NestJS test utilities
28. **jest** — Runs tests
29. **supertest** — Tests API endpoints
30. **@faker-js/faker** — Generates fake data for tests

---

## Library Explanations

---

### 1. @nestjs/config

**What:** Reads all settings like database URL, API keys, and secrets from `.env` files.

**Where used:** Every module that needs any setting or secret.

**Why this over alternatives:** Built into NestJS. `dotenv` alone doesn't validate values. Reading `process.env` directly everywhere is messy.

---

### 2. @prisma/client

**What:** Talks to PostgreSQL database — creates, reads, updates, deletes data.

**Where used:** Every module that stores or retrieves data (users, jobs, offers, payments, messages).

**Why this over alternatives:** Better type safety than TypeORM. Cleaner migrations. Mongoose (MongoDB) was rejected because we need relational data.

---

### 3. class-validator

**What:** Validates user input — checks if phone number is real, price is a number, text isn't empty.

**Where used:** Every module that accepts user input (registration, job posting, offers, payments).

**Why this over alternatives:** Works with TypeScript decorators natively in NestJS. Manual `if/else` checks are repetitive. Joi uses a different style.

---

### 4. class-transformer

**What:** Converts input data to correct types — string to number, plain object to class instance.

**Where used:** Works alongside class-validator in every input-accepting module.

**Why this over alternatives:** Pairs perfectly with class-validator. NestJS uses it by default in its validation pipe.

---

### 5. @nestjs/common (Error & Response)

**What:** Handles errors and makes every API response look the same format.

**Where used:** Every single module — every request goes through it.

**Why this over alternatives:** Built into NestJS — zero extra dependencies. `http-errors` adds unnecessary packages.

---

### 6. nestjs-pino + pino + pino-pretty

**What:** Records logs — who called what, when, how long it took, what failed. `pino-pretty` makes logs readable during development.

**Where used:** Every module. Payments and admin actions logged carefully.

**Why this over alternatives:** Pino is 5x faster than Winston. `console.log` gives no structure, no levels, no rotation.

---

### 7. bcrypt

**What:** Hashes passwords before storing them. One-way — nobody can read the original password.

**Where used:** Auth module — registration and password change.

**Why this over alternatives:** Industry standard. No proven reason to use anything else (argon2 is an option but bcrypt is more widely tested).

---

### 8. @nestjs/jwt + @nestjs/passport + passport-jwt

**What:** Creates JWT tokens on login, verifies them on every protected request. Passport handles the verification strategy.

**Where used:** Every protected endpoint in every module.

**Why this over alternatives:** Official NestJS auth packages. Session auth doesn't work for mobile APIs. Firebase Auth adds vendor lock-in.

---

### 9. ioredis

**What:** Redis client — connects to Redis for caching, queues, OTP storage, and idempotency keys.

**Where used:** Cache, Queue (BullMQ), OTP, Idempotency — any Redis operation.

**Why this over alternatives:** Fastest and most popular Redis client for Node.js. `lru-cache` only works in single process.

---

### 10. @nestjs/throttler

**What:** Limits how many requests a user can make in a time window (e.g., 5 OTP attempts per minute).

**Where used:** Login, OTP, registration, job posting, messaging.

**Why this over alternatives:** Official NestJS package. `express-rate-limit` doesn't integrate with NestJS guards as cleanly.

---

### 11. socket.io + @nestjs/websockets + @nestjs/platform-socket.io

**What:** Real-time WebSocket connections — chat messages, live notifications, job status updates appear instantly.

**Where used:** Chat, notifications, job tracking, admin live dashboard.

**Why this over alternatives:** Socket.IO handles reconnection, rooms, and fallback automatically. SSE is one-directional. Pusher adds cost.

---

### 12. multer + @nestjs/platform-express

**What:** Handles file uploads — receives files from frontend, checks type and size, passes them to storage.

**Where used:** Profile photos, job photos, worker documents, chat images.

**Why this over alternatives:** Standard for file uploads in NestJS/Express. No better alternative exists.

---

### 13. sharp

**What:** Resizes images, creates thumbnails, compresses files.

**Where used:** After file upload — creates small versions of photos for faster loading.

**Why this over alternatives:** Fastest Node.js image library. `jimp` is slower. `imagemagick` requires system-level installation.

---

### 14. @aws-sdk/client-s3 + minio

**What:** Stores files in cloud storage. MinIO for development (runs locally), AWS S3 for production.

**Where used:** All file storage — photos, documents, images.

**Why this over alternatives:** S3 is industry standard. Storing files in database slows everything down. MinIO is free and S3-compatible for dev.

---

### 15. @mapbox/mapbox-sdk

**What:** Converts "Hayatabad, Peshawar" into latitude/longitude coordinates (geocoding).

**Where used:** Job posting (when user types address), worker location setup.

**Why this over alternatives:** Google Maps API works too but costs money at scale. Mapbox has a generous free tier. We only use it for geocoding, not distance (PostGIS handles that).

---

### 16. firebase-admin

**What:** Sends push notifications to user phones via Firebase Cloud Messaging (FCM).

**Where used:** Notification library — triggers push on new offers, payments, messages.

**Why this over alternatives:** FCM is free. OneSignal adds vendor dependency. Custom push is complex to maintain.

---

### 17. bullmq + @nestjs/bullmq

**What:** Runs tasks in the background — sending notifications, matching workers, processing images, payouts.

**Where used:** Worker matching, notifications, file processing, scheduled cleanup.

**Why this over alternatives:** Best Redis-based queue for Node.js. `setInterval` is unreliable. RabbitMQ/Kafka are overkill for our scale.

---

### 18. @nestjs/testing + jest + supertest + @faker-js/faker

**What:** Test framework (jest), API testing (supertest), fake data generation (faker), NestJS test utilities.

**Where used:** Every module is tested using these tools.

**Why this over alternatives:** Jest is NestJS standard. Supertest is Node.js API testing standard. Faker generates realistic test data.

---

## Summary

| # | Package | One Line |
|---|---------|----------|
| 1 | `@nestjs/config` | Reads `.env` settings |
| 2 | `@prisma/client` | Database ORM |
| 3 | `class-validator` | Validates input |
| 4 | `class-transformer` | Converts data types |
| 5 | `@nestjs/common` | Error handling (built-in) |
| 6 | `nestjs-pino` + `pino` | Fast logging |
| 7 | `bcrypt` | Password hashing |
| 8 | `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` | Login tokens |
| 9 | `ioredis` | Redis client |
| 10 | `@nestjs/throttler` | Rate limiting |
| 11 | `socket.io` + `@nestjs/websockets` | Real-time chat |
| 12 | `multer` + `@nestjs/platform-express` | File uploads |
| 13 | `sharp` | Image processing |
| 14 | `@aws-sdk/client-s3` + `minio` | Cloud file storage |
| 15 | `@mapbox/mapbox-sdk` | Address to coordinates |
| 16 | `firebase-admin` | Push notifications |
| 17 | `bullmq` + `@nestjs/bullmq` | Background jobs |
| 18 | `jest` + `supertest` + `@faker-js/faker` | Testing |

---

*30 packages. 18 libraries. Simple and clean. Updated: September 2026.*
