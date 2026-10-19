import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { AdminKpiStats } from "@/types/admin";

const STAGES = [
  { key: "open", label: "Open", mod: "s1", pick: (k: AdminKpiStats) => k.openJobs },
  { key: "active", label: "In progress", mod: "s2", pick: (k: AdminKpiStats) => k.activeJobs },
  { key: "completed", label: "Completed", mod: "s3", pick: (k: AdminKpiStats) => k.completedJobs },
  { key: "cancelled", label: "Cancelled", mod: "s4", pick: (k: AdminKpiStats) => k.cancelledJobs },
] as const;

/** Wharf `.stack`: 14px bar, flex-basis %, 1s scaleX grow staggered; 2-col legend. */
export function DashboardPipelineCard({ kpis }: { kpis: AdminKpiStats }) {
  const counts = STAGES.map((s) => ({ ...s, count: s.pick(kpis) }));
  const total = counts.reduce((a, s) => a + s.count, 0);

  return (
    <article className="wf-card" data-card style={{ "--ci": 1 } as React.CSSProperties}>
      <header className="wf-card__head">
        <div>
          <h3 className="wf-card__title">Job pipeline</h3>
          <p className="wf-card__sub">Open orders by stage</p>
        </div>
        <Link href="/admin/jobs" className="wf-link">
          All jobs
        </Link>
      </header>

      <div
        className="wf-stack__bar wf-anim-stack"
        role="img"
        aria-label={`Job pipeline: ${counts.map((s) => `${s.label} ${s.count}`).join(", ")}`}
      >
        {total > 0 ? (
          counts.map((s, i) =>
            s.count > 0 ? (
              <span
                key={s.key}
                className={`wf-stack__seg wf-stack__seg--${s.mod}`}
                style={
                  {
                    flexBasis: `${(s.count / total) * 100}%`,
                    "--si": i,
                  } as React.CSSProperties
                }
                title={`${s.label}: ${s.count}`}
              />
            ) : null,
          )
        ) : (
          <span className="wf-stack__seg" style={{ flexBasis: "100%", background: "var(--well)" }} />
        )}
      </div>

      <ul className="wf-stack__legend wf-anim-stack" data-enter-list>
        {counts.map((s, i) => (
          <li key={s.key} style={{ "--si": i } as React.CSSProperties}>
            <span className={`wf-stack__swatch wf-stack__seg--${s.mod}`} aria-hidden />
            <span className="wf-stack__lbl">{s.label}</span>
            <span className="wf-stack__n">{s.count}</span>
          </li>
        ))}
      </ul>

      <p className="wf-card__foot">{kpis.totalJobs.toLocaleString()} jobs total</p>
    </article>
  );
}
