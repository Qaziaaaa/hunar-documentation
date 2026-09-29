import * as sessionService from "./session.service";
import { getAccessToken, clearTokens } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";
import { MOCK_WORKER_ID } from "@/mocks/jobs.mock";
import type { WorkerSession } from "@/types/worker";

jest.mock("@/lib/api-client", () => ({
  getAccessToken: jest.fn(),
  clearTokens: jest.fn(),
}));

jest.mock("@/lib/data-source", () => ({
  isMockMode: jest.fn(),
}));

const mockedGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;
const mockedClearTokens = clearTokens as jest.MockedFunction<typeof clearTokens>;
const mockedIsMockMode = isMockMode as jest.MockedFunction<typeof isMockMode>;

describe("session.service", () => {
  const originalWindow = global.window;

  afterEach(() => {
    (global as any).window = originalWindow;
  });

  describe("getWorkerSession", () => {
    it("returns demo mode session in mock mode without token", () => {
      (global as any).window = { localStorage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() } };
      mockedGetAccessToken.mockReturnValue(null);
      mockedIsMockMode.mockReturnValue(true);

      const result = sessionService.getWorkerSession();

      expect(mockedGetAccessToken).toHaveBeenCalled();
      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(result).toEqual({
        workerId: MOCK_WORKER_ID,
        isAuthenticated: true,
        isDemoMode: true,
      });
    });

    it("returns authenticated non-demo session in API mode without token", () => {
      (global as any).window = { localStorage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() } };
      mockedGetAccessToken.mockReturnValue(null);
      mockedIsMockMode.mockReturnValue(false);

      const result = sessionService.getWorkerSession();

      expect(result).toEqual({
        workerId: "",
        isAuthenticated: true,
        isDemoMode: false,
      });
    });

    it("returns authenticated session with token when access token exists", () => {
      (global as any).window = { localStorage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() } };
      mockedGetAccessToken.mockReturnValue("valid-token");

      const result = sessionService.getWorkerSession();

      expect(mockedGetAccessToken).toHaveBeenCalled();
      expect(result).toEqual({
        workerId: "",
        isAuthenticated: true,
        isDemoMode: false,
      });
    });
  });

  describe("logoutWorker", () => {
    it("clears tokens", () => {
      sessionService.logoutWorker();

      expect(mockedClearTokens).toHaveBeenCalled();
    });
  });

  describe("queryKeys", () => {
    it("has correct query key structure", () => {
      expect(sessionService.queryKeys.session).toEqual(["worker", "session"]);
    });
  });
});