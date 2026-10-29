import React from "react";
import { render, screen, act } from "@testing-library/react";
import { VoicePlayer } from "./voice-player";

describe("VoicePlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders voice player with explicit durationSeconds", () => {
    render(
      <VoicePlayer
        voiceNote={{
          audioUrl: "https://example.com/audio.webm",
          durationSeconds: 15,
        }}
        variant="full"
      />
    );

    expect(screen.getByText("Customer Voice Note")).toBeInTheDocument();
    // Initially current time is 0:00 and total is 0:15
    expect(screen.getByText("0:00 / 0:15")).toBeInTheDocument();
  });

  it("renders compact variant with duration badge", () => {
    render(
      <VoicePlayer
        voiceNote={{
          audioUrl: "https://example.com/audio.webm",
          durationSeconds: 45,
        }}
        variant="compact"
      />
    );

    expect(screen.getByText("0:45")).toBeInTheDocument();
  });

  it("returns null if audioUrl is empty or missing", () => {
    const { container } = render(
      <VoicePlayer
        voiceNote={{
          audioUrl: "",
        }}
        variant="full"
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("resolves duration when audio loadedmetadata is triggered", () => {
    const { container } = render(
      <VoicePlayer
        voiceNote={{
          audioUrl: "https://example.com/audio.webm",
        }}
        variant="full"
      />
    );

    const audioEl = container.querySelector("audio") as HTMLAudioElement;
    expect(audioEl).toBeInTheDocument();

    act(() => {
      Object.defineProperty(audioEl, "duration", {
        value: 28,
        configurable: true,
      });
      audioEl.dispatchEvent(new Event("loadedmetadata"));
    });

    expect(screen.getByText("0:00 / 0:28")).toBeInTheDocument();
  });
});
