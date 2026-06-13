import { describe, expect, it } from "vitest";
import { RESHELL_ROUTES } from "./routes";

describe("Reshell routes", () => {
  it("exposes landing, home station, and start page paths", () => {
    expect(RESHELL_ROUTES.landing).toBe("/");
    expect(RESHELL_ROUTES.homeStation).toBe("/home");
    expect(RESHELL_ROUTES.startPage).toBe("/start");
  });
});
