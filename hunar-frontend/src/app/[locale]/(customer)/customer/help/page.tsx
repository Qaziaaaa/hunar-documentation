import { setRequestLocale } from "next-intl/server";
import { CustomerHelpView } from "@/features/customer-help/components/customer-help-view";

export async function generateMetadata() {
  return {
    title: "Customer Help Center & FAQ Hub — WorkerFIX",
    description:
      "Interactive FAQs on pricing, safety PINs, and booking changes. Direct ticket creation and 24/7 customer helpline.",
  };
}

export default async function CustomerHelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CustomerHelpView />;
}
