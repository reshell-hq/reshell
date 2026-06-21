"use client";

import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { SearchSlot } from "@/components/shell/search-slot";
import type { ShellHandleRenderProps } from "@/lib/shell/theme";
import { canvasBackgroundStyle, themeToShellInput } from "@/lib/theme/shell-theme";
import type { Theme } from "@/lib/theme/types";
import {
  NavigationSlot,
  NotificationsSlot,
  SettingsSlot,
} from "./demo-slots";

/**
 * A sample workspace theme, fed through the domain → shell adapter to exercise
 * the mapping (palette, shell border, canvas background) on the live shell.
 */
const DEMO_THEME: Theme = {
  palette: {
    background: "#1c1917",
    surface: "#292524",
    text: "#fafaf9",
    accent: "#f59e0b",
  },
  shellBorderColor: "#f59e0b",
  borderRadius: 20,
};

/**
 * Per-slot handle override: a headless component gets all interaction wiring as
 * props and renders only visuals (here, a squared chip instead of the default
 * round pill).
 */
function SquareHandle({
  slotId,
  label,
  active,
  style,
  children,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onClick,
}: ShellHandleRenderProps) {
  return (
    <button
      type="button"
      data-shell-slot={slotId}
      aria-label={label}
      aria-expanded={active}
      data-active={active ? "" : undefined}
      className="pointer-events-auto fixed z-[70] flex h-7 w-7 items-center justify-center rounded-md border border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 data-[active]:bg-indigo-600 data-[active]:text-white dark:border-indigo-400/40 dark:bg-indigo-500/15 dark:text-indigo-200"
      style={style}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const FRUIT = [
  "Apple",
  "Apricot",
  "Avocado",
  "Banana",
  "Blackberry",
  "Blueberry",
  "Cantaloupe",
  "Cherry",
  "Coconut",
  "Cranberry",
  "Dragonfruit",
  "Elderberry",
  "Fig",
  "Grape",
  "Grapefruit",
  "Guava",
  "Honeydew",
  "Kiwi",
  "Lemon",
  "Lime",
  "Mango",
  "Nectarine",
  "Orange",
  "Papaya",
  "Peach",
  "Pear",
  "Pineapple",
  "Plum",
  "Pomegranate",
  "Raspberry",
  "Strawberry",
  "Tangerine",
  "Watermelon",
];

function fuzzyMatch(query: string, value: string): boolean {
  const needle = query.toLowerCase().trim();
  if (needle === "") {
    return true;
  }

  const haystack = value.toLowerCase();
  let index = 0;
  for (const char of needle) {
    index = haystack.indexOf(char, index);
    if (index === -1) {
      return false;
    }
    index += 1;
  }

  return true;
}

export default function Home() {
  const [query, setQuery] = useState("");

  const fruitResults = useMemo(
    () => FRUIT.filter((item) => fuzzyMatch(query, item)),
    [query],
  );

  return (
    <Shell theme={themeToShellInput(DEMO_THEME)}>
      <Shell.Edge side="top">
        <Shell.Slot
          id="notifications"
          handle={<span aria-hidden>◔</span>}
          handleLabel="Open notifications"
        >
          <NotificationsSlot />
        </Shell.Slot>
      </Shell.Edge>

      <Shell.Edge side="left">
        <Shell.Slot
          id="navigation"
          handle={<span aria-hidden>☰</span>}
          handleLabel="Open navigation"
        >
          <NavigationSlot />
        </Shell.Slot>
      </Shell.Edge>

      <Shell.Edge side="right">
        <Shell.Slot
          id="settings"
          handle={<span aria-hidden>⚙</span>}
          handleLabel="Open settings"
          Handle={SquareHandle}
        >
          <SettingsSlot />
        </Shell.Slot>
      </Shell.Edge>

      <Shell.Edge side="bottom">
        <Shell.Slot id="search">
          <SearchSlot
            query={query}
            onQueryChange={setQuery}
            results={fruitResults}
            placeholder="Search fruit…"
            label="Search fruit"
          />
        </Shell.Slot>
      </Shell.Edge>

      <Shell.Content>
        <main
          className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
          style={{
            ...canvasBackgroundStyle(DEMO_THEME),
            color: DEMO_THEME.palette.text,
          }}
        >
          <h1 className="text-3xl font-semibold tracking-tight">reshell</h1>
          <p className="max-w-md opacity-70">
            Hover the handles around the rim to open slots. The top, left, and
            right edges carry handles (settings uses a custom square handle); the
            bottom search edge has none, so it minimises to a sliver until you
            hover the rim. The shell frame, border, and canvas are driven by a
            domain workspace theme via <code>themeToShellInput</code>.
          </p>
        </main>
      </Shell.Content>
    </Shell>
  );
}
