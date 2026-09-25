import { render, screen, fireEvent } from "@testing-library/react";
import { SubmitTicketModal } from "./submit-ticket-modal";

const mockOnSubmit = jest.fn();
const mockOnClose = jest.fn();

describe("SubmitTicketModal", () => {
  it("renders modal when open", () => {
    render(<SubmitTicketModal isOpen onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    expect(screen.getByText(/submit support ticket/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<SubmitTicketModal isOpen={false} onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    expect(screen.queryByText(/submit support ticket/i)).not.toBeInTheDocument();
  });

  it("renders form fields", () => {
    render(<SubmitTicketModal isOpen onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("calls onSubmit when submitted", async () => {
    render(<SubmitTicketModal isOpen onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    const subject = screen.getByLabelText(/subject/i);
    fireEvent.change(subject, { target: { value: "Test Issue" } });
    const category = screen.getByLabelText(/category/i);
    fireEvent.change(category, { target: { value: "payment" } });
    const description = screen.getByLabelText(/description/i);
    fireEvent.change(description, { target: { value: "This is a test issue" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        subject: "Test Issue",
        category: "payment",
        description: "This is a test issue",
      });
    });
  });

  it("calls onClose when closed", () => {
    render(<SubmitTicketModal isOpen onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });
});