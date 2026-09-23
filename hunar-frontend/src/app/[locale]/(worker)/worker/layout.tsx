import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("workerTitle") };
}

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
