"use client";

import React from "react";
import { XCircle, Clock, Users, X } from "lucide-react";
import { useLocale } from "next-intl";
import {
  useWorkerOfferToast,
  dismissOfferToast,
  type WorkerOfferToastType,
} from "../stores/worker-offer-toast-store";

export function WorkerOfferToast() {
  const toast = useWorkerOfferToast();
  const locale = useLocale();
  const isUrdu = locale === "ur";

  if (!toast) return null;

  const config: Record<
    WorkerOfferToastType,
    {
      defaultText: string;
      urduText: string;
      icon: React.ComponentType<{ className?: string }>;
      containerClass: string;
      iconClass: string;
    }
  > = {
    declined: {
      defaultText: "Offer Declined",
      urduText: "آفر مسترد ہو گئی",
      icon: XCircle,
      containerClass:
        "bg-rose-50/95 border-rose-200/90 text-rose-900 shadow-rose-950/5",
      iconClass: "text-rose-600",
    },
    expired: {
      defaultText: "Offer Expired",
      urduText: "آفر کی مدت ختم ہو گئی",
      icon: Clock,
      containerClass:
        "bg-amber-50/95 border-amber-200/90 text-amber-900 shadow-amber-950/5",
      iconClass: "text-amber-600",
    },
    closed: {
      defaultText: "Job Filled",
      urduText: "جاب مکمل ہو گئی",
      icon: Users,
      containerClass:
        "bg-slate-50/95 border-slate-200/90 text-slate-800 shadow-slate-950/5",
      iconClass: "text-slate-600",
    },
  };

  const itemConfig = config[toast.type];
  const Icon = itemConfig.icon;
  const message =
    toast.customMessage ||
    (isUrdu ? itemConfig.urduText : itemConfig.defaultText);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[68px] lg:bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto transition-all"
    >
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-full border shadow-md backdrop-blur-md transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-2 select-none ${itemConfig.containerClass}`}
      >
        <Icon className={`size-3.5 sm:size-4 shrink-0 ${itemConfig.iconClass}`} />
        <span className="text-xs sm:text-[13px] font-bold tracking-tight whitespace-nowrap">
          {message}
        </span>
        <button
          type="button"
          onClick={() => dismissOfferToast()}
          className="size-4 -mr-0.5 ml-1 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}

