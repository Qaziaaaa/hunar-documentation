"use client";

import { ArrowRight, CircleCheckBig } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function SignupSuccess({ phone }: { phone: string }) {
  const t = useTranslations("Auth");

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-success/10">
        <CircleCheckBig className="size-10 text-success" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-navy">
        {t("successTitle")}
      </h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {t("successSubtitle")}
      </p>
      <p className="mt-1 text-xs font-semibold text-navy" dir="ltr">
        {phone}
      </p>

      <Link
        href="/worker/onboarding"
        className={buttonVariants({
          size: "lg",
          className:
            "mt-8 h-14 w-full rounded-full text-base font-semibold shadow-lg shadow-teal/25",
        })}
      >
        {t("continue")}
        <ArrowRight className="size-5 rtl:rotate-180" />
      </Link>
      <Link
        href="/"
        className="mt-3 text-xs font-semibold text-muted-foreground hover:underline"
      >
        {t("backToHome")}
      </Link>
    </div>
  );
}