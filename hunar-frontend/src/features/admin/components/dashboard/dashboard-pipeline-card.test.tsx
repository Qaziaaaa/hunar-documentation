import { render, screen } from "@testing-library/react";
import { DashboardPipelineCard } from "./dashboard-pipeline-card";
import type { AdminKpiStats } from "@/types/admin";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockKpis: AdminKpiStats = {
  totalJobs: 42,
  openJobs: 5,
  activeJobs: 8,
  completedJobs: 29,
  cancelledJobs: 0,
  totalCustomers: 120,
  newCustomersThisWeek: 45,
  totalWorkers: 18,
  verifiedWorkers: 12,
  pendingWorkers: 3,
  suspendedWorkers: 1,
  totalRevenue: 5235,
  totalPaymentsProcessed: 37,
  activeNowCount: 4,
};

describe("DashboardPipelineCard", () => {
  it("renders all four pipeline stages with counts", () => {
    render(<DashboardPipelineCard kpis={mockKpis} />);
    expect(screen.getByText("Job pipeline")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("29")).toBeInTheDocument();
    expect(screen.getByText("42 jobs total")).toBeInTheDocument();
  });

  it("labels the stacked bar for screen readers", () => {
    render(<DashboardPipelineCard kpis={mockKpis} />);
    expect(
      screen.getByRole("img", { name: /Open 5, In progress 8, Completed 29, Cancelled 0/ }),
    ).toBeInTheDocument();
  });

  it("links to the jobs page", () => {
    render(<DashboardPipelineCard kpis={mockKpis} />);
    expect(screen.getByRole("link", { name: /all jobs/i })).toHaveAttribute("href", "/admin/jobs");
  });
});
