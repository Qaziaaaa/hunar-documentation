# Hunar Mobile App — Low-Level Architecture

**Status:** Draft v1
**Companion to:** `docs/MOBILE_APP_PLAN.md`
**Stack:** React Native + Expo (TypeScript), Expo Router, TanStack Query, Zustand, Zod, Socket.IO, Expo SecureStore, Expo Notifications.

---

## 1. Scope and Assumptions

- One app binary for Android and iOS.
- Customer and worker roles are supported; admin remains web-only.
- The app is a client of the existing NestJS API (`/api/v1`) and Socket.IO server. No backend rewrite.
- Authentication is token-based (access + refresh) with role-based routing.
- English and Urdu (RTL) are supported from the first release.
- Phone-first layouts; tablets render the same screens responsively.

---

## 2. System Context

```
┌──────────────────────────────┐
│        Expo / RN app         │
│  ┌────────┐  ┌────────────┐  │
│  │ Screens│  │ Query cache│  │
│  └───┬────┘  └─────┬──────┘  │
│      │             │         │
│  ┌───▼─────────────▼──────┐  │
│  │   core: http/session   │  │
│  └───┬───────────┬────────┘  │
└──────┼───────────┼───────────┘
       │ HTTPS     │ WSS
       ▼           ▼
┌──────────────────────────────┐
│        NestJS backend        │
│  REST /api/v1  Socket.IO     │
└──┬──────┬──────┬──────┬──────┘
   │      │      │      │
   ▼      ▼      ▼      ▼
Postgres Redis  S3   Firebase / APNs
```

---

## 3. Layered Architecture

```
app/                     Route files only: compose screens, guards, providers
  │
features/*               Feature modules: screens, hooks, api, schemas, types
  │
core/*                   Cross-cutting: http, auth, query, realtime, storage,
                         notifications, media, i18n, ui, config
  │
types/*                  Shared API and domain types
```

**Dependency rules**

1. `app/` may import `features/*` and `core/*`.
2. `features/*` may import `core/*` and `types/*`.
3. `core/*` must not import `features/*` or `app/*`.
4. Features must not import another feature's internals; expose a public `index.ts`.
5. Only `core/http` performs network I/O.
6. Only `core/auth/session` reads or writes tokens.

---

## 4. Repository Layout

```
hunar-mobile/
  app/
    _layout.tsx
    index.tsx
    (auth)/
      _layout.tsx
      sign-in.tsx
      sign-up.tsx
      otp.tsx
      forgot-password.tsx
    (customer)/
      _layout.tsx
      (tabs)/
        _layout.tsx
        home.tsx
        jobs.tsx
        chat.tsx
        profile.tsx
      jobs/
        new.tsx
        [jobId]/
          index.tsx
          offers.tsx
          chat.tsx
          tracking.tsx
          review.tsx
      payments/
        index.tsx
        [paymentId].tsx
    (worker)/
      _layout.tsx
      (tabs)/
        _layout.tsx
        feed.tsx
        jobs.tsx
        wallet.tsx
        profile.tsx
      verification/
        index.tsx
        documents.tsx
        status.tsx
      jobs/
        [jobId]/
          index.tsx
          chat.tsx
          complete.tsx
      wallet/
        withdraw.tsx
        ledger.tsx
    +not-found.tsx
  src/
    core/
      config/env.ts
      http/client.ts
      http/errors.ts
      auth/session.ts
      auth/guards.tsx
      query/client.ts
      query/keys.ts
      realtime/socket.ts
      notifications/push.ts
      notifications/handlers.ts
      media/picker.ts
      media/upload.ts
      storage/secure.ts
      i18n/index.ts
      i18n/en.json
      i18n/ur.json
      ui/theme.ts
      ui/components/
      utils/format.ts
      utils/logger.ts
    features/
      auth/
        api.ts
        schemas.ts
        types.ts
        hooks.ts
        index.ts
      jobs/
        api.ts
        schemas.ts
        types.ts
        hooks.ts
        realtime.ts
        components/
        index.ts
      offers/
      chat/
      wallet/
      payments/
      reviews/
      notifications/
      profile/
      verification/
      onboarding/
      location/
    types/api.ts
  assets/
  app.config.ts
  eas.json
  tsconfig.json
  package.json
```

