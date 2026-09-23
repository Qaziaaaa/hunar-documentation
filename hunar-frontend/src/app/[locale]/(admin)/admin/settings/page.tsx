"use client";

import { useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { MOCK_SETTINGS } from "@/mocks/admin.mock";
import type { PlatformSettings } from "@/types/admin";
import { Check, Settings, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(MOCK_SETTINGS);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <Settings className="size-3.5" /> System Controls
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            Platform Configuration & Settings
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Configure platform commission rates, search radius rules, and feature flags
          </p>
        </div>

        <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="space-y-4">
            <h3 className="font-extrabold text-navy border-b border-slate-100 pb-2 text-sm">
              Commission & Radius Rules
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-navy">
                  Platform Commission Rate (%)
                </label>
                <input
                  type="number"
                  value={settings.commissionRate}
                  onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-navy outline-none focus:border-teal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-navy">
                  Default Worker Search Radius (KM)
                </label>
                <input
                  type="number"
                  value={settings.defaultSearchRadiusKm}
                  onChange={(e) => setSettings({ ...settings, defaultSearchRadiusKm: Number(e.target.value) })}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-navy outline-none focus:border-teal"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4">
            <h3 className="font-extrabold text-navy border-b border-slate-100 pb-2 text-sm">
              Verification & Feature Controls
            </h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireManualVerification}
                onChange={(e) => setSettings({ ...settings, requireManualVerification: e.target.checked })}
                className="size-4 rounded text-teal focus:ring-teal"
              />
              <span className="text-xs font-semibold text-navy">
                Require manual admin CNIC verification before workers can accept jobs
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
            {saved ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                <Check className="size-4" /> Platform Settings Saved!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="rounded-xl bg-navy px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-navy/90"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
