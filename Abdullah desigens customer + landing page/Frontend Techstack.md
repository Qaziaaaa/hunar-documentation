HUNAR — Final Frontend Stack
1. Core
| Category      | Technology               | Purpose                             |
| ------------- | ------------------------ | ----------------------------------- |
| Framework     | **Next.js (App Router)** | Main frontend framework + SEO + SSR |
| Language      | **TypeScript**           | Type safety                         |
| Styling       | **Tailwind CSS**         | UI styling                          |
| UI Components | **shadcn/ui + Radix UI** | Accessible reusable components      |

2. Frontend Libraries
| Category            | Library                       | Purpose                           |
| ------------------- | ----------------------------- | --------------------------------- |
| Icons               | **lucide-react**              | Icons                             |
| Mobile drawers      | **Vaul**                      | Mobile bottom sheets              |
| Animations          | **Motion**                    | Transitions & interactions        |
| Toasts              | **Sonner**                    | Success/error notifications       |
| Server State        | **TanStack Query**            | API fetching, caching, mutations  |
| Client State        | **Zustand**                   | Filters, drafts, UI state         |
| Forms               | **React Hook Form**           | Complex forms                     |
| Validation          | **Zod**                       | Form/data validation              |
| Real-time           | **Socket.IO Client**          | Chat, notifications, live updates |
| Maps                | **Mapbox + react-map-gl**     | Location, worker markers, routes  |
| Image Compression   | **browser-image-compression** | Compress mobile images            |
| Audio Recording     | **MediaRecorder API**         | Voice messages                    |
| Audio Visualization | **WaveSurfer.js**             | Voice/audio waveform              |
| Localization        | **next-intl**                 | English + Urdu / RTL              |
| Date/Time           | **date-fns**                  | Dates, timestamps, ETAs           |
| Error Monitoring    | **Sentry**                    | Production error tracking         |

3. Testing
| Tool           | Purpose              |
| -------------- | -------------------- |
| **Vitest**     | Unit/component tests |
| **Playwright** | End-to-end testing   |

🧩 Final Architecture

                    HUNAR FRONTEND
                          │
                    Next.js + TypeScript
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    Tailwind          shadcn/ui          Radix UI
        │
        ├── TanStack Query → API / Server State
        ├── Zustand → Client State
        ├── React Hook Form → Forms
        ├── Zod → Validation
        ├── Socket.IO → Real-time
        ├── Mapbox → Maps & Location
        ├── MediaRecorder → Voice Recording
        ├── WaveSurfer → Audio Visualization
        ├── next-intl → English / Urdu
        ├── Sonner → Toasts
        ├── Motion → Animations
        └── Sentry → Error Monitoring