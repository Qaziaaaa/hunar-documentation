import {
  DEFAULT_REPAIR_DURATION_MIN,
  parseDurationToMinutes,
} from "./duration";

describe("parseDurationToMinutes", () => {
  it("parses the exact dropdown options", () => {
    expect(parseDurationToMinutes("30 mins")).toBe(30);
    expect(parseDurationToMinutes("1 hour")).toBe(60);
    expect(parseDurationToMinutes("1.5 hours")).toBe(90);
    expect(parseDurationToMinutes("2 hours")).toBe(120);
    expect(parseDurationToMinutes("3+ hours")).toBe(180);
  });

  it("parses free-text hours and minutes", () => {
    expect(parseDurationToMinutes("45 minutes")).toBe(45);
    expect(parseDurationToMinutes("90 min")).toBe(90);
    expect(parseDurationToMinutes("2 hrs")).toBe(120);
    expect(parseDurationToMinutes("1 hour 30 mins")).toBe(90);
    expect(parseDurationToMinutes("2 hours 15 minutes")).toBe(135);
  });

  it("treats a bare number as minutes", () => {
    expect(parseDurationToMinutes("90")).toBe(90);
    expect(parseDurationToMinutes("120")).toBe(120);
  });

  it("falls back for empty, generic or unparseable input", () => {
    expect(parseDurationToMinutes("")).toBe(DEFAULT_REPAIR_DURATION_MIN);
    expect(parseDurationToMinutes("   ")).toBe(DEFAULT_REPAIR_DURATION_MIN);
    expect(parseDurationToMinutes("Standard")).toBe(DEFAULT_REPAIR_DURATION_MIN);
    expect(parseDurationToMinutes(null)).toBe(DEFAULT_REPAIR_DURATION_MIN);
    expect(parseDurationToMinutes(undefined)).toBe(DEFAULT_REPAIR_DURATION_MIN);
    expect(parseDurationToMinutes("0")).toBe(DEFAULT_REPAIR_DURATION_MIN);
  });

  it("accepts numeric input and a custom fallback", () => {
    expect(parseDurationToMinutes(45)).toBe(45);
    expect(parseDurationToMinutes("Standard", 90)).toBe(90);
    expect(parseDurationToMinutes(-5, 90)).toBe(90);
  });
});
