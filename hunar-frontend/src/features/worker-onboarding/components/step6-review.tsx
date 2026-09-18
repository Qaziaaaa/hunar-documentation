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
    <div className="flex flex-col justify-between flex-1 space-y-5 sm:space-y-6">
      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-teal">
                Verification Review
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl leading-tight">
                Review your profile
              </h2>
            </div>
            <span className="shrink-0 self-start rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
              Final Step
            </span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Please check your details before submitting for admin verification.
          </p>
        </div>

        <div className="max-h-[380px] sm:max-h-[440px] space-y-3 overflow-y-auto pr-1 text-xs sm:text-sm">
          {/* 1. Personal Information & Photo Card */}
          <div className="rounded-2xl bg-white p-3 shadow-2xs border border-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-navy text-sm">
                <User className="size-4 text-teal" /> Personal Info
              </span>
              <button
                type="button"
                onClick={() => onGoToStep(1)}
                className="text-xs sm:text-sm font-bold text-teal hover:underline cursor-pointer"
              >
                [ Edit ]
              </button>
            </div>
            <div className="flex items-center gap-3.5 border-b border-slate-200/80 pb-3 mb-2.5">
              {formData.profilePhoto ? (
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full border-2 border-teal shadow-2xs">
                  <Image
                    src={formData.profilePhoto}
                    alt={formData.fullName || "Worker Avatar"}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                  <User className="size-6" />
                </div>
              )}
              <div className="leading-tight">
                <span className="block text-sm sm:text-base font-bold text-navy">
                  {formData.fullName || "Not specified"}
                </span>
                <span className="text-xs font-semibold text-teal mt-0.5 block">
                  {formData.profilePhoto ? "✓ Photo Attached" : "⚠️ Photo Missing"}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
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
          <div className="rounded-2xl bg-white p-3 shadow-2xs border border-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-navy text-sm">
                <Wrench className="size-4 text-teal" /> Selected Services (
                {formData.skills?.length || 0})
              </span>
              <button
                type="button"
                onClick={() => onGoToStep(2)}
                className="text-xs sm:text-sm font-bold text-teal hover:underline cursor-pointer"
              >
                [ Edit ]
              </button>
            </div>
            {formData.skills && formData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-xs sm:text-sm font-semibold text-teal"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-error">No skills selected.</p>
            )}
          </div>

          {/* 3. Experience & Certificate Card */}
          <div className="rounded-2xl bg-white p-3 shadow-2xs border border-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-navy text-sm">
                <Briefcase className="size-4 text-teal" /> Experience
              </span>
              <button
                type="button"
                onClick={() => onGoToStep(3)}
                className="text-xs sm:text-sm font-bold text-teal hover:underline cursor-pointer"
              >
                [ Edit ]
              </button>
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
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
          <div className="rounded-2xl bg-white p-3 shadow-2xs border border-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-navy text-sm">
                <MapPin className="size-4 text-teal" /> Service Coverage
              </span>
              <button
                type="button"
                onClick={() => onGoToStep(4)}
                className="text-xs sm:text-sm font-bold text-teal hover:underline cursor-pointer"
              >
                [ Edit ]
              </button>
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peshawar Areas:</span>
                <span className="font-semibold text-navy truncate max-w-[240px]">
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
          <div className="rounded-2xl bg-white p-3 shadow-2xs border border-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-navy text-sm">
                <ShieldCheck className="size-4 text-teal" /> NADRA CNIC
              </span>
              <button
                type="button"
                onClick={() => onGoToStep(5)}
                className="text-xs sm:text-sm font-bold text-teal hover:underline cursor-pointer"
              >
                [ Edit ]
              </button>
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
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
          <div className="flex items-center gap-2 rounded-xl bg-error/10 p-2.5 text-sm font-medium text-error">
            <AlertCircle className="size-4 shrink-0" />
            <span>{stepError}</span>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-4 pb-1">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onPrev}
          disabled={isSubmitting}
          className="h-12 sm:h-13 w-1/3 rounded-full border-2 border-navy text-sm sm:text-base font-bold text-navy hover:bg-slate-50"
        >
          <ArrowLeft className="mr-1.5 size-4 rtl:rotate-180" />
          <span>Back</span>
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="h-12 sm:h-13 flex-1 rounded-full bg-teal text-sm sm:text-base font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <FileCheck className="mr-2 size-5" />
              <span>Submit Profile</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
