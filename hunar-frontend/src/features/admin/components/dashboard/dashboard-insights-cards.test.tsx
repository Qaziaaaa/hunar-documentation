import { render, screen } from "@testing-library/react";
import { DashboardDemandCard } from "./dashboard-demand-card";
import { DashboardToplistCard } from "./dashboard-toplist-card";
import type { LiveJobItem, WorkerUser } from "@/types/admin";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const baseWorker: Omit<WorkerUser, "id" | "name" | "skills" | "rating" | "totalEarnings"> = {
  phone: "0300",
  email: "w@x.pk",
  verificationStatus: "VERIFIED",
  walletBalance: 0,
  isOnline: true,
  joinDate: "2024-01-01",
  status: "ACTIVE",
  experienceYears: 2,
  serviceCity: "Karachi",
};

const mockWorkers: WorkerUser[] = [
  { ...baseWorker, id: "w1", name: "Ahmed Khan", skills: ["HVAC"], rating: 4.9, totalEarnings: 95000 },
  { ...baseWorker, id: "w2", name: "Bilal Ali", skills: ["Plumbing"], rating: 4.5, totalEarnings: 40000 },
  { ...baseWorker, id: "w3", name: "Sara Noor", skills: ["HVAC", "Plumbing"], rating: 4.2, totalEarnings: 22000 },
  { ...baseWorker, id: "w4", name: "Unrated", skills: ["Cleaning"], rating: 0, totalEarnings: 0 },
];

const mockJobs: LiveJobItem[] = [
  { id: "j1", title: "AC", category: "HVAC", customerName: "A", amount: 100, status: "OPEN", city: "KHI", createdAt: new Date().toISOString() },
  { id: "j2", title: "Pipe", category: "Plumbing", customerName: "B", amount: 200, status: "IN_PROGRESS", city: "KHI", createdAt: new Date().toISOString() },
  { id: "j3", title: "Done", category: "Cleaning", customerName: "C", amount: 100, status: "COMPLETED", city: "KHI", createdAt: new Date().toISOString() },
];

describe("DashboardDemandCard", () => {
  it("derives open-job demand vs verified-worker supply per category", () => {
    render(<DashboardDemandCard liveJobs={mockJobs} workers={mockWorkers} />);
    expect(screen.getByText("Demand vs supply")).toBeInTheDocument();
    expect(screen.getByText("HVAC")).toBeInTheDocument();
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
    // COMPLETED job excluded → Cleaning demand is 0 (supply row stays)
    expect(
      screen.getByRole("img", { name: "HVAC: 1 open jobs, 2 verified workers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Cleaning: 0 open jobs, 1 verified workers" }),
    ).toBeInTheDocument();
  });

  it("shows an empty note when nothing is open", () => {
    render(<DashboardDemandCard liveJobs={[]} workers={[]} />);
    expect(screen.getByText(/no open jobs right now/i)).toBeInTheDocument();
  });
});

describe("DashboardToplistCard", () => {
  it("ranks workers by rating and shows unrated ones last with a dash", () => {
    render(<DashboardToplistCard workers={mockWorkers} />);
    expect(screen.getByText("Top workers")).toBeInTheDocument();
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText("Bilal Ali")).toBeInTheDocument();
    expect(screen.getByText("Sara Noor")).toBeInTheDocument();
    expect(screen.getByText("Unrated")).toBeInTheDocument();
    expect(screen.getByText(/★ 4\.9/)).toBeInTheDocument();
    expect(screen.getByText(/★ —/)).toBeInTheDocument();
    expect(screen.getByText("Rs. 95,000")).toBeInTheDocument();
  });

  it("links to the workers directory", () => {
    render(<DashboardToplistCard workers={mockWorkers} />);
    expect(screen.getByRole("link", { name: /all workers/i })).toHaveAttribute(
      "href",
      "/admin/users/workers",
    );
  });
});
