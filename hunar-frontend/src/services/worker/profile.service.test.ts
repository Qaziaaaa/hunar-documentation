import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import * as profileService from "./profile.service";
import type { WorkerProfile, UpdateWorkerProfileInput } from "@/types/worker";
import { mockWorkerProfile } from "@/mocks/profile.mock";
import { MOCK_WORKER_ID } from "@/mocks/jobs.mock";

jest.mock("@/lib/api-client", () => ({
  http: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock("@/lib/data-source", () => ({
  isMockMode: jest.fn(),
  simulateLatency: jest.fn((value) => Promise.resolve(value)),
}));

const mockedHttpGet = http.get as jest.MockedFunction<typeof http.get>;
const mockedHttpPatch = http.patch as jest.MockedFunction<typeof http.patch>;
const mockedIsMockMode = isMockMode as jest.MockedFunction<typeof isMockMode>;
const mockedSimulateLatency = simulateLatency as jest.MockedFunction<typeof simulateLatency>;

describe("profile.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getWorkerProfile", () => {
    it("returns mock profile in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await profileService.getWorkerProfile();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual(mockWorkerProfile);
    });

    it("fetches profile from API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockWorkerProfile);

      const result = await profileService.getWorkerProfile();

      expect(mockedHttpGet).toHaveBeenCalledWith("/users/me");
      expect(result).toEqual(mockWorkerProfile);
    });
  });

  describe("updateWorkerProfile", () => {
    const updateInput: UpdateWorkerProfileInput = {
      fullName: "Updated Name",
      phone: "+923001234567",
      city: "Islamabad",
    };

    it("updates and returns mock profile in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await profileService.updateWorkerProfile(updateInput);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 500, 1000);
      expect(result.fullName).toBe("Updated Name");
      expect(result.phone).toBe("+923001234567");
      expect(result.city).toBe("Islamabad");
    });

    it("preserves existing fields not in update input", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await profileService.updateWorkerProfile({ fullName: "New Name" });

      expect(result.fullName).toBe("New Name");
      expect(result.email).toBe(mockWorkerProfile.email);
      expect(result.skills).toEqual(mockWorkerProfile.skills);
    });

    it("updates profile via API in non-mock mode", async () => {
      const expectedProfile = { ...mockWorkerProfile, ...updateInput };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPatch.mockResolvedValue(expectedProfile);

      const result = await profileService.updateWorkerProfile(updateInput);

      expect(mockedHttpPatch).toHaveBeenCalledWith("/users/me", updateInput);
      expect(result).toEqual(expectedProfile);
    });
  });

  describe("updateProfileAvatar", () => {
    const newAvatarUrl = "https://example.com/new-avatar.jpg";

    it("updates and returns mock profile with new avatar in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await profileService.updateProfileAvatar(newAvatarUrl);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 400, 900);
      expect(result.avatarUrl).toBe(newAvatarUrl);
    });

    it("updates avatar via API in non-mock mode", async () => {
      const expectedProfile = { ...mockWorkerProfile, avatarUrl: newAvatarUrl };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPatch.mockResolvedValue(expectedProfile);

      const result = await profileService.updateProfileAvatar(newAvatarUrl);

      expect(mockedHttpPatch).toHaveBeenCalledWith("/users/me", { avatarUrl: newAvatarUrl });
      expect(result).toEqual(expectedProfile);
    });
  });

  describe("updateProfileVisibility", () => {
    it("updates and returns mock profile with visibility in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await profileService.updateProfileVisibility(false);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 300, 700);
      expect(result.profileVisible).toBe(false);
    });

    it("sets visibility to true", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await profileService.updateProfileVisibility(true);

      expect(result.profileVisible).toBe(true);
    });

    it("updates visibility via API in non-mock mode", async () => {
      const expectedProfile = { ...mockWorkerProfile, profileVisible: false };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPatch.mockResolvedValue(expectedProfile);

      const result = await profileService.updateProfileVisibility(false);

      expect(mockedHttpPatch).toHaveBeenCalledWith("/users/me", {
        privacy: { profileVisible: false },
      });
      expect(result).toEqual(expectedProfile);
    });
  });

  describe("queryKeys", () => {
    it("has correct query key structure with default worker ID", () => {
      expect(profileService.queryKeys.profile()).toEqual(["worker", "profile", MOCK_WORKER_ID]);
    });

    it("has correct query key structure with custom worker ID", () => {
      expect(profileService.queryKeys.profile("custom-worker-id")).toEqual([
        "worker",
        "profile",
        "custom-worker-id",
      ]);
    });
  });
});