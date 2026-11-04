import { createJob } from "./post-job-api";
import { http } from "@/lib/api-client";
import type { PostJobData } from "../types";

jest.mock("@/lib/api-client", () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    upload: jest.fn(),
  },
}));

describe("AUDIT-005: Strict Database Category & Exact Coordinate Enforcement", () => {
  const mockBackendCategories = [
    {
      id: "uuid-plumbing-1234",
      name: "Plumbing",
      nameUrdu: "پلمبنگ",
      defaultVisitCharge: 500,
      suggestedFee: 500,
      isActive: true,
    },
    {
      id: "uuid-electrical-5678",
      name: "Electrical",
      nameUrdu: "الیکٹریکل",
      defaultVisitCharge: 600,
      suggestedFee: 600,
      isActive: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (http.get as jest.Mock).mockResolvedValue(mockBackendCategories);
  });

  const baseJobData: PostJobData = {
    category: "uuid-plumbing-1234",
    subCategory: "",
    title: "Leaking pipe",
    description: "Water leaking under sink",
    photos: [],
    address: "House 12, Street 3, Hayatabad",
    area: "Hayatabad Phase 1",
    city: "Peshawar",
    latitude: 33.9982,
    longitude: 71.4321,
    scheduleType: "asap",
    preferredDate: "2026-11-10",
    preferredTimeSlot: "10:00 AM",
    suggestedVisitFee: 500,
  };

  describe("Part 1: Strict Backend Category Resolution", () => {
    it("throws CATEGORY_REQUIRED if category is empty", async () => {
      await expect(
        createJob({ ...baseJobData, category: "" })
      ).rejects.toThrow("CATEGORY_REQUIRED");
    });

    it("throws CATEGORY_NOT_FOUND and NEVER falls back to seed-category-1 when category does not exist in backend DB", async () => {
      await expect(
        createJob({ ...baseJobData, category: "non-existent-or-fake-category" })
      ).rejects.toThrow("CATEGORY_NOT_FOUND");

      // Verify no POST was made with fake data
      expect(http.post).not.toHaveBeenCalled();
    });

    it("resolves exact backend category ID and passes it to POST /jobs", async () => {
      (http.post as jest.Mock).mockResolvedValue({ id: "SR-101", status: "OPEN" });

      await createJob({ ...baseJobData, category: "uuid-plumbing-1234" });

      expect(http.post).toHaveBeenCalledWith(
        "/jobs",
        expect.objectContaining({
          categoryId: "uuid-plumbing-1234",
        })
      );
    });

    it("resolves backend category by name match to its authentic database ID", async () => {
      (http.post as jest.Mock).mockResolvedValue({ id: "SR-102", status: "OPEN" });

      await createJob({ ...baseJobData, category: "Plumbing" });

      expect(http.post).toHaveBeenCalledWith(
        "/jobs",
        expect.objectContaining({
          categoryId: "uuid-plumbing-1234",
        })
      );
    });
  });

  describe("Part 2: Exact Coordinates Enforcement", () => {
    it("throws LOCATION_COORDINATES_REQUIRED if latitude is undefined (no Peshawar fallback)", async () => {
      await expect(
        createJob({ ...baseJobData, latitude: undefined })
      ).rejects.toThrow("LOCATION_COORDINATES_REQUIRED");

      expect(http.post).not.toHaveBeenCalled();
    });

    it("throws LOCATION_COORDINATES_REQUIRED if longitude is undefined", async () => {
      await expect(
        createJob({ ...baseJobData, longitude: undefined })
      ).rejects.toThrow("LOCATION_COORDINATES_REQUIRED");

      expect(http.post).not.toHaveBeenCalled();
    });

    it("throws LOCATION_COORDINATES_REQUIRED if coordinates are 0 (zero coordinates rejected)", async () => {
      await expect(
        createJob({ ...baseJobData, latitude: 0, longitude: 0 })
      ).rejects.toThrow("LOCATION_COORDINATES_REQUIRED");

      expect(http.post).not.toHaveBeenCalled();
    });

    it("submits exact customer coordinates without mutation", async () => {
      (http.post as jest.Mock).mockResolvedValue({ id: "SR-103", status: "OPEN" });

      await createJob({
        ...baseJobData,
        latitude: 34.0055,
        longitude: 71.5322,
      });

      expect(http.post).toHaveBeenCalledWith(
        "/jobs",
        expect.objectContaining({
          latitude: 34.0055,
          longitude: 71.5322,
        })
      );
    });
  });
});

