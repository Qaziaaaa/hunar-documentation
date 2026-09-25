import { render, screen } from "@testing-library/react";
import { CustomerBottomNav } from "./customer-bottom-nav";

describe("CustomerBottomNav", () => {
  it("renders navigation items", () => {
    render(<CustomerBottomNav activeIndex={0} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /jobs/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /visits/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /profile/i })).toBeInTheDocument();
  });

  it("highlights active item", () => {
    render(<CustomerBottomNav activeIndex={1} onChange={jest.fn()} />);
    const jobsButton = screen.getByRole("button", { name: /jobs/i });
    expect(jobsButton).toHaveClass("text-teal");
  });

  it("calls onChange when item clicked", () => {
    const mockOnChange = jest.fn();
    render(<CustomerBottomNav activeIndex={0} onChange={mockOnChange} />);
    fireEvent.click(screen.getByRole("button", { name: /visits/i }));
    expect(mockOnChange).toHaveBeenCalledWith(2);
  });
});