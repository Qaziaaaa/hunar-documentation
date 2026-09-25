import { render, screen, fireEvent } from "@testing-library/react";
import { AdminShell } from "./admin-shell";

jest.mock("@/i18n/navigation", () => ({
  usePathname: () => "/admin/dashboard",
  useRouter: () => ({ push: jest.fn() }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/components/shared/orderworker-logo", () => ({
  OrderworkerLogo: () => <div data-testid="logo">Logo</div>,
}));

describe("AdminShell", () => {
  it("renders sidebar with navigation groups", () => {
    render(<AdminShell><div>Content</div></AdminShell>);
    expect(screen.getByText(/main/i)).toBeInTheDocument();
    expect(screen.getByText(/operations/i)).toBeInTheDocument();
    expect(screen.getByText(/governance/i)).toBeInTheDocument();
  });

  it("renders dashboard link in Main group", () => {
    render(<AdminShell><div>Content</div></AdminShell>);
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/live/i)).toBeInTheDocument();
  });

  it("renders Operations links", () => {
    render(<AdminShell><div>Content</div></AdminShell>);
    expect(screen.getByRole("link", { name: /customers/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /workers/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /verifications/i })).toBeInTheDocument();
    expect(screen.getByText(/3 pending/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /jobs & work orders/i })).toBeInTheDocument();
  });

  it("renders Governance links", () => {
    render(<AdminShell><div>Content</div></AdminShell>);
    expect(screen.getByRole("link", { name: /payments & escrow/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /disputes & support/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /categories/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings & rules/i })).toBeInTheDocument();
  });

  it("renders header with search, notifications, and profile", () => {
    render(<AdminShell><div>Content</div></AdminShell>);
    expect(screen.getByPlaceholderText(/search jobs, workers, users/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByText(/system admin/i)).toBeInTheDocument();
  });

  it("highlights active navigation item", () => {
    jest.unstable_mockModule("@/i18n/navigation", () => ({
      usePathname: () => "/admin/users/customers",
      useRouter: () => ({ push: jest.fn() }),
      Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
      ),
    }));
    render(<AdminShell><div>Content</div></AdminShell>);
    const customersLink = screen.getByRole("link", { name: /customers/i });
    expect(customersLink).toHaveClass("bg-navy");
    expect(customersLink).toHaveClass("text-white");
  });

  it("renders verified session footer", () => {
    render(<AdminShell><div>Content</div></AdminShell>);
    expect(screen.getByText(/verified session/i)).toBeInTheDocument();
    expect(screen.getByText(/audit logs active/i)).toBeInTheDocument();
  });

  it("toggles mobile drawer", () => {
    render(<AdminShell><div>Content</div></AdminShell>);
    const menuButton = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(menuButton);
    expect(screen.getByTestId("mobile-drawer")).toBeInTheDocument();
  });

  it("renders live operational pulse", () => {
    render(<AdminShell><div>Content</div></AdminShell>);
    expect(screen.getByText(/all systems operational/i)).toBeInTheDocument();
  });

  it("shows profile dropdown with sign out", () => {
    render(<AdminShell><div>Content</div></AdminShell>);
    const profileButton = screen.getByText(/system admin/i).closest("button");
    fireEvent.click(profileButton);
    expect(screen.getByRole("button", { name: /sign out session/i })).toBeInTheDocument();
  });
});