import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Step2JobDetails } from "./step-2-job-details";

describe("Step2JobDetails", () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();

  it("renders title and description fields", () => {
    render(<Step2JobDetails onNext={mockOnNext} onBack={mockOnBack} service="plumbing" />);
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/describe the problem/i)).toBeInTheDocument();
  });

  it("shows validation error for empty title", async () => {
    render(<Step2JobDetails onNext={mockOnNext} onBack={mockOnBack} service="plumbing" />);
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for short description", async () => {
    render(<Step2JobDetails onNext={mockOnNext} onBack={mockOnBack} service="plumbing" />);
    const titleInput = screen.getByLabelText(/job title/i);
    fireEvent.change(titleInput, { target: { value: "Leaking pipe" } });
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(screen.getByText(/description must be at least 20 characters/i)).toBeInTheDocument();
    });
  });

  it("calls onNext with valid data", async () => {
    render(<Step2JobDetails onNext={mockOnNext} onBack={mockOnBack} service="plumbing" />);
    const titleInput = screen.getByLabelText(/job title/i);
    fireEvent.change(titleInput, { target: { value: "Leaking pipe in kitchen" } });
    const descInput = screen.getByLabelText(/describe the problem/i);
    fireEvent.change(descInput, { target: { value: "There is a leaking pipe under the kitchen sink that needs immediate repair" } });
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith({
        title: "Leaking pipe in kitchen",
        description: "There is a leaking pipe under the kitchen sink that needs immediate repair",
      });
    });
  });

  it("displays service name", () => {
    render(<Step2JobDetails onNext={mockOnNext} onBack={mockOnBack} service="plumbing" />);
    expect(screen.getByText(/plumbing/i)).toBeInTheDocument();
  });
});