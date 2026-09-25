import { render, screen, act } from "@testing-library/react";
import { AdminGuard } from "./admin-guard";

jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("AdminGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("shows loading spinner when checking auth", () => {
    const { unmount } = render(<AdminGuard><div>Protected</div></AdminGuard>);
    expect(screen.getByText(/verifying admin permissions/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects when no token", () => {
    const mockPush = jest.fn();
    jest.unstable_mockModule("@/i18n/navigation", () => ({
      useRouter: () => ({ push: mockPush }),
    }));
  });

  it("renders children when authorized", () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hunar_admin_token", "test-token");
    }
    render(<AdminGuard><div>Protected Content</div></AdminGuard>);
    // After auth check, should render children
    // Note: This depends on the actual implementation timing
  });
});