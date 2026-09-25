"use client";

import { useQuery } from "@tanstack/react-query";
import { CustomerJobsListView } from "@/features/customer-jobs/components/customer-jobs-list-view";
import { getCustomerJobs } from "@/features/customer-jobs/api/customer-jobs-api";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";

export default function CustomerJobsPage() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["customer", "jobs"],
    queryFn: getCustomerJobs,
    staleTime: 30_000,
  });

  if (isPending) {
    return <LoadingState label="Loading your jobs..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load jobs"
        description="Please check your network connection and try again."
        onRetry={() => void refetch()}
      />
    );
  }

  return <CustomerJobsListView initialJobs={data ?? []} />;
}