If a shared package is introduced later, move stable types and Zod schemas to `packages/shared` and import them from both the web and mobile apps.

---

## 5. Boot and Navigation

### 5.1 Root providers

`app/_layout.tsx` is the composition root:

```
GestureHandlerRootView
  SafeAreaProvider
    I18nProvider
      QueryClientProvider
        SessionProvider
          PushProvider
            Slot / Stack
```

The splash screen stays visible until session hydration finishes.

### 5.2 Boot sequence

```ts
async function bootstrap() {
  const tokens = await session.loadTokens();
  if (!tokens?.refreshToken) return session.setAnonymous();

  try {
    const user = await authApi.me();
    session.setAuthenticated(user, tokens);
    await notifications.registerDevice();
    socket.connect(tokens.accessToken);
  } catch {
    const refreshed = await session.refresh();
    if (!refreshed) await session.signOut();
  }
}
```

Rules:

- Do not render protected routes until `status` is `authenticated` or `anonymous`.
- Validate the stored session with `/auth/me` on cold start, but allow an offline start with cached user data.
- Refresh before navigating if the access token is expired.
- A worker with `verificationStatus !== "APPROVED"` is routed to the verification flow.

### 5.3 Route guards

```tsx
function CustomerLayout() {
  const { status, role } = useSession();
  if (status === "loading") return <SplashScreen />;
  if (status !== "authenticated" || role !== "CUSTOMER") {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Worker layout is identical with `role !== "WORKER"`. Auth screens redirect authenticated users to their home.

### 5.4 Role-based landing

```ts
const home =
  user.role === "WORKER"
    ? "/(worker)/(tabs)/feed"
    : "/(customer)/(tabs)/home";
router.replace(home);
```

### 5.5 Deep links

- Scheme: `hunar://`
- Universal links: `https://<app-domain>/app/*`
- Expo Router `linking.config` maps:
  - `app/jobs/:jobId` → customer job detail
  - `app/worker/jobs/:jobId` → worker job detail
  - `app/chat/:conversationId` → chat
  - `app/verify` → verification status
  - `app/reset-password?token=...` → reset flow

Push payloads include `{ type, jobId?, conversationId? }`; the tap handler resolves the route through a single `resolveNotificationRoute` function.

---

## 6. Configuration

`src/core/config/env.ts` reads and validates `EXPO_PUBLIC_*` values at startup:

```ts
const schema = z.object({
  EXPO_PUBLIC_ENV: z.enum(["development", "staging", "production"]),
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_SOCKET_URL: z.string().url(),
  EXPO_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
  EXPO_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

export const env = schema.parse(process.env);
```

The app fails fast in development if a required value is missing. Secrets (Brevo keys, database URLs, FCM service account) never enter the mobile bundle.

---

## 7. HTTP Client

### 7.1 Responsibilities

- Prefix the base URL.
- Attach `Authorization: Bearer <accessToken>`.
- Enforce a timeout with `AbortController`.
- Serialize JSON, support `FormData`.
- Map non-2xx responses to `ApiError`.
- Refresh once on 401 and retry the original request.
- Never retry non-idempotent writes automatically.

### 7.2 Error model

```ts
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export class NetworkError extends Error {}
export class TimeoutError extends Error {}
```

Mapping:

| Condition | Error | UI behavior |
| --- | --- | --- |
| No connection / fetch throws | `NetworkError` | Offline banner, retry |
| Abort due to timeout | `TimeoutError` | Retry, slow-network hint |
| 401 after refresh | `ApiError(401)` | Sign out |
| 403 | `ApiError(403)` | Permission message |
| 404 | `ApiError(404)` | Not-found state |
| 409 | `ApiError(409)` | Refetch state, show transition error |
| 422 | `ApiError(422)` | Field errors from `details` |
| 429 | `ApiError(429)` | Back off, show cooldown |
| 5xx | `ApiError(5xx)` | Generic retry, report |

### 7.3 Signature

```ts
type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export async function request<T>(
  path: string,
  options?: RequestOptions,
): Promise<T>;
```

### 7.4 Single-flight refresh

```ts
let refreshInFlight: Promise<Tokens | null> | null = null;

export function refreshSession(): Promise<Tokens | null> {
  if (!refreshInFlight) {
    refreshInFlight = session
      .refresh()
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}
```

On 401:

