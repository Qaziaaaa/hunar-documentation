import { render, screen } from "@testing-library/react";
import { LiveJobsStream } from "./live-jobs-stream";
import type { LiveJobItem } from "@/types/admin";

const mockJobs: LiveJobItem[] = [
  {
    id: "job-1",
    title: "AC Repair",
    category: "HVAC",
    customerName: "John Doe",
    workerName: "Ahmed Khan",
    amount: 5000,
    status: "IN_PROGRESS",
    city: "Karachi",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "job-2",
    title: "Plumbing Fix",
    category: "Plumbing",
    customerName: "Jane Smith",
    amount: 3000,
    status: "OPEN",
    city: "Lahore",
    createdAt: "2024-01-15T11:00:00Z",
  },
];

describe("LiveJobsStream", () => {
  it("renders table with job data", () => {
    render(<LiveJobsStream jobs={mockJobs} />);
    expect(screen.getByText("AC Repair")).toBeInTheDocument();
    expect(screen.getByText("Plumbing Fix")).toBeInTheDocument();
  });

  it("displays job status with correct badges", () => {
    render(<LiveJobsStream jobs={mockJobs} />);
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/open/i)).toBeInTheDocument();
  });

  it("displays customer and worker names", () => {
    render(<LiveJobsStream jobs={mockJobs} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("displays amount in Pakistani Rupees format", () => {
    render(<LiveJobsStream jobs={mockJobs} />);
    expect(screen.getByText("Rs. 5,000")).toBeInTheDocument();
    expect(screen.getByText("Rs. 3,000")).toBeInTheDocument();
  });

  it("displays city", () => {
    render(<LiveJobsStream jobs={mockJobs} />);
    expect(screen.getByText("Karachi")).toBeInTheDocument();
    expect(screen.getByText("Lahore")).toBeInTheDocument();
  });

  it("shows empty state when no jobs", () => {
    render(<LiveJobsStream jobs={[]} />);
    expect(screen.getByText(/no live jobs/i)).toBeInTheDocument();
  });

  it("has correct table structure", () => {
    render(<LiveJobsStream jobs={mockJobs} />);
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
  });
});