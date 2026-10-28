import { isCategoryMatched } from "./job-request-feed";

describe("Worker Dashboard Category Relevance & Matching", () => {
  const workerSkills = ["Plumbing", "seed-category-1", "Electrician"];

  it("matches category by direct name", () => {
    expect(isCategoryMatched("Plumbing", workerSkills)).toBe(true);
    expect(isCategoryMatched("Electrician", workerSkills)).toBe(true);
  });

  it("matches category by alias and stem mapping", () => {
    // "Plumber" alias for "Plumbing"
    expect(isCategoryMatched("Plumber", workerSkills)).toBe(true);
    // "Electrical" alias for "Electrician"
    expect(isCategoryMatched("Electrical", workerSkills)).toBe(true);
  });

  it("matches category by categoryId (e.g. database UUID or seed ID)", () => {
    expect(isCategoryMatched("Custom Name", workerSkills, "seed-category-1")).toBe(true);
  });

  it("matches category by rawCategory name", () => {
    expect(isCategoryMatched("Handyman", workerSkills, undefined, "Plumbing")).toBe(true);
  });

  it("rejects unrelated categories", () => {
    expect(isCategoryMatched("AC Technician", workerSkills)).toBe(false);
    expect(isCategoryMatched("Painter", workerSkills)).toBe(false);
    expect(isCategoryMatched("Carpenter", workerSkills)).toBe(false);
    expect(isCategoryMatched("Home Cleaner", workerSkills)).toBe(false);
  });

  it("returns false if worker has no assigned skills/categories", () => {
    expect(isCategoryMatched("Plumbing", [])).toBe(false);
    expect(isCategoryMatched("Electrician", undefined as any)).toBe(false);
  });
});
