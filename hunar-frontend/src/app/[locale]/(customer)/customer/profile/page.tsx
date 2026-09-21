import { setRequestLocale } from "next-intl/server";
import { CustomerProfileView } from "@/features/customer-profile/components/customer-profile-view";

export async function generateMetadata() {
  return {
    title: "Account Profile & Saved Addresses — Orderworker",
    description:
      "Manage your personal profile, saved Peshawar service addresses, contact preferences, and security settings.",
  };
}

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CustomerProfileView />;
}
