# Technical Design Document (TDD)

## Construction Platform MVP
**Architecture, Modules, APIs, Data Model, Security, Testing, and Deployment**

---

# 1. Technical Design Objective

This Technical Design Document (TDD) translates the Software Requirements Specification (SRS) into a practical technical structure for the Construction Platform MVP.

The technical design intentionally favors a **simple modular web application** instead of a complex distributed or enterprise architecture.

The MVP architecture should be easy to:

- Build
- Understand
- Test
- Deploy
- Maintain
- Scale gradually

## Recommended MVP Architecture

**React Web Frontend → REST API Backend → MongoDB Database**

The backend also communicates with:

- Payment Provider
- Notification Provider
- Object Storage Provider

The backend should remain modular. Separate microservices should only be introduced when actual scale or operational requirements justify them.

---

# 2. Technology Foundation

| Layer | Recommended Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | Customer, worker, and admin interfaces |
| UI | Tailwind CSS or reusable component system | Consistent responsive UI |
| State | React State + lightweight query/cache layer | UI state and server data |
| Backend | Node.js + Express | REST APIs and business logic |
| Database | MongoDB + Mongoose | Persistent application data |
| Authentication | JWT or secure session strategy | Identity and role-based access |
| Validation | Zod, Joi, or express-validator | Request and data validation |
| File Storage | Object storage provider | Worker verification documents |
| Payments | Supported payment gateway/provider | Payment processing and status |
| Notifications | Email, SMS, or Push provider | Workflow notifications |
| Testing | Jest/Vitest + Supertest + frontend tests | Unit, API, and integration testing |
| Deployment | Managed frontend + Node API + managed MongoDB | Simple MVP deployment |

---

# 3. High-Level Architecture

## 3.1 Main Components

### React Web Application

Responsibilities:

- Pages and screens
- Forms
- Client-side validation
- Dashboards
- API calls
- UI state
- Protected routes

Communicates with:

- REST API

---

### API Server

Responsibilities:

- Authentication
- Authorization
- Business rules
- Workflow validation
- State transitions
- Database operations
- Payment integration
- Notification integration

Communicates with:

- React Web Application
- MongoDB
- Payment Provider
- Notification Provider
- Object Storage

---

### MongoDB

Responsibilities:

- Persistent application data
- User records
- Worker profiles
- Jobs
- Quotes
- Bookings
- Payments
- Reviews
- Notifications
- Audit logs

Communicates with:

- API Server

---

### Payment Provider

Responsibilities:

- Payment execution
- Payment authorization
- Provider-side transaction status
- Payment callbacks or webhooks

Communicates with:

- API Server through secure APIs and webhooks

---

### Notification Provider

Responsibilities:

- Email delivery
- SMS delivery
- Push notifications where required

Communicates with:

- API Server

---

### Object Storage

Responsibilities:

- Worker verification documents
- Optional uploaded files

Communicates with:

- API Server

---

## 3.2 Data Flow

The general request flow is:

**Browser → API → Authentication/Validation → Business Logic → Database/External Provider → API Response → Browser**

The browser must never be the source of truth for:

- Payment status
- Authorization
- Booking state
- Critical workflow transitions

---

# 4. Frontend Module Structure

## 4.1 Auth Module

Responsibilities:

- Login
- Registration
- Token/session handling
- Logout
- Protected routes
- Role-based route access

---

## 4.2 Customer Module

Responsibilities:

- Customer dashboard
- Profile management
- Job creation
- Job management
- Quote review
- Worker selection
- Booking management
- Payment UI
- Review submission

---

## 4.3 Worker Module

Responsibilities:

- Worker profile
- Skills and services
- Service area
- Availability
- Verification submission
- Job feed
- Quote management
- Active jobs
- Work status updates

---

## 4.4 Admin Module

Responsibilities:

- Admin dashboard
- User management
- Worker management
- Verification management
- Job monitoring
- Booking monitoring
- Payment monitoring
- Flags and disputes
- Account suspension
- Audit activity

---

## 4.5 Jobs Module

Reusable functionality:

- Job list
- Job detail
- Job form
- Job status
- Job filters
- Job search

---

## 4.6 Quotes Module

Responsibilities:

- Quote list
- Quote form
- Quote details
- Quote selection flow
- Quote status

---

## 4.7 Bookings Module

Responsibilities:

- Booking details
- Booking status timeline
- Booking confirmation
- Cancellation
- Completion actions
- Dispute status

