"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/features/admin/api/admin-api";
import type { PlatformSettings } from "@/types/admin";
import { sanitizePriceInput } from "@/lib/money";
import { Check, Settings, ShieldCheck } from "lucide-react";

// The API stores commission_rate as a fraction (0.1 = 10%); the form edits percent.
const toFormPercent = (rate: number) => {
  const r = Number(rate);
  if (!Number.isFinite(r)) return 10;
  return r > 1 ? r : r * 100;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getSettings()
      .then((s) => setSettings({ ...s, commissionRate: toFormPercent(s.commissionRate) }))
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Failed to load settings"),
      );
  }, [reloadKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || saving) return;
    const radius = Number(settings.defaultSearchRadiusKm);
    const maxOffers = Number(settings.maxActiveOffersPerWorker);
    const maxNegative = Number(settings.walletMaxNegativeBalance);
    const sanitizedSettings: PlatformSettings = {
      ...settings,
      commissionRate: Math.min(1, Math.max(0, (Number(settings.commissionRate) || 0) / 100)),
      defaultSearchRadiusKm:
        Number.isFinite(radius) && radius > 0 ? Math.round(radius) : 10,
      maxActiveOffersPerWorker:
        Number.isFinite(maxOffers) && maxOffers >= 1
          ? Math.min(100, Math.floor(maxOffers))
          : 1,
      walletMaxNegativeBalance: Number.isFinite(maxNegative)
        ? Math.min(0, Math.max(-100000, Math.round(maxNegative)))
        : -500,
    };
    setSaving(true);
    setSaveState("idle");
    setSaveError(null);
    try {
      await adminApi.saveSettings(sanitizedSettings);
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
<div className="mx-auto max-w-3xl space-y-6">
          {loadError ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <span className="text-sm font-bold text-red-700">
                Settings failed to load: {loadError}
              </span>
              <button
                type="button"
                onClick={() => {
                  setLoadError(null);
                  setReloadKey((k) => k + 1);
                }}
                className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-500">Loading platform settings...</p>
          )}
        </div>
);
  }

  return (
    
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
            Configure commission, search radius, wallet limits, and worker offer controls — all
            applied by the backend at runtime
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
                  value={settings.commissionRate ?? ""}
                  onChange={(e) => {
                    const cleaned = sanitizePriceInput(e.target.value);
                    setSettings({ ...settings, commissionRate: cleaned === "" ? ("" as any) : Number(cleaned) });
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-navy outline-none focus:border-teal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-navy">
                  Default Worker Search Radius (KM)
                </label>
                <input
                  type="number"
                  value={settings.defaultSearchRadiusKm ?? ""}
                  onChange={(e) => {
                    const cleaned = sanitizePriceInput(e.target.value);
                    setSettings({ ...settings, defaultSearchRadiusKm: cleaned === "" ? ("" as any) : Number(cleaned) });
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-navy outline-none focus:border-teal"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4">
            <h3 className="font-extrabold text-navy border-b border-slate-100 pb-2 text-sm">
              Wallet Rules
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-navy">
                  Maximum Negative Wallet Balance (Rs.)
                </label>
                <input
                  type="number"
                  value={settings.walletMaxNegativeBalance ?? ""}
                  onChange={(e) => {
                    const cleaned = sanitizePriceInput(e.target.value);
                    setSettings({
                      ...settings,
                      walletMaxNegativeBalance:
                        cleaned === "" ? ("" as any) : Number(cleaned),
                    });
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-navy outline-none focus:border-teal"
                />
                <p className="text-[11px] leading-snug text-slate-500">
                  Workers may go this far into debt on commission holds (e.g. −500). Below the
                  limit they are automatically set offline. 0 = no debt allowed.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4">
            <h3 className="font-extrabold text-navy border-b border-slate-100 pb-2 text-sm">
              Worker Controls
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-navy">
                  Max Active Offers Per Worker
                </label>
                <input
                  type="number"
                  value={settings.maxActiveOffersPerWorker ?? ""}
                  onChange={(e) => {
                    const cleaned = sanitizePriceInput(e.target.value);
                    setSettings({
                      ...settings,
                      maxActiveOffersPerWorker:
                        cleaned === "" ? ("" as any) : Number(cleaned),
                    });
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-navy outline-none focus:border-teal"
                />
                <p className="text-[11px] leading-snug text-slate-500">
                  How many unanswered offers a worker may have open at once (blocks offer spam).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
            {saveState === "saved" ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                <Check className="size-4" /> Platform Settings Saved!
              </span>
            ) : saveState === "error" ? (
              <span className="text-xs font-bold text-red-600">
                Save failed: {saveError}
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-navy px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    
  );
}
