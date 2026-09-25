import { render, screen } from "@testing-library/react";
import { CustomerDashboardView } from "./customer-dashboard-view";

describe("CustomerDashboardView", () => {
  it("renders dashboard header", () => {
    render(<CustomerDashboardView />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it("renders metrics grid", () => {
    render(<CustomerDashboardView />);
    expect(screen.getByText(/active jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/upcoming visits/i)).toBeInTheDocument();
    expect(screen.getByText(/total spent/i)).toBeInTheDocument();
  });

  it("renders services grid", () => {
    render(<CustomerDashboardView />);
    expect(screen.getByText(/popular services/i)).toBeInTheDocument();
  });

  it("renders hero CTA", () => {
    render(<CustomerDashboardView />);
    expect(screen.getByRole("button", { name: /post a job/i })).toBeInTheDocument();
  });
});