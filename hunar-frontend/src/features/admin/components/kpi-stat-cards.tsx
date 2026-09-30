"use client";

import {
  Activity,
  Briefcase,
  CheckCircle2,
  Clock,
  Coins,
  TrendingUp,
  UserCheck,
  Users,
  Trophy,
  Star,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { AdminKpiStats } from "@/types/admin";

export function KpiStatCards({ stats }: { stats: AdminKpiStats }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {/* 1. Total Jobs Card */}
      <Link
        href="/admin/jobs"
        className="group block rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-xs cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
            Total Jobs
          </span>
          <div className="flex size-6 items-center justify-center rounded-md bg-navy/10 text-navy transition-transform duration-200 group-hover:scale-105">
            <Briefcase className="size-3" />
          </div>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <p className="text-lg font-black tracking-tight text-navy">
            {stats.totalJobs.toLocaleString()}
          </p>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1 py-0.5 text-[8px] font-extrabold text-emerald-700">
            <TrendingUp className="size-2" /> +14.2%
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-[8px] font-semibold text-slate-500">
          <span className="text-teal font-extrabold">{stats.activeJobs} Active</span>
          <span>{stats.completedJobs} Done</span>
        </div>
      </Link>

      {/* 2. Total Customers Card */}
      <Link
        href="/admin/users/customers"
        className="group block rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/20 hover:shadow-xs cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
            Customers
          </span>
          <div className="flex size-6 items-center justify-center rounded-md bg-teal/10 text-teal transition-transform duration-200 group-hover:scale-105">
            <Users className="size-3" />
          </div>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <p className="text-lg font-black tracking-tight text-navy">
            {stats.totalCustomers.toLocaleString()}
          </p>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1 py-0.5 text-[8px] font-extrabold text-emerald-700">
            <TrendingUp className="size-2" /> +8.5%
          </span>
        </div>
        <div className="mt-1 flex items-center gap-0.5 border-t border-slate-100 pt-1 text-[8px] font-bold text-emerald-600">
          <TrendingUp className="size-2" />
          <span>+{stats.newCustomersThisWeek} this week</span>
        </div>
      </Link>

      {/* 3. Total Workers Card */}
      <Link
        href="/admin/users/workers"
        className="group block rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-xs cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
            Workers
          </span>
          <div className="flex size-6 items-center justify-center rounded-md bg-navy/10 text-navy transition-transform duration-200 group-hover:scale-105">
            <UserCheck className="size-3" />
          </div>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <p className="text-lg font-black tracking-tight text-navy">
            {stats.totalWorkers.toLocaleString()}
          </p>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-teal/10 px-1 py-0.5 text-[8px] font-extrabold text-teal">
            <TrendingUp className="size-2" /> +6.1%
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-[8px] font-semibold">
          <span className="flex items-center gap-0.5 text-teal font-extrabold">
            <CheckCircle2 className="size-2" />
            {stats.verifiedWorkers} Verified
          </span>
          <span className="flex items-center gap-0.5 text-orange font-extrabold">
            <Clock className="size-2" />
            {stats.pendingWorkers} Pending
          </span>
        </div>
      </Link>

      {/* 4. Top Verified Pro Highlight Card */}
      <Link
        href="/admin/users/workers"
        className="group block rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 p-2.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-xs cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-amber-700">
            Top Pro #1
          </span>
          <div className="flex size-6 items-center justify-center rounded-md bg-amber-500 text-white shadow-2xs transition-transform duration-200 group-hover:scale-105">
            <Trophy className="size-3" />
          </div>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <p className="text-xs font-black text-navy truncate">M. Rashid</p>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1 py-0.5 text-[8px] font-extrabold text-amber-800">
            Top 1%
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-amber-200/50 pt-1 text-[8px] font-bold text-amber-900">
          <span className="flex items-center gap-0.5 text-teal">
            <ShieldCheck className="size-2" /> Verified
          </span>
          <span>145k Earned</span>
        </div>
      </Link>

      {/* 5. Total Revenue Card */}
      <Link
        href="/admin/payments"
        className="group block rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xs cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
            Platform Revenue
          </span>
          <div className="flex size-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 transition-transform duration-200 group-hover:scale-105">
            <Coins className="size-3" />
          </div>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <p className="text-lg font-black tracking-tight text-navy">
            Rs. {stats.totalRevenue.toLocaleString()}
          </p>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1 py-0.5 text-[8px] font-extrabold text-emerald-700">
            <TrendingUp className="size-2" /> +18.4%
          </span>
        </div>
        <p className="mt-1 border-t border-slate-100 pt-1 text-[8px] font-semibold text-slate-500">
          10% commission fee
        </p>
      </Link>

      {/* 6. Active Now Card */}
      <Link
        href="/admin/jobs"
        className="group block rounded-xl border border-teal/25 bg-gradient-to-br from-white via-teal/5 to-teal/10 p-2.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-teal">
            Active Now
          </span>
          <div className="flex size-6 items-center justify-center rounded-md bg-teal text-white shadow-2xs transition-transform duration-200 group-hover:scale-105">
            <Activity className="size-3" />
          </div>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-black tracking-tight text-navy">
              {stats.activeNowCount}
            </p>
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-teal/10 px-1 py-0.5 text-[8px] font-extrabold text-teal">
            Live Pulse
          </span>
        </div>
        <p className="mt-1 border-t border-teal/15 pt-1 text-[8px] font-extrabold text-teal">
          Live jobs in progress
        </p>
      </Link>
    </div>
  );
}
