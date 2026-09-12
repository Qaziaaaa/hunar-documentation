# Technical Feasibility, Security & Risk Research Report

## Home Services Marketplace

**Prepared for:** Hashim Malik  
**Purpose:** Technical feasibility, security, and risk research for the proposed home-services marketplace.

---

## 1. Location / Geolocation

### Problem

The platform needs the customer's location and the worker's service area/location to find suitable nearby workers while protecting customer privacy.

### Possible Solutions

- Customer selects location manually on a map.
- Customer shares device location.
- Worker provides a service location/service radius.
- Use approximate location before booking and exact address after confirmation.

### Recommended Solution

Use customer-provided location plus device location as an optional convenience. Store coordinates with the service request and reveal the exact customer address only after the worker is selected/confirmed.

### Reason

This supports nearby-worker matching while reducing unnecessary exposure of a customer's exact address. Browser geolocation requires user permission and secure HTTPS contexts. [1]

### Risks

- GPS may be inaccurate.
- Customer may enter an incorrect location.
- User may deny location permission.
- Exact addresses can create privacy and safety risks.

### Complexity

**Medium**

---

## 2. Nearby Worker Matching

### Problem

A plumbing job should primarily reach suitable plumbers who are nearby and currently available.

### Possible Solutions

- Match by service category only.
- Match by category + distance.
- Match by category + distance + availability + verification.
- Rank workers by distance, rating, experience, and other business rules.

### Recommended Solution

Use a multi-stage matching process:

**Required Skill → Verified Worker → Available Worker → Service Area/Distance → Ranking**

Start with a configurable service radius. Expand the radius if too few suitable workers are found.

### Reason

This reduces irrelevant job notifications and improves the chance of getting a useful response quickly. A geospatial search can efficiently find records within a chosen radius. [2]

### Risks

- Too few workers in a location.
- Incorrect worker availability status.
- Poor GPS accuracy.
- Too many workers responding to the same job.

### Complexity

**Medium**

---

## 3. Real-Time Job Notifications

### Problem

Workers should know quickly when a relevant nearby job becomes available.

### Possible Solutions

- In-app notifications.
- Push notifications.
- Real-time events while the app is open.
- SMS fallback for critical cases.

### Recommended Solution

Use a combination:

1. Real-time in-app updates when the user is active.
2. Push notifications when the app is in the background.
3. Notification retry/fallback rules for important events.

### Reason

The worker should not need to repeatedly refresh the app. Push notifications can work for foreground and background web-app scenarios with appropriate browser support and HTTPS. [3]

### Risks

- User disables notifications.
- Device/browser restrictions.
- Duplicate notifications.
- Notification delays.

### Complexity

**Medium**

---

## 4. Real-Time Communication

### Problem

Job status, offers, acceptances, cancellations, and other important events may need to update immediately.

### Possible Solutions

- Polling.
- Long polling.
- WebSocket-based communication.
- Hybrid approach.

### Recommended Solution

Use real-time communication for active jobs and keep normal APIs for standard operations.

### Reason

Active job interactions benefit from immediate updates, while not every operation needs a persistent real-time connection.

### Risks

- Connection drops.
- Reconnection handling.
- Duplicate events.
- Increased infrastructure complexity at scale.

### Complexity

**Medium**

---

## 5. Images and Voice

### Problem

Customers need to describe problems using text, images, and optional voice recordings.

### Possible Solutions

- Store files directly in the application server.
- Store files in dedicated object storage.
- Store metadata in the database and files separately.

### Recommended Solution

Store the **file itself in dedicated storage** and store only its metadata/reference in the database.

### Reason

Images and audio can become large and should not unnecessarily increase database size.

### Risks

- Malicious file uploads.
- Excessive file sizes.
- Unauthorized access.
- Storage cost growth.

### Complexity

**Medium**

---

## 6. Voice-to-Text

### Problem

Customers may prefer speaking instead of typing.

### Possible Solutions

- Keep voice messages only.
- Convert voice to text.
- Provide both voice and text.

### Recommended Solution

For MVP, support **voice recording** first. Add voice-to-text later after validating actual user demand.

### Reason

Voice-to-text adds another processing dependency and can introduce language/accent accuracy issues. Voice recording provides the core functionality with less complexity.

### Risks

- Poor transcription accuracy.
- Urdu/regional-language challenges.
- Additional processing cost.
- Privacy concerns around recorded audio.

### Complexity

**Low for voice storage / Medium-High for voice-to-text**

---

## 7. Maps and Directions

### Problem

Users need to choose locations, understand approximate distance, and later navigate to the customer.

### Possible Solutions

- Map provider integration.
- Address-only workflow.
- Map plus address workflow.

### Recommended Solution

Use map-based location selection for customers and navigation/directions after the booking is confirmed.

