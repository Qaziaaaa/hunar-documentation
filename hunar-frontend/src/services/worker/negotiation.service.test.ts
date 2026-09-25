import { http } from "@/lib/api-client";
import {
  canWorkerAccept,
  canWorkerCounter,
  deriveNegotiationStatus,
  getMaxNegotiationRounds,
} from "@/lib/negotiation";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import * as negotiationService from "./negotiation.service";
import type { Repair, RepairEstimateInput, RepairCounterInput, ScopeChangeRequestInput, NegotiationContext } from "@/types/repair";
import { mockRepairs } from "@/mocks/repairs.mock";
import { MOCK_REPAIR_ID, MOCK_JOB_ID } from "@/mocks/jobs.mock";

jest.mock("@/lib/api-client", () => ({
  http: {
    post: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock("@/lib/negotiation", () => ({
  canWorkerAccept: jest.fn(),
  canWorkerCounter: jest.fn(),
  deriveNegotiationStatus: jest.fn(),
  getMaxNegotiationRounds: jest.fn(),
}));

jest.mock("@/lib/data-source", () => ({
  isMockMode: jest.fn(),
  simulateLatency: jest.fn((value) => Promise.resolve(value)),
}));

jest.mock("./repair.service", () => ({
  loadRepairContext: jest.fn(),
}));

// Store original mock repairs for reset
const originalMockRepairs = JSON.parse(JSON.stringify(mockRepairs));

const mockedHttpPost = http.post as jest.MockedFunction<typeof http.post>;
const mockedHttpPut = http.put as jest.MockedFunction<typeof http.put>;
const mockedIsMockMode = isMockMode as jest.MockedFunction<typeof isMockMode>;
const mockedSimulateLatency = simulateLatency as jest.MockedFunction<typeof simulateLatency>;
const mockedCanWorkerAccept = canWorkerAccept as jest.MockedFunction<typeof canWorkerAccept>;
const mockedCanWorkerCounter = canWorkerCounter as jest.MockedFunction<typeof canWorkerCounter>;
const mockedDeriveNegotiationStatus = deriveNegotiationStatus as jest.MockedFunction<typeof deriveNegotiationStatus>;
const mockedGetMaxNegotiationRounds = getMaxNegotiationRounds as jest.MockedFunction<typeof getMaxNegotiationRounds>;
const { loadRepairContext } = jest.requireMock("./repair.service") as { loadRepairContext: jest.MockedFunction<any> };

describe("negotiation.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockRepairs to original state
    mockRepairs.length = 0;
    mockRepairs.push(...JSON.parse(JSON.stringify(originalMockRepairs)));
  });

  describe("getNegotiationContext", () => {
    const mockContext: NegotiationContext = {
      job: { id: MOCK_JOB_ID, title: "Test Job", status: "REPAIR_NEGOTIATING", city: "City", area: "Area" },
      visit: undefined,
      repair: mockRepairs[0],
      status: "customer_countered",
      maxRounds: 3,
      currentRound: 2,
      canCounter: true,
      canAccept: true,
      canReject: true,
    };

    it("loads repair context and builds negotiation context", async () => {
      loadRepairContext.mockResolvedValue({
        job: mockContext.job,
        visit: mockContext.visit,
        repair: mockContext.repair,
      });
      mockedDeriveNegotiationStatus.mockReturnValue("customer_countered");
      mockedGetMaxNegotiationRounds.mockReturnValue(3);
      mockedCanWorkerCounter.mockReturnValue(true);
      mockedCanWorkerAccept.mockReturnValue(true);

      const result = await negotiationService.getNegotiationContext(MOCK_JOB_ID);

      expect(loadRepairContext).toHaveBeenCalledWith(MOCK_JOB_ID);
      expect(mockedDeriveNegotiationStatus).toHaveBeenCalledWith(mockContext.repair);
      expect(mockedGetMaxNegotiationRounds).toHaveBeenCalled();
      expect(mockedCanWorkerCounter).toHaveBeenCalledWith(mockContext.repair);
      expect(mockedCanWorkerAccept).toHaveBeenCalledWith(mockContext.repair);
      expect(result).toEqual(mockContext);
    });
  });

  describe("submitEstimate", () => {
    const visitId = "visit-123";
    const estimateInput: RepairEstimateInput = {
      description: "Test repair",
      amount: 2000,
      itemsBreakdown: { parts: 1000, labor: 1000 },
    };

    it("creates and returns repair in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await negotiationService.submitEstimate(visitId, estimateInput);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 600, 1200);
      expect(result.visitId).toBe(visitId);
      expect(result.description).toBe(estimateInput.description);
      expect(result.amount).toBe(estimateInput.amount);
      expect(result.itemsBreakdown).toEqual(estimateInput.itemsBreakdown);
      expect(result.status).toBe("PROPOSED");
      expect(result.negotiationRound).toBe(0);
      expect(result.negotiationHistory).toHaveLength(1);
      expect(result.negotiationHistory[0].by).toBe("worker");
      expect(result.negotiationHistory[0].amount).toBe(2000);
      expect(result.workerId).toBe("worker-demo-1");
    });

    it("calls API in non-mock mode", async () => {
      const apiResponse: Repair = {
        id: "repair-api-1",
        visitId,
        jobId: "job-1",
        workerId: "worker-demo-1",
        description: "Test repair",
        amount: 2000,
        itemsBreakdown: { parts: 1000, labor: 1000 },
        status: "PROPOSED",
        negotiationRound: 0,
        negotiationHistory: [],
        revisions: [],
        createdAt: new Date().toISOString(),
      };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPost.mockResolvedValue(apiResponse);

      const result = await negotiationService.submitEstimate(visitId, estimateInput);

      expect(mockedHttpPost).toHaveBeenCalledWith(`/visits/${visitId}/estimate`, estimateInput);
      expect(result).toEqual(apiResponse);
    });
  });

  describe("acceptCounterOffer", () => {
    const repairId = MOCK_REPAIR_ID;

    it("accepts counter offer in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await negotiationService.acceptCounterOffer(repairId);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 600, 1200);
      expect(result.status).toBe("ACCEPTED");
      expect(result.lockedAmount).toBe(mockRepairs[0].amount);
      expect(result.lockedAt).toBeDefined();
    });

    it("accepts with custom amount in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await negotiationService.acceptCounterOffer(repairId, 1500);

      expect(result.lockedAmount).toBe(1500);
    });

    it("calls API in non-mock mode", async () => {
      const apiResponse: Repair = {
        ...mockRepairs[0],
        status: "ACCEPTED",
        lockedAmount: 1500,
        lockedAt: new Date().toISOString(),
      };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPut.mockResolvedValue(apiResponse);

      const result = await negotiationService.acceptCounterOffer(repairId, 1500);

      expect(mockedHttpPut).toHaveBeenCalledWith(`/repairs/${repairId}/accept`, { amount: 1500 });
      expect(result).toEqual(apiResponse);
    });

    it("calls API without amount when not provided", async () => {
      const apiResponse: Repair = {
        ...mockRepairs[0],
        status: "ACCEPTED",
      };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPut.mockResolvedValue(apiResponse);

      await negotiationService.acceptCounterOffer(repairId);

      expect(mockedHttpPut).toHaveBeenCalledWith(`/repairs/${repairId}/accept`, undefined);
    });
  });

  describe("rejectCounterOffer", () => {
    const repairId = MOCK_REPAIR_ID;

    it("rejects counter offer in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await negotiationService.rejectCounterOffer(repairId);

      expect(result.status).toBe("REJECTED");
    });

    it("calls API in non-mock mode", async () => {
      const apiResponse: Repair = { ...mockRepairs[0], status: "REJECTED" };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPut.mockResolvedValue(apiResponse);

      const result = await negotiationService.rejectCounterOffer(repairId);

      expect(mockedHttpPut).toHaveBeenCalledWith(`/repairs/${repairId}/reject`);
      expect(result).toEqual(apiResponse);
    });

    it("throws error when repair not found in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      await expect(negotiationService.rejectCounterOffer("non-existent")).rejects.toThrow("REPAIR_NOT_FOUND");
    });
  });

  describe("sendCounterOffer", () => {
    const repairId = MOCK_REPAIR_ID;
    const counterInput: RepairCounterInput = {
      amount: 1600,
      note: "Revised estimate",
    };

    it("sends counter offer in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const originalRepair = mockRepairs.find((r) => r.id === repairId)!;
      const result = await negotiationService.sendCounterOffer(repairId, counterInput);

      expect(result.amount).toBe(1600);
      expect(result.status).toBe("COUNTERED");
      expect(result.negotiationRound).toBe(originalRepair.negotiationRound + 1);
      expect(result.negotiationHistory).toHaveLength(originalRepair.negotiationHistory.length + 1);
      expect(result.negotiationHistory[result.negotiationHistory.length - 1]).toEqual(
        expect.objectContaining({
          by: "worker",
          amount: 1600,
          note: "Revised estimate",
        }),
      );
    });

    it("calls API in non-mock mode", async () => {
      const apiResponse: Repair = {
        ...mockRepairs[0],
        amount: 1600,
        status: "COUNTERED",
        negotiationRound: mockRepairs[0].negotiationRound + 1,
      };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPut.mockResolvedValue(apiResponse);

      const result = await negotiationService.sendCounterOffer(repairId, counterInput);

      expect(mockedHttpPut).toHaveBeenCalledWith(`/repairs/${repairId}/counter`, counterInput);
      expect(result).toEqual(apiResponse);
    });

    it("throws error when repair not found in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      await expect(negotiationService.sendCounterOffer("non-existent", counterInput)).rejects.toThrow("REPAIR_NOT_FOUND");
    });
  });

  describe("requestScopeChange", () => {
    const repairId = MOCK_REPAIR_ID;
    const scopeInput: ScopeChangeRequestInput = {
      repairId,
      amount: 300,
      reason: "Additional parts needed",
    };

    it("requests scope change in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await negotiationService.requestScopeChange(repairId, scopeInput);

      expect(result.revisions).toHaveLength(1);
      const revision = result.revisions[0];
      expect(revision.repairId).toBe(repairId);
      expect(revision.proposedAmount).toBe(300);
      expect(revision.reason).toBe("Additional parts needed");
      expect(revision.status).toBe("PENDING_APPROVAL");
      expect(revision.requestedBy).toBe("worker-demo-1");
      expect(revision.createdAt).toBeDefined();
    });

    it("calls API in non-mock mode", async () => {
      const apiResponse: Repair = {
        ...mockRepairs[0],
        revisions: [
          {
            id: "revision-1",
            repairId,
            proposedAmount: 300,
            reason: "Additional parts needed",
            status: "PENDING_APPROVAL",
            requestedBy: "worker-demo-1",
            createdAt: new Date().toISOString(),
          },
        ],
      };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPost.mockResolvedValue(apiResponse);

      const result = await negotiationService.requestScopeChange(repairId, scopeInput);

      expect(mockedHttpPost).toHaveBeenCalledWith(`/repairs/${repairId}/revision`, {
        amount: 300,
        reason: "Additional parts needed",
      });
      expect(result).toEqual(apiResponse);
    });

    it("throws error when repair not found in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      await expect(negotiationService.requestScopeChange("non-existent", scopeInput)).rejects.toThrow("REPAIR_NOT_FOUND");
    });
  });

  describe("queryKeys", () => {
    it("has correct query key structure", () => {
      expect(negotiationService.queryKeys.negotiation(MOCK_JOB_ID)).toEqual([
        "worker",
        "negotiation",
        MOCK_JOB_ID,
      ]);
    });
  });
});