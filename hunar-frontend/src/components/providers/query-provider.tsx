"use client";

import { QueryClient, QueryClientProvider, type Query } from "@tanstack/react-query";
import { useState } from "react";

// Per-domain freshness. Every refetch costs a ~600 ms backend round trip
// (Neon us-east-2 from Asia/Karachi), so static domains should not refetch on
// every mount. Live-ish domains stay short so status changes stay visible.
function staleTimeFor(query: Query): number {
  const key = query.queryKey as readonly unknown[];
  const domain = typeof key[0] === "string" ? key[0] : "";
  const sub = typeof key[1] === "string" ? key[1] : "";

  // Near-live: badges should not lag behind pushes
  if (domain === "notifications" || (domain === "worker" && sub === "notifications")) {
    return 15_000;
  }
  // Admin: dashboard sections poll on their own cadences — keep staleTime at
  // or below those intervals so a remount never serves older data than the
  // next tick would. Lists stay short so navigation back is fresh.
  if (domain === "admin") {
    if (sub === "overview") return 15_000;
    if (sub === "jobs") return 20_000;
    if (sub === "activity" || sub === "transactions") return 60_000;
    return 30_000;
  }
  // Transactional but chatty: chats, money, job status
  if (sub === "chat" || sub === "wallet") return 30_000;
  if (domain === "customer" && (sub === "jobs" || sub === "job")) return 30_000;
  if (domain === "worker" && sub === "session") return 30_000;
  // Live feeds that can change status, still not hot
  if (domain === "worker" && sub === "jobs") return 60_000;
  if (domain === "customer" && sub === "visits") return 60_000;
  // Profile/settings/reviews/repairs/negotiation/help and anything unknown:
  // treat as static within a visit
  if (domain === "worker" || domain === "customer" || domain === "auth") {
    return 5 * 60_000;
  }
  return 60_000;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: staleTimeFor,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (error && typeof error === "object" && "status" in error) {
                const status = (error as { status?: number }).status;
                if (status === 401 || status === 403 || status === 404) {
                  return false;
                }
              }
              return failureCount < 1;
            },
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
