import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerSignInForm } from "./customer-sign-in-form";

jest.mock("@/lib/api-client", () => ({
  setTokens: jest.fn(),
}));
jest.mock("../api/auth-api", () => ({
  customerLogin: jest.fn().mockResolvedValue({
    accessToken: "token",
    refreshToken: "refresh",
    user: { id: "1", name: "Test" },
  }),
}));
jest.mock("../lib/error", () => ({
  getErrorMessage: (error: Error) => error.message,
}));

describe("CustomerSignInForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders phone and password fields", () => {
    render(<CustomerSignInForm />);
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows validation error for empty phone", async () => {
    render(<CustomerSignInForm />);
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/enter a valid pakistani mobile number/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for empty password", async () => {
    render(<CustomerSignInForm />);
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: "03001234567" } });
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/enter your password/i)).toBeInTheDocument();
    });
  });

  it("toggles password visibility", () => {
    render(<CustomerSignInForm />);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");
    const toggleButton = screen.getByLabelText(/show password/i);
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("has customer portal branding", () => {
    render(<CustomerSignInForm />);
    expect(screen.getByText(/customer portal/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in as customer/i)).toBeInTheDocument();
  });
});