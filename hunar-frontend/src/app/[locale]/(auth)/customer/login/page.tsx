import { setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { CustomerSignInForm } from "@/features/auth/components/customer-sign-in-form";

export async function generateMetadata() {
  return { title: "Customer Sign In — Orderworker" };
}

export default async function CustomerLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthShell>
      <CustomerSignInForm />
    </AuthShell>
  );
}
