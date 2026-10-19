"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  Camera,
  CheckCircle2,
  Loader2,
  Lock,
  LogIn,
  MapPin,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/loading-state";
import { CustomerProfileSkeleton } from "./customer-profile-skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { resolveAvatarUrl } from "@/lib/avatar";
import { PersonalProfileTab } from "./personal-profile-tab";
import { SavedAddressesTab } from "./saved-addresses-tab";
import { NotificationsTab } from "./notifications-tab";
import { SecurityTab } from "./security-tab";
import {
  getCustomerProfile,
  updateCustomerProfile,
  uploadCustomerAvatar,
} from "../api/customer-profile-api";
import {
  getSavedAddresses,
  saveSavedAddresses,
  deleteSavedAddress,
} from "../services/saved-addresses-storage";
import type {
  CustomerProfileData,
  NotificationPreferences,
  SavedAddress,
} from "../types";

const initialEmptyProfile: CustomerProfileData = {
  id: "",
  customerIdBadge: "CUST-000",
  fullName: "",
  email: "",
  isEmailVerified: false,
  phone: "",
  isPhoneVerified: true,
  isCnicVerified: false,
  avatarUrl: "",
  avatarInitials: "C",
  memberTier: "Standard Member",
  joinedDate: "Recently",
  completedJobsCount: 0,
  trustScore: "Unrated",
  rating: 0,
  primaryCity: "",
  preferredLanguage: "ur",
  preferredServiceHours: "anytime",
  savedAddresses: [],
  notifications: {
    instantQuotesSms: true,
    instantQuotesWhatsapp: true,
    technicianArrivalPush: true,
    technicianArrivalInApp: true,
    directPaymentReceiptsEmail: true,
    directPaymentReceiptsSms: false,
    marketingAndTips: false,
  },
  activeDevices: [],
};

