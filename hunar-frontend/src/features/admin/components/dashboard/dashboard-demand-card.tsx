import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import type { LiveJobItem, WorkerUser } from "@/types/admin";

interface CategoryRow {
  category: string;
  jobs: number;
  workers: number;
}

/** Wharf `.hbars`: dual-track rows — demand (navy 10px) vs supply (teal 4px). */
export function DashboardDemandCard({
  liveJobs,
  workers,
}: {
  liveJobs: LiveJobItem[];
  workers: WorkerUser[];
}) {
  const rows = useMemo<CategoryRow[]>(() => {
    const jobCounts = new Map<string, number>();
    for (const job of liveJobs) {
      if (job.status === "COMPLETED" || job.status === "CANCELLED") continue;
      jobCounts.set(job.category, (jobCounts.get(job.category) ?? 0) + 1);
    }
    const workerCounts = new Map<string, number>();
    for (const w of workers) {
      if (w.verificationStatus !== "VERIFIED") continue;
      for (const skill of w.skills) {
        workerCounts.set(skill, (workerCounts.get(skill) ?? 0) + 1);
      }
    }
    const categories = new Set([...jobCounts.keys(), ...workerCounts.keys()]);
    return [...categories]
      .map((category) => ({
        category,
        jobs: jobCounts.get(category) ?? 0,
        workers: workerCounts.get(category) ?? 0,
      }))
      .sort((a, b) => b.jobs - a.jobs || b.workers - a.workers || a.category.localeCompare(b.category))
      .slice(0, 6);
  }, [liveJobs, workers]);

  const maxJobs = Math.max(...rows.map((r) => r.jobs), 1);

  return (
    <article className="wf-card" data-card style={{ "--ci": 2 } as React.CSSProperties}>
      <header className="wf-card__head">
        <div>
          <h3 className="wf-card__title">Demand vs supply</h3>
          <p className="wf-card__sub">Open jobs vs verified workers by category</p>
        </div>
        <Link href="/admin/users/workers" className="wf-link">
          Workforce
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="wf-empty">No open jobs right now</div>
      ) : (
        <ul className="wf-hbars wf-anim-hbars" data-enter-list>
          {rows.map((row, i) => (
            <li key={row.category} className="wf-hbar wf-hbar--dual" style={{ "--hi": i } as React.CSSProperties}>
              <span className="wf-hbar__label" title={row.category}>
                {row.category}
              </span>
              <div
                className="wf-hbar__tracks"
                role="img"
                aria-label={`${row.category}: ${row.jobs} open jobs, ${row.workers} verified workers`}
              >
                <span className="wf-hbar__track">
                  <span
                    className="wf-hbar__fill"
                    style={{ transform: `scaleX(${row.jobs / maxJobs})` }}
                  />
                </span>
                <span className="wf-hbar__track wf-hbar__track--supply">
                  <span
                    className="wf-hbar__fill wf-hbar__fill--supply"
                    style={{ transform: `scaleX(${Math.min(row.workers / maxJobs, 1)})` }}
                  />
                </span>
              </div>
              <span className="wf-hbar__val">
                {row.jobs}
                <span className="wf-hbar__val-muted"> / {row.workers}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <footer className="wf-card__foot">Jobs / workers</footer>
    </article>
  );
}
