# Frontend page-load baseline — final

- Date: 2026-10-07T09:42:22.420Z
- Commit: `9e9c422`
- Frontend: `http://localhost:3001` (next start, production build)
- Runs: 10 after 2 warmup (sequential, gzip)
- p50/p95 are full-response wall time (SSR pages are static shells unless noted; client data fetch happens after hydration)

| Route | Auth model | status | p50 | p95 | p99 | HTML bytes (p50) | ok |
|---|---|---|---|---|---|---|---|
| `/en` | public | 200 | 18.2 | 26.7 | 26.7 | 257716 | 10/10 |
| `/en/customer/login` | public | 200 | 5.1 | 6.2 | 6.2 | 77150 | 10/10 |
| `/en/customer/dashboard` | customer (client-auth) | 200 | 5.8 | 6.9 | 6.9 | 112552 | 10/10 |
| `/en/customer/jobs` | customer (client-auth) | 200 | 5.2 | 5.7 | 5.7 | 79747 | 10/10 |
| `/en/worker/dashboard` | worker (client-auth) | 200 | 5.1 | 5.6 | 5.6 | 81615 | 10/10 |
| `/en/worker/jobs` | worker (client-auth) | 200 | 5 | 5.6 | 5.6 | 80341 | 10/10 |
| `/en/admin/dashboard` | admin (client-auth since perf-sprint chunk 7) | 200 | 5 | 5.8 | 5.8 | 83273 | 10/10 |