export function CustomerProfileView() {
  const queryClient = useQueryClient();
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const t = useTranslations("CustomerPortal.Profile");

  const [profile, setProfile] = useState<CustomerProfileData>(initialEmptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadErrorObj, setLoadErrorObj] = useState<unknown>(null);
  const [activeTab, setActiveTab] = useState<
    "personal" | "addresses" | "notifications" | "security"
  >("personal");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    setLoadErrorObj(null);
    getCustomerProfile()
      .then((data) => {
        setProfile({
          ...data,
          savedAddresses: getSavedAddresses(),
        });
      })
      .catch((err) => {
        console.warn("Failed to load customer profile:", err);
        setLoadErrorObj(err);
        setLoadError(
          err instanceof Error && err.message !== "UNAUTHORIZED"
            ? err.message
            : "Failed to load profile"
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    // Sync client-side saved addresses after hydration
    setProfile((prev) => ({
      ...prev,
      savedAddresses: getSavedAddresses(),
    }));
    loadProfile();
  }, [loadProfile]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => {
      setErrorToast(null);
    }, 4000);
  };

  const handleUpdateProfile = async (updated: Partial<CustomerProfileData>) => {
    setProfile((prev) => ({
      ...prev,
      ...updated,
    }));
    try {
      const saved = await updateCustomerProfile(updated);
      setProfile((prev) => ({
        ...prev,
        ...saved,
      }));
      queryClient.setQueryData(["customer", "profile"], saved);
      void queryClient.invalidateQueries({ queryKey: ["customer", "profile"] });
    } catch (err) {
      console.warn("Error persisting customer profile update:", err);
    }
  };

  const handleAvatarFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError(
        isUrdu
          ? "براہ کرم درست تصویر منتخب کریں (JPG, PNG, WEBP)"
          : "Please select a valid image file (JPG, PNG, WEBP)"
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError(
        isUrdu
          ? "تصویر کا سائز 5MB سے کم ہونا چاہیے"
          : "Image size must be less than 5MB"
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadRes = await uploadCustomerAvatar(file);
      await handleUpdateProfile({ avatarUrl: uploadRes.url });
      showToast(
        isUrdu
          ? "پروفائل تصویر کامیابی سے اپ ڈیٹ ہو گئی!"
          : "Profile picture updated successfully!"
      );
    } catch (err) {
      console.warn("Avatar upload failed:", err);
      showError(
        isUrdu
          ? "تصویر اپ لوڈ کرنے میں خرابی پیش آئی"
          : "Failed to upload profile picture. Please try again."
      );
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

      saveSavedAddresses(updatedList);
      return {
        ...prev,
        savedAddresses: updatedList,
      };
    });
  };

  const handleSetDefaultAddress = (id: string) => {
    setProfile((prev) => {
      const updated = prev.savedAddresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }));
      saveSavedAddresses(updated);
      return {
        ...prev,
        savedAddresses: updated,
      };
    });
  };

  const handleDeleteAddress = (id: string) => {
    const updated = deleteSavedAddress(id);
    setProfile((prev) => ({
      ...prev,
      savedAddresses: updated,
    }));
  };

  const handleUpdatePreferences = (updated: NotificationPreferences) => {
    setProfile((prev) => ({
      ...prev,
      notifications: updated,
    }));
  };

  if (isLoading) {
    return <CustomerProfileSkeleton />;
  }

  if (loadError) {
    const isAuthError =
      loadErrorObj instanceof ApiError &&
      (loadErrorObj.status === 401 || loadErrorObj.status === 403);

    if (isAuthError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-6 py-14 text-center"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn aria-hidden="true" className="size-7" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-navy">
              {isUrdu ? "آپ لاگ ان نہیں ہیں" : "You're not logged in"}
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              {isUrdu
                ? "اپنی پروفائل دیکھنے کے لیے بطور کسٹمر لاگ ان کریں۔"
                : "Please log in as a customer to view your profile."}
            </p>
          </div>
          <Link
            href="/customer/login"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <LogIn className="size-4" />
            {isUrdu ? "کسٹمر لاگ ان" : "Log in as Customer"}
          </Link>
        </div>
      );
    }

    return (
      <ErrorState
        title={isUrdu ? "پروفائل لوڈ کرنے میں ناکامی" : "Unable to load profile"}
        description={
          isUrdu
            ? "کچھ خرابی پیش آئی۔ براہ کرم اپنا نیٹ ورک کنکشن چیک کریں اور دوبارہ کوشش کریں۔"
            : "Something went wrong. Please check your network connection and try again."
        }
        onRetry={loadProfile}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-16 animate-in fade-in-50 duration-300 text-[#123B5D]">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 rtl:right-auto rtl:left-6 z-50 bg-[#0F766E] text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="size-5 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed top-20 right-6 rtl:right-auto rtl:left-6 z-50 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <AlertCircle className="size-5 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{errorToast}</span>
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
              {isUrdu
                ? `کسٹمر آئی ڈی ${profile.customerIdBadge}`
                : `Customer ID ${profile.customerIdBadge}`}
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

      {/* Persistent Customer Profile Header Card (Always visible at top across all tabs) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar & Camera Upload Overlay */}
            <div className="relative group shrink-0">
              <div className="size-16 sm:size-20 rounded-full bg-[#123B5D] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm ring-4 ring-[#123B5D]/10 overflow-hidden relative">
                {profile.avatarUrl ? (
                  <img
                    src={resolveAvatarUrl(profile.avatarUrl)}
                    alt={profile.fullName || (isUrdu ? "کسٹمر" : "Customer")}
                    width={80}
                    height={80}
                    decoding="async"
                    className="size-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : null}
                <span className={profile.avatarUrl ? "sr-only" : ""}>
                  {profile.avatarInitials || "C"}
                </span>

                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white z-10">
                    <Loader2 className="size-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Hidden file input for photo upload */}
              <input
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/*"
                className="hidden"
                type="file"
                onChange={handleAvatarFileSelect}
                aria-label={
                  isUrdu ? "پروفائل تصویر اپ لوڈ کریں" : "Upload profile picture"
                }
              />

              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 size-7 sm:size-8 rounded-full bg-[#0F766E] hover:bg-[#115E59] text-white flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-75 disabled:pointer-events-none"
                title={isUrdu ? "پروفائل تصویر تبدیل کریں" : "Change Profile Photo"}
                aria-label={
                  isUrdu ? "پروفائل تصویر تبدیل کریں" : "Change Profile Photo"
                }
              >
                {isUploadingAvatar ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" />
                )}
              </button>
            </div>

            {/* Profile Info Summary */}
            <div className="flex flex-col min-w-0 rtl:text-right">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-extrabold text-[#123B5D] leading-tight truncate">
                  {profile.fullName || (isUrdu ? "کسٹمر" : "Customer")}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span>{isUrdu ? "گولڈ ممبر" : profile.memberTier}</span>
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                {isUrdu
                  ? `ہنر ممبر بذریعہ ${profile.joinedDate} • ${profile.completedJobsCount} کام مکمل`
                  : `Customer since ${profile.joinedDate} • ${profile.completedJobsCount} Jobs Completed`}
              </p>

              <div className="mt-2 flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                <ShieldCheck className="size-4 shrink-0" />
                <span>
                  {isUrdu
                    ? "WorkerFIX تصدیق شدہ رہائشی (نادرا شناختی کارڈ اور موبائل تصدیق)"
                    : "WorkerFIX Verified Resident (NADRA CNIC & Phone Linked)"}
                </span>
              </div>
            </div>
          </div>

          {/* Trust Score & Rating Pills */}
          <div className="flex items-center gap-4 sm:gap-6 bg-slate-50 border border-slate-200/80 px-5 py-3 rounded-2xl self-start lg:self-auto shadow-2xs">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                {isUrdu ? "اعتمادی اسکور" : "Trust Score"}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-[#123B5D] mt-0.5">
                {profile.trustScore}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                {isUrdu ? "کسٹمر ریٹنگ" : "Rating"}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-[#123B5D] flex items-center justify-center gap-1 mt-0.5">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span>{profile.rating.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Sub-Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Profile navigation tabs"
        className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto scrollbar-none pb-0.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "personal"}
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
          role="tab"
          aria-selected={activeTab === "addresses"}
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
          role="tab"
          aria-selected={activeTab === "notifications"}
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
          role="tab"
          aria-selected={activeTab === "security"}
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

      {/* Tab Panels: Only each tab's input/content card changes below! */}
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
