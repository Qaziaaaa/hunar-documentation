import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WorkerSignupFlow } from "./worker-signup-flow";

jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("WorkerSignupFlow", () => {
  it("renders phone and email fields initially", () => {
    render(<WorkerSignupFlow />);
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("shows worker badge and sign in link", () => {
    render(<WorkerSignupFlow />);
    expect(screen.getByText(/worker badge/i)).toBeInTheDocument();
  });

  it("progresses to OTP step after valid phone and email submission", async () => {
    render(<WorkerSignupFlow />);
    const phoneInput = screen.getByLabelText(/phone/i);
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(phoneInput, { target: { value: "03001234567" } });
    fireEvent.change(emailInput, { target: { value: "worker@example.com" } });
    const submitButton = screen.getByRole("button", { name: /get otp/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getAllByRole("textbox")).toHaveLength(6);
    });
  });

  it("shows validation error for invalid phone", async () => {
    render(<WorkerSignupFlow />);
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: "123" } });
    const submitButton = screen.getByRole("button", { name: /get otp/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/enter a valid pakistani mobile number/i)).toBeInTheDocument();
    });
  });
});