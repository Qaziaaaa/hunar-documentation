import { render, screen } from "@testing-library/react";
import React from "react";
import { EscrowBanner } from "./escrow-banner";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

describe("EscrowBanner", () => {
  it("renders service protection info", () => {
    render(<EscrowBanner />);
    expect(screen.getByText(/How WorkerFIX Protects Your Service Experience/i)).toBeInTheDocument();
    expect(screen.getByText(/Payment Dispute Rules/i)).toBeInTheDocument();
  });
});