"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/loading-state";
import { getWorkerSession } from "@/services/worker/session.service";
import type { WorkerSession } from "@/types/worker";

export function WorkerAuthGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Worker.auth");
  const [session, setSession] = useState<WorkerSession | null>(null);

  useEffect(() => {
    setSession(getWorkerSession());
  }, []);

  if (!session) {
    return <LoadingState label={t("checking")} />;
  }

  if (!session.isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-orange/10 text-orange">
            <ShieldAlert aria-hidden="true" className="size-6" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("signInRequired")}
          </p>
          <Button
            className="mt-6 bg-teal hover:bg-teal/85"
            render={<Link href="/login" />}
          >
            {t("signIn")}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
