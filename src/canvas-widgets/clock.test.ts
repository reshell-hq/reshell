import { describe, expect, it } from "vitest";
import { formatClockDisplay, formatEditorialClockDisplay } from "./clock";

describe("formatEditorialClockDisplay", () => {
  it("formats hero time and roman month date for the editorial canvas", () => {
    const display = formatEditorialClockDisplay(new Date("2026-11-03T11:34:00"));

    expect(display.time).toMatch(/11:34/);
    expect(display.dateHero).toBe("3 XI");
    expect(display.weekday).toBe("Tuesday");
  });
});

describe("formatClockDisplay", () => {
  it("keeps the standard long-form date line for other presets", () => {
    const display = formatClockDisplay(new Date("2026-11-03T11:34:00"));

    expect(display.date).toContain("November");
    expect(display.date).toContain("3");
  });
});
