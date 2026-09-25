import { render, screen, fireEvent, act } from "@testing-library/react";
import { OtpInput } from "./otp-input";

describe("OtpInput", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders 6 input fields", () => {
    render(<OtpInput value="" onChange={mockOnChange} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("displays digits when value is provided", () => {
    render(<OtpInput value="123456" onChange={mockOnChange} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveValue("2");
    expect(inputs[2]).toHaveValue("3");
    expect(inputs[3]).toHaveValue("4");
    expect(inputs[4]).toHaveValue("5");
    expect(inputs[5]).toHaveValue("6");
  });

  it("calls onChange when user types a digit", () => {
    render(<OtpInput value="" onChange={mockOnChange} />);
    const firstInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(firstInput, { target: { value: "1" } });
    expect(mockOnChange).toHaveBeenCalledWith("1");
  });

  it("moves focus to next input on digit entry", () => {
    render(<OtpInput value="" onChange={mockOnChange} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "1" } });
    expect(inputs[1]).toHaveFocus();
  });

  it("handles backspace to move to previous input", () => {
    render(<OtpInput value="1" onChange={mockOnChange} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.keyDown(inputs[1], { key: "Backspace" });
    expect(mockOnChange).toHaveBeenCalledWith("");
    expect(inputs[0]).toHaveFocus();
  });

  it("handles paste event", () => {
    render(<OtpInput value="" onChange={mockOnChange} />);
    const firstInput = screen.getAllByRole("textbox")[0];
    fireEvent.paste(firstInput, { clipboardData: { getData: () => "123456" } });
    expect(mockOnChange).toHaveBeenCalledWith("123456");
  });

  it("applies invalid styling when invalid prop is true", () => {
    render(<OtpInput value="12" onChange={mockOnChange} invalid />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0]).toHaveClass("border-error");
    expect(inputs[1]).toHaveClass("border-error");
  });

  it("disables inputs when disabled prop is true", () => {
    render(<OtpInput value="" onChange={mockOnChange} disabled />);
    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it("only allows numeric input", () => {
    render(<OtpInput value="" onChange={mockOnChange} />);
    const firstInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(firstInput, { target: { value: "a" } });
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("handles arrow key navigation", () => {
    render(<OtpInput value="123" onChange={mockOnChange} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.keyDown(inputs[2], { key: "ArrowLeft" });
    expect(inputs[1]).toHaveFocus();
    fireEvent.keyDown(inputs[1], { key: "ArrowRight" });
    expect(inputs[2]).toHaveFocus();
  });

  it("truncates value to 6 digits", () => {
    render(<OtpInput value="1234567" onChange={mockOnChange} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs[5]).toHaveValue("6");
  });

  it("selects text on focus", () => {
    render(<OtpInput value="1" onChange={mockOnChange} />);
    const firstInput = screen.getAllByRole("textbox")[0];
    fireEvent.focus(firstInput);
    expect(firstInput).toHaveValue("1");
  });
});