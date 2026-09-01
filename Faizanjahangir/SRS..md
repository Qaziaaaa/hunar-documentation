# Software Requirements Specification (SRS)

## Construction Platform MVP
**Functional, System, and Non-Functional Requirements**

---

# 1. Document Purpose

This Software Requirements Specification (SRS) defines what the Construction Platform Minimum Viable Product (MVP) must do from the user's and system's perspective.

This document acts as the functional contract and reference point for:

- Product planning
- UI/UX design
- Frontend development
- Backend development
- Quality Assurance (QA)
- Testing
- Future Technical Design Document (TDD)
- Platform maintenance and future scalability

## MVP Principle

The first release should remain focused on the main construction service workflow:

1. Customer creates an account.
2. Customer posts a construction/service job.
3. Suitable skilled workers receive or discover the job.
4. Workers submit quotations.
5. Customer reviews and selects a quotation.
6. A booking is created.
7. Customer completes payment.
8. Worker performs the work.
9. Job is marked as completed.
10. Customer and worker can review the experience.

The MVP should avoid unnecessary complexity and focus on successfully completing this core workflow.

---

# 2. Product Scope

## 2.1 In Scope

The MVP includes the following features:

### Customer Features
- Customer registration and login.
- Customer profile management.
- Job creation and management.
- Quote review and worker selection.
- Booking management.
- Payment initiation and status tracking.
- Job status tracking.
- Worker review and rating.

### Skilled Worker Features
- Worker registration and login.
- Worker profile creation.
- Skills and services management.
- Service area configuration.
- Availability management.
- Worker verification submission.
- Job discovery or matching.
- Quote submission.
- Booking acceptance.
- Work status updates.
- Job completion.

### Job Features
- Service category selection.
- Job description.
- Location or service area.
- Preferred schedule.
- Budget or pricing context.
- Unique job identification.
- Job status management.

### Quote Features
- Quote amount.
- Worker message.
- Estimated duration.
- Terms or additional conditions.
- Customer quote comparison and selection.

### Booking Features
- Booking creation after quote selection.
- Controlled booking status transitions.
- Job progress tracking.

### Payment Features
- Payment request creation.
- Payment provider integration.
- Payment status tracking.
- Transaction reference storage.

### Review Features
- Customer review after job completion.
- Worker review of customer where platform rules allow.
- Rating and review history.

### Notification Features
Notifications for important workflow events, including:

- New job availability.
- New quote received.
- Quote selected.
- Booking confirmed.
- Payment updates.
- Job completion.
- Review availability.

### Admin Features
- User management.
- Worker management.
- Worker verification.
- Job monitoring.
- Booking monitoring.
- Payment monitoring.
- Flag and dispute handling.
- Account suspension.
- Platform controls.
- Audit logging for critical actions.

---

## 2.2 Out of Scope for MVP

The following features are not required for the first MVP release:

- Complex Artificial Intelligence (AI) matching.
- Advanced recommendation engines.
- Predictive pricing.
- Multi-vendor inventory management.
- Full e-commerce functionality.
- International multi-currency settlement.
- Complex tax engines.
- Enterprise workforce management.
- Advanced loyalty programs.
- Complex subscription systems.
- Complex referral programs unless required after pilot feedback.

These features may be considered in future versions.

---

# 3. Actors and Permissions

## 3.1 Customer

### Main Capabilities

A customer can:

- Register and log in.
- Manage their profile.
- Create jobs.
- Edit or cancel eligible jobs.
- Receive worker quotations.
- Compare quotes.
- Select a worker.
- Create a booking.
- Make payment.
- Track job progress.
- Confirm completion.
- Submit reviews and ratings.

### Restrictions

A customer cannot:

- Approve worker verification.
- Access admin controls.
- Access other users' private information.
- Modify platform-wide configuration.
- Directly change completed financial records.

---

## 3.2 Skilled Worker

### Main Capabilities

A skilled worker can:

