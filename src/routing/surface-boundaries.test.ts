import { describe, expect, it } from "vitest";
import {
  collectTransitiveImports,
  HOME_STATION_ENTRY,
  importsShellOnlyModules,
  START_PAGE_ENTRY,
} from "./surface-boundaries";

describe("surface bundle boundaries", () => {
  it("keeps shell chrome out of the start page import graph", () => {
    const startImports = collectTransitiveImports(START_PAGE_ENTRY);

    expect(importsShellOnlyModules(startImports)).toEqual([]);
  });

  it("loads the full shell from the home station entry", () => {
    const homeImports = collectTransitiveImports(HOME_STATION_ENTRY);

    expect(homeImports.has("src/components/shell/shell.tsx")).toBe(true);
  });
});
