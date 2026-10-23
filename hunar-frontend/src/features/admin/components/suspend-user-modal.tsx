"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  Clock,
  Ban,
  ShieldAlert,
  Calendar,
  FileText,
  CheckCircle2,
  X,
  ChevronDown,
  Info,
} from "lucide-react";
import { SuspendUserPayload } from "../api/admin-api";

export type SuspensionRole = "CUSTOMER" | "WORKER";

export interface SuspendModalUser {
  id: string;
  name: string;
  phone: string;
  role: SuspensionRole;
  status: "ACTIVE" | "SUSPENDED" | string;
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
  suspensionType?: "PERMANENT" | "TEMPORARY" | null;
}

interface SuspendUserModalProps {
  isOpen: boolean;
  user: SuspendModalUser | null;
  onClose: () => void;
  onConfirmSuspend: (payload: SuspendUserPayload) => Promise<void>;
  onConfirmReactivate: () => Promise<void>;
  isSubmitting?: boolean;
}

export const CUSTOMER_SUSPENSION_REASONS = [
  "Non-Payment / Payment Fraud",
  "Inappropriate Behavior / Harassment",
  "Repeated Job Cancellations",
  "Fraudulent Job Posting",
  "Abusive Language / Threatening Behavior",
  "Terms of Service Violation",
  "Other",
];

export const WORKER_SUSPENSION_REASONS = [
  "Repeated No-Show",
  "Unprofessional Conduct / Harassment",
  "Substandard Work Quality / Safety Risk",
  "Direct Dealing / Bypassing Platform Fee",
  "Overcharging / Demanding Unapproved Cash",
  "Fake Documents / Identity Mismatch",
  "Terms of Service Violation",
  "Other",
];

export const TERMS_OF_SERVICE_VIOLATIONS = [
  "Off-Platform Contact / Direct Payment Solicitation",
  "Abuse of Rating & Review System",
  "Account Sharing / Impersonation",
  "Fraudulent Claims / False Disputes",
  "Harassment or Hate Speech",
  "Privacy Policy Violation / Unauthorized Data Sharing",
  "Circumventing Account Restrictions",
  "Other Violation",
];

export const SUSPENSION_DURATIONS: Array<{
  value: SuspendUserPayload["duration"];
  label: string;
  hours: number;
}> = [
  { value: "2_HOURS", label: "2 Hours", hours: 2 },
  { value: "6_HOURS", label: "6 Hours", hours: 6 },
  { value: "12_HOURS", label: "12 Hours", hours: 12 },
  { value: "1_DAY", label: "1 Day", hours: 24 },
  { value: "3_DAYS", label: "3 Days", hours: 72 },
  { value: "1_WEEK", label: "1 Week", hours: 168 },
  { value: "2_WEEKS", label: "2 Weeks", hours: 336 },
  { value: "1_MONTH", label: "1 Month", hours: 720 },
];

