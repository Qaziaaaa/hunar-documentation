import { render, screen } from "@testing-library/react";
import { EscrowBanner } from "./escrow-banner";

describe("EscrowBanner", () => {
  it("renders escrow info", () => {
    render(<EscrowBanner amount={5000} />);
    expect(screen.getByText(/escrow protection/i)).toBeInTheDocument();
    expect(screen.getByText("Rs. 5,000")).toBeInTheDocument();
    expect(screen.getByText(/held securely until job completion/i)).toBeInTheDocument();
  });

  it("shows release button when job completed", () => {
    render(<EscrowBanner amount={5000} isCompleted />);
    expect(screen.getByRole("button", { name: /release payment/i })).toBeInTheDocument();
  });
});