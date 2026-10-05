import {
  sanitizePriceInput,
  parsePriceOrZero,
  parsePriceOrUndefined,
  formatRs,
  formatRsExact,
} from "./money";

describe("sanitizePriceInput", () => {
  it("clears completely when empty (select all -> delete -> field is empty)", () => {
    expect(sanitizePriceInput("")).toBe("");
    expect(sanitizePriceInput("   ")).toBe("");
    expect(sanitizePriceInput(null)).toBe("");
    expect(sanitizePriceInput(undefined)).toBe("");
  });

  it("handles typing 120 from empty without adding leading 0", () => {
    expect(sanitizePriceInput("120")).toBe("120");
    expect(sanitizePriceInput("0120")).toBe("120");
    expect(sanitizePriceInput("00120")).toBe("120");
  });

  it("replaces 1500 with 500 cleanly", () => {
    expect(sanitizePriceInput("500")).toBe("500");
    expect(sanitizePriceInput("0500")).toBe("500");
  });

  it("handles typing single digit 5 from empty", () => {
    expect(sanitizePriceInput("5")).toBe("5");
    expect(sanitizePriceInput("05")).toBe("5");
  });

  it("preserves single 0 when explicitly typed, and collapses multiple zeros", () => {
    expect(sanitizePriceInput("0")).toBe("0");
    expect(sanitizePriceInput("00")).toBe("0");
    expect(sanitizePriceInput("000")).toBe("0");
  });

  it("supports decimal amounts if decimals are typed", () => {
    expect(sanitizePriceInput("0.5")).toBe("0.5");
    expect(sanitizePriceInput("12.50")).toBe("12.50");
  });
});

describe("parsePriceOrZero and parsePriceOrUndefined", () => {
  it("parses empty string safely without forcing zero during editing", () => {
    expect(parsePriceOrZero("")).toBe(0);
    expect(parsePriceOrUndefined("")).toBeUndefined();
  });

  it("parses numeric values correctly", () => {
    expect(parsePriceOrZero("120")).toBe(120);
    expect(parsePriceOrZero(1500)).toBe(1500);
    expect(parsePriceOrUndefined("500")).toBe(500);
  });
});
