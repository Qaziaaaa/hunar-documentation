import { render, screen, fireEvent, act } from "@testing-library/react";
import { AdminShell } from "./admin-shell";

let mockPathname = "/admin/dashboard";

jest.mock("@/i18n/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/shared/workerfix-logo", () => ({
  WorkerFixLogo: () => <div data-testid="logo">Logo</div>,
}));

jest.mock("@/features/admin/api/admin-api", () => ({
  adminApi: {
    getHealth: jest.fn().mockResolvedValue({ status: "ok", db: "ok", redis: "ok" }),
    getUnreadNotificationCount: jest.fn().mockResolvedValue(2),
    getPendingVerificationCount: jest.fn().mockResolvedValue(3),
  },
}));

jest.mock("@/lib/api-client", () => ({
  ...jest.requireActual("@/lib/api-client"),
  getStoredUser: jest.fn().mockReturnValue({
    id: "admin-1",
    phone: "03001234567",
    name: "System Admin",
    email: "ops-admin@hunar.pk",
    role: "ADMIN",
  }),
  clearTokens: jest.fn(),
  getAccessToken: jest.fn().mockReturnValue("test-access-token"),
  getRefreshToken: jest.fn().mockReturnValue("test-refresh-token"),
}));

async function renderShell() {
  const view = render(
    <AdminShell>
      <div>Content</div>
    </AdminShell>,
  );
  await act(async () => {});
  return view;
}

describe("AdminShell", () => {
  beforeEach(() => {
    mockPathname = "/admin/dashboard";
  });

  it("renders sidebar with navigation groups", async () => {
    await renderShell();
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText("Governance")).toBeInTheDocument();
  });

  it("renders dashboard link in Main group", async () => {
    await renderShell();
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/live/i)).toBeInTheDocument();
  });

  it("renders Operations links", async () => {
    await renderShell();
    expect(screen.getByRole("link", { name: /customers/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /workers/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /verifications/i })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /jobs & work orders/i })).toBeInTheDocument();
  });

  it("renders Governance links", async () => {
    await renderShell();
    expect(screen.getByRole("link", { name: /payments & escrow/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /disputes & support/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /categories/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings & rules/i })).toBeInTheDocument();
  });

  it("renders sidebar search under the logo and header with notifications/profile", async () => {
    await renderShell();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /notifications \(2 unread\)/i })).toBeInTheDocument();
    expect(screen.getByText(/system admin/i)).toBeInTheDocument();
    // No hardcoded SUPER ADMIN role — role reflects the real session.
    expect(screen.queryByText(/super admin/i)).not.toBeInTheDocument();
  });

  it("highlights active navigation item with the sliding pill marker", async () => {
    mockPathname = "/admin/users/customers";
    await renderShell();
    const customersLink = screen.getByRole("link", { name: /customers/i });
    expect(customersLink).toHaveAttribute("data-nav-active", "true");
    expect(customersLink).toHaveClass("text-white");
    // Inactive items must not be marked active
    const jobsLink = screen.getByRole("link", { name: /jobs & work orders/i });
    expect(jobsLink).not.toHaveAttribute("data-nav-active");
    expect(jobsLink).toHaveClass("text-slate-600");
  });

  it("renders verified session footer", async () => {
    await renderShell();
    expect(screen.getByText(/verified session/i)).toBeInTheDocument();
    expect(screen.getByText(/audit logs active/i)).toBeInTheDocument();
  });

  it("toggles mobile drawer", async () => {
    await renderShell();
    const menuButton = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(menuButton);
    expect(screen.getByTestId("mobile-drawer")).toBeInTheDocument();
  });

  it("renders live operational pulse", async () => {
    await renderShell();
    expect(await screen.findByText(/all systems operational/i)).toBeInTheDocument();
  });

  it("shows profile dropdown with sign out", async () => {
    await renderShell();
    const profileButton = screen
      .getAllByText(/system admin/i)
      .map((el) => el.closest("button"))
      .find(Boolean);
    expect(profileButton).toBeTruthy();
    fireEvent.click(profileButton!);
    expect(screen.getByRole("button", { name: /sign out session/i })).toBeInTheDocument();
  });
});
