"use client";

import { ShellProvider, useShell } from "./shell-context";
import { ShellFrame } from "./shell-frame";
import { ShellOverlay } from "./shell-overlay";
import { ShellEdge } from "./shell-edge";
import { ShellSlot } from "./shell-slot";
import { ShellContent } from "./shell-content";
import type { ReactNode } from "react";

type ShellProps = {
  children: ReactNode;
  /** Pixel gutter between the rim and the screen edge. */
  gutterPx?: number;
};

function ShellOverlayMount() {
  const { setOverlayElement } = useShell();
  return <ShellOverlay onMount={setOverlayElement} />;
}

function ShellRoot({ children, gutterPx }: ShellProps) {
  return (
    <ShellProvider gutterPx={gutterPx}>
      <div className="relative flex min-h-full flex-1 flex-col">
        <ShellFrame />
        {children}
        <ShellOverlayMount />
      </div>
    </ShellProvider>
  );
}

export const Shell = Object.assign(ShellRoot, {
  Edge: ShellEdge,
  Slot: ShellSlot,
  Content: ShellContent,
});
