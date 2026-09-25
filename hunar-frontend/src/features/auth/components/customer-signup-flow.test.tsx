import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerSignupFlow } from "./customer-signup-flow";

jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("CustomerSignupFlow", () => {
  it("renders phone step initially", () => {
    render(<CustomerSignupFlow />);
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });

  it("shows worker badge and sign in link", () => {
    render(<CustomerSignupFlow />);
    expect(screen.getByText(/customer portal/i)).toBeInTheDocument();
  });

  it("progresses to OTP step after valid phone submission", async () => {
    render(<CustomerSignupFlow />);
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: "03001234567" } });
    const submitButton = screen.getByRole("button", { name: /get otp/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getAllByRole("textbox")).toHaveLength(6);
    });
  });

  it("shows validation error for invalid phone", async () => {
    render(<CustomerSignupFlow />);
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: "123" } });
    const submitButton = screen.getByRole("button", { name: /get otp/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/enter a valid pakistani mobile number/i)).toBeInTheDocument();
    });
  });
});