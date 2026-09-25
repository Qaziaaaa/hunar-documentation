import { Suspense } from "react";
import { Metadata } from "next";
import { PostJobWizard } from "@/features/post-job/components/post-job-wizard";

export const metadata: Metadata = {
  title: "Post a Job | WorkerFIX",
  description:
    "Post a home repair or installation request and receive instant quotes from verified local technicians in Peshawar.",
};

export default function PostJobPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 rounded-full border-2 border-[#0F766E] border-t-transparent animate-spin" />
            <span className="text-xs text-slate-500 font-medium">
              Loading WorkerFIX Job Post Wizard...
            </span>
          </div>
        </div>
      }
    >
      <PostJobWizard />
    </Suspense>
  );
}
