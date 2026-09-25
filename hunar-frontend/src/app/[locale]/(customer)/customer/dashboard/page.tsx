import { setRequestLocale } from "next-intl/server";
import { CustomerDashboardView } from "@/features/customer-dashboard/components/customer-dashboard-view";

export async function generateMetadata() {
  return {
    title: "Customer Dashboard — WorkerFIX",
    description:
      "Manage your active service requests, bids from verified technicians, and scheduled visits.",
  };
}

export default async function CustomerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CustomerDashboardView />;
}
