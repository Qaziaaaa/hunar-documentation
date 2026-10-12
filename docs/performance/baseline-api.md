# API performance baseline

- Date: 2026-10-12T11:46:49.395Z
- Commit: `2bc4b44`
- Backend: `http://localhost:4000/api/v1` (production build)
- Runs: 3 measured after 1 warmup (sequential, HTTP keep-alive)
- DB: Neon Postgres (us-east-2), measured RTT ~281ms from this machine
- client = end-to-end wall time; server = x-response-time; db = Prisma $use middleware
- Login: 4 runs, no warmup (backend rate-limits logins to 5/5min in-process; startup auth consumes 1)

| Endpoint | Role | client p50 | client p95 | client p99 | server p50 | db queries (mean) | db ms (mean) | ok |
|---|---|---|---|---|---|---|---|---|
| `GET /health` | - | 265.3 | 307.6 | 307.6 | 261.7 | - | - | 3/3 |
| `POST /auth/login (worker)` | - | 351 | 430 | 430 | 346.6 | - | - | 4/4 |
| `POST /auth/customer/login` | - | 397.4 | 441.6 | 441.6 | 394.3 | - | - | 4/4 |
| `POST /auth/admin/login` | - | 354 | 359.1 | 359.1 | 350.7 | - | - | 4/4 |
| `GET /jobs/customer?limit=50` | customer | 2149.4 | 2457.2 | 2457.2 | 2143.1 | - | - | 3/3 |
| `GET /jobs/available` | worker | 1699.3 | 3071.4 | 3071.4 | 1695.8 | - | - | 3/3 |
| `GET /jobs/:id` | customer | 4530.8 | 4842.9 | 4842.9 | 4526.5 | - | - | 3/3 |
| `GET /offers/my` | worker | 925.6 | 1622.5 | 1622.5 | 920.4 | - | - | 3/3 |
| `GET /wallet/balance` | worker | 269.6 | 269.6 | 269.6 | 266.3 | - | - | 3/3 |
| `GET /earnings/summary` | worker | 374.2 | 615.1 | 615.1 | 371.2 | - | - | 3/3 |
| `GET /admin/kpis` | admin | 719.9 | 754.2 | 754.2 | 717.2 | - | - | 3/3 |
| `GET /notifications/unread-count` | customer | 238.1 | 238.5 | 238.5 | 234.6 | - | - | 3/3 |
| `GET /chat/conversations` | customer | 1153.1 | 1220.7 | 1220.7 | 1148.1 | - | - | 3/3 |
| `GET /visits/my` | customer | 2666.4 | 3905.6 | 3905.6 | 2658.6 | - | - | 3/3 |
