# Hunar Mobile App — Cross-Platform Plan

**Status:** Draft v1
**Goal:** Ship one mobile app that runs on both Android and iOS, covering the customer and worker journeys already available on the web.

---

## 1. Overview

Hunar/WorkerFix is a home-services marketplace. The existing stack is a NestJS REST API (`hunar-backend`) and a Next.js web client (`hunar-frontend`).

The mobile app will reuse the same backend and the same business rules. No backend rewrite is planned; the app is a new client for the existing `/api/v1` API and Socket.IO events.

### Goals

- One TypeScript codebase for Android and iOS.
- Customer and worker flows at parity with the web portals.
- Native access where it matters: camera, photos, location, maps, push notifications, secure token storage.
- Store-ready builds and a repeatable release process.

### Non-goals (initial release)

- Admin portal on mobile (admin stays web-only; a read-only admin view can come later).
- Rebuilding backend modules or changing core marketplace rules.
- Tablet-specific layouts (the app should scale, but phone-first).

---

## 2. Recommended Stack

| Area | Choice | Why |
| --- | --- | --- |
| Framework | React Native + Expo (managed) | Reuses React/TypeScript knowledge, one codebase, EAS builds for both stores |
| Navigation | Expo Router | File-based routing, deep links, role-based route groups |
| Language | TypeScript | Shared types and validation with the web app |
| Server state | TanStack Query | Already used on web; caching, retries, optimistic updates |
| Local state | Zustand or React Context | Small, predictable UI/session state |
| Forms | React Hook Form + Zod | Already used on web; shared schemas |
| API | Existing NestJS REST + Socket.IO | No duplicate backend |
| i18n | i18next / next-intl-compatible keys | English and Urdu, RTL support |
| Secure storage | `expo-secure-store` | Tokens never in plain AsyncStorage |
| Images | `expo-image-picker` + compressor | Job photos, avatars, KYC documents |
| Location/Maps | `expo-location` + Mapbox (or `react-native-maps`) | Worker tracking and job locations |
| Push | `expo-notifications` (APNs/FCM) | Job offers, chat, status updates |
| Builds/Release | EAS Build + EAS Submit | Cloud builds for both platforms, store submission |

**Alternative:** Flutter is viable, but it would give up direct reuse of React/TypeScript patterns and TanStack Query/Zod choices. React Native is recommended unless the team prefers Dart.

---

## 3. Scope by Role

### Customer

- Sign up / sign in (email or phone + OTP), password reset.
- Create a job: category, description, photos, location, urgency, preferred visit time.
- View offers, worker profiles, and accept an offer.
- Live job status and worker location.
- Chat with the assigned worker.
- Payments/visit charge and payment history.
- Reviews and support/disputes.
- Profile, addresses, language, notifications.

### Worker

- Onboarding and verification (documents, categories, service area).
- OTP/email verification.
- Job feed and offer submission.
- Assigned jobs, status updates, completion proof (photos).
- Wallet, earnings, withdrawal requests.
- Chat with customers.
- Availability and location sharing (foreground by default).
- Profile and ratings.

### Admin

- Web-only for v1.
- Optional later: read-only dashboard, job/dispute lookup, push alerts.

---

## 4. Architecture

### Repository layout

```
apps/mobile/                # Expo app (or a sibling repo if preferred)
  app/                      # Expo Router routes
    (auth)/
    (customer)/
    (worker)/
  src/
    features/               # feature modules (jobs, auth, wallet, chat...)
    components/
    lib/                    # api client, storage, i18n, analytics
packages/shared/            # optional: shared types, Zod schemas, constants
```

If a monorepo is not practical, keep `mobile/` as a sibling app and copy only stable shared types. Do not fork business logic.

### API and realtime

- Base URL from environment (`EXPO_PUBLIC_API_URL`), defaulting to the deployed API.
- Reuse `/api/v1` endpoints and the existing Socket.IO namespace/events.
- Add mobile-only endpoints only when a real gap exists (for example, a lightweight job list without base64 images).
- Contract discipline: keep request/response types in `packages/shared` and validate at the boundary with Zod.

### Authentication

- Access + refresh tokens stored in `expo-secure-store`.
- One refresh interceptor; on 401, refresh once, retry, otherwise sign out.
- Role-based route groups: `(customer)` and `(worker)`; redirect after login based on role.
- Deep links for verification, password reset, and job/chat notifications.
- Never embed API secrets, Brevo keys, or database credentials in the app.

### Data and performance

