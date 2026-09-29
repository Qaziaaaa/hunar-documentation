import { setRequestLocale } from "next-intl/server";
import { WorkerDashboardShell } from "@/features/worker-dashboard";

export async function generateMetadata() {
  return {
    title: "Worker Pro Dashboard — WorkerFIX",
    description:
      "Manage nearby home service jobs, track active visits, view 10% commission status, and chat with customers across Peshawar.",
  };
}

export default async function WorkerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WorkerDashboardShell />;
}

