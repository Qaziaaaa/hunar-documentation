import { brands } from "./data";

export function TrustedBrands() {
  return (
    <section
      className="py-12 bg-white border-y border-slate-100"
      data-purpose="trusted-brands-strip"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">
          Trusted by leading businesses & residents across Peshawar & KPK
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-60 grayscale hover:grayscale-0 transition duration-300">
          {brands.map((brand) => (
            <span
              key={brand.label}
              className={`text-lg sm:text-xl text-slate-800 ${brand.className}`}
            >
              {brand.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}