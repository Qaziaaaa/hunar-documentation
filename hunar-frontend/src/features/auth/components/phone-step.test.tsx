import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PhoneStep } from "./phone-step";
import { PhoneFormValues } from "../schemas/signup";

const mockOnSubmit = jest.fn();
const defaultProps = {
  onSubmit: mockOnSubmit,
  submitting: false,
  submitError: null,
};

describe("PhoneStep", () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("renders phone input field with label", () => {
    render(<PhoneStep {...defaultProps} />);
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });

  it("shows validation error for empty phone", async () => {
    render(<PhoneStep {...defaultProps} />);
    const submitButton = screen.getByRole("button", { name: /get otp/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/enter a valid pakistani mobile number/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid phone format", async () => {
    render(<PhoneStep {...defaultProps} />);
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: "123" } });
    const submitButton = screen.getByRole("button", { name: /get otp/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/enter a valid pakistani mobile number/i)).toBeInTheDocument();
    });
  });

  it("accepts valid Pakistani phone number", async () => {
    render(<PhoneStep {...defaultProps} />);
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: "03001234567" } });
    const submitButton = screen.getByRole("button", { name: /get otp/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({ phone: "03001234567" });
    });
  });

  it("accepts phone with country code +92", async () => {
    render(<PhoneStep {...defaultProps} />);
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: "+923001234567" } });
    const submitButton = screen.getByRole("button", { name: /get otp/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({ phone: "+923001234567" });
    });
  });

  it("disables submit button when submitting", () => {
    render(<PhoneStep {...defaultProps} submitting />);
    const submitButton = screen.getByRole("button", { name: /get otp/i });
    expect(submitButton).toBeDisabled();
  });

  it("shows loading spinner when submitting", () => {
    render(<PhoneStep {...defaultProps} submitting />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows submit error when provided", () => {
    render(<PhoneStep {...defaultProps} submitError="Invalid phone number" />);
    expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
  });

  it("shows OTP rules section", () => {
    render(<PhoneStep {...defaultProps} />);
    expect(screen.getByText(/otp rules/i)).toBeInTheDocument();
  });

  it("shows worker badge and sign in link", () => {
    render(<PhoneStep {...defaultProps} />);
    expect(screen.getByText(/worker badge/i)).toBeInTheDocument();
  });
});