"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/api/admin-api";
import { adminKeys } from "@/features/admin/queries";
import { TableRowsSkeleton } from "@/features/admin/components/table-skeleton";
import { Link } from "@/i18n/navigation";
import {
  Eye,
  EyeOff,
  Filter,
  MessageSquare,
  Search,
  Star,
  UserCheck,
  Users,
} from "lucide-react";

export default function ReviewsPage() {
  const reviewsQuery = useQuery({
    queryKey: adminKeys.reviews,
    queryFn: () => adminApi.listReviews({ limit: 50 }),
    staleTime: 0,
  });
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const rawReviews = reviewsQuery.data?.items ?? [];
  const reviews = reviewsList.length > 0 ? reviewsList : rawReviews;

  const filtered = useMemo(
    () =>
      reviews.filter((r: any) => {
        const matchesSearch =
          (r.jobTitle && r.jobTitle.toLowerCase().includes(search.toLowerCase())) ||
          (r.comment && r.comment.toLowerCase().includes(search.toLowerCase())) ||
          (r.reviewer?.name && r.reviewer.name.toLowerCase().includes(search.toLowerCase())) ||
          (r.reviewee?.name && r.reviewee.name.toLowerCase().includes(search.toLowerCase()));

        const matchesRating =
          ratingFilter === "ALL" ? true : r.rating === Number(ratingFilter);

        return matchesSearch && matchesRating;
      }),
    [reviews, search, ratingFilter],
  );

  const handleToggleVisibility = async (reviewId: string, currentVisible: boolean) => {
    const nextState = !currentVisible;
    setActionError(null);
    try {
      await adminApi.toggleReviewVisibility(reviewId, nextState);
      setReviewsList(
        reviews.map((r) => (r.id === reviewId ? { ...r, isVisible: nextState } : r)),
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update review visibility",
      );
    }
  };

  return (
<div className="space-y-6">
        {actionError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            Action failed: {actionError}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <Star className="size-3.5 fill-teal text-teal" />
              Quality & Trust Moderation
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            Reviews & Ratings Management
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Monitor feedback submitted by customers and workers, audit star ratings, and toggle visibility
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by review text, customer name, worker name, or job..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
            <Filter className="ml-2 size-3.5 text-slate-400" />
            {["ALL", "5", "4", "3", "2", "1"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRatingFilter(r)}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  ratingFilter === r
                    ? "bg-navy text-white shadow-sm"
                    : "text-slate-600 hover:text-navy"
                }`}
              >
                {r === "ALL" ? "All Ratings" : `${r} Star${r !== "1" ? "s" : ""}`}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Datatable */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-4">Job Request</th>
                  <th className="py-4 px-4">Reviewer</th>
                  <th className="py-4 px-4">Reviewee</th>
                  <th className="py-4 px-4">Rating & Comment</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Visibility</th>
                  <th className="py-4 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {reviewsQuery.isPending ? (
                  <TableRowsSkeleton colSpan={7} label="Loading reviews" />
                ) : filtered.map((rev: any) => (
                  <tr key={rev.id} className="transition hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <Link
                        href={`/admin/jobs/${rev.jobId}`}
                        className="font-extrabold text-navy hover:text-teal"
                      >
                        {rev.jobTitle}
                      </Link>
                      <p className="text-[10px] text-slate-400">ID: {rev.jobId}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <Users className="size-3.5 text-slate-400" />
                        <span>{rev.reviewer?.name ?? rev.reviewer?.phone ?? "—"}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase text-slate-400">
                        {rev.reviewer?.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 font-semibold text-teal">
                        <UserCheck className="size-3.5 text-teal" />
                        <span>{rev.reviewee?.name ?? rev.reviewee?.phone ?? "—"}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase text-slate-400">
                        {rev.reviewee?.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center gap-1 font-extrabold text-navy">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${
                              i < rev.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs">{rev.rating}/5</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {rev.comment || "No comment written."}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          rev.isVisible
                            ? "border-green-200 bg-green-100 text-green-700"
                            : "border-red-200 bg-red-100 text-red-700"
                        }`}
                      >
                        {rev.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(rev.id, rev.isVisible)}
                        className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                          rev.isVisible
                            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            : "border-teal/30 bg-teal/10 text-teal hover:bg-teal/20"
                        }`}
                      >
                        {rev.isVisible ? (
                          <>
                            <EyeOff className="size-3.5 text-red-600" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="size-3.5 text-teal" /> Restore
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
);
}
