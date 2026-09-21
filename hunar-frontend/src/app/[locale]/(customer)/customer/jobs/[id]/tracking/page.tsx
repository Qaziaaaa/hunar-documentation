import { setRequestLocale } from "next-intl/server";
import { CustomerVisitsView } from "@/features/customer-visits/components/customer-visits-view";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";

export async function generateMetadata() {
  return {
    title: "Live Technician Arrival Tracker — Orderworker",
    description: "Real-time GPS tracking and doorstep OTP PIN verification for your booked service.",
  };
}

export default async function JobTrackingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const visits = await getCustomerVisits();

  return <CustomerVisitsView initialVisits={visits} />;
}
