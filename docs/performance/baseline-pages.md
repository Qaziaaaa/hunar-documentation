# Frontend page-load baseline

- Date: 2026-10-07T07:35:51.665Z
- Commit: `9e9c422`
- Frontend: `http://localhost:3001` (next start, production build)
- Runs: 10 after 2 warmup (sequential, gzip)
- p50/p95 are full-response wall time (SSR pages are static shells unless noted; client data fetch happens after hydration)

| Route | Auth model | status | p50 | p95 | p99 | HTML bytes (p50) | ok |
|---|---|---|---|---|---|---|---|
| `/en` | public | 200 | 27.7 | 38.1 | 38.1 | 257716 | 10/10 |
| `/en/customer/login` | public | 200 | 6.9 | 8.3 | 8.3 | 77150 | 10/10 |
| `/en/customer/dashboard` | customer (client-auth) | 200 | 7.3 | 12.6 | 12.6 | 109574 | 10/10 |
| `/en/customer/jobs` | customer (client-auth) | 200 | 6.6 | 8.2 | 8.2 | 77275 | 10/10 |
| `/en/worker/dashboard` | worker (client-auth) | 200 | 6.5 | 7.9 | 7.9 | 78650 | 10/10 |
| `/en/worker/jobs` | worker (client-auth) | 200 | 8.7 | 13.9 | 13.9 | 77846 | 10/10 |
| `/en/admin/dashboard` | admin (server-fetch) | 200 | 7.5 | 9 | 9 | 159545 | 10/10 |
