"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/api/admin-api";
import { adminKeys, fetchJobsPage, JOBS_PAGE_SIZE } from "@/features/admin/queries";
import { Link } from "@/i18n/navigation";
import type { LiveJobItem } from "@/types/admin";
import { TableRowsSkeleton } from "@/features/admin/components/table-skeleton";
import { AlertCircle, Briefcase, Eye, Filter, Search } from "lucide-react";

export default function JobsPage() {
  // Paged browse: 25 per Load More, always refetched on mount (matches the
  // old load-once hook but keeps already-seen pages on screen while it does).
  const jobsQuery = useInfiniteQuery({
    queryKey: adminKeys.jobsList,
    queryFn: ({ pageParam }) => fetchJobsPage(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Live delta: every 20s ask only for jobs created after the newest row we
  // already have (tiny response), prepend the genuinely new ones.
  const latestRef = useRef<string | null>(null);
  const deltaQuery = useQuery({
    queryKey: adminKeys.jobsDelta,
    queryFn: async () => {
      const since = latestRef.current;
      const res = await adminApi.listJobs({
        page: 1,
        limit: JOBS_PAGE_SIZE,
        ...(since ? { since } : {}),
      });
      return res.items;
    },
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  const [liveExtra, setLiveExtra] = useState<LiveJobItem[]>([]);
  useEffect(() => {
    const incoming = deltaQuery.data;
    if (!incoming || incoming.length === 0) return;
    queueMicrotask(() => {
      setLiveExtra((prev) => {
        const seen = new Set(prev.map((j) => j.id));
        const fresh = incoming.filter((j) => !seen.has(j.id));
        if (fresh.length === 0) return prev;
        return [...fresh, ...prev].slice(0, 200);
      });
    });
  }, [deltaQuery.data]);

  const pagedJobs = useMemo(
    () => (jobsQuery.data?.pages ?? []).flatMap((p) => p.items),
    [jobsQuery.data],
  );

  // Newest first, deduped across the live feed and every loaded page.
  const jobs = useMemo(() => {
    const seen = new Set<string>();
    const out: LiveJobItem[] = [];
    for (const j of [...liveExtra, ...pagedJobs]) {
      if (seen.has(j.id)) continue;
      seen.add(j.id);
      out.push(j);
    }
    return out;
  }, [liveExtra, pagedJobs]);

  // Track the newest createdAt on screen — the next delta asks only for newer.
  useEffect(() => {
    let max: string | null = null;
    for (const j of jobs) {
      if (j.createdAt && (!max || j.createdAt > max)) max = j.createdAt;
    }
    latestRef.current = max;
  }, [jobs]);

  const loadError =
    jobsQuery.isError && !jobsQuery.data
      ? jobsQuery.error instanceof Error && jobsQuery.error.message
        ? jobsQuery.error.message
        : "Failed to load jobs"
      : null;

  const fetchNextPage = jobsQuery.fetchNextPage;
  const hasNextPage = jobsQuery.hasNextPage;
  const isFetchingNextPage = jobsQuery.isFetchingNextPage;
  const loadMoreRef = useRef<HTMLButtonElement | null>(null);
  // Auto Load More when the button scrolls near the viewport.
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void fetchNextPage();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = useMemo(
    () =>
      jobs.filter((j) => {
        const matchesSearch =
          !search ||
          (j.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (j.customerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (j.workerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (j.category ?? "").toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "ALL" ? true : j.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [jobs, search, statusFilter],
  );

  return (
<div className="space-y-6">
        {loadError && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-500" />
              <span className="text-sm font-bold text-red-700">Jobs failed to load</span>
              <span className="text-xs font-medium text-red-600">{loadError}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                void jobsQuery.refetch();
                void deltaQuery.refetch();
              }}
              className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <Briefcase className="size-3.5" />
              Work Orders Control
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            Jobs & Work Orders Monitoring
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Monitor active customer requests, track status progress, and inspect job audit records
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, customer, worker, or category..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
            <Filter className="ml-2 size-3.5 text-slate-400" />
            {["ALL", "IN_PROGRESS", "OFFERS_RECEIVING", "COMPLETED", "DISPUTED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  statusFilter === st
                    ? "bg-navy text-white shadow-sm"
                    : "text-slate-600 hover:text-navy"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-4">Job Title / Category</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Assigned Worker</th>
                <th className="py-4 px-4">Amount</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {jobsQuery.isPending ? (
                <TableRowsSkeleton colSpan={6} label="Loading jobs" />
              ) : filtered.map((job) => (
                <tr key={job.id} className="transition hover:bg-slate-50">
                  <td className="py-4 px-4">
                    <p className="font-extrabold text-navy">{job.title}</p>
                    <p className="text-[10px] text-slate-400">
                      ID: {job.id} • {job.category} • {job.city}
                    </p>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-700">
                    {job.customerName}
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    {job.workerName || "Unassigned"}
                  </td>
                  <td className="py-4 px-4 font-extrabold text-navy">
                    Rs. {job.amount.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        job.status === "IN_PROGRESS"
                          ? "border-teal/20 bg-teal/10 text-teal"
                          : job.status === "COMPLETED"
                          ? "border-green-200 bg-green-100 text-green-700"
                          : job.status === "DISPUTED"
                          ? "border-red-200 bg-red-100 text-red-700"
                          : "border-slate-200 bg-slate-100 text-slate-700"
                      }`}
                    >
                      {job.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-navy hover:bg-slate-50"
                    >
                      <Eye className="size-3.5 text-teal" /> Drill-Down
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasNextPage ? (
          <div className="flex items-center justify-center gap-3">
            <button
              ref={loadMoreRef}
              type="button"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-navy shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              {isFetchingNextPage
                ? "Loading…"
                : `Load more jobs (${jobs.length} loaded${
                    jobsQuery.data?.pages[0]?.meta.total
                      ? ` of ${jobsQuery.data.pages[0].meta.total}`
                      : ""
                  })`}
            </button>
          </div>
        ) : null}
      </div>
);
}
