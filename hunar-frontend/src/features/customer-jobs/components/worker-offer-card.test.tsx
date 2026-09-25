import { render, screen, fireEvent } from "@testing-library/react";
import { WorkerOfferCard } from "./worker-offer-card";

const mockOffer = {
  id: "offer-1",
  workerId: "worker-1",
  workerName: "Ahmed Khan",
  workerAvatar: "/avatar.jpg",
  workerRating: 4.5,
  workerVerified: true,
  visitCharge: 500,
  message: "I can fix this tomorrow",
  status: "PENDING",
  createdAt: "2024-01-15T11:00:00Z",
};

describe("WorkerOfferCard", () => {
  const mockOnAccept = jest.fn();
  const mockOnCounter = jest.fn();
  const mockOnReject = jest.fn();
  const mockOnViewProfile = jest.fn();

  it("renders worker info", () => {
    render(<WorkerOfferCard offer={mockOffer} onAccept={mockOnAccept} onCounter={mockOnCounter} onReject={mockOnReject} onViewProfile={mockOnViewProfile} />);
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
  });

  it("renders visit charge", () => {
    render(<WorkerOfferCard offer={mockOffer} onAccept={mockOnAccept} onCounter={mockOnCounter} onReject={mockOnReject} onViewProfile={mockOnViewProfile} />);
    expect(screen.getByText("Rs. 500")).toBeInTheDocument();
  });

  it("renders worker message", () => {
    render(<WorkerOfferCard offer={mockOffer} onAccept={mockOnAccept} onCounter={mockOnCounter} onReject={mockOnReject} onViewProfile={mockOnViewProfile} />);
    expect(screen.getByText("I can fix this tomorrow")).toBeInTheDocument();
  });

  it("renders action buttons for pending offer", () => {
    render(<WorkerOfferCard offer={mockOffer} onAccept={mockOnAccept} onCounter={mockOnCounter} onReject={mockOnReject} onViewProfile={mockOnViewProfile} />);
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /counter/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("calls onAccept when accept clicked", () => {
    render(<WorkerOfferCard offer={mockOffer} onAccept={mockOnAccept} onCounter={mockOnCounter} onReject={mockOnReject} onViewProfile={mockOnViewProfile} />);
    fireEvent.click(screen.getByRole("button", { name: /accept/i }));
    expect(mockOnAccept).toHaveBeenCalledWith("offer-1");
  });

  it("calls onCounter when counter clicked", () => {
    render(<WorkerOfferCard offer={mockOffer} onAccept={mockOnAccept} onCounter={mockOnCounter} onReject={mockOnReject} onViewProfile={mockOnViewProfile} />);
    fireEvent.click(screen.getByRole("button", { name: /counter/i }));
    expect(mockOnCounter).toHaveBeenCalledWith("offer-1");
  });

  it("calls onReject when reject clicked", () => {
    render(<WorkerOfferCard offer={mockOffer} onAccept={mockOnAccept} onCounter={mockOnCounter} onReject={mockOnReject} onViewProfile={mockOnViewProfile} />);
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));
    expect(mockOnReject).toHaveBeenCalledWith("offer-1");
  });

  it("shows accepted state", () => {
    const acceptedOffer = { ...mockOffer, status: "ACCEPTED" };
    render(<WorkerOfferCard offer={acceptedOffer} onAccept={mockOnAccept} onCounter={mockOnCounter} onReject={mockOnReject} onViewProfile={mockOnViewProfile} />);
    expect(screen.getByText(/accepted/i)).toBeInTheDocument();
  });
});