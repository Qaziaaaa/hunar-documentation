import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { CustomerSignupFlow } from "@/features/auth/components/customer-signup-flow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: "Customer Sign Up — HUNAR" };
}

export default async function CustomerSignUpPage({
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
