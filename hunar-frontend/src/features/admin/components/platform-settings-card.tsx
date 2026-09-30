"use client";

import { Settings, Shield, Sliders, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PlatformSettings } from "@/types/admin";

export function PlatformSettingsCard({ settings }: { settings: PlatformSettings }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-teal/10 text-teal">
            <Settings className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-navy">Platform Rules & Settings</h3>
            <p className="text-[11px] text-slate-500">
              Active marketplace rules, commission rates, and matching parameters
            </p>
          </div>
        </div>
        <Link
          href="/admin/settings"
          className="flex items-center gap-1 text-[11px] font-bold text-teal transition hover:underline"
        >
          <span>All Settings</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
          <span className="text-[9px] font-bold uppercase text-slate-400">Commission Rate</span>
          <p className="mt-0.5 text-sm font-black text-navy">{settings.commissionRate}% Fee</p>
          <p className="text-[9px] text-slate-500">Deducted per completed job</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
          <span className="text-[9px] font-bold uppercase text-slate-400">Search Radius</span>
          <p className="mt-0.5 text-sm font-black text-navy">{settings.defaultSearchRadiusKm} km</p>
          <p className="text-[9px] text-slate-500">Default worker radar distance</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
          <span className="text-[9px] font-bold uppercase text-slate-400">Max Worker Offers</span>
          <p className="mt-0.5 text-sm font-black text-navy">{settings.maxActiveOffersPerWorker} Offers</p>
          <p className="text-[9px] text-slate-500">Simultaneous active quotes</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
          <span className="text-[9px] font-bold uppercase text-slate-400">Verification Rule</span>
          <p className="mt-0.5 text-xs font-black text-teal flex items-center gap-1">
            <Shield className="size-3" /> Manual Review
          </p>
          <p className="text-[9px] text-slate-500">CNIC human approval required</p>
        </div>
      </div>
    </div>
  );
}
