import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { CustomerJobCompletionView } from "@/features/customer-jobs/components/customer-job-completion-view";
import { LoadingState } from "@/components/shared/loading-state";

export async function generateMetadata() {
  return {
    title: "Job Completion & Review — WorkerFIX",
    description:
      "Inspect completed work photos, review technician field reports, confirm direct payment, and activate your 5-Day Craftsmanship Warranty.",
  };
}

export default async function CustomerJobCompletionAliasPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<LoadingState label="Loading job..." />}>
      <CustomerJobCompletionView initialJobId={id} />
    </Suspense>
  );
}