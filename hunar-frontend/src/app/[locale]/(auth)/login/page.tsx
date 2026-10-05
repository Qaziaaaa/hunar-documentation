import { ArrowLeft, Home, LogIn, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/features/auth/components/auth-shell";

export default function LoginPage() {
  const t = useTranslations("Auth");

  return (
    <AuthShell role="customer">
      <div className="flex flex-1 flex-col justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">
            {t("login.title")}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {t("login.description")}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            className="h-13 w-full rounded-full bg-teal text-white hover:bg-teal/90 shadow-md font-semibold text-sm"
            render={<Link href="/customer/sign-in" />}
          >
            <Home aria-hidden="true" className="size-4" />
            Sign In as Customer
          </Button>

          <Button
            variant="outline"
            className="h-13 w-full rounded-full border-teal/30 text-teal hover:bg-teal/5 font-semibold text-sm"
            render={<Link href="/worker/sign-in" />}
          >
            <Wrench aria-hidden="true" className="size-4" />
            Sign In as Worker / Pro
          </Button>

          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground mt-2"
            render={<Link href="/" />}
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            {t("common.backHome")}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}