"use client";

import {
  BadgeCheck,
  CheckCircle,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { OrderworkerLogo } from "@/components/shared/orderworker-logo";

export function VerificationLeftShowcase() {
  return (
    <section
      className="hidden lg:flex flex-col justify-between bg-slate-50/70 p-6 sm:p-8 lg:p-10 lg:col-span-5 xl:col-span-5 min-h-full"
      data-purpose="verification-trust-showcase"
    >
      <div className="flex h-full flex-col justify-between rounded-3xl border border-teal-200/50 bg-gradient-to-b from-[#0F8B8D]/10 via-[#0F8B8D]/5 to-transparent p-5 sm:p-6 lg:p-7 shadow-xs">
        <div>
          {/* Header Branding & Badge */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <OrderworkerLogo variant="dark" size="sm" showBadge={false} />
              <span className="block text-[9px] font-bold uppercase tracking-wider text-teal pl-0.5">
                Worker Verification
              </span>
            </div>
            <span className="inline-flex items-center rounded-full border border-teal/20 bg-teal/10 px-2.5 py-1 text-[11px] font-bold text-teal">
              NADRA Protected
            </span>
          </div>

          {/* Section Headline */}
          <div className="mb-4">
            <h1 className="text-xl font-extrabold leading-snug tracking-tight text-navy sm:text-2xl">
              Trust & Safety Verification System
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Every tradesperson on Orderworker passes rigorous identity verification before receiving customer jobs in Peshawar.
            </p>
          </div>

          {/* Trust Guarantees List */}
          <div className="rounded-2xl border border-teal-100/80 bg-white p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy">
              Why Verification Matters:
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <BadgeCheck className="size-3.5" />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-navy">Official Verified Badge</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Increases customer hire rate by over 3.5x across Peshawar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <ShieldCheck className="size-3.5" />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-navy">Escrow Payout Guarantee</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Milestone funds are held securely until repair completion.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <MapPin className="size-3.5" />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-navy">GPS Radar Job Alerts</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Receive instant push notifications for nearby customer requests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-teal-200/40 text-[11px] font-semibold text-navy">
          <span className="inline-flex items-center gap-1.5 text-teal">
            <Lock className="size-3.5 text-teal" />
            256-Bit Encrypted
          </span>
          <span className="inline-flex items-center gap-1.5 text-success">
            <CheckCircle className="size-3.5 text-success" />
            Zero Spam Policy
          </span>
        </div>
      </div>
    </section>
  );
}
