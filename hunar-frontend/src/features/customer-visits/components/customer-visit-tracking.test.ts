import { resolveVisitTrackingStage } from "../api/customer-visits-api";

describe("Customer Visit Tracking Stage & Timeline Scenarios", () => {
  // Scenario 1: Job accepted, worker has not started traveling (e.g. RV6-79K)
  it("Scenario 1: Job accepted, worker has not started traveling", () => {
    const result = resolveVisitTrackingStage({
      jobStatus: "WORKER_ASSIGNED",
      visitStatus: "SCHEDULED",
      isDoorstepPendingOtp: false,
      hasInspectionSubmitted: false,
      scheduledDate: "2026-10-10T13:29:44.113Z",
      hasValidWorkerCoordinates: false,
    });

    expect(result.currentStageId).toBe("SCHEDULED");
    expect(result.isMapVisible).toBe(false); // NO live map before travel starts!
    expect(result.stageHeadline).toMatch(/Visit Confirmed & Scheduled/i);

    // Step 1 is active (current), steps 2-5 are upcoming (never mark as completed!)
    expect(result.timelineSteps[0].status).toBe("current");
    expect(result.timelineSteps[1].status).toBe("upcoming");
    expect(result.timelineSteps[2].status).toBe("upcoming");
    expect(result.timelineSteps[3].status).toBe("upcoming");
    expect(result.timelineSteps[4].status).toBe("upcoming");
  });

  // Scenario 2: Worker is traveling, with valid location updates
  it("Scenario 2: Worker is traveling, with valid location updates", () => {
    const result = resolveVisitTrackingStage({
      jobStatus: "VISIT_IN_PROGRESS",
      visitStatus: "IN_PROGRESS",
      isDoorstepPendingOtp: false,
      hasInspectionSubmitted: false,
      startedAt: "2026-10-10T13:35:00.000Z",
      hasValidWorkerCoordinates: true,
    });

    expect(result.currentStageId).toBe("EN_ROUTE");
    expect(result.isMapVisible).toBe(true); // Map visible with real coordinates
    expect(result.stageHeadline).toMatch(/Technician Heading to Your Location/i);

    // Step 1 completed, Step 2 current, Steps 3-5 upcoming
    expect(result.timelineSteps[0].status).toBe("completed");
    expect(result.timelineSteps[1].status).toBe("current");
    expect(result.timelineSteps[2].status).toBe("upcoming");
    expect(result.timelineSteps[3].status).toBe("upcoming");
    expect(result.timelineSteps[4].status).toBe("upcoming");
  });

  // Scenario 3: Worker has arrived but has not started the visit (doorstep PIN pending)
  it("Scenario 3: Worker has arrived at doorstep (Doorstep PIN pending)", () => {
    const result = resolveVisitTrackingStage({
      jobStatus: "VISIT_IN_PROGRESS",
      visitStatus: "IN_PROGRESS",
      isDoorstepPendingOtp: true,
      hasInspectionSubmitted: false,
      arrivedAt: "2026-10-10T13:45:00.000Z",
      hasValidWorkerCoordinates: true,
    });

    expect(result.currentStageId).toBe("ARRIVED");
    expect(result.isMapVisible).toBe(false); // Travel finished, doorstep PIN verification
    expect(result.stageHeadline).toMatch(/Technician Arrived at Doorstep/i);

    // Steps 1 & 2 completed, Step 3 current, Steps 4 & 5 upcoming
    expect(result.timelineSteps[0].status).toBe("completed");
    expect(result.timelineSteps[1].status).toBe("completed");
    expect(result.timelineSteps[2].status).toBe("current");
    expect(result.timelineSteps[3].status).toBe("upcoming");
    expect(result.timelineSteps[4].status).toBe("upcoming");
  });

  // Scenario 4: Visit started and inspection is in progress (OTP verified, admitted inside)
  it("Scenario 4: Visit started and inspection is in progress", () => {
    const result = resolveVisitTrackingStage({
      jobStatus: "VISIT_COMPLETED",
      visitStatus: "COMPLETED",
      isDoorstepPendingOtp: false,
      hasInspectionSubmitted: false,
    });

    expect(result.currentStageId).toBe("IN_PREMISES");
    expect(result.isMapVisible).toBe(false);
    expect(result.stageHeadline).toMatch(/Technician Inside Premises/i);

    // Steps 1, 2, 3 completed, Step 4 current, Step 5 upcoming
    expect(result.timelineSteps[0].status).toBe("completed");
    expect(result.timelineSteps[1].status).toBe("completed");
    expect(result.timelineSteps[2].status).toBe("completed");
    expect(result.timelineSteps[3].status).toBe("current");
    expect(result.timelineSteps[4].status).toBe("upcoming");
  });

  // Scenario 5: Visit completed / Inspection done
  it("Scenario 5: Visit completed & Inspection done", () => {
    const result = resolveVisitTrackingStage({
      jobStatus: "INSPECTION_DONE",
      visitStatus: "COMPLETED",
      isDoorstepPendingOtp: false,
      hasInspectionSubmitted: true,
      inspectionSubmittedAt: "2026-10-10T14:00:00.000Z",
    });

    expect(result.currentStageId).toBe("INSPECTION_DONE");
    expect(result.isMapVisible).toBe(false);
    expect(result.stageHeadline).toMatch(/Inspection Report Submitted/i);

    // Steps 1, 2, 3, 4 completed, Step 5 is current
    expect(result.timelineSteps[0].status).toBe("completed");
    expect(result.timelineSteps[1].status).toBe("completed");
    expect(result.timelineSteps[2].status).toBe("completed");
    expect(result.timelineSteps[3].status).toBe("completed");
    expect(result.timelineSteps[4].status).toBe("current");
  });

  // Scenario 6: Technician not assigned (OPEN or OFFERS_RECEIVED)
  it("Scenario 6: Technician not assigned", () => {
    const result = resolveVisitTrackingStage({
      jobStatus: "OPEN",
      visitStatus: undefined,
      isDoorstepPendingOtp: false,
      hasInspectionSubmitted: false,
    });

    expect(result.currentStageId).toBe("UNASSIGNED");
    expect(result.isMapVisible).toBe(false);
    expect(result.stageHeadline).toMatch(/Technician Assignment Pending/i);

    // Step 1 is current/pending, remaining steps upcoming
    expect(result.timelineSteps[0].status).toBe("current");
    expect(result.timelineSteps[1].status).toBe("upcoming");
  });

  // Scenario 7: Worker is traveling, but location is unavailable (device has no GPS yet)
  it("Scenario 7: Worker traveling, but GPS location unavailable", () => {
    const result = resolveVisitTrackingStage({
      jobStatus: "VISIT_IN_PROGRESS",
      visitStatus: "IN_PROGRESS",
      isDoorstepPendingOtp: false,
      hasInspectionSubmitted: false,
      hasValidWorkerCoordinates: false, // NO coordinates received yet
    });

    expect(result.currentStageId).toBe("EN_ROUTE");
    expect(result.isMapVisible).toBe(false); // Map must NOT render with fake coordinates
    expect(result.timelineSteps[1].status).toBe("current");
  });

  // Scenario 8: Missing or unknown backend status
  it("Scenario 8: Missing or unknown backend status", () => {
    const result = resolveVisitTrackingStage({
      jobStatus: "UNKNOWN_CUSTOM_STATUS",
      visitStatus: undefined,
      isDoorstepPendingOtp: false,
      hasInspectionSubmitted: false,
    });

    // Falls back safely to SCHEDULED without fabricating active travel or diagnosis
    expect(result.currentStageId).toBe("SCHEDULED");
    expect(result.isMapVisible).toBe(false);
    expect(result.timelineSteps[0].status).toBe("current");
    expect(result.timelineSteps[1].status).toBe("upcoming");
  });

  // Scenario 9: Completed terminal job
  it("Scenario 9: Terminal completed job (COMPLETED / PAID)", () => {
    const result = resolveVisitTrackingStage({
      jobStatus: "COMPLETED",
      visitStatus: "COMPLETED",
      completedAt: "2026-10-10T14:30:00.000Z",
    });

    expect(result.currentStageId).toBe("COMPLETED");
    expect(result.isMapVisible).toBe(false);
    expect(result.timelineSteps.every((s) => s.status === "completed")).toBe(true);
  });

  // Scenario 10: Cancelled status
  it("Scenario 10: Cancelled visit", () => {
    const result = resolveVisitTrackingStage({
      jobStatus: "CANCELLED",
      visitStatus: "CANCELLED",
    });

    expect(result.currentStageId).toBe("CANCELLED");
    expect(result.isMapVisible).toBe(false);
    expect(result.stageHeadline).toMatch(/Visit Cancelled/i);
  });
});
