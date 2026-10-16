"use client";

import React, { use, useEffect, useState } from "react";
import { useWorkerJobs } from "@/stores/worker-jobs-store";
import { WorkerJourneyFullscreen } from "@/features/jobs/components/worker-journey-fullscreen";
import { getWorkerJob } from "@/services/worker/jobs.service";
import { mapJobToRequest } from "@/stores/worker-jobs-adapter";
import type { JobRequest } from "@/types/job";
import type { VisitOffer } from "@/types/offer";

export default function WorkerJobDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; jobId: string }>;
}) {
  const resolvedParams = use(params);
  const { jobs, offers, hydrated, status } = useWorkerJobs();
  const [directJob, setDirectJob] = useState<JobRequest | null>(null);
  const [directOffer, setDirectOffer] = useState<VisitOffer | undefined>(undefined);
  const [isLoadingDirect, setIsLoadingDirect] = useState(false);
  const [directFetchAttempted, setDirectFetchAttempted] = useState(false);

  const storeJob = jobs.find((j) => j.id === resolvedParams.jobId);
  const job = storeJob ?? directJob;

  useEffect(() => {
    // If not found in the store and hasn't attempted direct fetch yet, fetch directly from backend API
    if (!storeJob && !directJob && !isLoadingDirect && !directFetchAttempted) {
      setIsLoadingDirect(true);
      getWorkerJob(resolvedParams.jobId)
        .then((backendJob: any) => {
          if (backendJob) {
            setDirectJob(mapJobToRequest(backendJob));
            if (backendJob.myOffer) {
              setDirectOffer(backendJob.myOffer);
            } else if (Array.isArray(backendJob.offers) && backendJob.offers.length > 0) {
              setDirectOffer(backendJob.offers[0]);
            }
          }
        })
        .catch(() => {
          // Job doesn't exist or unauthorized
        })
        .finally(() => {
          setIsLoadingDirect(false);
          setDirectFetchAttempted(true);
        });
    }
  }, [storeJob, directJob, isLoadingDirect, directFetchAttempted, resolvedParams.jobId]);

  // While either store is hydrating or direct fetch is pending, show loading state instead of instant 404
  if (!job && (!hydrated || isLoadingDirect || (!directFetchAttempted && status === "loading"))) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="size-10 rounded-full border-3 border-teal-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 w-full max-w-3xl sm:max-w-4xl mx-auto my-8">
        <h2 className="font-bold text-slate-900 text-lg">Job Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          The requested job ({resolvedParams.jobId}) may have been closed, completed, or removed by the customer.
        </p>
      </div>
    );
  }

  const workerOffer = (storeJob ? offers[job.id] : undefined) ?? directOffer;

  return <WorkerJourneyFullscreen job={job} offer={workerOffer} />;
}
