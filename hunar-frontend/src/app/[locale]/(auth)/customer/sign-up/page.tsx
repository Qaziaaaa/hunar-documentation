import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { CustomerSignupFlow } from "@/features/auth/components/customer-signup-flow";
import { LoadingState } from "@/components/shared/loading-state";

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
    <AuthShell role="customer">
      <Suspense fallback={<LoadingState label="Loading sign up..." />}>
        <CustomerSignupFlow />
      </Suspense>
    </AuthShell>
  );
}