1. If the request was unauthenticated or is the refresh call, fail.
2. Await `refreshSession()`.
3. If refresh succeeds, retry the original request once with the new token.
4. If refresh fails, clear the session and route to sign-in.

---

## 8. Session and Secure Storage

### 8.1 Storage keys

Use SecureStore for tokens and AsyncStorage for non-sensitive cached data.

| Key | Storage | Contents |
| --- | --- | --- |
| `hunar.mobile.access_token` | SecureStore | JWT |
| `hunar.mobile.refresh_token` | SecureStore | refresh token |
| `hunar.mobile.user` | AsyncStorage | cached user profile |
| `hunar.mobile.device_id` | SecureStore | stable install identifier |
| `hunar.mobile.push_token` | AsyncStorage | last registered push token |

`SecureStore.setItemAsync` is called with `keychainAccessible: AFTER_FIRST_UNLOCK` so background notifications can read the session.

### 8.2 Session store

```ts
type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: User; role: Role };

type SessionActions = {
  hydrate(): Promise<void>;
  signIn(tokens: Tokens, user: User): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<Tokens | null>;
  setUser(user: User): void;
};
```

`signOut` performs, in order:

1. Best-effort `POST /auth/logout`.
2. Unregister the push token.
3. Disconnect the socket.
4. Clear the query cache.
5. Clear tokens and user.
6. Route to `/(auth)/sign-in`.

---

## 9. Query Layer

### 9.1 Defaults

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (count, error) =>
        !(error instanceof ApiError) || error.status >= 500
          ? count < 2
          : false,
      refetchOnAppFocus: true,
      refetchOnReconnect: true,
    },
    mutations: { retry: 0 },
  },
});
```

Foreground refresh is implemented once in a `useAppStateRefetch` hook.

### 9.2 Query keys

```ts
export const qk = {
  me: ["me"] as const,
  categories: ["categories"] as const,
  jobs: {
    all: ["jobs"] as const,
    customer: (filters: JobFilters) => ["jobs", "customer", filters] as const,
    available: (filters: JobFilters) => ["jobs", "available", filters] as const,
    active: ["jobs", "worker", "active"] as const,
    history: (filters: JobFilters) => ["jobs", "worker", "history", filters] as const,
    detail: (id: string) => ["jobs", "detail", id] as const,
    offers: (jobId: string) => ["jobs", jobId, "offers"] as const,
  },
  visits: {
    mine: ["visits", "mine"] as const,
    detail: (id: string) => ["visits", id] as const,
  },
  chat: {
    conversations: ["chat", "conversations"] as const,
    messages: (conversationId: string) =>
      ["chat", conversationId, "messages"] as const,
    unread: ["chat", "unread"] as const,
  },
  wallet: {
    balance: ["wallet", "balance"] as const,
    ledger: (filters: LedgerFilters) => ["wallet", "ledger", filters] as const,
    earnings: ["wallet", "earnings"] as const,
  },
  notifications: {
    list: ["notifications"] as const,
    unread: ["notifications", "unread"] as const,
  },
  reviews: {
    forJob: (jobId: string) => ["reviews", "job", jobId] as const,
    forWorker: (workerId: string) => ["reviews", "worker", workerId] as const,
  },
};
```

### 9.3 Pagination

- Lists use `useInfiniteQuery` with cursor or page parameters as exposed by the API.
- Keep page size small (10–20). Do not request base64 image blobs in list endpoints.
- Deduplicate items by `id` when merging pages.
- Show skeletons for the first page and a footer spinner for subsequent pages.

### 9.4 Mutation invalidation map

| Mutation | Invalidate |
| --- | --- |
| Create job | `jobs.customer`, `jobs.available` |
| Accept/reject/counter offer | `jobs.detail`, `jobs.offers`, `jobs.active`, `jobs.customer` |
| Update job status | `jobs.detail`, `jobs.active`, `jobs.history` |
| Send message | `chat.messages` (optimistic), `chat.conversations` |
| Read conversation | `chat.unread`, `chat.conversations` |
| Wallet withdraw | `wallet.balance`, `wallet.ledger` |
| Submit review | `jobs.detail`, `reviews.forJob`, `reviews.forWorker` |
| Update profile | `me` |

---

## 10. Realtime

### 10.1 Socket manager

One connection per session. Connect after authentication; disconnect on sign-out and after a grace period in the background.

```ts
io(env.EXPO_PUBLIC_SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false,
  auth: { token: accessToken },
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 5000,
});
```

Lifecycle:

1. `session.status === "authenticated"` → connect.
2. App returns to foreground → ensure connected.
3. App goes to background → keep for 30 seconds, then disconnect.
4. Token refreshed → update `socket.auth` and reconnect if needed.
5. `connect_error` with an auth failure → refresh once, then reconnect.
6. Sign-out → remove all listeners and disconnect.

### 10.2 Event handling

Do not attach socket listeners inside screen components. Register feature handlers in one place:

```ts
const handlers: RealtimeHandler[] = [
  ...jobsRealtime,
  ...chatRealtime,
  ...walletRealtime,
  ...notificationsRealtime,
];

