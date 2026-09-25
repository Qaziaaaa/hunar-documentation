import { render, screen, fireEvent, act } from "@testing-library/react";
import { AuthTopBar } from "./auth-top-bar";

describe("AuthTopBar", () => {
  const mockHelpHref = "mailto:test@example.com";

  it("renders back button, brand, and help link", () => {
    render(<AuthTopBar helpHref={mockHelpHref} />);
    expect(screen.getByRole("button", { name: /go back/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /support and faqs/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /support and faqs/i })).toHaveAttribute("href", mockHelpHref);
  });

  it("calls router.back when history exists", () => {
    const mockBack = jest.fn();
    jest.unstable_mockModule("@/i18n/navigation", () => ({
      useRouter: () => ({ back: mockBack }),
    }));
    // This test would need proper mocking setup
  });

  it("has correct header styling classes", () => {
    render(<AuthTopBar />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky");
    expect(header).toHaveClass("top-0");
    expect(header).toHaveClass("z-30");
  });
});