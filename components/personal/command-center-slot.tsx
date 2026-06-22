"use client";

import { useEffect } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useClock } from "@/hooks/use-clock";
import { useReshellState } from "@/hooks/use-reshell-state";
import { useTimer } from "@/hooks/use-timer";
import { formatModeLabel, formatTimerSeconds } from "@/lib/timer";
import {
  CANVAS_WIDGET_IDS,
  SCENE_NAMES,
  type CanvasWidgetId,
  type SceneName,
} from "@/lib/config";
import { nextWorkspaceId } from "@/lib/workspace";

// Distinct slot-id prefix from bookmark slots (`bm:${edge}:${index}`); the
// command center is the single top-edge fixture (CONTEXT: "Command center").
const SLOT_ID = "command-center";

const SCENE_LABELS: Record<SceneName, string> = {
  default: "Default",
  editorial: "Editorial",
  meridian: "Meridian",
  atelier: "Atelier",
};

const WIDGET_LABELS: Record<CanvasWidgetId, string> = {
  clock: "Clock",
  welcome: "Welcome",
  quote: "Quote",
  nowPlaying: "Now playing",
  pomodoro: "Timer",
  focusTasks: "Tasks",
};

/**
 * Top-edge command center: workspace switcher, ambient status, and runtime
 * scene/widget toggles. App-decoupled (ADR-0009) — every read/write goes
 * through the provider hook; writes are discrete override mutations, never on
 * the shell's animation path (ADR-0006).
 */
export function CommandCenterSlot() {
  // Wired here (mounted once), NOT inside the panel — the shell renders slot
  // children twice (offscreen measurer + portal), which would double-bind.
  useCycleShortcut();

  return (
    <Shell.Edge side="top">
      <Shell.Slot id={SLOT_ID} handleLabel="Command center" handle={<GridGlyph />}>
        <CommandCenterPanel />
      </Shell.Slot>
    </Shell.Edge>
  );
}

function CommandCenterPanel() {
  const {
    config,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspace,
    patchOverride,
    resetWorkspace,
  } = useReshellState();
  const clock = useClock(config.clock);
  const widgets = activeWorkspace.widgets;

  return (
    <div className="flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl">
      <header className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Command center
        </p>
        <time
          suppressHydrationWarning
          className="font-mono text-sm tabular-nums text-foreground"
        >
          {clock}
        </time>
      </header>

      <Section label="Workspace">
        <div className="flex flex-wrap gap-1.5">
          {config.workspaces.map((workspace) => {
            const active = workspace.id === activeWorkspaceId;
            return (
              <Button
                key={workspace.id}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => setActiveWorkspace(workspace.id)}
              >
                {workspace.name}
              </Button>
            );
          })}
        </div>
      </Section>

      <Section label="Scene">
        <div className="flex flex-wrap gap-1.5">
          {SCENE_NAMES.map((scene) => {
            const active = activeWorkspace.scene === scene;
            return (
              <Button
                key={scene}
                type="button"
                size="sm"
                variant={active ? "secondary" : "ghost"}
                aria-pressed={active}
                onClick={() => patchOverride(activeWorkspaceId, { scene })}
              >
                {SCENE_LABELS[scene]}
              </Button>
            );
          })}
        </div>
      </Section>

      <Section label="Widgets">
        <ul className="grid grid-cols-2 gap-x-5 gap-y-2">
          {CANVAS_WIDGET_IDS.map((id) => {
            const enabled = widgets[id] ?? false;
            const inputId = `cc-widget-${id}`;
            return (
              <li key={id} className="flex items-center justify-between gap-2">
                <label htmlFor={inputId} className="text-sm text-foreground">
                  {WIDGET_LABELS[id]}
                </label>
                <Switch
                  id={inputId}
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    patchOverride(activeWorkspaceId, {
                      widgets: { ...widgets, [id]: checked },
                    })
                  }
                />
              </li>
            );
          })}
        </ul>
      </Section>

      <footer className="flex items-center justify-between gap-3 border-t border-border pt-3">
        {/* ponytail: now-playing stays a static placeholder until plan 013
            wires the music tool; the timer row reads live state below. */}
        <dl className="flex flex-col gap-0.5 text-xs">
          <AmbientRow label="Now playing" value="Nothing playing" />
          <TimerAmbientRow />
        </dl>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => resetWorkspace(activeWorkspaceId)}
        >
          Reset to config
        </Button>
      </footer>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <p className="text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </section>
  );
}

function AmbientRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground/70">{value}</dd>
    </div>
  );
}

/** Live ambient timer status, read from the timer tool (plan 011). */
function TimerAmbientRow() {
  const { state, remaining } = useTimer();
  const value = state.running
    ? `${formatModeLabel(state)} · ${formatTimerSeconds(remaining)}`
    : "No timer running";
  return <AmbientRow label="Timer" value={value} />;
}

function GridGlyph() {
  return (
    <span aria-hidden className="grid grid-cols-2 gap-[3px]">
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="h-1 w-1 rounded-[1px] bg-current" />
      ))}
    </span>
  );
}

/**
 * Maps the cycle binding (`config.shortcuts.cycleWorkspace`, default `Tab`) to a
 * workspace switch when no editable element is focused; Shift reverses. A
 * discrete state change (ADR-0006), off the animation path.
 */
function useCycleShortcut() {
  const { config, activeWorkspaceId, setActiveWorkspace } = useReshellState();

  useEffect(() => {
    // ponytail: the only key bound outside the command bar besides Escape
    // (CONTEXT). Full key-routing / command surface is plan 010.
    const binding = config.shortcuts?.cycleWorkspace ?? "Tab";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== binding) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditable(event.target)) return;
      event.preventDefault();
      const direction = event.shiftKey ? "prev" : "next";
      setActiveWorkspace(nextWorkspaceId(config, activeWorkspaceId, direction));
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [config, activeWorkspaceId, setActiveWorkspace]);
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}
