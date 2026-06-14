import { describe, expect, it } from "vitest";
import { RESHELL_ROUTES } from "@/routing/routes";

describe("OSS root route", () => {
  it("redirects / to the home station instead of serving marketing", () => {
    expect(RESHELL_ROUTES.landing).toBe("/");
    expect(RESHELL_ROUTES.homeStation).toBe("/home");
  });
});
