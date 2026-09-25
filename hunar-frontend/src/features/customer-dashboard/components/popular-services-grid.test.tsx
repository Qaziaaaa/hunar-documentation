import { render, screen } from "@testing-library/react";
import { PopularServicesGrid } from "./popular-services-grid";

const mockServices = [
  { id: "1", name: "Plumbing", icon: "wrench", avgRating: 4.5, priceRange: "Rs. 500-2000" },
  { id: "2", name: "Electrical", icon: "zap", avgRating: 4.8, priceRange: "Rs. 800-3000" },
];

describe("PopularServicesGrid", () => {
  it("renders popular services", () => {
    render(<PopularServicesGrid services={mockServices} />);
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
    expect(screen.getByText("Electrical")).toBeInTheDocument();
  });

  it("displays ratings", () => {
    render(<PopularServicesGrid services={mockServices} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
  });

  it("displays price ranges", () => {
    render(<PopularServicesGrid services={mockServices} />);
    expect(screen.getByText("Rs. 500-2000")).toBeInTheDocument();
    expect(screen.getByText("Rs. 800-3000")).toBeInTheDocument();
  });
});