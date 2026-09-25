import { render, screen } from "@testing-library/react";
import { CustomerHelpView } from "./customer-help-view";

describe("CustomerHelpView", () => {
  it("renders help view title", () => {
    render(<CustomerHelpView />);
    expect(screen.getByText(/help & support/i)).toBeInTheDocument();
  });

  it("renders FAQ section", () => {
    render(<CustomerHelpView />);
    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
  });

  it("renders helpline card", () => {
    render(<CustomerHelpView />);
    expect(screen.getByText(/helpline/i)).toBeInTheDocument();
  });

  it("renders active cases section", () => {
    render(<CustomerHelpView />);
    expect(screen.getByText(/active cases/i)).toBeInTheDocument();
  });

  it("renders submit ticket button", () => {
    render(<CustomerHelpView />);
    expect(screen.getByRole("button", { name: /submit ticket/i })).toBeInTheDocument();
  });
});