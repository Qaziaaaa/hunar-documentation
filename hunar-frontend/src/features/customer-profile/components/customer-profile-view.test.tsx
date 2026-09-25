import { render, screen } from "@testing-library/react";
import { CustomerProfileView } from "./customer-profile-view";

describe("CustomerProfileView", () => {
  it("renders profile tabs", () => {
    render(<CustomerProfileView />);
    expect(screen.getByRole("tab", { name: /personal/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /addresses/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /security/i })).toBeInTheDocument();
  });

  it("shows personal tab by default", () => {
    render(<CustomerProfileView />);
    expect(screen.getByText(/personal information/i)).toBeInTheDocument();
  });
});