"use client";

import { useQuery } from "@tanstack/react-query";
import { CustomerJobsListView } from "@/features/customer-jobs/components/customer-jobs-list-view";
import { getCustomerJobs } from "@/features/customer-jobs/api/customer-jobs-api";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { ApiError } from "@/lib/api-client";
import { Link } from "@/i18n/navigation";
import { LogIn } from "lucide-react";

export default function CustomerJobsPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["customer", "jobs"],
    queryFn: () => getCustomerJobs({ page: 1, limit: 20 }),
    staleTime: 30_000,
    retry: (failureCount, err) => {
      // Don't retry on auth errors — the user simply isn't logged in
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return false;
      }
      return failureCount < 2;
    },
  });

  if (isPending) {
    return <LoadingState label="Loading your jobs..." />;
  }

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
              Please log in as a customer to view and manage your bookings.
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
        title="Unable to load your jobs"
        description="Something went wrong while fetching your jobs. Please check your network connection and try again."
        onRetry={() => void refetch()}
      />
    );
  }

  return <CustomerJobsListView initialJobs={data ?? []} />;
}