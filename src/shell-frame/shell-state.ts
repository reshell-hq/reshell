import type { MenuSize, ShellZoneLayout } from "./layout";
import type { ShellRim } from "./rim";

export type ShellAnimationSnapshot = {
  activeZoneId: string | null;
  previousZoneId: string | null;
  closing: boolean;
  pinned: boolean;
  t: number;
  anchor: number;
  targetAnchor: number;
  span: number;
  targetSpan: number;
  depth: number;
  targetDepth: number;
  renderRim: ShellRim;
  lastRim: ShellRim;
  overIcon: boolean;
  overMenu: boolean;
};

export type ShellState = ShellAnimationSnapshot & {
  menuSizes: Map<string, MenuSize>;
  closeTimer: ReturnType<typeof setTimeout> | null;
};

export function createInitialShellState(): ShellState {
  return {
    activeZoneId: null,
    previousZoneId: null,
    closing: false,
    pinned: false,
    t: 0,
    anchor: 0,
    targetAnchor: 0,
    span: 100,
    targetSpan: 100,
    depth: 140,
    targetDepth: 140,
    renderRim: "left",
    lastRim: "left",
    menuSizes: new Map(),
    overIcon: false,
    overMenu: false,
    closeTimer: null,
  };
}

let shellState: ShellState = createInitialShellState();
let latestZones: ShellZoneLayout[] = [];
const listeners = new Set<() => void>();

export function setLatestShellZones(zones: ShellZoneLayout[]) {
  latestZones = zones;
}

export function getLatestShellZones(): ShellZoneLayout[] {
  return latestZones;
}

export function getShellState(): ShellState {
  return shellState;
}

export function subscribeShellState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitShellState() {
  for (const listener of listeners) {
    listener();
  }
}

/** Hot-path animation fields — mutated each rAF without waking React. */
export function patchAnimationState(patch: Partial<ShellAnimationSnapshot>) {
  Object.assign(shellState, patch);
}

export function patchShellState(patch: Partial<ShellState>) {
  shellState = { ...shellState, ...patch };
  emitShellState();
}

/** Updates cached menu dimensions without waking React (read in rAF only). */
export function setMenuSize(groupId: string, size: MenuSize): boolean {
  const existing = shellState.menuSizes.get(groupId);
  if (existing?.width === size.width && existing?.height === size.height) {
    return false;
  }
  shellState.menuSizes.set(groupId, size);
  return true;
}

export function resetShellState() {
  if (shellState.closeTimer) {
    clearTimeout(shellState.closeTimer);
  }
  shellState = createInitialShellState();
  emitShellState();
}
