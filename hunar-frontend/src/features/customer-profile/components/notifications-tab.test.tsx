import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationsTab } from "./notifications-tab";

const mockNotifications = [
  { id: "notif-1", title: "Job Update", message: "Worker assigned", read: false, createdAt: "2024-01-15T10:00:00Z" },
  { id: "notif-2", title: "Payment", message: "Payment received", read: true, createdAt: "2024-01-14T10:00:00Z" },
];

const mockOnMarkRead = jest.fn();
const mockOnMarkAllRead = jest.fn();

describe("NotificationsTab", () => {
  it("renders notifications list", () => {
    render(<NotificationsTab notifications={mockNotifications} onMarkRead={mockOnMarkRead} onMarkAllRead={mockOnMarkAllRead} />);
    expect(screen.getByText("Job Update")).toBeInTheDocument();
    expect(screen.getByText("Worker assigned")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
    expect(screen.getByText("Payment received")).toBeInTheDocument();
  });

  it("shows unread badge", () => {
    render(<NotificationsTab notifications={mockNotifications} onMarkRead={mockOnMarkRead} onMarkAllRead={mockOnMarkAllRead} />);
    expect(screen.getByText(/1 unread/i)).toBeInTheDocument();
  });

  it("renders mark all read button", () => {
    render(<NotificationsTab notifications={mockNotifications} onMarkRead={mockOnMarkRead} onMarkAllRead={mockOnMarkAllRead} />);
    expect(screen.getByRole("button", { name: /mark all as read/i })).toBeInTheDocument();
  });

  it("calls onMarkAllRead when clicked", () => {
    render(<NotificationsTab notifications={mockNotifications} onMarkRead={mockOnMarkRead} onMarkAllRead={mockOnMarkAllRead} />);
    fireEvent.click(screen.getByRole("button", { name: /mark all as read/i }));
    expect(mockOnMarkAllRead).toHaveBeenCalled();
  });

  it("calls onMarkRead for individual notification", () => {
    render(<NotificationsTab notifications={mockNotifications} onMarkRead={mockOnMarkRead} onMarkAllRead={mockOnMarkAllRead} />);
    const markReadButton = screen.getByRole("button", { name: /mark as read job update/i });
    fireEvent.click(markReadButton);
    expect(mockOnMarkRead).toHaveBeenCalledWith("notif-1");
  });

  it("shows empty state when no notifications", () => {
    render(<NotificationsTab notifications={[]} onMarkRead={mockOnMarkRead} onMarkAllRead={mockOnMarkAllRead} />);
    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });
});