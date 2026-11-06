import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerReviewModal } from "./customer-review-modal";
import * as repairApi from "../api/customer-repair-api";
import type { CustomerJob } from "../types";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
}));

jest.mock("../api/customer-repair-api", () => ({
  submitJobReview: jest.fn(),
}));

const mockJob: CustomerJob = {
  id: "job-101",
  title: "Paint for a kitchen",
  category: "Painting",
  subCategory: "Interior",
  description: "Paint walls and ceiling",
  photos: [],
  address: "University Road",
  area: "Town",
  city: "Peshawar",
  scheduleType: "asap",
  preferredDate: "2026-10-28",
  preferredTimeSlot: "Morning",
  status: "completed",
  createdAt: "2026-10-28T10:00:00Z",
  offers: [],
  selectedOffer: {
    id: "offer-1",
    jobId: "job-101",
    visitFee: 500,
    estimatedArrival: "30 mins",
    distanceKm: 2,
    createdAt: "2026-10-28T10:05:00Z",
    worker: {
      id: "worker-1",
      name: "Farhan",
      avatarUrl: "",
      phone: "03001234567",
      rating: 4.9,
      totalReviews: 24,
      completedJobsCount: 30,
      responseTime: "< 15m",
      tradeCategory: "Painting",
      serviceArea: "Peshawar",
      experienceYears: 5,
      bio: "Pro painter",
      isCnicVerified: true,
      isNadraCleared: true,
      hunarBadgeId: "#HN-1234",
      expertiseTags: ["Painting"],
      workProjects: [],
      reviews: [],
      ratingBreakdown: { fiveStar: 100, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 },
    },
  },
};

describe("CustomerReviewModal", () => {
  const mockOnClose = jest.fn();
  const mockOnReviewSubmitted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <CustomerReviewModal
        job={mockJob}
        isOpen={false}
        onClose={mockOnClose}
        onReviewSubmitted={mockOnReviewSubmitted}
      />
    );
    expect(screen.queryByText(/Rate & Review Service/i)).not.toBeInTheDocument();
  });

  it("renders worker details and rating options when open", () => {
    render(
      <CustomerReviewModal
        job={mockJob}
        isOpen={true}
        onClose={mockOnClose}
        onReviewSubmitted={mockOnReviewSubmitted}
      />
    );
    expect(screen.getByText("Rate & Review Service")).toBeInTheDocument();
    expect(screen.getByText("Farhan")).toBeInTheDocument();
    expect(screen.getByText(/What went well\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Written Feedback \(Optional\)/i)).toBeInTheDocument();
  });

  it("keeps tag selection completely separate from the written feedback textarea", () => {
    render(
      <CustomerReviewModal
        job={mockJob}
        isOpen={true}
        onClose={mockOnClose}
        onReviewSubmitted={mockOnReviewSubmitted}
      />
    );

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("");

    // Click on a compliment tag
    const tagButton = screen.getByRole("button", { name: /\+ Professional Conduct/i });
    fireEvent.click(tagButton);

    // Textarea must NOT receive any text from the tag selection
    expect(textarea.value).toBe("");

    // Tag button should reflect selection state
    expect(screen.getByRole("button", { name: /✓ Professional Conduct/i })).toBeInTheDocument();

    // User types custom feedback into textarea
    fireEvent.change(textarea, {
      target: { value: "Very neat work and polite behavior." },
    });
    expect(textarea.value).toBe("Very neat work and polite behavior.");

    // Click another tag
    const secondTagButton = screen.getByRole("button", { name: /\+ Cleaned Worksite/i });
    fireEvent.click(secondTagButton);

    // Textarea content must remain unchanged by the tag selection
    expect(textarea.value).toBe("Very neat work and polite behavior.");
  });

  it("submits review with rating, separate tags and comment", async () => {
    (repairApi.submitJobReview as jest.Mock).mockResolvedValueOnce({ success: true, reviewId: "rev-1" });

    render(
      <CustomerReviewModal
        job={mockJob}
        isOpen={true}
        onClose={mockOnClose}
        onReviewSubmitted={mockOnReviewSubmitted}
      />
    );

    // Select tag
    fireEvent.click(screen.getByRole("button", { name: /\+ Punctual & On Time/i }));

    // Type comment
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Arrived exactly on time and did great job." } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /Submit Review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(repairApi.submitJobReview).toHaveBeenCalledWith("job-101", {
        rating: 5,
        comment: "Arrived exactly on time and did great job.",
        tags: ["Punctual & On Time"],
      });
    });
  });
});
