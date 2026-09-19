"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ArrowRight, CircleCheck, Shield, User, Wrench, X } from "lucide-react";
import { Link } from "@/i18n/navigation";

type RoleModalContextValue = {
  open: () => void;
};

const RoleModalContext = createContext<RoleModalContextValue>({
  open: () => {},
});

export function useRoleModal() {
  return useContext(RoleModalContext);
}

function RoleModalContent({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Choose Your Account Role"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`modal-container relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 z-10 max-h-[92vh] overflow-y-auto ${
          isOpen ? "scale-100" : "scale-95"
        }`}
      >
        <div className="h-2 w-full bg-gradient-to-r from-[#1F4B3F] via-[#5BBB7B] to-[#123B5D]" />
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6 sm:p-8">
          <div className="text-center max-w-lg mx-auto mb-7">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#1F4B3F] border border-[#5BBB7B]/30 text-xs font-bold tracking-wider uppercase mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5BBB7B] animate-pulse" />
              <span>Portal Gateway</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Choose Your Account Role
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5">
              Select how you want to use HUNAR to enter your designated
              dashboard.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <a
              href="#"
              className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl border-2 border-slate-200/90 bg-white hover:border-[#5BBB7B] hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#1F4B3F] group-hover:bg-[#5BBB7B] transition-colors" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1F4B3F] group-hover:bg-[#1F4B3F] group-hover:text-white flex items-center justify-center transition-all">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#5BBB7B]/15 text-[#1F4B3F] border border-[#5BBB7B]/20">
                    Customer
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1F4B3F] transition-colors">
                  Customer Hub
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Hire verified tradespeople, compare upfront bids, and pay
                  securely with escrow protection.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600 pt-3 mt-3 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-1.5">
                    <CircleCheck className="w-[15px] h-[15px] text-[#5BBB7B]" />
                    Post jobs in 2 minutes
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CircleCheck className="w-[15px] h-[15px] text-[#5BBB7B]" />
                    Live GPS arrival tracker
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CircleCheck className="w-[15px] h-[15px] text-[#5BBB7B]" />
                    100% Escrow protected
                  </li>
                </ul>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100">
                <div className="w-full py-2.5 px-3 rounded-xl bg-[#1F4B3F] text-white text-xs font-bold group-hover:bg-[#5BBB7B] flex items-center justify-center gap-1.5 shadow-sm transition-colors">
                  <span>Enter Customer Hub</span>
                  <ArrowRight className="w-[15px] h-[15px] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
            <Link
              href="/worker/sign-up"
              className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl border-2 border-slate-200/90 bg-white hover:border-[#D97706] hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#D97706] transition-colors" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#D97706] group-hover:bg-[#D97706] group-hover:text-white flex items-center justify-center transition-all">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-[#92400E] border border-amber-200">
                    Worker
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#92400E] transition-colors">
                  Worker Portal
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Browse nearby repair jobs in Peshawar, send instant visit
                  offers, and withdraw earnings directly.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600 pt-3 mt-3 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-1.5">
                    <CircleCheck className="w-[15px] h-[15px] text-[#D97706]" />
                    Real-time job alert radar
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CircleCheck className="w-[15px] h-[15px] text-[#D97706]" />
                    Direct chat & negotiation
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CircleCheck className="w-[15px] h-[15px] text-[#D97706]" />
                    Fast direct bank payouts
                  </li>
                </ul>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100">
                <div className="w-full py-2.5 px-3 rounded-xl bg-[#D97706] text-white text-xs font-bold group-hover:bg-[#B45309] flex items-center justify-center gap-1.5 shadow-sm transition-colors">
                  <span>Enter Worker Portal</span>
                  <ArrowRight className="w-[15px] h-[15px] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
            <a
              href="#"
              className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl border-2 border-slate-200/90 bg-white hover:border-[#123B5D] hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#123B5D] transition-colors" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#123B5D] group-hover:bg-[#123B5D] group-hover:text-white flex items-center justify-center transition-all">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#123B5D]/10 text-[#123B5D] border border-[#123B5D]/20">
                    Admin
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#123B5D] transition-colors">
                  Admin Suite
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Platform governance, live operations radar, work order
                  dispatch, escrow audit, and disputes.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600 pt-3 mt-3 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-1.5">
                    <CircleCheck className="w-[15px] h-[15px] text-[#123B5D]" />
                    Central operations radar
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CircleCheck className="w-[15px] h-[15px] text-[#123B5D]" />
                    Dispute resolution tribunal
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CircleCheck className="w-[15px] h-[15px] text-[#123B5D]" />
                    Escrow & KYC moderation
                  </li>
                </ul>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100">
                <div className="w-full py-2.5 px-3 rounded-xl bg-[#123B5D] text-white text-xs font-bold group-hover:bg-[#0F2E4A] flex items-center justify-center gap-1.5 shadow-sm transition-colors">
                  <span>Enter Admin Suite</span>
                  <ArrowRight className="w-[15px] h-[15px] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
          </div>
          <div className="mt-6 pt-3 border-t border-slate-100 text-center text-xs text-slate-400">
            Protected by SBP-compliant escrow guarantees and NADRA biometric
            verification.
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoleModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <RoleModalContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <RoleModalContent isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </RoleModalContext.Provider>
  );
}