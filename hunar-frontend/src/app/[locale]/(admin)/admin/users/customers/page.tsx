"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { adminApi } from "@/features/admin/api/admin-api";
import type { CustomerUser } from "@/types/admin";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Eye,
  Filter,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [actionCustomer, setActionCustomer] = useState<CustomerUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => {
    adminApi
      .listCustomers({ limit: 100 })
      .then((res) => setCustomers(res.items))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          c.email.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "ALL" ? true : c.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [customers, search, statusFilter],
  );

  const handleToggleStatus = () => {
    if (!actionCustomer) return;

    const suspending = actionCustomer.status === "ACTIVE";
    void (suspending
      ? adminApi.suspendCustomer(actionCustomer.id, suspendReason)
      : adminApi.reactivateCustomer(actionCustomer.id)
    ).catch(() => undefined);

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === actionCustomer.id) {
          const newStatus = c.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          return {
            ...c,
            status: newStatus,
            internalNotes:
              newStatus === "SUSPENDED"
                ? `Suspended by admin: ${suspendReason || "No reason given"}`
                : c.internalNotes,
          };
        }
        return c;
      })
    );

    setActionCustomer(null);
    setSuspendReason("");
  };

  return (
    <AdminShell>
      <div className="space-y-6">
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
                All ({customers.length})
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
                {filtered.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-navy text-xs font-bold text-white shadow-sm">
                          {customer.name.charAt(0)}
                        </div>
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
                        <span>{customer.ratingGiven}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                          customer.status === "ACTIVE"
                            ? "border-teal/20 bg-teal/10 text-teal"
                            : "border-red-200 bg-red-100 text-red-700"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(customer)}
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
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-navy text-xl font-bold text-white">
                    {selectedCustomer.name.charAt(0)}
                  </div>
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

        {/* Suspend / Reactivate Confirmation Modal */}
        {actionCustomer ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-error">
                <AlertCircle className="size-6 shrink-0" />
                <h3 className="text-lg font-extrabold text-navy">
                  Confirm Account Action
                </h3>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Are you sure you want to{" "}
                <strong className="text-navy">
                  {actionCustomer.status === "ACTIVE"
                    ? "SUSPEND"
                    : "REACTIVATE"}
                </strong>{" "}
                the account for <strong className="text-navy">{actionCustomer.name}</strong>?
              </p>

              {actionCustomer.status === "ACTIVE" ? (
                <div className="mt-4 space-y-1.5">
                  <label className="block text-xs font-semibold text-navy">
                    Reason for Suspension (Required)
                  </label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Enter reason for suspending this customer account..."
                    className="h-20 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal"
                  />
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActionCustomer(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md ${
                    actionCustomer.status === "ACTIVE"
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
    </AdminShell>
  );
}
