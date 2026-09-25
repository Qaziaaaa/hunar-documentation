"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CustomerVisitsView } from "@/features/customer-visits/components/customer-visits-view";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";

export default function SingularJobTrackingPage() {
  const { id } = useParams<{ id: string }>();

  const { data: visits, isPending, isError, refetch } = useQuery({
    queryKey: ["customer", "visits"],
    queryFn: getCustomerVisits,
    staleTime: 30_000,
  });

  if (isPending) {
    return <LoadingState label="Loading live visit tracking..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load visit tracking"
        description="Please check your network connection and try again."
        onRetry={() => void refetch()}
      />
    );
  }

  const visitsForJob =
    id && visits ? visits.filter((v) => v.jobId === id || v.id === id) : visits ?? [];

  return <CustomerVisitsView initialVisits={visitsForJob.length > 0 ? visitsForJob : (visits ?? [])} />;
}