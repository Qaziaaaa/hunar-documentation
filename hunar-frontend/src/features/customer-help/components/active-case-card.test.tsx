import { render, screen } from "@testing-library/react";
import { ActiveCaseCard } from "./active-case-card";

const mockCase = {
  id: "case-1",
  title: "Payment Issue",
  status: "IN_PROGRESS",
  createdAt: "2024-01-15T10:00:00Z",
  lastUpdate: "2024-01-16T10:00:00Z",
};

describe("ActiveCaseCard", () => {
  it("renders case info", () => {
    render(<ActiveCaseCard caseData={mockCase} />);
    expect(screen.getByText("Payment Issue")).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/jan 15/i)).toBeInTheDocument();
    expect(screen.getByText(/jan 16/i)).toBeInTheDocument();
  });

  it("renders view details button", () => {
    render(<ActiveCaseCard caseData={mockCase} />);
    expect(screen.getByRole("button", { name: /view details/i })).toBeInTheDocument();
  });
});