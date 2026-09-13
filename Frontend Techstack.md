# Frontend Technology Stack — HUNAR / Fixora

## 1. Overview & Vision
This document outlines the complete, production-grade **Frontend Technology Stack** for **HUNAR (Fixora)** — a local home-services marketplace connecting customers with verified skilled workers (electricians, plumbers, carpenters, AC technicians, etc.) with real-time bidding, GPS tracking, and two-stage negotiation.

The frontend is designed for high performance, mobile-first responsiveness, offline resilience, and bilingual support (Urdu & English with RTL).

---

## 2. Core Foundation

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js (App Router)** | `14.x / 15.x` | Hybrid SSR/SSG for fast SEO landing pages and dynamic client hubs for Customer, Worker, and Admin. |
| **Language** | **TypeScript** | `5.x (Strict)` | Type safety across job models, state machines, and API contracts. |
| **Styling** | **Tailwind CSS** | `v3.4+` | Utility-first CSS configured with the custom *Trust & Warmth* design tokens. |
| **UI Components** | **shadcn/ui** (Radix UI) | Latest | Accessible, customizable headless components with full code ownership. |

---

## 3. Libraries by Domain

### 3.1 UI, Layout & Micro-Interactions
- **`shadcn/ui` + `@radix-ui/react-*`**: Headless primitives for modals, dropdowns, tooltips, dialogs, and popovers.
- **`lucide-react`**: Consistent vector icons for navigation, trade categories, and action buttons.
- **`vaul`**: Mobile-native drawer / bottom-sheet for worker quote selection, filters, and counter-bidding.
- **`framer-motion`**: Smooth page transitions, collapsible price breakdowns, and interactive step wizards.
- **`sonner`**: Toast notification stack for real-time alerts (incoming bids, job acceptances).
- **`clsx` & `tailwind-merge`**: Conditional class merging utilities (`cn()` helper).

### 3.2 State Management & Data Fetching
- **`@tanstack/react-query` (v5)**:
  - Caching and synchronizing server state.
  - Background refetching, pagination, and infinite scrolling on job feeds.
  - **Optimistic UI updates** for instant chat messaging and counter-offer submission.
- **`zustand`**:
  - Lightweight global state store for client-only state (auth session, active filters, draft multi-step job wizard).

### 3.3 Forms & Schema Validation
- **`react-hook-form`**: High-performance, uncontrolled form management for multi-step wizards.
- **`zod` + `@hookform/resolvers`**: Strict TypeScript-first validation schemas shared across client forms and API DTOs.

### 3.4 Real-Time & WebSockets
- **`socket.io-client`**:
  - Direct connection to backend WebSocket gateway.
  - Handles live events: `job:created`, `job:offer`, `job:offer:accepted`, `chat:message`, and live location pings.
- **`firebase` (FCM Web SDK)**: Web push notifications for background alerts when the app is inactive.

### 3.5 Maps, Geolocation & Live Tracking
- **`mapbox-gl` + `react-map-gl`** *(or `@vis.gl/react-google-maps`)*:
  - Interactive map view for address selection and pin placement.
  - Service radius visualization.
  - Real-time worker arrival tracker and GPS route plotting.

### 3.6 Media, Audio & File Handling
- **`browser-image-compression`**: Client-side image compression prior to S3 direct upload to conserve user mobile bandwidth.
- **`wavesurfer.js`**: Audio waveform recorder and player for Urdu voice notes in customer-worker chat.

### 3.7 Localization (Urdu & English)
- **`next-intl`**:
  - Route-based bilingual support (`/en/...` and `/ur/...`).
  - Automatic `dir="rtl"` / `dir="ltr"` layout adaptation.

### 3.8 Mobile PWA & Offline Support
- **`@ducanh2912/next-pwa`**:
  - Service worker caching for fast offline shell loading.
  - App-like install prompt ("Add to Home Screen").

---

## 4. Quick Installation Commands

Run the following commands in your frontend project directory:

```bash
# Core UI, Icons & Animations
npm install clsx tailwind-merge lucide-react framer-motion vaul sonner

# State Management, API & WebSockets
npm install @tanstack/react-query zustand axios socket.io-client

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Localization & Date Helpers
npm install next-intl date-fns

# Media, Audio & Maps
npm install browser-image-compression wavesurfer.js mapbox-gl react-map-gl

# PWA Support
npm install @ducanh2912/next-pwa
```

---

## 5. Design Tokens Configuration (`tailwind.config.ts`)

Configure the project's **"Trust & Warmth"** theme tokens:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep Teal (Trust & Professionalism)
        primary: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          500: "#0D9488",
          600: "#0B7F74",
          700: "#096B62",
          DEFAULT: "#0D9488",
          foreground: "#FFFFFF",
        },
        // Warm Amber (Call-to-Actions & Vitality)
        accent: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          DEFAULT: "#F59E0B",
          foreground: "#1A1A2E",
        },
        // Warm Neutral Surfaces
        surface: {
          warm: "#F5F0EB",
          light: "#FAF8F5",
          card: "#FFFFFF",
        },
        // Neutrals & Text
        neutral: {
          900: "#1A1A2E", // Primary text
          800: "#2D2D44", // Headings
          700: "#4A4A68", // Secondary text
          500: "#6B7280", // Placeholders / Muted
          200: "#E5E7EB", // Dividers / Borders
          50: "#FAFAFA",  // Page background
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 6. Recommended Folder Architecture

```text
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Bilingual route group (en / ur)
│   │   ├── (auth)/               # Login, Register, OTP Verify
│   │   ├── (customer)/           # Customer Hub (post-job, tracking, escrow)
│   │   ├── (worker)/             # Worker Hub (job-feed, bids, visits, wallet)
│   │   ├── (admin)/              # Admin Hub (verification, disputes, audits)
│   │   ├── services/             # Public SEO landing pages
│   │   ├── layout.tsx
│   │   └── page.tsx
├── components/
│   ├── ui/                       # shadcn/ui components (button, modal, sheet, input)
│   └── shared/                   # Header, BottomNav, LanguageSwitcher, RoleGuard
├── features/                     # Domain modules
│   ├── auth/                     # OTP form, login card, auth hooks
│   ├── jobs/                     # MultiStepJobWizard, JobCard, JobFilters
│   ├── negotiation/              # VisitOfferCard, RepairEstimateModal
│   ├── tracking/                 # LiveMapTracker, ArrivalETA
│   ├── chat/                     # ChatBox, VoiceNotePlayer, VoiceRecorder
│   ├── payments/                 # EscrowStatus, WalletCard, TransactionLedger
│   └── admin/                    # VerificationQueue, DisputeCases
├── hooks/                        # Custom hooks (useSocket, useGeolocation, useFCM)
├── lib/
│   ├── api-client.ts             # Axios client with JWT interceptor
│   ├── socket.ts                 # Socket.IO connection singleton
│   └── utils.ts                  # cn() class merge helper, PKR formatters
├── stores/                       # Zustand stores (authStore, uiStore, filterStore)
└── types/                        # TypeScript types and DTO interfaces
```
