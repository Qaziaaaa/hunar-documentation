"use client";

import { Activity, Radio, Cpu, Database, Server, CheckCircle2 } from "lucide-react";

export function SystemHealthMonitor() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <Radio className="size-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-navy">Realtime Infrastructure & Socket SLA</h3>
            <p className="text-xs text-slate-500">
              Live status of backend NestJS services, Prisma DB, and Socket.IO gateways
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
          <CheckCircle2 className="size-3.5" />
          All Systems Operational
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-2 text-slate-400">
            <Radio className="size-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Websockets</span>
          </div>
          <p className="mt-1 text-lg font-black text-navy">412 Live</p>
          <p className="text-[10px] text-slate-500">Socket.IO gateways connected</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-2 text-slate-400">
            <Server className="size-4 text-teal" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">NestJS API</span>
          </div>
          <p className="mt-1 text-lg font-black text-navy">18 ms</p>
          <p className="text-[10px] text-slate-500">Avg HTTP response latency</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-2 text-slate-400">
            <Database className="size-4 text-sky-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prisma DB</span>
          </div>
          <p className="mt-1 text-lg font-black text-navy">99.98%</p>
          <p className="text-[10px] text-slate-500">PostgreSQL query health</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-2 text-slate-400">
            <Cpu className="size-4 text-purple-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Redis Cache</span>
          </div>
          <p className="mt-1 text-lg font-black text-navy">1.2 GB / 4GB</p>
          <p className="text-[10px] text-slate-500">Active session memory</p>
        </div>
      </div>
    </div>
  );
}
