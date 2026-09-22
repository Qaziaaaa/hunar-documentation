"use client";

import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  DollarSign,
  MapPin,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { WorkerVerificationData } from "../types";

export function ApprovedView({ data }: { data: WorkerVerificationData }) {
  return (
    <div className="space-y-4 text-left">
      {/* Top Celebratory Header */}
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-xs font-bold text-teal mb-2">
          <Sparkles className="size-3.5" />
          <span>Admin Verification Approved</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy">
          Congratulations, {data.fullName}! 🎉
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Your credentials and Pakistani Smart CNIC documents have been verified by Orderworker compliance.
        </p>
      </div>

      {/* Verified Worker ID Card */}
      <div className="rounded-2xl bg-gradient-to-br from-teal/10 via-white to-teal/5 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-navy text-white shadow-xs">
              <span className="text-lg font-extrabold text-teal">
                {data.fullName.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-extrabold text-navy">
                  {data.fullName}
                </span>
                {/* Official Teal Verified Badge */}
                <span
                  className="inline-flex items-center gap-0.5 rounded-full bg-teal px-2 py-0.2 text-[10px] font-bold text-white shadow-2xs"
                  title="Official Orderworker Verified Badge"
                >
                  <BadgeCheck className="size-3" />
                  <span>Verified Pro</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                +92 {data.phone} · ID: {data.workerId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-success">
            <ShieldCheck className="size-4 text-success" />
            <span>NADRA Cleared</span>
          </div>
        </div>

        {/* Trade Skills & Peshawar Coverage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-navy">
              <Briefcase className="size-3.5 text-teal" /> Approved Trades
            </span>
            <div className="flex flex-wrap gap-1">
              {data.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[11px] font-semibold text-teal"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-navy">
              <MapPin className="size-3.5 text-teal" /> Service Radar
            </span>
            <p className="text-xs font-medium text-slate-700">
              {data.serviceAreas.join(", ")} ({data.city})
            </p>
          </div>
        </div>
      </div>

      {/* Unlocked Capabilities Grid */}
      <div className="rounded-2xl bg-white p-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy mb-2.5">
          Unlocked Capabilities:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="rounded-xl bg-white p-2.5 shadow-2xs">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal/10 text-teal mb-1.5">
              <Zap className="size-4" />
            </div>
            <p className="font-bold text-navy">Nearby Job Alerts</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Instant match alerts in your Peshawar towns.
            </p>
          </div>

          <div className="rounded-xl bg-white p-2.5 shadow-2xs">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal/10 text-teal mb-1.5">
              <CheckCircle2 className="size-4" />
            </div>
            <p className="font-bold text-navy">Send Visit Offers</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Quote custom inspection fees and arrive on-site.
            </p>
          </div>

          <div className="rounded-xl bg-white p-2.5 shadow-2xs">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal/10 text-teal mb-1.5">
              <DollarSign className="size-4" />
            </div>
            <p className="font-bold text-navy">Escrow Guaranteed</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              100% protected payouts for completed visits.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <Link
          href="/worker/dashboard"
          className={buttonVariants({
            size: "lg",
            className:
              "h-12 w-full rounded-full bg-teal text-sm font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 flex items-center justify-center gap-2",
          })}
        >
          <span>Go to Worker Dashboard</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
