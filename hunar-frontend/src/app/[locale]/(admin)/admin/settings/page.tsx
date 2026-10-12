"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { adminApi } from "@/features/admin/api/admin-api";
import type { PlatformSettings } from "@/types/admin";
import { sanitizePriceInput } from "@/lib/money";
import { Check, Settings, ShieldCheck } from "lucide-react";

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
      .then(setSettings)
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Failed to load settings"),
      );
  }, [reloadKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || saving) return;
    const sanitizedSettings: PlatformSettings = {
      ...settings,
      commissionRate: Number(settings.commissionRate) || 0,
      defaultSearchRadiusKm: Number(settings.defaultSearchRadiusKm) || 0,
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
      <AdminShell>
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
      </AdminShell>
    );
  }

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
    </AdminShell>
  );
}
