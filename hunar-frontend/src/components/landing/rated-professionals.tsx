import { ArrowRightIcon, BadgeCheckIcon } from "./icons";
import { pros, type Pro } from "./data";

function ProCard({ pro }: { pro: Pro }) {
  return (
    <div className="relative h-[440px] sm:h-[460px] rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group bg-slate-900 border border-slate-200/80 cursor-pointer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={pro.alt}
        className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 ease-out"
        src={pro.image}
      />
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Verified Pro
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold shadow-md">
          <span className="text-amber-500 font-bold">★</span> {pro.rating}
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent transition-opacity duration-400 group-hover:opacity-0 pointer-events-none" />
      <div className="absolute bottom-5 left-5 right-5 z-10 transition-all duration-400 group-hover:opacity-0 group-hover:translate-y-4 pointer-events-none">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {pro.name}
          </h3>
          <BadgeCheckIcon className="w-4 h-4 text-brand-accent" />
        </div>
        <p className="text-xs text-slate-200 font-medium">{pro.role}</p>
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/15 text-[11px] text-slate-300">
          <span>{pro.location}</span>
          <span className="text-emerald-300 font-semibold">
            {pro.successText}
          </span>
        </div>
      </div>
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-brand-dark/95 via-brand-hero/90 to-brand-hero/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-400 ease-out flex flex-col justify-end p-5 text-white transform translate-y-3 group-hover:translate-y-0">
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="text-[9.5px] font-bold uppercase tracking-wide text-brand-accent bg-brand-accent/20 px-2 py-0.5 rounded-full border border-brand-accent/30 whitespace-nowrap shrink-0">
            Top Rated Artisan
          </span>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-300 whitespace-nowrap shrink-0">
            <span className="text-amber-400">★ {pro.rating}</span>
            <span className="text-slate-300 text-[10.5px] font-normal whitespace-nowrap">
              ({pro.reviews} reviews)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {pro.name}
          </h3>
          <BadgeCheckIcon className="w-4 h-4 text-brand-accent flex-shrink-0" />
        </div>
        <p className="text-xs text-emerald-100 font-medium mt-0.5">{pro.role}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {pro.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-white/15 text-[10px] font-medium text-slate-100 border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 text-center text-xs my-3 py-2 rounded-xl bg-white/10 border border-white/10">
          <div>
            <span className="text-slate-300 block text-[10px] uppercase tracking-wider">
              Location
            </span>
            <span className="font-bold text-white">{pro.location}</span>
          </div>
          <div>
            <span className="text-slate-300 block text-[10px] uppercase tracking-wider">
              Job Success
            </span>
            <span className="font-bold text-brand-accent">{pro.success}%</span>
          </div>
        </div>
        <a
          href="#pros"
          className="w-full py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
        >
          <span>View Profile</span>
          <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
}

export function RatedProfessionals() {
  return (
    <section
      className="border-t border-slate-100 py-12 bg-white"
      data-purpose="rated-professionals"
      id="pros"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Highest Rated Professionals
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Verified background checks, CNIC authenticated, and client
              recommended
            </p>
          </div>
          <a
            className="text-sm font-semibold text-slate-700 hover:text-brand-accent flex items-center gap-1 transition"
            href="#pros"
          >
            All Professionals
            <ArrowRightIcon className="w-4 h-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pros.map((pro) => (
            <ProCard key={pro.name} pro={pro} />
          ))}
        </div>
      </div>
    </section>
  );
}