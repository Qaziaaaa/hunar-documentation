import { setRequestLocale } from "next-intl/server";
import { CustomerVisitsView } from "@/features/customer-visits/components/customer-visits-view";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";

export default async function SingularJobTrackingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const visits = await getCustomerVisits();

  return <CustomerVisitsView initialVisits={visits} />;
}
