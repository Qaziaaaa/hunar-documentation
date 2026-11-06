import { mapBackendJob } from "@/services/worker/jobs.service";
import { isCategoryMatched } from "./job-request-feed";

describe("Worker Dashboard Category Normalization & Matching", () => {
  it("normalizes socket payload with categoryName to Job.category", () => {
    const rawSocketJob = {
      id: "job-clean-123",
      title: "Full house deep cleaning",
      description: "Need deep cleaning of 3 bedrooms and sofa",
      categoryId: "seed-category-6",
      categoryName: "Cleaning",
      status: "OPEN",
      urgency: "NORMAL",
      latitude: 34.0,
      longitude: 71.5,
      address: "Phase 5, Hayatabad",
      city: "Peshawar",
      customer: {
        id: "cust-1",
        name: "Test Customer",
      },
    };

    const job = mapBackendJob(rawSocketJob);
    expect(job.category).toBeDefined();
    expect(job.category?.name).toBe("Cleaning");
    expect(job.category?.id).toBe("seed-category-6");
  });

  it("normalizes backend socket payload with nested category object", () => {
    const rawSocketJob = {
      id: "job-clean-456",
      title: "Kitchen Cleaning",
      categoryId: "seed-category-6",
      categoryName: "Cleaning",
      category: {
        id: "seed-category-6",
        name: "Cleaning",
      },
      status: "OPEN",
    };

    const job = mapBackendJob(rawSocketJob);
    expect(job.category).toBeDefined();
    expect(job.category?.name).toBe("Cleaning");
  });

  it("matches 'Cleaning' and 'Home Cleaner' against worker skills", () => {
    const workerWithCleaning = ["Cleaning", "seed-category-6"];
    expect(isCategoryMatched("Home Cleaner", workerWithCleaning, "seed-category-6", "Cleaning")).toBe(true);
    expect(isCategoryMatched("Cleaning", workerWithCleaning)).toBe(true);
  });
});