export function startRealtime(queryClient: QueryClient) {
  for (const handler of handlers) handler.register(queryClient);
}
```

Handlers invalidate queries; they do not own screen state.

### 10.3 Event map

| Event | Action |
| --- | --- |
| `notification:new` | Invalidate notifications, unread count; show in-app banner |
| `job:statusChanged`, `job:status:changed` | Invalidate job detail, active jobs, history |
| `offer:counter` | Invalidate job offers and detail |
| `negotiation:updated`, `negotiation_updated` | Invalidate negotiation/repair data |
| `repair:updated` | Invalidate repair data |
| `wallet:balanceUpdated` | Invalidate wallet balance and ledger |
| `wallet:earnings:recorded` | Invalidate earnings |
| `wallet:commission:held`, `wallet:commission:deducted` | Invalidate balance and ledger |
| `chat:receive`, `message` | Append message if conversation is open; invalidate conversations |
| `chat:read` | Update read receipts |
| `chat:typing`, `chat:stopTyping` | Ephemeral state only |
| `conversation:updated` | Invalidate conversations |
| `connect` | Refetch active queries marked stale |

Chat messages must be deduplicated by message `id`; optimistic messages replace their temporary entry on ack.

---

## 11. Feature Module Anatomy

Example: `features/jobs/`

```
api.ts        HTTP calls, mapping backend DTOs to domain types
schemas.ts    Zod schemas for forms and responses
types.ts      JobSummary, JobDetail, JobStatus, JobFilters
hooks.ts      useCustomerJobs, useJob, useCreateJob, useAcceptOffer
realtime.ts   socket event handlers and invalidations
components/   JobCard, StatusBadge, JobFiltersSheet, PhotoGrid
index.ts      public exports only
```

### 11.1 Domain types

```ts
export type JobStatus =
  | "OPEN"
  | "OFFERS_RECEIVED"
  | "OFFER_ACCEPTED"
  | "WORKER_ASSIGNED"
  | "VISIT_SCHEDULED"
  | "VISIT_IN_PROGRESS"
  | "VISIT_COMPLETED"
  | "INSPECTION_DONE"
  | "REPAIR_NEGOTIATING"
  | "REPAIR_DECLINED"
  | "REPAIR_APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PAID"
  | "REVIEWED"
  | "CANCELLED"
  | "DISPUTED";

export type Role = "CUSTOMER" | "WORKER";

export interface JobSummary {
  id: string;
  title: string;
  status: JobStatus;
  category: { id: string; name: string; nameUrdu?: string };
  city: string;
  area: string;
  createdAt: string;
  visitCharge?: number | null;
}

export interface JobDetail extends JobSummary {
  description: string;
  images: string[];
  urgency: "LOW" | "NORMAL" | "HIGH" | "EMERGENCY";
  address: string;
  customer: { id: string; name: string; phone: string };
  worker?: { id: string; name: string; phone: string; avatarUrl?: string };
}
```

### 11.2 API functions

```ts
export async function listJobs(filters: JobFilters): Promise<Paginated<JobSummary>> {
  return request("/jobs", { query: filters });
}

export async function getJob(id: string): Promise<JobDetail> {
  return request(`/jobs/${id}`);
}