export function SuspendUserModal({
  isOpen,
  user,
  onClose,
  onConfirmSuspend,
  onConfirmReactivate,
  isSubmitting = false,
}: SuspendUserModalProps) {
  const [suspensionType, setSuspensionType] = useState<"PERMANENT" | "TEMPORARY">("TEMPORARY");
  const [reason, setReason] = useState("");
  const [violationType, setViolationType] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<SuspendUserPayload["duration"]>("1_DAY");
  const [errorMessage, setErrorMessage] = useState("");

  const isSuspending = user?.status === "ACTIVE";

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSuspensionType("TEMPORARY");
      setReason("");
      setViolationType("");
      setDescription("");
      setDuration("1_DAY");
      setErrorMessage("");
    }
  }, [isOpen, user]);

  const reasonsList = useMemo(() => {
    if (user?.role === "WORKER") {
      return WORKER_SUSPENSION_REASONS;
    }
    return CUSTOMER_SUSPENSION_REASONS;
  }, [user?.role]);

  // Projected reactivation date
  const projectedReactivationDate = useMemo(() => {
    if (suspensionType !== "TEMPORARY" || !duration) return null;
    const durObj = SUSPENSION_DURATIONS.find((d) => d.value === duration);
    if (!durObj) return null;
    const date = new Date(Date.now() + durObj.hours * 60 * 60 * 1000);
    return date.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [suspensionType, duration]);

  if (!isOpen || !user) return null;

  // Validation
  const isTermsViolation = reason === "Terms of Service Violation";
  const isOther = reason === "Other";

  const isFormValid = useMemo(() => {
    if (!isSuspending) return true; // Reactivation requires no form fields
    if (!suspensionType) return false;
    if (!reason) return false;
    if (isTermsViolation && !violationType) return false;
    if (!description.trim()) return false; // Description is always required per section 5.4
    if (suspensionType === "TEMPORARY" && !duration) return false;
    return true;
  }, [isSuspending, suspensionType, reason, isTermsViolation, violationType, description, duration]);

  const handleSubmit = async () => {
    setErrorMessage("");
    try {
      if (isSuspending) {
        if (!isFormValid) {
          setErrorMessage("Please complete all required fields before confirming suspension.");
          return;
        }
        await onConfirmSuspend({
          type: suspensionType,
          reason,
          violationType: isTermsViolation ? violationType : undefined,
          description: description.trim(),
          duration: suspensionType === "TEMPORARY" ? duration : undefined,
        });
      } else {
        await onConfirmReactivate();
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || "Failed to complete account action. Please try again.",
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm transition-all"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                isSuspending ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {isSuspending ? <ShieldAlert className="size-6" /> : <CheckCircle2 className="size-6" />}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-navy">
                {isSuspending
                  ? `Suspend ${user.role === "WORKER" ? "Worker" : "Customer"} Account`
                  : `Reactivate ${user.role === "WORKER" ? "Worker" : "Customer"} Account`}
              </h3>
              <p className="text-xs text-slate-500">
                User: <span className="font-semibold text-navy">{user.name}</span> • {user.phone}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            disabled={isSubmitting}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Reactivation View */}
        {!isSuspending ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs leading-relaxed text-emerald-900">
              <p className="font-bold">Are you sure you want to reactivate this account?</p>
              <p className="mt-1 text-emerald-700">
                This will restore immediate access for <span className="font-bold">{user.name}</span> to log in,
                accept or post jobs, and participate on the platform.
              </p>
              {user.suspensionReason && (
                <div className="mt-3 rounded-xl bg-white/80 p-2.5 text-[11px] text-slate-700">
                  <span className="font-bold text-slate-900">Previous Suspension Reason:</span>{" "}
                  {user.suspensionReason}
                </div>
              )}
            </div>

            {errorMessage && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-xl bg-teal px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-600 disabled:opacity-50"
              >
                {isSubmitting ? "Reactivating..." : "Reactivate Account"}
              </button>
            </div>
          </div>
        ) : (
          /* Suspension Form (Section 5) */
          <div className="mt-5 space-y-5">
            {/* 5.1 & 5.2: Suspension Type Selection */}
            <div>
              <label className="block text-xs font-bold text-navy">
                1. Suspension Type <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSuspensionType("TEMPORARY")}
                  className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-all ${
                    suspensionType === "TEMPORARY"
                      ? "border-teal bg-teal/5 ring-2 ring-teal/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-navy">
                      <Clock className="size-4 text-teal" />
                      Temporary
                    </span>
                    <span
                      className={`size-3.5 rounded-full border ${
                        suspensionType === "TEMPORARY" ? "border-teal bg-teal" : "border-slate-300 bg-white"
                      }`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Suspends for a set duration. Automatically reactivates when expired.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSuspensionType("PERMANENT")}
                  className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-all ${
                    suspensionType === "PERMANENT"
                      ? "border-red-500 bg-red-50/50 ring-2 ring-red-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-navy">
                      <Ban className="size-4 text-red-600" />
                      Permanent
                    </span>
                    <span
                      className={`size-3.5 rounded-full border ${
                        suspensionType === "PERMANENT" ? "border-red-600 bg-red-600" : "border-slate-300 bg-white"
                      }`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Indefinite suspension. Will not reactivate automatically.
                  </span>
                </button>
              </div>
            </div>

            {/* 5.3: Suspension Reason Dropdown (Filtered by Account Type) */}
            <div>
              <label className="block text-xs font-bold text-navy">
                2. Suspension Reason ({user.role === "WORKER" ? "Worker" : "Customer"}){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <select
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value !== "Terms of Service Violation") {
                      setViolationType("");
                    }
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-navy outline-none focus:border-teal focus:ring-1 focus:ring-teal"
                >
                  <option value="">-- Select Relevant Reason --</option>
                  {reasonsList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-3 size-4 text-slate-400" />
              </div>
            </div>

            {/* 5.4: Secondary Dropdown for Terms of Service Violation */}
            {isTermsViolation && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 transition-all">
                <label className="block text-xs font-bold text-amber-900">
                  Specific Terms of Service Violation <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <select
                    value={violationType}
                    onChange={(e) => setViolationType(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-medium text-navy outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">-- Select Specific Violation --</option>
                    {TERMS_OF_SERVICE_VIOLATIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-2.5 size-4 text-slate-400" />
                </div>
                <p className="mt-1.5 text-[11px] text-amber-800">
                  Select the exact violation category, then explain the specific incident details in the description
                  below.
                </p>
              </div>
            )}

            {/* 5.2 & 5.5: Duration Dropdown (Displayed ONLY when Temporary is selected) */}
            {suspensionType === "TEMPORARY" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all">
                <label className="flex items-center gap-1.5 text-xs font-bold text-navy">
                  <Calendar className="size-4 text-teal" />
                  3. Suspension Duration <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as any)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-navy outline-none focus:border-teal focus:ring-1 focus:ring-teal"
                  >
                    {SUSPENSION_DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-3 size-4 text-slate-400" />
                </div>

                {projectedReactivationDate && (
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-teal-700">
                    <Info className="size-3.5 shrink-0" />
                    <span>
                      Automatic reactivation scheduled for: <strong>{projectedReactivationDate}</strong>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Notice for Permanent Suspension */
              <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/60 p-3 text-[11px] text-red-800">
                <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <span className="font-bold">Permanent Suspension selected:</span> Duration field is hidden. This
                  account will remain inactive until manually reactivated by an authorized administrator.
                </div>
              </div>
            )}

            {/* 5.4: Detailed Description Field (REQUIRED for all types) */}
            <div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-navy">
                  <FileText className="size-4 text-slate-500" />
                  4. Detailed Description <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">{description.trim().length}/1000</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={
                  isOther
                    ? "Specify the exact reason and incident details for suspending this account..."
                    : isTermsViolation
                    ? "Provide incident details, evidence summary, and reason for the Terms violation..."
                    : "Explain the specific circumstances and reason for this suspension (required for audit trail)..."
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-navy outline-none placeholder:text-slate-400 focus:border-teal focus:ring-1 focus:ring-teal"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                This description is mandatory and will be logged in the permanent admin audit trail.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {errorMessage}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Processing..."
                  : suspensionType === "PERMANENT"
                  ? "Confirm Permanent Suspension"
                  : "Confirm Temporary Suspension"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
