# API performance baseline — after-chunk5

- Date: 2026-10-07T08:39:21.945Z
- Commit: `9e9c422`
- Backend: `http://localhost:4000/api/v1` (production build)
- Runs: 15 measured after 3 warmup (sequential, HTTP keep-alive)
- DB: Neon Postgres (us-east-2), measured RTT ~281ms from this machine
- client = end-to-end wall time; server = x-response-time; db = Prisma $use middleware
- Login: 4 runs, no warmup (backend rate-limits logins to 5/5min in-process; startup auth consumes 1)

| Endpoint | Role | client p50 | client p95 | client p99 | server p50 | db queries (mean) | db ms (mean) | ok |
|---|---|---|---|---|---|---|---|---|
| `GET /health` | - | 307.1 | 316.6 | 316.6 | 304.4 | 1 | 285.7 | 15/15 |
| `POST /auth/login (worker)` | - | 408.5 | 679.3 | 679.3 | 405.7 | 1 | 409.1 | 4/4 |
| `POST /auth/customer/login` | - | 318.3 | 410.9 | 410.9 | 315.7 | 1 | 292.5 | 4/4 |
| `POST /auth/admin/login` | - | 360.3 | 707.5 | 707.5 | 357.6 | 1 | 380.5 | 4/4 |
| `GET /jobs/customer?limit=50` | customer | 991.8 | 1536.5 | 1536.5 | 989 | 8 | 2494.6 | 15/15 |
| `GET /jobs/available` | worker | 743 | 1455.1 | 1455.1 | 740.3 | 6 | 1710.1 | 15/15 |
| `GET /jobs/:id` | customer | 505.6 | 511.4 | 511.4 | 502.9 | 4 | 992.4 | 15/15 |
| `GET /offers/my` | worker | 921.4 | 1113.5 | 1113.5 | 918.7 | 2 | 1171.9 | 15/15 |
| `GET /wallet/balance` | worker | 307.3 | 614.1 | 614.1 | 304.6 | 1 | 324.8 | 15/15 |
| `GET /earnings/summary` | worker | 307.1 | 308.6 | 308.6 | 304.5 | 1 | 304.2 | 15/15 |
| `GET /admin/kpis` | admin | 495.9 | 694.7 | 694.7 | 493.5 | 14 | 4503.2 | 15/15 |
| `GET /notifications/unread-count` | customer | 244.8 | 309.1 | 309.1 | 241.8 | 1 | 266.1 | 15/15 |
| `GET /chat/conversations` | customer | 1228.6 | 1536.2 | 1536.2 | 1226.1 | 1 | 1232.5 | 15/15 |
| `GET /visits/my` | customer | 1009.7 | 1433.9 | 1433.9 | 1007.1 | 3 | 1328 | 15/15 |
