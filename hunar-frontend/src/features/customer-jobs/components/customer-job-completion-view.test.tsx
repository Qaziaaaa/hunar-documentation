import { render, screen, fireEvent } from "@testing-library/react";
import { CustomerJobCompletionView } from "./customer-job-completion-view";

const mockJob = {
  id: "job-1",
  title: "AC Repair",
  workerName: "Ahmed Khan",
  amount: 5000,
  status: "COMPLETED",
};

describe("CustomerJobCompletionView", () => {
  const mockOnPay = jest.fn();
  const mockOnReview = jest.fn();

  it("renders completion view", () => {
    render(<CustomerJobCompletionView job={mockJob} onPay={mockOnPay} onReview={mockOnReview} />);
    expect(screen.getByText(/job completed/i)).toBeInTheDocument();
    expect(screen.getByText("AC Repair")).toBeInTheDocument();
    expect(screen.getByText("Ahmed Khan")).toBeInTheDocument();
  });

  it("displays payment amount", () => {
    render(<CustomerJobCompletionView job={mockJob} onPay={mockOnPay} onReview={mockOnReview} />);
    expect(screen.getByText("Rs. 5,000")).toBeInTheDocument();
  });

  it("renders payment button", () => {
    render(<CustomerJobCompletionView job={mockJob} onPay={mockOnPay} onReview={mockOnReview} />);
    expect(screen.getByRole("button", { name: /pay now/i })).toBeInTheDocument();
  });

  it("renders review button", () => {
    render(<CustomerJobCompletionView job={mockJob} onPay={mockOnPay} onReview={mockOnReview} />);
    expect(screen.getByRole("button", { name: /leave review/i })).toBeInTheDocument();
  });

  it("calls onPay when pay clicked", () => {
    render(<CustomerJobCompletionView job={mockJob} onPay={mockOnPay} onReview={mockOnReview} />);
    fireEvent.click(screen.getByRole("button", { name: /pay now/i }));
    expect(mockOnPay).toHaveBeenCalledWith("job-1");
  });

  it("calls onReview when review clicked", () => {
    render(<CustomerJobCompletionView job={mockJob} onPay={mockOnPay} onReview={mockOnReview} />);
    fireEvent.click(screen.getByRole("button", { name: /leave review/i }));
    expect(mockOnReview).toHaveBeenCalledWith("job-1");
  });
});