"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { resolveEdgeHandleDisplay } from "@/edge-handle/edge-handle";
import {
  computeEdgeSlotCenters,
  computeMaxEdgeSlotCount,
  nearestSlotIndex,
  slotIndexToInsertIndex,
} from "@/edge-slots/edge-slots";
import { parseInternalToolZoneId, resolveInternalToolHandle } from "@/internal-tools/handles";
import type { WorkspaceInternalTools } from "@/internal-tools/types";
import type { Library } from "@/library/types";
import { resolveEdgeGroupFlyout, resolveEdgeGroups } from "@/placement/placement";
import { buildShellZones } from "@/shell-frame/build-zones";
import {
  computeEdgeHoverBridge,
  computeRightEdgeHoverBridge,
  computeStackedLeftRimTraps,
  computeStackedRimTraps,
  computeTopDashboardRimHit,
  shouldEnableHoverBridge,
} from "@/shell-frame/edge-hover-zones";
import {
  getFlyoutRevealProgress,
  getSearchNotchInnerWidth,
  getShellLayout,
  getSurfacePocketFit,
  getSurfacePosition,
  getSurfaceRevealStyle,
  isSurfacePointerActive,
  updateZonePositions,
  type ShellZoneLayout,
} from "@/shell-frame/layout";
import { BUILTIN_SURFACE } from "@/shell-frame/rim";
import { subscribeShellFrame } from "@/shell-frame/shell-animation";
import {
  getShellState,
  setLatestShellZones,
  setMenuSize,
  subscribeShellState,
} from "@/shell-frame/shell-state";
import {
  dismissPinnedZone,
  leaveZoneHover,
  requestActivateZone,
  setZoneHover,
  syncActiveZonePocket,
  toggleZonePin,
} from "@/shell-frame/shell-zones";
import { useLauncherStore } from "@/store/launcher-store";
import { CommandBar } from "./command-bar";
import { LinkItem } from "./link-item";
import { PomodoroFlyout } from "./pomodoro-flyout";
import { ShellDashboard } from "./shell-dashboard";
import { ShellSettingsButton } from "./shell-settings-button";
import { TasksFlyout } from "./tasks-flyout";

const DRAG_THRESHOLD_PX = 6;

type ShellEdgeLayerProps = {
  library: Library;
  onReorderGroup: (groupId: string, targetSlotIndex: number) => void;
  onSwitchWorkspace: (workspaceId: string) => void;
  onUpdateInternalTools: (internalTools: WorkspaceInternalTools) => void;
};

function groupById(library: Library, groupId: string) {
  return resolveEdgeGroups(library, "left").find((group) => group.id === groupId);
}

function defaultMenuSize(zoneId: string) {
  if (zoneId === BUILTIN_SURFACE.TOP_DASHBOARD) {
    return { width: 480, height: 260 };
  }
  if (zoneId === BUILTIN_SURFACE.BOTTOM_SEARCH) {
    return { width: 420, height: 52 };
  }
  if (zoneId === "__tool_tasks__") {
    return { width: 320, height: 420 };
  }
  if (zoneId === "__tool_pomodoro__") {
    return { width: 280, height: 380 };
  }
  return { width: 170, height: 130 };
}