- Register and log in.
- Create and manage their profile.
- Add skills and services.
- Define service areas.
- Set availability.
- Submit verification documents.
- Receive relevant jobs.
- Submit quotations.
- Accept bookings.
- Update work progress.
- Mark eligible work as completed.
- Participate in reviews where allowed.

### Restrictions

A worker cannot:

- Access admin-only controls.
- Access private customer payment details beyond necessary status information.
- Modify completed financial records without an audit trail.
- Complete another worker's booking.
- Quote on jobs they are not eligible to perform.

---

## 3.3 Admin

### Main Capabilities

An admin can:

- Manage customers.
- Manage workers.
- Review worker verification requests.
- Approve or reject workers.
- Monitor jobs.
- Monitor bookings.
- Monitor payments.
- Handle flags and disputes.
- Suspend accounts.
- Configure platform controls.
- Review audit records.

### Restrictions

Admin actions affecting important records must:

- Require appropriate permissions.
- Be logged.
- Maintain an audit trail.

---

# 4. Functional Requirements

## FR-01: Authentication

The system shall:

- Allow customers to register.
- Allow skilled workers to register.
- Allow users to sign in.
- Securely handle passwords.
- Use authenticated sessions or tokens.
- Enforce role-based access control.
- Restrict protected features to authorized users.
- Provide logout functionality.
- Handle expired or invalid sessions.
- Prevent unauthorized access to protected APIs.

---

## FR-02: Customer Profile

The customer shall be able to maintain:

- Full name.
- Phone number.
- Email address.
- Service location.
- Profile information.

The customer shall also be able to:

- View active jobs.
- View historical jobs.
- View booking information.
- View payment status.
- Update profile information.

---

## FR-03: Worker Profile and Verification

The worker shall be able to maintain:

- Name.
- Contact information.
- Skills.
- Services.
- Service area.
- Experience.
- Availability.

The worker shall be able to submit:

- Identity information.
- Required verification information.
- Required verification documents.

The admin shall be able to:

- Approve verification.
- Reject verification.
- Request additional information or changes.

Only eligible and approved workers should receive jobs requiring verified worker status.

---

## FR-04: Job Management

The customer shall be able to create a job request.

A job request should include:

- Service category.
- Description.
- Location or service area.
- Preferred schedule.
- Budget or pricing context.

The system shall:

- Generate a unique job ID.
- Assign an initial job status.
- Store the job record.

The customer shall be able to:

- View the job.
- Edit the job when allowed.
- Cancel the job when allowed.

Workers shall only see jobs relevant to:

- Their service category.
- Their skills.
- Their service area.
- Their verification status where required.

---

## FR-05: Quotes

A worker shall be able to submit a quote containing:

- Quote amount.
- Message.
- Estimated duration.
- Relevant terms or conditions.

The customer shall be able to:

- View all quotes for their job.
- Compare quotes.
- Select one quote.

The system shall prevent multiple active confirmed bookings for the same job.

---

## FR-06: Booking and Job Status

When a customer selects a quote:

- A booking shall be created.
- The selected worker shall be linked to the booking.
- The customer shall be linked to the booking.
- The booking shall reference the related job and quote.

Supported booking statuses may include:

- Pending
- Confirmed
- In Progress
- Completed
- Cancelled
- Disputed

Only authorized users shall be able to change each status.

The system shall validate status transitions to prevent invalid workflow changes.

---

## FR-07: Payment

The system shall:

- Create a payment request for a confirmed booking.
- Store payment information separately from booking status.
- Support payment states including:
  - Pending
  - Successful
  - Failed
  - Cancelled
- Store the transaction reference returned by the payment provider.
- Verify payment information using backend or payment provider records.

The frontend alone must never be treated as the source of truth for payment success.

---

## FR-08: Reviews

The customer may review a worker after a qualifying completed booking.

Where product rules allow, the worker may also review the customer.

Each review shall reference:

- The completed booking.
- The reviewer.
- The reviewed user.

The system should prevent duplicate reviews for the same booking according to platform rules.

