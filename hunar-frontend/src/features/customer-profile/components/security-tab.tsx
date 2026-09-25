"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import type { ActiveDevice } from "../types";

interface SecurityTabProps {
  devices: ActiveDevice[];
  onSaveFeedback: (msg: string) => void;
}

export function SecurityTab({ devices, onSaveFeedback }: SecurityTabProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeDeviceList, setActiveDeviceList] = useState(devices);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      alert(
        isUrdu
          ? "نیا پاس ورڈ کم از کم 8 حروف پر مشتمل ہونا چاہیے۔"
          : "New password must be at least 8 characters long."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      alert(
        isUrdu ? "پاس ورڈز ایک دوسرے سے مماثل نہیں ہیں۔" : "Passwords do not match."
      );
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onSaveFeedback(
      isUrdu
        ? "اکاؤنٹ پاس ورڈ کامیابی سے تبدیل ہو گیا!"
        : "Account password updated successfully!"
    );
  };

  const handleSignOutOtherDevices = () => {
    setActiveDeviceList(activeDeviceList.filter((d) => d.isCurrent));
    onSaveFeedback(
      isUrdu
        ? "دیگر تمام ڈیوائسز سے لاگ آؤٹ کر دیا گیا۔"
        : "Signed out of all other devices."
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 Cols): Password Management */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 flex flex-col justify-between rtl:text-right">
          <div>
            <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
              <div className="size-10 rounded-2xl bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center shrink-0">
                <KeyRound className="size-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#123B5D]">
                  {isUrdu ? "اکاؤنٹ کا پاس ورڈ" : "Account Password"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isUrdu ? "آخری بار 32 دن پہلے تبدیل کیا گیا" : "Last updated 32 days ago"}
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="py-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#123B5D] block mb-1">
                  {isUrdu ? "موجودہ پاس ورڈ" : "Current Password"}
                </label>
                <div className="relative">
                  <Lock className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-3.5 rtl:pr-10 rtl:pl-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all shadow-2xs rtl:text-right"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#123B5D] block mb-1">
                  {isUrdu ? "نیا پاس ورڈ" : "New Password"}
                </label>
                <div className="relative">
                  <Lock className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder={isUrdu ? "کم از کم 8 حروف" : "Minimum 8 characters"}
                    className="w-full h-11 pl-10 pr-3.5 rtl:pr-10 rtl:pl-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all shadow-2xs rtl:text-right"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#123B5D] block mb-1">
                  {isUrdu ? "نئے پاس ورڈ کی تصدیق" : "Confirm New Password"}
                </label>
                <div className="relative">
                  <Lock className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder={isUrdu ? "دوبارہ نیا پاس ورڈ لکھیں" : "Repeat new password"}
                    className="w-full h-11 pl-10 pr-3.5 rtl:pr-10 rtl:pl-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all shadow-2xs rtl:text-right"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#123B5D] hover:bg-[#0c2a44] text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
              >
                {isUrdu ? "پاس ورڈ اپ ڈیٹ کریں" : "Update Password"}
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              {isUrdu
                ? "مدد چاہیے؟ WorkerFIX کی 24/7 کسٹمر ہیلپ لائن سے رابطہ کریں۔"
                : "Need assistance? Contact Orderworker 24/7 Support Helpline"}
            </span>
          </div>
        </div>

        {/* Right Column (6 Cols): Active Sessions & Danger Zone */}
        <div className="lg:col-span-6 space-y-6 rtl:text-right">
          {/* Active Devices */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                  <Laptop className="size-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#123B5D]">
                    {isUrdu ? "فعال سیشنز" : "Active Sessions"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isUrdu
                      ? "آپ کے اکاؤنٹ سے فی الوقت لاگ ان ڈیوائسز"
                      : "Devices currently signed into your account"}
                  </p>
                </div>
              </div>

              {activeDeviceList.length > 1 && (
                <button
                  type="button"
                  onClick={handleSignOutOtherDevices}
                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  {isUrdu ? "دیگر سے لاگ آؤٹ" : "Sign Out Others"}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {activeDeviceList.map((dev) => (
                <div
                  key={dev.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-white border border-slate-200 text-[#123B5D] flex items-center justify-center shrink-0">
                      {dev.deviceName.toLowerCase().includes("iphone") ? (
                        <Smartphone className="size-4" />
                      ) : (
                        <Laptop className="size-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#123B5D]">
                          {dev.deviceName}
                        </span>
                        {dev.isCurrent && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {isUrdu ? "موجودہ ڈیوائس" : "Current Device"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {dev.location} • {dev.lastActive}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50/50 rounded-3xl border border-red-200/80 p-5 sm:p-7 space-y-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="size-5" />
              <h3 className="text-sm font-bold">
                {isUrdu ? "کسٹمر اکاؤنٹ ڈیلیٹ کریں" : "Delete Customer Account"}
              </h3>
            </div>
            <p className="text-xs text-red-600/90 leading-relaxed">
              {isUrdu
                ? "آپ کا پروفائل، محفوظ پتے اور تمام بکنگ ریکارڈ ہمیشہ کے لیے حذف کر دیے جائیں گے۔ یہ عمل ناقابلِ واپسی ہے۔"
                : "Permanently delete your profile, saved addresses, and active booking history. This action cannot be undone."}
            </p>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              {isUrdu ? "میرا اکاؤنٹ ڈیلیٹ کریں" : "Delete My Account"}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-center">
            <div className="size-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="size-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#123B5D]">
                {isUrdu ? "کیا آپ کو مکمل یقین ہے؟" : "Are you absolutely sure?"}
              </h3>
              <p className="text-xs text-slate-500">
                {isUrdu
                  ? "اس سے آپ کا اکاؤنٹ، رابطہ نمبرز اور پشاور کی تمام سروس ہسٹری ختم ہو جائے گی۔"
                  : "This will delete your account, contact details, and all address history in Peshawar."}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {isUrdu ? "منسوخ کریں" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  alert(
                    isUrdu
                      ? "اکاؤنٹ ڈیلیٹ کرنے کی درخواست درج کر لی گئی ہے۔"
                      : "Account deletion request submitted."
                  );
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
              >
                {isUrdu ? "ہاں، ڈیلیٹ کریں" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

