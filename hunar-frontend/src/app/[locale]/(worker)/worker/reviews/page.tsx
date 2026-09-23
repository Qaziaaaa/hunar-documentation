"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { RatingSummary } from "@/components/shared/rating-summary";
import { ReviewCard } from "@/components/shared/review-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getRatingSummary, getWorkerReviews, queryKeys } from "@/services/worker/review.service";
import { getWorkerProfile, queryKeys as profileKeys } from "@/services/worker/profile.service";

export default function ReviewsPage() {
  const t = useTranslations("Worker");
  const profile = useQuery({ queryKey: profileKeys.profile(), queryFn: getWorkerProfile });
  const workerId = profile.data?.id ?? "worker-demo-1";
  const rating = useQuery({ queryKey: queryKeys.rating(workerId), queryFn: () => getRatingSummary(workerId), enabled: Boolean(workerId) });
  const reviews = useQuery({ queryKey: queryKeys.reviews(workerId, 1), queryFn: () => getWorkerReviews(workerId), enabled: Boolean(workerId) });
  if (profile.isPending || rating.isPending || reviews.isPending) return <LoadingState label={t("common.loading")} />;
  if (profile.isError || rating.isError || reviews.isError) return <ErrorState title={t("empty.errorTitle")} description={t("empty.errorDescription")} onRetry={() => { void profile.refetch(); void rating.refetch(); void reviews.refetch(); }} />;
  return <div className="space-y-6"><PageHeader title={t("reviews.title")} description={t("reviews.description")} /><RatingSummary summary={rating.data} title={t("reviews.ratingBreakdown")} reviewLabel={t("reviews.reviewsCount", { count: rating.data.totalReviews })} starLabel={t("reviews.stars", { count: 1 })} />{reviews.data.items.length === 0 ? <EmptyState title={t("reviews.emptyTitle")} description={t("reviews.emptyDescription")} /> : <div className="grid gap-4 lg:grid-cols-2">{reviews.data.items.map((review) => <ReviewCard key={review.id} review={review} jobLabel={t("reviews.jobReference")} noCommentLabel={t("reviews.noComment")} />)}</div>}</div>;
}