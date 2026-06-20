import { NOTCH_ANIMATION } from "./constants";
import type { NotchSpec, ShellEdge, SlotExtent } from "./types";

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

function isSettled(
  current: number,
  target: number,
  threshold: number,
): boolean {
  return Math.abs(current - target) < threshold;
}

const ZERO_BOX: SlotExtent = { depth: 0, halfExtent: 0 };

/**
 * Animated notch state. `box` is the full-size target extent; the visible
 * cavity is `box × progress`, so a single `progress` scalar (0→1) drives both
 * the pocket size and the content scale. `center`/`edge` let the pocket slide
 * along a single edge between slots (see docs/adr/0002, docs/adr/0003).
 */
type AnimState = {
  edge: ShellEdge | null;
  center: number;
  box: SlotExtent;
  progress: number;
};

type AnimTarget = AnimState;

/** Emitted each frame: the cavity (box × progress) plus the raw progress. */
export type ShellAnimationFrame = {
  notch: NotchSpec | null;
  progress: number;
};

function closedState(): AnimState {
  return { edge: null, center: 0, box: { ...ZERO_BOX }, progress: 0 };
}

function frameOf(state: AnimState): ShellAnimationFrame {
  if (!state.edge || state.progress <= 0.0001) {
    return { notch: null, progress: 0 };
  }

  return {
    notch: {
      edge: state.edge,
      center: state.center,
      depth: state.box.depth * state.progress,
      halfExtent: state.box.halfExtent * state.progress,
    },
    progress: state.progress,
  };
}

export function createShellNotchAnimationController() {
  let current: AnimState = closedState();
  let target: AnimTarget = closedState();
  // A cross-edge open queued behind the current pocket's collapse.
  let pending: NotchSpec | null = null;
  let frameId = 0;
  let onFrame: ((frame: ShellAnimationFrame) => void) | null = null;

  const { smoothing, settleThreshold } = NOTCH_ANIMATION;

  function emitFrame() {
    onFrame?.(frameOf(current));
  }

  function openTo(notch: NotchSpec) {
    target = {
      edge: notch.edge,
      center: notch.center,
      box: { depth: notch.depth, halfExtent: notch.halfExtent },
      progress: 1,
    };
  }

  function beginClose() {
    target = {
      edge: current.edge,
      center: current.center,
      box: { ...current.box },
      progress: 0,
    };
  }

  // Snap geometry to a new anchor so progress can grow from its current value
  // without the pocket sliding in from a stale position.
  function adoptForOpen(notch: NotchSpec) {
    current.edge = notch.edge;
    current.center = notch.center;
    current.box = { depth: notch.depth, halfExtent: notch.halfExtent };
    openTo(notch);
  }

  function step() {
    current.center = lerp(current.center, target.center, smoothing);
    current.box = {
      depth: lerp(current.box.depth, target.box.depth, smoothing),
      halfExtent: lerp(
        current.box.halfExtent,
        target.box.halfExtent,
        smoothing,
      ),
    };
    current.progress = lerp(current.progress, target.progress, smoothing);

    const settled =
      isSettled(current.progress, target.progress, settleThreshold) &&
      isSettled(current.center, target.center, settleThreshold) &&
      isSettled(current.box.depth, target.box.depth, settleThreshold) &&
      isSettled(current.box.halfExtent, target.box.halfExtent, settleThreshold);

    if (!settled) {
      emitFrame();
      frameId = requestAnimationFrame(step);
      return;
    }

    current.center = target.center;
    current.box = { ...target.box };
    current.progress = target.progress;

    if (target.progress === 0) {
      if (pending) {
        const next = pending;
        pending = null;
        adoptForOpen(next);
        emitFrame();
        frameId = requestAnimationFrame(step);
        return;
      }
      current = closedState();
    }

    frameId = 0;
    emitFrame();
  }

  function ensureLoopRunning() {
    if (frameId === 0) {
      frameId = requestAnimationFrame(step);
    }
  }

  return {
    getAnimatedFrame(): ShellAnimationFrame {
      return frameOf(current);
    },

    setTarget(notch: NotchSpec | null) {
      if (!notch) {
        pending = null;
        beginClose();
        ensureLoopRunning();
        return;
      }

      const isOpen =
        current.edge !== null && current.progress > settleThreshold;

      if (!isOpen) {
        pending = null;
        adoptForOpen(notch);
        ensureLoopRunning();
        return;
      }

      if (notch.edge === current.edge) {
        // Same edge while open: morph center/box, stay open (slide).
        pending = null;
        openTo(notch);
        ensureLoopRunning();
        return;
      }

      // Cross-edge while open: collapse here, then grow on the new edge.
      pending = notch;
      beginClose();
      ensureLoopRunning();
    },

    snapTo(notch: NotchSpec | null) {
      pending = null;
      if (notch) {
        current = {
          edge: notch.edge,
          center: notch.center,
          box: { depth: notch.depth, halfExtent: notch.halfExtent },
          progress: 1,
        };
        target = { ...current, box: { ...current.box } };
      } else {
        current = closedState();
        target = closedState();
      }

      emitFrame();
    },

    setFrameListener(listener: (frame: ShellAnimationFrame) => void) {
      onFrame = listener;
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
