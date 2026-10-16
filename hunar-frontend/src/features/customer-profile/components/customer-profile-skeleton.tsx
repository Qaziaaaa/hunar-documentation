"use client";

export function CustomerProfileSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-16 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-36 rounded-full bg-slate-200" />
            <div className="h-4 w-28 rounded-md bg-slate-100" />
          </div>
          <div className="h-8 w-60 sm:w-80 rounded-xl bg-slate-200" />
          <div className="h-4 w-72 sm:w-96 rounded-md bg-slate-100" />
        </div>
      </div>

      {/* Persistent Customer Profile Header Card Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar Circle Skeleton */}
            <div className="size-16 sm:size-20 rounded-full bg-slate-200 shrink-0" />

            {/* Profile Info Summary Skeleton */}
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-6 w-36 sm:w-48 rounded-lg bg-slate-200" />
                <div className="h-5 w-20 rounded-full bg-slate-100" />
              </div>
              <div className="h-3.5 w-52 sm:w-64 rounded-md bg-slate-100" />
              <div className="h-3.5 w-64 sm:w-80 rounded-md bg-slate-100" />
            </div>
          </div>

          {/* Trust Score & Rating Pills Skeleton */}
          <div className="flex items-center gap-4 sm:gap-6 bg-slate-50 border border-slate-200/80 px-5 py-3 rounded-2xl self-start lg:self-auto">
            <div className="space-y-1 text-center">
              <div className="h-2.5 w-16 bg-slate-200 rounded-md mx-auto" />
              <div className="h-4 w-12 bg-slate-200 rounded-md mx-auto" />
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="space-y-1 text-center">
              <div className="h-2.5 w-14 bg-slate-200 rounded-md mx-auto" />
              <div className="h-4 w-12 bg-slate-200 rounded-md mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs Skeleton */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <div className="h-8 w-24 rounded-lg bg-slate-200" />
        <div className="h-8 w-28 rounded-lg bg-slate-100" />
        <div className="h-8 w-24 rounded-lg bg-slate-100" />
        <div className="h-8 w-20 rounded-lg bg-slate-100" />
      </div>

      {/* Main Tab Content Card Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="h-6 w-44 rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <div className="h-3.5 w-24 rounded-md bg-slate-200" />
            <div className="h-11 w-full rounded-xl bg-slate-100 border border-slate-200/70" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-28 rounded-md bg-slate-200" />
            <div className="h-11 w-full rounded-xl bg-slate-100 border border-slate-200/70" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-32 rounded-md bg-slate-200" />
            <div className="h-11 w-full rounded-xl bg-slate-100 border border-slate-200/70" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-20 rounded-md bg-slate-200" />
            <div className="h-11 w-full rounded-xl bg-slate-100 border border-slate-200/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
