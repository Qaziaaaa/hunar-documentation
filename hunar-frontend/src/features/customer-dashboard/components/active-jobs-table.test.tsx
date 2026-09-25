import { render, screen } from "@testing-library/react";
import { ActiveJobsTable } from "./active-jobs-table";

const mockJobs = [
  { id: "job-1", title: "AC Repair", status: "IN_PROGRESS", workerName: "Ahmed Khan", createdAt: "2024-01-15T10:00:00Z" },
  { id: "job-2", title: "Plumbing Fix", status: "OFFERS_RECEIVING", createdAt: "2024-01-14T10:00:00Z" },
];

describe("ActiveJobsTable", () => {
  it("renders jobs table", () => {
    render(<ActiveJobsTable jobs={mockJobs} />);
    expect(screen.getByText("AC Repair")).toBeInTheDocument();
    expect(screen.getByText("Plumbing Fix")).toBeInTheDocument();
  });

  it("displays job status", () => {
    render(<ActiveJobsTable jobs={mockJobs} />);
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/offers receiving/i)).toBeInTheDocument();
  });

  it("displays worker name when assigned", () => {
    render(<ActiveJobsTable jobs={mockJobs} />);
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
  });

  it("shows empty state when no jobs", () => {
    render(<ActiveJobsTable jobs={[]} />);
    expect(screen.getByText(/no active jobs/i)).toBeInTheDocument();
  });
});