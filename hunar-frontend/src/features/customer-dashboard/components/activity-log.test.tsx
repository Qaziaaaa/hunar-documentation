import { render, screen } from "@testing-library/react";
import { ActivityLog } from "./activity-log";

const mockActivities = [
  { id: "1", action: "Job posted", timestamp: "2024-01-15T10:00:00Z", type: "job" },
  { id: "2", action: "Worker assigned", timestamp: "2024-01-15T11:00:00Z", type: "assignment" },
  { id: "3", action: "Payment made", timestamp: "2024-01-16T10:00:00Z", type: "payment" },
];

describe("ActivityLog", () => {
  it("renders activity items", () => {
    render(<ActivityLog activities={mockActivities} />);
    expect(screen.getByText("Job posted")).toBeInTheDocument();
    expect(screen.getByText("Worker assigned")).toBeInTheDocument();
    expect(screen.getByText("Payment made")).toBeInTheDocument();
  });

  it("displays timestamps", () => {
    render(<ActivityLog activities={mockActivities} />);
    expect(screen.getByText(/jan 15/i)).toBeInTheDocument();
    expect(screen.getByText(/jan 16/i)).toBeInTheDocument();
  });

  it("shows empty state when no activities", () => {
    render(<ActivityLog activities={[]} />);
    expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
  });
});