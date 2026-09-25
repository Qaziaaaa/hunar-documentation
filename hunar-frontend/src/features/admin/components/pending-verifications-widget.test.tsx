import { render, screen } from "@testing-library/react";
import { PendingVerificationsWidget } from "./pending-verifications-widget";
import type { VerificationRequest } from "@/types/admin";

const mockRequests: VerificationRequest[] = [
  {
    id: "ver-1",
    workerId: "worker-1",
    workerName: "Ahmed Khan",
    workerPhone: "03001234567",
    skills: ["Plumbing", "Electrical"],
    experienceYears: 5,
    serviceCity: "Karachi",
    cnicNumber: "4210112345671",
    cnicFrontUrl: "/cnic-front.jpg",
    cnicBackUrl: "/cnic-back.jpg",
    submittedAt: "2024-01-15T10:00:00Z",
    status: "PENDING",
  },
  {
    id: "ver-2",
    workerId: "worker-2",
    workerName: "Ali Raza",
    workerPhone: "03111234567",
    skills: ["AC Repair"],
    experienceYears: 3,
    serviceCity: "Lahore",
    cnicNumber: "3520112345671",
    cnicFrontUrl: "/cnic-front2.jpg",
    cnicBackUrl: "/cnic-back2.jpg",
    submittedAt: "2024-01-16T10:00:00Z",
    status: "PENDING",
  },
];

describe("PendingVerificationsWidget", () => {
  it("renders widget header with title and count", () => {
    render(<PendingVerificationsWidget requests={mockRequests} />);
    expect(screen.getByText(/pending worker verifications/i)).toBeInTheDocument();
    expect(screen.getByText(/review identity documents/i)).toBeInTheDocument();
    expect(screen.getByText(/view all (2)/i)).toBeInTheDocument();
  });

  it("renders each verification request", () => {
    render(<PendingVerificationsWidget requests={mockRequests} />);
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText("Ali Raza")).toBeInTheDocument();
  });

  it("displays worker initial avatar", () => {
    render(<PendingVerificationsWidget requests={mockRequests} />);
    expect(screen.getByText("A")).toBeInTheDocument(); // Ahmed Khan
  });

  it("displays skills, city, and experience", () => {
    render(<PendingVerificationsWidget requests={mockRequests} />);
    expect(screen.getByText("Plumbing, Electrical")).toBeInTheDocument();
    expect(screen.getByText("Karachi")).toBeInTheDocument();
    expect(screen.getByText("5 yrs exp")).toBeInTheDocument();
  });

  it("renders review CNIC link", () => {
    render(<PendingVerificationsWidget requests={mockRequests} />);
    expect(screen.getByRole("link", { name: /review cnic/i })).toHaveAttribute("href", "/admin/verifications/ver-1");
  });

  it("renders quick approve and reject buttons", () => {
    render(<PendingVerificationsWidget requests={mockRequests} />);
    expect(screen.getByTitle("Quick Approve")).toBeInTheDocument();
    expect(screen.getByTitle("Quick Reject")).toBeInTheDocument();
  });

  it("shows empty state when no requests", () => {
    render(<PendingVerificationsWidget requests={[]} />);
    expect(screen.getByText(/view all (0)/i)).toBeInTheDocument();
  });

  it("has correct styling classes", () => {
    render(<PendingVerificationsWidget requests={mockRequests} />);
    const container = screen.getByText(/pending worker verifications/i).closest("div");
    expect(container).toHaveClass("rounded-2xl");
    expect(container).toHaveClass("border-slate-200");
    expect(container).toHaveClass("bg-white");
  });
});