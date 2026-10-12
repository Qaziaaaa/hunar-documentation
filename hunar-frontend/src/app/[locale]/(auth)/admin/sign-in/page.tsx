import { AuthShell } from "@/features/auth/components/auth-shell";
import { AdminSignInForm } from "@/features/auth/components/admin-sign-in-form";

export const metadata = {
  title: "Admin Sign In — HUNAR",
  description: "Sign in to the HUNAR Admin Operations Portal",
};

export default function AdminSignInPage() {
  return (
    <AuthShell hideHelp adminDesktopLayout>
      <AdminSignInForm />
    </AuthShell>
  );
}
