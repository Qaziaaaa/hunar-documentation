import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CustomerJobDetailsView } from "@/features/customer-jobs/components/customer-job-details-view";
import { MOCK_CUSTOMER_JOBS } from "@/features/customer-jobs/data/mock-customer-jobs";

export default async function CustomerJobDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Find job by ID or fallback to the first active mock job
  const job =
    MOCK_CUSTOMER_JOBS.find((j) => j.id.toLowerCase() === id.toLowerCase()) ||
    MOCK_CUSTOMER_JOBS[0];

  if (!job) {
    notFound();
  }

  return <CustomerJobDetailsView initialJob={job} />;
}
