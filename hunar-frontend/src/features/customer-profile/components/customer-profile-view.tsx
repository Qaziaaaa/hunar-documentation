"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Lock,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import { PersonalProfileTab } from "./personal-profile-tab";
import { SavedAddressesTab } from "./saved-addresses-tab";
import { NotificationsTab } from "./notifications-tab";
import { SecurityTab } from "./security-tab";
import { MOCK_CUSTOMER_PROFILE } from "../data/mock-profile-data";
import type {
  CustomerProfileData,
  NotificationPreferences,
  SavedAddress,
} from "../types";

export function CustomerProfileView() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const t = useTranslations("CustomerPortal.Profile");

  const [profile, setProfile] = useState<CustomerProfileData>(
    MOCK_CUSTOMER_PROFILE
  );
  const [activeTab, setActiveTab] = useState<
    "personal" | "addresses" | "notifications" | "security"
  >("personal");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const handleUpdateProfile = (updated: Partial<CustomerProfileData>) => {
    setProfile((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleSaveAddress = (address: SavedAddress) => {
    setProfile((prev) => {
      const exists = prev.savedAddresses.some((a) => a.id === address.id);
      let updatedList = exists
        ? prev.savedAddresses.map((a) => (a.id === address.id ? address : a))
        : [...prev.savedAddresses, address];

      if (address.isDefault) {
        updatedList = updatedList.map((a) => ({
          ...a,
          isDefault: a.id === address.id,
        }));
      }

      return {
        ...prev,
        savedAddresses: updatedList,
      };
    });
  };

  const handleSetDefaultAddress = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      savedAddresses: prev.savedAddresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      })),
    }));
  };

  const handleDeleteAddress = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      savedAddresses: prev.savedAddresses.filter((a) => a.id !== id),
    }));
  };

  const handleUpdatePreferences = (updated: NotificationPreferences) => {
    setProfile((prev) => ({
      ...prev,
      notifications: updated,
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-16 animate-in fade-in-50 duration-300 text-[#123B5D]">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 rtl:right-auto rtl:left-6 z-50 bg-[#0F766E] text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="size-5 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1 rtl:text-right">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#123B5D]/10 text-[#123B5D] text-xs font-bold">
              <ShieldCheck className="size-3.5 text-[#0F766E]" />
              {isUrdu ? "ٹائر 1 رہائشی اکاؤنٹ" : "Tier 1 Resident Account"}
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 text-xs font-semibold">
              {isUrdu ? `کسٹمر آئی ڈی ${profile.customerIdBadge}` : `Customer ID ${profile.customerIdBadge}`}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B5D] tracking-tight">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Interactive Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto scrollbar-none pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          className={`pb-3 px-3 border-b-2 text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "personal"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-slate-500 hover:text-[#123B5D]"
          }`}
        >
          <User className="size-4" />
          <span>{t("tabPersonal")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("addresses")}
          className={`pb-3 px-3 border-b-2 text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "addresses"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-slate-500 hover:text-[#123B5D]"
          }`}
        >
          <MapPin className="size-4" />
          <span>{t("tabAddresses")}</span>
          <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-[#123B5D] font-extrabold">
            {profile.savedAddresses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`pb-3 px-3 border-b-2 text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "notifications"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-slate-500 hover:text-[#123B5D]"
          }`}
        >
          <Bell className="size-4" />
          <span>{t("tabNotifications")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`pb-3 px-3 border-b-2 text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "security"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-slate-500 hover:text-[#123B5D]"
          }`}
        >
          <Lock className="size-4" />
          <span>{t("tabSecurity")}</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "personal" && (
        <PersonalProfileTab
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onSaveFeedback={showToast}
        />
      )}

      {activeTab === "addresses" && (
        <SavedAddressesTab
          addresses={profile.savedAddresses}
          onSetDefault={handleSetDefaultAddress}
          onSaveAddress={handleSaveAddress}
          onDeleteAddress={handleDeleteAddress}
          onSaveFeedback={showToast}
        />
      )}

      {activeTab === "notifications" && (
        <NotificationsTab
          preferences={profile.notifications}
          onUpdatePreferences={handleUpdatePreferences}
          onSaveFeedback={showToast}
        />
      )}

      {activeTab === "security" && (
        <SecurityTab
          devices={profile.activeDevices}
          onSaveFeedback={showToast}
        />
      )}
    </div>
  );
}

