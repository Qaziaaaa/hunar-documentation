import { render, screen } from "@testing-library/react";
import { ActiveVisitBanner } from "./active-visit-banner";

const mockVisit = {
  id: "visit-1",
  jobTitle: "AC Repair",
  workerName: "Ahmed Khan",
  workerPhone: "03001234567",
  status: "EN_ROUTE",
  address: "123 Main St, Karachi",
};

describe("ActiveVisitBanner", () => {
  it("renders active visit banner", () => {
    render(<ActiveVisitBanner visit={mockVisit} />);
    expect(screen.getByText(/active visit/i)).toBeInTheDocument();
    expect(screen.getByText("AC Repair")).toBeInTheDocument();
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText(/en route/i)).toBeInTheDocument();
  });

  it("renders worker contact button", () => {
    render(<ActiveVisitBanner visit={mockVisit} />);
    expect(screen.getByRole("button", { name: /call worker/i })).toBeInTheDocument();
  });

  it("does not render when no active visit", () => {
    render(<ActiveVisitBanner visit={null} />);
    expect(screen.queryByText(/active visit/i)).not.toBeInTheDocument();
  });
});