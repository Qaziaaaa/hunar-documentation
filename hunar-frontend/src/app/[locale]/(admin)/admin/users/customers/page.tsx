"use client";

import { useMemo, useRef, useState } from "react";
import { adminApi, SuspendUserPayload } from "@/features/admin/api/admin-api";
import {
  useDebouncedValue,
  useIncrementalDirectory,
  useLoadMoreOnVisible,
} from "@/features/admin/hooks/use-incremental-directory";
import { AdminAvatar } from "@/features/admin/components/admin-avatar";
import type { CustomerUser } from "@/types/admin";
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
  Search,
  Star,
  Users,
  X,
} from "lucide-react";

export default function CustomersPage() {
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [actionCustomer, setActionCustomer] = useState<CustomerUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // First page (10 rows) paints immediately; the rest stream in on scroll.
  const directory = useIncrementalDirectory<CustomerUser>({
    queryKey: ["admin", "customers", debouncedSearch, statusFilter],
    fetchPage: (query) =>
      adminApi.listCustomers({
        ...query,
        search: debouncedSearch,
        status:
          statusFilter === "ACTIVE"
            ? "active"
            : statusFilter === "SUSPENDED"
              ? "suspended"
              : undefined,
      }),
  });
  const customers = directory.items;
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
  const filtered = customers;

  const modalCustomer: SuspendModalUser | null = useMemo(() => {
    if (!actionCustomer) return null;
    return {
      id: actionCustomer.id,
      name: actionCustomer.name,
      phone: actionCustomer.phone,
      role: "CUSTOMER",
      status: actionCustomer.status,
      suspendedUntil: actionCustomer.suspendedUntil,
      suspensionReason: actionCustomer.suspensionReason,
      suspensionType: actionCustomer.suspensionType,
    };
  }, [actionCustomer]);

  const handleConfirmSuspend = async (payload: SuspendUserPayload) => {
    if (!actionCustomer) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.suspendCustomer(actionCustomer.id, payload);
      directory.updateItems((prev) =>
        prev.map((c) => {
          if (c.id === actionCustomer.id) {
            return {
              ...c,
              status: "SUSPENDED",
              suspensionReason: payload.description || payload.reason,
              suspensionType: payload.type,
              suspendedUntil: payload.duration ? payload.duration : null,
              internalNotes: `Suspended [${payload.type}]: ${payload.reason}`,
            };
          }
          return c;
        })
      );
      void directory.refetch();
      setActionCustomer(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to suspend customer account",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!actionCustomer) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.reactivateCustomer(actionCustomer.id);
      directory.updateItems((prev) =>
        prev.map((c) => {
          if (c.id === actionCustomer.id) {
            return {
              ...c,
              status: "ACTIVE",
              suspendedUntil: null,
              suspensionReason: null,
              suspensionType: null,
            };
          }
          return c;
        })
      );
      void directory.refetch();
      setActionCustomer(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to reactivate customer account",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
<div className="space-y-6">
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-500" />
              <span className="text-sm font-bold text-red-700">Customers failed to load</span>
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
                <Users className="size-3.5" />
                User Management
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
              Customer Accounts
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Browse all registered customers, monitor activity, and manage account status
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
              placeholder="Search by customer name, phone, or email..."
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
                  ? `All (${directory.meta?.total ?? customers.length})`
                  : "All"}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  statusFilter === "ACTIVE"
                    ? "bg-teal text-white shadow-sm"
                    : "text-slate-600 hover:text-navy"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("SUSPENDED")}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  statusFilter === "SUSPENDED"
                    ? "bg-red-600 text-white shadow-sm"
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
                  <th className="py-4 px-4">Customer Details</th>
                  <th className="py-4 px-4">Phone & Email</th>
                  <th className="py-4 px-4">Joined Date</th>
                  <th className="py-4 px-4">Jobs Posted</th>
                  <th className="py-4 px-4">Total Spent</th>
                  <th className="py-4 px-4">Avg Rating</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <TableRowsSkeleton colSpan={8} label="Loading customers" />
                ) : filtered.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <AdminAvatar
                          src={customer.avatarUrl}
                          name={customer.name}
                          className="size-10 rounded-xl"
                        />
                        <div>
                          <p className="font-extrabold text-navy">{customer.name}</p>
                          <p className="text-[10px] text-slate-400">ID: {customer.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-700">{customer.phone}</p>
                      <p className="text-[10px] text-slate-400">{customer.email}</p>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-600">
                      {customer.joinDate}
                    </td>
                    <td className="py-4 px-4 font-bold text-navy">
                      {customer.jobsPosted} jobs
                    </td>
                    <td className="py-4 px-4 font-extrabold text-teal">
                      Rs. {customer.totalSpent.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 font-bold text-navy">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span>
                          {customer.ratingGiven > 0
                            ? customer.ratingGiven.toFixed(1)
                            : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {customer.status === "ACTIVE" ? (
                        <span className="inline-flex rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-teal">
                          ACTIVE
                        </span>
                      ) : (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-red-700">
                            {customer.suspensionType === "TEMPORARY" ? (
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
                          {customer.suspensionReason && (
                            <span
                              className="max-w-[140px] truncate text-[10px] text-slate-500"
                              title={customer.suspensionReason}
                            >
                              {customer.suspensionReason}
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
                            setSelectedCustomer(customer);
                            void adminApi.getCustomerDetail(customer.id).then((full) => {
                              setSelectedCustomer((prev) => (prev ? { ...prev, ...full } : full));
                            }).catch(() => undefined);
                          }}
                          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                          title="View Profile Details"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActionCustomer(customer)}
                          className={`flex size-8 items-center justify-center rounded-lg transition ${
                            customer.status === "ACTIVE"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                          title={
                            customer.status === "ACTIVE"
                              ? "Suspend Account"
                              : "Reactivate Account"
                          }
                        >
                          {customer.status === "ACTIVE" ? (
                            <Ban className="size-4" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      No customers match these filters.
                    </td>
                  </tr>
                ) : null}
                {directory.hasNextPage ? (
                  <tr ref={loadMoreRef}>
                    <td colSpan={8} className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => void directory.fetchNextPage()}
                        disabled={directory.isFetchingNextPage}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        {directory.isFetchingNextPage
                          ? "Loading more…"
                          : `Load more (${customers.length} of ${directory.meta?.total ?? customers.length})`}
                      </button>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedCustomer ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-extrabold text-navy">
                  Customer Profile Audit
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <AdminAvatar
                    src={selectedCustomer.avatarUrl}
                    name={selectedCustomer.name}
                    className="size-14 rounded-2xl text-xl"
                  />
                  <div>
                    <h4 className="text-base font-extrabold text-navy">
                      {selectedCustomer.name}
                    </h4>
                    <p className="text-slate-500">{selectedCustomer.phone}</p>
                    <p className="text-slate-400">{selectedCustomer.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Total Jobs Posted
                    </p>
                    <p className="mt-1 text-lg font-black text-navy">
                      {selectedCustomer.jobsPosted}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Total Spent
                    </p>
                    <p className="mt-1 text-lg font-black text-teal">
                      Rs. {selectedCustomer.totalSpent.toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedCustomer.internalNotes ? (
                  <div className="rounded-xl border border-orange/20 bg-orange/10 p-3 text-orange">
                    <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase">
                      <AlertCircle className="size-3.5" /> Internal Admin Notes
                    </p>
                    <p className="mt-1 text-xs font-semibold">
                      {selectedCustomer.internalNotes}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
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
          isOpen={!!actionCustomer}
          user={modalCustomer}
          onClose={() => setActionCustomer(null)}
          onConfirmSuspend={handleConfirmSuspend}
          onConfirmReactivate={handleConfirmReactivate}
          isSubmitting={isSubmitting}
        />
      </div>
  );
}