- TanStack Query with sensible `staleTime` per resource; pull-to-refresh; infinite lists.
- Paginate lists. List endpoints must not return base64 image blobs; return URLs or thumbnails.
- Compress images before upload; show upload progress; retry failed uploads.
- Cache read-only data (categories, profile) for offline display.
- Optimistic updates for chat and simple status changes.
- Handle poor networks: timeouts, retry with backoff, clear empty/error states.

---

## 5. Platform-Specific Requirements

### iOS

- Permission strings: camera, photo library, location (when-in-use), notifications.
- App Store privacy manifest and data-collection disclosures.
- Sign in with Apple if other social logins are offered.
- TestFlight for internal and external beta.
- Background location is heavily restricted; v1 should use foreground location only.

### Android

- Runtime permissions for camera, photos, location, notifications (Android 13+).
- FCM setup and notification channels.
- Play Store data safety form and privacy policy.
- Internal testing track before production.

### Shared

- Universal/deep links for verification and job links.
- Push notification routing to the right screen.
- RTL layout for Urdu; test both languages on small screens.
- Accessibility: touch targets, contrast, screen-reader labels.

---

## 6. Environments and Release

- **Environments:** development, staging, production. Separate API URLs and app identifiers where needed.
- **EAS profiles:** `development` (dev client), `preview` (internal builds), `production` (store builds).
- **Config:** `EXPO_PUBLIC_*` values per profile; no secrets in the bundle.
- **Release flow:**
  1. Merge to the release branch.
  2. EAS Build for Android (AAB) and iOS (IPA).
  3. Internal testing: Play internal track + TestFlight.
  4. Fix, rebuild, promote.
  5. Submit with EAS Submit; keep release notes and screenshots current.
- **OTA updates:** use Expo Updates only for JS-level fixes that comply with store policies; binary changes require a new build.
- **Versioning:** semantic app version + build number; tag each store release in git.

---

## 7. Testing and QA

- **Unit:** Jest for utilities, hooks, and API mapping.
- **Component:** React Native Testing Library for forms, lists, and empty/error states.
- **E2E:** Maestro (simple, fast) or Detox for login, job creation, offer acceptance, chat, and withdrawal.
- **API contract:** run against staging; verify auth refresh and error shapes.
- **Device matrix:** at least one small Android, one large Android, one recent iPhone, one older iPhone.
- **Performance:** list scroll, image upload on slow network, cold start, memory during chat.
- **Release checklist:** permissions, deep links, push, payments, RTL, offline behavior.

---

## 8. Delivery Phases

### Phase 0 — Foundation

- Confirm stack and repo layout.
- Expo app shell, environments, API client, secure token storage, auth refresh.
- Design system basics: colors, typography, buttons, inputs, empty/error states.
- CI for lint, typecheck, tests, and EAS preview builds.

### Phase 1 — Customer MVP

- Auth and profile.
- Create job with photos and location.
- Job list/detail, offers, accept offer.
- Status tracking and chat.
- Basic payments/history, reviews.

### Phase 2 — Worker MVP

- Onboarding and verification.
- Job feed, offers, assigned jobs, status updates.
- Wallet and withdrawals.
- Chat and ratings.

### Phase 3 — Hardening and Beta

- Push notifications end-to-end.
- Offline/error handling, performance tuning.
- Security review, privacy manifests, store assets.
- Internal and external beta.

### Phase 4 — Launch

- Store submissions, staged rollout.
- Monitoring, crash reporting, analytics.
- Post-launch fixes and a backlog for v1.1.

---

## 9. Risks and Open Questions

- **Backend list payloads:** job lists currently include large base64 images; this must be fixed server-side before mobile launch (frontend already caps page sizes as a stopgap).
- **Brevo/IP allowlist:** OTP email delivery depends on Brevo IP restrictions and Railway egress; confirm production sending works from the deployed backend.
- **Push infrastructure:** APNs/FCM credentials and Expo project ownership must be set up early.
- **Payments:** confirm the payment provider and whether mobile in-app purchase rules apply (physical services usually can use external payment, but review store policies).
- **Maps provider:** Mapbox licensing vs. native maps; decide before building tracking.
- **Background location:** avoid in v1; if required later, plan for store review and battery impact.
- **Shared code:** decide whether to publish a shared package or duplicate stable types.
- **Admin mobile:** explicitly out of scope for v1.

---

## 10. Definition of Done (v1)

- Android and iOS builds install and run on supported OS versions.
- Customer and worker can complete the core journey end-to-end against production.
- Auth refresh, OTP, push, chat, uploads, and payments work on real devices.
- No secrets in the app bundle; tokens in secure storage.
- English and Urdu (RTL) usable.
- Store listings, privacy policy, and support contact are ready.
- Crash-free sessions and key funnel metrics are monitored.
