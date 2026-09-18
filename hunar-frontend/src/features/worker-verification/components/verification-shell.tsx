"use client";

import { useEffect, useState } from "react";
import { VerificationLeftShowcase } from "./verification-left-showcase";
import { StatusTesterBar } from "./status-tester-bar";
import { ApprovedView } from "./approved-view";
import { RejectedView } from "./rejected-view";
import { RequestChangesView } from "./request-changes-view";
import { PendingView } from "./pending-view";
import {
  getVerificationStatus,
  setSimulatedVerificationStatus,
} from "../api/verification-api";
import type { VerificationOutcome, WorkerVerificationData } from "../types";

export function VerificationShell() {
  const [data, setData] = useState<WorkerVerificationData | null>(null);
  const [currentStatus, setCurrentStatus] =
    useState<VerificationOutcome>("pending");

  useEffect(() => {
    getVerificationStatus().then((result) => {
      setData(result);
      setCurrentStatus(result.status);
    });
  }, []);

  const handleSelectStatus = (status: VerificationOutcome) => {
    const updated = setSimulatedVerificationStatus(status);
    setData(updated);
    setCurrentStatus(status);
  };

  const handleRefresh = () => {
    getVerificationStatus().then((result) => {
      setData(result);
      setCurrentStatus(result.status);
    });
  };

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

        {/* Right Column: Interactive Verification Result Console */}
        <section
          className="flex flex-col bg-white px-4 py-4 sm:px-8 sm:py-8 lg:px-12 lg:py-10 lg:col-span-7 xl:col-span-7 lg:min-h-screen lg:justify-between"
          data-purpose="verification-result-container"
        >
          <div className="mx-auto flex w-full max-w-[500px] flex-col lg:h-full lg:justify-between lg:my-auto">
            <div>
              {/* Interactive Status Switcher */}
              <StatusTesterBar
                currentStatus={currentStatus}
                onSelectStatus={handleSelectStatus}
              />

              {/* Dynamic Status View Display */}
              <div className="pt-2 pb-2">
                {currentStatus === "approved" && <ApprovedView data={data} />}
                {currentStatus === "rejected" && <RejectedView data={data} />}
                {currentStatus === "request_changes" && (
                  <RequestChangesView data={data} />
                )}
                {currentStatus === "pending" && (
                  <PendingView data={data} onRefresh={handleRefresh} />
                )}
              </div>
            </div>

            {/* Bottom Support Note */}
            <div className="mt-3 border-t border-slate-100 pt-2.5 text-center">
              <p className="text-xs text-muted-foreground">
                Need assistance with verification?{" "}
                <a
                  href="https://wa.me/923140837519"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-teal hover:underline"
                >
                  Contact Compliance on WhatsApp →
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
