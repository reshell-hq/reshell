import { describe, expect, it } from "vitest";
import { shouldFocusStartPageCommandBar } from "./start-page-command-bar-focus";

describe("shouldFocusStartPageCommandBar", () => {
  it("focuses when nothing meaningful is focused", () => {
    expect(shouldFocusStartPageCommandBar(null)).toBe(true);
  });
});
