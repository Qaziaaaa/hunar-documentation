"use client";

import { useQuery } from "@tanstack/react-query";
import { CustomerOffersHubView } from "@/features/customer-jobs/components/customer-offers-hub-view";
import { getCustomerJobs } from "@/features/customer-jobs/api/customer-jobs-api";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";

export default function CustomerOffersPage() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["customer", "jobs"],
    queryFn: getCustomerJobs,
    staleTime: 30_000,
  });

  if (isPending) {
    return <LoadingState label="Loading offers..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load offers"
        description="Please check your network connection and try again."
        onRetry={() => void refetch()}
      />
    );
  }

  return <CustomerOffersHubView initialJobs={data ?? []} />;
}