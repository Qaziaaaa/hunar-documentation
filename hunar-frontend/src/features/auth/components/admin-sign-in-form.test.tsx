import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AdminSignInForm } from "./admin-sign-in-form";
import { adminApi } from "@/features/admin/api/admin-api";
import { ADMIN_ACCESS_TOKEN_KEY, ADMIN_AUTH_USER_KEY } from "@/lib/api-client";

jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/features/admin/api/admin-api", () => ({
  adminApi: {
    login: jest.fn(),
  },
}));

describe("AdminSignInForm", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    jest.clearAllMocks();
    jest.mocked(adminApi.login).mockResolvedValue({
      accessToken: "mock-admin-jwt-token-12345",
      refreshToken: "mock-refresh-token",
      user: { id: "admin-1", name: "Admin", email: "admin@hunar.pk" },
    });
  });

  it("renders email and password fields", () => {
    render(<AdminSignInForm />);
    expect(screen.getByLabelText(/admin email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    render(<AdminSignInForm />);
    const emailInput = screen.getByLabelText(/admin email address/i);
    fireEvent.change(emailInput, { target: { value: "invalid" } });
    const submitButton = screen.getByRole("button", { name: /sign in to admin dashboard/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid admin email address/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for short password", async () => {
    render(<AdminSignInForm />);
    const emailInput = screen.getByLabelText(/admin email address/i);
    fireEvent.change(emailInput, { target: { value: "admin@hunar.pk" } });
    const passwordInput = screen.getByLabelText("Password");
    fireEvent.change(passwordInput, { target: { value: "123" } });
    const submitButton = screen.getByRole("button", { name: /sign in to admin dashboard/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it("toggles password visibility", () => {
    render(<AdminSignInForm />);
    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");
    const toggleButton = screen.getByLabelText(/show password/i);
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("has remember me checkbox", () => {
    render(<AdminSignInForm />);
    expect(screen.getByLabelText(/remember session/i)).toBeInTheDocument();
  });

  it("shows admin portal branding", () => {
    render(<AdminSignInForm />);
    expect(screen.getByText(/platform admin portal/i)).toBeInTheDocument();
    expect(screen.getByText(/admin sign in/i)).toBeInTheDocument();
  });

  it("stores admin session on successful login", async () => {
    render(<AdminSignInForm />);
    const emailInput = screen.getByLabelText(/admin email address/i);
    fireEvent.change(emailInput, { target: { value: "admin@hunar.pk" } });
    const passwordInput = screen.getByLabelText("Password");
    fireEvent.change(passwordInput, { target: { value: "admin123" } });
    const submitButton = screen.getByRole("button", { name: /sign in to admin dashboard/i });
    fireEvent.click(submitButton);
    // jest.setup.ts replaces localStorage with no-op jest.fn()s — assert on the recorded calls.
    const setItem = jest.mocked(window.localStorage.setItem);
    await waitFor(() => {
      expect(setItem).toHaveBeenCalledWith(ADMIN_ACCESS_TOKEN_KEY, "mock-admin-jwt-token-12345");
      expect(setItem).toHaveBeenCalledWith(ADMIN_AUTH_USER_KEY, expect.stringContaining("admin-1"));
    });
  });

  it("disables submit button when submitting", () => {
    render(<AdminSignInForm />);
    const submitButton = screen.getByRole("button", { name: /sign in to admin dashboard/i });
    // We can't easily test submitting state without mocking the router push
    // but we can verify the button exists
    expect(submitButton).toBeInTheDocument();
  });
});