"use client";

import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { WorkerVerificationData } from "../types";

export function PendingView({
  data,
}: {
  data: WorkerVerificationData;
  onRefresh?: () => void;
}) {
  const t = useTranslations("WorkerVerification.Pending");

  return (
    <div className="space-y-4 text-left rtl:text-right">
      {/* Top Header */}
      <div className="text-center sm:text-left rtl:sm:text-right">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-xs font-bold text-orange mb-2">
          <Clock className="size-3.5 animate-spin" />
          <span>{t("badge")}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy leading-snug">
          {t("title")}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t("subtitle", { name: data.fullName })}
        </p>
      </div>

      {/* 3-Step Verification Timeline Card */}
      <div className="rounded-2xl bg-white p-2 space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy">
          {t("timelineTitle")}
        </h3>

        <div className="relative space-y-4 before:absolute before:left-3.5 rtl:before:left-auto rtl:before:right-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {/* Stage 1: Profile Submitted */}
          <div className="relative flex items-start gap-3">
            <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-white shadow-xs">
              <CheckCircle2 className="size-4" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-navy">
                {t("step1Title")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {t("step1Desc")}
              </p>
            </div>
          </div>

          {/* Stage 2: Admin & NADRA Document Review (Current) */}
          <div className="relative flex items-start gap-3">
            <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-orange bg-white text-orange shadow-xs">
              <span className="size-2.5 rounded-full bg-orange animate-ping" />
            </div>
            <div className="leading-tight flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-xs font-bold text-orange">
                  {t("step2Title")}
                </p>
                <span className="inline-flex shrink-0 whitespace-nowrap items-center rounded-full bg-orange/10 px-1.5 py-0.5 text-[9px] font-bold text-orange">
                  {t("step2Badge")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {t("step2Desc")}
              </p>
            </div>
          </div>

          {/* Stage 3: Activation & Badge */}
          <div className="relative flex items-start gap-3 opacity-60">
            <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <Sparkles className="size-3.5" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-slate-700">
                {t("step3Title")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {t("step3Desc")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Turnaround Time & SMS Notice */}
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-3.5 text-xs text-slate-700 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-navy">
          <Bell className="size-4 text-teal shrink-0" />
          <span>{t("turnaroundTitle")}</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed pl-6 rtl:pl-0 rtl:pr-6">
          {t("turnaroundDesc", { phone: data.phone })}
        </p>
      </div>
    </div>
  );
}

