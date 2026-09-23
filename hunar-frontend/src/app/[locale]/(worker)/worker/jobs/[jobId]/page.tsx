"use client";

import React, { use } from "react";
import { useWorkerJobs } from "@/stores/worker-jobs-store";
import { WorkerJourneyFullscreen } from "@/features/jobs/components/worker-journey-fullscreen";

export default function WorkerJobDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; jobId: string }>;
}) {
  const resolvedParams = use(params);
  const { jobs, offers } = useWorkerJobs();

  const job = jobs.find((j) => j.id === resolvedParams.jobId);
  if (!job) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 max-w-md mx-auto my-8">
        <h2 className="font-bold text-slate-900 text-lg">Job Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          The requested job may have been closed, completed, or removed by the customer.
        </p>
      </div>
    );
  }

  const workerOffer = offers[job.id];

  return <WorkerJourneyFullscreen job={job} offer={workerOffer} />;
}
