import { render, screen, fireEvent } from "@testing-library/react";
import { JobPostedSuccessModal } from "./job-posted-success-modal";

describe("JobPostedSuccessModal", () => {
  const mockOnClose = jest.fn();
  const mockOnViewJob = jest.fn();

  it("renders success message", () => {
    render(<JobPostedSuccessModal isOpen onClose={mockOnClose} onViewJob={mockOnViewJob} jobId="job-123" />);
    expect(screen.getByText(/job posted successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/your job has been posted/i)).toBeInTheDocument();
  });

  it("displays job ID", () => {
    render(<JobPostedSuccessModal isOpen onClose={mockOnClose} onViewJob={mockOnViewJob} jobId="job-123" />);
    expect(screen.getByText(/job-123/i)).toBeInTheDocument();
  });

  it("renders view job button", () => {
    render(<JobPostedSuccessModal isOpen onClose={mockOnClose} onViewJob={mockOnViewJob} jobId="job-123" />);
    expect(screen.getByRole("button", { name: /view job/i })).toBeInTheDocument();
  });

  it("renders close button", () => {
    render(<JobPostedSuccessModal isOpen onClose={mockOnClose} onViewJob={mockOnViewJob} jobId="job-123" />);
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("calls onViewJob when view job clicked", () => {
    render(<JobPostedSuccessModal isOpen onClose={mockOnClose} onViewJob={mockOnViewJob} jobId="job-123" />);
    const viewButton = screen.getByRole("button", { name: /view job/i });
    fireEvent.click(viewButton);
    expect(mockOnViewJob).toHaveBeenCalledWith("job-123");
  });

  it("calls onClose when close clicked", () => {
    render(<JobPostedSuccessModal isOpen onClose={mockOnClose} onViewJob={mockOnViewJob} jobId="job-123" />);
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("does not render when not open", () => {
    render(<JobPostedSuccessModal isOpen={false} onClose={mockOnClose} onViewJob={mockOnViewJob} jobId="job-123" />);
    expect(screen.queryByText(/job posted successfully/i)).not.toBeInTheDocument();
  });
});