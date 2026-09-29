"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { getAccessToken, getStoredUser } from "@/lib/api-client";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean>(false);

  useEffect(() => {
    // Check admin authentication state via the shared token storage
    const token = getAccessToken();
    const user = getStoredUser();

    if (!token || user?.role !== "ADMIN") {
      router.push("/admin/sign-in");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-teal" />
          <p className="text-sm font-semibold text-navy">Verifying Admin Permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
