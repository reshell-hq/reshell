"use client";

import { SHELL_BOUNDS } from "@/lib/shell/constants";
import type { ShellBounds } from "@/lib/shell/types";
import { ShellProvider, useShell } from "./shell-context";
import { ShellFrame } from "./shell-frame";
import { ShellOverlay } from "./shell-overlay";
import { ShellEdge } from "./shell-edge";
import { ShellSlot } from "./shell-slot";
import { ShellContent } from "./shell-content";
import type { ReactNode } from "react";

type ShellProps = {
  children: ReactNode;
  bounds?: ShellBounds;
};

function ShellOverlayMount() {
  const { setOverlayElement } = useShell();
  return <ShellOverlay onMount={setOverlayElement} />;
}

function ShellRoot({ children, bounds = SHELL_BOUNDS }: ShellProps) {
  return (
    <ShellProvider bounds={bounds}>
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
