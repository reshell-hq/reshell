import type { RenderPocket, ShellLayout } from "./layout";

export type ShellThemeColors = {
  ambient: string;
  surfaceFill: string;
  notchFill: string;
  strokeOuter: string;
  borderWidth: number;
};

function addTopPocket(path: Path2D, x1: number, x2: number, y: number, depth: number, r: number) {
  path.lineTo(x1 - r, y);
  path.quadraticCurveTo(x1, y, x1, y + r);
  path.lineTo(x1, y + depth - r);
  path.quadraticCurveTo(x1, y + depth, x1 + r, y + depth);
  path.lineTo(x2 - r, y + depth);
  path.quadraticCurveTo(x2, y + depth, x2, y + depth - r);
  path.lineTo(x2, y + r);
  path.quadraticCurveTo(x2, y, x2 + r, y);
}

function addBottomPocket(
  path: Path2D,
  x2: number,
  x1: number,
  y: number,
  depth: number,
  r: number,
) {
  path.lineTo(x2 + r, y);
  path.quadraticCurveTo(x2, y, x2, y - r);
  path.lineTo(x2, y - depth + r);
  path.quadraticCurveTo(x2, y - depth, x2 - r, y - depth);
  path.lineTo(x1 + r, y - depth);
  path.quadraticCurveTo(x1, y - depth, x1, y - depth + r);
  path.lineTo(x1, y - r);
  path.quadraticCurveTo(x1, y, x1 - r, y);
}

function addLeftPocket(path: Path2D, x: number, y2: number, y1: number, depth: number, r: number) {
  path.lineTo(x, y2 + r);
  path.quadraticCurveTo(x, y2, x + r, y2);
  path.lineTo(x + depth - r, y2);
  path.quadraticCurveTo(x + depth, y2, x + depth, y2 - r);
  path.lineTo(x + depth, y1 + r);
  path.quadraticCurveTo(x + depth, y1, x + depth - r, y1);
  path.lineTo(x + r, y1);
  path.quadraticCurveTo(x, y1, x, y1 - r);
}

function addRightPocket(path: Path2D, x: number, y1: number, y2: number, depth: number, r: number) {
  path.lineTo(x, y1 - r);
  path.quadraticCurveTo(x, y1, x - r, y1);
  path.lineTo(x - depth + r, y1);
  path.quadraticCurveTo(x - depth, y1, x - depth, y1 + r);
  path.lineTo(x - depth, y2 - r);
  path.quadraticCurveTo(x - depth, y2, x - depth + r, y2);
  path.lineTo(x - r, y2);
  path.quadraticCurveTo(x, y2, x, y2 + r);
}

/** Inner viewport boundary — pockets bulge inward over the canvas. */
function generateInnerBoundary(layout: ShellLayout, pocket: RenderPocket): Path2D {
  const { panelX: x, panelY: y, panelRight: right, panelBottom: bottom, shellRadius: rr } = layout;
  const path = new Path2D();
  path.moveTo(x + rr, y);

  if (pocket.active && pocket.rim === "top") {
    const x1 = pocket.anchor - pocket.span;
    const x2 = pocket.anchor + pocket.span;
    path.lineTo(x1 - pocket.radius, y);
    addTopPocket(path, x1, x2, y, pocket.depth, pocket.radius);
    path.lineTo(right - rr, y);
  } else {
    path.lineTo(right - rr, y);
  }

  path.quadraticCurveTo(right, y, right, y + rr);

  if (pocket.active && pocket.rim === "right") {
    const y1 = pocket.anchor - pocket.span;
    const y2 = pocket.anchor + pocket.span;
    path.lineTo(right, y1 - pocket.radius);
    addRightPocket(path, right, y1, y2, pocket.depth, pocket.radius);
    path.lineTo(right, bottom - rr);
  } else {
    path.lineTo(right, bottom - rr);
  }

  path.quadraticCurveTo(right, bottom, right - rr, bottom);

  if (pocket.active && pocket.rim === "bottom") {
    const x1 = pocket.anchor - pocket.span;
    const x2 = pocket.anchor + pocket.span;
    path.lineTo(x2 + pocket.radius, bottom);
    addBottomPocket(path, x2, x1, bottom, pocket.depth, pocket.radius);
    path.lineTo(x + rr, bottom);
  } else {
    path.lineTo(x + rr, bottom);
  }

  path.quadraticCurveTo(x, bottom, x, bottom - rr);

  if (pocket.active && pocket.rim === "left") {
    const y1 = pocket.anchor - pocket.span;
    const y2 = pocket.anchor + pocket.span;
    path.lineTo(x, y2 + pocket.radius);
    addLeftPocket(path, x, y2, y1, pocket.depth, pocket.radius);
    path.lineTo(x, y + rr);
  } else {
    path.lineTo(x, y + rr);
  }

  path.quadraticCurveTo(x, y, x + rr, y);
  path.closePath();
  return path;
}

