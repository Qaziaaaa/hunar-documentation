import { HeartIcon, LongArrowRightIcon } from "./icons";
import { categoryTabs, services, type Service } from "./data";

function ServiceCard({ service }: { service: Service }) {
  return (
    <a
      href={service.href}
      className="group relative h-[224px] sm:h-[240px] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 bg-slate-900 border border-slate-200/80 cursor-pointer block rounded-2xl"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={service.alt}
        className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 ease-out"
        src={service.image}
      />
      <button
        aria-label="Favorite"
        className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur text-slate-400 hover:text-red-500 flex items-center justify-center shadow transition duration-300 z-20 opacity-0 group-hover:opacity-100"
      >
        <HeartIcon className="w-4 h-4" />
      </button>
      <div className="absolute inset-x-0 bottom-0 p-4 pt-14 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-accent">
          {service.category}
        </p>
        <h3 className="text-sm font-bold text-white tracking-tight mt-0.5 line-clamp-2">
          {service.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-300">
          <span className="text-amber-400 font-bold flex items-center gap-0.5">
            ★ {service.rating}
          </span>
          <span>({service.reviews})</span>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-out">
        <div className="m-2 bg-slate-950/85 backdrop-blur-md border border-white/10 p-4 rounded-xl">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-brand-accent">
            {service.category}
          </p>
          <h3 className="text-sm font-bold text-white tracking-tight mt-0.5 line-clamp-1">
            {service.title}
          </h3>
          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
            {service.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                ★ {service.rating}
              </span>
              <span>({service.reviews})</span>
            </div>
            <span className="inline-flex items-center gap-1 text-brand-accent text-[11px] font-bold">
              View
              <LongArrowRightIcon className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

export function PopularServices() {
  return (
    <section
      className="bg-white border-t border-slate-100 py-12"
      data-purpose="popular-services-catalog"
      id="services"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Popular Services
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Most viewed and all-time top-selling services
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {categoryTabs.map((tab) =>
              tab.active ? (
                <button
                  key={tab.label}
                  className="px-4 py-2 rounded-full bg-brand-hero text-white"
                >
                  {tab.label}
                </button>
              ) : (
                <a
                  key={tab.label}
                  href={tab.href}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  {tab.label}
                </a>
              )
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <a
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full border border-slate-300 hover:border-brand-hero text-slate-700 hover:text-brand-hero font-semibold text-sm transition"
            href="#services"
          >
            <span>All Services</span>
            <LongArrowRightIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}