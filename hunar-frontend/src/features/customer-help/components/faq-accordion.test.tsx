import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { FaqAccordion } from "./faq-accordion";
import type { FaqItem } from "../types";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
}));

const mockFAQs: FaqItem[] = [
  {
    id: "faq-1",
    category: "booking",
    question: "How do I post a job?",
    answer: "Click Post a Job button...",
  },
  {
    id: "faq-2",
    category: "pricing",
    question: "How does payment work?",
    answer: "Payments are processed securely...",
  },
];

describe("FAQAccordion", () => {
  it("renders FAQ items", () => {
    render(<FaqAccordion faqs={mockFAQs} searchQuery="" onSearchChange={jest.fn()} />);
    expect(screen.getByText("How do I post a job?")).toBeInTheDocument();
    expect(screen.getByText("How does payment work?")).toBeInTheDocument();
  });

  it("toggles answer visibility", () => {
    render(<FaqAccordion faqs={mockFAQs} searchQuery="" onSearchChange={jest.fn()} />);
    expect(screen.queryByText("Click Post a Job button...")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("How do I post a job?"));
    expect(screen.getByText("Click Post a Job button...")).toBeInTheDocument();
  });
});