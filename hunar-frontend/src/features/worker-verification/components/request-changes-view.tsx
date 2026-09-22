"use client";

import {
  AlertTriangle,
  ArrowRight,
  Edit,
  FileQuestion,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import type { WorkerVerificationData } from "../types";

export function RequestChangesView({ data }: { data: WorkerVerificationData }) {
  const t = useTranslations("WorkerVerification.RequestChanges");

  const changeItems = data.changeRequests || [
    {
      id: "cr_1",
      field: "cnicBack",
      title: "CNIC Back Photo",
      adminNote: "Please re-upload with all 4 corners visible and readable family code.",
      stepNumber: 5,
    },
    {
      id: "cr_2",
      field: "primaryAddress",
      title: "Base Workshop Address",
      adminNote: "Please provide a specific street/chowk location in Peshawar.",
      stepNumber: 4,
    },
  ];

  return (
    <div className="space-y-4 text-left rtl:text-right">
      {/* Top Header */}
      <div className="text-center sm:text-left rtl:sm:text-right">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-xs font-bold text-orange mb-2">
          <AlertTriangle className="size-3.5" />
          <span>{t("badge")}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy">
          {t("title")}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Admin Notes Box (Orange Alert) */}
      <div className="rounded-2xl border-2 border-orange/30 bg-orange/5 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange text-white">
            <FileQuestion className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-extrabold text-navy uppercase tracking-wider">
              {t("adminNotesTitle")}
            </h3>
            <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800">
              {data.adminNotes || t("defaultAdminNote")}
            </p>
          </div>
        </div>
      </div>

      {/* Itemized Action List */}
      <div className="rounded-2xl bg-white p-2 space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-navy flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Edit className="size-3.5 text-teal" />
            {t("itemsRequiring", { count: changeItems.length })}
          </span>
          <span className="text-[10px] text-orange font-bold">{t("actionNeeded")}</span>
        </h4>

        <div className="space-y-2">
          {changeItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3"
            >
              <div className="space-y-0.5 min-w-0">
                <span className="block text-xs font-bold text-navy truncate">
                  {item.title}
                </span>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {item.adminNote}
                </p>
              </div>

              <Link
                href="/worker/onboarding"
                className="shrink-0 rounded-full border border-teal/40 bg-white px-2.5 py-1 text-[11px] font-bold text-teal shadow-2xs hover:bg-teal/10"
              >
                {t("editStep", { step: item.stepNumber })}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Re-submission Button */}
      <div className="pt-2">
        <Link
          href="/worker/onboarding"
          className={buttonVariants({
            size: "lg",
            className:
              "h-12 w-full rounded-full bg-teal text-sm font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 flex items-center justify-center gap-2",
          })}
        >
          <span>{t("resubmitBtn")}</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
