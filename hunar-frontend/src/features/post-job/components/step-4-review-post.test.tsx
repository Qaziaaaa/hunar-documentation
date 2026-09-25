import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Step4ReviewPost } from "./step-4-review-post";

describe("Step4ReviewPost", () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnSubmit = jest.fn();

  const mockJobData = {
    service: "plumbing",
    title: "Leaking pipe",
    description: "Kitchen sink leaking",
    address: "123 Main St",
    preferredDate: "2024-01-20",
    preferredTime: "10:00",
  };

  it("renders job summary", () => {
    render(<Step4ReviewPost jobData={mockJobData} onNext={mockOnNext} onBack={mockOnBack} onSubmit={mockOnSubmit} />);
    expect(screen.getByText(/review your job post/i)).toBeInTheDocument();
    expect(screen.getByText("Leaking pipe")).toBeInTheDocument();
    expect(screen.getByText("Kitchen sink leaking")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
  });

  it("shows post job button", () => {
    render(<Step4ReviewPost jobData={mockJobData} onNext={mockOnNext} onBack={mockOnBack} onSubmit={mockOnSubmit} />);
    expect(screen.getByRole("button", { name: /post job/i })).toBeInTheDocument();
  });

  it("calls onSubmit when post job clicked", async () => {
    render(<Step4ReviewPost jobData={mockJobData} onNext={mockOnNext} onBack={mockOnBack} onSubmit={mockOnSubmit} />);
    const submitButton = screen.getByRole("button", { name: /post job/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(mockJobData);
    });
  });

  it("calls onBack when back button clicked", () => {
    render(<Step4ReviewPost jobData={mockJobData} onNext={mockOnNext} onBack={mockOnBack} onSubmit={mockOnSubmit} />);
    const backButton = screen.getByRole("button", { name: /back/i });
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });
});