"use client";

import type { ReactNode } from "react";

/**
 * Presentational demo panels for the shell slots. Each is intentionally
 * stateless and sizes itself to its natural content (a fixed width plus
 * whatever its rows need), so the offscreen measurer can drive the notch.
 */

function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-2  p-3 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 ${className}`}
    >
      {title ? (
        <p className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function Row({
  icon,
  label,
  hint,
}: {
  icon: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
      <span aria-hidden className="w-5 text-center text-base leading-none">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {hint ? <span className="text-xs text-zinc-400">{hint}</span> : null}
    </div>
  );
}

export function NavigationSlot() {
  return (
    <Panel title="Workspace" className="w-56">
      <nav className="flex flex-col">
        <Row icon="◫" label="Dashboard" />
        <Row icon="✦" label="Projects" hint="12" />
        <Row icon="☷" label="Tasks" hint="5" />
        <Row icon="◷" label="Activity" />
        <Row icon="❏" label="Documents" />
        <Row icon="⚑" label="Goals" />
      </nav>
    </Panel>
  );
}

export function NotificationsSlot() {
  return (
    <Panel title="Notifications" className="w-80">
      <ul className="flex flex-col gap-1.5 text-sm">
        <li className="rounded-md bg-zinc-100 px-2.5 py-2 dark:bg-zinc-800">
          <p className="font-medium">Deploy finished</p>
          <p className="text-xs text-zinc-500">main → production · 2m ago</p>
        </li>
        <li className="rounded-md bg-zinc-100 px-2.5 py-2 dark:bg-zinc-800">
          <p className="font-medium">Avery commented on “Shell rim”</p>
          <p className="text-xs text-zinc-500">
            “corners look great now” · 9m ago
          </p>
        </li>
        <li className="rounded-md bg-zinc-100 px-2.5 py-2 dark:bg-zinc-800">
          <p className="font-medium">Weekly report ready</p>
          <p className="text-xs text-zinc-500">1h ago</p>
        </li>
      </ul>
    </Panel>
  );
}

export function ProfileSlot() {
  return (
    <Panel className="w-60">
      <div className="flex items-center gap-3 px-1 pb-1">
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
        >
          JD
        </span>
        <div className="leading-tight">
          <p className="text-sm font-medium">Jordan Diaz</p>
          <p className="text-xs text-zinc-500">jordan@reshell.dev</p>
        </div>
      </div>
      <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col">
        <Row icon="☺" label="Profile" />
        <Row icon="✓" label="Billing" />
        <Row icon="⇲" label="Sign out" />
      </div>
    </Panel>
  );
}

function Toggle({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
      <span>{label}</span>
      <span
        aria-hidden
        className={`flex h-4 w-7 items-center rounded-full px-0.5 transition-colors ${
          on
            ? "justify-end bg-emerald-500"
            : "justify-start bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span className="h-3 w-3 rounded-full bg-white" />
      </span>
    </div>
  );
}

export function SettingsSlot() {
  return (
    <Panel title="Settings" className="w-64">
      <Toggle label="Dark mode" on />
      <Toggle label="Compact density" on={false} />
      <Toggle label="Show handles" on />
      <Toggle label="Reduce motion" on={false} />
    </Panel>
  );
}
