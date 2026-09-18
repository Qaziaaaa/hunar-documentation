"use client";

import React, { useState } from "react";
import { formatRs } from "@/lib/design-tokens";
import { workerStore } from "@/stores/worker-jobs-store";
import { Send, X, AlertTriangle } from "lucide-react";

interface SendVisitOfferDialogProps {
  jobId: string;
  jobTitle: string;
  customerSuggestedPrice?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SendVisitOfferDialog({
  jobId,
  jobTitle,
  customerSuggestedPrice,
  isOpen,
  onClose,
  onSuccess,
}: SendVisitOfferDialogProps) {
  const [visitCharge, setVisitCharge] = useState<number>(
    customerSuggestedPrice ?? 500
  );
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // 10% platform commission calculation
  const platformCommission = Math.round(visitCharge * 0.1);
  const workerNet = visitCharge - platformCommission;

  const presets = [300, 500, 800, 1000, 1500];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (visitCharge <= 0) {
      setError("Please enter a valid visit charge.");
      return;
    }

    setSubmitting(true);
    const result = workerStore.sendVisitOffer(
      jobId,
      visitCharge,
      message.trim() ? message.trim() : undefined
    );

    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "Failed to submit offer.");
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              Send Visit Offer
            </h2>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Visit Charge Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700">
                Your Visit Charge (Rs.)
              </label>
              {customerSuggestedPrice && (
                <span className="text-slate-500">
                  Suggested: <strong>{formatRs(customerSuggestedPrice)}</strong>
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-base">
                Rs.
              </span>
              <input
                type="number"
                min="50"
                step="50"
                value={visitCharge || ""}
                onChange={(e) => setVisitCharge(Number(e.target.value))}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-extrabold text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D]"
                required
              />
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              {presets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setVisitCharge(amt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    visitCharge === amt
                      ? "bg-[#0F8B8D] text-white border-[#0F8B8D]"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Rs. {amt}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Line Clean Breakdown */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Visit Charge:</span>
              <span className="font-semibold text-slate-900">{formatRs(visitCharge)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Platform Fee (10%):</span>
              <span>- {formatRs(platformCommission)}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>You Receive:</span>
              <span className="text-[#0F8B8D]">{formatRs(workerNet)}</span>
            </div>
          </div>

          {/* Short Message */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Message <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a short note for the customer..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D]"
            />
          </div>

          {/* Actions */}
          <div className="pt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || visitCharge <= 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0F8B8D] hover:bg-[#0B7F74] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Sending..." : "Submit Offer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
