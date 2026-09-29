import { setRequestLocale } from "next-intl/server";
import { WizardShell } from "@/features/worker-onboarding/components/wizard-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title:
      locale === "ur"
        ? "ورکر پروفائل سیٹ اپ — WorkerFIX"
        : "Worker Profile Setup — WorkerFIX",
  };
}

export default async function WorkerProfileSetupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WizardShell />;
}
