import { http } from "@/lib/api-client";
import { getCustomerJobs } from "./customer-jobs-api";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";

jest.mock("@/lib/api-client", () => ({
  http: {
    get: jest.fn(),
  },
}));

const mockedHttpGet = http.get as jest.MockedFunction<typeof http.get>;

const jobRow = {
  id: "KQ9-06Q",
  title: "Geyser Installation",
  categoryName: "Plumbing",
  description: "Gas geyser needs fitting",
  urgency: "NORMAL",
  address: "House 45, Street 12",
  city: "Peshawar",
  area: "University Town",
  latitude: 34.0043,
  longitude: 71.5034,
  status: "OPEN",
  images: [],
  voiceNoteUrl: null,
  suggestedVisitCharge: 800,
  preferredVisitTime: null,
  createdAt: "2026-10-09T06:26:39.513Z",
  offers: [],
};

describe("customer list envelopes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("unwraps the { data, meta } paginated envelope from /jobs/customer", async () => {
    mockedHttpGet.mockResolvedValue({
      data: [jobRow],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });

    const jobs = await getCustomerJobs();

    expect(mockedHttpGet).toHaveBeenCalledWith("/jobs/customer?limit=100");
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("KQ9-06Q");
    expect(jobs[0].status).toBe("receiving_offers");
  });

  it("still accepts a bare array from /jobs/customer", async () => {
    mockedHttpGet.mockResolvedValue([jobRow]);

    const jobs = await getCustomerJobs();

    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("KQ9-06Q");
  });

  it("returns an empty list when the envelope has no rows", async () => {
    mockedHttpGet.mockResolvedValue({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } });

    await expect(getCustomerJobs()).resolves.toEqual([]);
  });

  it("unwraps the { data, meta } paginated envelope from /visits/my", async () => {
    mockedHttpGet.mockResolvedValue({
      data: [
        {
          id: "visit-1",
          jobId: "KQ9-06Q",
          status: "SCHEDULED",
          workerId: "w1",
        },
      ],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });

    const visits = await getCustomerVisits();

    expect(visits).toHaveLength(1);
    expect(visits[0].id).toBe("visit-1");
    expect(visits[0].jobId).toBe("KQ9-06Q");
  });

  it("rejects a response with no rows at all", async () => {
    mockedHttpGet.mockResolvedValue({ unexpected: true });

    await expect(getCustomerVisits()).rejects.toThrow("INVALID_VISITS_RESPONSE");
  });
});
