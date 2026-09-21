import { setRequestLocale } from "next-intl/server";
import { CustomerVisitsView } from "@/features/customer-visits/components/customer-visits-view";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";

export async function generateMetadata() {
  return {
    title: "Scheduled Visits & Live Tracker — HUNAR",
    description: "Track technician live dispatch in real-time, view verified doorstep safety PINs, and manage your visits across Peshawar.",
  };
}

export default async function CustomerVisitsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const visits = await getCustomerVisits();

  return <CustomerVisitsView initialVisits={visits} />;
}
