import { render, screen } from "@testing-library/react";
import { KpiStatCards } from "./kpi-stat-cards";
import type { AdminKpiStats } from "@/types/admin";

const mockStats: AdminKpiStats = {
  totalJobs: 1250,
  openJobs: 100,
  activeJobs: 50,
  completedJobs: 1000,
  cancelledJobs: 50,
  totalCustomers: 3200,
  newCustomersThisWeek: 45,
  totalWorkers: 850,
  verifiedWorkers: 720,
  pendingWorkers: 80,
  suspendedWorkers: 50,
  totalRevenue: 2500000,
  totalPaymentsProcessed: 2500,
  activeNowCount: 12,
};

describe("KpiStatCards", () => {
  it("renders all 5 KPI cards", () => {
    render(<KpiStatCards stats={mockStats} />);
    const cards = screen.getAllByText(/total jobs|customers|workers|platform revenue|active now/i);
    expect(cards).toHaveLength(5);
  });

  it("displays total jobs with correct value", () => {
    render(<KpiStatCards stats={mockStats} />);
    expect(screen.getByText(/total jobs/i)).toBeInTheDocument();
    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText(/50 active/i)).toBeInTheDocument();
    expect(screen.getByText(/1000/i)).toBeInTheDocument();
    expect(screen.getByText(/done/i)).toBeInTheDocument();
  });

  it("displays total customers with correct value", () => {
    render(<KpiStatCards stats={mockStats} />);
    expect(screen.getByText(/customers/i)).toBeInTheDocument();
    expect(screen.getByText("3,200")).toBeInTheDocument();
    expect(screen.getByText(/45 new this week/i)).toBeInTheDocument();
  });

  it("displays total workers with correct value", () => {
    render(<KpiStatCards stats={mockStats} />);
    expect(screen.getByText(/workers/i)).toBeInTheDocument();
    expect(screen.getByText("850")).toBeInTheDocument();
    expect(screen.getByText(/720 verified/i)).toBeInTheDocument();
    expect(screen.getByText(/80 pending/i)).toBeInTheDocument();
  });

  it("displays total revenue with correct value", () => {
    render(<KpiStatCards stats={mockStats} />);
    expect(screen.getByText(/platform revenue/i)).toBeInTheDocument();
    expect(screen.getByText("Rs. 2,500,000")).toBeInTheDocument();
    expect(screen.getByText(/10% commission/i)).toBeInTheDocument();
  });

  it("displays active now with correct value", () => {
    render(<KpiStatCards stats={mockStats} />);
    expect(screen.getByText(/active now/i)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/live jobs in progress/i)).toBeInTheDocument();
  });
});