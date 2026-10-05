import { setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordFlow } from "@/features/auth/components/forgot-password-flow";

export async function generateMetadata() {
  return { title: "Forgot Password — Worker Portal | WorkerFIX" };
}

export default async function WorkerForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthShell role="worker">
      <ForgotPasswordFlow role="worker" />
    </AuthShell>
  );
}
