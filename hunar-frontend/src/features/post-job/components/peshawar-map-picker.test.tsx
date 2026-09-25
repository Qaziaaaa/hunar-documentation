import { render, screen, fireEvent } from "@testing-library/react";
import { PeshawarMapPicker } from "./peshawar-map-picker";

describe("PeshawarMapPicker", () => {
  const mockOnSelect = jest.fn();
  const mockData = {
    latitude: 34.0043,
    longitude: 71.5034,
    area: "University Town, Peshawar",
    landmark: "Near Islamia College Gate",
  };

  it("renders map container", () => {
    render(<PeshawarMapPicker data={mockData} onChange={mockOnSelect} />);
    expect(screen.getByText(/select location on map/i)).toBeInTheDocument();
  });

  it("shows current coordinates when selected", () => {
    render(<PeshawarMapPicker data={mockData} onChange={mockOnSelect} />);
    expect(screen.getByText(/34.0043/i)).toBeInTheDocument();
    expect(screen.getByText(/71.5034/i)).toBeInTheDocument();
  });

  it("calls onSelect when map clicked", () => {
    render(<PeshawarMapPicker data={mockData} onChange={mockOnSelect} />);
    const mapContainer = screen.getByText(/select location on map/i).closest("div");
    fireEvent.click(mapContainer);
    expect(mockOnSelect).toHaveBeenCalled();
  });

  it("shows clear button when location selected", () => {
    render(<PeshawarMapPicker data={mockData} onChange={mockOnSelect} />);
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });
});