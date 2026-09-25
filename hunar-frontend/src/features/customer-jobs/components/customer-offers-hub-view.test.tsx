import { render, screen } from "@testing-library/react";
import { CustomerOffersHubView } from "./customer-offers-hub-view";

const mockOffers = [
  {
    id: "offer-1",
    jobId: "job-1",
    jobTitle: "AC Repair",
    workerName: "Ahmed Khan",
    visitCharge: 500,
    status: "PENDING",
    createdAt: "2024-01-15T11:00:00Z",
  },
  {
    id: "offer-2",
    jobId: "job-2",
    jobTitle: "Plumbing Fix",
    workerName: "Ali Raza",
    visitCharge: 600,
    status: "ACCEPTED",
    createdAt: "2024-01-14T11:00:00Z",
  },
];

describe("CustomerOffersHubView", () => {
  it("renders offers hub title", () => {
    render(<CustomerOffersHubView offers={mockOffers} />);
    expect(screen.getByText(/offers received/i)).toBeInTheDocument();
  });

  it("renders pending offers", () => {
    render(<CustomerOffersHubView offers={mockOffers} />);
    expect(screen.getByText("AC Repair")).toBeInTheDocument();
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
    expect(screen.getByText("Rs. 500")).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it("renders accepted offers", () => {
    render(<CustomerOffersHubView offers={mockOffers} />);
    expect(screen.getByText("Plumbing Fix")).toBeInTheDocument();
    expect(screen.getByText("Ali Raza")).toBeInTheDocument();
    expect(screen.getByText("Rs. 600")).toBeInTheDocument();
    expect(screen.getByText(/accepted/i)).toBeInTheDocument();
  });

  it("shows empty state when no offers", () => {
    render(<CustomerOffersHubView offers={[]} />);
    expect(screen.getByText(/no offers received/i)).toBeInTheDocument();
  });
});