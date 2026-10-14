"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { ApiError } from "@/lib/api-client";
import { LogIn } from "lucide-react";

export default function CustomerVisitsPage() {
  const router = useRouter();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["customer", "visits"],
    queryFn: getCustomerVisits,
    staleTime: 30_000,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return false;
      }
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (isPending || isError) return;
    if (data && data.length > 0 && data[0].jobId) {
      router.replace(`/customer/job/${data[0].jobId}/tracking`);
    } else {
      router.replace("/customer/jobs");
    }
  }, [data, isPending, isError, router]);

  if (isError) {
    const isAuthError =
      error instanceof ApiError && (error.status === 401 || error.status === 403);

    if (isAuthError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-6 py-14 text-center"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn aria-hidden="true" className="size-7" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-navy">
              You&apos;re not logged in
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Please log in as a customer to view your bookings.
            </p>
          </div>
          <Link
            href="/customer/login"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <LogIn className="size-4" />
            Log in as Customer
          </Link>
        </div>
      );
    }

    return (
      <ErrorState
        title="Unable to load your bookings"
        description="Something went wrong. Please check your network connection and try again."
      />
    );
  }

  return <LoadingState label="Redirecting to your active visit tracking..." />;
}
