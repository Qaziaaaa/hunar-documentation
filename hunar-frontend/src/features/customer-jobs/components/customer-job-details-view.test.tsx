import { render, screen } from "@testing-library/react";
import { CustomerJobDetailsView } from "./customer-job-details-view";

const mockJob = {
  id: "job-1",
  title: "AC Repair",
  description: "AC not cooling",
  category: "HVAC",
  address: "123 Main St, Karachi",
  status: "IN_PROGRESS",
  visitCharge: 500,
  estimatedTotal: 5000,
  customerName: "John Doe",
  workerName: "Ahmed Khan",
  workerRating: 4.5,
  workerVerified: true,
  createdAt: "2024-01-15T10:00:00Z",
  timeline: [
    { step: "Job Posted", timestamp: "2024-01-15T10:00:00Z", completed: true },
    { step: "Offer Received", timestamp: "2024-01-15T11:00:00Z", completed: true },
    { step: "Visit Scheduled", timestamp: "2024-01-16T10:00:00Z", completed: true },
    { step: "Inspection", timestamp: "2024-01-16T11:00:00Z", completed: false },
    { step: "Repair", timestamp: null, completed: false },
    { step: "Completed", timestamp: null, completed: false },
  ],
};

describe("CustomerJobDetailsView", () => {
  it("renders job title and status", () => {
    render(<CustomerJobDetailsView job={mockJob} />);
    expect(screen.getByText("AC Repair")).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });

  it("renders job details", () => {
    render(<CustomerJobDetailsView job={mockJob} />);
    expect(screen.getByText("AC not cooling")).toBeInTheDocument();
    expect(screen.getByText("123 Main St, Karachi")).toBeInTheDocument();
    expect(screen.getByText("HVAC")).toBeInTheDocument();
  });

  it("renders visit charge and estimated total", () => {
    render(<CustomerJobDetailsView job={mockJob} />);
    expect(screen.getByText("Rs. 500")).toBeInTheDocument();
    expect(screen.getByText("Rs. 5,000")).toBeInTheDocument();
  });

  it("renders worker info with verified badge", () => {
    render(<CustomerJobDetailsView job={mockJob} />);
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("renders timeline with completed steps", () => {
    render(<CustomerJobDetailsView job={mockJob} />);
    expect(screen.getByText("Job Posted")).toBeInTheDocument();
    expect(screen.getByText("Offer Received")).toBeInTheDocument();
    expect(screen.getByText("Visit Scheduled")).toBeInTheDocument();
    expect(screen.getByText("Inspection")).toBeInTheDocument();
  });
});