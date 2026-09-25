import { render, screen } from "@testing-library/react";
import { WizardProgressStepper } from "./wizard-progress-stepper";

describe("WizardProgressStepper", () => {
  const steps = [
    { label: "Service", href: "#" },
    { label: "Details", href: "#" },
    { label: "Media", href: "#" },
    { label: "Location", href: "#" },
    { label: "Schedule", href: "#" },
    { label: "Review", href: "#" },
  ];

  it("renders all steps", () => {
    render(<WizardProgressStepper steps={steps} currentStep={0} />);
    steps.forEach((step) => {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    });
  });

  it("highlights current step", () => {
    render(<WizardProgressStepper steps={steps} currentStep={2} />);
    const currentStep = screen.getByText("Media").closest("div");
    expect(currentStep).toHaveClass("bg-teal");
    expect(currentStep).toHaveClass("text-white");
  });

  it("shows completed steps", () => {
    render(<WizardProgressStepper steps={steps} currentStep={3} />);
    expect(screen.getByText("Service")).toHaveClass("text-teal");
    expect(screen.getByText("Details")).toHaveClass("text-teal");
    expect(screen.getByText("Media")).toHaveClass("text-teal");
  });

  it("shows pending steps", () => {
    render(<WizardProgressStepper steps={steps} currentStep={1} />);
    expect(screen.getByText("Location")).toHaveClass("text-slate-400");
    expect(screen.getByText("Schedule")).toHaveClass("text-slate-400");
    expect(screen.getByText("Review")).toHaveClass("text-slate-400");
  });
});