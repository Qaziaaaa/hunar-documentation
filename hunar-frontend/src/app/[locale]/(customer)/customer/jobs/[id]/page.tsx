"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CustomerJobDetailsView } from "@/features/customer-jobs/components/customer-job-details-view";
import { getJobDetail } from "@/features/customer-jobs/api/customer-jobs-api";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";

export default function CustomerJobDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: job, isPending, isError, refetch } = useQuery({
    queryKey: ["customer", "job", id],
    queryFn: () => getJobDetail(id),
    staleTime: 30_000,
  });

  if (isPending) {
    return <LoadingState label="Loading job details..." />;
  }

  if (isError || !job) {
    return (
      <ErrorState
        title="Unable to load this job"
        description="Please check your network connection and try again."
        onRetry={() => void refetch()}
      />
    );
  }

  return <CustomerJobDetailsView initialJob={job} />;
}