"use client";

import React from "react";
import { OfferLifecycleStatus } from "@/types/offer";
import {
  Clock,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserX,
} from "lucide-react";

interface OfferStatusBadgeProps {
  status: OfferLifecycleStatus;
  className?: string;
}

export function OfferStatusBadge({ status, className = "" }: OfferStatusBadgeProps) {
  switch (status) {
    case "sent":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Offer Sent — Waiting for Customer</span>
        </span>
      );

    case "viewing":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 font-bold text-xs ${className}`}
        >
          <Eye className="w-3.5 h-3.5 text-sky-600" />
          <span>Customer Viewing Your Offer</span>
        </span>
      );

    case "counter_received":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-300 text-purple-900 font-bold text-xs animate-pulse ${className}`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
          <span>Counter Offer Received</span>
        </span>
      );

    case "accepted":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs ${className}`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Offer Accepted — Job Active</span>
        </span>
      );

    case "rejected":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold text-xs ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          <span>Offer Rejected</span>
        </span>
      );

    case "closed_assigned":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs ${className}`}
        >
          <UserX className="w-3.5 h-3.5 text-slate-500" />
          <span>Closed / Assigned to another worker</span>
        </span>
      );

    default:
      return null;
  }
}
