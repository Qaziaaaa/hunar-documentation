"use client";

import { useParams } from "next/navigation";
import { CustomerJobTrackingView } from "@/features/customer-visits/components/customer-job-tracking-view";
import { ErrorState } from "@/components/shared/error-state";

export default function PluralJobTrackingPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <ErrorState
        title="Invalid Job Reference"
        description="No job reference code was provided in the URL."
      />
    );
  }

  return <CustomerJobTrackingView jobId={id} />;
}