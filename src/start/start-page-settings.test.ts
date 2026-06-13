import { describe, expect, it } from "vitest";
import { getStartPageSettingsContent } from "./start-page-settings";

describe("start page settings", () => {
  it("exposes the fixed bookmark path and home-station seeding guidance", () => {
    const content = getStartPageSettingsContent();

    expect(content.bookmarkPath).toBe("/start");
    expect(content.helperText).toMatch(/home station/i);
    expect(content.helperText).toMatch(/\/home/i);
  });
});