export function ShellEdgeLayer({
  library,
  onReorderGroup,
  onSwitchWorkspace,
  onUpdateInternalTools,
}: ShellEdgeLayerProps) {
  const zones = useMemo(() => buildShellZones(library), [library]);
  const zonesRef = useRef(zones);
  zonesRef.current = zones;

  const [rimLayout, setRimLayout] = useState(getShellLayout);

  useEffect(() => {
    setLatestShellZones(zones);
    zonesRef.current = updateZonePositions(zones, getShellLayout());
  }, [zones]);

  const iconRefs = useRef(new Map<string, HTMLButtonElement>());
  const surfaceRefs = useRef(new Map<string, HTMLDivElement>());
  const measureSurfaceRef = useRef(new Map<string, () => void>());
  const bridgeRefs = useRef(new Map<string, HTMLDivElement>());
  const dragRef = useRef<{
    groupId: string;
    startAxis: number;
    dragged: boolean;
  } | null>(null);
  const openFromEdgeGroup = useLauncherStore((state) => state.openFromEdgeGroup);
  const shellState = useSyncExternalStore(subscribeShellState, getShellState, getShellState);
  const dashboardMenuSize =
    shellState.menuSizes.get(BUILTIN_SURFACE.TOP_DASHBOARD) ??
    defaultMenuSize(BUILTIN_SURFACE.TOP_DASHBOARD);
  const dashboardReveal =
    shellState.activeZoneId === BUILTIN_SURFACE.TOP_DASHBOARD ||
    (shellState.closing && shellState.previousZoneId === BUILTIN_SURFACE.TOP_DASHBOARD)
      ? getFlyoutRevealProgress(shellState)
      : 0;
  const topDashboardHit = computeTopDashboardRimHit(
    rimLayout,
    dashboardMenuSize,
    dashboardReveal > 0.04,
  );

  const activeWorkspace = library.workspaces.find(
    (workspace) => workspace.id === library.activeWorkspaceId,
  );

  const leftEdgeZones = useMemo(() => zones.filter((zone) => zone.kind === "edge-group"), [zones]);

  const leftRimTraps = useMemo(
    () =>
      computeStackedLeftRimTraps({
        handleCentersY: leftEdgeZones.map((zone) => zone.y),
        rimWidth: rimLayout.frameLeft,
        rimStartY: rimLayout.panelY + rimLayout.sidePadding,
        rimEndY: rimLayout.panelBottom - rimLayout.sidePadding,
      }),
    [leftEdgeZones, rimLayout],
  );

  const rightEdgeZones = useMemo(
    () => zones.filter((zone) => zone.kind === "internal-tool"),
    [zones],
  );

  const rightRimTraps = useMemo(
    () =>
      computeStackedRimTraps({
        handleCentersY: rightEdgeZones.map((zone) => zone.y),
        rimStart: rimLayout.w - rimLayout.frameRight,
        rimWidth: rimLayout.frameRight,
        rimStartY: rimLayout.panelY + rimLayout.sidePadding,
        rimEndY: rimLayout.panelBottom - rimLayout.sidePadding,
      }),
    [rightEdgeZones, rimLayout],
  );

  useEffect(() => {
    const observers: ResizeObserver[] = [];

    for (const zone of zones) {
      const element = surfaceRefs.current.get(zone.id);
      if (!element) {
        continue;
      }

      const measure = (forInitialLayout: boolean) => {
        if (forInitialLayout) {
          element.classList.add("measuring");
        }
        // offset* ignores CSS transforms; getBoundingClientRect includes the
        // per-frame scale on .shell-surface and can retrigger ResizeObserver forever.
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const changed = setMenuSize(zone.id, {
          width: Math.ceil(width),
          height: Math.ceil(height),
        });
        if (changed) {
          syncActiveZonePocket(zone.id);
        }
        if (forInitialLayout) {
          element.classList.remove("measuring");
        }
      };

      measure(true);
      measureSurfaceRef.current.set(zone.id, () => measure(false));
      const observer = new ResizeObserver(() => measure(false));
      observer.observe(element);
      observers.push(observer);
    }

    return () => {
      measureSurfaceRef.current.clear();
      for (const observer of observers) {
        observer.disconnect();
      }
    };
  }, [zones, library]);

  useEffect(() => {
    return subscribeShellFrame(({ layout: frameLayout, pocket }) => {
      const positioned = updateZonePositions(zonesRef.current, frameLayout);
      const state = getShellState();
      const flyoutReveal = getFlyoutRevealProgress(state);

      function zoneReveal(zoneId: string) {
        if (state.closing && zoneId === state.previousZoneId) {
          return flyoutReveal;
        }
        if (!state.closing && zoneId === state.activeZoneId) {
          return flyoutReveal;
        }
        return 0;
      }

      for (const zone of positioned) {
        const icon = iconRefs.current.get(zone.id);
        if (icon) {
          icon.style.left = `${zone.x}px`;
          icon.style.top = `${zone.y}px`;
          icon.classList.toggle("active", zone.id === state.activeZoneId);
        }

        const surface = surfaceRefs.current.get(zone.id);
        const menuSize = state.menuSizes.get(zone.id) ?? defaultMenuSize(zone.id);
        if (!surface) {
          continue;
        }

        const { x, y } = getSurfacePosition(frameLayout, pocket, zone, menuSize);
        surface.style.left = `${x}px`;
        surface.style.top = `${y}px`;

        if (zone.kind === "search" && pocket.rim === "bottom" && pocket.active) {
          surface.style.width = `${getSearchNotchInnerWidth(pocket)}px`;
        } else {
          surface.style.width = "";
        }

        const zoneProgress = zoneReveal(zone.id);
        const pocketFit = getSurfacePocketFit(pocket, zone, menuSize, frameLayout);
        const surfaceReveal = getSurfaceRevealStyle(zoneProgress, pocketFit);
        surface.style.opacity = `${surfaceReveal.opacity}`;
        surface.style.transform = `translate(-50%, -50%) scale(${surfaceReveal.scale})`;

        const pointerActive = isSurfacePointerActive(
          state.activeZoneId,
          zone.id,
          surfaceReveal.progress,
          state.closing,
          state.previousZoneId,
        );
        surface.style.pointerEvents = pointerActive ? "auto" : "none";
        surface.classList.toggle("visible", surfaceReveal.progress > 0.04);

        if (zone.kind === "edge-group") {
          const bridge = bridgeRefs.current.get(zone.id);
          if (bridge) {
            const bridgeRect = computeEdgeHoverBridge({
              handleCenterX: zone.x,
              handleCenterY: zone.y,
              flyoutCenterX: x,
              flyoutCenterY: y,
              menuWidth: menuSize.width,
              menuHeight: menuSize.height,
            });

            bridge.style.left = `${bridgeRect.left}px`;
            bridge.style.top = `${bridgeRect.top}px`;
            bridge.style.width = `${bridgeRect.width}px`;
            bridge.style.height = `${bridgeRect.height}px`;
            bridge.style.pointerEvents = shouldEnableHoverBridge(
              state.activeZoneId,
              zone.id,
              state.closing,
              state.overIcon,
              state.overMenu,
              surfaceReveal.progress,
            )
              ? "auto"
              : "none";
            bridge.style.opacity = state.activeZoneId === zone.id && !state.closing ? "1" : "0";
          }
        }

        if (zone.kind === "internal-tool") {
          const bridge = bridgeRefs.current.get(zone.id);
          if (bridge) {
            const bridgeRect = computeRightEdgeHoverBridge({
              handleCenterX: zone.x,
              handleCenterY: zone.y,
              flyoutCenterX: x,
              flyoutCenterY: y,
              menuWidth: menuSize.width,
              menuHeight: menuSize.height,
            });

            bridge.style.left = `${bridgeRect.left}px`;
            bridge.style.top = `${bridgeRect.top}px`;
            bridge.style.width = `${bridgeRect.width}px`;
            bridge.style.height = `${bridgeRect.height}px`;
            bridge.style.pointerEvents = shouldEnableHoverBridge(
              state.activeZoneId,
              zone.id,
              state.closing,
              state.overIcon,
              state.overMenu,
              surfaceReveal.progress,
            )
              ? "auto"
              : "none";
            bridge.style.opacity = state.activeZoneId === zone.id && !state.closing ? "1" : "0";
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    function handleResize() {
      setRimLayout(getShellLayout());
      zonesRef.current = updateZonePositions(zonesRef.current, getShellLayout());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function finishDrag(groupId: string, axisPx: number) {
    const groups = resolveEdgeGroups(library, "left");
    const maxSlots = computeMaxEdgeSlotCount(window.innerHeight);
    const slotCenters = computeEdgeSlotCenters(maxSlots, window.innerHeight);
    const targetSlot = nearestSlotIndex(axisPx, slotCenters);
    const insertIndex = slotIndexToInsertIndex(targetSlot, groups.length, maxSlots);
    onReorderGroup(groupId, insertIndex);
  }

  function renderRimHit(zoneId: string, className: string, style: CSSProperties) {
    return (
      <div
        className={`shell-rim-hit ${className}`}
        style={style}
        onMouseEnter={() => {
          setZoneHover("rim", true);
          requestActivateZone(zoneId, zonesRef.current);
        }}
        onMouseLeave={() => leaveZoneHover("rim")}
      />
    );
  }

  function renderZoneChrome(zone: ShellZoneLayout) {
    if (zone.kind === "dashboard" || zone.kind === "search") {
      return null;
    }

    if (zone.kind === "internal-tool") {
      const toolId = parseInternalToolZoneId(zone.id);
      if (!toolId || !activeWorkspace) {
        return null;
      }

      const handle = resolveInternalToolHandle(toolId);

      return (
        <div key={`chrome-${zone.id}`}>
          <button
            ref={(node) => {
              if (node) {
                iconRefs.current.set(zone.id, node);
              } else {
                iconRefs.current.delete(zone.id);
              }
            }}
            type="button"
            className="shell-icon-btn shell-icon-btn-ghost"
            style={{ left: zone.x, top: zone.y }}
            aria-label={handle.label}
            onMouseEnter={() => {
              setZoneHover("icon", true);
              requestActivateZone(zone.id, zonesRef.current);
            }}
            onMouseLeave={() => leaveZoneHover("icon")}
            onFocus={() => {
              setZoneHover("icon", true);
              requestActivateZone(zone.id, zonesRef.current);
            }}
            onBlur={() => leaveZoneHover("icon")}
            onClick={() => toggleZonePin(zone.id, zonesRef.current)}
          >
            <span className="shell-icon-glyph">{handle.glyph}</span>
          </button>

          <div
            ref={(node) => {
              if (node) {
                bridgeRefs.current.set(zone.id, node);
              } else {
                bridgeRefs.current.delete(zone.id);
              }
            }}
            className="shell-hover-bridge"
            aria-hidden
            onMouseEnter={() => setZoneHover("bridge", true)}
            onMouseLeave={() => leaveZoneHover("bridge")}
          />
        </div>
      );
    }

    if (zone.kind !== "edge-group") {
      return null;
    }

    const group = groupById(library, zone.id);
    if (!group) {
      return null;
    }

    const display = resolveEdgeHandleDisplay(group);

    return (
      <div key={`chrome-${zone.id}`}>
        <button
          ref={(node) => {
            if (node) {
              iconRefs.current.set(zone.id, node);
            } else {
              iconRefs.current.delete(zone.id);
            }
          }}
          type="button"
          className="shell-icon-btn"
          style={{ left: zone.x, top: zone.y }}
          aria-label={group.name}
          onMouseEnter={() => {
            setZoneHover("icon", true);
            requestActivateZone(zone.id, zonesRef.current);
          }}
          onMouseLeave={() => leaveZoneHover("icon")}
          onFocus={() => {
            setZoneHover("icon", true);
            requestActivateZone(zone.id, zonesRef.current);
          }}
          onBlur={() => leaveZoneHover("icon")}
          onClick={() => toggleZonePin(zone.id, zonesRef.current)}
          onPointerDown={(event) => {
            dragRef.current = {
              groupId: zone.id,
              startAxis: event.clientY,
              dragged: false,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.groupId !== zone.id) {
              return;
            }
            if (Math.abs(event.clientY - drag.startAxis) > DRAG_THRESHOLD_PX) {
              drag.dragged = true;
            }
          }}
          onPointerUp={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.groupId !== zone.id) {
              return;
            }
            event.currentTarget.releasePointerCapture(event.pointerId);
            if (drag.dragged) {
              finishDrag(zone.id, event.clientY);
            }
            dragRef.current = null;
          }}
        >
          {display.kind === "image" ? (
            <img src={display.url} alt="" className="shell-icon-image" />
          ) : (
            <span className="shell-icon-glyph">{display.text}</span>
          )}
        </button>

        <div
          ref={(node) => {
            if (node) {
              bridgeRefs.current.set(zone.id, node);
            } else {
              bridgeRefs.current.delete(zone.id);
            }
          }}
          className="shell-hover-bridge"
          aria-hidden
          onMouseEnter={() => setZoneHover("bridge", true)}
          onMouseLeave={() => leaveZoneHover("bridge")}
        />
      </div>
    );
  }

  function renderZoneMenu(zone: ShellZoneLayout) {
    if (zone.kind === "dashboard") {
      return (
        <div
          key={zone.id}
          ref={(node) => {
            if (node) {
              surfaceRefs.current.set(zone.id, node);
            } else {
              surfaceRefs.current.delete(zone.id);
            }
          }}
          className="shell-surface shell-surface-dashboard"
          onMouseEnter={() => setZoneHover("menu", true)}
          onMouseLeave={() => leaveZoneHover("menu")}
        >
          <ShellDashboard library={library} onSwitchWorkspace={onSwitchWorkspace} />
        </div>
      );
    }

    if (zone.kind === "search") {
      return (
        <div
          key={zone.id}
          ref={(node) => {
            if (node) {
              surfaceRefs.current.set(zone.id, node);
            } else {
              surfaceRefs.current.delete(zone.id);
            }
          }}
          className="shell-surface shell-surface-search"
          onMouseEnter={() => setZoneHover("menu", true)}
          onMouseLeave={() => leaveZoneHover("menu")}
        >
          <CommandBar
            library={library}
            variant="pocket"
            onSwitchWorkspace={onSwitchWorkspace}
            onFocusChange={(focused) => setZoneHover("menu", focused)}
            onContentChange={() => measureSurfaceRef.current.get(BUILTIN_SURFACE.BOTTOM_SEARCH)?.()}
          />
        </div>
      );
    }

    if (zone.kind === "internal-tool") {
      const toolId = parseInternalToolZoneId(zone.id);
      if (!toolId || !activeWorkspace) {
        return null;
      }

      const internalTools = activeWorkspace.internalTools;

      return (
        <div
          key={zone.id}
          ref={(node) => {
            if (node) {
              surfaceRefs.current.set(zone.id, node);
            } else {
              surfaceRefs.current.delete(zone.id);
            }
          }}
          className="shell-surface shell-flyout shell-internal-tool-surface"
          onMouseEnter={() => setZoneHover("menu", true)}
          onMouseLeave={() => leaveZoneHover("menu")}
        >
          {toolId === "pomodoro" ? (
            <PomodoroFlyout internalTools={internalTools} onChange={onUpdateInternalTools} />
          ) : (
            <TasksFlyout internalTools={internalTools} onChange={onUpdateInternalTools} />
          )}
          {shellState.pinned && shellState.activeZoneId === zone.id ? (
            <button
              type="button"
              className="shell-flyout-dismiss"
              onClick={() => dismissPinnedZone()}
            >
              Dismiss
            </button>
          ) : null}
        </div>
      );
    }

    if (zone.kind !== "edge-group") {
      return null;
    }

    const group = groupById(library, zone.id);
    if (!group) {
      return null;
    }

    const { links, hasMore } = resolveEdgeGroupFlyout(library, "left", zone.id);

    return (
      <div
        key={zone.id}
        ref={(node) => {
          if (node) {
            surfaceRefs.current.set(zone.id, node);
          } else {
            surfaceRefs.current.delete(zone.id);
          }
        }}
        className="shell-surface shell-flyout"
        onMouseEnter={() => setZoneHover("menu", true)}
        onMouseLeave={() => leaveZoneHover("menu")}
      >
        <p className="shell-flyout-title">{group.name}</p>
        {links.map((link) => (
          <LinkItem key={link.id} link={link} />
        ))}
        {hasMore ? (
          <button
            type="button"
            className="shell-flyout-more"
            onClick={() => openFromEdgeGroup("left", zone.id)}
          >
            See more…
          </button>
        ) : null}
        {shellState.pinned && shellState.activeZoneId === zone.id ? (
          <button
            type="button"
            className="shell-flyout-dismiss"
            onClick={() => dismissPinnedZone()}
          >
            Dismiss
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="shell-edge-chrome pointer-events-none absolute inset-0 z-[15]">
        {renderRimHit(BUILTIN_SURFACE.TOP_DASHBOARD, "shell-rim-hit-top", {
          top: topDashboardHit.top,
          left: topDashboardHit.left,
          width: topDashboardHit.width,
          height: topDashboardHit.height,
        })}
        {renderRimHit(BUILTIN_SURFACE.BOTTOM_SEARCH, "shell-rim-hit-bottom", {
          bottom: 0,
          left: 0,
          right: 0,
          height: rimLayout.frameBottom,
        })}

        <ShellSettingsButton />

        {leftEdgeZones.map((zone, index) => {
          const trap = leftRimTraps[index];
          if (!trap) {
            return null;
          }

          return (
            <div
              key={`left-rim-${zone.id}`}
              className="shell-rim-hit shell-edge-rim-hit"
              style={{
                top: trap.top,
                left: trap.left,
                width: trap.width,
                height: trap.height,
              }}
              onMouseEnter={() => {
                setZoneHover("rim", true);
                requestActivateZone(zone.id, zonesRef.current);
              }}
              onMouseLeave={() => leaveZoneHover("rim")}
            />
          );
        })}

        {rightEdgeZones.map((zone, index) => {
          const trap = rightRimTraps[index];
          if (!trap) {
            return null;
          }

          return (
            <div
              key={`right-rim-${zone.id}`}
              className="shell-rim-hit shell-edge-rim-hit"
              style={{
                top: trap.top,
                left: trap.left,
                width: trap.width,
                height: trap.height,
              }}
              onMouseEnter={() => {
                setZoneHover("rim", true);
                requestActivateZone(zone.id, zonesRef.current);
              }}
              onMouseLeave={() => leaveZoneHover("rim")}
            />
          );
        })}

        {zones.map(renderZoneChrome)}
      </div>

      <div className="shell-rim-menu-layer pointer-events-none absolute inset-0 z-[20]">
        {zones.map(renderZoneMenu)}
      </div>
    </>
  );
}
