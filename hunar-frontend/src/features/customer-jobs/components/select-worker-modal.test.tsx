import { render, screen, fireEvent } from "@testing-library/react";
import { SelectWorkerModal } from "./select-worker-modal";

const mockOffers = [
  {
    id: "offer-1",
    workerId: "worker-1",
    workerName: "Ahmed Khan",
    workerRating: 4.5,
    workerVerified: true,
    visitCharge: 500,
    message: "I can fix this tomorrow",
  },
  {
    id: "offer-2",
    workerId: "worker-2",
    workerName: "Ali Raza",
    workerRating: 4.8,
    workerVerified: true,
    visitCharge: 600,
    message: "Available today",
  },
];

describe("SelectWorkerModal", () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();

  it("renders modal when open", () => {
    render(<SelectWorkerModal isOpen offers={mockOffers} onSelect={mockOnSelect} onClose={mockOnClose} />);
    expect(screen.getByText(/select a worker/i)).toBeInTheDocument();
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText("Ali Raza")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<SelectWorkerModal isOpen={false} offers={mockOffers} onSelect={mockOnSelect} onClose={mockOnClose} />);
    expect(screen.queryByText(/select a worker/i)).not.toBeInTheDocument();
  });

  it("displays worker offers with details", () => {
    render(<SelectWorkerModal isOpen offers={mockOffers} onSelect={mockOnSelect} onClose={mockOnClose} />);
    expect(screen.getByText("Rs. 500")).toBeInTheDocument();
    expect(screen.getByText("Rs. 600")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
  });

  it("calls onSelect when worker selected", () => {
    render(<SelectWorkerModal isOpen offers={mockOffers} onSelect={mockOnSelect} onClose={mockOnClose} />);
    const selectButton = screen.getByRole("button", { name: /select ahmed khan/i });
    fireEvent.click(selectButton);
    expect(mockOnSelect).toHaveBeenCalledWith("offer-1");
  });

  it("calls onClose when close clicked", () => {
    render(<SelectWorkerModal isOpen offers={mockOffers} onSelect={mockOnSelect} onClose={mockOnClose} />);
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});