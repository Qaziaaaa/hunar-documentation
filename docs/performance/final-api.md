# API performance baseline — final

- Date: 2026-10-07T09:41:12.175Z
- Commit: `9e9c422`
- Backend: `http://localhost:4000/api/v1` (production build)
- Runs: 15 measured after 3 warmup (sequential, HTTP keep-alive)
- DB: Neon Postgres (us-east-2), measured RTT ~281ms from this machine
- client = end-to-end wall time; server = x-response-time; db = Prisma $use middleware
- Login: 4 runs, no warmup (backend rate-limits logins to 5/5min in-process; startup auth consumes 1)

| Endpoint | Role | client p50 | client p95 | client p99 | server p50 | db queries (mean) | db ms (mean) | ok |
|---|---|---|---|---|---|---|---|---|
| `GET /health` | - | 285.1 | 333.9 | 333.9 | 280.5 | 1 | 292.8 | 15/15 |
| `POST /auth/login (worker)` | - | 348.3 | 625.4 | 625.4 | 344.5 | 1 | 350.5 | 4/4 |
| `POST /auth/customer/login` | - | 394.4 | 451.9 | 451.9 | 391.3 | 1 | 334.8 | 4/4 |
| `POST /auth/admin/login` | - | 433.3 | 774.7 | 774.7 | 430.6 | 1 | 452.1 | 4/4 |
| `GET /jobs/customer?limit=50` | customer | 1228.5 | 1706.4 | 1706.4 | 1225.3 | 8 | 2757.6 | 15/15 |
| `GET /jobs/available` | worker | 615.9 | 2149.8 | 2149.8 | 612.9 | 6 | 2205.7 | 15/15 |
| `GET /jobs/:id` | customer | 615.5 | 1229.5 | 1229.5 | 612.7 | 4 | 1299.8 | 15/15 |
| `GET /offers/my` | worker | 922.2 | 1115.5 | 1115.5 | 919.2 | 2 | 1300.8 | 15/15 |
| `GET /wallet/balance` | worker | 307 | 320.7 | 320.7 | 304.4 | 1 | 304.1 | 15/15 |
| `GET /earnings/summary` | worker | 307.3 | 311 | 311 | 304 | 1 | 303.6 | 15/15 |
| `GET /admin/kpis` | admin | 641.5 | 1055.8 | 1055.8 | 638.7 | 14 | 5670.1 | 15/15 |
| `GET /notifications/unread-count` | customer | 307.1 | 569.3 | 569.3 | 304.5 | 1 | 319.5 | 15/15 |
| `GET /chat/conversations` | customer | 614.3 | 922.9 | 922.9 | 611.5 | 4 | 1259.8 | 15/15 |
| `GET /visits/my` | customer | 1229.3 | 2470.3 | 2470.3 | 1226.3 | 3 | 1664.2 | 15/15 |
