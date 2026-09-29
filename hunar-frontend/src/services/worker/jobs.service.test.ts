import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import * as jobsService from "./jobs.service";
import type { Job } from "@/types/job";
import { mockJobs, MOCK_WORKER_ID, MOCK_JOB_ID } from "@/mocks/jobs.mock";

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

describe("jobs.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isActiveJob", () => {
    it("returns true for active job statuses", () => {
      expect(jobsService.isActiveJob("OPEN")).toBe(true);
      expect(jobsService.isActiveJob("OFFERS_RECEIVED")).toBe(true);
      expect(jobsService.isActiveJob("IN_PROGRESS")).toBe(true);
      expect(jobsService.isActiveJob("REPAIR_NEGOTIATING")).toBe(true);
    });

    it("returns false for history job statuses", () => {
      expect(jobsService.isActiveJob("COMPLETED")).toBe(false);
      expect(jobsService.isActiveJob("PAID")).toBe(false);
      expect(jobsService.isActiveJob("REVIEWED")).toBe(false);
      expect(jobsService.isActiveJob("CANCELLED")).toBe(false);
    });

    it("returns false for DISPUTED status", () => {
      expect(jobsService.isActiveJob("DISPUTED")).toBe(false);
    });
  });

  describe("isHistoryJob", () => {
    it("returns true for history job statuses", () => {
      expect(jobsService.isHistoryJob("COMPLETED")).toBe(true);
      expect(jobsService.isHistoryJob("PAID")).toBe(true);
      expect(jobsService.isHistoryJob("REVIEWED")).toBe(true);
      expect(jobsService.isHistoryJob("CANCELLED")).toBe(true);
    });

    it("returns false for active job statuses", () => {
      expect(jobsService.isHistoryJob("OPEN")).toBe(false);
      expect(jobsService.isHistoryJob("IN_PROGRESS")).toBe(false);
    });
  });

  describe("isNearbyJob", () => {
    it("returns true for nearby job statuses", () => {
      expect(jobsService.isNearbyJob("OPEN")).toBe(true);
      expect(jobsService.isNearbyJob("OFFERS_RECEIVED")).toBe(true);
    });

    it("returns false for other statuses", () => {
      expect(jobsService.isNearbyJob("IN_PROGRESS")).toBe(false);
      expect(jobsService.isNearbyJob("COMPLETED")).toBe(false);
    });
  });

  describe("listWorkerJobs", () => {
    const mockBackendJobs = [
      {
        id: "job-1",
        customerId: "customer-1",
        categoryId: "cat-1",
        title: "Test Job 1",
        description: "Description 1",
        images: [],
        latitude: 0,
        longitude: 0,
        address: "Address 1",
        city: "City 1",
        area: "Area 1",
        status: "OPEN",
        urgency: "NORMAL",
        suggestedVisitCharge: null,
        lockedVisitCharge: null,
        preferredVisitTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customer: { id: "customer-1", name: "Customer 1", phone: "123" },
      },
    ];

    it("returns mock jobs in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await jobsService.listWorkerJobs();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(expect.any(Array));
      expect(result).toEqual(mockJobs);
    });

    it("fetches and maps jobs from API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue({ items: mockBackendJobs, total: 1, page: 1, limit: 10 });

      const result = await jobsService.listWorkerJobs();

      expect(mockedHttpGet).toHaveBeenCalledWith("/workers/me/jobs/active");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("job-1");
      expect(result[0].status).toBe("OPEN");
    });

    it("handles array response from API", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockBackendJobs);

      const result = await jobsService.listWorkerJobs();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("job-1");
    });
  });

  describe("listNearbyJobs", () => {
    const mockBackendJobs = [
      {
        id: "job-nearby-1",
        customerId: "customer-1",
        categoryId: "cat-1",
        title: "Nearby Job 1",
        description: "Description",
        images: [],
        latitude: 0,
        longitude: 0,
        address: "Address",
        city: "City",
        area: "Area",
        status: "OPEN",
        urgency: "NORMAL",
        suggestedVisitCharge: null,
        lockedVisitCharge: null,
        preferredVisitTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customer: { id: "customer-1", name: "Customer 1", phone: "123" },
      },
    ];

    it("returns filtered mock jobs in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await jobsService.listNearbyJobs();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(result.every((job) => jobsService.isNearbyJob(job.status))).toBe(true);
    });

    it("fetches and maps nearby jobs from API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue({ items: mockBackendJobs, total: 1, page: 1, limit: 10 });

      const result = await jobsService.listNearbyJobs();

      expect(mockedHttpGet).toHaveBeenCalledWith("/jobs/available");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("job-nearby-1");
    });
  });

  describe("getWorkerJob", () => {
    const mockBackendJob = {
      id: "job-detail-1",
      customerId: "customer-1",
      categoryId: "cat-1",
      title: "Detail Job",
      description: "Description",
      images: [],
      latitude: 0,
      longitude: 0,
      address: "Address",
      city: "City",
      area: "Area",
      status: "OPEN",
      urgency: "NORMAL",
      suggestedVisitCharge: null,
      lockedVisitCharge: null,
      preferredVisitTime: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer: { id: "customer-1", name: "Customer 1", phone: "123" },
    };

    it("returns mock job in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await jobsService.getWorkerJob(MOCK_JOB_ID);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalled();
      expect(result.id).toBe(MOCK_JOB_ID);
    });

    it("throws error when mock job not found", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      await expect(jobsService.getWorkerJob("non-existent")).rejects.toThrow("JOB_NOT_FOUND");
    });

    it("fetches and maps job from API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockBackendJob);

      const result = await jobsService.getWorkerJob("job-detail-1");

      expect(mockedHttpGet).toHaveBeenCalledWith("/jobs/job-detail-1");
      expect(result.id).toBe("job-detail-1");
    });
  });

  describe("queryKeys", () => {
    it("has correct query key structure", () => {
      expect(jobsService.queryKeys.jobs).toEqual(["worker", "jobs"]);
      expect(jobsService.queryKeys.nearby).toEqual(["worker", "jobs", "nearby"]);
      expect(jobsService.queryKeys.job("job-123")).toEqual(["worker", "jobs", "job-123"]);
    });
  });
});