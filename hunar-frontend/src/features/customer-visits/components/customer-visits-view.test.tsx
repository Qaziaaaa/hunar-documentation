import { render, screen } from "@testing-library/react";
import { CustomerVisitsView } from "./customer-visits-view";

const mockVisits = [
  {
    id: "visit-1",
    jobId: "job-1",
    jobTitle: "AC Repair",
    workerName: "Ahmed Khan",
    workerPhone: "03001234567",
    status: "EN_ROUTE",
    scheduledAt: "2024-01-16T10:00:00Z",
    address: "123 Main St, Karachi",
  },
  {
    id: "visit-2",
    jobId: "job-2",
    jobTitle: "Plumbing Fix",
    workerName: "Ali Raza",
    workerPhone: "03111234567",
    status: "COMPLETED",
    scheduledAt: "2024-01-15T10:00:00Z",
    address: "456 Oak Ave, Lahore",
  },
];

describe("CustomerVisitsView", () => {
  it("renders visits title", () => {
    render(<CustomerVisitsView visits={mockVisits} />);
    expect(screen.getByText(/upcoming visits/i)).toBeInTheDocument();
  });

  it("renders upcoming visits", () => {
    render(<CustomerVisitsView visits={mockVisits} />);
    expect(screen.getByText("AC Repair")).toBeInTheDocument();
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText(/en route/i)).toBeInTheDocument();
    expect(screen.getByText("123 Main St, Karachi")).toBeInTheDocument();
  });

  it("renders completed visits", () => {
    render(<CustomerVisitsView visits={mockVisits} />);
    expect(screen.getByText("Plumbing Fix")).toBeInTheDocument();
    expect(screen.getByText("Ali Raza")).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it("shows empty state when no visits", () => {
    render(<CustomerVisitsView visits={[]} />);
    expect(screen.getByText(/no upcoming visits/i)).toBeInTheDocument();
  });
});