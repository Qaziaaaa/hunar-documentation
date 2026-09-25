import { render, screen } from "@testing-library/react";
import { FAQAccordion } from "./faq-accordion";

const mockFAQs = [
  { question: "How do I post a job?", answer: "Click Post a Job button..." },
  { question: "How does payment work?", answer: "Payments are held in escrow..." },
];

describe("FAQAccordion", () => {
  it("renders FAQ items", () => {
    render(<FAQAccordion faqs={mockFAQs} />);
    expect(screen.getByText("How do I post a job?")).toBeInTheDocument();
    expect(screen.getByText("How does payment work?")).toBeInTheDocument();
  });

  it("toggles answer visibility", () => {
    render(<FAQAccordion faqs={mockFAQs} />);
    expect(screen.queryByText("Click Post a Job button...")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("How do I post a job?"));
    expect(screen.getByText("Click Post a Job button...")).toBeInTheDocument();
  });
});