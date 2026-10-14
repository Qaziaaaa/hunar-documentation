import type { PostJobData } from "../types";

/**
 * Builds the customer sign-in URL that resumes the Post a Job wizard at the
 * Review step (Step 4) with the previously entered draft preserved.
 */
export function buildPostJobSignInHref(
  data: Pick<PostJobData, "category" | "subCategory">,
): string {
  const params = new URLSearchParams();
  params.set("resume", "review");
  if (data.category) params.set("category", data.category);
  if (data.subCategory) params.set("subCategory", data.subCategory);

  const returnTo = `/customer/post-job?${params.toString()}`;
  return `/customer/sign-in?redirect=${encodeURIComponent(returnTo)}`;
}
