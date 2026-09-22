"use client";

import { Trophy, Star, ShieldCheck, ArrowUpRight, CheckCircle2, Sparkles, MapPin, Award } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { WorkerUser } from "@/types/admin";

export function TopWorkersLeaderboard({ workers }: { workers: WorkerUser[] }) {
  const topWorker = workers[0];
  const otherWorkers = workers.slice(1, 4);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <span className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 font-black text-[10px] text-amber-950 shadow-xs">
            🥇
          </span>
        );
      case 1:
        return (
          <span className="flex size-6 items-center justify-center rounded-lg bg-slate-200 font-black text-[10px] text-slate-700 shadow-xs">
            🥈
          </span>
        );
      case 2:
        return (
          <span className="flex size-6 items-center justify-center rounded-lg bg-amber-800/20 font-black text-[10px] text-amber-900 shadow-xs">
            🥉
          </span>
        );
      default:
        return (
          <span className="flex size-6 items-center justify-center rounded-lg bg-slate-100 font-extrabold text-[10px] text-slate-500">
            #{index + 2}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <Trophy className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-navy">Top Verified Professionals</h3>
            <p className="text-[11px] text-slate-500">
              Ranked by job completion rate, customer satisfaction & revenue
            </p>
          </div>
        </div>
        <Link
          href="/admin/users/workers"
          className="flex items-center gap-1 text-[11px] font-bold text-teal transition hover:underline"
        >
          <span>All Workers</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {/* #1 Featured Worker Card */}
        {topWorker && (
          <div className="relative overflow-hidden rounded-xl border border-amber-300/50 bg-gradient-to-r from-navy via-navy/95 to-slate-900 p-3 text-white shadow-md">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 size-20 rounded-full bg-gradient-to-br from-amber-400/20 to-teal/20 blur-xl" />
            
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-black text-navy shadow-xs ring-2 ring-amber-300/40">
                    {topWorker.name.charAt(0)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-navy shadow-xs">
                    👑
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/30">
                      <Sparkles className="size-2" /> #1 Top Worker
                    </span>
                    {topWorker.verificationStatus === "VERIFIED" && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-teal-300">
                        <ShieldCheck className="size-2.5" /> Verified
                      </span>
                    )}
                  </div>
                  <h4 className="mt-0.5 text-xs font-extrabold tracking-tight text-white">
                    {topWorker.name}
                  </h4>
                  <p className="text-[10px] text-slate-300 font-medium">
                    {topWorker.skills.slice(0, 2).join(" • ")} • <span className="text-slate-400">{topWorker.serviceCity}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto border-t border-white/10 pt-1.5 sm:border-t-0 sm:pt-0">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-0.5 text-amber-400">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-white">{topWorker.rating}</span>
                  </div>
                  <p className="text-[9px] font-semibold text-slate-300">
                    Rs. {topWorker.totalEarnings.toLocaleString()} earned
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Runners Up Workers List (#2, #3, #4) */}
        <div className="space-y-2">
          {otherWorkers.map((worker, idx) => (
            <div
              key={worker.id}
              className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="flex items-center gap-2.5">
                {getRankBadge(idx + 1)}
                <div className="flex size-7 items-center justify-center rounded-lg bg-navy text-[10px] font-bold text-white shadow-xs">
                  {worker.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h5 className="text-xs font-extrabold text-navy group-hover:text-teal transition">
                      {worker.name}
                    </h5>
                    {worker.verificationStatus === "VERIFIED" && (
                      <ShieldCheck className="size-3 text-teal" />
                    )}
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium">
                    {worker.skills[0]} • {worker.serviceCity}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <div>
                  <div className="flex items-center justify-end gap-0.5 text-amber-500">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-navy">{worker.rating}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold">
                    Rs. {worker.totalEarnings.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
