"use client";

import { useMemo, useRef, useState } from "react";
import { adminApi, SuspendUserPayload } from "@/features/admin/api/admin-api";
import {
  useDebouncedValue,
  useIncrementalDirectory,
  useLoadMoreOnVisible,
} from "@/features/admin/hooks/use-incremental-directory";
import { AdminAvatar } from "@/features/admin/components/admin-avatar";
import type { WorkerUser } from "@/types/admin";
import { TableRowsSkeleton } from "@/features/admin/components/table-skeleton";
import {
  SuspendUserModal,
  SuspendModalUser,
} from "@/features/admin/components/suspend-user-modal";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Plus,
  Search,
  Star,
  Trophy,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";

export default function WorkersPage() {
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUSPENDED">("ALL");
  const [selectedWorker, setSelectedWorker] = useState<WorkerUser | null>(null);
  const [actionWorker, setActionWorker] = useState<WorkerUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Worker wallet top-up modal state
  const [topUpWorker, setTopUpWorker] = useState<WorkerUser | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("500");
  const [topUpNote, setTopUpNote] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpSuccess, setTopUpSuccess] = useState<string | null>(null);

  // First page (10 rows) paints immediately; the rest stream in on scroll.
  const directory = useIncrementalDirectory<WorkerUser>({
    queryKey: ["admin", "workers", debouncedSearch, statusFilter],
    fetchPage: (query) =>
      adminApi.listWorkers({
        ...query,
        search: debouncedSearch,
        status: statusFilter === "SUSPENDED" ? "suspended" : undefined,
      }),
  });
  const workers = directory.items;
  const loading = directory.loading;
  const error = directory.error;

  const loadMoreRef = useRef<HTMLTableRowElement | null>(null);
  useLoadMoreOnVisible(
    loadMoreRef,
    directory.hasNextPage,
    directory.isFetchingNextPage,
    directory.fetchNextPage,
  );

  // Filtering happens in the query (server-side), so every loaded row matches.
  const filtered = workers;

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

  const modalWorker: SuspendModalUser | null = useMemo(() => {
    if (!actionWorker) return null;
    return {
      id: actionWorker.id,
      name: actionWorker.name,
      phone: actionWorker.phone,
      role: "WORKER",
      status: actionWorker.status,
      suspendedUntil: actionWorker.suspendedUntil,
      suspensionReason: actionWorker.suspensionReason,
      suspensionType: actionWorker.suspensionType,
    };
  }, [actionWorker]);

  const handleConfirmSuspend = async (payload: SuspendUserPayload) => {
    if (!actionWorker) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.suspendWorker(actionWorker.id, payload);
      directory.updateItems((prev) =>
        prev.map((w) => {
          if (w.id === actionWorker.id) {
            return {
              ...w,
              status: "SUSPENDED",
              suspensionReason: payload.description || payload.reason,
              suspensionType: payload.type,
              suspendedUntil: payload.duration ? payload.duration : null,
            };
          }
          return w;
        })
      );
      void directory.refetch();
      setActionWorker(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to suspend worker account",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!actionWorker) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.reactivateWorker(actionWorker.id);
      directory.updateItems((prev) =>
        prev.map((w) => {
          if (w.id === actionWorker.id) {
            return {
              ...w,
              status: "ACTIVE",
              suspendedUntil: null,
              suspensionReason: null,
              suspensionType: null,
            };
          }
          return w;
        })
      );
      void directory.refetch();
      setActionWorker(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to reactivate worker account",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpWorker) return;
    const amountNum = Number(topUpAmount);
    if (!amountNum || amountNum <= 0) {
      setTopUpError("Please enter an amount greater than 0.");
      return;
    }
    setTopUpLoading(true);
    setTopUpError(null);
    setTopUpSuccess(null);
    try {
      const res = await adminApi.topUpWorkerWallet(
        topUpWorker.id,
        amountNum,
        topUpNote.trim() || undefined,
      );
      directory.updateItems((prev) =>
        prev.map((w) =>
          w.id === topUpWorker.id
            ? { ...w, walletBalance: res.balance ?? w.walletBalance + amountNum }
            : w,
        ),
      );
      setTopUpSuccess(
        `Rs. ${amountNum.toLocaleString()} credited successfully! New balance: Rs. ${(
          res.balance ?? topUpWorker.walletBalance + amountNum
        ).toLocaleString()}`,
      );
      setTimeout(() => {
        setTopUpWorker(null);
        setTopUpAmount("500");
        setTopUpNote("");
        setTopUpSuccess(null);
      }, 1200);
    } catch (err) {
      setTopUpError(
        err instanceof Error ? err.message : "Failed to top up worker wallet",
      );
    } finally {
      setTopUpLoading(false);
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
                void directory.refetch();
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
              Worker Accounts & Directory
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Manage worker profiles, wallet balances, ratings, and account status
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
                {statusFilter === "ALL"
                  ? `All (${directory.meta?.total ?? workers.length})`
                  : "All"}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("SUSPENDED")}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  statusFilter === "SUSPENDED"
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-navy"
                }`}
              >
                Suspended
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
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-4">Wallet Balance</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <TableRowsSkeleton colSpan={6} label="Loading workers" />
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
                      <div className="flex items-center gap-1 font-bold text-navy">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span>{worker.rating > 0 ? worker.rating : "—"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-extrabold text-navy">
                      Rs. {worker.walletBalance.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      {worker.status === "ACTIVE" ? (
                        <span className="inline-flex rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-teal">
                          ACTIVE
                        </span>
                      ) : (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-red-700">
                            {worker.suspensionType === "TEMPORARY" ? (
                              <>
                                <Clock className="size-3" />
                                Temporary
                              </>
                            ) : (
                              <>
                                <Ban className="size-3" />
                                Suspended
                              </>
                            )}
                          </span>
                          {worker.suspensionReason && (
                            <span
                              className="max-w-[140px] truncate text-[10px] text-slate-500"
                              title={worker.suspensionReason}
                            >
                              {worker.suspensionReason}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTopUpWorker(worker);
                            setTopUpAmount("500");
                            setTopUpNote("");
                            setTopUpError(null);
                            setTopUpSuccess(null);
                          }}
                          className="flex size-8 items-center justify-center rounded-lg border border-teal/30 bg-teal/5 text-teal transition hover:bg-teal hover:text-white"
                          title="Top Up Wallet (+)"
                        >
                          <Wallet className="size-4" />
                        </button>
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
                {!loading && workers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      No workers match these filters.
                    </td>
                  </tr>
                ) : null}
                {directory.hasNextPage ? (
                  <tr ref={loadMoreRef}>
                    <td colSpan={6} className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => void directory.fetchNextPage()}
                        disabled={directory.isFetchingNextPage}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        {directory.isFetchingNextPage
                          ? "Loading more…"
                          : `Load more (${workers.length} of ${directory.meta?.total ?? workers.length})`}
                      </button>
                    </td>
                  </tr>
                ) : null}
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

        {/* Section 5: Suspend / Reactivate Modal */}
        <SuspendUserModal
          isOpen={!!actionWorker}
          user={modalWorker}
          onClose={() => setActionWorker(null)}
          onConfirmSuspend={handleConfirmSuspend}
          onConfirmReactivate={handleConfirmReactivate}
          isSubmitting={isSubmitting}
        />

        {/* Worker Wallet Top-Up Modal */}
        {topUpWorker ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-teal/10 text-teal">
                    <Wallet className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-navy">
                      Worker Wallet Top-Up
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400">
                      Add balance (+) directly to worker account
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTopUpWorker(null);
                    setTopUpAmount("500");
                    setTopUpNote("");
                    setTopUpError(null);
                    setTopUpSuccess(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Worker Target Info Banner */}
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3.5">
                <div className="flex items-center gap-3">
                  <AdminAvatar
                    src={topUpWorker.avatarUrl}
                    name={topUpWorker.name}
                    className="size-10 rounded-xl"
                  />
                  <div>
                    <p className="font-extrabold text-navy">{topUpWorker.name}</p>
                    <p className="text-[10px] text-slate-400">{topUpWorker.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Current Wallet
                  </p>
                  <p className="font-black text-navy">
                    Rs. {topUpWorker.walletBalance.toLocaleString()}
                  </p>
                </div>
              </div>

              <form onSubmit={handleTopUpSubmit} className="mt-4 space-y-4 text-xs">
                {/* Quick Preset Buttons */}
                <div>
                  <label className="mb-1.5 block font-bold text-navy">
                    Quick Select Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 500, 1000, 2000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTopUpAmount(String(preset))}
                        className={`rounded-xl py-2 text-center text-xs font-extrabold transition ${
                          topUpAmount === String(preset)
                            ? "bg-teal text-white shadow-sm ring-2 ring-teal/30"
                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-teal/50 hover:bg-white"
                        }`}
                      >
                        +Rs. {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block font-bold text-navy">
                    Amount to Add (PKR) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400">
                      Rs.
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="1000000"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      placeholder="e.g. 500"
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-black text-navy outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
                    />
                  </div>
                  {Number(topUpAmount) > 0 ? (
                    <p className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Projected New Balance:</span>
                      <span className="font-extrabold text-teal">
                        Rs. {(topUpWorker.walletBalance + Number(topUpAmount)).toLocaleString()}
                      </span>
                    </p>
                  ) : null}
                </div>

                {/* Reference / Note */}
                <div>
                  <label className="block font-bold text-navy">
                    Note / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={topUpNote}
                    onChange={(e) => setTopUpNote(e.target.value)}
                    placeholder="e.g. Cash received at office, Performance bonus"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
                  />
                </div>

                {topUpSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-teal/30 bg-teal/10 p-3 text-xs font-bold text-teal">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{topUpSuccess}</span>
                  </div>
                )}

                {topUpError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{topUpError}</span>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={topUpLoading}
                    onClick={() => {
                      setTopUpWorker(null);
                      setTopUpAmount("500");
                      setTopUpNote("");
                      setTopUpError(null);
                      setTopUpSuccess(null);
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={topUpLoading || !Number(topUpAmount) || Number(topUpAmount) <= 0}
                    className="flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="size-4" />
                    {topUpLoading ? "Crediting..." : `Top Up Rs. ${Number(topUpAmount || 0).toLocaleString()}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
  );
}
