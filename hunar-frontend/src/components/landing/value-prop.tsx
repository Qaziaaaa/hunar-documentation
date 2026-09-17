import { CheckIcon } from "./icons";
import { valuePropPoints } from "./data";

export function ValueProp() {
  return (
    <section
      className="bg-white overflow-hidden py-14"
      data-purpose="value-prop-banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] bg-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Professional Electrician & DB Technician"
                className="w-full h-full object-cover"
                src="/landing/electrician-db-technician.png"
              />
            </div>
            <a
              href="#pros"
              className="absolute -bottom-6 -right-2 sm:right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 hover:scale-105 transition-transform"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Maqsood Raza"
                  className="w-full h-full object-cover rounded-xl"
                  src="/landing/maqsood-raza-large.png"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Maqsood Raza (Verified Engineer)
                </p>
                <p className="text-[11px] text-emerald-600 font-medium">
                  ● Available for immediate visit
                </p>
              </div>
            </a>
          </div>
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              For clients
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Find trusted local craft your way
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Work with the largest network of independent skilled
              professionals and get things done — from quick emergency repairs
              to turnkey installations.
            </p>
            <div className="p-6 rounded-2xl bg-brand-hero text-white space-y-4 shadow-lg">
              {valuePropPoints.map((point) => (
                <div key={point} className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium">{point}</span>
                </div>
              ))}
            </div>
            <div>
              <a
                className="inline-flex items-center px-8 py-3.5 rounded-full bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold text-sm transition shadow-md"
                href="#services"
              >
                Post a Job
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}