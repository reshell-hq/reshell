import { describe, expect, it } from "vitest";
import { getStartPageShellContent, initialStartPagePhase } from "./start-page-shell";

describe("start page shell", () => {
  it("shows loading copy and a home station footer link", () => {
    const content = getStartPageShellContent();

    expect(content.loadingLabel.length).toBeGreaterThan(0);
    expect(content.commandBarPlaceholder).toMatch(/search/i);
    expect(content.homeStationHref).toBe("/home");
    expect(content.homeStationLinkLabel).toMatch(/home station/i);
  });

  it("begins in a loading phase before the library is checked", () => {
    expect(initialStartPagePhase()).toBe("loading");
  });
});
