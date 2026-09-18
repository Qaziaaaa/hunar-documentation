"use client";

import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  FileCheck,
  Loader2,
  MapPin,
  ShieldCheck,
  User,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardStep, WorkerProfileFormData } from "../types";

export function Step6Review({
  formData,
  onPrev,
  onGoToStep,
  onSubmit,
  isSubmitting,
  stepError,
}: {
  formData: WorkerProfileFormData;
  onPrev: () => void;
  onGoToStep: (step: WizardStep) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  stepError: string | null;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-navy leading-tight">
            Review your profile
          </h2>
          <span className="shrink-0 whitespace-nowrap rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[11px] font-bold text-teal">
            Final Step
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Please check your details before submitting for admin verification.
        </p>
      </div>

      <div className="max-h-[350px] space-y-2.5 overflow-y-auto pr-1 text-xs">
        {/* 1. Personal Information & Photo Card */}
        <div className="rounded-2xl bg-white p-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-navy text-xs">
              <User className="size-3.5 text-teal" /> Personal Info
            </span>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="text-xs font-bold text-teal hover:underline"
            >
              [ Edit ]
            </button>
          </div>
          <div className="flex items-center gap-3 border-b border-slate-200/80 pb-2.5 mb-2">
            {formData.profilePhoto ? (
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-teal shadow-2xs">
                <Image
                  src={formData.profilePhoto}
                  alt={formData.fullName || "Worker Avatar"}
                  fill
                  className="object-cover object-top"
                />
              </div>
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <User className="size-5" />
              </div>
            )}
            <div className="leading-tight">
              <span className="block text-xs sm:text-sm font-bold text-navy">
                {formData.fullName || "Not specified"}
              </span>
              <span className="text-[10px] font-semibold text-teal">
                {formData.profilePhoto ? "✓ Photo Attached" : "⚠️ Photo Missing"}
              </span>
            </div>
          </div>
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-semibold text-navy">+92 {formData.phone || "Not set"}</span>
            </div>
            {formData.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold text-navy">{formData.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">City:</span>
              <span className="font-semibold text-navy">{formData.city || "Peshawar"}</span>
            </div>
          </div>
        </div>

        {/* 2. Selected Skills Card */}
        <div className="rounded-2xl bg-white p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-navy text-xs">
              <Wrench className="size-3.5 text-teal" /> Selected Services (
              {formData.skills?.length || 0})
            </span>
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="text-xs font-bold text-teal hover:underline"
            >
              [ Edit ]
            </button>
          </div>
          {formData.skills && formData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-xs font-semibold text-teal"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-error">No skills selected.</p>
          )}
        </div>

        {/* 3. Experience & Certificate Card */}
        <div className="rounded-2xl bg-white p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-navy text-xs">
              <Briefcase className="size-3.5 text-teal" /> Experience
            </span>
            <button
              type="button"
              onClick={() => onGoToStep(3)}
              className="text-xs font-bold text-teal hover:underline"
            >
              [ Edit ]
            </button>
          </div>
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trade Experience:</span>
              <span className="font-semibold text-navy">
                {formData.experienceYears || "Not specified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Certificate:</span>
              <span className="font-semibold text-teal">
                {formData.certificateName ? `✓ Attached` : "Not Attached"}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Service Areas Card */}
        <div className="rounded-2xl bg-white p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-navy text-xs">
              <MapPin className="size-3.5 text-teal" /> Service Coverage
            </span>
            <button
              type="button"
              onClick={() => onGoToStep(4)}
              className="text-xs font-bold text-teal hover:underline"
            >
              [ Edit ]
            </button>
          </div>
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peshawar Areas:</span>
              <span className="font-semibold text-navy truncate max-w-[220px]">
                {formData.serviceAreas?.join(", ") || "None"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Radius:</span>
              <span className="font-semibold text-navy">
                {formData.coverageRadius || "20 km"}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Smart CNIC Documents Card */}
        <div className="rounded-2xl bg-white p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-navy text-xs">
              <ShieldCheck className="size-3.5 text-teal" /> NADRA CNIC
            </span>
            <button
              type="button"
              onClick={() => onGoToStep(5)}
              className="text-xs font-bold text-teal hover:underline"
            >
              [ Edit ]
            </button>
          </div>
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CNIC Front (*):</span>
              <span className="font-semibold text-teal">
                {formData.cnicFront ? `✓ Attached` : "⚠️ Pending"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CNIC Back (*):</span>
              <span className="font-semibold text-teal">
                {formData.cnicBack ? `✓ Attached` : "⚠️ Pending"}
              </span>
            </div>
          </div>
        </div>
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
          disabled={isSubmitting}
          className="h-11 sm:h-12 w-1/3 rounded-full border-2 border-navy text-sm font-bold text-navy hover:bg-slate-50"
        >
          <ArrowLeft className="mr-1 size-3.5 rtl:rotate-180" />
          <span>Back</span>
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="h-11 sm:h-12 flex-1 rounded-full bg-teal text-sm font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <FileCheck className="mr-1.5 size-4" />
              <span>Submit Profile</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
