import { render, screen } from "@testing-library/react";
import { JobStatusDonutChart } from "./job-status-donut-chart";

const mockData = [
  { status: "OPEN", count: 50 },
  { status: "IN_PROGRESS", count: 30 },
  { status: "COMPLETED", count: 100 },
  { status: "CANCELLED", count: 5 },
  { status: "DISPUTED", count: 2 },
];

describe("JobStatusDonutChart", () => {
  it("renders chart container", () => {
    render(<JobStatusDonutChart data={mockData} />);
    expect(screen.getByText(/job status distribution/i)).toBeInTheDocument();
  });

  it("renders legend with all statuses", () => {
    render(<JobStatusDonutChart data={mockData} />);
    expect(screen.getByText(/open/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
    expect(screen.getByText(/disputed/i)).toBeInTheDocument();
  });

  it("renders chart canvas", () => {
    render(<JobStatusDonutChart data={mockData} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("displays total count", () => {
    render(<JobStatusDonutChart data={mockData} />);
    expect(screen.getByText(/187 total/i)).toBeInTheDocument();
  });

  it("handles empty data", () => {
    render(<JobStatusDonutChart data={[]} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });
});