---

## 4.8 Payments Module

Responsibilities:

- Checkout UI
- Payment initiation
- Payment pending state
- Payment success state
- Payment failure state
- Transaction status display

---

## 4.9 Reviews Module

Responsibilities:

- Review form
- Rating display
- Review history
- Review eligibility

---

## 4.10 Notifications Module

Responsibilities:

- Notification list
- Unread state
- Read state
- Event messages
- Related record navigation

---

## 4.11 Common Module

Reusable UI components:

- Buttons
- Inputs
- Selects
- Modals
- Tables
- Cards
- Loaders
- Error states
- Empty states
- Status badges

---

## 4.12 Services Module

Responsibilities:

- API client
- Authentication API functions
- Job API functions
- Quote API functions
- Booking API functions
- Payment API functions
- Review API functions

---

# 5. Backend Module Structure

## auth

Responsibilities:

- Registration
- Login
- Password handling
- Token/session creation
- Authentication validation
- Logout support where required

---

## users

Responsibilities:

- User profiles
- Role information
- Account status
- Profile updates

---

## workers

Responsibilities:

- Worker profile
- Skills
- Services
- Service area
- Experience
- Availability
- Verification status

---

## jobs

Responsibilities:

- Job creation
- Job updates
- Job cancellation
- Job search
- Worker matching
- Job lifecycle rules

---

## quotes

Responsibilities:

- Quote creation
- Quote retrieval
- Quote validation
- Quote selection rules
- Quote status changes

---

## bookings

Responsibilities:

- Booking creation
- Booking retrieval
- Booking lifecycle
- Status transitions
- Participant authorization

---

## payments

Responsibilities:

- Payment request creation
- Payment provider integration
- Webhook handling
- Payment status reconciliation
- Transaction references
- Idempotency handling

---

## reviews

Responsibilities:

- Review creation
- Review validation
- Review retrieval
- Duplicate prevention

---

## notifications

Responsibilities:

- Notification event creation
- Notification persistence
- Provider delivery
- Duplicate prevention

---

## admin

Responsibilities:

- Administrative queries
- Worker verification
- User suspension
- Flags
- Disputes
- Audit actions

---

## common

Responsibilities:

- Validation
- Error handling
- Authentication middleware
- Role middleware
- Logging
- Shared utilities

---

# 6. Data Model — Initial Collections

## 6.1 Users

Key fields:

- `_id`
- `role`
- `name`
- `email`
- `phone`
- `passwordHash`
- `status`
- `createdAt`
- `updatedAt`

Possible roles:

- customer
- worker
- admin

---

## 6.2 Worker Profiles

Key fields:

- `_id`
- `userId`
- `skills`
- `serviceArea`
- `experience`
- `availability`
- `verificationStatus`
- `createdAt`
- `updatedAt`

---

## 6.3 Verification Cases

Key fields:

- `_id`
- `workerId`
- `documents`
- `status`
- `reviewedBy`
- `reviewedAt`
- `notes`
- `createdAt`

---

## 6.4 Jobs

Key fields:

- `_id`
- `customerId`
- `category`
- `description`
- `location`
- `serviceArea`
- `preferredTime`
- `budget`
- `status`
- `createdAt`
- `updatedAt`

---

## 6.5 Quotes

Key fields:

- `_id`
- `jobId`
- `workerId`
- `amount`
- `message`
- `estimatedDuration`
- `status`
- `createdAt`

---

## 6.6 Bookings

Key fields:

- `_id`
- `jobId`
- `quoteId`
- `customerId`
- `workerId`
- `amount`
- `status`
- `scheduledAt`
- `createdAt`
- `updatedAt`

---

## 6.7 Payments

Key fields:

- `_id`
- `bookingId`
- `provider`
- `providerReference`
- `amount`
- `currency`
- `status`
- `paidAt`
- `createdAt`
- `updatedAt`

---

## 6.8 Reviews

Key fields:

- `_id`
- `bookingId`
- `reviewerId`
- `revieweeId`
- `rating`
- `comment`
- `createdAt`

---

## 6.9 Notifications

Key fields:

- `_id`
- `userId`
- `type`
- `title`
- `message`
- `readAt`
- `referenceId`
- `createdAt`

---

## 6.10 Audit Logs

Key fields:

- `_id`
- `actorId`
- `action`
- `entityType`
- `entityId`
- `metadata`
- `createdAt`

Audit logs should record important administrative and system actions without storing unnecessary sensitive information.

