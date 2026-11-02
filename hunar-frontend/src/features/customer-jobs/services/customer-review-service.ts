"use client";

import { getJobDetail, getCustomerJobs } from "../api/customer-jobs-api";
import type { CustomerJob } from "../types";
import { getAccessToken } from "@/lib/api-client";

const REVIEW_DISMISSED_KEY_PREFIX = "hunar_review_dismissed_";
const REVIEW_COMPLETED_KEY_PREFIX = "hunar_review_completed_";
const CHANNEL_NAME = "hunar_customer_review_channel";

export type ReviewEventListener = (job: CustomerJob | null, isOpen: boolean) => void;

class CustomerReviewService {
  private activeJob: CustomerJob | null = null;
  private isModalOpen: boolean = false;
  private listeners: Set<ReviewEventListener> = new Set();
  private channel: BroadcastChannel | null = null;
  private inFlightJobPrompt: string | null = null;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === "PROMPT_REVIEW" && event.data.job) {
            this.activeJob = event.data.job;
            this.isModalOpen = true;
            this.notifyListeners(this.activeJob, true);
          } else if (event.data?.type === "CLOSE_REVIEW") {
            this.isModalOpen = false;
            this.activeJob = null;
            this.notifyListeners(null, false);
          } else if (event.data?.type === "REVIEW_COMPLETED" && event.data.jobId) {
            this.markReviewCompletedLocally(event.data.jobId);
            this.isModalOpen = false;
            this.activeJob = null;
            this.notifyListeners(null, false);
          }
        };
      } catch {
        this.channel = null;
      }
    }
  }

  getActiveJob(): CustomerJob | null {
    return this.activeJob;
  }

  isOpen(): boolean {
    return this.isModalOpen;
  }

  isDismissedInSession(jobId: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(`${REVIEW_DISMISSED_KEY_PREFIX}${jobId}`) === "true";
    } catch {
      return false;
    }
  }

  isReviewCompleted(jobId: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      return (
        localStorage.getItem(`${REVIEW_COMPLETED_KEY_PREFIX}${jobId}`) === "true" ||
        sessionStorage.getItem(`${REVIEW_COMPLETED_KEY_PREFIX}${jobId}`) === "true"
      );
    } catch {
      return false;
    }
  }

  markReviewCompletedLocally(jobId: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${REVIEW_COMPLETED_KEY_PREFIX}${jobId}`, "true");
      sessionStorage.setItem(`${REVIEW_COMPLETED_KEY_PREFIX}${jobId}`, "true");
    } catch {
      // ignore
    }
  }

  promptReview(job: CustomerJob, options?: { force?: boolean }): void {
    if (job.hasReviewed || job.customerReview || this.isReviewCompleted(job.id)) {
      return;
    }

    if (!options?.force && this.isDismissedInSession(job.id)) {
      return;
    }

    this.activeJob = job;
    this.isModalOpen = true;
    this.notifyListeners(job, true);

    try {
      this.channel?.postMessage({ type: "PROMPT_REVIEW", job });
    } catch {
      // ignore
    }
  }

  async promptReviewByJobId(
    jobId: string,
    options?: { force?: boolean }
  ): Promise<boolean> {
    if (!jobId) return false;
    const cleanId = jobId.replace(/^#/, "").trim();

    // Prevent duplicate concurrent prompts for the same job
    if (this.inFlightJobPrompt === cleanId) return false;
    if (this.isModalOpen && this.activeJob?.id === cleanId) return true;

    if (!options?.force) {
      if (this.isDismissedInSession(cleanId) || this.isReviewCompleted(cleanId)) {
        return false;
      }
    }

    this.inFlightJobPrompt = cleanId;
    try {
      const job = await getJobDetail(cleanId);
      if (!job) return false;

      const normStatus = String(job.rawStatus || job.status || "").toUpperCase();
      const isCompleted =
        normStatus === "COMPLETED" ||
        normStatus === "PAID" ||
        normStatus === "REVIEWED" ||
        job.status === "completed";

      if (job.hasReviewed || job.customerReview || normStatus === "REVIEWED") {
        this.markReviewCompletedLocally(cleanId);
        return false;
      }

      if (isCompleted) {
        this.promptReview(job, options);
        return true;
      }

      return false;
    } catch (err) {
      console.warn("[CustomerReviewService] Failed to load job for review:", err);
      return false;
    } finally {
      this.inFlightJobPrompt = null;
    }
  }

  dismissReview(jobId?: string): void {
    const targetId = jobId || this.activeJob?.id;
    if (targetId && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`${REVIEW_DISMISSED_KEY_PREFIX}${targetId}`, "true");
      } catch {
        // ignore
      }
    }
    this.isModalOpen = false;
    this.activeJob = null;
    this.notifyListeners(null, false);

    try {
      this.channel?.postMessage({ type: "CLOSE_REVIEW" });
    } catch {
      // ignore
    }
  }

  completeReview(
    jobId: string,
    review?: { rating: number; comment?: string; tags?: string[] }
  ): void {
    const cleanId = jobId.replace(/^#/, "").trim();
    this.markReviewCompletedLocally(cleanId);

    if (this.activeJob && this.activeJob.id === cleanId) {
      this.activeJob = {
        ...this.activeJob,
        hasReviewed: true,
        customerReview: {
          rating: review?.rating ?? 5,
          comment: review?.comment,
          tags: review?.tags,
          date: new Date().toISOString(),
        },
      };
    }

    this.isModalOpen = false;
    this.activeJob = null;
    this.notifyListeners(null, false);

    try {
      this.channel?.postMessage({ type: "REVIEW_COMPLETED", jobId: cleanId, review });
    } catch {
      // ignore
    }
  }

  async checkPendingCompletedJobs(): Promise<CustomerJob | null> {
    const token = getAccessToken("CUSTOMER") || getAccessToken();
    if (!token) return null;

    try {
      const completedJobs = await getCustomerJobs({ tab: "completed", limit: 3 });
      if (!Array.isArray(completedJobs) || completedJobs.length === 0) {
        return null;
      }

      for (const job of completedJobs) {
        const normStatus = String(job.rawStatus || job.status || "").toUpperCase();
        const isCompleted =
          normStatus === "COMPLETED" ||
          normStatus === "PAID" ||
          job.status === "completed";

        if (
          isCompleted &&
          !job.hasReviewed &&
          !job.customerReview &&
          normStatus !== "REVIEWED" &&
          !this.isDismissedInSession(job.id) &&
          !this.isReviewCompleted(job.id)
        ) {
          await this.promptReviewByJobId(job.id);
          return job;
        }
      }

      return null;
    } catch (err) {
      console.warn("[CustomerReviewService] checkPendingCompletedJobs error:", err);
      return null;
    }
  }

  subscribe(listener: ReviewEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(job: CustomerJob | null, isOpen: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(job, isOpen);
      } catch (err) {
        console.error("[CustomerReviewService] listener error:", err);
      }
    });
  }
}

export const customerReviewService = new CustomerReviewService();

