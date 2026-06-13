"use client";

import { useCallback, useEffect, useState } from "react";
import {
  countRemainingNextUpEvents,
  parseIcsEvents,
  selectNextUpEvents,
  type CalendarEvent,
} from "@/calendar/ics-events";
import { formatCalendarEventTime } from "@/calendar/format-event-time";
import { resolveCalendarIcsProxyUrl } from "@/calendar/ics-feed-url";
import { resolveWorkspaceIcsFeedUrl } from "@/calendar/workspace-ics";
import type { Library } from "@/library/types";
import { useConfigStore } from "@/store/config-store";

const REFRESH_MS = 15 * 60 * 1000;

type ControlCenterCalendarTabProps = {
  library: Library;
  active: boolean;
};

type CalendarState =
  | { status: "idle" }
  | { status: "loading"; events: CalendarEvent[] }
  | { status: "ready"; events: CalendarEvent[] }
  | { status: "error"; message: string; hint?: string; events: CalendarEvent[] };

export function ControlCenterCalendarTab({ library, active }: ControlCenterCalendarTabProps) {
  const openSection = useConfigStore((state) => state.openSection);
  const activeWorkspace = library.workspaces.find(
    (workspace) => workspace.id === library.activeWorkspaceId,
  );
  const feedUrl = activeWorkspace ? resolveWorkspaceIcsFeedUrl(activeWorkspace) : null;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [state, setState] = useState<CalendarState>({ status: "idle" });

  const loadFeed = useCallback(async () => {
    if (!feedUrl) {
      setState({ status: "idle" });
      return;
    }

    setState((current) => ({
      status: "loading",
      events: current.status === "ready" || current.status === "error" ? current.events : [],
    }));

    try {
      const response = await fetch(resolveCalendarIcsProxyUrl(feedUrl));
      if (!response.ok) {
        let message = `Calendar feed request failed (${response.status})`;
        let hint: string | undefined;

        try {
          const body = (await response.json()) as { error?: string; hint?: string };
          if (body.error) {
            message = body.error;
          }
          if (body.hint) {
            hint = body.hint;
          }
        } catch {
          // Keep the status-based fallback message.
        }

        setState((current) => ({
          status: "error",
          message,
          hint,
          events: current.status === "ready" || current.status === "error" ? current.events : [],
        }));
        return;
      }

      const text = await response.text();
      setState({ status: "ready", events: parseIcsEvents(text) });
    } catch (error) {
      setState((current) => ({
        status: "error",
        message: error instanceof Error ? error.message : "Calendar feed request failed",
        events: current.status === "ready" || current.status === "error" ? current.events : [],
      }));
    }
  }, [feedUrl]);

  useEffect(() => {
    if (!active || !feedUrl) {
      return;
    }

    void loadFeed();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadFeed();
      }
    }, REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [active, feedUrl, loadFeed]);

  if (!feedUrl) {
    return (
      <div className="shell-dashboard-calendar-empty">
        <p className="shell-dashboard-placeholder">
          Connect an ICS feed in settings to see upcoming events.
        </p>
        <button
          type="button"
          className="shell-dashboard-setup-button"
          onClick={() => openSection("workspaces")}
        >
          Open calendar settings
        </button>
      </div>
    );
  }

  const now = new Date();
  const events =
    state.status === "ready" || state.status === "loading" || state.status === "error"
      ? state.events
      : [];
  const visible = selectNextUpEvents(events, now);
  const overflow = countRemainingNextUpEvents(events, now);

  return (
    <div className="shell-dashboard-calendar">
      {state.status === "error" ? (
        <div className="shell-dashboard-calendar-error">
          <p>{state.message}</p>
          {state.hint ? <p className="shell-dashboard-calendar-error-hint">{state.hint}</p> : null}
          <button
            type="button"
            className="shell-dashboard-setup-button"
            onClick={() => void loadFeed()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {state.status === "loading" && visible.length === 0 ? (
        <p className="shell-dashboard-placeholder">Loading upcoming events…</p>
      ) : null}

      {visible.length === 0 && state.status === "ready" ? (
        <p className="shell-dashboard-placeholder">No upcoming events.</p>
      ) : null}

      <ul className="shell-dashboard-calendar-list">
        {visible.map((event) => {
          const expanded = expandedId === event.uid;

          return (
            <li key={event.uid} className="shell-dashboard-calendar-item">
              <div className="shell-dashboard-calendar-item-header">
                {event.url ? (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shell-dashboard-calendar-title"
                  >
                    {event.title}
                  </a>
                ) : (
                  <span className="shell-dashboard-calendar-title">{event.title}</span>
                )}
                <button
                  type="button"
                  className="shell-dashboard-calendar-expand"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : event.uid)}
                >
                  {expanded ? "Hide" : "Details"}
                </button>
              </div>
              <p className="shell-dashboard-calendar-time">{formatCalendarEventTime(event)}</p>
              {expanded ? (
                <div className="shell-dashboard-calendar-details">
                  {event.location ? <p>{event.location}</p> : null}
                  {event.description ? <p>{event.description}</p> : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {overflow > 0 ? <p className="shell-dashboard-calendar-overflow">+{overflow} more</p> : null}
    </div>
  );
}
