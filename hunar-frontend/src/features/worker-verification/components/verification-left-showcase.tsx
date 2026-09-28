"use client";

import {
  BadgeCheck,
  CheckCircle,
  Lock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { WorkerFixLogo } from "@/components/shared/workerfix-logo";

export function VerificationLeftShowcase() {
  const t = useTranslations("WorkerVerification.Showcase");

  return (
    <section
      className="hidden lg:flex flex-col justify-between bg-slate-50/70 p-6 sm:p-8 lg:p-10 lg:col-span-5 xl:col-span-5 min-h-full"
      data-purpose="verification-trust-showcase"
    >
      <div className="flex h-full flex-col justify-between rounded-3xl border border-teal-200/50 bg-gradient-to-b from-[#0F8B8D]/10 via-[#0F8B8D]/5 to-transparent p-5 sm:p-6 lg:p-7 shadow-xs">
        <div>
          {/* Header Branding & Badge */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <WorkerFixLogo variant="dark" size="sm" />
              <span className="block text-[9px] font-bold uppercase tracking-wider text-teal pl-0.5">
                {t("badgeVerified")}
              </span>
            </div>
            <span className="inline-flex items-center rounded-full border border-teal/20 bg-teal/10 px-2.5 py-1 text-[11px] font-bold text-teal">
              {t("badgeNadra")}
            </span>
          </div>

          {/* Section Headline */}
          <div className="mb-4">
            <h1 className="text-xl font-extrabold leading-snug tracking-tight text-navy sm:text-2xl">
              {t("title")}
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {/* Trust Guarantees List */}
          <div className="rounded-2xl border border-teal-100/80 bg-white p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy">
              {t("whyMatters")}
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <BadgeCheck className="size-3.5" />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-navy">{t("badgeTitle")}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t("badgeDesc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <ShieldCheck className="size-3.5" />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-navy">{t("escrowTitle")}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t("escrowDesc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <MapPin className="size-3.5" />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-navy">{t("radarTitle")}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t("radarDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-teal-200/40 text-[11px] font-semibold text-navy">
          <span className="inline-flex items-center gap-1.5 text-teal">
            <Lock className="size-3.5 text-teal" />
            {t("encrypted")}
          </span>
          <span className="inline-flex items-center gap-1.5 text-success">
            <CheckCircle className="size-3.5 text-success" />
            {t("zeroSpam")}
          </span>
        </div>
      </div>
    </section>
  );
}

