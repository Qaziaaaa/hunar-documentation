"use client";

import { Shield, ShieldAlert, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function EscrowBanner() {
  return (
    <div className="bg-[#123B5D] text-white p-5 sm:p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-[#0F8B8D] flex items-center justify-center shrink-0 shadow-xs">
          <Shield className="size-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white">
            How HUNAR Protects Your Service Experience
          </h3>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
            All technicians are NADRA CNIC verified with doorstep OTP PIN confirmation and transparent pricing.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
        <Link
          href="/customer/help"
          className="inline-block px-4 py-2 rounded-lg bg-white text-[#123B5D] text-xs font-bold hover:bg-slate-100 transition-colors shadow-2xs whitespace-nowrap"
        >
          Payment Dispute Rules
        </Link>
      </div>
    </div>
  );
}
