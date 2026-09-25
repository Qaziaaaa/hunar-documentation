import { render, screen, fireEvent, act } from "@testing-library/react";
import { AuthBrand } from "./auth-brand";

describe("AuthBrand", () => {
  it("renders OrderworkerLogo component", () => {
    render(<AuthBrand />);
    expect(screen.getByRole("link")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
    expect(screen.getByRole("link")).toHaveAttribute("title", "Orderworker Home");
  });
});