# Construction Platform MVP: Technical Requirements
> **Initial engineering baseline and module/API map**

## 1. Technical Requirements — Initial Baseline

| Area | Requirement |
| :--- | :--- |
| **Client** | Responsive React web application for customer, worker, and admin roles. |
| **API** | REST API with versionable route structure and centralized validation/error handling. |
| **Database** | MongoDB with indexes for user identity, job discovery, quotes, bookings, and payment references. |
| **Auth** | Secure authentication plus server-side Role-Based Access Control (RBAC). |
| **Workflow** | Backend-owned state transitions for job, quote, booking, and payment entities. |
| **Payments** | External provider integration; provider webhooks; idempotent payment updates. |
| **Files** | Secure object storage for verification documents; never expose private files directly. |
| **Notifications**| Event-driven notification hooks for major workflow events. |
| **Security** | HTTPS, password hashing, validation, rate limiting, secure secrets, audit logging. |
| **Testing** | Unit tests + API/integration tests + critical frontend workflow tests. |
| **Deployment** | Managed frontend (e.g., Vercel), Node API (e.g., Render), managed MongoDB (e.g., Atlas), environment-based secrets, monitoring. |
| **Scalability** | Modular monolith first; background jobs/cache/queue can be introduced later if required. |

---

## 2. Initial Module Map

### Frontend Modules
* `auth`, `customer`, `worker`, `admin`
* `jobs`, `quotes`, `bookings`, `payments`, `reviews`
* `notifications`, `common`, `services`

### Backend Modules
* `auth`, `users`, `workers`, `verification`
* `jobs`, `quotes`, `bookings`, `payments`, `reviews`
* `notifications`, `admin`, `audit`
* `common middleware/services`

---

## 3. API Interaction Pattern

**Standard Execution Flow:**
1. **UI Action** 
2. **API Request**
3. **Authentication** (Verify identity)
4. **Validation** (Check request body/params)
5. **Authorization** (Check RBAC/permissions)
6. **Business Rule** (Execute core logic)
7. **Database / External Service** (Read/Write data)
8. **Persisted Result** (Confirm state change)
9. **API Response** (Send JSON to client)
10. **UI State Update** (Reflect changes in React)

*(Inline flow: `UI Action ➔ API Request ➔ Auth ➔ Validation ➔ Authorization ➔ Business Rule ➔ Database/External ➔ Persisted Result ➔ API Response ➔ UI State Update`)*

---

## 4. Implementation Priorities

* **P0 (Critical MVP):** 
  Authentication, roles, jobs, worker verification, quotes, booking, payment status, completion, reviews, admin controls.
* **P1 (Enhancements):** 
  Notifications, search/filtering improvements, audit dashboard, better matching.
* **P2 (Future/Scale):** 
  Advanced recommendations, subscriptions/loyalty, analytics, automation, scale optimizations.