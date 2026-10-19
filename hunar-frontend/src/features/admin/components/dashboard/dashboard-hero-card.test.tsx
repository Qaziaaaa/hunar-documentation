import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardHeroCard } from "./dashboard-hero-card";
import type { PaymentTransaction } from "@/types/admin";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const mockTransactions: PaymentTransaction[] = [
  {
    id: "tx-1",
    jobId: "job-1",
    customerName: "Ali",
    workerName: "Ahmed",
    amount: 5000,
    commission: 500,
    netPayout: 4500,
    paymentMethod: "WALLET",
    status: "SUCCESS",
    timestamp: daysAgo(0),
  },
  {
    id: "tx-2",
    jobId: "job-2",
    customerName: "Sara",
    workerName: "Bilal",
    amount: 3000,
    commission: 300,
    netPayout: 2700,
    paymentMethod: "CASH",
    status: "ESCROW_HELD",
    timestamp: daysAgo(1),
  },
  {
    id: "tx-3",
    jobId: "job-3",
    customerName: "Omar",
    workerName: "Kashif",
    amount: 2000,
    commission: 200,
    netPayout: 1800,
    paymentMethod: "WALLET",
    status: "REFUNDED",
    timestamp: daysAgo(2),
  },
];

// Previous 30-day window transaction (day 35) so the delta has a baseline.
const prevWindowTx: PaymentTransaction = {
  id: "tx-prev",
  jobId: "job-prev",
  customerName: "Zara",
  workerName: "Hassan",
  amount: 4000,
  commission: 400,
  netPayout: 3600,
  paymentMethod: "WALLET",
  status: "SUCCESS",
  timestamp: daysAgo(35),
};

describe("DashboardHeroCard", () => {
  it("renders the platform revenue figure with count-up (final value in tests)", () => {
    render(<DashboardHeroCard totalRevenue={12345} transactions={mockTransactions} />);
    expect(screen.getByText("Platform Revenue")).toBeInTheDocument();
    expect(screen.getByText(/Rs\. 12,345/)).toBeInTheDocument();
  });

  it("renders range segment control with 7/30/90 days options", () => {
    render(<DashboardHeroCard totalRevenue={1000} transactions={[]} />);
    expect(screen.getByRole("button", { name: "7 days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30 days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "90 days" })).toBeInTheDocument();
  });

  it("switches the active range on click", () => {
    render(<DashboardHeroCard totalRevenue={1000} transactions={[]} />);
    const btn7 = screen.getByRole("button", { name: "7 days" });
    fireEvent.click(btn7);
    expect(btn7).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "30 days" })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the delta vs previous window when prior data exists, fee note otherwise", () => {
    const { rerender } = render(
      <DashboardHeroCard totalRevenue={1000} transactions={[...mockTransactions, prevWindowTx]} />,
    );
    expect(screen.getByText(/vs the 30 days before/)).toBeInTheDocument();
    rerender(<DashboardHeroCard totalRevenue={1000} transactions={[]} commissionRate={0.1} />);
    expect(screen.getByText("10% commission fee")).toBeInTheDocument();
    rerender(<DashboardHeroCard totalRevenue={1000} transactions={[]} commissionRate={null} />);
    expect(screen.getByText("Commission fee applied")).toBeInTheDocument();
  });
});
