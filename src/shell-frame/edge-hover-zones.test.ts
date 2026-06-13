import { describe, expect, it } from "vitest";
import {
  computeEdgeHoverBridge,
  computeStackedLeftRimTraps,
  computeTopDashboardRimHit,
  EDGE_HANDLE_HIT_PX,
  shouldEnableHoverBridge,
} from "./edge-hover-zones";
import { getFlyoutRevealProgress, getShellLayout } from "./layout";

describe("computeStackedLeftRimTraps", () => {
  it("creates stacked left-rim traps with at least 40px effective height", () => {
    const traps = computeStackedLeftRimTraps({
      handleCentersY: [200, 400, 600],
      rimWidth: 72,
      rimStartY: 130,
      rimEndY: 670,
    });

    expect(traps).toHaveLength(3);
    for (const trap of traps) {
      expect(trap.width).toBeGreaterThanOrEqual(EDGE_HANDLE_HIT_PX);
      expect(trap.height).toBeGreaterThanOrEqual(EDGE_HANDLE_HIT_PX);
    }
    expect(traps[0]!.top).toBe(130);
    expect(traps[2]!.top + traps[2]!.height).toBe(670);
  });

  it("partitions the rim between neighboring handles without gaps", () => {
    const traps = computeStackedLeftRimTraps({
      handleCentersY: [200, 400],
      rimWidth: 72,
      rimStartY: 100,
      rimEndY: 500,
    });

    expect(traps[0]!.top + traps[0]!.height).toBeCloseTo(traps[1]!.top, 5);
  });
});

describe("computeEdgeHoverBridge", () => {
  it("spans horizontally from the handle edge to the flyout", () => {
    const bridge = computeEdgeHoverBridge({
      handleCenterX: 36,
      handleCenterY: 300,
      flyoutCenterX: 180,
      flyoutCenterY: 300,
      menuWidth: 170,
      menuHeight: 130,
    });

    expect(bridge.left).toBe(36 + EDGE_HANDLE_HIT_PX / 2);
    expect(bridge.left + bridge.width).toBeGreaterThanOrEqual(180 - 170 / 2);
    expect(bridge.height).toBeGreaterThanOrEqual(EDGE_HANDLE_HIT_PX);
  });
});

describe("shouldEnableHoverBridge", () => {
  it("stays active while traversing handle, bridge, or menu", () => {
    expect(shouldEnableHoverBridge("group-a", "group-a", false, true, false, 0)).toBe(true);
    expect(shouldEnableHoverBridge("group-a", "group-a", false, false, true, 0)).toBe(true);
    expect(shouldEnableHoverBridge("group-a", "group-a", false, false, false, 0.1)).toBe(true);
    expect(shouldEnableHoverBridge("group-a", "group-b", false, true, false, 1)).toBe(false);
  });
});

describe("computeTopDashboardRimHit", () => {
  it("covers the pocket span with at least 40px height when resting", () => {
    const layout = getShellLayout();
    const hit = computeTopDashboardRimHit(layout, { width: 480, height: 260 }, false);

    expect(hit.top).toBe(0);
    expect(hit.height).toBeGreaterThanOrEqual(40);
    expect(hit.width).toBe(Math.min(layout.panelW * 0.42, 480) * 2);
    expect(hit.left + hit.width / 2).toBeCloseTo(layout.panelX + layout.panelW * 0.5, 0);
  });

  it("extends through the open pocket depth while the control center is expanded", () => {
    const layout = getShellLayout();
    const menuSize = { width: 480, height: 260 };
    const hit = computeTopDashboardRimHit(layout, menuSize, true);
    const pocketDepth = Math.max(menuSize.height + layout.pocketInset * 2 + 8, 220);

    expect(hit.height).toBe(layout.panelY + pocketDepth + layout.pocketInset);
  });
});
