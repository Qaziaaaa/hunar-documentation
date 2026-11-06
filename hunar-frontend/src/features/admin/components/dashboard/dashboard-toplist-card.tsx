import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { AdminAvatar } from "@/features/admin/components/admin-avatar";
import type { WorkerUser } from "@/types/admin";

/** Wharf `.toplist`: rank | name + 4px rating bar | rating + earnings. */
export function DashboardToplistCard({
  workers,
  totalWorkers,
}: {
  workers: WorkerUser[];
  totalWorkers?: number;
}) {
  const top = useMemo(
    () =>
      [...workers]
        .sort((a, b) => b.rating - a.rating || b.totalEarnings - a.totalEarnings)
        .slice(0, 5),
    [workers],
  );

  return (
    <article className="wf-card" data-card style={{ "--ci": 3 } as React.CSSProperties}>
      <header className="wf-card__head">
        <div>
          <h3 className="wf-card__title">Top workers</h3>
          <p className="wf-card__sub">By rating, then earnings</p>
        </div>
        <Link href="/admin/users/workers" className="wf-link">
          All workers
        </Link>
      </header>

      {top.length === 0 ? (
        <div className="wf-empty">No workers yet</div>
      ) : (
        <ol className="wf-toplist wf-anim-toplist" data-enter-list>
          {top.map((w, i) => (
            <li key={w.id} style={{ "--ti": i } as React.CSSProperties}>
              <span className="wf-toplist__rank">{i + 1}</span>
              <AdminAvatar
                src={w.avatarUrl}
                name={w.name}
                className="size-7 rounded-lg text-[10px] shadow-none"
              />
              <div className="wf-toplist__body">
                <span className="wf-toplist__name" title={w.name}>
                  {w.name}
                </span>
                <span className="wf-toplist__bar" aria-hidden>
                  <span
                    className="wf-toplist__fill"
                    style={{ transform: `scaleX(${Math.min(w.rating / 5, 1)})` }}
                  />
                </span>
              </div>
              <span className="wf-toplist__n">
                {w.rating > 0 ? `★ ${w.rating.toFixed(1)}` : "★ —"}
                <small>Rs. {Math.round(w.totalEarnings).toLocaleString()}</small>
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="wf-card__foot">
        {totalWorkers ?? workers.length} workers on platform
      </p>
    </article>
  );
}
