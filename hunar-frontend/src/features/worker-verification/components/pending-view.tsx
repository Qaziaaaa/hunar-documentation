"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import type { WorkerVerificationData } from "../types";

export function PendingView({
  data,
  onRefresh,
}: {
  data: WorkerVerificationData;
  onRefresh: () => void;
}) {
  const t = useTranslations("WorkerVerification.Pending");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

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
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-orange">
                  {t("step2Title")}
                </p>
                <span className="rounded-full bg-orange/10 px-1.5 py-0.2 text-[9px] font-bold text-orange">
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

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
        <Button
          type="button"
          size="lg"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-12 w-full sm:flex-1 rounded-full bg-teal text-sm font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90"
        >
          {isRefreshing ? (
            <Loader2 className="mr-2 rtl:mr-0 rtl:ml-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 rtl:mr-0 rtl:ml-2 size-4" />
          )}
          <span>{t("checkStatusBtn")}</span>
        </Button>

        <Link
          href="/"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className:
              "h-12 w-full sm:w-auto rounded-full border-2 border-navy text-xs sm:text-sm font-bold text-navy hover:bg-slate-50",
          })}
        >
          <Home className="mr-1.5 rtl:mr-0 rtl:ml-1.5 size-4" />
          <span>{t("backToHome")}</span>
        </Link>
      </div>
    </div>
  );
}

