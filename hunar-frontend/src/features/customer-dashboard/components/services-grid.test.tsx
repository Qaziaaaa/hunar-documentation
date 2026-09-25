import { render, screen } from "@testing-library/react";
import { ServicesGrid } from "./services-grid";

const mockServices = [
  { id: "1", name: "Plumbing", icon: "wrench", jobCount: 50 },
  { id: "2", name: "Electrical", icon: "zap", jobCount: 30 },
  { id: "3", name: "AC Repair", icon: "snowflake", jobCount: 25 },
];

describe("ServicesGrid", () => {
  it("renders services", () => {
    render(<ServicesGrid services={mockServices} />);
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
    expect(screen.getByText("Electrical")).toBeInTheDocument();
    expect(screen.getByText("AC Repair")).toBeInTheDocument();
  });

  it("displays job counts", () => {
    render(<ServicesGrid services={mockServices} />);
    expect(screen.getByText("50 jobs")).toBeInTheDocument();
    expect(screen.getByText("30 jobs")).toBeInTheDocument();
    expect(screen.getByText("25 jobs")).toBeInTheDocument();
  });

  it("renders as grid", () => {
    render(<ServicesGrid services={mockServices} />);
    const container = screen.getByText("Plumbing").closest("div");
    expect(container).toHaveClass("grid");
  });
});