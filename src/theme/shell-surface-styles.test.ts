import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("shell surface DOM styles", () => {
  const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");

  it("styles solid shell dialogs without frosted flyout chrome", () => {
    expect(css).toMatch(/\.shell-config-dialog[\s\S]*background:\s*var\(--qs-color-surface\)/);
    expect(css).toMatch(
      /\.shell-rim-menu-layer \.shell-flyout\.visible[\s\S]*backdrop-filter:\s*none/,
    );
  });
});
