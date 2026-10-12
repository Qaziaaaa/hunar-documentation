import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { CustomerSignInForm } from "@/features/auth/components/customer-sign-in-form";
import { LoadingState } from "@/components/shared/loading-state";

export async function generateMetadata() {
  return { title: "Customer Sign In — WorkerFIX" };
}

export default async function CustomerLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthShell role="customer">
      <Suspense fallback={<LoadingState label="Loading sign in..." />}>
        <CustomerSignInForm />
      </Suspense>
    </AuthShell>
  );
}
