"use client";

import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { SearchSlot } from "@/components/shell/search-slot";
import {
  NavigationSlot,
  NotificationsSlot,
  ProfileSlot,
  SettingsSlot,
} from "./demo-slots";

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

const COMMANDS = [
  "New project",
  "New document",
  "Invite teammate",
  "Open settings",
  "Toggle dark mode",
  "Search docs",
  "Go to dashboard",
  "Run deploy",
  "Sign out",
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
  const [command, setCommand] = useState("");

  const fruitResults = useMemo(
    () => FRUIT.filter((item) => fuzzyMatch(query, item)),
    [query],
  );
  const commandResults = useMemo(
    () => COMMANDS.filter((item) => fuzzyMatch(command, item)),
    [command],
  );

  return (
    <Shell>
      <Shell.Edge side="top">
        <Shell.Slot
          id="notifications"
          handle={<span aria-hidden>🔔</span>}
          handleLabel="Open notifications"
        >
          <NotificationsSlot />
        </Shell.Slot>
        <Shell.Slot
          id="profile"
          handle={<span aria-hidden>🙂</span>}
          handleLabel="Open profile"
        >
          <ProfileSlot />
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
        >
          <SettingsSlot />
        </Shell.Slot>
      </Shell.Edge>

      <Shell.Edge side="bottom">
        <Shell.Slot
          id="search"
          handle={<span aria-hidden>🔍</span>}
          handleLabel="Open search"
        >
          <SearchSlot
            query={query}
            onQueryChange={setQuery}
            results={fruitResults}
            placeholder="Search fruit…"
            label="Search fruit"
          />
        </Shell.Slot>
        <Shell.Slot
          id="command"
          handle={<span aria-hidden>⌘</span>}
          handleLabel="Open command palette"
        >
          <SearchSlot
            query={command}
            onQueryChange={setCommand}
            results={commandResults}
            placeholder="Run a command…"
            label="Command palette"
          />
        </Shell.Slot>
      </Shell.Edge>

      <Shell.Content>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">reshell</h1>
          <p className="max-w-md text-zinc-500">
            Hover the handles around the rim to open slots. Two handles share the
            bottom and top edges, so the notch slides between them; the search
            and command palettes grow as results load.
          </p>
        </main>
      </Shell.Content>
    </Shell>
  );
}
