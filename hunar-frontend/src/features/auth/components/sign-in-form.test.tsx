import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SignInForm } from "./sign-in-form";

jest.mock("@/lib/api-client", () => ({
  setTokens: jest.fn(),
}));
jest.mock("../api/auth-api", () => ({
  workerLogin: jest.fn().mockResolvedValue({
    accessToken: "token",
    refreshToken: "refresh",
    user: { id: "1", name: "Test" },
  }),
}));
jest.mock("../lib/error", () => ({
  getErrorMessage: (error: Error) => error.message,
}));

describe("SignInForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders phone and password fields", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows validation error for empty phone", async () => {
    render(<SignInForm />);
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/enter a valid pakistani mobile number/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for empty password", async () => {
    render(<SignInForm />);
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: "03001234567" } });
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/enter your password/i)).toBeInTheDocument();
    });
  });

  it("toggles password visibility", () => {
    render(<SignInForm />);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");
    const toggleButton = screen.getByLabelText(/show password/i);
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("submits valid credentials", async () => {
    render(<SignInForm />);
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: "03001234567" } });
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});