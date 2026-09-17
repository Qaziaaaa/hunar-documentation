import { HeartIcon, LongArrowRightIcon } from "./icons";
import { categoryTabs, services, type Service } from "./data";

function ServiceCard({ service }: { service: Service }) {
  return (
    <a
      href={service.href}
      className="group rounded-2xl border border-slate-200 bg-white hover:shadow-xl hover:border-brand-accent transition-all duration-300 flex flex-col overflow-hidden cursor-pointer block"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={service.alt}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          src={service.image}
        />
        <button
          aria-label="Favorite"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur text-slate-400 hover:text-red-500 flex items-center justify-center shadow transition"
        >
          <HeartIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {service.category}
          </p>
          <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2 hover:text-brand-accent transition">
            {service.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
          <span className="text-amber-400 font-bold flex items-center gap-0.5">
            ★ {service.rating}
          </span>
          <span>({service.reviews} reviews)</span>
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