export async function createJob(input: CreateJobInput): Promise<{ id: string }> {
  return request("/jobs", { method: "POST", body: input });
}
```

The HTTP client accepts a `query` object and serializes it; do not build query strings by hand in features.

### 11.3 Hooks

```ts
export function useJob(id: string) {
  return useQuery({
    queryKey: qk.jobs.detail(id),
    queryFn: () => getJob(id),
    enabled: Boolean(id),
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.jobs.customer({}) });
      queryClient.invalidateQueries({ queryKey: qk.jobs.available({}) });
    },
  });
}
```

---

## 12. Endpoint Map

All paths below are relative to `/api/v1`.

### Auth and profile

| Method | Path | Use |
| --- | --- | --- |
| POST | `/auth/otp/send` | Customer phone OTP |
| POST | `/auth/otp/verify` | Customer phone OTP verify |
| POST | `/auth/customer/signup` | Customer signup |
| POST | `/auth/customer/login` | Customer login |
| POST | `/auth/customer/refresh` | Customer refresh |
| POST | `/auth/worker/otp/send` | Worker email OTP |
| POST | `/auth/worker/otp/verify` | Worker email OTP verify |
| POST | `/auth/register` | Worker registration |
| POST | `/auth/login` | Worker login |
| POST | `/auth/refresh` | Worker refresh |
| GET | `/auth/me` | Current user |
| GET | `/auth/worker/session` | Worker session |
| POST | `/auth/logout` | Logout |
| GET/PATCH | `/users/me` | Profile |
| GET/POST | `/users/me/addresses` | Addresses |
| GET | `/users/worker/me` | Worker profile |
| PATCH | `/users/worker/me` | Update worker profile |
| GET | `/users/worker/me/verification` | Verification state |
| POST | `/users/worker/submit` | Submit verification |

### Jobs and offers

| Method | Path | Use |
| --- | --- | --- |
| GET | `/categories` | Categories |
| POST | `/jobs` | Create job |
| GET | `/jobs/customer` | Customer jobs |
| GET | `/jobs/available` | Worker job feed |
| GET | `/jobs/:id` | Job detail |
| GET | `/workers/me/jobs/active` | Worker active jobs |
| GET | `/workers/me/jobs/history` | Worker history |
| GET | `/jobs/:jobId/offers` | Offers for job |
| POST | `/jobs/:jobId/offers` | Submit offer |
| POST | `/offers/:offerId/accept` | Accept offer |
| POST | `/offers/:offerId/reject` | Reject offer |
| POST | `/offers/:offerId/counter` | Counter offer |
| GET | `/offers/my` | Worker offers |

### Visits, chat, wallet, reviews, notifications

| Method | Path | Use |
| --- | --- | --- |
| GET | `/visits/my` | My visits |
| GET | `/visits/:id` | Visit detail |
| GET | `/jobs/:jobId/inspection` | Inspection |
| POST | `/location/track` | Worker location update |
| GET | `/location/track/:jobId` | Customer tracking |
| GET | `/locations/cities` | Cities |
| GET | `/locations/areas` | Areas |
| GET | `/chat/conversations` | Conversations |
| GET | `/chat/:jobId` | Conversation for job |
| GET | `/chat/:conversationId/messages` | Messages |
| POST | `/chat/:conversationId/messages` | Send message |
| POST | `/chat/:targetId/read` | Mark read |
| GET | `/wallet/balance` | Worker balance |
| GET | `/wallet/ledger` | Worker ledger |
| POST | `/wallet/withdraw` | Withdraw |
| GET | `/workers/me/earnings` | Earnings |
| POST | `/payments` | Create payment |
| GET | `/payments/customer` | Customer payments |
| POST | `/jobs/:jobId/review` | Submit review |
| GET | `/reviews/worker/:workerId` | Worker reviews |
| GET | `/notifications` | Notification list |
| GET | `/notifications/unread-count` | Unread count |
| PATCH | `/notifications/:id/read` | Mark one read |
| PATCH | `/notifications/read-all` | Mark all read |
| POST | `/uploads/profile-photo` | Avatar |
| POST | `/uploads/job-photo` | Job photo |
| POST | `/uploads/inspection-photo` | Inspection photo |
| POST | `/uploads/chat-image` | Chat image |
| POST | `/uploads/worker-document` | KYC document |
| POST | `/uploads/cnic-document` | CNIC |
| POST | `/uploads/voice-note` | Voice note |

Multipart uploads use the field name `file`.

---

## 13. Media Upload Pipeline

```
Pick/capture → resize/compress → multipart upload → { key, url } → attach url to payload
```

Rules:

- Images: resize the longest edge to 1600 px, JPEG quality ~0.7 before upload.
- Avatars: 512 px square, quality ~0.8.
- KYC documents: keep readable resolution; do not over-compress.
- Show a thumbnail and per-file progress; allow removing a failed file.
- Upload sequentially or with a concurrency cap of 2 to protect slow connections.
- The backend returns `{ key, url }`; store the URL in the job/profile payload.
- If an upload fails, keep the local URI and retry only that file.
- Cap total job photos (for example, 5) and display the remaining count.

---

## 14. Push Notifications

### 14.1 Client flow

1. On first authenticated launch, request notification permission.
2. Create an Android channel (`default`, high importance).
3. Obtain the native device token with `Notifications.getDevicePushTokenAsync()`.
4. Register it with the backend: `POST /notifications/devices` with `{ token, platform, appVersion }`.
5. Refresh registration when the token changes or the app version changes.
6. On logout, call `DELETE /notifications/devices/:token`.

Use native FCM/APNs tokens because the backend already uses Firebase Admin. Do not send Expo push tokens to the Firebase service.

### 14.2 Backend gap

The current backend has a Firebase service but no device-token model or registration endpoints. Add:

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/notifications/devices` | Upsert token for the current user |
| DELETE | `/notifications/devices/:token` | Remove token |
| POST | `/notifications/test` | Dev/staging only |

