"use client";

import React, { useState } from "react";
import { VisitOffer } from "@/types/offer";
import { formatRs } from "@/lib/design-tokens";
import { workerStore } from "@/stores/worker-jobs-store";
import { Check, Send, AlertCircle, Lock } from "lucide-react";

interface CounterOfferPanelProps {
  jobId: string;
  offer: VisitOffer;
  onAccepted?: () => void;
}

export function CounterOfferPanel({
  jobId,
  offer,
  onAccepted,
}: CounterOfferPanelProps) {
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [newCounterAmount, setNewCounterAmount] = useState<number>(
    offer.customerCounterAmount ? offer.customerCounterAmount + 100 : offer.visitCharge
  );
  const [counterNote, setCounterNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isMaxRoundsReached = offer.currentRound >= offer.maxRounds;

  const handleAccept = () => {
    const success = workerStore.acceptCounterOffer(jobId);
    if (success && onAccepted) {
      onAccepted();
    }
  };

  const handleSendCounter = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newCounterAmount <= 0) {
      setError("Please enter a valid counter amount.");
      return;
    }

    const result = workerStore.sendWorkerCounter(
      jobId,
      newCounterAmount,
      counterNote.trim() ? counterNote.trim() : undefined
    );

    if (!result.success) {
      setError(result.error ?? "Failed to send counter offer.");
    } else {
      setShowCounterInput(false);
    }
  };

  return (
    <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
          <h3 className="font-bold text-purple-950 text-sm sm:text-base">
            Counter-Offer Received
          </h3>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-white text-purple-900 font-semibold text-xs border border-purple-200">
          Round {offer.currentRound} of {offer.maxRounds}
        </span>
      </div>

      {/* Counter Amount Display */}
      <div className="bg-white rounded-2xl p-4 border border-purple-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 block font-semibold uppercase">
            Customer Offer
          </span>
          <div className="font-extrabold text-2xl text-[#123B5D]">
            {formatRs(offer.customerCounterAmount ?? offer.visitCharge)}
          </div>
          {offer.customerCounterMessage && (
            <p className="text-xs text-slate-600 mt-0.5 italic">
              &quot;{offer.customerCounterMessage}&quot;
            </p>
          )}
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block uppercase">
            Previous Quote
          </span>
          <span className="text-xs font-semibold text-slate-500 line-through">
            {formatRs(offer.visitCharge)}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Buttons */}
      {!showCounterInput ? (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white text-xs font-bold shadow-xs transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Accept {formatRs(offer.customerCounterAmount ?? offer.visitCharge)}</span>
          </button>

          {!isMaxRoundsReached ? (
            <button
              type="button"
              onClick={() => setShowCounterInput(true)}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-purple-300 text-purple-900 text-xs font-bold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Counter</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Final Round</span>
            </span>
          )}
        </div>
      ) : (
        /* Simple Counter Input Form */
        <form onSubmit={handleSendCounter} className="bg-white p-3.5 rounded-2xl border border-purple-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-700">Your New Counter (Rs.)</label>
            <span className="text-slate-400">Round {offer.currentRound + 1}</span>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">Rs.</span>
            <input
              type="number"
              min="50"
              step="50"
              value={newCounterAmount}
              onChange={(e) => setNewCounterAmount(Number(e.target.value))}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
              required
            />
          </div>

          <textarea
            rows={1}
            value={counterNote}
            onChange={(e) => setCounterNote(e.target.value)}
            placeholder="Add a note (optional)..."
            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
          />

          <div className="flex items-center justify-end gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setShowCounterInput(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Send Counter
            </button>
          </div>
        </form>
      )}

      {/* Clean negotiation history */}
      {offer.counterHistory.length > 1 && (
        <div className="pt-2 border-t border-purple-200/60 space-y-1">
          {offer.counterHistory.map((item, idx) => (
            <div
              key={idx}
              className="text-[11px] flex items-center justify-between text-slate-600 bg-white/60 px-2.5 py-1 rounded-lg"
            >
              <span>
                <strong>{item.sender === "worker" ? "You" : "Customer"}:</strong>{" "}
                {item.message || formatRs(item.amount)}
              </span>
              <span className="font-bold text-slate-800">{formatRs(item.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
