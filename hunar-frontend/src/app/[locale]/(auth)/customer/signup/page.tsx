import { setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { CustomerSignupFlow } from "@/features/auth/components/customer-signup-flow";

export async function generateMetadata() {
  return { title: "Customer Sign Up — HUNAR" };
}

export default async function CustomerSignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthShell>
      <CustomerSignupFlow />
    </AuthShell>
  );
}
