import { NOTCH_ANIMATION } from "./constants";
import { isSettled, lerp } from "./easing";
import type { NotchSpec, SlotAnchor, SlotExtent } from "./types";

type AnimationState = {
  anchor: SlotAnchor | null;
  extent: SlotExtent;
};

function closedState(anchor: SlotAnchor | null = null): AnimationState {
  return {
    anchor,
    extent: { depth: 0, halfExtent: 0 },
  };
}

function toNotchSpec(state: AnimationState): NotchSpec | null {
  if (!state.anchor) {
    return null;
  }

  if (state.extent.depth === 0 && state.extent.halfExtent === 0) {
    return null;
  }

  return { ...state.anchor, ...state.extent };
}

export function createShellNotchAnimationController() {
  let current: AnimationState = closedState();
  let target: AnimationState = closedState();
  let frameId = 0;
  let onFrame: ((notch: NotchSpec | null) => void) | null = null;

  const { smoothing, settleThreshold } = NOTCH_ANIMATION;

  function emitFrame() {
    onFrame?.(toNotchSpec(current));
  }

  function step() {
    current.extent = {
      depth: lerp(current.extent.depth, target.extent.depth, smoothing),
      halfExtent: lerp(
        current.extent.halfExtent,
        target.extent.halfExtent,
        smoothing,
      ),
    };

    const depthSettled = isSettled(
      current.extent.depth,
      target.extent.depth,
      settleThreshold,
    );
    const extentSettled = isSettled(
      current.extent.halfExtent,
      target.extent.halfExtent,
      settleThreshold,
    );

    if (depthSettled && extentSettled) {
      current.extent = { ...target.extent };

      if (target.extent.depth === 0) {
        current.anchor = target.anchor;
        if (current.extent.depth === 0) {
          current.anchor = null;
        }
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
    getAnimatedNotch(): NotchSpec | null {
      return toNotchSpec(current);
    },

    setFrameListener(listener: (notch: NotchSpec | null) => void) {
      onFrame = listener;
    },

    setTarget(notch: NotchSpec | null) {
      if (notch) {
        target = {
          anchor: { edge: notch.edge, center: notch.center },
          extent: { depth: notch.depth, halfExtent: notch.halfExtent },
        };
        current.anchor = { edge: notch.edge, center: notch.center };
        ensureLoopRunning();
        return;
      }

      target = closedState(current.anchor);
      ensureLoopRunning();
    },

    snapTo(notch: NotchSpec | null) {
      if (notch) {
        current = {
          anchor: { edge: notch.edge, center: notch.center },
          extent: { depth: notch.depth, halfExtent: notch.halfExtent },
        };
        target = { ...current };
      } else {
        current = closedState();
        target = closedState();
      }

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

export type ShellNotchAnimationController = ReturnType<
  typeof createShellNotchAnimationController
>;
