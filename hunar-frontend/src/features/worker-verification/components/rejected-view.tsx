"use client";

import {
  ArrowRight,
  FileX,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import type { WorkerVerificationData } from "../types";

export function RejectedView({ data }: { data: WorkerVerificationData }) {
  const t = useTranslations("WorkerVerification.Rejected");

  return (
    <div className="space-y-4 text-left rtl:text-right">
      {/* Top Header */}
      <div className="text-center sm:text-left rtl:sm:text-right">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error/10 px-3 py-1 text-xs font-bold text-error mb-2">
          <XCircle className="size-3.5" />
          <span>{t("badge")}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy">
          {t("title")}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Rejection Reason Card (Red / Error Alert) */}
      <div className="rounded-2xl border-2 border-error/30 bg-error/5 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-error text-white">
            <FileX className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-extrabold text-navy uppercase tracking-wider">
              {t("reasonTitle")}
            </h3>
            <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800">
              {data.rejectionReason || t("defaultReason")}
            </p>
          </div>
        </div>
      </div>

      {/* Guidelines to Fix & Get Verified */}
      <div className="rounded-2xl bg-white p-2 space-y-2.5">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-navy flex items-center gap-1.5">
          <HelpCircle className="size-3.5 text-teal" />
          {t("howToGetApproved")}
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-teal font-bold">1.</span>
            <span>{t("guide1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal font-bold">2.</span>
            <span>{t("guide2")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal font-bold">3.</span>
            <span>{t("guide3")}</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
        <Link
          href="/worker/onboarding"
          className={buttonVariants({
            size: "lg",
            className:
              "h-12 w-full sm:flex-1 rounded-full bg-teal text-sm font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 flex items-center justify-center gap-2",
          })}
        >
          <RefreshCw className="size-4" />
          <span>{t("fixAndResubmitBtn")}</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>

        <a
          href="https://wa.me/923140837519"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className:
              "h-12 w-full sm:w-auto rounded-full border-2 border-navy text-xs sm:text-sm font-bold text-navy hover:bg-slate-50 flex items-center justify-center gap-2",
          })}
        >
          <MessageSquare className="size-4 text-success" />
          <span>{t("whatsappSupport")}</span>
        </a>
      </div>
    </div>
  );
}
