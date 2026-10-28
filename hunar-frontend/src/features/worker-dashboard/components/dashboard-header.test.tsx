import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardHeader } from "./dashboard-header";

const mockReplace = jest.fn();

jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
  }),
  usePathname: () => "/worker",
}));

let mockCurrentLocale = "en";
jest.mock("next-intl", () => ({
  useLocale: () => mockCurrentLocale,
}));

if (typeof window !== "undefined" && !window.PointerEvent) {
  window.PointerEvent = window.MouseEvent as any;
}

describe("DashboardHeader Settings Button & Panel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentLocale = "en";
  });

  it("renders the settings button with accessible label and no raw language switcher in the header", () => {
    render(
      <DashboardHeader
        isOnline={true}
        onToggleOnline={jest.fn()}
      />
    );

    // Old language switcher text should NOT be present in header by default
    expect(screen.queryByTitle("Switch English / اردو")).not.toBeInTheDocument();

    // Settings button must be present
    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    expect(settingsBtn).toBeInTheDocument();
    expect(settingsBtn).toHaveAttribute("title", "Settings");
  });

  it("opens settings panel on click and displays Language options and Show Relevant Jobs toggle", () => {
    const handleToggleShowRelevant = jest.fn();

    render(
      <DashboardHeader
        isOnline={true}
        onToggleOnline={jest.fn()}
        showRelevantJobs={false}
        onToggleShowRelevantJobs={handleToggleShowRelevant}
      />
    );

    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(settingsBtn);

    // Dialog is visible
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();

    // Section 1: Language with Urdu and English
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByLabelText("اردو")).toBeInTheDocument();
    expect(screen.getByLabelText("English")).toBeInTheDocument();

    // Section 2: Show Relevant Jobs toggle with exact text
    expect(screen.getByText("Show Relevant Jobs")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Show Relevant Jobs" })).toBeInTheDocument();

    // Ensure the helper subtitle text has been removed
    expect(screen.queryByText(/Only show jobs matching your assigned categories/i)).not.toBeInTheDocument();
  });

  it("triggers router.replace when selecting Urdu language", () => {
    render(
      <DashboardHeader
        isOnline={true}
        onToggleOnline={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const urduRadio = screen.getByLabelText("اردو");
    fireEvent.click(urduRadio);

    expect(mockReplace).toHaveBeenCalledWith("/worker", { locale: "ur" });
  });

  it("calls onToggleShowRelevantJobs when toggle is clicked", () => {
    const handleToggleShowRelevant = jest.fn();

    render(
      <DashboardHeader
        isOnline={true}
        onToggleOnline={jest.fn()}
        showRelevantJobs={false}
        onToggleShowRelevantJobs={handleToggleShowRelevant}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const toggle = screen.getByRole("switch", { name: "Show Relevant Jobs" });
    fireEvent.click(toggle);

    expect(handleToggleShowRelevant).toHaveBeenCalledWith(true);
  });

  it("closes settings panel when pressing Escape key", () => {
    render(
      <DashboardHeader
        isOnline={true}
        onToggleOnline={jest.fn()}
      />
    );

    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(settingsBtn);
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument();
  });
});
