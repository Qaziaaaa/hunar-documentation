"use client";

import { useCallback, useEffect, useState } from "react";
import { Headphones, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
    let isMounted = true;
    // Clear any previous mock/simulated statuses left in localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("workerfix.worker_verification_status");
      localStorage.removeItem("hunar_worker_verification_status");
    }
    const init = async () => {
      try {
        const result = await getVerificationStatus();
        if (isMounted) {
          setData(result);
          setCurrentStatus(result.status);
        }
      } catch (err) {
        console.warn("[VerificationShell] Could not fetch real verification status:", err);
      }
    };
    void init();
    return () => {
      isMounted = false;
    };
  }, []);

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
          className="relative flex flex-col bg-white px-4 pt-3 pb-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 lg:col-span-7 xl:col-span-7 lg:min-h-screen"
          data-purpose="verification-result-container"
        >
          {/* Top Header Bar: Home/Sign-in on Left, Headphone Support on Right */}
          <div className="flex items-center justify-between w-full mb-2 sm:mb-4">
            <Link
              href="/worker/sign-in"
              className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-navy shadow-xs transition-all hover:border-teal/40 hover:bg-teal/5 hover:text-teal hover:shadow-sm active:scale-95"
              title={t("signIn")}
              aria-label={t("signIn")}
            >
              <Home className="size-5" />
            </Link>

            <a
              href="https://wa.me/923140837519"
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-navy shadow-xs transition-all hover:border-teal/40 hover:bg-teal/5 hover:text-teal hover:shadow-sm active:scale-95"
              title={t("help")}
              aria-label={t("help")}
            >
              <Headphones className="size-5" />
            </a>
          </div>

          <div className="mx-auto flex w-full max-w-[500px] flex-col lg:my-auto pt-1 sm:pt-4 pb-4">
            <div>
              {/* Dynamic Real Status View Display */}
              <div className="pt-1 pb-2">
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
          </div>
        </section>
      </main>
    </div>
  );
}

