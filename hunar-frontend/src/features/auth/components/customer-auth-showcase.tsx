"use client";

import { CheckCircle2, Lock, ShieldCheck, Sparkles, Star } from "lucide-react";
import { WorkerFixLogo } from "@/components/shared/workerfix-logo";

export function CustomerAuthShowcase() {
  return (
    <aside
      className="relative hidden lg:col-span-6 xl:col-span-7 lg:flex flex-col justify-between bg-slate-50/80 p-6 xl:p-10 border-r border-slate-100 select-none overflow-hidden h-full"
      data-purpose="customer-auth-showcase"
    >
      {/* Top Branding Header */}
      <div className="flex items-center justify-between">
        <WorkerFixLogo variant="dark" size="md" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[11px] font-semibold text-teal">
          <Sparkles className="size-3" />
          Customer Portal
        </span>
      </div>

      {/* Center Visual & Value Proposition */}
      <div className="my-auto py-2 max-w-lg">
        <h1 className="text-xl xl:text-2xl font-extrabold tracking-tight text-[#123B5D] leading-snug">
          Find verified skilled professionals for every home repair.
        </h1>
        <p className="mt-1.5 text-xs xl:text-sm text-slate-600 leading-relaxed">
          Book background-checked electricians, plumbers, AC technicians, and carpenters near you with upfront pricing and verified professionals.
        </p>

        {/* Real Service Photography Card with Floating Verified Pro Badge */}
        <div className="relative mt-4 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-200 aspect-[16/9] max-h-[220px] xl:max-h-[250px] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/electrician-db-technician.png"
            alt="Verified electrician performing electrical maintenance"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Floating Pro Badge */}
          <div className="absolute bottom-3 left-3 w-fit flex items-center gap-3 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md border border-white/60">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/maqsood-raza-large.png"
                alt="Maqsood Raza"
                className="size-8 rounded-lg object-cover border border-slate-200"
              />
              <div className="leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#123B5D]">Maqsood Raza</span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-teal/10 px-1 py-0.2 text-[8px] font-bold text-teal">
                    <ShieldCheck className="size-2.5" /> Verified
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Master Electrician &bull; 140+ jobs</p>
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
          <ShieldCheck className="size-3.5 text-teal" />
          Verified Professionals
        </span>
        <span className="inline-flex items-center gap-1">
          <Lock className="size-3.5 text-teal" />
          Doorstep PIN Protection
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="size-3.5 text-teal" />
          Transparent Pricing
        </span>
      </div>
    </aside>
  );
}
