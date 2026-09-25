import { render, screen } from "@testing-library/react";
import { AuthTrustFooter } from "./auth-trust-footer";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "Auth.trustCnic": "CNIC Verified",
      "Auth.trustSecure": "Secure Payments",
      "Auth.copyright": "© 2024 Hunar. All rights reserved.",
    };
    return translations[key] || key;
  },
}));

describe("AuthTrustFooter", () => {
  it("renders trust items with icons", () => {
    render(<AuthTrustFooter />);
    expect(screen.getByText("CNIC Verified")).toBeInTheDocument();
    expect(screen.getByText("Secure Payments")).toBeInTheDocument();
  });

  it("renders copyright notice", () => {
    render(<AuthTrustFooter />);
    expect(screen.getByText("© 2024 Hunar. All rights reserved.")).toBeInTheDocument();
  });

  it("has correct footer structure", () => {
    render(<AuthTrustFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveClass("px-6");
    expect(footer).toHaveClass("pb-8");
    expect(footer).toHaveClass("pt-6");
  });
});