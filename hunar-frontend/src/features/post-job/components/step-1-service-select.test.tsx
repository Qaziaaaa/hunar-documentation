import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Step1ServiceSelect } from "./step-1-service-select";

describe("Step1ServiceSelect", () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();

  it("renders service categories", () => {
    render(<Step1ServiceSelect onNext={mockOnNext} onBack={mockOnBack} />);
    expect(screen.getByText(/select a service category/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /plumbing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /electrical/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ac repair/i })).toBeInTheDocument();
  });

  it("calls onNext when service selected", () => {
    render(<Step1ServiceSelect onNext={mockOnNext} onBack={mockOnBack} />);
    const plumbingButton = screen.getByRole("button", { name: /plumbing/i });
    fireEvent.click(plumbingButton);
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);
    expect(mockOnNext).toHaveBeenCalledWith("plumbing");
  });

  it("shows selected state", () => {
    render(<Step1ServiceSelect onNext={mockOnNext} onBack={mockOnBack} selectedService="plumbing" />);
    const plumbingButton = screen.getByRole("button", { name: /plumbing/i });
    expect(plumbingButton).toHaveClass("border-teal");
    expect(plumbingButton).toHaveClass("bg-teal/10");
  });

  it("calls onBack when back button clicked", () => {
    render(<Step1ServiceSelect onNext={mockOnNext} onBack={mockOnBack} />);
    const backButton = screen.getByRole("button", { name: /back/i });
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });
});