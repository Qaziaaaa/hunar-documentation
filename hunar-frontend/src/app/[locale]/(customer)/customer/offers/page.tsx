import { setRequestLocale } from "next-intl/server";
import { CustomerOffersHubView } from "@/features/customer-jobs/components/customer-offers-hub-view";
import { MOCK_CUSTOMER_JOBS } from "@/features/customer-jobs/data/mock-customer-jobs";

export default async function CustomerOffersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CustomerOffersHubView initialJobs={MOCK_CUSTOMER_JOBS} />;
}
