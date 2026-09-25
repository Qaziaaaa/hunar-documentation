import { render, screen } from "@testing-library/react";
import { AuthShell } from "./auth-shell";

jest.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/components/shared/orderworker-logo", () => ({
  OrderworkerLogo: () => <div data-testid="logo">Logo</div>,
}));

describe("AuthShell", () => {
  it("renders children content", () => {
    render(<AuthShell><div data-testid="content">Test Content</div></AuthShell>);
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders AuthTopBar by default", () => {
    render(<AuthShell><div>Content</div></AuthShell>);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders AuthTrustFooter by default", () => {
    render(<AuthShell><div>Content</div></AuthShell>);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("hides help when hideHelp is true", () => {
    render(<AuthShell hideHelp><div>Content</div></AuthShell>);
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("applies admin desktop layout when adminDesktopLayout is true", () => {
    render(<AuthShell adminDesktopLayout><div>Content</div></AuthShell>);
    const main = screen.getByRole("main");
    expect(main).toHaveClass("lg:grid");
    expect(main).toHaveClass("lg:grid-cols-12");
  });
});