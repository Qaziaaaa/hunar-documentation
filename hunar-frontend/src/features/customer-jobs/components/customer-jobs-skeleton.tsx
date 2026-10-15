"use client";

export function CustomerJobsSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-24 lg:pb-8 animate-pulse text-[#123B5D]">
      {/* Top Header & Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="h-7 sm:h-8 w-44 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-slate-200/70 rounded-md" />
        </div>

        {/* Action Button Skeleton */}
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
      </div>

      {/* Tabs and Search Skeleton */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl gap-1 w-full md:w-auto">
          <div className="h-10 w-32 bg-slate-200 rounded-xl" />
          <div className="h-10 w-32 bg-slate-200/60 rounded-xl" />
          <div className="h-10 w-28 bg-slate-200/60 rounded-xl" />
        </div>

        {/* Search Input */}
        <div className="h-10 w-full md:w-64 bg-slate-100 rounded-xl border border-slate-200/60" />
      </div>

      {/* Cards Skeleton List */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4"
          >
            {/* Top Row: Ref, Status, Price Callout */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 bg-slate-200 rounded" />
                  <div className="h-5 w-28 bg-slate-200 rounded-full" />
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-6 w-3/4 max-w-md bg-slate-200 rounded-md" />
                <div className="h-4 w-32 bg-slate-100 rounded" />
              </div>

              {/* Price / Budget Callout */}
              <div className="h-10 w-28 bg-slate-100 rounded-xl sm:self-start" />
            </div>

            {/* Pro Info & Location Block */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-40 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-48 bg-slate-200/70 rounded" />
                <div className="h-3.5 w-36 bg-slate-100 rounded" />
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="h-4 w-60 max-w-full bg-slate-100 rounded" />
              <div className="flex items-center gap-2.5 ml-auto rtl:ml-0 rtl:mr-auto">
                <div className="h-9 w-24 bg-slate-200 rounded-xl" />
                <div className="h-9 w-32 bg-slate-200 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