---

## FR-09: Notifications

The system shall notify users when important events occur.

Important events include:

- New relevant job.
- New quote.
- Quote selected.
- Booking confirmed.
- Payment update.
- Job completion.
- Review availability.

Notifications should be idempotent.

Repeated requests must not create uncontrolled duplicate notifications.

---

## FR-10: Admin Management

The admin shall be able to:

- View users.
- Search users.
- View workers.
- Search workers.
- View jobs.
- Monitor bookings.
- Monitor payments.
- Review verification cases.

The admin shall also be able to:

- Approve worker verification.
- Reject worker verification.
- Request verification changes.
- Flag accounts.
- Suspend accounts.
- Handle disputes.

Important admin actions must be auditable.

---

# 5. Core Workflow Requirements

## 5.1 Customer Workflow

1. Customer signs up.
2. Customer logs in.
3. Customer completes profile.
4. Customer creates a job.
5. Suitable workers receive or discover the job.
6. Workers submit quotes.
7. Customer reviews quotes.
8. Customer selects a quote.
9. Booking is created.
10. Customer initiates payment.
11. Customer tracks job progress.
12. Worker completes the work.
13. Customer confirms or views completion.
14. Customer submits a review.

---

## 5.2 Worker Workflow

1. Worker signs up.
2. Worker completes profile.
3. Worker adds skills and services.
4. Worker defines service area.
5. Worker submits verification.
6. Admin reviews verification.
7. Worker becomes approved.
8. Worker receives relevant jobs.
9. Worker submits a quote.
10. Customer selects the quote.
11. Worker accepts the booking.
12. Worker performs the work.
13. Worker updates work status.
14. Worker completes the job.

---

## 5.3 Admin Workflow

1. Admin monitors registrations.
2. Admin reviews worker verification.
3. Admin approves or rejects workers.
4. Admin monitors jobs.
5. Admin monitors bookings.
6. Admin monitors payments.
7. Admin handles flags and disputes.
8. Admin manages users.
9. Admin audits critical actions.

---

# 6. Business Rules

The platform must enforce the following business rules:

1. A job cannot have more than one active confirmed booking.
2. Only the authorized customer can select a quote for their own job.
3. Only an eligible worker can submit a quote for a matching job.
4. A worker cannot complete another worker's booking.
5. Payment status must not depend only on frontend state.
6. Payment status must be verified through backend and payment provider records.
7. Reviews should only be allowed after a qualifying completed booking.
8. Admin overrides must require permission checks.
9. Admin overrides must be logged.
10. Duplicate requests must not create duplicate critical records.
11. Contact and payment bypass risk should be reduced through platform value, controlled contact exposure, transaction records, support, and post-job protections.

---

# 7. Non-Functional Requirements

## 7.1 Security

The system shall provide:

- Password hashing.
- Authenticated APIs.
- Server-side role checks.
- Input validation.
- Secure session or token handling.
- Protected secrets.
- No exposure of backend secrets to the frontend.
- Authorization checks for private records.

---

## 7.2 Performance

Under pilot load:

- Common API requests should normally respond within approximately 500 milliseconds.
- External payment provider latency is excluded from this target.
- The system should avoid unnecessary database and API requests.

---

## 7.3 Availability

The MVP should:

- Be deployable in a recoverable environment.
- Include health checks.
- Support service recovery.
- Provide appropriate deployment configuration.

---

## 7.4 Scalability

The architecture should allow:

- Additional workers.
- Additional customers.
- New service categories.
- Increased traffic.

The core workflow should not require a complete rewrite when the platform grows.

---

## 7.5 Reliability

Critical workflow operations must:

- Be persisted.
- Support idempotency where appropriate.
- Avoid duplicate creation caused by retries.
- Preserve valid state transitions.

Critical areas include:

- Booking creation.
- Payment events.
- Job completion.
- Notifications.

---

## 7.6 Usability

The core customer workflow should:

- Be easy to understand.
- Require minimal technical knowledge.
- Require minimal unnecessary steps.
- Provide clear feedback.
- Display understandable error messages.

---

## 7.7 Maintainability

The system should use:

- Clear modules.
- Consistent naming.
- Reusable services.
- Validation.
- Centralized error handling where appropriate.
- Logging.
- Documentation.

---

## 7.8 Accessibility

The user interface should provide:

- Keyboard-friendly controls.
- Readable contrast.
- Labels for form fields.
- Clear validation messages.
- Understandable error messages.

---

## 7.9 Observability

The system should record:

- Request failures.
- Important workflow events.
- Payment events.
- Critical admin actions.

Logs must avoid storing unnecessary sensitive information.

---

# 8. Error and Edge Cases

The system must handle the following situations safely:

## 8.1 Duplicate Registration

- A user attempts to register with an already-used email.
- A user attempts to register with an already-used phone number.

The system should reject the duplicate registration and show an understandable error.

---

## 8.2 Invalid Authentication

- Authentication token is expired.
- Authentication token is invalid.
- User session is no longer valid.

The system should prevent protected access and require the user to authenticate again.

---

## 8.3 Quote After Job Cancellation

If a worker attempts to submit a quote after a job has been cancelled:

- The quote must be rejected.
- No new quote record should be created.

---

## 8.4 Multiple Quote Selection

If a customer attempts to select another quote after a booking has already been confirmed:

- The second selection must be rejected.
- The system must preserve the existing confirmed booking.

---

## 8.5 Payment Provider Events

The system must handle:

- Pending payment.
- Failed payment.
- Cancelled payment.
- Successful payment.
- Duplicate payment callback.

Duplicate callbacks must not create duplicate payment records or duplicate workflow changes.

---

## 8.6 Worker Verification Changes

If a worker becomes:

- Unverified
- Suspended
- Ineligible

while jobs or bookings are active, the system must apply business rules and notify relevant administrators or users where necessary.

---

## 8.7 Job Cancellation After Quotes

If a customer cancels a job after receiving quotes but before payment:

- New quotes should no longer be accepted.
- Existing workflow actions should be restricted according to cancellation rules.
- Related workers should be notified where appropriate.

---

## 8.8 Duplicate Network Requests

If a network retry occurs during:

- Job creation.
- Quote submission.
- Booking creation.
- Payment processing.

the system should prevent unintended duplicate records.

---

## 8.9 Duplicate Review

If a user attempts to submit more than one review for the same booking:

- The system should reject duplicate submissions according to platform rules.

---

## 8.10 Unauthorized Private Record Access

If a user attempts to access another user's private record:

- The server must reject the request.
- The system must not expose private data.

---

# 9. MVP Acceptance Criteria

The MVP is considered ready when the following end-to-end workflow successfully works:

1. A test customer can register and log in.
2. The customer can create a job.
3. A verified worker can receive or discover the relevant job.
4. The worker can submit a quote.
5. The customer can view and select a quote.
6. The system creates a valid booking.
7. Payment can be initiated.
8. Payment status can be safely recorded and verified.
9. The worker can perform and complete the job.
10. The customer can submit a review.
11. Role and permission rules are enforced.
12. Critical workflow state does not depend only on the frontend.
13. Duplicate requests do not create duplicate critical records.
14. Important admin actions are auditable.
15. Unauthorized users cannot access protected records.

---

# 10. Summary

The Construction Platform MVP provides a controlled marketplace workflow between customers and skilled workers.

The complete MVP journey is:

**Customer creates job → Suitable worker receives job → Worker submits quote → Customer selects quote → Booking is created → Payment is processed → Worker performs work → Job is completed → Users review the experience**

The platform must prioritize:

- Security
- Role-based permissions
- Reliable workflow state
- Payment verification
- Duplicate request protection
- Clear user experience
- Scalable architecture
- Admin oversight

This SRS provides the functional foundation for the next technical phase, including the Technical Design Document (TDD), API design, database design, frontend modules, backend modules, and QA test cases.
