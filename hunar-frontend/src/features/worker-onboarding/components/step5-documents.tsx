"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkerProfileFormData } from "../types";

export function Step5Documents({
  formData,
  updateFormData,
  onNext,
  onPrev,
  stepError,
}: {
  formData: WorkerProfileFormData;
  updateFormData: (partial: Partial<WorkerProfileFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  stepError: string | null;
}) {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleCnicUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (side === "front") {
        updateFormData({
          cnicFront: result,
          cnicFrontName: file.name,
        });
      } else {
        updateFormData({
          cnicBack: result,
          cnicBackName: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCnic = (side: "front" | "back") => {
    if (side === "front") {
      updateFormData({ cnicFront: "", cnicFrontName: "" });
      if (frontInputRef.current) frontInputRef.current.value = "";
    } else {
      updateFormData({ cnicBack: "", cnicBackName: "" });
      if (backInputRef.current) backInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-navy leading-tight">
            Pakistani Smart CNIC Verification
          </h2>
          <span className="shrink-0 whitespace-nowrap rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[11px] font-bold text-teal">
            NADRA Protected
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload clear photos of your original National Identity Card (Smart CNIC).
        </p>
      </div>

      {/* NADRA Security Banner */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-teal-200 bg-teal/10 p-2.5 text-xs text-navy">
        <ShieldCheck className="size-5 shrink-0 text-teal" />
        <span className="text-xs text-muted-foreground">
          <strong className="text-navy font-bold">256-bit Encrypted:</strong> Identity data is protected strictly for verified payouts & client safety.
        </span>
      </div>

      {/* 13-Digit CNIC Number Input */}
      <div className="space-y-1">
        <label
          htmlFor="cnic-number"
          className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-navy"
        >
          13-Digit CNIC Number (Optional)
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            id="cnic-number"
            type="text"
            value={formData.cnicNumber || ""}
            onChange={(e) => updateFormData({ cnicNumber: e.target.value })}
            placeholder="e.g. 17301-1234567-1"
            className="h-10 pl-9 rounded-full text-xs sm:text-sm font-mono shadow-2xs"
          />
        </div>
      </div>

      {/* CNIC Front & Back Dropzones */}
      <div className="grid grid-cols-2 gap-3">
        {/* CNIC Front Side */}
        <div className="rounded-2xl bg-white p-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-navy">
              🪪 CNIC Front <span className="text-error">*</span>
            </span>
            <span className="rounded-full border border-teal/20 bg-teal/10 px-2 py-0.2 text-[9px] font-bold text-teal">
              {formData.cnicFront ? "✓ Attached" : "Required"}
            </span>
          </div>

          <input
            type="file"
            ref={frontInputRef}
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleCnicUpload(e, "front")}
          />

          {formData.cnicFront ? (
            <div className="space-y-2">
              <div className="relative h-24 w-full overflow-hidden rounded-xl border border-teal/30 bg-slate-100">
                <Image
                  src={formData.cnicFront}
                  alt="CNIC Front"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-medium text-navy">
                  {formData.cnicFrontName || "cnic_front.jpg"}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => frontInputRef.current?.click()}
                    className="h-6 rounded-full border-teal/40 px-2 text-[10px] font-bold text-teal hover:bg-teal/10"
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCnic("front")}
                    className="h-6 rounded-full px-1.5 text-error hover:bg-error/10"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => frontInputRef.current?.click()}
              className="group flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-2 text-center transition-all hover:border-teal hover:bg-teal/5"
            >
              <Upload className="mb-1 size-4 text-teal group-hover:scale-105 transition-transform" />
              <p className="text-xs font-bold text-navy">
                <span className="text-teal underline">Upload Front</span>
              </p>
              <p className="text-[9px] text-muted-foreground">Max 5MB</p>
            </div>
          )}
        </div>

        {/* CNIC Back Side */}
        <div className="rounded-2xl bg-white p-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-navy">
              🪪 CNIC Back <span className="text-error">*</span>
            </span>
            <span className="rounded-full border border-teal/20 bg-teal/10 px-2 py-0.2 text-[9px] font-bold text-teal">
              {formData.cnicBack ? "✓ Attached" : "Required"}
            </span>
          </div>

          <input
            type="file"
            ref={backInputRef}
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleCnicUpload(e, "back")}
          />

          {formData.cnicBack ? (
            <div className="space-y-2">
              <div className="relative h-24 w-full overflow-hidden rounded-xl border border-teal/30 bg-slate-100">
                <Image
                  src={formData.cnicBack}
                  alt="CNIC Back"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-medium text-navy">
                  {formData.cnicBackName || "cnic_back.jpg"}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => backInputRef.current?.click()}
                    className="h-6 rounded-full border-teal/40 px-2 text-[10px] font-bold text-teal hover:bg-teal/10"
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCnic("back")}
                    className="h-6 rounded-full px-1.5 text-error hover:bg-error/10"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => backInputRef.current?.click()}
              className="group flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/60 p-2 text-center transition-all hover:border-teal hover:bg-teal/5"
            >
              <Upload className="mb-1 size-4 text-teal group-hover:scale-105 transition-transform" />
              <p className="text-xs font-bold text-navy">
                <span className="text-teal underline">Upload Back</span>
              </p>
              <p className="text-[9px] text-muted-foreground">Max 5MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Guidelines (1 line) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <span className="text-teal font-semibold">✓ 4 corners visible</span>
        <span className="text-teal font-semibold">✓ No glare / blur</span>
        <span className="text-teal font-semibold">✓ Smart CNIC</span>
      </div>

      {stepError && (
        <div className="flex items-center gap-1.5 rounded-xl bg-error/10 p-2 text-xs font-medium text-error">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onPrev}
          className="h-11 sm:h-12 w-1/3 rounded-full border-2 border-navy text-sm font-bold text-navy hover:bg-slate-50"
        >
          <ArrowLeft className="mr-1 size-3.5 rtl:rotate-180" />
          <span>Back</span>
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          className="h-11 sm:h-12 flex-1 rounded-full bg-teal text-sm font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90"
        >
          <span>Verify & Review</span>
          <ArrowRight className="ml-1 size-3.5 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
