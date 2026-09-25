import { render, screen, fireEvent } from "@testing-library/react";
import { CustomerJobsListView } from "./customer-jobs-list-view";

const mockJobs = [
  {
    id: "job-1",
    title: "AC Repair",
    status: "IN_PROGRESS",
    workerName: "Ahmed Khan",
    createdAt: "2024-01-15T10:00:00Z",
    amount: 5000,
  },
  {
    id: "job-2",
    title: "Plumbing Fix",
    status: "COMPLETED",
    workerName: "Ali Raza",
    createdAt: "2024-01-10T10:00:00Z",
    amount: 3000,
  },
];

describe("CustomerJobsListView", () => {
  it("renders jobs list", () => {
    render(<CustomerJobsListView jobs={mockJobs} />);
    expect(screen.getByText("AC Repair")).toBeInTheDocument();
    expect(screen.getByText("Plumbing Fix")).toBeInTheDocument();
  });

  it("displays job status badges", () => {
    render(<CustomerJobsListView jobs={mockJobs} />);
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it("displays worker names", () => {
    render(<CustomerJobsListView jobs={mockJobs} />);
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText("Ali Raza")).toBeInTheDocument();
  });

  it("displays amounts in PKR format", () => {
    render(<CustomerJobsListView jobs={mockJobs} />);
    expect(screen.getByText("Rs. 5,000")).toBeInTheDocument();
    expect(screen.getByText("Rs. 3,000")).toBeInTheDocument();
  });

  it("shows empty state when no jobs", () => {
    render(<CustomerJobsListView jobs={[]} />);
    expect(screen.getByText(/no jobs found/i)).toBeInTheDocument();
  });

  it("renders filter tabs", () => {
    render(<CustomerJobsListView jobs={mockJobs} />);
    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /active/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /completed/i })).toBeInTheDocument();
  });
});