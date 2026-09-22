import { getTranslations, setRequestLocale } from "next-intl/server";
import { VerificationShell } from "@/features/worker-verification/components/verification-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "WorkerVerification.Metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function WorkerVerificationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <VerificationShell />;
}