### Reason

A visual map is easier for selecting a service location, while directions become useful once the worker is confirmed.

### Risks

- Map/API cost.
- Incorrect geocoding.
- Privacy concerns.
- Poor coverage in some areas.

### Complexity

**Medium**

---

## 8. Payments and Escrow

### Problem

The platform needs to protect both parties during payment, support refunds/disputes, and prevent easy off-platform leakage.

### Possible Solutions

- Direct customer-to-worker payment.
- Platform payment collection.
- Platform-held payment with controlled release.
- Milestone-based payment.

### Recommended Solution

For the product model, use a **platform-controlled payment flow**:

**Customer payment → Payment held/controlled by platform → Work completed → Dispute window → Release to worker → Platform commission deducted**

The exact legal and payment-provider structure must be validated for the target country before implementation.

### Reason

This gives the platform stronger control over disputes, refunds, commission, and transaction records.

### Risks

- Payment-provider limitations.
- Refund and settlement problems.
- Fraud/chargebacks.
- Regulatory and legal requirements.
- Incorrect implementation could create financial loss.

### Complexity

**High**

---

## 9. Platform Commission

### Problem

The business needs a sustainable source of revenue.

### Possible Solutions

- Commission from worker.
- Commission from customer.
- Fixed booking fee.
- Combination of fees.

### Recommended Solution

Start with a **clearly defined transaction fee/commission** and keep the fee visible before confirmation.

### Reason

Users should understand exactly what they are paying and why.

### Risks

- Users may bypass the platform to avoid fees.
- High fees can reduce conversion.
- Low fees may not cover support, payment, and operational costs.

### Complexity

**Medium**

---

## 10. Authentication and OTP

### Problem

The platform needs to verify users and protect accounts.

### Possible Solutions

- Password-only authentication.
- Phone OTP.
- Email verification.
- Multi-factor authentication for sensitive actions.

### Recommended Solution

Use **phone OTP for initial identity verification**, with stronger authentication for sensitive actions such as payment-related operations or account changes where appropriate.

### Reason

OTP can reduce password-related friction for a phone-based marketplace. Authentication should also include protection against repeated login/verification attempts. [4]

### Risks

- OTP abuse.
- SIM/phone-number takeover.
- Brute-force attempts.
- Fake accounts.

### Complexity

**Medium**

---

## 11. Authorization / RBAC

### Problem

Customers, workers, and admins must have different permissions.

### Possible Solutions

- Frontend-only role checks.
- Backend authorization.
- Role-based access control.

### Recommended Solution

Implement **server-side role-based authorization**.

Basic roles:

- Customer
- Worker
- Admin

Every protected action must be checked on the backend, not only hidden in the frontend.

### Reason

Frontend restrictions alone can be bypassed by a malicious client.

### Risks

- Broken access control.
- Customer accessing worker data.
- Worker accessing admin operations.
- Privilege escalation.

### Complexity

**Medium**

---

## 12. File Upload Security

### Problem

Users can upload images/audio, which creates a potential attack surface.

### Possible Solutions

- Trust file extension.
- Validate file type and size.
- Generate server-side filenames.
- Scan suspicious files.
- Restrict access to authorized users.

### Recommended Solution

Apply strict upload controls:

- Allow only required file types.
- Validate actual file type.
- Set size limits.
- Generate safe filenames.
- Require authentication/authorization.
- Keep uploaded files outside direct application execution paths.
- Add malware scanning where appropriate.

OWASP specifically recommends validating file types instead of trusting the Content-Type header, limiting file size, generating filenames, and restricting upload access. [5]

### Risks

- Malicious files.
- Storage exhaustion.
- Unauthorized file access.
- DoS through repeated uploads.

### Complexity

**Medium**

---

## 13. Rate Limiting

### Problem

Attackers or abusive users could repeatedly call APIs for OTPs, login, job creation, messages, or other operations.

### Possible Solutions

- No rate limits.
- Per-IP limits.
- Per-account limits.
- Per-endpoint limits.
- Combined controls.

### Recommended Solution

Use **endpoint-specific rate limits** combined with user/account and IP-based controls.

Higher-risk endpoints such as OTP, login, password/account recovery, job creation, and messaging should have stricter limits.

### Reason

Different actions have different abuse risks. Authentication systems should include throttling/lockout protections against repeated attempts. [4]

### Risks

- Legitimate users could be blocked.
- Attackers may use many IP addresses/accounts.
- Poorly chosen limits can hurt UX.

### Complexity

**Medium**

---

## 14. Fraud Prevention

### Problem

A marketplace can be abused through fake accounts, fake jobs, fake reviews, payment fraud, or collusion.

### Possible Solutions

