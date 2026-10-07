import React from "react";
import { render, screen } from "@testing-library/react";
import { JobRequestCard } from "./job-request-card";
import { JobRequestModal } from "./job-request-modal";
import type { JobRequest } from "../types";

// Mock next-intl
jest.mock("next-intl", () => ({
  useLocale: () => "en",
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock voice-player
jest.mock("./voice-player", () => ({
  VoicePlayer: () => <div data-testid="mock-voice-player" />,
}));

// Mock api-client and data-source
jest.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number = 500) {
      super(message);
      this.status = status;
    }
  },
  http: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock("@/lib/data-source", () => ({
  isMockMode: () => false,
}));

// Mock submitWorkerOffer
jest.mock("@/services/worker/offers.service", () => ({
  submitWorkerOffer: jest.fn(),
}));

describe("Worker Dashboard Pre-Acceptance Location Privacy", () => {
  const samplePreAcceptanceJob: JobRequest = {
    id: "job-test-1",
    category: "Electrician",
    title: "Tripping Breaker in Main DB",
    description: "Main breaker trips when AC turns on.",
    distance: "1.8 km",
    locationArea: "Hayatabad Phase 3",
    uploadedTime: "10 min ago",
    status: "OPEN",
    suggestedVisitCharge: 500,
    customer: {
      firstName: "Ahmed",
      fullName: "Ahmed Khan Bangash",
      avatarUrl: "/landing/ahmad-khan-avatar-alt.png",
      rating: 4.8,
      totalOrders: 24,
      isVerified: true,
    },
    images: ["/test-img.jpg"],
  };

  const forbiddenAddressSnippets = [
    "House 123",
    "Street 5",
    "Near XYZ Market",
    "House 42-B",
    "Sector D-1",
    "Lane 7",
    "Circular Road",
  ];

  describe("JobRequestCard (Dashboard List/Cards)", () => {
    it("displays only the customer's Area / Sector before acceptance", () => {
      render(
        <JobRequestCard
          job={samplePreAcceptanceJob}
          onClick={jest.fn()}
        />,
      );

      // Verify Area / Sector is visible
      expect(screen.getByText("Hayatabad Phase 3")).toBeInTheDocument();

      // Verify none of the precise address components are displayed
      for (const snippet of forbiddenAddressSnippets) {
        expect(screen.queryByText(new RegExp(snippet, "i"))).not.toBeInTheDocument();
      }
    });
  });

  describe("JobRequestModal (Details Popup on Card Click)", () => {
    it("displays only the customer's Area / Sector in the popup before acceptance", () => {
      render(
        <JobRequestModal
          job={samplePreAcceptanceJob}
          isOpen={true}
          onClose={jest.fn()}
        />,
      );

      // Verify Area / Sector label and value
      expect(screen.getByText(/Area \/ Sector/i)).toBeInTheDocument();
      expect(screen.getByText("Hayatabad Phase 3")).toBeInTheDocument();

      // Verify complete/precise address details are not exposed in modal DOM
      for (const snippet of forbiddenAddressSnippets) {
        expect(screen.queryByText(new RegExp(snippet, "i"))).not.toBeInTheDocument();
      }
    });

    it("does not render modal when isOpen is false", () => {
      render(
        <JobRequestModal
          job={samplePreAcceptanceJob}
          isOpen={false}
          onClose={jest.fn()}
        />,
      );

      expect(screen.queryByText("Hayatabad Phase 3")).not.toBeInTheDocument();
    });
  });
});
