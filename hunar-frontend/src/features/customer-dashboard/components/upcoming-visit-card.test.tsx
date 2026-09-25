import { render, screen } from "@testing-library/react";
import { UpcomingVisitCard } from "./upcoming-visit-card";

const mockVisit = {
  id: "visit-1",
  jobTitle: "AC Repair",
  workerName: "Ahmed Khan",
  scheduledAt: "2024-01-16T10:00:00Z",
  address: "123 Main St, Karachi",
  status: "SCHEDULED",
};

describe("UpcomingVisitCard", () => {
  it("renders visit card", () => {
    render(<UpcomingVisitCard visit={mockVisit} />);
    expect(screen.getByText("AC Repair")).toBeInTheDocument();
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText(/jan 16/i)).toBeInTheDocument();
    expect(screen.getByText("123 Main St, Karachi")).toBeInTheDocument();
  });

  it("displays status badge", () => {
    render(<UpcomingVisitCard visit={mockVisit} />);
    expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
  });
});