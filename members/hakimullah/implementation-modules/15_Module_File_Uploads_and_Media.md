# Module 15 — File Uploads and Media

## 1. What this module is

This module handles all **files** that users upload:

- job photos and voice notes (Module 04),
- profile photos (Module 02),
- worker verification documents (Module 02),
- chat attachments (Module 12),
- inspection photos and estimate attachments (Module 08).

The module's job: upload safely, store the file in dedicated storage, keep only a
reference in the database, and serve the file back to the right people.

## 2. Why we build it

- Photos and voice make a job description clear ("this is exactly how the pipe looks").
- Documents are needed to verify workers.
- Files are large; storing them inside the main database would slow everything down.
- Uploads are a classic attack surface — we control them strictly (see Module 19).

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Uploads job photos/voice; profile photo |
| Worker | Uploads profile photo, verification documents, inspection photos, chat attachments |
| Admin | Views uploaded documents for verification; moderate flagged media |
| System | Saves metadata, serves files with permission checks |

## 4. Main screens / features

- **Upload widget** — pick/drag photos, record voice; shows progress and previews.
- **Image previews** — thumbnail / medium / large variants produced automatically.
- **Document viewer** — admin-only safe viewing of verification documents.
- **Safe download/URL rules** — files are served only to authorized users.

## 5. File types and limits (starting values — fine-tune with team)

| Type | Formats | Max size | Purpose |
|---|---|---|---|
| Photos | JPEG, PNG, WebP | ~5 MB | job images, profile, inspection |
| Voice | common audio formats (e.g. OGG/M4A/WAV) | ~10 MB | voice note describing the job |
| Documents | PDF, JPG, PNG | ~5 MB | verification documents |

The system generates small/medium/large variants for photos so lists stay fast.

## 6. Main workflows

### Workflow A — Upload a photo/voice (customer)

1. User selects a file in an upload widget.
2. The system checks: logged-in user, file type is allowed, size within limit.
3. The file is uploaded to dedicated file storage; the database stores a reference + metadata.
4. Previews are generated.
5. The reference is linked to the record (e.g. the job).

### Workflow B — Verification document upload (worker)

1. Worker uploads an identity/trade document in the verification flow (Module 02).
2. Same validation happens (type + size).
3. The document is stored with **restricted access**: only the worker and admins can view it.
4. It attaches to the verification case for admin review.

### Workflow C — Serving a file back

1. A user views a photo.
2. The system checks the user is allowed to see it (job participant, profile is public, etc.).
3. The file is served (from storage) with a time-limited link.
4. Unauthorized users get an error, not the file.

## 7. Business rules (the system MUST)

1. Every upload requires a logged-in user and a valid reason (linked to a record).
2. File type is verified by content, not just by the filename.
3. File size limits are enforced.
4. Generated filenames are safe (never the user's raw filename, no special characters that could harm storage).
5. Files live in dedicated storage; the database holds only references/metadata.
6. Access control is enforced per file (public profile photos vs. private documents).
7. Private documents (ID cards) are never served to the public and never appear in chat.
8. Uploaded content that breaks platform rules can be flagged and removed (Module 17/19).
9. Cleanup: orphans (uploads never linked to a record) can be removed periodically.

## 9. Edge cases the system must handle safely

- Uploading a file named "photo.jpg.exe" → content check rejects it.
- File larger than limit → clear rejection message.
- User signed out mid-upload → upload fails safely, no orphan confusion.
- Double upload of the same file → treated as two files unless the client deduplicates; metadata stays consistent.
- A chat attachment is sent → served only to conversation participants.
- A verification document is accessed by a customer → denied (not their data).
- Storage becomes temporarily unavailable → a clear "try again" error; no data corruption.
- A job is deleted while it has photos → media references are cleaned up by the secure file rules.

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 02 Profiles & Verification | Profile photos + verification documents |
| 04 Job Posting | Job photos + voice notes |
| 08 Visits & Estimates | Inspection photos and estimate attachments |
| 12 Chat & Messaging | Chat image/voice attachments |
| 17 Admin Operations | Viewing verification documents and flagged media |
| 19 Security & Audit | Upload logging, malware scanning (optional), access checks |

## 11. Definition of done

- [ ] Users can upload photos and voice notes with previews and size/type validation.
- [ ] Photos get resized variants; lists use the small variant.
- [ ] Verification documents are stored privately and viewable only by owner + admin.
- [ ] Access control: unauthorized requests for private files are rejected.
- [ ] Files are served from dedicated storage; the database holds references.
- [ ] Filenames are generated safely; no raw user filenames in storage.
- [ ] Orphan cleanup can run safely.
- [ ] Module 21 tests cover type/size validation, private-file access, and authorization.