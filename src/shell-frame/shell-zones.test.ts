import { beforeEach, describe, expect, it } from "vitest";
import { internalToolZoneId } from "@/internal-tools/types";
import type { ShellZoneLayout } from "./layout";
import { getShellState, resetShellState } from "./shell-state";
import { pinInternalToolZone } from "./shell-zones";

describe("pinInternalToolZone", () => {
  const pomodoroZone: ShellZoneLayout = {
    id: internalToolZoneId("pomodoro"),
    rim: "right",
    kind: "internal-tool",
    x: 0,
    y: 0,
  };

  beforeEach(() => {
    resetShellState();
  });

  it("opens and pins the pomodoro tool flyout", () => {
    pinInternalToolZone("pomodoro", [pomodoroZone]);

    expect(getShellState()).toMatchObject({
      activeZoneId: internalToolZoneId("pomodoro"),
      pinned: true,
    });
  });
});
