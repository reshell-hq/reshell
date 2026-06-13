import { EDGE_HANDLE_SIZE_PX } from "@/edge-slots/edge-slots";
import type { MenuSize, ShellLayout } from "./layout";

export const EDGE_HANDLE_HIT_PX = EDGE_HANDLE_SIZE_PX;
export const BUILTIN_RIM_HIT_PX = EDGE_HANDLE_HIT_PX;

export type HoverRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type StackedTrapInput = {
  handleCentersY: readonly number[];
  rimWidth: number;
  rimStartY: number;
  rimEndY: number;
  minHitPx?: number;
};

export function computeStackedLeftRimTraps({
  handleCentersY,
  rimWidth,
  rimStartY,
  rimEndY,
  minHitPx = EDGE_HANDLE_HIT_PX,
}: StackedTrapInput): HoverRect[] {
  return computeStackedRimTraps({
    handleCentersY,
    rimStart: 0,
    rimWidth,
    rimStartY,
    rimEndY,
    minHitPx,
  });
}

type StackedRimTrapInput = StackedTrapInput & {
  rimStart: number;
};

export function computeStackedRimTraps({
  handleCentersY,
  rimStart,
  rimWidth,
  rimStartY,
  rimEndY,
  minHitPx = EDGE_HANDLE_HIT_PX,
}: StackedRimTrapInput): HoverRect[] {
  if (handleCentersY.length === 0) {
    return [];
  }

  return handleCentersY.map((centerY, index) => {
    const prevBound = index === 0 ? rimStartY : (handleCentersY[index - 1]! + centerY) / 2;
    const nextBound =
      index === handleCentersY.length - 1 ? rimEndY : (centerY + handleCentersY[index + 1]!) / 2;

    const segmentHeight = nextBound - prevBound;
    const height = Math.max(segmentHeight, minHitPx);
    const top = segmentHeight >= minHitPx ? prevBound : centerY - minHitPx / 2;

    return {
      top,
      left: rimStart,
      width: Math.max(rimWidth, minHitPx),
      height,
    };
  });
}

type EdgeHoverBridgeInput = {
  handleCenterX: number;
  handleCenterY: number;
  flyoutCenterX: number;
  flyoutCenterY: number;
  menuWidth: number;
  menuHeight: number;
  handleHitPx?: number;
};

export function computeEdgeHoverBridge({
  handleCenterX,
  handleCenterY,
  flyoutCenterX,
  flyoutCenterY,
  menuWidth,
  menuHeight,
  handleHitPx = EDGE_HANDLE_HIT_PX,
}: EdgeHoverBridgeInput): HoverRect {
  const handleRadius = handleHitPx / 2;
  const handleRight = handleCenterX + handleRadius;
  const flyoutLeft = flyoutCenterX - menuWidth / 2;
  const flyoutTop = flyoutCenterY - menuHeight / 2;
  const flyoutBottom = flyoutCenterY + menuHeight / 2;

  const bridgeLeft = handleRight;
  const bridgeWidth = Math.max(12, flyoutLeft - handleRight);
  const bridgeTop = Math.min(handleCenterY - handleRadius, flyoutTop);
  const bridgeBottom = Math.max(handleCenterY + handleRadius, flyoutBottom);

  return {
    top: bridgeTop,
    left: bridgeLeft,
    width: bridgeWidth,
    height: bridgeBottom - bridgeTop,
  };
}

export function computeRightEdgeHoverBridge({
  handleCenterX,
  handleCenterY,
  flyoutCenterX,
  flyoutCenterY,
  menuWidth,
  menuHeight,
  handleHitPx = EDGE_HANDLE_HIT_PX,
}: EdgeHoverBridgeInput): HoverRect {
  const handleRadius = handleHitPx / 2;
  const handleLeft = handleCenterX - handleRadius;
  const flyoutRight = flyoutCenterX + menuWidth / 2;
  const flyoutTop = flyoutCenterY - menuHeight / 2;
  const flyoutBottom = flyoutCenterY + menuHeight / 2;

  const bridgeLeft = flyoutRight;
  const bridgeWidth = Math.max(12, handleLeft - flyoutRight);
  const bridgeTop = Math.min(handleCenterY - handleRadius, flyoutTop);
  const bridgeBottom = Math.max(handleCenterY + handleRadius, flyoutBottom);

  return {
    top: bridgeTop,
    left: bridgeLeft,
    width: bridgeWidth,
    height: bridgeBottom - bridgeTop,
  };
}

export function shouldEnableHoverBridge(
  activeZoneId: string | null,
  zoneId: string,
  closing: boolean,
  overIcon: boolean,
  overMenu: boolean,
  revealProgress: number,
): boolean {
  if (closing || activeZoneId !== zoneId) {
    return false;
  }
  return overIcon || overMenu || revealProgress >= 0.04;
}

export function computeTopDashboardRimHit(
  layout: ShellLayout,
  menuSize: MenuSize,
  expanded: boolean,
): HoverRect {
  const halfSpan = Math.min(layout.panelW * 0.42, 480);
  const pocketDepth = Math.max(menuSize.height + layout.pocketInset * 2 + 8, 220);
  const centerX = layout.panelX + layout.panelW * 0.5;
  const restingHeight = Math.max(layout.frameTop, BUILTIN_RIM_HIT_PX);
  const height = expanded ? layout.panelY + pocketDepth + layout.pocketInset : restingHeight;

  return {
    top: 0,
    left: centerX - halfSpan,
    width: halfSpan * 2,
    height,
  };
}
