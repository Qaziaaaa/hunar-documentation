export function Testimonials() {
  const stats = [
    { value: "4.9/5", label: "Clients rate professionals on WorkerFIX" },
    { value: "95%", label: "95% of customers book repeat services" },
    { value: "Award winner", label: "G2 2025 Best Service Platform" },
  ];

  return (
    <section className="bg-white py-14" data-purpose="testimonials-metrics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-slate-50 border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              People Love To Work With WorkerFIX
            </h2>
            <p className="text-slate-500 text-sm max-w-lg">
              Transparent quotes, real-time tracking of technicians, and
              verified ID accountability on every doorstep.
            </p>
            <div className="grid grid-cols-3 gap-6 pt-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 bg-white p-7 sm:p-8 rounded-2xl shadow-xl border border-slate-100 relative">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-accent block mb-2">
              Great Work
            </span>
            <div className="text-emerald-500 font-serif text-4xl leading-none mb-2">
              “
            </div>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6 italic">
              &quot;WorkerFIX took all the anxiety out of emergency plumbing and
              electrical repairs. Transparent price quote received in 10
              minutes, pro arrived with complete tools, immaculate craft.&quot;
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Maryam Nawaz"
                  className="w-full h-full object-cover"
                  src="/landing/maryam-nawaz-alt.png"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Faryal</p>
                <p className="text-xs text-slate-500">
                  Homeowner, DHA Phase 6, Lahore
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}