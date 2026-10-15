"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getAccessToken, getRefreshToken } from "@/lib/api-client";

/**
 * Shared shell for every /admin route. Keeping AdminShell here (not per-page)
 * lets the sidebar active pill animate from the previous item across navigations.
 *
 * Admin APIs are authenticated, so an unauthenticated visit renders nothing and
 * bounces to sign-in — otherwise every page would mount and fire a storm of 401
 * fetches before a client-side redirect could run. (Sign-in lives in (auth),
 * outside this layout, so no redirect loop.)
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (getAccessToken("ADMIN") || getRefreshToken("ADMIN")) {
      setSessionReady(true);
    } else {
      router.replace("/admin/sign-in");
    }
  }, [router]);

  if (!sessionReady) return null;
  return <AdminShell>{children}</AdminShell>;
}
