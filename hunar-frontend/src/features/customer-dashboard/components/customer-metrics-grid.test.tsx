import { render, screen } from "@testing-library/react";
import { CustomerMetricsGrid } from "./customer-metrics-grid";

const mockMetrics = {
  activeJobs: 3,
  upcomingVisits: 2,
  totalSpent: 15000,
  completedJobs: 10,
};

describe("CustomerMetricsGrid", () => {
  it("renders all metrics", () => {
    render(<CustomerMetricsGrid metrics={mockMetrics} />);
    expect(screen.getByText(/active jobs/i)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/upcoming visits/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/total spent/i)).toBeInTheDocument();
    expect(screen.getByText("Rs. 15,000")).toBeInTheDocument();
    expect(screen.getByText(/completed jobs/i)).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("has correct grid layout", () => {
    render(<CustomerMetricsGrid metrics={mockMetrics} />);
    const container = screen.getByText(/active jobs/i).closest("div");
    expect(container).toHaveClass("grid");
    expect(container).toHaveClass("grid-cols-2");
    expect(container).toHaveClass("md:grid-cols-4");
  });
});