import { internalToolZoneId } from "@/internal-tools/types";
import { getShellLayout, getTargetPocketForZone, type ShellZoneLayout } from "./layout";
import {
  getLatestShellZones,
  getShellState,
  patchAnimationState,
  patchShellState,
} from "./shell-state";

const OPEN_DELAY_MS = 100;
const CLOSE_DELAY_MS = 320;

let openTimer: ReturnType<typeof setTimeout> | null = null;

function cancelScheduledClose() {
  const state = getShellState();
  if (state.closeTimer) {
    clearTimeout(state.closeTimer);
    patchShellState({ closeTimer: null });
  }
}

function scheduleClose() {
  cancelScheduledClose();
  const timer = setTimeout(() => {
    const state = getShellState();
    if (!state.pinned && !state.overIcon && !state.overMenu) {
      clearActiveZone();
    }
  }, CLOSE_DELAY_MS);
  patchShellState({ closeTimer: timer });
}

export function cancelOpenIntent() {
  if (openTimer) {
    clearTimeout(openTimer);
    openTimer = null;
  }
}

export function requestActivateZone(zoneId: string, zones: ShellZoneLayout[]): void {
  const zone = zones.find((entry) => entry.id === zoneId);
  if (!zone) {
    return;
  }

  const state = getShellState();
  if (state.activeZoneId === zoneId && !state.closing) {
    cancelOpenIntent();
    cancelScheduledClose();
    return;
  }

  cancelOpenIntent();

  const switchWhileOpen =
    state.activeZoneId && !state.closing && state.t > 0.45 && state.lastRim === zone.rim;

  if (switchWhileOpen) {
    activateZone(zoneId, zones);
    return;
  }

  openTimer = setTimeout(() => {
    openTimer = null;
    activateZone(zoneId, zones);
  }, OPEN_DELAY_MS);
}

export function activateZone(zoneId: string, zones: ShellZoneLayout[]): void {
  cancelOpenIntent();

  const zone = zones.find((entry) => entry.id === zoneId);
  if (!zone) {
    return;
  }

  const state = getShellState();
  if (state.activeZoneId === zoneId && !state.closing) {
    return;
  }

  const layout = getShellLayout();
  const menuSize = state.menuSizes.get(zoneId) ?? { width: 170, height: 130 };
  const target = getTargetPocketForZone(zone, menuSize, layout);

  const openingFromClosed = !state.activeZoneId && !state.closing && state.t < 0.08;

  patchShellState({
    previousZoneId: state.activeZoneId,
    activeZoneId: zoneId,
    closing: false,
    renderRim: zone.rim,
    lastRim: zone.rim,
    targetAnchor: target.anchor,
    targetSpan: target.span,
    targetDepth: target.depth,
    ...(openingFromClosed
      ? {
          anchor: target.anchor,
          span: target.span,
          depth: target.depth,
        }
      : {}),
  });
}

export function clearActiveZone(): void {
  cancelOpenIntent();

  const state = getShellState();
  if (!state.activeZoneId) {
    return;
  }

  const zones = getLatestShellZones();
  const zone = zones.find((entry) => entry.id === state.activeZoneId);
  if (!zone) {
    patchShellState({
      previousZoneId: state.activeZoneId,
      activeZoneId: null,
      closing: true,
      pinned: false,
    });
    return;
  }

  const layout = getShellLayout();
  const menuSize = state.menuSizes.get(zone.id) ?? { width: 170, height: 130 };
  const target = getTargetPocketForZone(zone, menuSize, layout);

  patchShellState({
    previousZoneId: state.activeZoneId,
    activeZoneId: null,
    closing: true,
    pinned: false,
    renderRim: zone.rim,
    lastRim: zone.rim,
    targetAnchor: target.anchor,
    targetSpan: target.span,
    targetDepth: target.depth,
  });
}

export function setZoneHover(kind: "icon" | "menu" | "rim" | "bridge", active: boolean) {
  if (kind === "icon" || kind === "rim" || kind === "bridge") {
    patchShellState({ overIcon: active });
    if (active) {
      cancelScheduledClose();
    } else {
      scheduleClose();
    }
    return;
  }

  patchShellState({ overMenu: active });
  if (active) {
    cancelScheduledClose();
  } else {
    scheduleClose();
  }
}

export function leaveZoneHover(kind: "icon" | "menu" | "rim" | "bridge") {
  cancelOpenIntent();
  if (kind === "menu") {
    patchShellState({ overMenu: false });
  } else {
    patchShellState({ overIcon: false });
  }
  scheduleClose();
}

export function toggleZonePin(zoneId: string, zones: ShellZoneLayout[]) {
  const zone = zones.find((entry) => entry.id === zoneId);
  if (!zone || (zone.kind !== "edge-group" && zone.kind !== "internal-tool")) {
    return;
  }

  const state = getShellState();
  if (state.pinned && state.activeZoneId === zoneId) {
    patchShellState({ pinned: false });
    scheduleClose();
    return;
  }

  activateZone(zoneId, zones);
  patchShellState({ pinned: true });
  cancelScheduledClose();
}

export function pinInternalToolZone(toolId: "pomodoro" | "tasks", zones: ShellZoneLayout[]): void {
  const zoneId = internalToolZoneId(toolId);
  const zone = zones.find((entry) => entry.id === zoneId);
  if (!zone || zone.kind !== "internal-tool") {
    return;
  }

  activateZone(zoneId, zones);
  patchShellState({ pinned: true });
  cancelScheduledClose();
}

export function dismissPinnedZone() {
  patchShellState({ pinned: false });
  clearActiveZone();
}

export function syncActiveZonePocket(zoneId: string) {
  const state = getShellState();
  if (state.activeZoneId !== zoneId || state.closing) {
    return;
  }

  const zone = getLatestShellZones().find((entry) => entry.id === zoneId);
  if (!zone) {
    return;
  }

  const layout = getShellLayout();
  const menuSize = state.menuSizes.get(zoneId) ?? { width: 170, height: 130 };
  const target = getTargetPocketForZone(zone, menuSize, layout);

  if (
    state.targetAnchor === target.anchor &&
    state.targetSpan === target.span &&
    state.targetDepth === target.depth
  ) {
    return;
  }

  patchAnimationState({
    targetAnchor: target.anchor,
    targetSpan: target.span,
    targetDepth: target.depth,
  });
}
