import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import * as reviewService from "./review.service";
import type { Review, WorkerRatingSummary, PageResult } from "@/types/review";
import { mockRatingSummary, mockReviews } from "@/mocks/reviews.mock";
import { MOCK_WORKER_ID } from "@/mocks/jobs.mock";

jest.mock("@/lib/api-client", () => ({
  http: {
    get: jest.fn(),
  },
}));

jest.mock("@/lib/data-source", () => ({
  isMockMode: jest.fn(),
  simulateLatency: jest.fn((value) => Promise.resolve(value)),
}));

const mockedHttpGet = http.get as jest.MockedFunction<typeof http.get>;
const mockedIsMockMode = isMockMode as jest.MockedFunction<typeof isMockMode>;
const mockedSimulateLatency = simulateLatency as jest.MockedFunction<typeof simulateLatency>;

describe("review.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getRatingSummary", () => {
    it("returns mock rating summary in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await reviewService.getRatingSummary();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual(mockRatingSummary);
    });

    it("uses default worker ID when not provided", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      await reviewService.getRatingSummary();

      expect(mockedSimulateLatency).toHaveBeenCalledWith(
        expect.objectContaining({ average: mockRatingSummary.average }),
      );
    });

    it("calculates rating summary from reviews in non-mock mode", async () => {
      const mockPageResult: PageResult<Review> = { items: mockReviews, meta: { page: 1, limit: 100, total: 4, totalPages: 1 } };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockPageResult);

      const result = await reviewService.getRatingSummary(MOCK_WORKER_ID);

      expect(mockedHttpGet).toHaveBeenCalledWith(`/reviews/worker/${MOCK_WORKER_ID}?limit=100`);
      expect(result.totalReviews).toBe(4);
      expect(result.average).toBe(4.3);
      expect(result.breakdown).toEqual({ 5: 2, 4: 1, 3: 1, 2: 0, 1: 0 });
    });

    it("handles empty reviews in non-mock mode", async () => {
      const mockPageResult: PageResult<Review> = { items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockPageResult);

      const result = await reviewService.getRatingSummary();

      expect(result.average).toBe(0);
      expect(result.totalReviews).toBe(0);
      expect(result.breakdown).toEqual({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
    });

    it("calculates correct breakdown for all ratings", async () => {
      const reviewsWithAllRatings: Review[] = [
        { id: "1", jobId: "j1", reviewerId: "c1", reviewerName: "C1", rating: 5, createdAt: new Date().toISOString() },
        { id: "2", jobId: "j2", reviewerId: "c2", reviewerName: "C2", rating: 4, createdAt: new Date().toISOString() },
        { id: "3", jobId: "j3", reviewerId: "c3", reviewerName: "C3", rating: 3, createdAt: new Date().toISOString() },
        { id: "4", jobId: "j4", reviewerId: "c4", reviewerName: "C4", rating: 2, createdAt: new Date().toISOString() },
        { id: "5", jobId: "j5", reviewerId: "c5", reviewerName: "C5", rating: 1, createdAt: new Date().toISOString() },
      ];
      const mockPageResult: PageResult<Review> = { items: reviewsWithAllRatings, meta: { page: 1, limit: 100, total: 5, totalPages: 1 } };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockPageResult);

      const result = await reviewService.getRatingSummary();

      expect(result.breakdown).toEqual({ 5: 1, 4: 1, 3: 1, 2: 1, 1: 1 });
      expect(result.average).toBe(3.0);
    });

    it("uses custom worker ID when provided in non-mock mode", async () => {
      const mockPageResult: PageResult<Review> = { items: mockReviews, meta: { page: 1, limit: 100, total: 4, totalPages: 1 } };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockPageResult);

      await reviewService.getRatingSummary("custom-worker-id");

      expect(mockedHttpGet).toHaveBeenCalledWith("/reviews/worker/custom-worker-id?limit=100");
    });
  });

  describe("getWorkerReviews", () => {
    it("returns paginated mock reviews in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await reviewService.getWorkerReviews(MOCK_WORKER_ID, 1, 2);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 300, 700);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual(mockReviews[0]);
      expect(result.items[1]).toEqual(mockReviews[1]);
      expect(result.meta).toEqual({
        page: 1,
        limit: 2,
        total: 4,
        totalPages: 2,
      });
    });

    it("returns second page correctly", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await reviewService.getWorkerReviews(MOCK_WORKER_ID, 2, 2);

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual(mockReviews[2]);
      expect(result.items[1]).toEqual(mockReviews[3]);
      expect(result.meta.page).toBe(2);
    });

    it("returns empty items for page beyond total", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await reviewService.getWorkerReviews(MOCK_WORKER_ID, 3, 2);

      expect(result.items).toHaveLength(0);
      expect(result.meta.page).toBe(3);
    });

    it("uses default worker ID, page, and limit", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await reviewService.getWorkerReviews();

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.items.length).toBeLessThanOrEqual(20);
    });

    it("fetches reviews from API in non-mock mode", async () => {
      const mockPageResult: PageResult<Review> = {
        items: mockReviews,
        meta: { page: 1, limit: 20, total: 4, totalPages: 1 },
      };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockPageResult);

      const result = await reviewService.getWorkerReviews(MOCK_WORKER_ID, 1, 20);

      expect(mockedHttpGet).toHaveBeenCalledWith(`/reviews/worker/${MOCK_WORKER_ID}?page=1&limit=20`);
      expect(result).toEqual(mockPageResult);
    });

    it("uses custom page and limit in API call", async () => {
      const mockPageResult: PageResult<Review> = {
        items: mockReviews.slice(0, 5),
        meta: { page: 2, limit: 5, total: 10, totalPages: 2 },
      };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockPageResult);

      await reviewService.getWorkerReviews(MOCK_WORKER_ID, 2, 5);

      expect(mockedHttpGet).toHaveBeenCalledWith(`/reviews/worker/${MOCK_WORKER_ID}?page=2&limit=5`);
    });
  });

  describe("queryKeys", () => {
    it("has correct query key structure for rating", () => {
      expect(reviewService.queryKeys.rating(MOCK_WORKER_ID)).toEqual([
        "worker",
        "reviews",
        "rating",
        MOCK_WORKER_ID,
      ]);
    });

    it("has correct query key structure for reviews list", () => {
      expect(reviewService.queryKeys.reviews(MOCK_WORKER_ID, 2)).toEqual([
        "worker",
        "reviews",
        "list",
        MOCK_WORKER_ID,
        2,
      ]);
    });
  });
});