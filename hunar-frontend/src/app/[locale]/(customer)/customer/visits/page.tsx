"use client";

import { useQuery } from "@tanstack/react-query";
import { CustomerVisitsView } from "@/features/customer-visits/components/customer-visits-view";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";

export default function CustomerVisitsPage() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["customer", "visits"],
    queryFn: getCustomerVisits,
    staleTime: 30_000,
  });

  if (isPending) {
    return <LoadingState label="Loading your visits..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load visits"
        description="Please check your network connection and try again."
        onRetry={() => void refetch()}
      />
    );
  }

  return <CustomerVisitsView initialVisits={data ?? []} />;
}
