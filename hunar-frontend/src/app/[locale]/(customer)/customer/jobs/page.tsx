import { setRequestLocale } from "next-intl/server";
import { CustomerJobsListView } from "@/features/customer-jobs/components/customer-jobs-list-view";
import { MOCK_CUSTOMER_JOBS } from "@/features/customer-jobs/data/mock-customer-jobs";

export default async function CustomerJobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CustomerJobsListView initialJobs={MOCK_CUSTOMER_JOBS} />;
}