Suggested table:

```
DeviceToken
  id, userId, token (unique), platform, appVersion, lastSeenAt, createdAt
```

### 14.3 Handling

- Foreground: show an in-app banner and invalidate notifications; do not show a duplicate OS alert unless the user setting allows it.
- Background/terminated: OS displays the notification; tapping deep-links via `resolveNotificationRoute`.
- Notification types map to routes: `job`, `offer`, `chat`, `wallet`, `verification`, `review`.
- Do not include sensitive data in the push payload; use IDs and fetch the details after authentication.

---

## 15. Location and Tracking

- Request foreground location permission only when the worker goes on duty or starts a visit.
- Send updates with `POST /location/track` while the job is in an active visit state.
- Use `accuracy: Balanced`, `distanceInterval: 50`, and a minimum time interval of 30–60 seconds.
- Stop updates when the visit completes, the app is backgrounded, or the worker goes off duty.
- Customer tracking uses `GET /location/track/:jobId` and socket-driven refreshes; poll as a fallback.
- Background location is out of scope for v1; it requires additional permissions and store justification.
- Show a clear indicator when sharing is active.

---

## 16. Offline, Errors, and State Transitions

### 16.1 Offline behavior

- Read-only screens: serve cached query data and show an offline banner.
- Job creation and uploads: block submission without a connection; retain the draft locally.
- Chat: optimistic send with a `sending` state; retry on reconnect with the same client-generated id if supported.
- Payments and withdrawals: never queue silently; require an online confirmation.
- On reconnect: refetch active queries and flush only safe queued actions.

### 16.2 State transitions

The backend state machine is authoritative. The app:

- Disables actions that are invalid for the current job status.
- Treats `409 Conflict` as a stale-state signal: refetch the job and show a message.
- Never assumes an optimistic status change is final.
- Uses a single `canTransition(job, action)` helper shared by customer and worker screens.

### 16.3 Error boundaries

- A root error boundary catches render crashes and offers a restart.
- Feature-level boundaries prevent one broken tab from taking down the app.
- Network errors use retry affordances, not crash screens.
- Log unexpected errors to Sentry with `userId` and screen context, never tokens or message bodies.

---

## 17. Internationalization, RTL, and UI System

- `i18next` + `react-i18next` with `en` and `ur` resource files.
- Persist the language choice; default to the device locale when supported.
- Urdu enables RTL. Use logical styles (`marginStart`, `paddingEnd`, `start`/`end`) and test mirrored layouts.
- Reload the app after changing RTL direction; React Native requires a restart for full mirroring.
- Theme tokens: colors, spacing, radii, typography, shadows. No hard-coded hex values in screens.
- Shared components: `Screen`, `AppText`, `Button`, `TextField`, `Card`, `Badge`, `EmptyState`, `ErrorState`, `Skeleton`, `Avatar`, `Sheet`, `List`.
- Accessibility: minimum 44×44 touch targets, labels on icons, dynamic type support, and screen-reader order.

---

## 18. Security

