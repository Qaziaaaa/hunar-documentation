import { render, screen, fireEvent } from "@testing-library/react";
import { CustomerHeroCTA } from "./customer-hero-cta";

const mockOnPostJob = jest.fn();

describe("CustomerHeroCTA", () => {
  it("renders hero CTA", () => {
    render(<CustomerHeroCTA onPostJob={mockOnPostJob} />);
    expect(screen.getByText(/post a job/i)).toBeInTheDocument();
    expect(screen.getByText(/describe your repair need/i)).toBeInTheDocument();
  });

  it("calls onPostJob when button clicked", () => {
    render(<CustomerHeroCTA onPostJob={mockOnPostJob} />);
    fireEvent.click(screen.getByRole("button", { name: /post a job/i }));
    expect(mockOnPostJob).toHaveBeenCalled();
  });
});