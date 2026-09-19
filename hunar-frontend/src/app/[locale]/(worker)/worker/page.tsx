"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkerJobs } from "@/stores/worker-jobs-store";
import { formatRs } from "@/lib/design-tokens";
import { NearbyJobsFeed } from "@/features/jobs/components/nearby-jobs-feed";
import {
  ShieldCheck,
  Star,
  Zap,
  Wallet,
  Compass,
  Briefcase,
} from "lucide-react";

export default function WorkerDashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const { jobs, walletBalance } = useWorkerJobs();

  // Active jobs count
  const activeJobsCount = jobs.filter(
    (j) =>
      j.status === "accepted" ||
      j.status === "visit_in_progress" ||
      j.status === "visit_completed" ||
      j.status === "inspecting" ||
      j.status === "inspection_submitted"
  ).length;

  const nearbyOpenCount = jobs.filter((j) => j.status === "open").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Welcome & Worker Profile Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#123B5D] text-white flex items-center justify-center font-black text-2xl shadow-sm">
              SA
            </div>
            <span
              title="NADRA CNIC Verified Pro"
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0F8B8D] text-white rounded-full flex items-center justify-center text-xs shadow-sm ring-2 ring-white"
            >
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Assalam-o-Alaikum, Shahzad Ahmad
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[#0F8B8D] font-bold text-xs">
                Master Artisan Level 4
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Certified Multi-Trade Specialist (Peshawar Urban Grid) •{" "}
              <strong className="text-slate-800 font-semibold">
                CNIC: 17301-*******-3 (Verified)
              </strong>{" "}
              • Response Rate: <span className="text-[#0F8B8D] font-bold">98%</span>
            </p>
          </div>
        </div>

        {/* Quick CTA to View Active Jobs if any */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/${locale}/worker/jobs`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-xs"
          >
            <Briefcase className="w-4 h-4 text-[#0F8B8D]" />
            <span>My Active Work Orders ({activeJobsCount})</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nearby Jobs
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {nearbyOpenCount}
            </div>
            <div className="text-[11px] text-[#0F8B8D] font-semibold mt-0.5">
              Available in Peshawar
            </div>
          </div>
          <span className="text-[10px] text-slate-400">
            Open for competitive visit bids
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active In-Flight
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {activeJobsCount}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
              Site visits &amp; inspections
            </div>
          </div>
          <span className="text-[10px] text-slate-400">
            Escrow locked &amp; scheduled
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Wallet Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-[#123B5D]">
              {formatRs(walletBalance)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Above -500 Rs. limit
            </div>
          </div>
          <span className="text-[10px] text-slate-400">
            10% commission hold supported
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reputation
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              4.9 ★
            </div>
            <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
              42 verified reviews
            </div>
          </div>
          <span className="text-[10px] text-slate-400">
            99.2% customer satisfaction
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Nearby Job Requests
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Open customer requests matching your verified skills &amp; service radius in Peshawar.
          </p>
        </div>

        <NearbyJobsFeed />
      </div>
    </div>
  );
}
