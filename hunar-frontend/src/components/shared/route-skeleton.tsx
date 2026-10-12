// Lightweight prerenderable skeletons for loading.tsx route fallbacks.
// Server component — no hooks, streams instantly while the route's data loads.

function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-slate-200/70 ${className}`} />;
}

export function RouteSkeleton({ variant = "list" }: { variant?: "hero" | "list" }) {
  return (
    <div className="animate-pulse space-y-4 p-4 md:p-6" aria-busy="true">
      <div className="space-y-2">
        <Bar className="h-4 w-24" />
        <Bar className="h-7 w-56 max-w-full" />
        <Bar className="h-3 w-80 max-w-full" />
      </div>

      {variant === "hero" ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Bar className="h-20" />
            <Bar className="h-20" />
            <Bar className="h-20" />
            <Bar className="h-20" />
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Bar className="h-40 lg:col-span-2" />
            <Bar className="h-40" />
          </div>
        </>
      ) : (
        <>
          <Bar className="h-16" />
          <div className="space-y-3">
            <Bar className="h-24" />
            <Bar className="h-24" />
            <Bar className="h-24" />
          </div>
        </>
      )}
    </div>
  );
}
