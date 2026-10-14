import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { CustomerSignupFlow } from "@/features/auth/components/customer-signup-flow";
import { LoadingState } from "@/components/shared/loading-state";

export async function generateMetadata() {
  return { title: "Customer Sign Up — WorkerFIX" };
}

export default async function CustomerSignupPage({
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
