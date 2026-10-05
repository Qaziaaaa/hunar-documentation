"use client";

import { CheckCircle2, ShieldCheck, Star, Wallet, Wrench, Zap } from "lucide-react";
import { WorkerFixLogo } from "@/components/shared/workerfix-logo";

export function WorkerAuthShowcase() {
  return (
    <aside
      className="relative hidden lg:col-span-6 xl:col-span-7 lg:flex flex-col justify-between bg-slate-50/80 p-6 xl:p-10 border-r border-slate-100 select-none overflow-hidden h-full"
      data-purpose="worker-auth-showcase"
    >
      {/* Top Branding Header */}
      <div className="flex items-center justify-between">
        <WorkerFixLogo variant="dark" size="md" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
          <Wrench className="size-3" />
          Worker &amp; Pro Portal
        </span>
      </div>

      {/* Center Visual & Value Proposition */}
      <div className="my-auto py-2 max-w-lg">
        <h1 className="text-xl xl:text-2xl font-extrabold tracking-tight text-[#123B5D] leading-snug">
          Grow your skilled trade business across Pakistan.
        </h1>
        <p className="mt-1.5 text-xs xl:text-sm text-slate-600 leading-relaxed">
          Receive daily local job leads on your phone, set your own service rates, and enjoy guaranteed weekly escrow payouts directly to your wallet.
        </p>

        {/* Real Skilled Tradesperson Photography Card with Floating Verified Pro Badge */}
        <div className="relative mt-4 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-200 aspect-[4/3] max-h-[260px] xl:max-h-[290px] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/tariq-mehmood-hero2.png"
            alt="Pakistani AC Specialist Tariq Mehmood"
            className="w-full h-full object-cover object-[center_6%]"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Floating Pro Badge */}
          <div className="absolute bottom-3 left-3 w-fit flex items-center gap-3 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md border border-white/60">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-teal/10 text-teal font-extrabold text-xs">
                PRO
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#123B5D]">Tariq Mehmood</span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1 py-0.2 text-[8px] font-bold text-amber-700">
                    <ShieldCheck className="size-2.5" /> Verified
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">HVAC Specialist &bull; Lahore</p>
              </div>
            </div>

            <div className="flex items-center gap-1 pl-2.5 border-l border-slate-200/80 text-xs font-bold text-amber-500">
              <Star className="size-3 fill-amber-400" />
              <span>4.9</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Trust Row */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 text-[11px] font-medium text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Zap className="size-3.5 text-teal" />
          Direct Daily Jobs
        </span>
        <span className="inline-flex items-center gap-1">
          <Wallet className="size-3.5 text-teal" />
          Guaranteed Escrow Payouts
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="size-3.5 text-teal" />
          Zero Middlemen Delays
        </span>
      </div>
    </aside>
  );
}