function generateTopNotchFill(layout: ShellLayout, pocket: RenderPocket): Path2D {
  const x1 = pocket.anchor - pocket.span;
  const x2 = pocket.anchor + pocket.span;
  const y = layout.panelY;
  const d = pocket.depth;
  const r = pocket.radius;
  const path = new Path2D();

  path.moveTo(x1 - r, 0);
  path.lineTo(x2 + r, 0);
  path.lineTo(x2 + r, y);
  path.quadraticCurveTo(x2, y, x2, y + r);
  path.lineTo(x2, y + d - r);
  path.quadraticCurveTo(x2, y + d, x2 - r, y + d);
  path.lineTo(x1 + r, y + d);
  path.quadraticCurveTo(x1, y + d, x1, y + d - r);
  path.lineTo(x1, y + r);
  path.quadraticCurveTo(x1, y, x1 - r, y);
  path.closePath();
  return path;
}

function generateBottomNotchFill(layout: ShellLayout, pocket: RenderPocket): Path2D {
  const x1 = pocket.anchor - pocket.span;
  const x2 = pocket.anchor + pocket.span;
  const y = layout.panelBottom;
  const d = pocket.depth;
  const r = pocket.radius;
  const path = new Path2D();

  path.moveTo(x1 - r, layout.h);
  path.lineTo(x2 + r, layout.h);
  path.lineTo(x2 + r, y);
  path.quadraticCurveTo(x2, y, x2, y - r);
  path.lineTo(x2, y - d + r);
  path.quadraticCurveTo(x2, y - d, x2 - r, y - d);
  path.lineTo(x1 + r, y - d);
  path.quadraticCurveTo(x1, y - d, x1, y - d + r);
  path.lineTo(x1, y - r);
  path.quadraticCurveTo(x1, y, x1 - r, y);
  path.closePath();
  return path;
}

function generateLeftNotchFill(layout: ShellLayout, pocket: RenderPocket): Path2D {
  const x = layout.panelX;
  const y1 = pocket.anchor - pocket.span;
  const y2 = pocket.anchor + pocket.span;
  const d = pocket.depth;
  const r = pocket.radius;
  const path = new Path2D();

  path.moveTo(0, y1 - r);
  path.lineTo(0, y2 + r);
  path.lineTo(x, y2 + r);
  path.lineTo(x, y2);
  path.quadraticCurveTo(x, y2, x + r, y2);
  path.lineTo(x + d - r, y2);
  path.quadraticCurveTo(x + d, y2, x + d, y2 - r);
  path.lineTo(x + d, y1 + r);
  path.quadraticCurveTo(x + d, y1, x + d - r, y1);
  path.lineTo(x + r, y1);
  path.quadraticCurveTo(x, y1, x, y1 - r);
  path.closePath();
  return path;
}

function generateRightNotchFill(layout: ShellLayout, pocket: RenderPocket): Path2D {
  const x = layout.panelRight;
  const y1 = pocket.anchor - pocket.span;
  const y2 = pocket.anchor + pocket.span;
  const d = pocket.depth;
  const r = pocket.radius;
  const path = new Path2D();

  path.moveTo(layout.w, y1 - r);
  path.lineTo(layout.w, y2 + r);
  path.lineTo(x, y2 + r);
  path.lineTo(x, y2);
  path.quadraticCurveTo(x, y2, x - r, y2);
  path.lineTo(x - d + r, y2);
  path.quadraticCurveTo(x - d, y2, x - d, y2 - r);
  path.lineTo(x - d, y1 + r);
  path.quadraticCurveTo(x - d, y1, x - d + r, y1);
  path.lineTo(x - r, y1);
  path.quadraticCurveTo(x, y1, x, y1 - r);
  path.closePath();
  return path;
}

function generateNotchFillPath(layout: ShellLayout, pocket: RenderPocket): Path2D | null {
  if (!pocket.active || pocket.depth < 1) {
    return null;
  }

  switch (pocket.rim) {
    case "top":
      return generateTopNotchFill(layout, pocket);
    case "bottom":
      return generateBottomNotchFill(layout, pocket);
    case "left":
      return generateLeftNotchFill(layout, pocket);
    case "right":
      return generateRightNotchFill(layout, pocket);
    default:
      return null;
  }
}

/** Viewport ring shell: outer screen edge minus inner canvas hole (even-odd). */
function generateFrameShellPath(layout: ShellLayout, pocket: RenderPocket): Path2D {
  const { w, h } = layout;
  const path = new Path2D();

  path.moveTo(0, 0);
  path.lineTo(w, 0);
  path.lineTo(w, h);
  path.lineTo(0, h);
  path.closePath();

  const inner = generateInnerBoundary(layout, pocket);
  path.addPath(inner);

  return path;
}

export function resizeShellCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawSolidShell(
  ctx: CanvasRenderingContext2D,
  layout: ShellLayout,
  pocket: RenderPocket,
  theme: ShellThemeColors,
) {
  const path = generateFrameShellPath(layout, pocket);

  ctx.fillStyle = theme.surfaceFill;
  ctx.fill(path, "evenodd");

  const notchPath = generateNotchFillPath(layout, pocket);
  if (notchPath) {
    ctx.fillStyle = theme.notchFill;
    ctx.fill(notchPath);
  }

  if (theme.borderWidth > 0) {
    ctx.strokeStyle = theme.strokeOuter;
    ctx.lineWidth = theme.borderWidth;
    ctx.stroke(path);
  }
}

export function drawShell(
  canvas: HTMLCanvasElement,
  layout: ShellLayout,
  pocket: RenderPocket,
  theme: ShellThemeColors,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, layout.w, layout.h);
  drawSolidShell(ctx, layout, pocket, theme);
}
