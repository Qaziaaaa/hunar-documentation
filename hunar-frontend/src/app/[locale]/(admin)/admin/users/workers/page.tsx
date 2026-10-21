"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/features/admin/api/admin-api";
import { AdminAvatar } from "@/features/admin/components/admin-avatar";
import type { WorkerUser } from "@/types/admin";
import { TableRowsSkeleton } from "@/features/admin/components/table-skeleton";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Search,
  ShieldCheck,
  Star,
  Trophy,
  UserCheck,
  X,
} from "lucide-react";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VERIFIED" | "PENDING" | "SUSPENDED">("ALL");
  const [selectedWorker, setSelectedWorker] = useState<WorkerUser | null>(null);
  const [actionWorker, setActionWorker] = useState<WorkerUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => {
    adminApi
      .listWorkers({ limit: 50 })
      .then((res) => setWorkers(res.items))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load workers"),
      )
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const filtered = useMemo(
    () =>
      workers.filter((w) => {
        const matchesSearch =
          w.name.toLowerCase().includes(search.toLowerCase()) ||
          w.phone.includes(search) ||
          w.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

        let matchesStatus = true;
        if (statusFilter === "VERIFIED") matchesStatus = w.verificationStatus === "VERIFIED";
        if (statusFilter === "PENDING") matchesStatus = w.verificationStatus === "PENDING";
        if (statusFilter === "SUSPENDED") matchesStatus = w.status === "SUSPENDED";

        return matchesSearch && matchesStatus;
      }),
    [workers, search, statusFilter],
  );

  const topWorker = useMemo(() => {
    if (!workers || workers.length === 0) return null;
    const verified = workers.filter((w) => w.verificationStatus === "VERIFIED");
    const pool = verified.length > 0 ? verified : workers;
    return [...pool].sort((a, b) => b.totalEarnings - a.totalEarnings)[0];
  }, [workers]);

  // Top Pro #1 renders as the golden first row — only when it survives the active filters.
  const orderedRows = useMemo(() => {
    if (!topWorker) return filtered;
    const idx = filtered.findIndex((w) => w.id === topWorker.id);
    if (idx <= 0) return filtered;
    return [filtered[idx], ...filtered.filter((w) => w.id !== topWorker.id)];
  }, [filtered, topWorker]);

  const handleToggleStatus = async () => {
    if (!actionWorker) return;
    setActionError(null);

    const suspending = actionWorker.status === "ACTIVE";
    const reason = suspendReason.trim();
    if (suspending && !reason) {
      setActionError("A suspension reason is required.");
      return;
    }
    try {
      if (suspending) {
        await adminApi.suspendWorker(actionWorker.id, reason);
      } else {
        await adminApi.reactivateWorker(actionWorker.id);
      }
      setWorkers((prev) =>
        prev.map((w) => {
          if (w.id === actionWorker.id) {
            const newStatus = w.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
            return {
              ...w,
              status: newStatus,
            };
          }
          return w;
        })
      );
      setActionWorker(null);
      setSuspendReason("");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update worker status",
      );
      setActionWorker(null);
      setSuspendReason("");
    }
  };

  return (
<div className="space-y-6">
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-500" />
              <span className="text-sm font-bold text-red-700">Workers failed to load</span>
              <span className="text-xs font-medium text-red-600">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setReloadKey((k) => k + 1);
              }}
              className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
        {actionError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            Action failed: {actionError}
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
                <UserCheck className="size-3.5" />
                Service Professionals
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
              Worker Accounts & Verification
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Manage worker profiles, verification statuses, wallet balances, and ratings
            </p>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by worker name, trade skill, or phone..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
              <Filter className="ml-2 size-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  statusFilter === "ALL"
                    ? "bg-navy text-white shadow-sm"
                    : "text-slate-600 hover:text-navy"
                }`}
              >
                All ({workers.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("VERIFIED")}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  statusFilter === "VERIFIED"
                    ? "bg-teal text-white shadow-sm"
                    : "text-slate-600 hover:text-navy"
                }`}
              >
                Verified
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PENDING")}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  statusFilter === "PENDING"
                    ? "bg-orange text-white shadow-sm"
                    : "text-slate-600 hover:text-navy"
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* Datatable */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-4">Worker Details</th>
                  <th className="py-4 px-4">Trade Skills</th>
                  <th className="py-4 px-4">Verification</th>
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-4">Wallet Balance</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <TableRowsSkeleton colSpan={7} label="Loading workers" />
                ) : orderedRows.map((worker) => {
                  const isTop = !!topWorker && worker.id === topWorker.id;
                  return (
                  <tr
                    key={worker.id}
                    className={
                      isTop
                        ? "bg-gradient-to-r from-amber-500/15 via-amber-50/80 to-white ring-1 ring-inset ring-amber-300/70 transition hover:from-amber-500/25"
                        : "transition hover:bg-slate-50"
                    }
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <AdminAvatar
                          src={worker.avatarUrl}
                          name={worker.name}
                          top={isTop}
                          className="size-10 rounded-xl"
                        />
                        <div>
                          <p className="flex flex-wrap items-center gap-1.5 font-extrabold text-navy">
                            {worker.name}
                            {isTop && (
                              <>
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-800 ring-1 ring-amber-300/70">
                                  <Trophy className="size-3 text-amber-500" />
                                  Top Pro #1
                                </span>
                                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                                  Top 1%
                                </span>
                              </>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {worker.phone}
                            {worker.serviceCity ? ` • ${worker.serviceCity}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {worker.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                          worker.verificationStatus === "VERIFIED"
                            ? "border-teal/20 bg-teal/10 text-teal"
                            : worker.verificationStatus === "PENDING"
                            ? "border-orange/20 bg-orange/10 text-orange"
                            : "border-red-200 bg-red-100 text-red-700"
                        }`}
                      >
                        {worker.verificationStatus === "VERIFIED" ? (
                          <ShieldCheck className="size-3" />
                        ) : (
                          <Clock className="size-3" />
                        )}
                        {worker.verificationStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 font-bold text-navy">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span>{worker.rating > 0 ? worker.rating : "—"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-extrabold text-navy">
                      Rs. {worker.walletBalance.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                          worker.status === "ACTIVE"
                            ? "border-teal/20 bg-teal/10 text-teal"
                            : "border-red-200 bg-red-100 text-red-700"
                        }`}
                      >
                        {worker.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWorker(worker);
                            void adminApi.getWorkerDetail(worker.id).then((full) => {
                              setSelectedWorker((prev) => (prev ? { ...prev, ...full } : full));
                            }).catch(() => undefined);
                          }}
                          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                          title="View Full Profile"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActionWorker(worker)}
                          className={`flex size-8 items-center justify-center rounded-lg transition ${
                            worker.status === "ACTIVE"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                          title={
                            worker.status === "ACTIVE"
                              ? "Suspend Worker"
                              : "Reactivate Worker"
                          }
                        >
                          {worker.status === "ACTIVE" ? (
                            <Ban className="size-4" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worker Full Profile Modal */}
        {selectedWorker ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-extrabold text-navy">
                  Worker Credentials & Wallet Audit
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedWorker(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <AdminAvatar
                    src={selectedWorker.avatarUrl}
                    name={selectedWorker.name}
                    className="size-14 rounded-2xl text-xl"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-navy">
                        {selectedWorker.name}
                      </h4>
                      <span className="rounded bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal">
                        {selectedWorker.verificationStatus}
                      </span>
                    </div>
                    <p className="text-slate-500">{selectedWorker.phone}</p>
                    {selectedWorker.email ? (
                      <p className="text-slate-400">{selectedWorker.email}</p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="font-bold text-navy">Trade Skills:</p>
                  {selectedWorker.skills.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {selectedWorker.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-slate-400">No trade categories assigned.</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Total Earnings
                    </p>
                    <p className="mt-1 text-base font-black text-navy">
                      Rs. {selectedWorker.totalEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Wallet Balance
                    </p>
                    <p className="mt-1 text-base font-black text-teal">
                      Rs. {selectedWorker.walletBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Experience
                    </p>
                    <p className="mt-1 text-base font-black text-navy">
                      {selectedWorker.experienceYears} Years
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-navy">Bio & Overview:</p>
                  <p className="mt-1 rounded-xl bg-slate-50 p-3 leading-relaxed text-slate-600">
                    {selectedWorker.bio || "No bio provided."}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedWorker(null)}
                  className="rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white shadow-md"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Suspend / Reactivate Confirmation Modal */}
        {actionWorker ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-error">
                <AlertCircle className="size-6 shrink-0" />
                <h3 className="text-lg font-extrabold text-navy">
                  Confirm Worker Account Action
                </h3>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Are you sure you want to{" "}
                <strong className="text-navy">
                  {actionWorker.status === "ACTIVE" ? "SUSPEND" : "REACTIVATE"}
                </strong>{" "}
                the worker profile for <strong className="text-navy">{actionWorker.name}</strong>?
              </p>

              {actionWorker.status === "ACTIVE" ? (
                <div className="mt-4 space-y-1.5">
                  <label className="block text-xs font-semibold text-navy">
                    Reason for Suspension (Required)
                  </label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Enter reason for suspending this worker account..."
                    className="h-20 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal"
                  />
                </div>
              ) : null}

              {actionError && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                  {actionError}
                </p>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActionWorker(null);
                    setSuspendReason("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={
                    actionWorker.status === "ACTIVE" && !suspendReason.trim()
                  }
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${
                    actionWorker.status === "ACTIVE"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-teal hover:bg-teal-600"
                  }`}
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
);
}
