"use client";

import type { ReactNode } from "react";
import { useShell } from "./shell-context";

type ShellContentProps = {
  children: ReactNode;
};

export function ShellContent({ children }: ShellContentProps) {
  const { bounds } = useShell();

  // TODO(plan-003): reduce bottom/top inset when a notch is open on that edge.
  return (
    <div
      className="relative z-10 flex min-h-0 flex-1 flex-col"
      style={{
        paddingTop: `${bounds.top}%`,
        paddingLeft: `${bounds.left}%`,
        paddingRight: `${100 - bounds.right}%`,
        paddingBottom: `${100 - bounds.bottom}%`,
      }}
    >
      {children}
    </div>
  );
}
