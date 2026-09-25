import { render, screen } from "@testing-library/react";
import { HunarBrandBanner } from "./hunar-brand-banner";

describe("HunarBrandBanner", () => {
  it("renders brand banner", () => {
    render(<HunarBrandBanner />);
    expect(screen.getByText(/hunar/i)).toBeInTheDocument();
    expect(screen.getByText(/skilled workers at your doorstep/i)).toBeInTheDocument();
  });

  it("renders CTA button", () => {
    render(<HunarBrandBanner />);
    expect(screen.getByRole("button", { name: /post a job/i })).toBeInTheDocument();
  });
});