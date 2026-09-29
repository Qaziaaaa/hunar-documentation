import { render, screen, fireEvent } from "@testing-library/react";
import { VoiceNoteRecorder } from "./voice-note-recorder";

describe("VoiceNoteRecorder", () => {
  const mockOnRecord = jest.fn();
  const mockOnPlay = jest.fn();
  const mockOnDelete = jest.fn();

  it("renders record button when no recording", () => {
    render(<VoiceNoteRecorder onRecord={mockOnRecord} onPlay={mockOnPlay} onDelete={mockOnDelete} />);
    expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
  });

  it("shows recording state", () => {
    render(<VoiceNoteRecorder onRecord={mockOnRecord} onPlay={mockOnPlay} onDelete={mockOnDelete} isRecording />);
    expect(screen.getByRole("button", { name: /stop recording/i })).toBeInTheDocument();
    expect(screen.getByText(/recording.../i)).toBeInTheDocument();
  });

  it("shows playback controls when recording exists", () => {
    render(<VoiceNoteRecorder onRecord={mockOnRecord} onPlay={mockOnPlay} onDelete={mockOnDelete} hasRecording />);
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("calls onRecord when record button clicked", () => {
    render(<VoiceNoteRecorder onRecord={mockOnRecord} onPlay={mockOnPlay} onDelete={mockOnDelete} />);
    const recordButton = screen.getByRole("button", { name: /start recording/i });
    fireEvent.click(recordButton);
    expect(mockOnRecord).toHaveBeenCalled();
  });

  it("calls onPlay when play button clicked", () => {
    render(<VoiceNoteRecorder onRecord={mockOnRecord} onPlay={mockOnPlay} onDelete={mockOnDelete} hasRecording />);
    const playButton = screen.getByRole("button", { name: /play/i });
    fireEvent.click(playButton);
    expect(mockOnPlay).toHaveBeenCalled();
  });

  it("calls onDelete when delete button clicked", () => {
    render(<VoiceNoteRecorder onRecord={mockOnRecord} onPlay={mockOnPlay} onDelete={mockOnDelete} hasRecording />);
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalled();
  });
});