import { render, screen } from "@testing-library/react";
import { SignupSuccess } from "./signup-success";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "Auth.accountCreated": "Account Created",
      "Auth.welcomeMessage": "Welcome to Hunar",
      "Auth.nextSteps": "Next Steps",
      "Auth.completeProfile": "Complete your profile",
      "Auth.startPosting": "Start posting jobs",
      "Auth.continue": "Continue",
    };
    return translations[key] || key;
  },
}));

describe("SignupSuccess", () => {
  it("renders success message", () => {
    render(<SignupSuccess onContinue={() => {}} />);
    expect(screen.getByText(/account created/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome to hunar/i)).toBeInTheDocument();
  });

  it("renders next steps", () => {
    render(<SignupSuccess onContinue={() => {}} />);
    expect(screen.getByText(/complete your profile/i)).toBeInTheDocument();
    expect(screen.getByText(/start posting jobs/i)).toBeInTheDocument();
  });

  it("calls onContinue when button clicked", () => {
    const mockContinue = jest.fn();
    render(<SignupSuccess onContinue={mockContinue} />);
    const button = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(button);
    expect(mockContinue).toHaveBeenCalled();
  });
});