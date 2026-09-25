import { render, screen, fireEvent } from "@testing-library/react";
import { PersonalProfileTab } from "./personal-profile-tab";

describe("PersonalProfileTab", () => {
  const mockUser = {
    name: "John Doe",
    phone: "03001234567",
    email: "john@example.com",
    avatar: "/avatar.jpg",
  };

  const mockOnUpdate = jest.fn();

  it("renders profile form", () => {
    render(<PersonalProfileTab user={mockUser} onUpdate={mockOnUpdate} />);
    expect(screen.getByLabelText(/full name/i)).toHaveValue("John Doe");
    expect(screen.getByLabelText(/phone/i)).toHaveValue("03001234567");
    expect(screen.getByLabelText(/email/i)).toHaveValue("john@example.com");
  });

  it("calls onUpdate when form submitted", async () => {
    render(<PersonalProfileTab user={mockUser} onUpdate={mockOnUpdate} />);
    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    const submitButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: "Jane Doe" }));
    });
  });

  it("shows avatar", () => {
    render(<PersonalProfileTab user={mockUser} onUpdate={mockOnUpdate} />);
    expect(screen.getByAltText(/john doe/i)).toHaveAttribute("src", "/avatar.jpg");
  });
});