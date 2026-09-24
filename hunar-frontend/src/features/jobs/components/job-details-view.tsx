"use client";

import React from "react";
import { JobRequest } from "@/types/job";
import { VisitOffer } from "@/types/offer";
import { WorkerJourneyFullscreen } from "./worker-journey-fullscreen";

interface JobDetailsViewProps {
  job: JobRequest;
  workerOffer?: VisitOffer;
}

export function JobDetailsView({ job, workerOffer }: JobDetailsViewProps) {
  return <WorkerJourneyFullscreen job={job} offer={workerOffer} />;
}
