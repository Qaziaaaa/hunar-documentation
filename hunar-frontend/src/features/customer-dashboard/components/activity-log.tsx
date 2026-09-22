"use client";

import { useLocale, useTranslations } from "next-intl";
import { MOCK_CUSTOMER_ACTIVITIES } from "../mock/customer-mock-data";

export function ActivityLog() {
  const t = useTranslations("CustomerPortal.Dashboard");
  const locale = useLocale();
  const activities = MOCK_CUSTOMER_ACTIVITIES;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col gap-4">
      <div>
        <h3 className="text-base font-bold text-[#123B5D]">
          {t("recentActivity")}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {t("recentActivitySubtitle")}
        </p>
      </div>
      <div className="relative pl-6 rtl:pl-0 rtl:pr-6 flex flex-col gap-5 pt-1">
        {/* Vertical Line */}
        <div className="absolute left-2 rtl:left-auto rtl:right-2 top-2 bottom-2 w-[1.5px] bg-slate-200"></div>

        {activities.map((act) => {
          const dotColor =
            act.type === "quote"
              ? "bg-[#0F8B8D]"
              : act.type === "completed"
              ? "bg-[#16A34A]"
              : act.type === "payment"
              ? "bg-[#F59E0B]"
              : "bg-slate-400";

          return (
            <div key={act.id} className="relative flex flex-col">
              <span
                className={`absolute -left-[22px] rtl:-left-auto rtl:-right-[22px] top-1.5 size-2.5 rounded-full ${dotColor} ring-4 ring-white`}
              ></span>
              <p className="text-xs font-semibold text-slate-800 leading-snug">
                {act.text}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {act.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
