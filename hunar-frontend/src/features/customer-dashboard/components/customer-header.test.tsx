import { render, screen } from "@testing-library/react";
import { CustomerHeader } from "./customer-header";

describe("CustomerHeader", () => {
  it("renders header with logo", () => {
    render(<CustomerHeader />);
    expect(screen.getByText(/hunar/i)).toBeInTheDocument();
  });

  it("renders notification bell", () => {
    render(<CustomerHeader />);
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
  });

  it("renders user menu", () => {
    render(<CustomerHeader userName="John" />);
    expect(screen.getByText(/john/i)).toBeInTheDocument();
  });

  it("shows unread notification badge", () => {
    render(<CustomerHeader unreadCount={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});