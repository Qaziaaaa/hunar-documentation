import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import * as earningsService from "./earnings.service";
import type { WalletSummary, WalletTransaction } from "@/types/finance";
import { mockWalletSummary, mockWalletTransactions } from "@/mocks/earnings.mock";

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

describe("earnings.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getWalletSummary", () => {
    const mockBackendSnapshot = {
      userId: "worker-1",
      balance: 5000,
      heldBalance: 1000,
      totalBalance: 6000,
    };

    it("returns mock wallet summary in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);

      const result = await earningsService.getWalletSummary();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(result).toEqual(mockWalletSummary);
    });

    it("fetches and maps wallet summary from API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockBackendSnapshot);

      const result = await earningsService.getWalletSummary();

      expect(mockedHttpGet).toHaveBeenCalledWith("/wallet/balance");
      expect(result).toEqual({
        currentBalance: 6000,
        totalTopUps: 5000,
        totalDeductions: 1000,
        totalTransactions: 0,
      });
    });
  });

  describe("getWalletTransactions", () => {
    const mockBackendEntries = [
      {
        id: "entry-1",
        type: "CREDIT",
        amount: "500",
        balanceAfter: "1000",
        referenceType: "JOB",
        referenceId: "job-1",
        description: "Job completed payment",
        createdAt: new Date().toISOString(),
      },
      {
        id: "entry-2",
        type: "DEBIT",
        amount: "-200",
        balanceAfter: "800",
        referenceType: "PLATFORM_FEE",
        referenceId: "fee-1",
        description: "Platform commission",
        createdAt: new Date().toISOString(),
      },
    ];

    it("returns mock transactions in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);

      const result = await earningsService.getWalletTransactions();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(result).toEqual(mockWalletTransactions);
    });

    it("fetches and maps transactions from API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue({ items: mockBackendEntries, total: 2, page: 1, limit: 10 });

      const result = await earningsService.getWalletTransactions();

      expect(mockedHttpGet).toHaveBeenCalledWith("/wallet/ledger");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("entry-1");
      expect(result[0].type).toBe("TOP_UP");
      expect(result[0].amount).toBe(500);
      expect(result[1].id).toBe("entry-2");
      expect(result[1].type).toBe("DEDUCTION");
      expect(result[1].amount).toBe(200);
    });

    it("handles array response from API", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockBackendEntries);

      const result = await earningsService.getWalletTransactions();

      expect(result).toHaveLength(2);
    });

    it("handles empty response", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 });

      const result = await earningsService.getWalletTransactions();

      expect(result).toEqual([]);
    });
  });

  describe("queryKeys", () => {
    it("has correct query key structure", () => {
      expect(earningsService.queryKeys.summary).toEqual(["worker", "wallet", "summary"]);
      expect(earningsService.queryKeys.transactions).toEqual(["worker", "wallet", "transactions"]);
    });
  });
});