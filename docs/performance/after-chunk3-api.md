# API performance baseline — after-chunk3

- Date: 2026-10-07T08:09:58.766Z
- Commit: `9e9c422`
- Backend: `http://localhost:4000/api/v1` (production build)
- Runs: 15 measured after 3 warmup (sequential, HTTP keep-alive)
- DB: Neon Postgres (us-east-2), measured RTT ~281ms from this machine
- client = end-to-end wall time; server = x-response-time; db = Prisma $use middleware
- Login: 4 runs, no warmup (backend rate-limits logins to 5/5min in-process; startup auth consumes 1)

| Endpoint | Role | client p50 | client p95 | client p99 | server p50 | db queries (mean) | db ms (mean) | ok |
|---|---|---|---|---|---|---|---|---|
| `GET /health` | - | 307.2 | 410.4 | 410.4 | 304.4 | 1 | 310.9 | 15/15 |
| `POST /auth/login (worker)` | - | 409.8 | 472.3 | 472.3 | 407 | 1 | 358.3 | 4/4 |
| `POST /auth/customer/login` | - | 409.5 | 409.6 | 409.6 | 406.8 | 1 | 342.5 | 4/4 |
| `POST /auth/admin/login` | - | 409.3 | 616.4 | 616.4 | 406.3 | 1 | 394.2 | 4/4 |
| `GET /jobs/customer?limit=50` | customer | 1233.6 | 3225.5 | 3225.5 | 1230.6 | 8 | 3062.9 | 15/15 |
| `GET /jobs/available` | worker | 1433.5 | 3175.2 | 3175.2 | 1430.2 | 6 | 2295.8 | 15/15 |
| `GET /jobs/:id` | customer | 1536.1 | 1945.8 | 1945.8 | 1533 | 2 | 1560.1 | 15/15 |
| `GET /offers/my` | worker | 1843.2 | 2150.4 | 2150.4 | 1840.4 | 2 | 3734.1 | 15/15 |
| `GET /wallet/balance` | worker | 1536.3 | 1844 | 1844 | 1533.5 | 1 | 1567.2 | 15/15 |
| `GET /earnings/summary` | worker | 307.3 | 309.9 | 309.9 | 304.4 | 1 | 304 | 15/15 |
| `GET /admin/kpis` | admin | 1821.4 | 2636.7 | 2636.7 | 1818.8 | 14 | 4862.7 | 15/15 |
| `GET /notifications/unread-count` | customer | 307.1 | 609.2 | 609.2 | 304.1 | 1 | 324.2 | 15/15 |
| `GET /chat/conversations` | customer | 1237.3 | 1849.1 | 1849.1 | 1234.4 | 1 | 1368.8 | 15/15 |
| `GET /visits/my` | customer | 3482.1 | 4413.1 | 4413.1 | 3480.2 | 22 | 14687.1 | 15/15 |
