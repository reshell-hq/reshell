import { describe, expect, it } from "vitest";
import { createStarterLibrary } from "@/lib/library/starter-template";
import { addFocusTask } from "../tasks";
import {
  resolveWorkspaceInternalTools,
  setWorkspaceInternalTools,
} from "../workspace-tools";

describe("resolveWorkspaceInternalTools", () => {
  it("returns the seeded record when present", () => {
    const library = createStarterLibrary();
    const work = library.workspaces.find((w) => w.id === "work")!;

    const tools = resolveWorkspaceInternalTools(work);

    expect(tools.tasks.length).toBeGreaterThan(0);
    expect(tools.pomodoro.mode).toBe("pomodoro");
  });

  it("falls back to a fresh default record when the field is absent", () => {
    const library = createStarterLibrary();
    const work = { ...library.workspaces[0], internalTools: undefined };

    const tools = resolveWorkspaceInternalTools(work);

    expect(tools.tasks).toEqual([]);
    expect(tools.pomodoro.running).toBe(false);
    expect(tools.customFocusSplit).toBeNull();
  });
});

describe("setWorkspaceInternalTools", () => {
  it("updates only the named workspace, keeping tool state per-workspace", () => {
    const library = createStarterLibrary();
    const work = library.workspaces.find((w) => w.id === "work")!;
    const personalBefore = library.workspaces.find((w) => w.id === "personal")!;

    const nextWorkTools = addFocusTask(
      resolveWorkspaceInternalTools(work),
      "Work-only task",
      { id: "work-only" },
    );
    const updated = setWorkspaceInternalTools(library, "work", nextWorkTools);

    const workAfter = updated.workspaces.find((w) => w.id === "work")!;
    const personalAfter = updated.workspaces.find((w) => w.id === "personal")!;

    expect(workAfter.internalTools?.tasks.some((t) => t.id === "work-only")).toBe(
      true,
    );
    // Personal's tasks are untouched — tool state is independent per workspace.
    expect(personalAfter.internalTools?.tasks.some((t) => t.id === "work-only")).toBe(
      false,
    );
    expect(personalAfter.internalTools).toEqual(personalBefore.internalTools);
  });

  it("does not mutate the input library", () => {
    const library = createStarterLibrary();
    const work = library.workspaces.find((w) => w.id === "work")!;
    const originalTaskCount = work.internalTools?.tasks.length ?? 0;

    setWorkspaceInternalTools(
      library,
      "work",
      addFocusTask(resolveWorkspaceInternalTools(work), "Another", { id: "x" }),
    );

    expect(
      library.workspaces.find((w) => w.id === "work")!.internalTools?.tasks.length,
    ).toBe(originalTaskCount);
  });
});
