# Pending — Solve Later

Items noticed during backend implementation (Tasks 2–4) that we deferred. Resolve before/at the final setup pass.

## 1. PostgreSQL + MinIO setup (blocking end-to-end smoke tests)
- Postgres is **not running** locally. Migrations for the worker profile (Task 2) and any later changes are hand-written and only validated via `prisma validate` / `prisma generate`.
- Must run `prisma migrate deploy` on a live DB.
- MinIO is not running either, so uploads are only unit-tested against a fake storage client.

## 2. Live smoke-test of Task 4 uploads
- Verify real uploads against MinIO (dev) and S3 (prod) once storage infra exists:
  - Profile / job / inspection / chat photos compress correctly before storage.
  - Worker + CNIC documents keep original **and** compressed versions.
  - Get-URL and delete-own-file endpoints work with real objects.

## 3. PDF support for documents (open decision)
- Task 4 requires documents to keep original + compressed versions; Sharp only compresses images, so documents are currently image-only (JPG/PNG/WebP) and PDFs are rejected with `UNSUPPORTED_FILE_TYPE`.
- If PDFs must be accepted for worker documents, we need a PDF compression approach or to skip the compressed variant for PDFs.

## 4. Oversize upload → should be 413, currently 400
- Nest maps Multer `LIMIT_FILE_SIZE` to a default `BadRequestException` (400). Map it to 413 so clients can distinguish.
- Similarly make sure the file-type rejection stays a clean 415.

## 5. Intermittent jest / eslint / tsc hangs
- Jest (parallel mode), eslint, and tsc occasionally exceed timeouts with no output after adding heavy deps (AWS SDK). `--runInBand` for jest works around the jest hang. Investigate (machine-resource / antivirus / worker count) if it recurs.
- jest + tsc runs got noticeably slower after installing `sharp` / `@aws-sdk/client-s3` / `minio`.

## 5b. Chat (Task 5) — deferred by strict scope + not smoke-tested
- Read receipts (`markRead` / `chat:read`) and typing indicators (`chat:typing`) are in the Module 9 spec but NOT in Task 5's acceptance criteria → intentionally not built. Add when Chat 2.0 is scoped.
- Message `voiceUrl` per Module 9 DB design — Task 5 is text + image only → no voice message column/feature.
- Socket real-time and offer.accepted → conversation creation are only unit-tested (in-memory fakes); needs a live Socket.IO + Postgres smoke test in the final setup pass.
- Migration `20260918_task5_chat` is hand-written (schema validated, not applied).

## 6. Uncommitted work
- Nothing from Tasks 2–4 is committed yet (auth/redis Task-1 files were already uncommitted by the user). Decide when to commit as separate Task commits.