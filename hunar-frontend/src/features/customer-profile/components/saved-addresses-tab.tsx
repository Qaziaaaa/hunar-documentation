"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Edit2,
  Home,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { AddAddressModal } from "./add-address-modal";
import type { SavedAddress } from "../types";

interface SavedAddressesTabProps {
  addresses: SavedAddress[];
  onSetDefault: (id: string) => void;
  onSaveAddress: (address: SavedAddress) => void;
  onDeleteAddress: (id: string) => void;
  onSaveFeedback: (msg: string) => void;
}

export function SavedAddressesTab({
  addresses,
  onSetDefault,
  onSaveAddress,
  onDeleteAddress,
  onSaveFeedback,
}: SavedAddressesTabProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(
    null
  );

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setModalOpen(true);
  };

  const handleSave = (addr: SavedAddress) => {
    onSaveAddress(addr);
    if (isUrdu) {
      onSaveFeedback(
        editingAddress
          ? `ایڈریس "${addr.label}" کامیابی سے اپ ڈیٹ ہو گیا!`
          : `نیا ایڈریس "${addr.label}" شامل کر لیا گیا!`
      );
    } else {
      onSaveFeedback(
        editingAddress
          ? `Updated "${addr.label}" address!`
          : `Added new address "${addr.label}"!`
      );
    }
  };

  const handleDelete = (addr: SavedAddress) => {
    const confirmMsg = isUrdu
      ? `کیا آپ واقعی "${addr.label}" پتہ حذف کرنا چاہتے ہیں؟`
      : `Are you sure you want to delete "${addr.label}"?`;

    if (confirm(confirmMsg)) {
      onDeleteAddress(addr.id);
      onSaveFeedback(
        isUrdu
          ? `"${addr.label}" محفوظ پتوں سے ہٹا دیا گیا۔`
          : `Removed "${addr.label}" from saved addresses.`
      );
    }
  };

  const getTagIcon = (tag: SavedAddress["tag"]) => {
    switch (tag) {
      case "home":
        return Home;
      case "office":
        return Building2;
      case "parents":
        return Users;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="rtl:text-right">
            <h2 className="text-base sm:text-lg font-bold text-[#123B5D]">
              {isUrdu ? `محفوظ سروس ایڈریسز (${addresses.length})` : `Saved Service Addresses (${addresses.length})`}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isUrdu
                ? "پشاور میں وہ پتے منتخب یا تبدیل کریں جہاں تصدیق شدہ ماہرین بھیجے جائیں۔"
                : "Select or manage addresses where verified technicians will be dispatched in Peshawar."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98] cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="size-4" />
            <span>{isUrdu ? "+ نیا پتہ شامل کریں" : "+ Add New Address"}</span>
          </button>
        </div>

        {/* Address Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-6">
          {addresses.map((addr) => {
            const Icon = getTagIcon(addr.tag);
            return (
              <div
                key={addr.id}
                className={`flex flex-col justify-between p-5 rounded-2xl bg-white border transition-all duration-200 hover:shadow-md ${
                  addr.isDefault
                    ? "border-[#0F766E] ring-2 ring-[#0F766E]/10 shadow-sm"
                    : "border-slate-200 shadow-2xs hover:border-slate-300"
                }`}
              >
                <div className="space-y-3 rtl:text-right">
                  {/* Top Row: Icon, Label & Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-xl bg-slate-100 text-[#123B5D] flex items-center justify-center shrink-0">
                        <Icon className="size-4 stroke-[2.2]" />
                      </div>
                      <span className="text-sm font-bold text-[#123B5D] truncate">
                        {addr.label}
                      </span>
                    </div>

                    {addr.isDefault ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold shrink-0">
                        {isUrdu ? "بنیادی پتہ" : "Primary"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-semibold shrink-0">
                        {isUrdu ? "ثانوی" : "Secondary"}
                      </span>
                    )}
                  </div>

                  {/* Full Address */}
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {addr.fullAddress}
                  </p>

                  {/* Landmark */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="size-3.5 text-[#0F766E] shrink-0" />
                    <span className="truncate">
                      {isUrdu ? `قریبی نشانی: ${addr.landmark}` : `Landmark: ${addr.landmark}`}
                    </span>
                  </div>

                  {/* Coordinates Pill */}
                  <div className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-[11px] font-mono text-slate-500 gap-1.5 shadow-2xs">
                    <span className="size-1.5 rounded-full bg-[#0F766E]" />
                    <span>
                      GPS: {addr.latitude.toFixed(4)}° N, {addr.longitude.toFixed(4)}° E
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {addr.isDefault ? (
                    <span className="text-xs text-[#0F766E] font-bold flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" />
                      <span>{isUrdu ? "بنیادی پتہ" : "Default Address"}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSetDefault(addr.id);
                        onSaveFeedback(
                          isUrdu
                            ? `"${addr.label}" اب آپ کا بنیادی پتہ بن گیا ہے۔`
                            : `"${addr.label}" is now your default address.`
                        );
                      }}
                      className="text-xs text-[#123B5D] hover:text-[#0F766E] font-bold hover:underline cursor-pointer"
                    >
                      {isUrdu ? "بنیادی بنائیں" : "Make Default"}
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(addr)}
                      className="p-1.5 text-slate-400 hover:text-[#0F766E] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title={isUrdu ? "پتہ تبدیل کریں" : "Edit Address"}
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(addr)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title={isUrdu ? "پتہ حذف کریں" : "Delete Address"}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AddAddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaveAddress={handleSave}
        initialAddress={editingAddress}
      />
    </div>
  );
}

