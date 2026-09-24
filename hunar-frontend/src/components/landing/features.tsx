import { Link } from "@/i18n/navigation";
import { ArrowRightIcon } from "./icons";
import { steps } from "./data";

export function Features() {
  return (
    <section
      className="relative z-20 bg-slate-50 py-12"
      data-purpose="features-overview"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-3">
            Need something done?
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-normal">
            Most viewed and all-time top-selling skilled trade services in
            Pakistan
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="border border-slate-100 rounded-2xl p-6 hover:shadow-xl hover:border-brand-accent transition-all bg-white text-center flex flex-col items-center group cursor-pointer block"
            >
              <div className="w-full h-44 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={s.alt}
                  className="h-40 w-auto object-contain mix-blend-multiply"
                  src={s.image}
                />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-brand-hero text-[11px] font-bold mb-2">
                {s.step}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {s.title}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                {s.description}
              </p>
              <span className="mt-3 text-xs font-bold text-brand-accent flex items-center gap-1">
                {s.linkText}
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}