- Tokens only in SecureStore; never in AsyncStorage, logs, or crash reports.
- No backend secrets in the app bundle.
- TLS only; no cleartext traffic.
- Validate deep-link parameters and never trust a role from a link.
- Clear cached user data on logout and on account switch.
- Redact phone numbers, emails, and message contents in logs.
- Rate-limit OTP requests on the client with a visible cooldown.
- Consider certificate pinning for production if the backend domain is stable.
- Keep the app version and OS in request headers for support diagnostics.

---

## 19. Testing

| Level | Tool | Scope |
| --- | --- | --- |
| Unit | Jest | Pure functions, mappers, validators, state machine helpers |
| Hooks | Jest + React Native Testing Library | Query hooks, session refresh, guards |
| Component | RNTL | Forms, lists, empty/error/loading states, RTL |
| API mocks | MSW or a fetch mock | Deterministic responses and error cases |
| E2E | Maestro | Login, create job, accept offer, chat, withdraw, push tap |
| Contract | Staging API | Auth refresh, pagination, error shapes |

Required E2E flows before release:

1. Customer sign-in → create job with photos → see offers → accept.
2. Worker sign-in → verification gate → job feed → send offer.
3. Chat send/receive and unread count.
4. Wallet balance → withdraw request.
5. Push notification tap → correct job screen.
6. Offline launch → cached data + retry.

---

## 20. Observability

- Sentry for crashes, handled errors, and performance traces.
- Structured logger with levels; no secrets or PII.
- Analytics events: sign-in, job_created, offer_sent, offer_accepted, job_completed, payment_started, payment_completed, withdrawal_requested, chat_message_sent, notification_opened.
- Track API latency by endpoint and network type.
- Release health: crash-free sessions, cold start time, screen load time.

---

## 21. Build, Environment, and Release

`app.config.ts` defines the app identity and runtime config. `eas.json` defines profiles:

| Profile | Use | Distribution |
| --- | --- | --- |
| `development` | Dev client, local API | Internal |
| `preview` | QA/staging build | Internal (APK/TestFlight) |
| `production` | Store build | App Store / Play |

Each profile sets its own `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL`, and Sentry environment.

CI pipeline:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --ci`
5. `eas build --profile preview --platform all --non-interactive`
6. Optional: Maestro smoke suite against the preview build.

Versioning: `version` for marketing version, `buildNumber`/`versionCode` auto-incremented by EAS. Tag store releases in git.

---

## 22. Backend Changes Required for Mobile

1. **Push device tokens:** add `DeviceToken` storage and registration endpoints; wire `FirebaseService` to tokens per user.
2. **Lightweight lists:** exclude base64 `images` from job list responses (already implemented; redeploy Railway).
3. **Mobile bootstrap (optional):** one endpoint returning `me`, categories, unread counts, and feature flags to reduce cold-start requests.
4. **Upload compatibility:** confirm the multipart presets accept React Native `FormData` file objects and document size limits.
5. **Socket auth refresh:** verify the server accepts a refreshed token on reconnect and closes stale connections.
6. **Brevo/IP allowlist:** production email OTP must work from Railway egress.
7. **Pagination contract:** confirm page/cursor semantics for jobs, offers, chat, wallet ledger, and notifications.

---

## 23. Implementation Order

1. Core skeleton: config, http, session, query client, navigation guards.
2. Auth: customer and worker sign-in, OTP, refresh, logout, role routing.
3. Customer read paths: jobs, job detail, categories, offers.
4. Customer write paths: create job, photo upload, accept offer.
5. Worker: verification gate, feed, offers, active jobs, status updates.
6. Chat and realtime invalidation.
7. Wallet, payments, withdrawals, reviews.
8. Push notifications end-to-end (after the backend device-token work).
9. Location tracking.
10. Hardening: offline, performance, RTL, accessibility, store assets.

---

## 24. Open Questions

- Is the mobile app a new folder in this monorepo (`hunar-mobile/`) or a separate repository?
- Which maps provider is licensed for production: Mapbox or native maps?
- Which payment flow is allowed by the stores for physical home services?
- Do workers need background location in a later release, or is foreground tracking sufficient?
- Should the app support guest browsing before sign-in?
- Which push provider owns the production project: Firebase (FCM/APNs) or Expo Push Service? The backend currently points to Firebase.
