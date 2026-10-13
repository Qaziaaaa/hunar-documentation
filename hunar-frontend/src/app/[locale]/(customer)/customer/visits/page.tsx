"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";
import { LoadingState } from "@/components/shared/loading-state";

export default function CustomerVisitsPage() {
  const router = useRouter();
  const { data, isPending } = useQuery({
    queryKey: ["customer", "visits"],
    queryFn: getCustomerVisits,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (isPending) return;
    if (data && data.length > 0 && data[0].jobId) {
      router.replace(`/customer/job/${data[0].jobId}/tracking`);
    } else {
      router.replace("/customer/jobs");
    }
  }, [data, isPending, router]);

  return <LoadingState label="Redirecting to your active visit tracking..." />;
}
