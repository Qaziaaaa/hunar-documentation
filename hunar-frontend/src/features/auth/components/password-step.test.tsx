import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PasswordStep } from "./password-step";
import { PasswordFormValues } from "../schemas/signup";

const mockOnSubmit = jest.fn();
const defaultProps = {
  onSubmit: mockOnSubmit,
  submitting: false,
  submitError: null,
};

describe("PasswordStep", () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("renders password and confirm password fields", () => {
    render(<PasswordStep {...defaultProps} />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("shows validation error for short password", async () => {
    render(<PasswordStep {...defaultProps} />);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "123" } });
    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmInput, { target: { value: "123" } });
    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for password without letter", async () => {
    render(<PasswordStep {...defaultProps} />);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "12345678" } });
    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmInput, { target: { value: "12345678" } });
    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/include at least one letter/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for password without number", async () => {
    render(<PasswordStep {...defaultProps} />);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "abcdefgh" } });
    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmInput, { target: { value: "abcdefgh" } });
    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/include at least one number/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for mismatched passwords", async () => {
    render(<PasswordStep {...defaultProps} />);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmInput, { target: { value: "password456" } });
    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("accepts valid password with letter and number", async () => {
    render(<PasswordStep {...defaultProps} />);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmInput, { target: { value: "password123" } });
    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        password: "password123",
        confirmPassword: "password123",
      });
    });
  });

  it("toggles password visibility", () => {
    render(<PasswordStep {...defaultProps} />);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");
    const toggleButton = screen.getByLabelText(/show password/i);
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument();
  });

  it("toggles confirm password visibility", () => {
    render(<PasswordStep {...defaultProps} />);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    expect(confirmInput).toHaveAttribute("type", "password");
    const toggleButton = screen.getAllByLabelText(/show password/i)[1];
    fireEvent.click(toggleButton);
    expect(confirmInput).toHaveAttribute("type", "text");
  });

  it("shows password strength rules", () => {
    render(<PasswordStep {...defaultProps} />);
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one letter/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one number/i)).toBeInTheDocument();
  });

  it("shows rule as met when password meets criteria", async () => {
    render(<PasswordStep {...defaultProps} />);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toHaveClass("text-success");
      expect(screen.getByText(/at least one letter/i)).toHaveClass("text-success");
      expect(screen.getByText(/at least one number/i)).toHaveClass("text-success");
    });
  });

  it("disables submit button when submitting", () => {
    render(<PasswordStep {...defaultProps} submitting />);
    const submitButton = screen.getByRole("button", { name: /create account/i });
    expect(submitButton).toBeDisabled();
  });

  it("shows loading spinner when submitting", () => {
    render(<PasswordStep {...defaultProps} submitting />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows submit error when provided", () => {
    render(<PasswordStep {...defaultProps} submitError="Password too weak" />);
    expect(screen.getByText(/password too weak/i)).toBeInTheDocument();
  });
});