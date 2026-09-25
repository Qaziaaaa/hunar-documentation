import { render, screen } from "@testing-library/react";
import { CustomerSidebar } from "./customer-sidebar";

describe("CustomerSidebar", () => {
  it("renders navigation links", () => {
    render(<CustomerSidebar />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my jobs/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /visits/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /offers/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /help/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
  });

  it("highlights active link", () => {
    render(<CustomerSidebar activePath="/customer/jobs" />);
    const jobsLink = screen.getByRole("link", { name: /my jobs/i });
    expect(jobsLink).toHaveClass("bg-teal");
    expect(jobsLink).toHaveClass("text-white");
  });

  it("renders logo", () => {
    render(<CustomerSidebar />);
    expect(screen.getByText(/hunar/i)).toBeInTheDocument();
  });
});