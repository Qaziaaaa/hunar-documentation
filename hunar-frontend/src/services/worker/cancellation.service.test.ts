import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import * as cancellationService from "./cancellation.service";
import { mockJobs, mockVisits } from "@/mocks/jobs.mock";
import type { CancellationStage } from "@/types/cancellation";

jest.mock("@/lib/api-client", () => ({
  http: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock("@/lib/data-source", () => ({
  isMockMode: jest.fn(),
  simulateLatency: jest.fn((value) => Promise.resolve(value)),
}));

// Store original mock jobs for reset
const originalMockJobs = JSON.parse(JSON.stringify(mockJobs));

const mockedHttpGet = http.get as jest.MockedFunction<typeof http.get>;
const mockedHttpPut = http.put as jest.MockedFunction<typeof http.put>;
const mockedIsMockMode = isMockMode as jest.MockedFunction<typeof isMockMode>;
const mockedSimulateLatency = simulateLatency as jest.MockedFunction<typeof simulateLatency>;

describe("cancellation.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockJobs to original state
    mockJobs.length = 0;
    mockJobs.push(...JSON.parse(JSON.stringify(originalMockJobs)));
  });

  describe("getJobCancellationStage", () => {
    const mockJobId = "job-elc-101";

    it("returns before_visit stage in mock mode when visit not started", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await cancellationService.getJobCancellationStage(mockJobId);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(
        expect.objectContaining({ stage: "before_visit" }),
      );
      expect(result.stage).toBe("before_visit");
    });

    it("returns before_visit for pre-visit job statuses in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue({ id: mockJobId, status: "VISIT_SCHEDULED" });

      const result = await cancellationService.getJobCancellationStage(mockJobId);

      expect(mockedHttpGet).toHaveBeenCalledWith(`/jobs/${mockJobId}`);
      expect(result.stage).toBe("before_visit");
    });

    it("returns after_arrival for post-visit job statuses in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue({ id: mockJobId, status: "IN_PROGRESS" });

      const result = await cancellationService.getJobCancellationStage(mockJobId);

      expect(result.stage).toBe("after_arrival");
    });

    it("returns before_visit for OPEN status", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue({ id: mockJobId, status: "OPEN" });

      const result = await cancellationService.getJobCancellationStage(mockJobId);

      expect(result.stage).toBe("before_visit");
    });

    it("returns before_visit for OFFER_ACCEPTED status", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue({ id: mockJobId, status: "OFFER_ACCEPTED" });

      const result = await cancellationService.getJobCancellationStage(mockJobId);

      expect(result.stage).toBe("before_visit");
    });

    it("returns before_visit for WORKER_ASSIGNED status", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue({ id: mockJobId, status: "WORKER_ASSIGNED" });

      const result = await cancellationService.getJobCancellationStage(mockJobId);

      expect(result.stage).toBe("before_visit");
    });
  });

  describe("cancelWorkerJob", () => {
    const cancelInput = {
      jobId: "job-elc-101",
      stage: "before_visit" as CancellationStage,
      reason: "customer_unavailable" as const,
      note: "Customer not home",
    };

    it("cancels job in mock mode and returns result", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await cancellationService.cancelWorkerJob(cancelInput);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 600, 1200);
      expect(result).toEqual({
        jobId: cancelInput.jobId,
        status: "cancelled",
        message: "Job cancelled.",
        workerCharged: false,
      });
    });

    it("updates mock job status to CANCELLED", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const jobBefore = mockJobs.find((j) => j.id === cancelInput.jobId);
      expect(jobBefore?.status).not.toBe("CANCELLED");

      await cancellationService.cancelWorkerJob(cancelInput);

      const jobAfter = mockJobs.find((j) => j.id === cancelInput.jobId);
      expect(jobAfter?.status).toBe("CANCELLED");
      expect(jobAfter?.cancelReason).toBe("customer_unavailable");
      expect(jobAfter?.cancelledAt).toBeDefined();
    });

    it("uses note as reason when reason is 'other'", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const inputWithOther = { ...cancelInput, reason: "other" as const, note: "Custom reason" };
      await cancellationService.cancelWorkerJob(inputWithOther);

      const jobAfter = mockJobs.find((j) => j.id === cancelInput.jobId);
      expect(jobAfter?.cancelReason).toBe("Custom reason");
    });

    it("uses reason as cancelReason when note not provided for 'other'", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const inputOtherNoNote = { ...cancelInput, reason: "other" as const, note: undefined };
      await cancellationService.cancelWorkerJob(inputOtherNoNote);

      const jobAfter = mockJobs.find((j) => j.id === cancelInput.jobId);
      expect(jobAfter?.cancelReason).toBe("other");
    });

    it("calls API with correct body in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);

      await cancellationService.cancelWorkerJob(cancelInput);

      expect(mockedHttpPut).toHaveBeenCalledWith(`/jobs/${cancelInput.jobId}/cancel`, {
        reason: "customer_unavailable",
      });
    });

    it("sends note as reason when reason is 'other' in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      const inputWithOther = { ...cancelInput, reason: "other" as const, note: "Custom note" };

      await cancellationService.cancelWorkerJob(inputWithOther);

      expect(mockedHttpPut).toHaveBeenCalledWith(`/jobs/${cancelInput.jobId}/cancel`, {
        reason: "Custom note",
      });
    });

    it("returns cancellation result in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);

      const result = await cancellationService.cancelWorkerJob(cancelInput);

      expect(result).toEqual({
        jobId: cancelInput.jobId,
        status: "cancelled",
        message: "Job cancelled.",
        workerCharged: false,
      });
    });
  });

  describe("queryKeys", () => {
    it("has correct query key structure", () => {
      expect(cancellationService.queryKeys.stage("job-123")).toEqual([
        "worker",
        "cancellation",
        "job-123",
      ]);
    });
  });
});