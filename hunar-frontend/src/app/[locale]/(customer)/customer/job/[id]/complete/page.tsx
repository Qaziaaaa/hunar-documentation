import { setRequestLocale } from "next-intl/server";
import { CustomerJobCompletionView } from "@/features/customer-jobs/components/customer-job-completion-view";

export async function generateMetadata() {
  return {
    title: "Job Completion & Review — WorkerFIX",
    description:
      "Inspect completed work photos, review technician field reports, confirm direct payment, and activate your 5-Day Craftsmanship Warranty.",
  };
}

export default async function CustomerJobCompletionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <CustomerJobCompletionView initialJobId={id} />;
}