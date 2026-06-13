import type { RenderPocket, ShellLayout } from "./layout";

function svgTopPocket(x1: number, x2: number, y: number, depth: number, r: number): string {
  return [
    `L ${x1 - r} ${y}`,
    `Q ${x1} ${y} ${x1} ${y + r}`,
    `L ${x1} ${y + depth - r}`,
    `Q ${x1} ${y + depth} ${x1 + r} ${y + depth}`,
    `L ${x2 - r} ${y + depth}`,
    `Q ${x2} ${y + depth} ${x2} ${y + depth - r}`,
    `L ${x2} ${y + r}`,
    `Q ${x2} ${y} ${x2 + r} ${y}`,
  ].join(" ");
}

function svgBottomPocket(x2: number, x1: number, y: number, depth: number, r: number): string {
  return [
    `L ${x2 + r} ${y}`,
    `Q ${x2} ${y} ${x2} ${y - r}`,
    `L ${x2} ${y - depth + r}`,
    `Q ${x2} ${y - depth} ${x2 - r} ${y - depth}`,
    `L ${x1 + r} ${y - depth}`,
    `Q ${x1} ${y - depth} ${x1} ${y - depth + r}`,
    `L ${x1} ${y - r}`,
    `Q ${x1} ${y} ${x1 - r} ${y}`,
  ].join(" ");
}

function svgLeftPocket(x: number, y2: number, y1: number, depth: number, r: number): string {
  return [
    `L ${x} ${y2 + r}`,
    `Q ${x} ${y2} ${x + r} ${y2}`,
    `L ${x + depth - r} ${y2}`,
    `Q ${x + depth} ${y2} ${x + depth} ${y2 - r}`,
    `L ${x + depth} ${y1 + r}`,
    `Q ${x + depth} ${y1} ${x + depth - r} ${y1}`,
    `L ${x + r} ${y1}`,
    `Q ${x} ${y1} ${x} ${y1 - r}`,
  ].join(" ");
}

function svgRightPocket(x: number, y1: number, y2: number, depth: number, r: number): string {
  return [
    `L ${x} ${y1 - r}`,
    `Q ${x} ${y1} ${x - r} ${y1}`,
    `L ${x - depth + r} ${y1}`,
    `Q ${x - depth} ${y1} ${x - depth} ${y1 + r}`,
    `L ${x - depth} ${y2 - r}`,
    `Q ${x - depth} ${y2} ${x - depth + r} ${y2}`,
    `L ${x - r} ${y2}`,
    `Q ${x} ${y2} ${x} ${y2 + r}`,
  ].join(" ");
}

function innerBoundarySvgD(layout: ShellLayout, pocket: RenderPocket): string {
  const { panelX: x, panelY: y, panelRight: right, panelBottom: bottom, shellRadius: rr } = layout;

  const topEdge =
    pocket.active && pocket.rim === "top"
      ? (() => {
          const x1 = pocket.anchor - pocket.span;
          const x2 = pocket.anchor + pocket.span;
          return `L ${x1 - pocket.radius} ${y} ${svgTopPocket(x1, x2, y, pocket.depth, pocket.radius)} L ${right - rr} ${y}`;
        })()
      : `L ${right - rr} ${y}`;

  const rightEdge =
    pocket.active && pocket.rim === "right"
      ? (() => {
          const y1 = pocket.anchor - pocket.span;
          const y2 = pocket.anchor + pocket.span;
          return `L ${right} ${y1 - pocket.radius} ${svgRightPocket(right, y1, y2, pocket.depth, pocket.radius)} L ${right} ${bottom - rr}`;
        })()
      : `L ${right} ${bottom - rr}`;

  const bottomEdge =
    pocket.active && pocket.rim === "bottom"
      ? (() => {
          const x1 = pocket.anchor - pocket.span;
          const x2 = pocket.anchor + pocket.span;
          return `L ${x2 + pocket.radius} ${bottom} ${svgBottomPocket(x2, x1, bottom, pocket.depth, pocket.radius)} L ${x + rr} ${bottom}`;
        })()
      : `L ${x + rr} ${bottom}`;

  const leftEdge =
    pocket.active && pocket.rim === "left"
      ? (() => {
          const y1 = pocket.anchor - pocket.span;
          const y2 = pocket.anchor + pocket.span;
          return `L ${x} ${y2 + pocket.radius} ${svgLeftPocket(x, y2, y1, pocket.depth, pocket.radius)} L ${x} ${y + rr}`;
        })()
      : `L ${x} ${y + rr}`;

  return [
    `M ${x + rr} ${y}`,
    topEdge,
    `Q ${right} ${y} ${right} ${y + rr}`,
    rightEdge,
    `Q ${right} ${bottom} ${right - rr} ${bottom}`,
    bottomEdge,
    `Q ${x} ${bottom} ${x} ${bottom - rr}`,
    leftEdge,
    `Q ${x} ${y} ${x + rr} ${y} Z`,
  ].join(" ");
}

export function frameShellRingSvgD(layout: ShellLayout, pocket: RenderPocket): string {
  const outer = `M 0 0 H ${layout.w} V ${layout.h} H 0 Z`;
  return `${outer} ${innerBoundarySvgD(layout, pocket)}`;
}
