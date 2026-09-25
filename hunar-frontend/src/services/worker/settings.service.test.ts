import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import * as settingsService from "./settings.service";
import type { ChangePasswordInput, AccountDeleteInput, PrivacySettings } from "@/types/settings";
import { getWorkerSession, logoutWorker } from "./session.service";

jest.mock("@/lib/api-client", () => ({
  http: {
    put: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock("@/lib/data-source", () => ({
  isMockMode: jest.fn(),
  simulateLatency: jest.fn((value) => Promise.resolve(value)),
}));

jest.mock("./session.service", () => ({
  getWorkerSession: jest.fn(),
  logoutWorker: jest.fn(),
}));

const mockedHttpPut = http.put as jest.MockedFunction<typeof http.put>;
const mockedHttpDelete = http.delete as jest.MockedFunction<typeof http.delete>;
const mockedHttpGet = http.get as jest.MockedFunction<typeof http.get>;
const mockedHttpPatch = http.patch as jest.MockedFunction<typeof http.patch>;
const mockedIsMockMode = isMockMode as jest.MockedFunction<typeof isMockMode>;
const mockedSimulateLatency = simulateLatency as jest.MockedFunction<typeof simulateLatency>;
const mockedGetWorkerSession = getWorkerSession as jest.MockedFunction<typeof getWorkerSession>;
const mockedLogoutWorker = logoutWorker as jest.MockedFunction<typeof logoutWorker>;

describe("settings.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("changePassword", () => {
    const changePasswordInput: ChangePasswordInput = {
      currentPassword: "old123",
      newPassword: "new456",
    };

    it("simulates latency and returns in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      await settingsService.changePassword(changePasswordInput);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 600, 1200);
    });

    it("calls API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPut.mockResolvedValue(undefined);

      await settingsService.changePassword(changePasswordInput);

      expect(mockedHttpPut).toHaveBeenCalledWith("/auth/change-password", changePasswordInput);
    });
  });

  describe("deleteAccount", () => {
    const deleteAccountInput: AccountDeleteInput = {
      confirmationText: "DELETE MY ACCOUNT",
    };

    it("simulates latency and returns in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      await settingsService.deleteAccount(deleteAccountInput);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 800, 1500);
    });

    it("calls API with encoded confirmation text in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpDelete.mockResolvedValue(undefined);

      await settingsService.deleteAccount(deleteAccountInput);

      expect(mockedHttpDelete).toHaveBeenCalledWith(
        `/users/me?confirmation=${encodeURIComponent(deleteAccountInput.confirmationText)}`,
      );
    });
  });

  describe("getPrivacySettings", () => {
    it("returns default privacy settings in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await settingsService.getPrivacySettings();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(
        expect.objectContaining({ profileVisible: true, showVisitCharge: true }),
      );
      expect(result).toEqual({ profileVisible: true, showVisitCharge: true });
    });

    it("fetches privacy settings from API in non-mock mode", async () => {
      const apiResponse: PrivacySettings = { profileVisible: false, showVisitCharge: true };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(apiResponse);

      const result = await settingsService.getPrivacySettings();

      expect(mockedHttpGet).toHaveBeenCalledWith("/users/me/privacy");
      expect(result).toEqual(apiResponse);
    });
  });

  describe("updatePrivacySettings", () => {
    const privacyInput: Partial<PrivacySettings> = {
      profileVisible: false,
    };

    it("returns updated settings with defaults in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await settingsService.updatePrivacySettings(privacyInput);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 300, 700);
      expect(result).toEqual({ profileVisible: false, showVisitCharge: true });
    });

    it("uses provided showVisitCharge when given", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const inputWithBoth: Partial<PrivacySettings> = {
        profileVisible: true,
        showVisitCharge: false,
      };
      const result = await settingsService.updatePrivacySettings(inputWithBoth);

      expect(result).toEqual({ profileVisible: true, showVisitCharge: false });
    });

    it("calls API in non-mock mode", async () => {
      const apiResponse: PrivacySettings = { profileVisible: false, showVisitCharge: false };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPatch.mockResolvedValue(apiResponse);

      const result = await settingsService.updatePrivacySettings(privacyInput);

      expect(mockedHttpPatch).toHaveBeenCalledWith("/users/me/privacy", privacyInput);
      expect(result).toEqual(apiResponse);
    });
  });

  describe("signOut", () => {
    it("calls logoutWorker", () => {
      settingsService.signOut();

      expect(mockedLogoutWorker).toHaveBeenCalled();
    });
  });

  describe("isDemoSession", () => {
    it("returns true when session is demo mode", () => {
      mockedGetWorkerSession.mockReturnValue({
        workerId: "demo-worker",
        isAuthenticated: true,
        isDemoMode: true,
      });

      const result = settingsService.isDemoSession();

      expect(mockedGetWorkerSession).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("returns false when session is not demo mode", () => {
      mockedGetWorkerSession.mockReturnValue({
        workerId: "real-worker",
        isAuthenticated: true,
        isDemoMode: false,
      });

      const result = settingsService.isDemoSession();

      expect(result).toBe(false);
    });
  });

  describe("queryKeys", () => {
    it("has correct query key structure", () => {
      expect(settingsService.queryKeys.privacy).toEqual(["worker", "settings", "privacy"]);
    });
  });
});