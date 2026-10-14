"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { VerificationLeftShowcase } from "./verification-left-showcase";
import { ApprovedView } from "./approved-view";
import { RejectedView } from "./rejected-view";
import { RequestChangesView } from "./request-changes-view";
import { PendingView } from "./pending-view";
import { getVerificationStatus } from "../api/verification-api";
import type { VerificationOutcome, WorkerVerificationData } from "../types";

export function VerificationShell() {
  const t = useTranslations("WorkerVerification.Shell");
  const [data, setData] = useState<WorkerVerificationData | null>(null);
  const [currentStatus, setCurrentStatus] = useState<VerificationOutcome>("pending");

  const fetchStatus = useCallback(async () => {
    try {
      const result = await getVerificationStatus();
      setData(result);
      setCurrentStatus(result.status);
    } catch (err) {
      console.warn("[VerificationShell] Could not fetch real verification status:", err);
    }
  }, []);

  useEffect(() => {
    // Clear any previous mock/simulated statuses left in localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("workerfix.worker_verification_status");
      localStorage.removeItem("hunar_worker_verification_status");
    }
    fetchStatus();
  }, [fetchStatus]);

  // Real-time polling: if status is "pending", poll every 10s so when admin approves or rejects,
  // the page immediately flips to the real decision without manual reloads.
  useEffect(() => {
    if (currentStatus !== "pending") return;
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentStatus, fetchStatus]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="size-8 animate-spin rounded-full border-4 border-teal border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white text-navy flex flex-col antialiased">
      <main
        className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen w-full"
        data-purpose="worker-verification-page"
      >
        {/* Left Column: Full-Height Showcase */}
        <VerificationLeftShowcase />

        {/* Right Column: Real Verification Result Console */}
        <section
          className="flex flex-col bg-white px-4 py-4 sm:px-8 sm:py-8 lg:px-12 lg:py-10 lg:col-span-7 xl:col-span-7 lg:min-h-screen lg:justify-between"
          data-purpose="verification-result-container"
        >
          <div className="mx-auto flex w-full max-w-[500px] flex-col lg:h-full lg:justify-between lg:my-auto">
            <div>
              {/* Dynamic Real Status View Display */}
              <div className="pt-2 pb-2">
                {currentStatus === "approved" && <ApprovedView data={data} />}
                {currentStatus === "rejected" && <RejectedView data={data} />}
                {currentStatus === "request_changes" && (
                  <RequestChangesView data={data} />
                )}
                {currentStatus === "pending" && (
                  <PendingView data={data} onRefresh={fetchStatus} />
                )}
              </div>
            </div>

            {/* Bottom Support Note */}
            <div className="mt-3 border-t border-slate-100 pt-2.5 text-center">
              <p className="text-xs text-muted-foreground">
                {t("needAssistance")}{" "}
                <a
                  href="https://wa.me/923140837519"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-teal hover:underline inline-flex items-center gap-1"
                >
                  <span>{t("contactWhatsapp")}</span>
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

