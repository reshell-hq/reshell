"use client";

import { Shell } from "@/components/shell";
import {
  Canvas,
  CommandBarSlot,
  CommandCenterSlot,
  MusicSlot,
  TasksSlot,
  TimerSlot,
  WorkspaceEdges,
  YoutubePlayer,
} from "@/components/personal";
import { getScene } from "@/components/scenes";
import { ReshellProvider, useReshellState } from "@/hooks/use-reshell-state";
import reshellConfig from "@/reshell.config";

/**
 * Composition root only (ADR-0009): wires the config into the provider and
 * mounts the shell. All real state reads go through useReshellState.
 */
export default function Home() {
  return (
    <ReshellProvider config={reshellConfig}>
      <HomeStation />
    </ReshellProvider>
  );
}

function HomeStation() {
  const { activeWorkspace } = useReshellState();

  // The active scene owns the shell's look (ADR-0008): its `shellTheme` recolours
  // the rim/canvas/panel here, while <Canvas/> resolves the same scene to lay out
  // the widgets inside Shell.Content. Both read `activeWorkspace.scene`, so a
  // command-center scene switch recolours and re-lays-out in one move.
  const scene = getScene(activeWorkspace.scene);

  return (
    <Shell theme={scene.shellTheme}>
      {/* Hidden audio-only player, mounted ONCE at the shell root (a direct
          child of <Shell>, never inside the per-workspace WorkspaceEdges) so
          music keeps playing across workspace switches (plan 013). */}
      <YoutubePlayer />
      <CommandCenterSlot />
      <CommandBarSlot />
      <TimerSlot />
      <TasksSlot />
      <MusicSlot />
      <WorkspaceEdges />
      <Shell.Content>
        <Canvas />
      </Shell.Content>
    </Shell>
  );
}
