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
} from "lucide-react";
import type { AdminKpiStats } from "@/types/admin";

export function KpiStatCards({ stats }: { stats: AdminKpiStats }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {/* 1. Total Jobs Card */}
      <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy/20 hover:shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Total Jobs
          </span>
          <div className="flex size-11 items-center justify-center rounded-xl bg-navy/10 text-navy transition-transform duration-300 group-hover:scale-110">
            <Briefcase className="size-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black tracking-tight text-navy">
          {stats.totalJobs.toLocaleString()}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
          <span className="text-teal font-extrabold">{stats.activeJobs} Active</span>
          <span>{stats.completedJobs} Done</span>
        </div>
      </div>

      {/* 2. Total Customers Card */}
      <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal/20 hover:shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Customers
          </span>
          <div className="flex size-11 items-center justify-center rounded-xl bg-teal/10 text-teal transition-transform duration-300 group-hover:scale-110">
            <Users className="size-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black tracking-tight text-navy">
          {stats.totalCustomers.toLocaleString()}
        </p>
        <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3 text-[11px] font-bold text-green-600">
          <TrendingUp className="size-3.5" />
          <span>+{stats.newCustomersThisWeek} new this week</span>
        </div>
      </div>

      {/* 3. Total Workers Card */}
      <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy/20 hover:shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Workers
          </span>
          <div className="flex size-11 items-center justify-center rounded-xl bg-navy/10 text-navy transition-transform duration-300 group-hover:scale-110">
            <UserCheck className="size-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black tracking-tight text-navy">
          {stats.totalWorkers.toLocaleString()}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-teal font-extrabold">
            <CheckCircle2 className="size-3" />
            {stats.verifiedWorkers} Verified
          </span>
          <span className="flex items-center gap-1 text-orange font-extrabold">
            <Clock className="size-3" />
            {stats.pendingWorkers} Pending
          </span>
        </div>
      </div>

      {/* 4. Total Revenue Card */}
      <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Platform Revenue
          </span>
          <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700 transition-transform duration-300 group-hover:scale-110">
            <Coins className="size-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black tracking-tight text-navy">
          Rs. {stats.totalRevenue.toLocaleString()}
        </p>
        <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
          10% commission on visits
        </p>
      </div>

      {/* 5. Active Now Card */}
      <div className="group rounded-2xl border border-teal/25 bg-gradient-to-br from-white via-teal/5 to-teal/10 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-teal">
            Active Now
          </span>
          <div className="flex size-11 items-center justify-center rounded-xl bg-teal text-white shadow-md shadow-teal/20 transition-transform duration-300 group-hover:scale-110">
            <Activity className="size-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-3xl font-black tracking-tight text-navy">
            {stats.activeNowCount}
          </p>
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
          </span>
        </div>
        <p className="mt-3 border-t border-teal/15 pt-3 text-[11px] font-extrabold text-teal">
          Live jobs in progress
        </p>
      </div>
    </div>
  );
}
