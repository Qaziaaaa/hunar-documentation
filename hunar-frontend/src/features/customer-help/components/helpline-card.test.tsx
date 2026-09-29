import { render, screen } from "@testing-library/react";
import { HelplineCard } from "./helpline-card";

describe("HelplineCard", () => {
  it("renders helpline info", () => {
    render(<HelplineCard />);
    expect(screen.getByText(/helpline/i)).toBeInTheDocument();
    expect(screen.getByText(/0800-hunar/i)).toBeInTheDocument();
    expect(screen.getByText(/support@hunar.pk/i)).toBeInTheDocument();
  });

  it("renders call button", () => {
    render(<HelplineCard />);
    expect(screen.getByRole("button", { name: /call now/i })).toBeInTheDocument();
  });
});