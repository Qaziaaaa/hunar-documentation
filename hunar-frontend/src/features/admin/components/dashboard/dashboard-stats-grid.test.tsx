import { render, screen } from "@testing-library/react";
import { DashboardStatsGrid } from "./dashboard-stats-grid";
import type { AdminKpiStats, LiveJobItem } from "@/types/admin";

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

const mockJobs: LiveJobItem[] = [
  {
    id: "job-1",
    title: "AC Repair",
    category: "HVAC",
    customerName: "Ali",
    amount: 5000,
    status: "IN_PROGRESS",
    city: "Karachi",
    createdAt: new Date().toISOString(),
  },
];

describe("DashboardStatsGrid", () => {
  it("renders all four stat cards with KPI values", () => {
    render(<DashboardStatsGrid kpis={mockKpis} liveJobs={mockJobs} />);
    expect(screen.getByText("Total Jobs")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("Workers")).toBeInTheDocument();
    expect(screen.getByText("Active Now")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("keeps the original note copy", () => {
    render(<DashboardStatsGrid kpis={mockKpis} liveJobs={[]} />);
    expect(screen.getByText("8 active · 29 done")).toBeInTheDocument();
    expect(screen.getByText("+45 this week")).toBeInTheDocument();
    expect(screen.getByText("Live jobs in progress")).toBeInTheDocument();
    expect(screen.getByText("12 verified")).toBeInTheDocument();
    expect(screen.getByText("3 pending")).toBeInTheDocument();
  });

  it("links each card to its admin page", () => {
    render(<DashboardStatsGrid kpis={mockKpis} liveJobs={[]} />);
    expect(screen.getByRole("link", { name: /total jobs/i })).toHaveAttribute(
      "href",
      "/admin/jobs",
    );
    expect(screen.getByRole("link", { name: /customers/i })).toHaveAttribute(
      "href",
      "/admin/users/customers",
    );
    expect(screen.getByRole("link", { name: /workers/i })).toHaveAttribute(
      "href",
      "/admin/users/workers",
    );
    expect(screen.getByRole("link", { name: /active now/i })).toHaveAttribute(
      "href",
      "/admin/jobs",
    );
  });
});
