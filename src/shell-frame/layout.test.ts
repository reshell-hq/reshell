import { describe, expect, it } from "vitest";
import { BUILTIN_SURFACE } from "./rim";
import {
  getFlyoutRevealProgress,
  getRenderPocket,
  getShellLayout,
  getSurfacePocketFit,
  getSurfaceRevealStyle,
  getTargetPocketForZone,
} from "./layout";
import type { ShellZoneLayout } from "./layout";
import type { ShellAnimationSnapshot } from "./shell-state";

function baseAnimation(patch: Partial<ShellAnimationSnapshot> = {}): ShellAnimationSnapshot {
  return {
    activeZoneId: "group-a",
    previousZoneId: null,
    closing: false,
    pinned: false,
    t: 0,
    anchor: 400,
    targetAnchor: 400,
    span: 120,
    targetSpan: 120,
    depth: 160,
    targetDepth: 160,
    renderRim: "left",
    lastRim: "left",
    overIcon: false,
    overMenu: false,
    ...patch,
  };
}

describe("getRenderPocket", () => {
  it("expands span and depth from a point as t increases", () => {
    const layout = getShellLayout();
    const closed = getRenderPocket(layout, baseAnimation({ t: 0 }));
    const open = getRenderPocket(layout, baseAnimation({ t: 1 }));

    expect(closed.span).toBe(0);
    expect(closed.depth).toBe(0);
    expect(closed.active).toBe(false);
    expect(open.span).toBeCloseTo(120, 0);
    expect(open.depth).toBeCloseTo(160, 0);
    expect(open.active).toBe(true);
  });
});

describe("getSurfaceRevealStyle", () => {
  const topZone: ShellZoneLayout = {
    id: "dashboard",
    rim: "top",
    kind: "dashboard",
    x: 400,
    y: 7,
  };

  it("matches bottom search menu width using half-span notch geometry", () => {
    const searchZone: ShellZoneLayout = {
      id: BUILTIN_SURFACE.BOTTOM_SEARCH,
      rim: "bottom",
      kind: "search",
      x: 640,
      y: 780,
    };
    const menuSize = { width: 420, height: 128 };
    const layout = getShellLayout();
    const target = getTargetPocketForZone(searchZone, menuSize, layout);
    const pocket = getRenderPocket(
      layout,
      baseAnimation({
        t: 1,
        renderRim: "bottom",
        span: target.span,
        depth: target.depth,
        targetSpan: target.span,
        targetDepth: target.depth,
      }),
    );
    const pocketFit = getSurfacePocketFit(pocket, searchZone, menuSize);

    expect(pocketFit).toBeCloseTo(1, 2);
  });

  it("scales with pocket fit but reaches full opacity when the notch is open", () => {
    const layout = getShellLayout();
    const pocket = getRenderPocket(layout, baseAnimation({ t: 0.35, depth: 260, span: 480 }));
    const pocketFit = getSurfacePocketFit(pocket, topZone, { width: 480, height: 260 });
    const style = getSurfaceRevealStyle(1, pocketFit);

    expect(pocketFit).toBeLessThan(1);
    expect(style.opacity).toBe(1);
    expect(style.scale).toBeLessThan(1);
  });
});

describe("getFlyoutRevealProgress", () => {
  it("tracks t while closing instead of snapping shut", () => {
    expect(
      getFlyoutRevealProgress(baseAnimation({ closing: true, activeZoneId: null, t: 1 })),
    ).toBeCloseTo(1, 2);
    expect(
      getFlyoutRevealProgress(baseAnimation({ closing: true, activeZoneId: null, t: 0.5 })),
    ).toBeGreaterThan(0);
    expect(
      getFlyoutRevealProgress(baseAnimation({ closing: true, activeZoneId: null, t: 0 })),
    ).toBe(0);
  });
});
