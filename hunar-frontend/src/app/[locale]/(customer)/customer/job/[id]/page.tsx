import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CustomerJobDetailsView } from "@/features/customer-jobs/components/customer-job-details-view";
import { getJobDetail } from "@/features/customer-jobs/api/customer-jobs-api";

export default async function CustomerJobSingularDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const job = await getJobDetail(id);

  if (!job) {
    notFound();
  }

  return <CustomerJobDetailsView initialJob={job} />;
}
