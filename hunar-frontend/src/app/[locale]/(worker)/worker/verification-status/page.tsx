import { setRequestLocale } from "next-intl/server";
import { VerificationShell } from "@/features/worker-verification/components/verification-shell";

export async function generateMetadata() {
  return {
    title: "Verification Status | HUNAR Worker Portal",
    description:
      "Check the admin verification status of your HUNAR tradesperson profile and Smart CNIC documents.",
  };
}

export default async function WorkerVerificationStatusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <VerificationShell />;
}
