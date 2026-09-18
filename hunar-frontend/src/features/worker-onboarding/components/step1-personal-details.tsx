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
    <div className="flex flex-col justify-between flex-1 space-y-5 sm:space-y-6">
      <div className="space-y-4">
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-teal">
            Basic Information
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl leading-tight">
            Tell us about yourself
          </h2>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Enter your basic information and portrait photo to get started.
          </p>
        </div>

        {/* Profile Photo Avatar Card */}
        <div className="rounded-2xl bg-white p-2">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              {formData.profilePhoto ? (
                <div className="relative size-16 sm:size-18 overflow-hidden rounded-full border-2 border-teal bg-white shadow-xs ring-2 ring-teal/15">
                  <Image
                    src={formData.profilePhoto}
                    alt={formData.fullName || "Worker Avatar"}
                    fill
                    className="object-cover object-top"
                    sizes="72px"
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex size-16 sm:size-18 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-teal/40 bg-white text-teal shadow-xs transition-all hover:border-teal hover:bg-teal/10"
                >
                  <User className="size-7 text-teal" />
                </div>
              )}

              {formData.profilePhoto && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-white bg-success text-white shadow-xs"
                  title="Photo uploaded"
                >
                  <Check className="size-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Actions & Guidelines */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-navy">
                  Face Portrait <span className="text-error">*</span>
                </span>
                <span className="rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-xs font-semibold text-teal">
                  {formData.profilePhoto ? "✓ Attached" : "Required"}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
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
                  className="h-8 sm:h-9 rounded-full border-teal bg-teal/10 px-3 text-xs sm:text-sm font-bold text-teal hover:bg-teal/20"
                >
                  <Upload className="mr-1.5 size-3.5" />
                  {formData.profilePhoto ? "Change" : "Upload Photo"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 sm:h-9 rounded-full border-slate-300 px-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Camera className="mr-1.5 size-3.5" />
                  Selfie
                </Button>
                {formData.profilePhoto && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removePhoto}
                    className="h-8 sm:h-9 rounded-full px-2.5 text-xs font-semibold text-error hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              {photoMessage && (
                <p className="text-xs font-medium text-error">{photoMessage}</p>
              )}
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="full-name"
              className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
            >
              Full Name <span className="text-error">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="full-name"
                type="text"
                value={formData.fullName}
                onChange={(e) => updateFormData({ fullName: e.target.value })}
                placeholder="e.g. Tariq Mehmood"
                className="h-11 sm:h-12 rounded-full pl-10 text-sm sm:text-base shadow-2xs"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label
              htmlFor="phone"
              className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
            >
              Phone Number <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 select-none border-r border-slate-300 pr-2 text-sm font-bold text-slate-700">
                +92
              </span>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData({ phone: e.target.value })}
                placeholder="03xx-xxxxxxx"
                className="h-11 sm:h-12 rounded-full pl-16 text-sm sm:text-base font-medium text-slate-800 shadow-2xs focus:border-teal"
              />
            </div>
          </div>

          {/* City & Email 2-col */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="city"
                className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
              >
                City
              </label>
              <select
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData({ city: e.target.value })}
                className="h-11 sm:h-12 w-full rounded-full border border-slate-200 bg-white px-3.5 text-sm sm:text-base font-medium text-slate-800 shadow-2xs focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              >
                <option value="Peshawar">Peshawar</option>
                <option value="Mardan">Mardan</option>
                <option value="Charsadda">Charsadda</option>
                <option value="Nowshera">Nowshera</option>
                <option value="Swabi">Swabi</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
              >
                Email (Optional)
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                placeholder="e.g. tariq@pro.pk"
                className="h-11 sm:h-12 rounded-full px-3.5 text-sm sm:text-base shadow-2xs"
              />
            </div>
          </div>
        </div>

        {stepError && (
          <div className="flex items-center gap-2 rounded-xl bg-error/10 p-2.5 text-sm font-medium text-error">
            <AlertCircle className="size-4 shrink-0" />
            <span>{stepError}</span>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="pt-4 pb-1">
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          className="h-12 sm:h-13 w-full rounded-full bg-teal text-base font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 transition-all"
        >
          <span>Continue to Skills</span>
          <ArrowRight className="ml-2 size-4.5 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
