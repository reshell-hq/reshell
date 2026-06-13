import { describe, expect, it, beforeEach } from "vitest";
import { useConfigStore } from "./config-store";

describe("useConfigStore", () => {
  beforeEach(() => {
    useConfigStore.setState({ open: false, section: "links" });
  });

  it("opens settings on the last-used section", () => {
    useConfigStore.setState({ open: false, section: "workspaces" });

    useConfigStore.getState().openSettings();

    expect(useConfigStore.getState()).toMatchObject({
      open: true,
      section: "workspaces",
    });
  });
});
