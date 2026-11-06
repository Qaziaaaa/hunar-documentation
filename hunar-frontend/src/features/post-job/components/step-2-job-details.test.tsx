import { render, screen, fireEvent } from "@testing-library/react";
import { Step2JobDetails } from "./step-2-job-details";
import type { PostJobData } from "../types";
import type { BackendCategory } from "../api/post-job-api";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

jest.mock("../api/post-job-api", () => {
  const actual = jest.requireActual("../api/post-job-api");
  return {
    ...actual,
    fetchServiceCategories: jest.fn().mockResolvedValue([]),
  };
});

const defaultFormData: PostJobData = {
  category: "seed-category-1",
  subCategory: "",
  title: "",
  description: "",
  photos: [],
  address: "University Road",
  area: "University Town",
  city: "Peshawar",
  scheduleType: "asap",
  preferredDate: "2026-11-01",
  preferredTimeSlot: "8:00 AM - 12:00 PM",
  suggestedVisitFee: 500,
};

describe("Step2JobDetails - Real Common Issues Connection", () => {
  const mockOnChange = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Job Title and Description input fields", () => {
    render(
      <Step2JobDetails
        data={defaultFormData}
        onChange={mockOnChange}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    );
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/detailed description/i)).toBeInTheDocument();
  });

  it("does not render common issues section when category has no issues", () => {
    const backendCategoriesWithoutIssues: BackendCategory[] = [
      {
        id: "seed-category-1",
        name: "Plumbing",
        commonIssues: [],
      },
    ];

    render(
      <Step2JobDetails
        data={defaultFormData}
        onChange={mockOnChange}
        onNext={mockOnNext}
        onBack={mockOnBack}
        backendCategories={backendCategoriesWithoutIssues}
      />
    );

    expect(screen.queryByText(/common issues/i)).not.toBeInTheDocument();
  });

  it("renders real common issues chips when configured for the category", () => {
    const backendCategoriesWithIssues: BackendCategory[] = [
      {
        id: "seed-category-1",
        name: "Plumbing",
        commonIssues: ["Tap Leakage & Repair", "Water Tank Overflow", "Pipe Burst"],
      },
    ];

    render(
      <Step2JobDetails
        data={defaultFormData}
        onChange={mockOnChange}
        onNext={mockOnNext}
        onBack={mockOnBack}
        backendCategories={backendCategoriesWithIssues}
      />
    );

    expect(screen.getByText(/common issues/i)).toBeInTheDocument();
    expect(screen.getByText("Tap Leakage & Repair")).toBeInTheDocument();
    expect(screen.getByText("Water Tank Overflow")).toBeInTheDocument();
    expect(screen.getByText("Pipe Burst")).toBeInTheDocument();
  });

  it("clicking any common issue chip automatically calls onChange to fill Job Title", () => {
    const backendCategoriesWithIssues: BackendCategory[] = [
      {
        id: "seed-category-1",
        name: "Plumbing",
        commonIssues: ["Tap Leakage & Repair", "Pipe Burst"],
      },
    ];

    render(
      <Step2JobDetails
        data={defaultFormData}
        onChange={mockOnChange}
        onNext={mockOnNext}
        onBack={mockOnBack}
        backendCategories={backendCategoriesWithIssues}
      />
    );

    const issueButton = screen.getByText("Tap Leakage & Repair");
    fireEvent.click(issueButton);

    expect(mockOnChange).toHaveBeenCalledWith({ title: "Tap Leakage & Repair" });
  });

  it("highlights the clicked common issue chip when title matches", () => {
    const backendCategoriesWithIssues: BackendCategory[] = [
      {
        id: "seed-category-1",
        name: "Plumbing",
        commonIssues: ["Tap Leakage & Repair", "Pipe Burst"],
      },
    ];

    const dataWithTitle: PostJobData = {
      ...defaultFormData,
      title: "Tap Leakage & Repair",
    };

    render(
      <Step2JobDetails
        data={dataWithTitle}
        onChange={mockOnChange}
        onNext={mockOnNext}
        onBack={mockOnBack}
        backendCategories={backendCategoriesWithIssues}
      />
    );

    const activeChip = screen.getByText("Tap Leakage & Repair").closest("button");
    expect(activeChip).toHaveClass("bg-[#0F8B8D]");
    expect(activeChip).toHaveClass("text-white");
  });

  it("shows error if user attempts to proceed without title", () => {
    render(
      <Step2JobDetails
        data={{ ...defaultFormData, title: "", description: "Some description here" }}
        onChange={mockOnChange}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    );

    const continueButton = screen.getByRole("button", { name: /continue to schedule/i });
    fireEvent.click(continueButton);

    expect(screen.getByText(/please provide a title for the job request/i)).toBeInTheDocument();
    expect(mockOnNext).not.toHaveBeenCalled();
  });
});
