import { describe, expect, it } from "vitest";
import { buildCommandBarActionResults } from "./command-bar";

describe("buildCommandBarActionResults", () => {
  it("includes a settings action for :settings", () => {
    expect(buildCommandBarActionResults(":settings")[0]).toMatchObject({
      kind: "action",
      actionId: "settings",
      label: "Open settings",
    });
  });
});
