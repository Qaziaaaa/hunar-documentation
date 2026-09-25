import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import * as repairService from "./repair.service";
import type { Repair, Job, Visit, PageResult, RepairQuery } from "@/types/repair";
import { mockRepairs } from "@/mocks/repairs.mock";
import { mockJobs, mockVisits } from "@/mocks/jobs.mock";
import { MOCK_JOB_ID, MOCK_REPAIR_ID, MOCK_WORKER_ID } from "@/mocks/jobs.mock";

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

const mockedHttpGet = http.get as jest.MockedFunction<typeof http.get>;
const mockedHttpPut = http.put as jest.MockedFunction<typeof http.put>;
const mockedIsMockMode = isMockMode as jest.MockedFunction<typeof isMockMode>;
const mockedSimulateLatency = simulateLatency as jest.MockedFunction<typeof simulateLatency>;

// Store original mock repairs for reset
const originalMockRepairs = JSON.parse(JSON.stringify(mockRepairs));

describe("repair.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockRepairs to original state
    mockRepairs.length = 0;
    mockRepairs.push(...JSON.parse(JSON.stringify(originalMockRepairs)));
  });

  describe("loadRepairContext", () => {
    it("loads context from mocks in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await repairService.loadRepairContext(MOCK_JOB_ID);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(expect.any(Object));
      expect(result.job.id).toBe(MOCK_JOB_ID);
      expect(result.repair.id).toBe(MOCK_REPAIR_ID);
      expect(result.visit?.id).toBe("visit-elc-101");
    });

    it("throws error when job not found in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      await expect(repairService.loadRepairContext("non-existent")).rejects.toThrow("JOB_NOT_FOUND");
    });

    it("loads context from API in non-mock mode", async () => {
      const mockJob: Job = {
        id: MOCK_JOB_ID,
        customerId: "customer-1",
        categoryId: "cat-1",
        title: "Test Job",
        description: "Description",
        images: [],
        latitude: 0,
        longitude: 0,
        address: "Address",
        city: "City",
        area: "Area",
        status: "REPAIR_NEGOTIATING",
        urgency: "NORMAL",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const mockRepair: Repair = {
        ...mockRepairs[0],
        id: "repair-api-1",
      };
      const mockPageResult: PageResult<Repair> = { items: [mockRepair], total: 1, page: 1, limit: 100 };
      const mockVisit: Visit = {
        id: "visit-1",
        jobId: MOCK_JOB_ID,
        workerId: MOCK_WORKER_ID,
        offerId: "offer-1",
        scheduledDate: new Date().toISOString(),
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
      };

      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValueOnce(mockPageResult)
        .mockResolvedValueOnce(mockVisit);

      const result = await repairService.loadRepairContext(MOCK_JOB_ID);

      expect(mockedHttpGet).toHaveBeenCalledTimes(3);
      expect(mockedHttpGet).toHaveBeenNthCalledWith(1, `/jobs/${MOCK_JOB_ID}`);
      expect(mockedHttpGet).toHaveBeenNthCalledWith(2, "/repairs/my?limit=100");
      expect(mockedHttpGet).toHaveBeenNthCalledWith(3, `/visits/${mockRepair.visitId}`);
      expect(result.job).toEqual(mockJob);
      expect(result.repair).toEqual(mockRepair);
      expect(result.visit).toEqual(mockVisit);
    });

    it("handles missing visit in API response", async () => {
      const mockJob: Job = {
        id: MOCK_JOB_ID,
        customerId: "customer-1",
        categoryId: "cat-1",
        title: "Test Job",
        description: "Description",
        images: [],
        latitude: 0,
        longitude: 0,
        address: "Address",
        city: "City",
        area: "Area",
        status: "REPAIR_NEGOTIATING",
        urgency: "NORMAL",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const mockRepair: Repair = {
        ...mockRepairs[0],
        id: "repair-api-1",
      };
      const mockPageResult: PageResult<Repair> = { items: [mockRepair], total: 1, page: 1, limit: 100 };

      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValueOnce(mockPageResult)
        .mockRejectedValueOnce(new Error("Not found"));

      const result = await repairService.loadRepairContext(MOCK_JOB_ID);

      expect(result.visit).toBeUndefined();
      expect(result.job).toEqual(mockJob);
      expect(result.repair).toEqual(mockRepair);
    });
  });

  describe("listMyRepairs", () => {
    it("returns all mock repairs in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await repairService.listMyRepairs();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(expect.any(Array));
      expect(result).toEqual(mockRepairs);
    });

    it("returns all mock repairs ignoring query in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const query: RepairQuery = { status: "ACCEPTED", page: 1, limit: 10 };
      const result = await repairService.listMyRepairs(query);

      expect(result).toEqual(mockRepairs);
    });

    it("fetches repairs from API in non-mock mode", async () => {
      const mockPageResult: PageResult<Repair> = { items: mockRepairs, total: 3, page: 1, limit: 50 };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockPageResult);

      const result = await repairService.listMyRepairs();

      expect(mockedHttpGet).toHaveBeenCalledWith("/repairs/my?limit=50");
      expect(result).toEqual(mockRepairs);
    });

    it("uses custom limit from query in non-mock mode", async () => {
      const mockPageResult: PageResult<Repair> = { items: mockRepairs, total: 3, page: 1, limit: 10 };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockPageResult);

      await repairService.listMyRepairs({ limit: 10 });

      expect(mockedHttpGet).toHaveBeenCalledWith("/repairs/my?limit=10");
    });

    it("includes status in API call when provided", async () => {
      const mockPageResult: PageResult<Repair> = { items: mockRepairs, total: 3, page: 1, limit: 50 };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockPageResult);

      await repairService.listMyRepairs({ status: "ACCEPTED", limit: 20 });

      expect(mockedHttpGet).toHaveBeenCalledWith("/repairs/my?limit=20");
    });
  });

  describe("startRepair", () => {
    it("starts repair in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await repairService.startRepair(MOCK_REPAIR_ID);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 600, 1200);
      expect(result.startedAt).toBeDefined();
      expect(result.id).toBe(MOCK_REPAIR_ID);
    });

    it("updates mock repair with startedAt", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const repairBefore = mockRepairs.find((r) => r.id === MOCK_REPAIR_ID);
      expect(repairBefore?.startedAt).toBeUndefined();

      await repairService.startRepair(MOCK_REPAIR_ID);

      const repairAfter = mockRepairs.find((r) => r.id === MOCK_REPAIR_ID);
      expect(repairAfter?.startedAt).toBeDefined();
    });

    it("calls API in non-mock mode", async () => {
      const apiResponse: Repair = { ...mockRepairs[0], startedAt: new Date().toISOString() };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPut.mockResolvedValue(apiResponse);

      const result = await repairService.startRepair(MOCK_REPAIR_ID);

      expect(mockedHttpPut).toHaveBeenCalledWith(`/repairs/${MOCK_REPAIR_ID}/start`);
      expect(result).toEqual(apiResponse);
    });

    it("throws error when repair not found in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      await expect(repairService.startRepair("non-existent")).rejects.toThrow("REPAIR_NOT_FOUND");
    });
  });

  describe("completeRepair", () => {
    it("completes repair in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await repairService.completeRepair(MOCK_REPAIR_ID);

      expect(result.completedAt).toBeDefined();
      expect(result.id).toBe(MOCK_REPAIR_ID);
    });

    it("updates mock repair with completedAt", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const repairBefore = mockRepairs.find((r) => r.id === MOCK_REPAIR_ID);
      expect(repairBefore?.completedAt).toBeUndefined();

      await repairService.completeRepair(MOCK_REPAIR_ID);

      const repairAfter = mockRepairs.find((r) => r.id === MOCK_REPAIR_ID);
      expect(repairAfter?.completedAt).toBeDefined();
    });

    it("calls API in non-mock mode", async () => {
      const apiResponse: Repair = { ...mockRepairs[0], completedAt: new Date().toISOString() };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPut.mockResolvedValue(apiResponse);

      const result = await repairService.completeRepair(MOCK_REPAIR_ID);

      expect(mockedHttpPut).toHaveBeenCalledWith(`/repairs/${MOCK_REPAIR_ID}/complete`);
      expect(result).toEqual(apiResponse);
    });

    it("throws error when repair not found in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      await expect(repairService.completeRepair("non-existent")).rejects.toThrow("REPAIR_NOT_FOUND");
    });
  });

  describe("queryKeys", () => {
    it("has correct query key structure", () => {
      expect(repairService.queryKeys.repairs).toEqual(["worker", "repairs"]);
      expect(repairService.queryKeys.repairByJob(MOCK_JOB_ID)).toEqual([
        "worker",
        "repairs",
        "by-job",
        MOCK_JOB_ID,
      ]);
    });
  });
});