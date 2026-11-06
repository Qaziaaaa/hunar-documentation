import { customerReviewService } from "./customer-review-service";
import * as jobsApi from "../api/customer-jobs-api";

jest.mock("../api/customer-jobs-api", () => ({
  getJobDetail: jest.fn(),
  getCustomerJobs: jest.fn(),
}));

jest.mock("@/lib/api-client", () => ({
  getAccessToken: jest.fn(() => "mock-customer-token"),
}));

describe("CustomerReviewService", () => {
  const mockCompletedJob: any = {
    id: "AW3-90W",
    title: "Plumbing Leak Fix",
    category: "Plumbing",
    status: "completed",
    rawStatus: "COMPLETED",
    hasReviewed: false,
    customerReview: null,
    selectedOffer: {
      worker: {
        id: "w1",
        name: "Ali Worker",
        avatarUrl: "https://example.com/avatar.jpg",
      },
    },
  };

  beforeEach(() => {
    customerReviewService.dismissReview();
    sessionStorage.clear();
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("prompts review for an unreviewed completed job", () => {
    const listener = jest.fn();
    const unsub = customerReviewService.subscribe(listener);

    customerReviewService.promptReview(mockCompletedJob, { force: true });

    expect(customerReviewService.isOpen()).toBe(true);
    expect(customerReviewService.getActiveJob()?.id).toBe("AW3-90W");
    expect(listener).toHaveBeenCalledWith(mockCompletedJob, true);

    unsub();
  });

  it("skips prompting if the job is already reviewed", () => {
    const listener = jest.fn();
    const unsub = customerReviewService.subscribe(listener);

    const alreadyReviewedJob = {
      ...mockCompletedJob,
      hasReviewed: true,
      customerReview: { rating: 5, comment: "Great work!" },
    };

    customerReviewService.promptReview(alreadyReviewedJob);

    expect(customerReviewService.isOpen()).toBe(false);
    expect(listener).not.toHaveBeenCalled();

    unsub();
  });

  it("respects session dismissal unless forced", () => {
    customerReviewService.dismissReview("AW3-90W");

    expect(customerReviewService.isDismissedInSession("AW3-90W")).toBe(true);

    const listener = jest.fn();
    const unsub = customerReviewService.subscribe(listener);

    // Without force, should be skipped
    customerReviewService.promptReview(mockCompletedJob, { force: false });
    expect(customerReviewService.isOpen()).toBe(false);
    expect(listener).not.toHaveBeenCalled();

    // With force, should open
    customerReviewService.promptReview(mockCompletedJob, { force: true });
    expect(customerReviewService.isOpen()).toBe(true);

    unsub();
  });

  it("marks review completed and closes session", () => {
    customerReviewService.promptReview(mockCompletedJob, { force: true });
    expect(customerReviewService.isOpen()).toBe(true);

    customerReviewService.completeReview("AW3-90W", { rating: 5, comment: "Excellent service!" });

    expect(customerReviewService.isOpen()).toBe(false);
    expect(customerReviewService.isReviewCompleted("AW3-90W")).toBe(true);
  });

  it("fetches job by id and prompts review if completed", async () => {
    (jobsApi.getJobDetail as jest.Mock).mockResolvedValue(mockCompletedJob);

    const prompted = await customerReviewService.promptReviewByJobId("AW3-90W", { force: true });

    expect(prompted).toBe(true);
    expect(customerReviewService.isOpen()).toBe(true);
    expect(customerReviewService.getActiveJob()?.id).toBe("AW3-90W");
  });

  it("checks pending completed jobs and prompts for the first unreviewed one", async () => {
    (jobsApi.getCustomerJobs as jest.Mock).mockResolvedValue([mockCompletedJob]);
    (jobsApi.getJobDetail as jest.Mock).mockResolvedValue(mockCompletedJob);

    const foundJob = await customerReviewService.checkPendingCompletedJobs();

    expect(foundJob?.id).toBe("AW3-90W");
    expect(customerReviewService.isOpen()).toBe(true);
  });
});
