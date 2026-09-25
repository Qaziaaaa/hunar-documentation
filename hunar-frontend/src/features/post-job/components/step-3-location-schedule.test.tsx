import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Step3LocationSchedule } from "./step-3-location-schedule";

describe("Step3LocationSchedule", () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();

  it("renders address and map picker", () => {
    render(<Step3LocationSchedule onNext={mockOnNext} onBack={mockOnBack} />);
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByText(/select on map/i)).toBeInTheDocument();
  });

  it("renders preferred date and time", () => {
    render(<Step3LocationSchedule onNext={mockOnNext} onBack={mockOnBack} />);
    expect(screen.getByLabelText(/preferred date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred time/i)).toBeInTheDocument();
  });

  it("validates required address", async () => {
    render(<Step3LocationSchedule onNext={mockOnNext} onBack={mockOnBack} />);
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(screen.getByText(/address is required/i)).toBeInTheDocument();
    });
  });

  it("calls onNext with valid data", async () => {
    render(<Step3LocationSchedule onNext={mockOnNext} onBack={mockOnBack} />);
    const addressInput = screen.getByLabelText(/address/i);
    fireEvent.change(addressInput, { target: { value: "123 Main Street, Karachi" } });
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith(expect.objectContaining({
        address: "123 Main Street, Karachi",
      }));
    });
  });
});