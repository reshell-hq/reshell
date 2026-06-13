"use client";

import { useState } from "react";
import { buildControlCenterWorkspaceRows } from "@/control-center/workspaces";
import type { Library } from "@/library/types";
import { ControlCenterCalendarTab } from "./control-center-calendar-tab";
import { ControlCenterMediaTab } from "./control-center-media-tab";
import { ControlCenterPresetsTab } from "./control-center-presets-tab";
import { FocusRadioMediaSessionStrip } from "./focus-radio-media-session-strip";
import { useFocusRadioPlayback } from "./focus-radio-playback-context";

const TABS = [
  { id: "workspaces", label: "Workspaces" },
  { id: "presets", label: "Presets" },
  { id: "calendar", label: "Calendar" },
  { id: "media", label: "Media" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type ShellDashboardProps = {
  library: Library;
  onSwitchWorkspace: (workspaceId: string) => void;
};

function ControlCenterWorkspacesTab({
  library,
  onSwitchWorkspace,
}: {
  library: Library;
  onSwitchWorkspace: (workspaceId: string) => void;
}) {
  const rows = buildControlCenterWorkspaceRows(library);
  const active = rows.find((row) => row.active);

  return (
    <div className="shell-dashboard-workspaces">
      {active ? (
        <p className="shell-dashboard-workspaces-active">
          <span
            className="shell-dashboard-workspace-swatch"
            style={{ backgroundColor: active.accentColor }}
            aria-hidden
          />
          <span>{active.name}</span>
        </p>
      ) : null}

      <ul className="shell-dashboard-workspace-list">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              className={`shell-dashboard-workspace-row${row.active ? " active" : ""}`}
              onClick={() => onSwitchWorkspace(row.id)}
              aria-current={row.active ? "true" : undefined}
            >
              <span
                className="shell-dashboard-workspace-swatch"
                style={{ backgroundColor: row.accentColor }}
                aria-hidden
              />
              <span className="shell-dashboard-workspace-name">{row.name}</span>
              {row.active ? <span className="shell-dashboard-workspace-badge">Active</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ShellDashboard({ library, onSwitchWorkspace }: ShellDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("workspaces");
  const { externalGlance, dispatchExternalMediaKey } = useFocusRadioPlayback();

  return (
    <div className="shell-dashboard">
      {externalGlance ? (
        <FocusRadioMediaSessionStrip
          glance={externalGlance}
          onPrevious={() => dispatchExternalMediaKey("MediaTrackPrevious")}
          onPlayPause={() => dispatchExternalMediaKey("MediaPlayPause")}
          onNext={() => dispatchExternalMediaKey("MediaTrackNext")}
        />
      ) : null}
      <nav className="shell-dashboard-tabs" aria-label="Control center">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`shell-dashboard-tab${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="shell-dashboard-body">
        {activeTab === "workspaces" ? (
          <ControlCenterWorkspacesTab library={library} onSwitchWorkspace={onSwitchWorkspace} />
        ) : activeTab === "presets" ? (
          <ControlCenterPresetsTab library={library} />
        ) : activeTab === "calendar" ? (
          <ControlCenterCalendarTab library={library} active />
        ) : (
          <ControlCenterMediaTab library={library} />
        )}
      </div>
    </div>
  );
}
