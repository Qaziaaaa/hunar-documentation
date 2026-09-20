import { setRequestLocale } from "next-intl/server";
import { CustomerVisitsView } from "@/features/customer-visits/components/customer-visits-view";
import { MOCK_SCHEDULED_VISITS } from "@/features/customer-visits/data/mock-customer-visits";

export async function generateMetadata() {
  return {
    title: "Live Technician Arrival Tracker — HUNAR",
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

  return <CustomerVisitsView initialVisits={MOCK_SCHEDULED_VISITS} />;
}
