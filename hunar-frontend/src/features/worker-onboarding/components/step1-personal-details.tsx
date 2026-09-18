"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkerProfileFormData } from "../types";

export function Step1PersonalDetails({
  formData,
  updateFormData,
  onNext,
  stepError,
}: {
  formData: WorkerProfileFormData;
  updateFormData: (partial: Partial<WorkerProfileFormData>) => void;
  onNext: () => void;
  stepError: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setPhotoMessage("Image size should be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      updateFormData({
        profilePhoto: result,
        profilePhotoName: file.name,
      });
      setPhotoMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    updateFormData({
      profilePhoto: "",
      profilePhotoName: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="block text-[11px] font-bold uppercase tracking-wider text-teal">
          Basic Information
        </span>
        <h2 className="text-xl font-extrabold tracking-tight text-navy sm:text-2xl leading-tight">
          Tell us about yourself
        </h2>
        <p className="text-xs text-muted-foreground">
          Enter your basic information and portrait photo to get started.
        </p>
      </div>

      {/* Profile Photo Avatar Card */}
      <div className="rounded-2xl bg-white p-2">
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {formData.profilePhoto ? (
              <div className="relative size-14 overflow-hidden rounded-full border-2 border-teal bg-white shadow-xs ring-2 ring-teal/15">
                <Image
                  src={formData.profilePhoto}
                  alt={formData.fullName || "Worker Avatar"}
                  fill
                  className="object-cover object-top"
                  sizes="56px"
                />
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex size-14 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-teal/40 bg-white text-teal shadow-xs transition-all hover:border-teal hover:bg-teal/10"
              >
                <User className="size-6 text-teal" />
              </div>
            )}

            {formData.profilePhoto && (
              <div
                className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-white bg-success text-white"
                title="Photo uploaded"
              >
                <Check className="size-3 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Actions & Guidelines */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-navy">
                Face Portrait <span className="text-error">*</span>
              </span>
              <span className="rounded-full border border-teal/20 bg-teal/10 px-2 py-0.2 text-[9px] font-semibold text-teal">
                {formData.profilePhoto ? "✓ Attached" : "Required"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 rounded-full border-teal bg-teal/10 px-2.5 text-[11px] font-bold text-teal hover:bg-teal/20"
              >
                <Upload className="mr-1 size-3" />
                {formData.profilePhoto ? "Change" : "Upload Photo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 rounded-full border-slate-300 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Camera className="mr-1 size-3" />
                Selfie
              </Button>
              {formData.profilePhoto && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removePhoto}
                  className="h-7 rounded-full px-2 text-[11px] font-semibold text-error hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
            {photoMessage && (
              <p className="text-[10px] font-medium text-error">{photoMessage}</p>
            )}
          </div>
        </div>
      </div>

      {/* Input Fields */}
      <div className="space-y-3">
        {/* Full Name */}
        <div className="space-y-1">
          <label
            htmlFor="full-name"
            className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-navy"
          >
            Full Name <span className="text-error">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              id="full-name"
              type="text"
              value={formData.fullName}
              onChange={(e) => updateFormData({ fullName: e.target.value })}
              placeholder="e.g. Tariq Mehmood"
              className="h-10 rounded-full pl-9 text-xs sm:text-sm shadow-2xs"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <label
            htmlFor="phone"
            className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-navy"
          >
            Phone Number <span className="text-error">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 select-none border-r border-slate-300 pr-2 text-xs font-bold text-slate-600">
              +92
            </span>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData({ phone: e.target.value })}
              placeholder="03xx-xxxxxxx"
              className="h-10 rounded-full pl-14 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs focus:border-teal"
            />
          </div>
        </div>

        {/* City & Email 2-col */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label
              htmlFor="city"
              className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-navy"
            >
              City
            </label>
            <select
              id="city"
              value={formData.city}
              onChange={(e) => updateFormData({ city: e.target.value })}
              className="h-10 w-full rounded-full border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            >
              <option value="Peshawar">Peshawar</option>
              <option value="Mardan">Mardan</option>
              <option value="Charsadda">Charsadda</option>
              <option value="Nowshera">Nowshera</option>
              <option value="Swabi">Swabi</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-navy"
            >
              Email (Optional)
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData({ email: e.target.value })}
              placeholder="e.g. tariq@pro.pk"
              className="h-10 rounded-full px-3 text-xs sm:text-sm shadow-2xs"
            />
          </div>
        </div>
      </div>

      {stepError && (
        <div className="flex items-center gap-1.5 rounded-xl bg-error/10 p-2 text-xs font-medium text-error">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {/* Continue Button */}
      <div className="pt-2">
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          className="h-11 sm:h-12 w-full rounded-full bg-teal text-sm font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90"
        >
          <span>Continue to Skills</span>
          <ArrowRight className="ml-1.5 size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
