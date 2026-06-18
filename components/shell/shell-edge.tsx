"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { ShellEdgeProvider } from "./shell-context";
import { ShellSlot, type ShellSlotProps } from "./shell-slot";
import type { ShellEdge } from "@/lib/shell/types";

type ShellEdgeProps = {
  side: ShellEdge;
  children: ReactNode;
};

export function ShellEdge({ side, children }: ShellEdgeProps) {
  const childArray = Children.toArray(children);
  const siblingCount = childArray.length;

  return (
    <ShellEdgeProvider side={side} siblingCount={siblingCount}>
      {childArray.map((child, index) => {
        if (!isValidElement(child) || child.type !== ShellSlot) {
          return child;
        }

        return cloneElement(child as ReactElement<ShellSlotProps>, {
          anchorIndex: index,
        });
      })}
    </ShellEdgeProvider>
  );
}