---

# 7. Initial REST API Structure

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register user | Public |
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/me` | Get current user/profile | User |
| PATCH | `/api/me` | Update current profile | User |
| POST | `/api/jobs` | Create job | Customer |
| GET | `/api/jobs` | List/search jobs | Role-based |
| GET | `/api/jobs/:id` | Get job detail | Authorized |
| PATCH | `/api/jobs/:id` | Update/cancel job | Customer/Admin |
| POST | `/api/jobs/:id/quotes` | Submit quote | Worker |
| GET | `/api/jobs/:id/quotes` | List job quotes | Job Owner/Admin |
| POST | `/api/quotes/:id/select` | Select quote | Customer |
| POST | `/api/bookings` | Create booking | Customer/System |
| GET | `/api/bookings/:id` | Booking detail | Participants/Admin |
| PATCH | `/api/bookings/:id/status` | Change booking status | Authorized |
| POST | `/api/payments/create` | Create payment request | Customer |
| POST | `/api/payments/webhook` | Receive payment provider event | Provider |
| GET | `/api/payments/:bookingId` | Get payment status | Participant/Admin |
| POST | `/api/reviews` | Create review | Participant |
| GET | `/api/workers/:id` | Get worker profile | Authorized/Public fields |
| POST | `/api/workers/verification` | Submit verification | Worker |
| GET | `/api/admin/verification` | Verification queue | Admin |
| PATCH | `/api/admin/verification/:id` | Approve/reject verification | Admin |

---

# 8. Core System Interactions

## 8.1 Authentication Flow

**User registers/logs in → Backend validates credentials → Backend issues authenticated token/session → Frontend stores/uses it according to security strategy → Protected requests include authentication → Backend validates identity and role**

The backend is responsible for final authorization decisions.

---

## 8.2 Job → Quote → Booking Flow

**Customer creates job → Backend validates and stores job → Eligible workers can see job → Worker submits quote → Backend validates worker and job state → Customer views quotes → Customer selects one quote → Backend performs transaction-safe availability check → Booking is created → Other quotes become inactive or rejected**

The system must ensure that only one active confirmed booking exists for a job.

---

## 8.3 Payment Flow

**Customer starts payment → Backend creates payment request → Provider processes payment → Provider sends webhook/callback → Backend validates provider event → Payment record updates idempotently → Booking/payment UI reads server status**

The final payment state must come from the backend/provider record, not frontend state.

---

## 8.4 Completion and Review Flow

**Worker marks work completed → Backend validates worker ownership and booking state → Booking becomes completed → Eligible reviewer submits review → Review is linked to booking → Duplicate reviews are prevented**

---

# 9. API and Security Design

The production system should follow these rules:

- All production API traffic must use HTTPS.
- Authentication must be enforced server-side.
- Authorization must be enforced server-side.
- Request body validation must happen before business logic.
- Query parameters must be validated.
- Route parameters must be validated.
- Centralized error responses should be used.
- Stack traces must not be exposed in production.
- Sensitive endpoints should be rate-limited.

Sensitive endpoints include:

- Login
- Registration
- Verification submission
- Payment initiation

Passwords should use secure hashing such as:

- Argon2
- bcrypt

The platform must:

- Never store raw card credentials.
- Verify payment webhooks using provider signature/security mechanisms.
- Use idempotency keys or equivalent protection for retry-sensitive operations.
- Avoid logging passwords.
- Avoid logging authentication tokens.
- Avoid logging unnecessary payment secrets.

---

# 10. State Machines and Data Integrity

## 10.1 Job State

Example states:

**draft → open → booked → in_progress → completed**

Alternative terminal states:

- cancelled
- disputed

Important rule:

**Invalid state transitions must be rejected by the backend.**

---

## 10.2 Quote State

Example states:

**submitted → selected**

Alternative states:

- rejected
- withdrawn

Important rule:

**Only one quote may become selected for a job.**

---

## 10.3 Booking State

Example states:

**pending → confirmed → in_progress → completed**

Alternative states:

- cancelled
- disputed

Important rule:

**Only authorized participants or admins may perform allowed transitions.**

---

## 10.4 Payment State

Example states:

**created → pending → paid**

Alternative states:

- failed
- cancelled
- refunded

Important rule:

**The payment provider event and backend validation are the source for the final payment state.**

---

# 11. Project Folder Structure

A practical monorepo-style structure:

```text
construction-platform/
│
├── client/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── features/          # Customer, worker, and admin modules
│   │   ├── pages/             # Route-level screens
│   │   ├── services/          # API client and API functions
│   │   ├── hooks/             # Reusable React hooks
│   │   ├── store/             # Global state if required
│   │   ├── routes/            # Route configuration
│   │   ├── utils/             # Frontend utilities
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── workers/
│   │   │   ├── jobs/
│   │   │   ├── quotes/
│   │   │   ├── bookings/
│   │   │   ├── payments/
│   │   │   ├── reviews/
│   │   │   ├── notifications/
│   │   │   └── admin/
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── role.js
│   │   │   ├── validation.js
│   │   │   └── errorHandler.js
│   │   │
│   │   ├── models/            # MongoDB/Mongoose models
│   │   ├── routes/            # REST route definitions
│   │   ├── services/          # Payment, notification, storage integrations
│   │   ├── utils/             # Logging, helpers, configuration
│   │   ├── app.js             # Express app configuration
│   │   └── server.js          # Server startup
│   │
│   └── package.json
│
├── README.md
└── .env.example
```

---

# 12. Testing Strategy

## 12.1 Unit Tests

Test:

- Validation rules
- Permission rules
- State transition functions
- Pricing calculations
- Fee calculations
- Utility functions

---

## 12.2 API Tests

Test:

- Registration
- Login
- Authentication
- Job creation
- Job updates
- Quote submission
- Quote selection
- Booking creation
- Booking state updates
- Payment state updates
- Review creation

---

## 12.3 Integration Tests

Test the complete customer-to-worker workflow:

1. Customer registers.
2. Worker registers.
3. Worker becomes verified.
4. Customer creates job.
5. Worker submits quote.
6. Customer selects quote.
7. Booking is created.
8. Payment state is updated.
9. Worker completes work.
10. Customer submits review.

---

## 12.4 Frontend Tests

Test critical features:

- Forms
- Protected routes
- Role-based UI
- Quote selection
- Booking status display
- Payment states
- Error handling

---

## 12.5 Negative Tests

Test failure scenarios:

- Unauthorized access
- Invalid state transitions
- Duplicate requests
- Duplicate reviews
- Expired tokens
- Payment callback replay
- Invalid webhook signatures

---

## 12.6 Pilot Acceptance Test

Use test accounts for:

- Customer
- Worker
- Admin

Complete the full workflow from registration through review.

---

# 13. Deployment and Environment Requirements

The platform should maintain separate environments for:

- Development
- Staging/Test
- Production

Sensitive configuration must remain outside source control.

Examples include:

- Database credentials
- JWT secrets
- Payment provider secrets
- Storage credentials
- Notification provider credentials

Deployment should include:

- Database index setup where required.
- Controlled migration processes where applicable.
- HTTPS.
- API health endpoint.
- Error logging.
- Basic uptime monitoring.
- Production database backups according to the selected managed database plan.

Continuous Integration (CI) should run:

- Linting
- Tests
- Build validation

before deployment.

---

# 14. Technical MVP Definition

The MVP technical foundation is complete when all major components work together as one reliable system:

- Frontend application
- REST API
- MongoDB database
- Authentication
- Authorization
- Role-based access
- Job workflow
- Quote workflow
- Booking workflow
- Payment state handling
- Reviews
- Worker verification
- Admin controls
- Validation
- Logging
- Testing
- Deployment configuration

The core technical workflow is:

**Customer → Job → Worker → Quote → Quote Selection → Booking → Payment → Work Completion → Review**

The system is considered technically ready when this workflow operates reliably, securely, and without depending on frontend state for critical authorization, payment, or workflow decisions.

---

# 15. Technical Design Summary

The Construction Platform MVP should begin with a simple modular architecture:

**React + Vite Frontend + Node.js/Express REST API + MongoDB**

External services should handle specialized functionality such as:

- Payment processing
- Notifications
- File storage

The backend remains the central authority for:

- Authentication
- Authorization
- Business rules
- Workflow state
- Payment verification
- Data integrity

This TDD provides the technical foundation for:

- Database schema implementation
- Backend API development
- Frontend feature development
- Payment integration
- Testing
- Deployment
- Future scaling

The next implementation documents can be based on this TDD, including:

1. Detailed API documentation.
2. MongoDB schema design.
3. Frontend component/module specification.
4. Backend implementation plan.
5. Database relationship diagram.
6. QA test cases.
7. Deployment configuration.
