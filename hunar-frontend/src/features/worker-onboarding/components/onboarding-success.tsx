"use client";

import { Check, Clock, LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export function OnboardingSuccess() {
  const t = useTranslations("WorkerOnboarding.Success");

  return (
    <div className="flex flex-col justify-center flex-1 py-1 text-center my-auto w-full">
      <div className="space-y-3 sm:space-y-3.5">
        {/* Big Green Animated Checkmark Badge */}
        <div className="mx-auto flex size-16 sm:size-18 items-center justify-center rounded-full border-2 border-success/30 bg-success/10 text-success shadow-md shadow-success/10">
          <div className="flex size-11 sm:size-12 items-center justify-center rounded-full bg-success text-white shadow-xs">
            <Check className="size-6 sm:size-7 stroke-[3]" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl leading-snug">
            {t("title")}
          </h2>
          <p className="mx-auto mt-1 sm:mt-1.5 max-w-md text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Under Review Callout Box */}
        <div className="mx-auto max-w-md rounded-2xl border-[1.5px] border-orange bg-white p-3 sm:p-3.5 text-left shadow-xs shadow-orange/10">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy">
              <Clock className="size-4 text-orange" />
              <span>{t("underReview")}</span>
            </div>
            <span className="rounded-full border border-orange/30 bg-orange/10 px-2 py-0.5 text-[11px] font-bold text-orange">
              {t("pendingAdmin")}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("reviewNotice")}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mx-auto flex w-full max-w-md flex-col gap-2.5 pt-3 sm:pt-4">
        <Link
          href="/worker/verification-status"
          className={buttonVariants({
            size: "default",
            className:
              "h-10.5 sm:h-11 w-full rounded-full bg-teal text-sm sm:text-base font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 flex items-center justify-center gap-2",
          })}
        >
          <Clock className="size-4" />
          <span>{t("trackStatusBtn")}</span>
        </Link>
        <Link
          href="/worker/dashboard"
          className={buttonVariants({
            variant: "outline",
            size: "default",
            className:
              "h-10.5 sm:h-11 w-full rounded-full border-2 border-navy text-sm sm:text-base font-bold text-navy hover:bg-slate-50 flex items-center justify-center gap-2",
          })}
        >
          <LayoutDashboard className="size-4" />
          <span>{t("portalBtn")}</span>
        </Link>
      </div>
    </div>
  );
}
