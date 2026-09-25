import { render, screen, fireEvent } from "@testing-library/react";
import { WorkerProfileModal } from "./worker-profile-modal";

const mockWorker = {
  id: "worker-1",
  name: "Ahmed Khan",
  avatar: "/avatar.jpg",
  phone: "03001234567",
  email: "ahmed@example.com",
  rating: 4.5,
  reviewCount: 25,
  verified: true,
  skills: ["Plumbing", "Electrical", "AC Repair"],
  experienceYears: 5,
  bio: "Experienced technician with 5 years in home repair",
  serviceCity: "Karachi",
  serviceAreas: ["DHA", "Clifton", "Gulshan"],
  completedJobs: 150,
  joinDate: "2022-01-15",
};

describe("WorkerProfileModal", () => {
  const mockOnClose = jest.fn();

  it("renders modal when open", () => {
    render(<WorkerProfileModal isOpen worker={mockWorker} onClose={mockOnClose} />);
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<WorkerProfileModal isOpen={false} worker={mockWorker} onClose={mockOnClose} />);
    expect(screen.queryByText("Ahmed Khan")).not.toBeInTheDocument();
  });

  it("displays worker details", () => {
    render(<WorkerProfileModal isOpen worker={mockWorker} onClose={mockOnClose} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(25 reviews)")).toBeInTheDocument();
    expect(screen.getByText("5 years experience")).toBeInTheDocument();
    expect(screen.getByText("Karachi")).toBeInTheDocument();
  });

  it("displays skills", () => {
    render(<WorkerProfileModal isOpen worker={mockWorker} onClose={mockOnClose} />);
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
    expect(screen.getByText("Electrical")).toBeInTheDocument();
    expect(screen.getByText("AC Repair")).toBeInTheDocument();
  });

  it("displays bio", () => {
    render(<WorkerProfileModal isOpen worker={mockWorker} onClose={mockOnClose} />);
    expect(screen.getByText("Experienced technician with 5 years in home repair")).toBeInTheDocument();
  });

  it("displays service areas", () => {
    render(<WorkerProfileModal isOpen worker={mockWorker} onClose={mockOnClose} />);
    expect(screen.getByText("DHA")).toBeInTheDocument();
    expect(screen.getByText("Clifton")).toBeInTheDocument();
    expect(screen.getByText("Gulshan")).toBeInTheDocument();
  });

  it("displays stats", () => {
    render(<WorkerProfileModal isOpen worker={mockWorker} onClose={mockOnClose} />);
    expect(screen.getByText("150")).toBeInTheDocument(); // completed jobs
    expect(screen.getByText("2022")).toBeInTheDocument(); // join year
  });

  it("calls onClose when close clicked", () => {
    render(<WorkerProfileModal isOpen worker={mockWorker} onClose={mockOnClose} />);
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});