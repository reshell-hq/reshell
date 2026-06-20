"use client";

import { ShellProvider, useShell } from "./shell-context";
import { ShellFrame } from "./shell-frame";
import { ShellOverlay } from "./shell-overlay";
import { ShellEdge } from "./shell-edge";
import { ShellSlot } from "./shell-slot";
import { ShellContent } from "./shell-content";
import { themeCssVars } from "@/lib/shell/theme";
import type { ShellThemeInput } from "@/lib/shell/theme";
import type { ReactNode } from "react";

type ShellProps = {
  children: ReactNode;
  /** Appearance overrides (colours, border, gutter sizes, handle component). */
  theme?: ShellThemeInput;
};

function ShellOverlayMount() {
  const { setOverlayElement } = useShell();
  return <ShellOverlay onMount={setOverlayElement} />;
}

/**
 * Var-bearing surface inside the provider. Its background paints the shell
 * (frame) colour across the whole viewport; the canvas fill and rim are layered
 * over it, and the theme CSS variables cascade to portaled overlay content.
 */
function ShellSurface({ children }: { children: ReactNode }) {
  const { theme } = useShell();
  return (
    <div
      className="relative flex min-h-full flex-1 flex-col"
      style={{ background: "var(--shell-color)", ...themeCssVars(theme) }}
    >
      <ShellFrame />
      {children}
      <ShellOverlayMount />
    </div>
  );
}

function ShellRoot({ children, theme }: ShellProps) {
  return (
    <ShellProvider theme={theme}>
      <ShellSurface>{children}</ShellSurface>
    </ShellProvider>
  );
}

export const Shell = Object.assign(ShellRoot, {
  Edge: ShellEdge,
  Slot: ShellSlot,
  Content: ShellContent,
});
