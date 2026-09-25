import { render, screen, fireEvent } from "@testing-library/react";
import { SavedAddressesTab } from "./saved-addresses-tab";

const mockAddresses = [
  { id: "addr-1", label: "Home", address: "123 Main St, Karachi", isDefault: true },
  { id: "addr-2", label: "Office", address: "456 Business Ave, Karachi", isDefault: false },
];

const mockOnAdd = jest.fn();
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockOnSetDefault = jest.fn();

describe("SavedAddressesTab", () => {
  it("renders saved addresses", () => {
    render(<SavedAddressesTab addresses={mockAddresses} onAdd={mockOnAdd} onEdit={mockOnEdit} onDelete={mockOnDelete} onSetDefault={mockOnSetDefault} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("123 Main St, Karachi")).toBeInTheDocument();
    expect(screen.getByText("Office")).toBeInTheDocument();
    expect(screen.getByText("456 Business Ave, Karachi")).toBeInTheDocument();
  });

  it("shows default badge", () => {
    render(<SavedAddressesTab addresses={mockAddresses} onAdd={mockOnAdd} onEdit={mockOnEdit} onDelete={mockOnDelete} onSetDefault={mockOnSetDefault} />);
    expect(screen.getByText(/default/i)).toBeInTheDocument();
  });

  it("renders add address button", () => {
    render(<SavedAddressesTab addresses={mockAddresses} onAdd={mockOnAdd} onEdit={mockOnEdit} onDelete={mockOnDelete} onSetDefault={mockOnSetDefault} />);
    expect(screen.getByRole("button", { name: /add address/i })).toBeInTheDocument();
  });

  it("calls onAdd when add clicked", () => {
    render(<SavedAddressesTab addresses={mockAddresses} onAdd={mockOnAdd} onEdit={mockOnEdit} onDelete={mockOnDelete} onSetDefault={mockOnSetDefault} />);
    fireEvent.click(screen.getByRole("button", { name: /add address/i }));
    expect(mockOnAdd).toHaveBeenCalled();
  });

  it("calls onEdit when edit clicked", () => {
    render(<SavedAddressesTab addresses={mockAddresses} onAdd={mockOnAdd} onEdit={mockOnEdit} onDelete={mockOnDelete} onSetDefault={mockOnSetDefault} />);
    const editButton = screen.getByRole("button", { name: /edit home/i });
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith("addr-1");
  });

  it("calls onDelete when delete clicked", () => {
    render(<SavedAddressesTab addresses={mockAddresses} onAdd={mockOnAdd} onEdit={mockOnEdit} onDelete={mockOnDelete} onSetDefault={mockOnSetDefault} />);
    const deleteButton = screen.getByRole("button", { name: /delete office/i });
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith("addr-2");
  });

  it("calls onSetDefault when set default clicked", () => {
    render(<SavedAddressesTab addresses={mockAddresses} onAdd={mockOnAdd} onEdit={mockOnEdit} onDelete={mockOnDelete} onSetDefault={mockOnSetDefault} />);
    const defaultButton = screen.getByRole("button", { name: /set as default office/i });
    fireEvent.click(defaultButton);
    expect(mockOnSetDefault).toHaveBeenCalledWith("addr-2");
  });
});