import { NOTCH_ANIMATION, NOTCH_LIMITS } from "./constants";
import { isSettled, lerp } from "./easing";
import type { NotchPlacement, NotchSize } from "./types";

export type NotchAnimationTarget = {
  placement: NotchPlacement | null;
  size: NotchSize;
};

export type NotchAnimationSnapshot = NotchAnimationTarget & {
  isHovering: boolean;
};

function openTarget(placement: NotchPlacement): NotchAnimationTarget {
  return {
    placement,
    size: {
      depth: NOTCH_LIMITS.maxDepth,
      halfExtent: NOTCH_LIMITS.maxHalfExtent,
    },
  };
}

function closedTarget(
  placement: NotchPlacement | null,
): NotchAnimationTarget {
  return {
    placement,
    size: { depth: 0, halfExtent: 0 },
  };
}

export function createNotchAnimationController() {
  let snapshot: NotchAnimationSnapshot = {
    isHovering: false,
    placement: null,
    size: { depth: 0, halfExtent: 0 },
  };

  let target: NotchAnimationTarget = closedTarget(null);
  let frameId = 0;
  let onFrame: ((snapshot: NotchAnimationSnapshot) => void) | null = null;

  const { smoothing, settleThreshold } = NOTCH_ANIMATION;

  function emitFrame() {
    onFrame?.(snapshot);
  }

  function step() {
    snapshot.size = {
      depth: lerp(snapshot.size.depth, target.size.depth, smoothing),
      halfExtent: lerp(
        snapshot.size.halfExtent,
        target.size.halfExtent,
        smoothing,
      ),
    };

    if (target.placement) {
      snapshot.placement = target.placement;
    }

    const depthSettled = isSettled(
      snapshot.size.depth,
      target.size.depth,
      settleThreshold,
    );
    const extentSettled = isSettled(
      snapshot.size.halfExtent,
      target.size.halfExtent,
      settleThreshold,
    );

    if (depthSettled && extentSettled) {
      snapshot.size = { ...target.size };

      if (!snapshot.isHovering && target.size.depth === 0) {
        snapshot.placement = null;
      }

      frameId = 0;
      emitFrame();
      return;
    }

    emitFrame();
    frameId = requestAnimationFrame(step);
  }

  function ensureLoopRunning() {
    if (frameId === 0) {
      frameId = requestAnimationFrame(step);
    }
  }

  return {
    getSnapshot: () => snapshot,

    setFrameListener(listener: (snapshot: NotchAnimationSnapshot) => void) {
      onFrame = listener;
    },

    hover(placement: NotchPlacement) {
      snapshot.isHovering = true;
      target = openTarget(placement);
      snapshot.placement = placement;
      ensureLoopRunning();
    },

    move(placement: NotchPlacement) {
      target.placement = placement;
      snapshot.placement = placement;
      ensureLoopRunning();
    },

    leave() {
      snapshot.isHovering = false;
      target = closedTarget(snapshot.placement);
      ensureLoopRunning();
    },

    snapOpen(placement: NotchPlacement) {
      snapshot = {
        isHovering: true,
        placement,
        size: {
          depth: NOTCH_LIMITS.maxDepth,
          halfExtent: NOTCH_LIMITS.maxHalfExtent,
        },
      };
      target = openTarget(placement);
      emitFrame();
    },

    snapClosed() {
      snapshot = {
        isHovering: false,
        placement: null,
        size: { depth: 0, halfExtent: 0 },
      };
      target = closedTarget(null);
      emitFrame();
    },

    dispose() {
      if (frameId !== 0) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      onFrame = null;
    },
  };
}

export type NotchAnimationController = ReturnType<
  typeof createNotchAnimationController
>;
