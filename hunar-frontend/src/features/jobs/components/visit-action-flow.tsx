"use client";

import React, { useState } from "react";
import { JobRequest } from "@/types/job";
import { VisitOffer } from "@/types/offer";
import { formatRs } from "@/lib/design-tokens";
import { workerStore, useWorkerJobs } from "@/stores/worker-jobs-store";
import {
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Camera,
  ShieldAlert,
} from "lucide-react";

interface VisitActionFlowProps {
  job: JobRequest;
  offer?: VisitOffer;
}

export function VisitActionFlow({ job, offer }: VisitActionFlowProps) {
  const { walletBalance } = useWorkerJobs();

  // Form states for Submit Inspection (Task 8d)
  const [diagnosis, setDiagnosis] = useState("");
  const [repairPlan, setRepairPlan] = useState("");
  const [repairPriceEstimate, setRepairPriceEstimate] = useState<number>(1500);
  const [estimatedRepairTime, setEstimatedRepairTime] = useState("1.5 hours");
  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wallet top-up warning
  const [walletAlert, setWalletAlert] = useState<string | null>(null);

  const agreedPrice =
    offer?.agreedVisitCharge ??
    offer?.visitCharge ??
    job.customerSuggestedPrice ??
    500;
  const requiredHold = Math.round(agreedPrice * 0.1);

  // 8a. Handle Start Visit
  const handleStartVisit = () => {
    workerStore.startVisit(job.id);
  };

  // 8b. Handle I've Arrived with Wallet Commission Hold Check
  const handleArrive = () => {
    const res = workerStore.arriveAtSite(job.id);
    if (!res.success) {
      setWalletAlert(
        res.error ?? `Insufficient wallet balance. Minimum ${formatRs(requiredHold)} required.`
      );
    } else {
      setWalletAlert(null);
    }
  };

  // 8c. Handle Start Inspection
  const handleStartInspection = () => {
    workerStore.startInspection(job.id);
  };

  // 8d. Handle Submit Inspection Form
  const handleSubmitInspection = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!diagnosis.trim()) {
      setFormError("Diagnosis is required.");
      return;
    }
    if (!repairPlan.trim()) {
      setFormError("Repair plan is required.");
      return;
    }
    if (!repairPriceEstimate || repairPriceEstimate <= 0) {
      setFormError("Valid repair price is required.");
      return;
    }
    if (inspectionPhotos.length === 0) {
      setFormError("At least one photo is required.");
      return;
    }
    if (!estimatedRepairTime.trim()) {
      setFormError("Estimated repair time is required.");
      return;
    }

    setIsSubmitting(true);
    const res = workerStore.submitInspection(job.id, {
      diagnosis: diagnosis.trim(),
      repairPlan: repairPlan.trim(),
      repairPriceEstimate,
      photos: inspectionPhotos,
      estimatedRepairTime: estimatedRepairTime.trim(),
    });

    setIsSubmitting(false);
    if (!res.success) {
      setFormError(res.error ?? "Failed to submit.");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="font-bold text-slate-900 text-base">
          Visit &amp; Inspection
        </h2>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">
            Visit Fee
          </span>
          <span className="font-extrabold text-[#123B5D] text-sm">
            {formatRs(agreedPrice)}
          </span>
        </div>
      </div>

      {/* Wallet Warning */}
      {walletAlert && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-red-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs font-semibold">
              Insufficient balance. Please top up {formatRs(requiredHold)} to proceed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              workerStore.setWalletBalance(walletBalance + 500);
              setWalletAlert(null);
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
          >
            Top-Up (+Rs. 500)
          </button>
        </div>
      )}

      {/* STATE 1: Ready to Start Visit */}
      {job.status === "accepted" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Customer location: <strong className="text-slate-900">{job.location.area}</strong>
          </p>
          <button
            type="button"
            onClick={handleStartVisit}
            className="w-full py-3 px-5 rounded-2xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Start Visit</span>
          </button>
        </div>
      )}

      {/* STATE 2: En Route */}
      {job.status === "visit_in_progress" && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-between text-xs text-[#0F8B8D] font-bold">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0F8B8D] animate-ping" />
              <span>En Route to Site</span>
            </span>
            <span>Live Sharing On</span>
          </div>

          <button
            type="button"
            onClick={handleArrive}
            className="w-full py-3 px-5 rounded-2xl bg-[#123B5D] hover:bg-[#1a4a75] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>I&apos;ve Arrived</span>
          </button>
        </div>
      )}

      {/* STATE 3: Arrived on Site */}
      {job.status === "visit_completed" && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Arrived on site. You can start inspection.</span>
          </div>

          <button
            type="button"
            onClick={handleStartInspection}
            className="w-full py-3 px-5 rounded-2xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Wrench className="w-4 h-4" />
            <span>Start Inspection</span>
          </button>
        </div>
      )}

      {/* STATE 4: Inspecting Form Submission */}
      {job.status === "inspecting" && (
        <form onSubmit={handleSubmitInspection} className="space-y-3.5 animate-in fade-in">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Field 1: Diagnosis */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Diagnosis <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="What is the problem?"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D]"
            />
          </div>

          {/* Field 2: Repair Plan */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Repair Plan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={repairPlan}
              onChange={(e) => setRepairPlan(e.target.value)}
              placeholder="What will be fixed or replaced?"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D]"
            />
          </div>

          {/* Field 3 & 5: Repair Price & Estimated Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Repair Price (Rs.) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">
                  Rs.
                </span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  required
                  value={repairPriceEstimate}
                  onChange={(e) => setRepairPriceEstimate(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Estimated Time <span className="text-red-500">*</span>
              </label>
              <select
                value={estimatedRepairTime}
                onChange={(e) => setEstimatedRepairTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D]"
              >
                <option value="30 mins">30 mins</option>
                <option value="1 hour">1 hour</option>
                <option value="1.5 hours">1.5 hours</option>
                <option value="2 hours">2 hours</option>
                <option value="3+ hours">3+ hours</option>
              </select>
            </div>
          </div>

          {/* Field 4: Evidence Photos */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Photos <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 pt-0.5">
              {inspectionPhotos.map((url, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 relative shrink-0"
                >
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setInspectionPhotos((prev) => [
                    ...prev,
                    "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
                  ]);
                }}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0F8B8D] flex flex-col items-center justify-center text-slate-400 hover:text-[#0F8B8D] transition-colors shrink-0"
              >
                <Camera className="w-4 h-4" />
                <span className="text-[9px] mt-0.5 font-semibold">+ Add</span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-5 rounded-2xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all pt-2.5"
          >
            <span>{isSubmitting ? "Submitting..." : "Submit Inspection"}</span>
          </button>
        </form>
      )}

      {/* STATE 5: Inspection Submitted */}
      {job.status === "inspection_submitted" && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-slate-700">
          <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Inspection Submitted</span>
          </div>
          <div className="flex justify-between pt-1 font-semibold">
            <span>Repair Estimate:</span>
            <span className="text-slate-900 font-bold">{formatRs(repairPriceEstimate)}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Waiting for customer approval to begin repair work.
          </p>
        </div>
      )}
    </div>
  );
}
