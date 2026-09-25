import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OtpStep } from "./otp-step";

const mockOnSubmit = jest.fn();
const mockOnBack = jest.fn();
const defaultProps = {
  onSubmit: mockOnSubmit,
  onBack: mockOnBack,
  submitting: false,
  submitError: null,
};

describe("OtpStep", () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnBack.mockClear();
  });

  it("renders OTP input component", () => {
    render(<OtpStep {...defaultProps} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("shows title and subtitle", () => {
    render(<OtpStep {...defaultProps} />);
    expect(screen.getByText(/verify your phone/i)).toBeInTheDocument();
    expect(screen.getByText(/enter the 6-digit code/i)).toBeInTheDocument();
  });

  it("shows back button and calls onBack", () => {
    render(<OtpStep {...defaultProps} />);
    const backButton = screen.getByRole("button", { name: /go back/i });
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it("calls onSubmit when OTP is complete", async () => {
    render(<OtpStep {...defaultProps} />);
    const firstInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(firstInput, { target: { value: "123456" } });
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({ code: "123456" });
    });
  });

  it("shows submit error when provided", () => {
    render(<OtpStep {...defaultProps} submitError="Invalid code" />);
    expect(screen.getByText(/invalid code/i)).toBeInTheDocument();
  });

  it("disables when submitting", () => {
    render(<OtpStep {...defaultProps} submitting />);
    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => expect(input).toBeDisabled());
  });

  it("shows resend timer", () => {
    render(<OtpStep {...defaultProps} resendSeconds={30} />);
    expect(screen.getByText(/resend code in 30s/i)).toBeInTheDocument();
  });
});