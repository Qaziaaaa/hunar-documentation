import { render, screen, fireEvent } from "@testing-library/react";
import { SecurityTab } from "./security-tab";

const mockOnPasswordChange = jest.fn();
const mockOnLogout = jest.fn();
const mockOnDeleteAccount = jest.fn();

describe("SecurityTab", () => {
  it("renders password change form", () => {
    render(<SecurityTab onPasswordChange={mockOnPasswordChange} onLogout={mockOnLogout} onDeleteAccount={mockOnDeleteAccount} />);
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it("renders change password button", () => {
    render(<SecurityTab onPasswordChange={mockOnPasswordChange} onLogout={mockOnLogout} onDeleteAccount={mockOnDeleteAccount} />);
    expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
  });

  it("renders logout button", () => {
    render(<SecurityTab onPasswordChange={mockOnPasswordChange} onLogout={mockOnLogout} onDeleteAccount={mockOnDeleteAccount} />);
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("renders delete account button", () => {
    render(<SecurityTab onPasswordChange={mockOnPasswordChange} onLogout={mockOnLogout} onDeleteAccount={mockOnDeleteAccount} />);
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
  });

  it("calls onPasswordChange when submitted", async () => {
    render(<SecurityTab onPasswordChange={mockOnPasswordChange} onLogout={mockOnLogout} onDeleteAccount={mockOnDeleteAccount} />);
    const currentPassword = screen.getByLabelText(/current password/i);
    fireEvent.change(currentPassword, { target: { value: "oldpass123" } });
    const newPassword = screen.getByLabelText(/new password/i);
    fireEvent.change(newPassword, { target: { value: "newpass123" } });
    const confirmPassword = screen.getByLabelText(/confirm new password/i);
    fireEvent.change(confirmPassword, { target: { value: "newpass123" } });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));
    await waitFor(() => {
      expect(mockOnPasswordChange).toHaveBeenCalledWith("oldpass123", "newpass123");
    });
  });

  it("calls onLogout when logout clicked", () => {
    render(<SecurityTab onPasswordChange={mockOnPasswordChange} onLogout={mockOnLogout} onDeleteAccount={mockOnDeleteAccount} />);
    fireEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(mockOnLogout).toHaveBeenCalled();
  });

  it("calls onDeleteAccount when delete clicked", () => {
    render(<SecurityTab onPasswordChange={mockOnPasswordChange} onLogout={mockOnLogout} onDeleteAccount={mockOnDeleteAccount} />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    expect(mockOnDeleteAccount).toHaveBeenCalled();
  });
});