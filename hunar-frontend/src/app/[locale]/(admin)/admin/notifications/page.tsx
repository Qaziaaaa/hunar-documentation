"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, AlertCircle, RefreshCw, Inbox } from "lucide-react";
import { adminApi } from "@/features/admin/api/admin-api";
import type { AdminNotification } from "@/types/admin";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async (active: Filter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listNotifications({
        limit: 50,
        ...(active === "unread" ? { isRead: false } : {}),
      });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  const unreadIds = items.filter((n) => !n.isRead).map((n) => n.id);

  const markAllRead = async () => {
    if (unreadIds.length === 0 || marking) return;
    setMarking(true);
    try {
      await adminApi.markNotificationsRead(unreadIds);
      await load(filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark notifications as read.");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <Bell className="size-3.5" /> Notifications Center
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            System Alerts &amp; Operational Notifications
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Real-time notifications for pending verifications, disputes, and withdrawals
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadIds.length === 0 || marking}
          className="inline-flex items-center gap-2 rounded-xl border border-teal/30 bg-teal/10 px-4 py-2 text-xs font-bold text-teal transition hover:bg-teal/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCheck className="size-4" />
          {marking ? "Marking…" : `Mark ${unreadIds.length || "all"} unread as read`}
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filter === f
                ? "bg-navy text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-500 hover:border-teal/30"
            }`}
          >
            {f === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => void load(filter)}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 font-bold text-red-700 transition hover:bg-red-100"
          >
            <RefreshCw className="size-3.5" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
          <Inbox className="size-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">
            {filter === "unread" ? "No unread notifications." : "No notifications yet."}
          </p>
          <p className="text-xs text-slate-400">
            Operational events (verifications, disputes, payouts) will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm transition ${
                n.isRead
                  ? "border-slate-200 bg-white"
                  : "border-teal/30 bg-teal/5"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy text-white">
                  <Bell className="size-4 text-teal-300" />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-extrabold text-navy">{n.title}</h4>
                  <p className="text-xs text-slate-600">{n.body}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[11px] font-bold text-slate-400">
                  {timeAgo(n.createdAt)}
                </span>
                {n.isRead ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Read
                  </span>
                ) : (
                  <span className="rounded-full bg-teal px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                    Unread
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
