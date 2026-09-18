import {
  AirVent,
  BadgeCheck,
  Flame,
  Hammer,
  Paintbrush,
  Pipette,
  ShieldCheck,
  SunMedium,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

export function LeftShowcase() {
  return (
    <section
      className="hidden lg:flex flex-col justify-between bg-slate-50/70 p-6 sm:p-8 lg:p-10 lg:col-span-5 xl:col-span-5 min-h-full"
      data-purpose="worker-value-prop"
    >
      <div className="flex h-full flex-col justify-between rounded-3xl border border-teal-200/50 bg-gradient-to-b from-[#0F8B8D]/10 via-[#0F8B8D]/5 to-transparent p-5 sm:p-6 lg:p-7 shadow-xs">
        <div>
          {/* Header Branding and Escrow Badge */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-navy text-white shadow-xs">
                <span className="font-extrabold text-teal text-base">H</span>
              </div>
              <div className="leading-none">
                <span className="block text-lg font-extrabold tracking-tight text-navy">
                  HUNAR
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-teal">
                  Pakistan Verified
                </span>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full border border-teal/20 bg-teal/10 px-2.5 py-1 text-[11px] font-bold text-teal">
              Escrow Guaranteed
            </span>
          </div>

          {/* Section Headline */}
          <div className="mb-4">
            <h1 className="text-xl font-extrabold leading-snug tracking-tight text-navy sm:text-2xl">
              Find verified skilled tradespeople with escrow guarantee.
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Register as a certified professional to receive verified client requests across Peshawar with protected milestone payments.
            </p>
          </div>

          {/* Center White Enclosed Card */}
          <div className="rounded-2xl border border-teal-100/80 bg-white p-3.5 shadow-xs">
            {/* Popular Skills Header */}
            <div className="mb-2.5 px-0.5 flex items-center justify-between">
              <p className="text-xs font-extrabold text-navy">
                Popular Trade Skills
              </p>
              <span className="text-[10px] font-semibold text-teal flex items-center gap-0.5">
                <Users className="size-3" /> Peshawar
              </span>
            </div>

            {/* 4x2 Grid of Skill Cards */}
            <div className="grid grid-cols-4 gap-2 text-center text-slate-800">
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Zap className="mb-1 size-4 text-teal" />
                <span className="text-[9px] font-bold leading-tight text-navy">
                  Electrician
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Wrench className="mb-1 size-4 text-teal" />
                <span className="text-[9px] font-bold leading-tight text-navy">
                  Plumber
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <AirVent className="mb-1 size-4 text-teal" />
                <span className="text-[9px] font-bold leading-tight text-navy">
                  AC Tech
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Hammer className="mb-1 size-4 text-teal" />
                <span className="text-[9px] font-bold leading-tight text-navy">
                  Carpenter
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Paintbrush className="mb-1 size-4 text-teal" />
                <span className="text-[9px] font-bold leading-tight text-navy">
                  Painter
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <SunMedium className="mb-1 size-4 text-teal" />
                <span className="text-[9px] font-bold leading-tight text-navy">
                  Solar
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Flame className="mb-1 size-4 text-teal" />
                <span className="text-[9px] font-bold leading-tight text-navy">
                  Welder
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Pipette className="mb-1 size-4 text-teal" />
                <span className="text-[9px] font-bold leading-tight text-navy">
                  Mason
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Badges Bar */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-teal-200/40 text-[11px] font-semibold text-navy">
          <span className="inline-flex items-center gap-1.5 text-teal">
            <BadgeCheck className="size-4 text-teal" />
            NADRA CNIC Verified
          </span>
          <span className="inline-flex items-center gap-1.5 text-success">
            <ShieldCheck className="size-4 text-success" />
            100% Escrow Protection
          </span>
        </div>
      </div>
    </section>
  );
}
