import { describe, expect, it } from "vitest";
import { createTestTheme } from "./theme-defaults";
import { resolveLayoutPresetId } from "./resolve-layout-preset";

describe("resolveLayoutPresetId", () => {
  it("defaults to the zone grid when no layout preset is stored", () => {
    expect(resolveLayoutPresetId(createTestTheme({ appliedPresetId: "editorial" }))).toBe(
      "default",
    );
  });

  it("uses appliedLayoutPresetId independently of the theme preset", () => {
    expect(
      resolveLayoutPresetId(
        createTestTheme({
          appliedThemePresetId: "ocean",
          appliedLayoutPresetId: "meridian",
        }),
      ),
    ).toBe("meridian");
  });
});
