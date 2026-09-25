import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PostJobWizard } from "./post-job-wizard";

describe("PostJobWizard", () => {
  it("renders step 1 - service select initially", () => {
    render(<PostJobWizard />);
    expect(screen.getByText(/select service/i)).toBeInTheDocument();
    expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument();
  });

  it("shows progress stepper", () => {
    render(<PostJobWizard />);
    expect(screen.getByText(/service/i)).toBeInTheDocument();
    expect(screen.getByText(/details/i)).toBeInTheDocument();
    expect(screen.getByText(/media/i)).toBeInTheDocument();
    expect(screen.getByText(/location/i)).toBeInTheDocument();
    expect(screen.getByText(/schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/review/i)).toBeInTheDocument();
  });

  it("progresses through steps with valid input", async () => {
    render(<PostJobWizard />);
    // Step 1 - select service
    const serviceButton = screen.getByRole("button", { name: /plumbing/i });
    fireEvent.click(serviceButton);
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument();
    });
  });

  it("validates required fields before proceeding", async () => {
    render(<PostJobWizard />);
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(screen.getByText(/please select a service/i)).toBeInTheDocument();
    });
  });
});