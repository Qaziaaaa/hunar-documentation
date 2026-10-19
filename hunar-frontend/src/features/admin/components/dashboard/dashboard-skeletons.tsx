const shell = "wf-card";

function Bar({ className = "" }: { className?: string }) {
  return <div className={`wf-shimmer rounded-md ${className}`} />;
}

/** Wharf-shaped skeleton for the hero revenue card. */
export function HeroSkeleton() {
  return (
    <div className={`${shell} wf-hero`} data-testid="hero-skeleton" aria-busy="true" aria-label="Loading revenue">
      <div className="wf-card__head">
        <div>
          <Bar className="h-4 w-32" />
          <Bar className="mt-2 h-3 w-48" />
        </div>
        <Bar className="h-[38px] w-[168px] rounded-[12px]" />
      </div>
      <div className="wf-hero__figure">
        <Bar className="h-10 w-44" />
        <Bar className="h-5 w-28 rounded-full" />
      </div>
      <div className="flex min-h-[240px] flex-1 items-end">
        <Bar className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}

/** 2×2 skeleton block matching the stats grid footprint. */
export function StatsSkeleton() {
  return (
    <div className="wf-stats" data-testid="stats-skeleton" aria-busy="true" aria-label="Loading stats">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${shell} wf-stat`}>
          <div className="wf-stat__head">
            <div className="wf-stat__icon wf-shimmer" />
            <Bar className="h-3 w-20" />
          </div>
          <Bar className="mt-1 h-7 w-24" />
          <Bar className="h-3 w-32" />
          <div className="mt-auto pt-1">
            <Bar className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Single-column card skeleton (pipeline / demand / toplist). */
export function CardSkeleton({ label }: { label: string }) {
  return (
    <div className={shell} data-card aria-busy="true" aria-label={`Loading ${label}`}>
      <div className="wf-card__head">
        <div>
          <Bar className="h-4 w-28" />
          <Bar className="mt-2 h-3 w-40" />
        </div>
      </div>
      <div className="mt-2 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Bar className="h-2.5 w-20 shrink-0" />
            <Bar className="h-2.5 flex-1" />
            <Bar className="h-2.5 w-8 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Wide table skeleton for the activity table.
 *  Sample has no spinner: ghost rows rise in with the sample row-enter
 *  (opacity/y:10, .45s power3.out, 30ms stagger — see .wf-skel-row). */
export function TableSkeleton() {
  return (
    <div className={`${shell} wf-card--table`} data-testid="table-skeleton" aria-busy="true" aria-label="Loading activity">
      <div className="wf-card__head">
        <div className="flex flex-col gap-2" aria-hidden>
          <span
            className="wf-skel-row"
            style={{ width: 144, height: 16, borderRadius: 6, ["--si" as string]: 0 } as React.CSSProperties}
          />
          <span
            className="wf-skel-row"
            style={{ width: 224, height: 12, borderRadius: 6, ["--si" as string]: 1 } as React.CSSProperties}
          />
        </div>
        <div className="flex items-center gap-1.5" aria-hidden>
          {[72, 64, 56, 84].map((w, i) => (
            <span
              key={w}
              className="wf-skel-row"
              style={{ width: w, height: 34, borderRadius: 9, ["--si" as string]: i } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 space-y-2 px-[var(--pad)] pb-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="wf-skel-row flex items-center gap-4 px-3 py-3" style={{ ["--si" as string]: i } as React.CSSProperties}>
            <span className="wf-skel-bar wf-skel-bar--box h-2.5 w-16 shrink-0" />
            <span className="wf-skel-bar wf-skel-bar--box h-2.5 flex-1" />
            <span className="wf-skel-bar wf-skel-bar--box h-2.5 w-20 shrink-0" />
            <span className="wf-skel-bar h-6 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact inline error card with retry. */
export function SectionError({
  label,
  error,
  onRetry,
}: {
  label: string;
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className={`${shell} flex flex-col items-start gap-2`} data-card role="alert">
      <p className="wf-card__title">{label} failed to load</p>
      <p className="wf-card__sub">{error}</p>
      <button type="button" onClick={onRetry} className="wf-btn wf-btn--sm wf-btn--primary mt-1">
        Retry
      </button>
    </div>
  );
}