- Basic verification.
- Worker identity/document verification.
- Suspicious-activity monitoring.
- Transaction limits.
- Manual review for high-risk cases.
- Reputation/rating systems.

### Recommended Solution

Start with layered controls:

**Phone verification + Worker verification + Review history + Transaction monitoring + Dispute system + Admin review for suspicious activity**

### Reason

No single fraud control is sufficient.

### Risks

- False positives.
- Fake documents.
- Multiple accounts.
- Customer-worker collusion.

### Complexity

**High**

---

## 15. Location Privacy

### Problem

A customer's exact home address is sensitive information.

### Recommended Solution

Use a staged disclosure model:

**Before worker selection:** approximate area/distance  
**After worker confirmation:** exact service address

Limit who can access the address and keep location data only as long as required.

### Reason

The worker needs enough information to decide whether to accept the job, but does not necessarily need the exact address before selection.

### Risks

- Address leakage.
- Unauthorized access.
- Stalking/safety concerns.
- Excessive data retention.

### Complexity

**Medium-High**

---

## 16. Payment Security

### Problem

Payment data and transaction records are high-value targets.

### Possible Solutions

- Store sensitive card/payment credentials directly.
- Use a payment provider to handle sensitive payment details.
- Maintain a platform transaction ledger.

### Recommended Solution

Prefer a **trusted payment provider** for sensitive payment handling and maintain a separate internal transaction/ledger record for business state.

Do not store sensitive payment credentials unless there is a compelling, fully compliant reason to do so.

### Reason

Reducing the amount of sensitive payment data handled directly by the platform reduces security exposure.

### Risks

- Payment fraud.
- Webhook spoofing.
- Duplicate payment processing.
- Refund inconsistencies.
- Regulatory/compliance requirements.

### Complexity

**High**

---

# Cross-Cutting Security Principles

## Authentication

Users must prove who they are before accessing protected account functionality.

## Authorization

Every sensitive action must verify whether the current user is allowed to perform it.

## Least Privilege

Users and internal services should receive only the access they actually need.

## Input Validation

Never trust client-provided data.

## Audit Logging

Important actions should be recorded, especially:

- Login/security events
- Worker verification
- Job status changes
- Payment events
- Refunds
- Disputes
- Admin actions

## Privacy

Collect only necessary personal/location data and control who can access it.

## Error Handling

Do not expose sensitive internal information through error messages.

---

# Major Technical Risk Summary

| Area                    | Risk Level  | Complexity  |
| ----------------------- | ----------- | ----------- |
| Location & geolocation  | Medium      | Medium      |
| Nearby worker matching  | Medium      | Medium      |
| Real-time notifications | Medium      | Medium      |
| Real-time communication | Medium      | Medium      |
| Images / voice          | Medium      | Medium      |
| Voice-to-text           | Medium-High | Medium-High |
| Maps                    | Medium      | Medium      |
| Payments / escrow       | **High**    | **High**    |
| Commission              | Medium      | Medium      |
| Authentication / OTP    | High        | Medium      |
| Authorization / RBAC    | **High**    | Medium      |
| File-upload security    | **High**    | Medium      |
| Rate limiting           | Medium      | Medium      |
| Fraud prevention        | **High**    | **High**    |
| Location privacy        | **High**    | Medium-High |
| Payment security        | **High**    | **High**    |

---

# MVP Security & Feasibility Priorities

For the first version, prioritize:

1. Authentication / OTP
2. Backend authorization
3. Location privacy
4. Nearby worker matching
5. Job notifications
6. Secure file uploads
7. Payment flow and transaction records
8. Basic dispute handling
9. Rate limiting
10. Audit logging

Voice-to-text, advanced fraud detection, sophisticated worker ranking, and other advanced features can be added after the basic marketplace flow is proven.

---

# Final Recommendation

The platform is **technically feasible**, but the highest-risk areas are:

**Payments/Escrow, authentication/authorization, fraud prevention, location privacy, and secure file handling.**

The basic marketplace flow is comparatively manageable:

**Customer posts job → suitable nearby workers are identified → workers receive the job → worker sends visit offer/ETA → customer selects worker → visit/inspection → repair approval → completion → payment release → review.**

The team should finalize the business rules and payment model before beginning major development, because payment, dispute, cancellation, and worker/customer state transitions affect multiple parts of the system.

---

# Sources

[1] MDN — Geolocation API  
https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API

[2] PostGIS — ST_DWithin / Radius Queries  
https://postgis.net/documentation/tips/st-dwithin/  
https://postgis.net/docs/ST_DWithin.html

[3] Firebase — Receive Messages in Web Apps  
https://firebase.google.com/docs/cloud-messaging/web/receive-messages

[4] OWASP — Authentication Cheat Sheet  
https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

[5] OWASP — File Upload Cheat Sheet  
https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
