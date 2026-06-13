import { describe, expect, it } from "vitest";
import { formatWelcomeMessage } from "./welcome";

describe("formatWelcomeMessage", () => {
  it("greets with the display name when set", () => {
    const message = formatWelcomeMessage(new Date("2026-06-11T14:00:00"), "Jack");
    expect(message).toBe("Good afternoon, Jack");
  });

  it("omits the name when display name is unset", () => {
    expect(formatWelcomeMessage(new Date("2026-06-11T14:00:00"))).toBe("Good afternoon");
    expect(formatWelcomeMessage(new Date("2026-06-11T14:00:00"), "   ")).toBe("Good afternoon");
  });
});
