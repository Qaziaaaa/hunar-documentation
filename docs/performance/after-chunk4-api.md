# API performance baseline — after-chunk4

- Date: 2026-10-07T08:26:59.151Z
- Commit: `9e9c422`
- Backend: `http://localhost:4000/api/v1` (production build)
- Runs: 15 measured after 3 warmup (sequential, HTTP keep-alive)
- DB: Neon Postgres (us-east-2), measured RTT ~281ms from this machine
- client = end-to-end wall time; server = x-response-time; db = Prisma $use middleware
- Login: 4 runs, no warmup (backend rate-limits logins to 5/5min in-process; startup auth consumes 1)

| Endpoint | Role | client p50 | client p95 | client p99 | server p50 | db queries (mean) | db ms (mean) | ok |
|---|---|---|---|---|---|---|---|---|
| `GET /health` | - | 307.2 | 509.6 | 509.6 | 304.5 | 1 | 310.7 | 15/15 |
| `POST /auth/login (worker)` | - | 408.4 | 617.4 | 617.4 | 406.9 | 1 | 384.9 | 4/4 |
| `POST /auth/customer/login` | - | 386.6 | 409.9 | 409.9 | 383.4 | 1 | 317.1 | 4/4 |
| `POST /auth/admin/login` | - | 409.3 | 614.5 | 614.5 | 406.9 | 1 | 394.3 | 4/4 |
| `GET /jobs/customer?limit=50` | customer | 1228.6 | 1760.9 | 1760.9 | 1225.5 | 8 | 2750 | 15/15 |
| `GET /jobs/available` | worker | 629.9 | 1843.7 | 1843.7 | 627 | 6 | 2121.1 | 15/15 |
| `GET /jobs/:id` | customer | 614.5 | 1228.6 | 1228.6 | 612 | 4 | 1298.2 | 15/15 |
| `GET /offers/my` | worker | 921.8 | 1228.4 | 1228.4 | 918.9 | 2 | 1272.4 | 15/15 |
| `GET /wallet/balance` | worker | 1536.8 | 1843.1 | 1843.1 | 1533.8 | 1 | 1580.5 | 15/15 |
| `GET /earnings/summary` | worker | 307.1 | 614.3 | 614.3 | 304.5 | 1 | 338.1 | 15/15 |
| `GET /admin/kpis` | admin | 1843.2 | 3072.3 | 3072.3 | 1840.5 | 14 | 4876.6 | 15/15 |
| `GET /notifications/unread-count` | customer | 307.4 | 514.7 | 514.7 | 304.4 | 1 | 317 | 15/15 |
| `GET /chat/conversations` | customer | 1203.9 | 1253.8 | 1253.8 | 1200.8 | 1 | 1175.1 | 15/15 |
| `GET /visits/my` | customer | 2358.9 | 3891.7 | 3891.7 | 2356.9 | 22 | 12156.2 | 15/15 |
