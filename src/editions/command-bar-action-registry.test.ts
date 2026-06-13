import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCommandBarActionResults } from "@/command-bar/command-bar";
import { commandBarActionRegistry } from "./command-bar-action-registry";

afterEach(() => {
  commandBarActionRegistry.clear();
});

describe("commandBarActionRegistry", () => {
  it("is empty by default so only builtin actions surface", () => {
    expect(commandBarActionRegistry.list()).toEqual([]);
    const ids = buildCommandBarActionResults(":").map((action) => action.actionId);
    expect(ids).toEqual(["settings", "reset"]);
  });

  it("contributes registered actions to the command bar", () => {
    const run = vi.fn();
    commandBarActionRegistry.register({ id: "plan", label: "Plan with agent", run });

    const results = buildCommandBarActionResults(":plan");
    expect(results).toEqual([{ kind: "action", actionId: "plan", label: "Plan with agent" }]);
    expect(buildCommandBarActionResults(":")).toContainEqual({
      kind: "action",
      actionId: "plan",
      label: "Plan with agent",
    });
  });
});
