import { describe, expect, it } from "vitest";
import { LOGO_MARK_PATH, LOGO_VIEWBOX_SIZE } from "./logo-mark";

describe("logo mark", () => {
  it("uses the left-balanced shell ring path in a 32px viewBox", () => {
    expect(LOGO_MARK_PATH).toContain("M0 0H32V32H0Z");
    expect(LOGO_MARK_PATH).toContain("L7 22.5Q7 21 8.5 21");
    expect(LOGO_VIEWBOX_SIZE).toBe(32);
  });
});
