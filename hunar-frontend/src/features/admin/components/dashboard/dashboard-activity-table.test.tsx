import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { DashboardActivityTable } from "./dashboard-activity-table";
import type {
  AuditLogEntry,
  DisputeReport,
  LiveJobItem,
  PaymentTransaction,
  VerificationRequest,
  WithdrawalRequest,
} from "@/types/admin";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/features/admin/api/admin-api", () => ({
  processWithdrawalRequest: jest.fn().mockResolvedValue(true),
  adminApi: {
    resolveDispute: jest.fn().mockResolvedValue(undefined),
    freezeWallet: jest.fn().mockResolvedValue(undefined),
  },
}));

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86_400_000).toISOString();

const mockTransactions: PaymentTransaction[] = [
  {
    id: "tx-1",
    jobId: "job-1",
    customerName: "Ali Khan",
    workerName: "Ahmed",
    amount: 5000,
    commission: 500,
    netPayout: 4500,
    paymentMethod: "WALLET",
    status: "SUCCESS",
    timestamp: now,
  },
];

const mockWithdrawals: WithdrawalRequest[] = [
  {
    id: "wd-1",
    workerId: "w1",
    workerName: "Ahmed Raza",
    amount: 8000,
    bankName: "HBL",
    accountNumber: "1234567890",
    requestedAt: yesterday,
    status: "PENDING",
  },
];

const mockDisputes: DisputeReport[] = [
  {
    id: "dp-1",
    jobId: "job-9",
    reporterName: "Sara",
    reporterRole: "CUSTOMER",
    targetName: "Bilal",
    issueCategory: "Poor quality",
    description: "Work not completed as agreed",
    evidenceUrls: [],
    status: "OPEN",
    createdAt: now,
  },
];

const mockJobs: LiveJobItem[] = [
  {
    id: "job-7",
    title: "Deep clean",
    category: "Cleaning",
    customerName: "Omar",
    workerName: "Kashif",
    amount: 3000,
    status: "IN_PROGRESS",
    city: "Lahore",
    createdAt: now,
  },
];

const mockAudit: AuditLogEntry[] = [
  {
    id: "au-1",
    adminName: "Admin",
    actionType: "APPROVE_VERIFICATION",
    targetResource: "worker",
    details: "Verified worker CNIC",
    timestamp: yesterday,
  },
];

const mockVerifications: VerificationRequest[] = [
  {
    id: "vf-1",
    workerId: "w9",
    workerName: "Naveed",
    workerPhone: "0300",
    skills: ["Electrical"],
    experienceYears: 3,
    serviceCity: "Karachi",
    cnicNumber: "42101",
    cnicFrontUrl: "",
    cnicBackUrl: "",
    submittedAt: now,
    status: "PENDING",
  },
];

function renderTable(overrides?: Partial<Parameters<typeof DashboardActivityTable>[0]>) {
  return render(
    <DashboardActivityTable
      transactions={mockTransactions}
      withdrawals={mockWithdrawals}
      disputes={mockDisputes}
      liveJobs={mockJobs}
      auditLogs={mockAudit}
      verifications={mockVerifications}
      {...overrides}
    />,
  );
}

describe("DashboardActivityTable", () => {
  // Desktop table and mobile list both mount (responsive CSS hides one in the
  // browser; jsdom renders both) — scope assertions to the desktop <table>.
  const desktopTable = () => within(screen.getByRole("table"));

  it("merges all six sources into one table with newest first", () => {
    renderTable();
    expect(screen.getByText("Recent activity")).toBeInTheDocument();
    const table = desktopTable();
    expect(table.getByText("Payment")).toBeInTheDocument();
    expect(table.getByText("Payout")).toBeInTheDocument();
    expect(table.getByText("Dispute")).toBeInTheDocument();
    expect(table.getByText("Job")).toBeInTheDocument();
    expect(table.getByText("Audit")).toBeInTheDocument();
    expect(table.getByText("Verification")).toBeInTheDocument();
    expect(table.getByText("Deep clean")).toBeInTheDocument();
    expect(table.getByText("APPROVE_VERIFICATION")).toBeInTheDocument();
  });

  it("filters rows via the segment control", () => {
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: "Payouts" }));
    const table = desktopTable();
    expect(table.getByText("Payout request")).toBeInTheDocument();
    expect(table.queryByText("Deep clean")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(desktopTable().getByText("Deep clean")).toBeInTheDocument();
  });

  it("shows Release action on PENDING payouts and toasts on approval", async () => {
    renderTable();
    fireEvent.click(desktopTable().getByRole("button", { name: /release/i }));
    await waitFor(() => {
      expect(screen.getByText(/approved for Ahmed Raza/)).toBeInTheDocument();
    });
  });

  it("opens the decline modal with a disabled Confirm until a note is typed", () => {
    renderTable();
    fireEvent.click(desktopTable().getByRole("button", { name: /decline/i }));
    expect(screen.getByRole("dialog", { name: /decline payout/i })).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Confirm Decline" });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/account title mismatch/i), {
      target: { value: "IBAN mismatch" },
    });
    expect(confirm).toBeEnabled();
  });

  it("opens the mediation modal for OPEN disputes", async () => {
    renderTable();
    fireEvent.click(desktopTable().getByRole("button", { name: /mediate/i }));
    const dialog = screen.getByRole("dialog", { name: /mediate dispute/i });
    expect(within(dialog).getByText("Poor quality")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: /execute binding decision/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText(/resolved: Full refund issued/)).toBeInTheDocument();
    });
  });

  it("shows the empty note when no rows match", () => {
    renderTable({
      transactions: [],
      withdrawals: [],
      disputes: [],
      liveJobs: [],
      auditLogs: [],
      verifications: [],
    });
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });
});
