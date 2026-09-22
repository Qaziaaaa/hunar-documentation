import { LockIcon, ShieldIcon } from "./icons";
import { HeroSearchForm } from "./hero-search-form";

const metrics = [
  { value: "834M", label: "Skilled Tradespeople" },
  { value: "732M", label: "Positive Reviews" },
  { value: "90M", label: "Orders Completed" },
  { value: "236M", label: "Projects Completed" },
];

export function Hero() {
  return (
    <section
      className="hero-topo text-white min-h-[calc(100dvh-92px)] min-h-[calc(100vh-92px)] flex items-center relative overflow-hidden py-12 lg:py-16"
      data-purpose="hero-section"
      id="home"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-7">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-[1.18]">
              Find the perfect skilled services{" "}
              <span className="text-brand-accent">
                for your home & business
              </span>
            </h1>
            <p className="text-slate-200 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
              Work with talented certified tradespeople at the most affordable
              price to get the most out of your time and cost.
            </p>
            <HeroSearchForm />
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl">
              {metrics.map((m) => (
                <div key={m.label}>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">
                    {m.value}
                  </div>
                  <div className="text-xs text-slate-300 font-normal mt-0.5">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="relative w-full max-w-lg flex items-end justify-center gap-4">
              <a
                href="#pros"
                className="w-1/2 arch-card-left overflow-hidden shadow-2xl border-4 border-white/20 bg-slate-800 relative z-20 aspect-[3/4.6] group block"
                title="View Tariq Mehmood Profile"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Pakistani AC Specialist Tariq Mehmood"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-500"
                  src="/landing/tariq-mehmood-hero2.png"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs font-semibold text-brand-accent">
                    Tariq Mehmood
                  </span>
                  <p className="text-[11px] text-slate-200">
                    Senior HVAC Specialist
                  </p>
                </div>
              </a>
              <a
                href="#pros"
                className="w-1/2 arch-card-right overflow-hidden shadow-2xl border-4 border-white/20 bg-slate-800 relative z-10 aspect-[3/5] -translate-y-8 group block"
                title="View Maqsood Raza Profile"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Maqsood Raza - Certified DB Expert & Wiring"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  src="/landing/maqsood-raza-hero.png"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs font-semibold text-brand-accent">
                    Maqsood Raza
                  </span>
                  <p className="text-[11px] text-slate-200">
                    Certified DB Expert & Wiring
                  </p>
                </div>
              </a>
              <span
                className="absolute -top-4 -left-4 z-30 bg-white/95 backdrop-blur text-slate-800 px-4 py-2.5 rounded-2xl shadow-xl border border-slate-100 flex items-center space-x-3 hover:scale-105 transition-transform"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-brand-accent flex items-center justify-center flex-shrink-0">
                  <ShieldIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    Proof of quality
                  </p>
                  <p className="text-[11px] text-slate-500">
                    100% CNIC & Police Verified
                  </p>
                </div>
              </span>
              <span
                className="absolute -bottom-6 -right-2 z-30 bg-white/95 backdrop-blur text-slate-800 px-4 py-2.5 rounded-2xl shadow-xl border border-slate-100 flex items-center space-x-3 hover:scale-105 transition-transform"
              >
                <div className="w-9 h-9 rounded-full bg-teal-50 text-brand-hero flex items-center justify-center flex-shrink-0">
                  <LockIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    Safe and secure
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Escrow milestone release
                  </p>
                </div>
              </span>
              <a
                href="#pros"
                className="absolute -bottom-4 left-6 z-30 bg-white/95 backdrop-blur border border-slate-100 text-slate-800 px-3.5 py-2 rounded-full shadow-2xl flex items-center space-x-2.5 hover:scale-105 transition-transform"
                title="Explore Verified Pros"
              >
                <span className="text-xs font-bold text-slate-900">
                  58M+ Professionals
                </span>
                <div className="flex -space-x-2 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="pro"
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                    src="/landing/pro-avatar-1-alt.png"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="pro"
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                    src="/landing/pro-avatar-2-alt.png"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="pro"
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                    src="/landing/pro-avatar-3-alt.png"
                  />
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-brand-accent flex items-center justify-center text-[10px] font-bold text-white">
                    +
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}