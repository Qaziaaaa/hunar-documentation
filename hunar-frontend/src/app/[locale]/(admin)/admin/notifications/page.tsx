"use client";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { AlertCircle, Bell, CheckCircle2, ShieldCheck } from "lucide-react";

export default function NotificationsPage() {
  const notifications = [
    { id: "n1", title: "New Worker Verification Submitted", desc: "Farhan Saeed submitted CNIC identity documents.", time: "10 mins ago", unread: true },
    { id: "n2", title: "Dispute Report Filed", desc: "Usman Ali filed dispute on Job #804.", time: "2 hours ago", unread: true },
    { id: "n3", title: "Withdrawal Requested", desc: "Mohammad Rashid requested Rs. 15,000 payout.", time: "1 day ago", unread: false },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <Bell className="size-3.5" /> Notifications Center
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            System Alerts & Operational Notifications
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Real-time notifications for pending verifications, disputes, and withdrawals
          </p>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-center justify-between rounded-2xl border p-4 shadow-sm transition ${
                n.unread ? "border-teal/30 bg-teal/5" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-navy text-white">
                  <Bell className="size-4 text-teal-300" />
                </div>
                <div>
                  <h4 className="font-extrabold text-navy text-sm">{n.title}</h4>
                  <p className="text-xs text-slate-600">{n.desc}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-400">{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
