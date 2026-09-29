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
        ? "ورکر رجسٹریشن اور پروفائل سیٹ اپ — WorkerFIX"
        : "Worker Onboarding & Profile Setup — WorkerFIX",
  };
}

export default async function WorkerOnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WizardShell />;
}
