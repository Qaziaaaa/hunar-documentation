import { render, screen, fireEvent } from "@testing-library/react";
import { CustomerChatView } from "./customer-chat-view";

const mockMessages = [
  { id: "1", sender: "worker", text: "Hello, I'm on my way", timestamp: "2024-01-16T10:00:00Z" },
  { id: "2", sender: "customer", text: "Great, thanks!", timestamp: "2024-01-16T10:01:00Z" },
];

const mockOnSend = jest.fn();

describe("CustomerChatView", () => {
  it("renders chat messages", () => {
    render(<CustomerChatView messages={mockMessages} onSend={mockOnSend} />);
    expect(screen.getByText("Hello, I'm on my way")).toBeInTheDocument();
    expect(screen.getByText("Great, thanks!")).toBeInTheDocument();
  });

  it("displays sender names", () => {
    render(<CustomerChatView messages={mockMessages} onSend={mockOnSend} />);
    expect(screen.getByText(/worker/i)).toBeInTheDocument();
    expect(screen.getByText(/you/i)).toBeInTheDocument();
  });

  it("renders message input", () => {
    render(<CustomerChatView messages={mockMessages} onSend={mockOnSend} />);
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
  });

  it("calls onSend when message sent", async () => {
    render(<CustomerChatView messages={mockMessages} onSend={mockOnSend} />);
    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: "New message" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith("New message");
    });
  });

  it("shows empty state when no messages", () => {
    render(<CustomerChatView messages={[]} onSend={mockOnSend} />);
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });
});